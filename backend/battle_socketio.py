"""
Battle Socket.IO Event Handlers
Manages real-time battle room events using python-socketio
Includes matchmaking and WebRTC signaling
"""
import socketio
import asyncio
from typing import Dict, Any, Optional
from battle_rooms import room_manager, Participant
from matchmaking import matchmaking_manager
from datetime import datetime, timezone
import random
import string

# Create Socket.IO server with async mode
# PRODUCTION SETTINGS: Optimized for mid-quiz connection stability
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True,
    # CRITICAL: More frequent checks with longer timeout window
    ping_interval=15,   # Send ping every 15 seconds (faster health checks)
    ping_timeout=120,   # Wait 120 seconds for pong response (2 minutes buffer)
    max_http_buffer_size=10000000,  # 10MB for large data
    allow_upgrades=True
)

# Activity tracking to prevent timeout on active players
user_activity = {}  # {sid: last_activity_timestamp}

# Database will be injected
db = None


def init_socketio_db(database):
    """Initialize database for Socket.IO and room manager"""
    global db
    db = database
    # Initialize room manager database
    import asyncio
    asyncio.create_task(room_manager.init_db(database))


@sio.event
async def connect(sid, environ):
    """Handle client connection with enhanced logging"""
    try:
        print(f"[CONNECT] ✅ Client connected: {sid}")
        # Track activity immediately
        user_activity[sid] = datetime.now(timezone.utc).timestamp()
        
        # Log connection details for debugging
        user_agent = environ.get('HTTP_USER_AGENT', 'Unknown')
        remote_addr = environ.get('REMOTE_ADDR', 'Unknown')
        print(f"[CONNECT] User-Agent: {user_agent}")
        print(f"[CONNECT] Remote Address: {remote_addr}")
        print(f"[CONNECT] Transport: {environ.get('HTTP_UPGRADE', 'polling')}")
        return True
    except Exception as e:
        print(f"[CONNECT] ❌ Connection error for {sid}: {e}")
        import traceback
        traceback.print_exc()
        return False


@sio.event
async def disconnect(sid):
    """Handle client disconnection with detailed logging.

    IMPORTANT: User will be removed from the room, ensuring host reassignment
    or room closure is handled automatically.
    """
    print(f"[DISCONNECT] ⚠️ Client disconnecting: {sid}")
    
    # Cleanup activity tracking
    user_activity.pop(sid, None)

    # Cleanup matchmaking (1v1 battles)
    matchmaking_manager.cleanup_player(sid)

    # Find battle room and notify opponent if in matched battle
    battle = matchmaking_manager.get_player_battle(sid)
    if battle:
        await sio.emit('opponent-disconnected', {}, room=battle.room_id, skip_sid=sid)

    # Find and handle user leaving the battle room
    room = await room_manager.get_user_room(sid)
    if room:
        print(f"[DISCONNECT] User {sid} was in room {room.room_id}. Handling leave.")
        await handle_user_leave(sid, room.room_id)


@sio.event
async def authenticate(sid, data):
    """Authenticate user and store data on session"""
    user_data = data.get('userData', {})
    print(f"[AUTH] User authenticated: {user_data.get('username')} ({sid})")
    
    # Track activity
    user_activity[sid] = datetime.now(timezone.utc).timestamp()

    # Store user data in session (Socket.IO will manage this)
    await sio.save_session(sid, {'userData': user_data})

    await sio.emit('authenticated', {'success': True}, room=sid)


@sio.event
async def create_room(sid, config):
    """Create a new battle room"""
    try:
        # Get user data from session
        session = await sio.get_session(sid)
        user_data = session.get('userData', {}) if session else {}

        # Create room
        host_data = {
            "userId": sid,
            "username": user_data.get('username', 'Host'),
            "avatar": user_data.get('avatar', '👑'),
            "isHost": True
        }

        room = await room_manager.create_room(host_data, config)

        # Join Socket.IO room
        await sio.enter_room(sid, room.room_id)

        print(f"[ROOM] Created: {room.room_id} by {user_data.get('username')}")

        # Notify creator
        await sio.emit('room_created', {
            'success': True,
            'roomId': room.room_id,
            'pin': room.room_id,
            'room': room.to_dict()
        }, room=sid)

        # Broadcast updated room list
        await sio.emit('room_list_updated', room_manager.get_active_rooms())

    except Exception as e:
        print(f"[ERROR] create_room: {str(e)}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def join_room(sid, data):
    """Join an existing battle room - NO HOST APPROVAL REQUIRED.
    
    Refactored flow:
    1. Anyone with valid PIN can join instantly
    2. Room must not be expired (24 hours from creation)
    3. Room must not be completed
    4. Room must have capacity
    """
    try:
        room_id = data.get('roomId')
        user_data = data.get('userData', {})

        print(f"[JOIN ATTEMPT] {user_data.get('username')} trying to join room {room_id}")

        room = await room_manager.get_room(room_id)

        if not room:
            print(f"[JOIN ERROR] Room {room_id} not found")
            await sio.emit('join_error', {
                'error': 'Room not found. Please check the PIN.',
                'code': 'ROOM_NOT_FOUND',
                'statusCode': 404
            }, room=sid)
            return

        # Check if expired (24 hour limit)
        if room.is_expired():
            print(f"[JOIN ERROR] Room {room_id} expired")
            await sio.emit('join_error', {
                'error': 'Room expired. Please create a new room.',
                'code': 'ROOM_EXPIRED',
                'statusCode': 410
            }, room=sid)
            return

        # Check if completed
        if room.status == 'completed':
            print(f"[JOIN ERROR] Room {room_id} already completed")
            await sio.emit('join_error', {
                'error': 'Battle already completed.',
                'code': 'BATTLE_COMPLETED',
                'statusCode': 410
            }, room=sid)
            return

        # Check if user is already a participant (allow reconnection)
        username = user_data.get('username', '')
        is_existing_participant = any(
            p.username == username for p in room.participants
        )

        # For NEW participants, check if room is accepting
        if not is_existing_participant and not room.is_joinable():
            # But allow joining active battles (not completed)
            if room.status != 'active':
                print(f"[JOIN ERROR] Room {room_id} not joinable for new participant")
                await sio.emit('join_error', {
                    'error': 'Room is not accepting participants.',
                    'code': 'ROOM_CLOSED',
                    'statusCode': 403
                }, room=sid)
                return

        # Track activity
        user_activity[sid] = datetime.now(timezone.utc).timestamp()
        
        # Store user data in session
        await sio.save_session(sid, {'userData': user_data})

        # Determine if this user is the host
        is_actual_host = False

        # Handle host reconnection
        if user_data.get('isHost') is True:
            for participant in room.participants:
                if participant.user_id.startswith('http-') and participant.is_host:
                    print(f"[HOST RECONNECT] Replacing HTTP host for {user_data.get('username')}")
                    room.participants = [p for p in room.participants if not p.user_id.startswith('http-')]
                    room.host.user_id = sid
                    room.host.username = user_data.get('username', room.host.username)
                    room.host.avatar = user_data.get('avatar', room.host.avatar)
                    is_actual_host = True
                    break

            if not is_actual_host and room.host.user_id == sid:
                is_actual_host = True
                print(f"[HOST] {user_data.get('username')} is the original room creator")

        # Set correct host status
        user_data['isHost'] = is_actual_host

        # Add participant - NO APPROVAL NEEDED (instant join/reconnect)
        result = room.add_participant(sid, user_data)

        if not result.get('success'):
            error_msg = result.get('error', 'Failed to join room')
            error_code = result.get('code', 'JOIN_FAILED')
            print(f"[JOIN ERROR] {error_msg} for room {room_id}")
            await sio.emit('join_error', {
                'error': error_msg,
                'code': error_code,
                'statusCode': 403
            }, room=sid)
            return

        # Join Socket.IO room
        await sio.enter_room(sid, room_id)
        room_manager.user_rooms[sid] = room_id

        # Save room state
        await room_manager.save_room_to_db(room)

        print(f"[JOIN SUCCESS] ✅ {user_data.get('username')} joined room {room_id} ({len(room.participants)} participants)")

        # Notify all participants
        await sio.emit('participant_joined', {
            'participant': {
                'userId': sid,
                'username': user_data.get('username'),
                'avatar': user_data.get('avatar'),
                'isHost': is_actual_host,
                'joinedAt': result.get('participant', {}).joined_at if hasattr(result.get('participant', {}), 'joined_at') else None
            },
            'room': room.to_dict()
        }, room=room_id)

        # Send room data to joiner
        print(f"[EMIT] Sending room_joined to {sid}")
        await sio.emit('room_joined', {
            'success': True,
            'room': room.to_dict(),
            'questions': room.questions,
            'isHost': is_actual_host,
            'hostInfo': {
                'userId': room.host.user_id,
                'username': room.host.username,
                'avatar': room.host.avatar
            },
            'timeRemaining': room.get_time_remaining()
        }, room=sid)
        print(f"[EMIT] ✅ room_joined sent to {sid}")

    except Exception as e:
        print(f"[ERROR] join_room: {str(e)}")
        import traceback
        traceback.print_exc()
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def set_room_questions(sid, data):
    """Set questions for a room (host only)"""
    try:
        room_id = data.get('roomId')
        questions = data.get('questions', [])

        room = await room_manager.get_room(room_id)

        if not room:
            await sio.emit('error', {'message': 'Room not found'}, room=sid)
            return

        if room.host.user_id != sid:
            await sio.emit('error', {'message': 'Only host can set questions'}, room=sid)
            return

        room.set_questions(questions)

        # Notify participants that questions are ready
        await sio.emit('questions_updated', {
            'questions': room.questions,
            'roomId': room.room_id
        }, room=room_id)

        print(f"[QUESTIONS] Set {len(questions)} questions for room {room_id}")

    except Exception as e:
        print(f"[ERROR] set_room_questions: {str(e)}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def submit_answer(sid, data):
    """Submit an answer"""
    try:
        # Track activity - CRITICAL for preventing timeout
        user_activity[sid] = datetime.now(timezone.utc).timestamp()
        
        room_id = data.get('roomId')
        question_id = data.get('questionId')
        answer_id = data.get('answerId')
        time_spent = data.get('timeSpent', 0)
        is_correct = data.get('isCorrect', False)
        points = data.get('points', 0)

        room = await room_manager.get_room(room_id)
        if not room:
            return

        # Record answer
        room.submit_answer(sid, question_id, answer_id, time_spent)

        # Update score if correct
        if is_correct:
            room.update_score(sid, points)

        # Notify others that this user answered (without revealing correctness)
        await sio.emit('participant_answered', {
            'userId': sid,
            'questionId': question_id
        }, room=room_id, skip_sid=sid)

        # Send feedback to submitter
        await sio.emit('answer_result', {
            'correct': is_correct,
            'points': points if is_correct else 0,
            'currentScore': room.scores.get(sid, 0)
        }, room=sid)

        # Broadcast updated leaderboard
        leaderboard = room.get_leaderboard()
        await sio.emit('leaderboard_update', {
            'leaderboard': leaderboard
        }, room=room_id)
        
        # Save room state in background (non-blocking)
        asyncio.create_task(room_manager.save_room_to_db(room))

        print(f"[ANSWER] User {sid} answered Q{question_id}: {'Correct' if is_correct else 'Wrong'}")

    except Exception as e:
        print(f"[ERROR] submit_answer: {str(e)}")


@sio.event
async def next_question(sid, data):
    """Move to next question (host only)"""
    try:
        room_id = data.get('roomId')
        room = await room_manager.get_room(room_id)

        if not room or room.host.user_id != sid:
            return

        room.current_question += 1

        await sio.emit('next_question', {
            'questionNumber': room.current_question,
            'leaderboard': room.get_leaderboard()
        }, room=room_id)

        print(f"[NEXT] Room {room_id} - Question {room.current_question}")

    except Exception as e:
        print(f"[ERROR] next_question: {str(e)}")


@sio.event
async def complete_battle(sid, data):
    """Complete the battle (host only)"""
    try:
        room_id = data.get('roomId')
        room = await room_manager.get_room(room_id)

        if not room or room.host.user_id != sid:
            return

        room.status = 'completed'

        final_results = {
            'leaderboard': room.get_leaderboard(),
            'totalQuestions': room.current_question,
            'participants': len(room.participants)
        }

        await sio.emit('battle_completed', final_results, room=room_id)

        print(f"[COMPLETE] Battle completed in room {room_id}")

        # Update live_battles for admin panel
        try:
            leaderboard = room.get_leaderboard()
            winner = leaderboard[0] if leaderboard else None
            await db.live_battles.update_one(
                {"room_id": room_id},
                {"$set": {
                    "status": "completed",
                    "ended_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "winner_id": winner.get("user_id") if winner else None,
                    "winner_name": winner.get("username") if winner else None,
                    "final_leaderboard": leaderboard
                }},
                upsert=True
            )
            await notify_admins_battle_ended(room_id, {"leaderboard": leaderboard})
        except Exception as e:
            print(f"[COMPLETE] Failed to update live_battles: {e}")
        
        # Save battle history for all participants (for stats tracking)
        try:
            leaderboard = room.get_leaderboard()
            for idx, participant in enumerate(leaderboard, 1):
                user_id = participant.get('user_id') or participant.get('userId')
                if user_id:
                    await db.user_battle_history.insert_one({
                        "user_id": user_id,
                        "user_name": participant.get('username', participant.get('playerName', 'Unknown')),
                        "battle_type": "room",
                        "room_id": room_id,
                        "score": participant.get('score', 0),
                        "total_questions": room.current_question,
                        "rank": idx,
                        "total_participants": len(room.participants),
                        "exam": room.exam or "",
                        "subject": room.subject or "",
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    })
        except Exception as e:
            print(f"[COMPLETE] Failed to save battle history: {str(e)}")
        
        # Auto-post battle results to social feed for all participants
        try:
            from social_auto_post import auto_post_battle_result
            leaderboard = room.get_leaderboard()
            
            for idx, participant in enumerate(leaderboard[:5], 1):  # Top 5 only
                user_id = participant.get('user_id') or participant.get('userId')
                if user_id:
                    battle_data = {
                        "room_code": room_id,
                        "score": participant.get('score', 0),
                        "rank": idx,
                        "total_participants": len(room.participants),
                        "subject": room.subject or "",
                        "exam_category": room.exam or "",
                        "questions_answered": participant.get('score', 0),
                        "total_questions": room.current_question
                    }
                    await auto_post_battle_result(user_id, battle_data)
        except Exception as e:
            print(f"[COMPLETE] Failed to auto-post battle results: {str(e)}")

        # Schedule cleanup after 5 minutes
        async def cleanup():
            await asyncio.sleep(5 * 60)
            await room_manager.remove_room(room_id)
            print(f"[CLEANUP] Room {room_id} deleted")

        asyncio.create_task(cleanup())

    except Exception as e:
        print(f"[ERROR] complete_battle: {str(e)}")


# ==================== START BATTLE EVENT ====================

@sio.event
async def start_battle(sid, data):
    """Start the battle/quiz - ANY PLAYER CAN START (no host requirement).
    
    Refactored: Removed host-only restriction. Any player in the room
    with valid questions can start the quiz.
    """
    try:
        room_id = data.get('roomId')
        room = await room_manager.get_room(room_id)

        if not room:
            await sio.emit('start_error', {
                'error': 'Room not found',
                'code': 'ROOM_NOT_FOUND'
            }, room=sid)
            return

        # Check if room is expired
        if room.is_expired():
            await sio.emit('start_error', {
                'error': 'Room expired. Please create a new room.',
                'code': 'ROOM_EXPIRED'
            }, room=sid)
            return

        # Check if already started or completed
        if room.status in ['active', 'completed']:
            status_msg = 'Battle already in progress' if room.status == 'active' else 'Battle already completed'
            await sio.emit('start_error', {
                'error': status_msg,
                'code': 'ALREADY_STARTED' if room.status == 'active' else 'ALREADY_COMPLETED'
            }, room=sid)
            return

        # Check if questions are set
        if not room.questions or len(room.questions) == 0:
            await sio.emit('start_error', {
                'error': 'No questions set for this room. Please add questions first.',
                'code': 'NO_QUESTIONS'
            }, room=sid)
            return

        # Start the room - NO HOST CHECK REQUIRED
        room.status = 'active'
        room.current_question = 0
        room.deactivate()  # Prevent new joins once started
        
        await room_manager.save_room_to_db(room)

        # Get the username of who started
        starter_name = 'Unknown'
        for p in room.participants:
            if p.user_id == sid:
                starter_name = p.username
                break

        print(f"[START] Battle started in room {room_id} by {starter_name}")

        # Persist to live_battles for admin panel
        try:
            players_data = [{"user_id": p.user_id, "username": p.username, "score": p.score} for p in room.participants]
            battle_doc = {
                "id": room_id,
                "room_id": room_id,
                "type": "room",
                "status": "in_progress",
                "players": players_data,
                "exam": room.exam or "",
                "subject": room.subject or "",
                "total_questions": len(room.questions),
                "started_at": datetime.now(timezone.utc).isoformat(),
                "ended_at": None,
                "is_demo": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.live_battles.update_one(
                {"room_id": room_id},
                {"$set": battle_doc},
                upsert=True
            )
            await notify_admins_battle_started(room_id, battle_doc)
        except Exception as e:
            print(f"[START] Failed to persist battle: {e}")

        # Notify all participants
        await sio.emit('battle_started', {
            'room': room.to_dict(),
            'questions': room.questions,
            'startedBy': starter_name,
            'message': f'{starter_name} started the quiz!'
        }, room=room_id)

    except Exception as e:
        print(f"[ERROR] start_battle: {str(e)}")
        import traceback
        traceback.print_exc()
        await sio.emit('start_error', {
            'error': str(e),
            'code': 'START_FAILED'
        }, room=sid)


# ==================== HOST CONTROL EVENTS ====================

@sio.event
async def pause_quiz(sid, data):
    """Pause the quiz (host only).

    Frontend emits: socket.emit('pause-quiz', { pin })
    Socket.IO converts hyphen event name to this function name.
    """
    try:
        room_id = data.get('pin') or data.get('roomId')
        room = await room_manager.get_room(room_id)
        if not room:
            return
        if room.host.user_id != sid:
            print(f"[PAUSE] Non-host {sid} attempted to pause room {room_id}")
            return

        # Mark status as paused (frontend uses isPaused flag locally; we keep status for future use)
        room.status = 'paused'
        await sio.emit('quiz-paused', {'roomId': room_id}, room=room_id)
        print(f"[PAUSE] Room {room_id} paused by host {sid}")
        await room_manager.save_room_to_db(room) # Persist state
    except Exception as e:
        print(f"[ERROR] pause_quiz: {str(e)}")


@sio.event
async def resume_quiz(sid, data):
    """Resume the quiz (host only).

    Frontend emits: socket.emit('resume-quiz', { pin })
    """
    try:
        room_id = data.get('pin') or data.get('roomId')
        room = await room_manager.get_room(room_id)
        if not room:
            return
        if room.host.user_id != sid:
            print(f"[RESUME] Non-host {sid} attempted to resume room {room_id}")
            return

        room.status = 'active'
        await sio.emit('quiz-resumed', {'roomId': room_id}, room=room_id)
        print(f"[RESUME] Room {room_id} resumed by host {sid}")
        await room_manager.save_room_to_db(room) # Persist state
    except Exception as e:
        print(f"[ERROR] resume_quiz: {str(e)}")


@sio.event
async def skip_question(sid, data):
    """Skip to next question (host only).

    Frontend emits: socket.emit('skip-question', { pin })
    We implement as a thin wrapper around next_question.
    """
    try:
        room_id = data.get('pin') or data.get('roomId')
        room = await room_manager.get_room(room_id)
        if not room:
            return
        if room.host.user_id != sid:
            print(f"[SKIP] Non-host {sid} attempted to skip question in room {room_id}")
            return

        # Advance question index and broadcast via existing next_question event payload
        room.current_question += 1
        await sio.emit('next_question', {
            'questionNumber': room.current_question,
            'leaderboard': room.get_leaderboard()
        }, room=room_id)
        print(f"[SKIP] Host {sid} skipped to question {room.current_question} in room {room_id}")
        await room_manager.save_room_to_db(room) # Persist state

    except Exception as e:
        print(f"[ERROR] skip_question: {str(e)}")


# ==================== SOCIAL FEATURES (CHAT, REACTIONS, GIFTS) ====================

@sio.event
async def send_message(sid, data):
    """Send chat message"""
    try:
        # Track activity
        user_activity[sid] = datetime.now(timezone.utc).timestamp()
        
        room_id = data.get('roomId') or data.get('pin')
        message = data.get('message')

        room = await room_manager.get_room(room_id)
        if not room:
            return

        # Get user data
        session = await sio.get_session(sid)
        user_data = session.get('userData', {}) if session else {}

        chat_message = {
            'userId': sid,
            'username': user_data.get('username', 'Anonymous'),
            'message': message,
            'timestamp': datetime.now(timezone.utc).timestamp()
        }

        await sio.emit('new_message', chat_message, room=room_id)

    except Exception as e:
        print(f"[ERROR] send_message: {str(e)}")


@sio.event
async def send_reaction(sid, data):
    """Send reaction/emoji"""
    try:
        # Track activity
        user_activity[sid] = datetime.now(timezone.utc).timestamp()
        
        room_id = data.get('roomId') or data.get('pin')
        # Frontend sends { roomId, emoji, sender }; keep both keys for robustness
        reaction = data.get('reaction') or data.get('emoji')

        room = await room_manager.get_room(room_id)
        if not room:
            return

        # Get user data
        session = await sio.get_session(sid)
        user_data = session.get('userData', {}) if session else {}

        await sio.emit('new_reaction', {
            'userId': sid,
            'username': user_data.get('username', 'Anonymous'),
            'reaction': reaction,
            'timestamp': datetime.now(timezone.utc).timestamp()
        }, room=room_id)

    except Exception as e:
        print(f"[ERROR] send_reaction: {str(e)}")


@sio.event
async def send_gift(sid, data):
    """Handle virtual gift sending between players.

    Frontend emits: socket.emit('send-gift', { pin, recipientId, giftType })

    Rules (from test_result.md):
    - 4 gift types: Star, Diamond, Crown, Trophy
    - Sender pays full cost, recipient gets 50% of cost as points
    - Leaderboard updates in real-time
    - Events emitted:
      - 'gift-sent' to sender
      - 'gift-received' to recipient
      - 'gift-error' to sender on error
    """
    try:
        room_id = data.get('pin') or data.get('roomId')
        recipient_id = data.get('recipientId')
        gift_type = (data.get('giftType') or '').lower()

        room = await room_manager.get_room(room_id)
        if not room:
            await sio.emit('gift-error', {'message': 'Room not found'}, room=sid)
            return

        if not recipient_id or recipient_id == sid:
            await sio.emit('gift-error', {'message': 'Invalid recipient'}, room=sid)
            return

        # Define gift costs
        gift_costs = {
            'star': 50,
            'diamond': 100,
            'crown': 200,
            'trophy': 500
        }

        if gift_type not in gift_costs:
            await sio.emit('gift-error', {'message': 'Invalid gift type'}, room=sid)
            return

        cost = gift_costs[gift_type]

        # Ensure both players have score entries
        room.scores.setdefault(sid, 0)
        room.scores.setdefault(recipient_id, 0)

        # Check sender has enough points
        sender_score = room.scores.get(sid, 0)
        if sender_score < cost:
            await sio.emit('gift-error', {'message': 'Not enough points to send this gift'}, room=sid)
            return

        # Apply transfer: sender pays full cost, recipient gets 50%
        room.update_score(sid, -cost)
        recipient_reward = int(cost * 0.5)
        room.update_score(recipient_id, recipient_reward)

        # Recompute leaderboard
        leaderboard = room.get_leaderboard()

        # Get usernames for nicer messages
        sender_name = next((p.username for p in room.participants if p.user_id == sid), 'You')
        recipient_name = next((p.username for p in room.participants if p.user_id == recipient_id), 'Player')

        # Notify sender
        await sio.emit('gift-sent', {
            'roomId': room_id,
            'fromUserId': sid,
            'toUserId': recipient_id,
            'fromUsername': sender_name,
            'toUsername': recipient_name,
            'giftType': gift_type,
            'cost': cost,
            'recipientReward': recipient_reward,
            'leaderboard': leaderboard
        }, room=sid)

        # Notify recipient
        await sio.emit('gift-received', {
            'roomId': room_id,
            'fromUserId': sid,
            'toUserId': recipient_id,
            'fromUsername': sender_name,
            'toUsername': recipient_name,
            'giftType': gift_type,
            'cost': cost,
            'recipientReward': recipient_reward,
            'leaderboard': leaderboard
        }, room=recipient_id)

        # Broadcast updated leaderboard to entire room
        await sio.emit('leaderboard_update', {'leaderboard': leaderboard}, room=room_id)
        await room_manager.save_room_to_db(room) # Persist state

        print(f"[GIFT] {sender_name} ({sid}) sent {gift_type} to {recipient_name} ({recipient_id}) in room {room_id}")

    except Exception as e:
        print(f"[ERROR] send_gift: {str(e)}")
        await sio.emit('gift-error', {'message': 'Failed to send gift'}, room=sid)


@sio.event
async def heartbeat(sid, data=None):
    """Handle heartbeat/keep-alive signal from client.
    
    This prevents timeout disconnections during quiz play.
    Frontend sends this every 10 seconds to keep connection alive.
    """
    try:
        # Update activity timestamp
        user_activity[sid] = datetime.now(timezone.utc).timestamp()
        
        # Optional: Send acknowledgment back
        await sio.emit('heartbeat_ack', {'timestamp': datetime.now(timezone.utc).timestamp()}, room=sid)
        
    except Exception as e:
        print(f"[ERROR] heartbeat: {str(e)}")


@sio.event
async def leave_room(sid, data):
    """Leave a room"""
    room_id = data.get('roomId') or data.get('pin')
    await handle_user_leave(sid, room_id)


# ==================== MATCHMAKING EVENTS ====================

@sio.on('find-match')
async def find_match(sid, data):
    """Find a match for quiz battle — optimized with bucket queues"""
    print(f"[MATCHMAKING] find-match from {sid}")
    try:
        player_name = data.get('playerName', 'Player')
        exam = data.get('exam', '')
        subject = data.get('subject', '')
        # topic is available but not used for matching (we match on exam level)
        _ = data.get('topic', '')

        # O(1) match lookup via bucket queue
        opponent = matchmaking_manager.add_to_queue(sid, player_name, exam, subject)

        if opponent:
            # Instant match — create room immediately
            room_id = f"room_{int(datetime.now(timezone.utc).timestamp())}_{generate_random_id()}"

            player1_data = {'socketId': sid, 'playerName': player_name, 'score': 0}
            player2_data = {'socketId': opponent.socket_id, 'playerName': opponent.player_name, 'score': 0}

            matchmaking_manager.create_battle(room_id, player1_data, player2_data, exam, subject)

            await sio.enter_room(sid, room_id)
            await sio.enter_room(opponent.socket_id, room_id)

            await sio.emit('match-found', {
                'roomId': room_id,
                'players': [
                    {'playerName': player_name},
                    {'playerName': opponent.player_name}
                ],
                'exam': exam,
                'subject': subject
            }, room=room_id)

            print(f"[MATCHMAKING] Instant match: Room {room_id}")

            # Persist to live_battles collection for admin panel
            battle_doc = {
                "id": room_id,
                "room_id": room_id,
                "type": "1v1",
                "status": "in_progress",
                "players": [
                    {"user_id": sid, "username": player_name, "score": 0},
                    {"user_id": opponent.socket_id, "username": opponent.player_name, "score": 0}
                ],
                "exam": exam,
                "subject": subject,
                "total_questions": 10,
                "duration_seconds": 0,
                "started_at": datetime.now(timezone.utc).isoformat(),
                "ended_at": None,
                "winner_id": None,
                "is_demo": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            try:
                await db.live_battles.insert_one(battle_doc.copy())
                await notify_admins_battle_started(room_id, battle_doc)
            except Exception as e:
                print(f"[MATCHMAKING] Failed to persist battle: {e}")
        else:
            # Send queue info so frontend can show position
            queue_size = matchmaking_manager.get_queue_size(exam, subject)
            await sio.emit('waiting', {
                'message': 'Looking for opponent...',
                'queueSize': queue_size,
                'timeout': 30
            }, room=sid)

    except Exception as e:
        print(f"[ERROR] find_match: {str(e)}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.on('cancel-match')
async def cancel_match(sid, data=None):
    """Cancel matchmaking"""
    try:
        removed = matchmaking_manager.remove_from_queue(sid)
        if removed:
            print(f"[MATCHMAKING] Player {sid} cancelled matchmaking")
            await sio.emit('match-cancelled', {'success': True}, room=sid)
    except Exception as e:
        print(f"[ERROR] cancel_match: {str(e)}")


@sio.on('battle-answer')
async def battle_answer(sid, data):
    """Submit answer in matched battle"""
    try:
        room_id = data.get('roomId')
        question_id = data.get('questionId')
        answer = data.get('answer')
        time_taken = data.get('timeTaken', 0)

        battle = matchmaking_manager.get_battle(room_id)
        if not battle:
            return

        # Update player's last answer
        if battle.player1['socketId'] == sid:
            battle.player1['lastAnswer'] = {
                'questionId': question_id,
                'answer': answer,
                'timeTaken': time_taken
            }
            player_name = battle.player1['playerName']
        elif battle.player2['socketId'] == sid:
            battle.player2['lastAnswer'] = {
                'questionId': question_id,
                'answer': answer,
                'timeTaken': time_taken
            }
            player_name = battle.player2['playerName']
        else:
            return

        # Notify opponent
        await sio.emit('opponent-answered', {
            'playerName': player_name
        }, room=room_id, skip_sid=sid)

    except Exception as e:
        print(f"[ERROR] battle_answer: {str(e)}")


@sio.on('battle-chat')
async def battle_chat(sid, data):
    """Handle chat messages in 1v1 battles"""
    try:
        room_id = data.get('roomId')
        player_name = data.get('playerName', 'Player')
        message = data.get('message', '')
        
        if not room_id or not message:
            return
            
        # Broadcast message to opponent in the room
        await sio.emit('chat-message', {
            'playerName': player_name,
            'message': message,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }, room=room_id, skip_sid=sid)
        
        print(f"[BATTLE_CHAT] {player_name} in {room_id}: {message[:50]}...")
        
    except Exception as e:
        print(f"[ERROR] battle_chat: {str(e)}")


@sio.on('battle-complete')
async def battle_complete(sid, data):
    """Handle battle completion for 1v1 matchmaking"""
    try:
        room_id = data.get('roomId')
        player_name = data.get('playerName', 'Player')
        final_score = data.get('finalScore', 0)
        user_id = data.get('userId')
        total_questions = data.get('totalQuestions', 10)
        exam = data.get('exam', '')
        subject = data.get('subject', '')
        
        battle = matchmaking_manager.get_battle(room_id)
        if not battle:
            return
            
        # Update final score
        if battle.player1['socketId'] == sid:
            battle.player1['finalScore'] = final_score
            user_id = user_id or battle.player1.get('userId')
        elif battle.player2['socketId'] == sid:
            battle.player2['finalScore'] = final_score
            user_id = user_id or battle.player2.get('userId')
        
        # Save to user_battle_history for stats tracking
        if user_id:
            try:
                # Fetch user name
                user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
                u_name = user_doc.get("name", player_name) if user_doc else player_name
                
                await db.user_battle_history.insert_one({
                    "user_id": user_id,
                    "user_name": u_name,
                    "battle_type": "1v1",
                    "room_id": room_id,
                    "score": final_score,
                    "total_questions": total_questions or 10,
                    "exam": exam or battle.exam or "",
                    "subject": subject or battle.subject or "",
                    "opponent_name": battle.player2['playerName'] if battle.player1['socketId'] == sid else battle.player1['playerName'],
                    "completed_at": datetime.now(timezone.utc).isoformat()
                })
                print(f"[BATTLE_COMPLETE] Saved history for {user_id}")
            except Exception as e:
                print(f"[BATTLE_COMPLETE] Failed to save history: {str(e)}")
            
        # Notify opponent
        await sio.emit('opponent-score-update', {
            'playerName': player_name,
            'score': final_score
        }, room=room_id, skip_sid=sid)
        
        print(f"[BATTLE_COMPLETE] {player_name} finished with {final_score} pts in {room_id}")

        # Update live_battles in DB for admin panel
        try:
            await db.live_battles.update_one(
                {"room_id": room_id},
                {"$set": {
                    "status": "completed",
                    "ended_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                },
                "$push": {
                    "player_sessions": {
                        "user_id": user_id,
                        "username": player_name,
                        "final_score": final_score,
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }
                }}
            )
            await notify_admins_battle_ended(room_id, {
                "player_name": player_name,
                "final_score": final_score
            })
        except Exception as e:
            print(f"[BATTLE_COMPLETE] Failed to update live_battles: {e}")
        
    except Exception as e:
        print(f"[ERROR] battle_complete: {str(e)}")


# ==================== WEBRTC SIGNALING EVENTS ====================

@sio.event
async def join_video_room(sid, data):
    """Explicitly join a video room for WebRTC signaling"""
    try:
        room_id = data.get('roomId')
        if room_id:
            await sio.enter_room(sid, room_id)
            print(f"[WEBRTC] 🚪 {sid} joined video room: {room_id}")
            
            # Get list of participants in the room
            rooms = sio.rooms(sid)
            print(f"[WEBRTC] 📋 {sid} is now in rooms: {rooms}")
    except Exception as e:
        print(f"[ERROR] join_video_room: {str(e)}")


@sio.event
async def webrtc_offer(sid, data):
    """WebRTC offer signaling"""
    try:
        room_id = data.get('roomId')
        offer = data.get('offer')
        
        print(f"[WEBRTC] 📹 Offer received from {sid} for room {room_id}")
        
        # Check which rooms this sender is in
        sender_rooms = sio.rooms(sid)
        print(f"[WEBRTC] 📋 Sender {sid} is in rooms: {sender_rooms}")
        
        # Check if room_id is in sender's rooms
        if room_id not in sender_rooms:
            print(f"[WEBRTC] ⚠️ Warning: Sender not in room {room_id}, joining now...")
            await sio.enter_room(sid, room_id)

        # Forward to other users in room
        await sio.emit('webrtc-offer', {
            'offer': offer,
            'from': sid
        }, room=room_id, skip_sid=sid)
        
        print(f"[WEBRTC] ✅ Offer forwarded to room {room_id}")

    except Exception as e:
        print(f"[ERROR] webrtc_offer: {str(e)}")
        import traceback
        traceback.print_exc()


@sio.event
async def webrtc_answer(sid, data):
    """WebRTC answer signaling"""
    try:
        room_id = data.get('roomId')
        answer = data.get('answer')
        
        print(f"[WEBRTC] 📹 Answer received from {sid} for room {room_id}")
        
        # Check which rooms this sender is in
        sender_rooms = sio.rooms(sid)
        print(f"[WEBRTC] 📋 Sender {sid} is in rooms: {sender_rooms}")
        
        # Ensure sender is in room
        if room_id not in sender_rooms:
            print(f"[WEBRTC] ⚠️ Warning: Sender not in room {room_id}, joining now...")
            await sio.enter_room(sid, room_id)

        # Forward to other users in room
        await sio.emit('webrtc-answer', {
            'answer': answer,
            'from': sid
        }, room=room_id, skip_sid=sid)
        
        print(f"[WEBRTC] ✅ Answer forwarded to room {room_id}")

    except Exception as e:
        print(f"[ERROR] webrtc_answer: {str(e)}")
        import traceback
        traceback.print_exc()


@sio.event
async def webrtc_ice_candidate(sid, data):
    """WebRTC ICE candidate signaling"""
    try:
        room_id = data.get('roomId')
        candidate = data.get('candidate')
        
        print(f"[WEBRTC] 🧊 ICE candidate from {sid} for room {room_id}")

        # Forward to other users in room
        await sio.emit('webrtc-ice-candidate', {
            'candidate': candidate,
            'from': sid
        }, room=room_id, skip_sid=sid)

    except Exception as e:
        print(f"[ERROR] webrtc_ice_candidate: {str(e)}")


def generate_random_id(length: int = 9) -> str:
    """Generate random alphanumeric ID"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


async def handle_user_leave(sid, room_id):
    """Handle user leaving a room with host reassignment"""
    try:
        room = await room_manager.get_room(room_id)
        if not room:
            return

        is_host_leaving = room.host.user_id == sid
        
        removed = room.remove_participant(sid)
        room_manager.user_rooms.pop(sid, None)
        await sio.leave_room(sid, room_id)
        
        if not removed:
            return

        print(f"[LEAVE] User {sid} left room {room_id}")

        # If host left, assign new host or close room
        if is_host_leaving:
            if len(room.participants) > 0:
                # Assign first remaining participant as new host
                new_host = room.participants[0]
                room.host = new_host
                room.host.is_host = True
                
                await sio.emit('host_changed', {
                    'newHost': {
                        'userId': room.host.user_id,
                        'username': room.host.username,
                        'avatar': room.host.avatar,
                        'isHost': True
                    }
                }, room=room_id)
                print(f"[HOST] New host assigned in {room_id}: {room.host.username}")
                await room_manager.save_room_to_db(room)
            else:
                # No participants left, close room
                await room_manager.remove_room(room_id)
                print(f"[CLOSE] Room {room_id} closed - no participants")
                return
        else:
            # Save room state if a non-host leaves
            await room_manager.save_room_to_db(room)

        # Notify remaining participants
        await sio.emit('participant_left', {
            'userId': sid,
            'room': room.to_dict()
        }, room=room_id)

        # Update room list
        await sio.emit('room_list_updated', room_manager.get_active_rooms())

    except Exception as e:
        print(f"[ERROR] handle_user_leave: {str(e)}")


# Create ASGI application
# Empty socketio_path because the path is defined in the mount point (/api/battlews)
socket_app = socketio.ASGIApp(sio, socketio_path='')


# ── Background: sweep timed-out players every 5s ──
_sweep_started = False

async def _matchmaking_timeout_sweep():
    """Notify players who waited too long and remove them from queue."""
    while True:
        try:
            timed_out = matchmaking_manager.get_timed_out_players()
            for player in timed_out:
                await sio.emit('match-timeout', {
                    'message': 'No opponent found. Please try again.',
                    'playerName': player.player_name
                }, room=player.socket_id)
                print(f"[MATCHMAKING] Timeout: {player.player_name} ({player.socket_id})")
        except Exception as e:
            print(f"[ERROR] timeout_sweep: {e}")
        await asyncio.sleep(5)


def start_matchmaking_sweep():
    """Call once from server startup to begin the background sweep."""
    global _sweep_started
    if not _sweep_started:
        _sweep_started = True
        asyncio.create_task(_matchmaking_timeout_sweep())
        print("[MATCHMAKING] Timeout sweep task started")



# ==================== ADMIN REAL-TIME EVENTS ====================

# Admin room for real-time battle updates
ADMIN_ROOM = "admin_battle_monitor"

@sio.event
async def admin_join_monitor(sid, data):
    """
    Admin joins the battle monitoring room for real-time updates.
    Requires super admin verification.
    """
    try:
        token = data.get('token')
        if not token:
            await sio.emit('admin_error', {'error': 'Authentication required'}, room=sid)
            return
        
        # Verify super admin
        from jose import jwt
        import os
        JWT_SECRET = os.getenv("JWT_SECRET", "ceibaa-super-secret-key")
        JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
        
        user_id = None
        
        # Try session first
        session = await db.user_sessions.find_one({"session_token": token})
        if session:
            user_id = session.get("user_id")
        
        if not user_id:
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                user_id = payload.get("sub")
            except Exception:
                pass
        
        if not user_id:
            await sio.emit('admin_error', {'error': 'Invalid token'}, room=sid)
            return
        
        # Check super admin status
        user = await db.users.find_one({
            "$or": [{"id": user_id}, {"user_id": user_id}]
        })
        
        if not user or (not user.get("is_super_admin") and user.get("role") != "super_admin"):
            await sio.emit('admin_error', {'error': 'Super Admin access required'}, room=sid)
            return
        
        # Join admin monitoring room
        await sio.enter_room(sid, ADMIN_ROOM)
        print(f"[ADMIN] Super Admin {user.get('name', user_id)} joined battle monitor")
        
        await sio.emit('admin_joined', {
            'success': True,
            'message': 'Connected to battle monitor'
        }, room=sid)
        
    except Exception as e:
        print(f"[ERROR] admin_join_monitor: {e}")
        await sio.emit('admin_error', {'error': str(e)}, room=sid)


@sio.event
async def admin_leave_monitor(sid, data=None):
    """Admin leaves the battle monitoring room."""
    await sio.leave_room(sid, ADMIN_ROOM)
    print(f"[ADMIN] Admin {sid} left battle monitor")


async def notify_admins_battle_started(room_id: str, battle_data: dict):
    """Notify admins when a new battle starts."""
    try:
        await sio.emit('admin_battle_started', {
            'room_id': room_id,
            'battle': battle_data,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }, room=ADMIN_ROOM)
    except Exception as e:
        print(f"[ERROR] notify_admins_battle_started: {e}")


async def notify_admins_battle_ended(room_id: str, result_data: dict):
    """Notify admins when a battle ends."""
    try:
        await sio.emit('admin_battle_ended', {
            'room_id': room_id,
            'result': result_data,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }, room=ADMIN_ROOM)
    except Exception as e:
        print(f"[ERROR] notify_admins_battle_ended: {e}")


async def notify_admins_new_report(report_data: dict):
    """Notify admins of a new battle report."""
    try:
        await sio.emit('admin_new_report', {
            'report': report_data,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }, room=ADMIN_ROOM)
    except Exception as e:
        print(f"[ERROR] notify_admins_new_report: {e}")


# Export notification functions for use in routes
__all__ = ['sio', 'socket_app', 'start_matchmaking_sweep', 'init_socketio_db',
           'notify_admins_battle_started', 'notify_admins_battle_ended', 'notify_admins_new_report']
