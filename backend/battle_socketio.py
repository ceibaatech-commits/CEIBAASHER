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
# PRODUCTION SETTINGS: Increased ping intervals for connection stability
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True,
    # CRITICAL: Increase ping intervals to prevent premature disconnections
    ping_interval=25,  # Send ping every 25 seconds (default: 5s)
    ping_timeout=60,   # Wait 60 seconds for pong response (default: 20s)
    max_http_buffer_size=10000000,  # 10MB for large data
    allow_upgrades=True
)

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
    """Join an existing battle room"""
    try:
        room_id = data.get('roomId')
        user_data = data.get('userData', {})

        print(f"[JOIN ATTEMPT] {user_data.get('username')} trying to join room {room_id}")

        room = await room_manager.get_room(room_id)

        if not room:
            print(f"[JOIN ERROR] Room {room_id} not found")
            await sio.emit('join_error', {
                'error': 'Room not found',
                'code': 'ROOM_NOT_FOUND',
                'statusCode': 404
            }, room=sid)
            return

        # Check if expired
        if room.is_expired():
            print(f"[JOIN ERROR] Room {room_id} expired")
            await sio.emit('join_error', {
                'error': 'This quiz expired (24 hours elapsed)',
                'code': 'ROOM_EXPIRED',
                'statusCode': 410
            }, room=sid)
            await room_manager.remove_room(room_id)
            return

        # Check if completed
        if room.status == 'completed':
            print(f"[JOIN ERROR] Room {room_id} already completed")
            await sio.emit('join_error', {
                'error': 'Battle already completed',
                'code': 'BATTLE_COMPLETED',
                'statusCode': 410
            }, room=sid)
            return

        # Store user data in session
        await sio.save_session(sid, {'userData': user_data})

        # Check if this user is the actual host (not just claiming to be)
        is_actual_host = False

        # Handle host reconnection - only if this user_id matches an existing HTTP host
        if user_data.get('isHost') is True:
            # Check if there's an HTTP host placeholder that needs to be replaced
            for participant in room.participants:
                if participant.user_id.startswith('http-') and participant.is_host:
                    print(f"[HOST RECONNECT] Replacing HTTP host with real Socket.IO connection for {user_data.get('username')}")
                    # Remove the HTTP placeholder
                    room.participants = [p for p in room.participants if not p.user_id.startswith('http-')]
                    # Update the host object
                    room.host.user_id = sid
                    room.host.username = user_data.get('username', room.host.username)
                    room.host.avatar = user_data.get('avatar', room.host.avatar)
                    is_actual_host = True
                    break

            # If no HTTP host found, check if this person created the room via Socket.IO
            if not is_actual_host and room.host.user_id == sid:
                is_actual_host = True
                print(f"[HOST] {user_data.get('username')} is the original room creator")

        # Override isHost flag based on actual host status
        user_data['isHost'] = is_actual_host

        # Add participant (or update if already exists)
        result = room.add_participant(sid, user_data)

        if not result['success']:
            print(f"[JOIN ERROR] {result.get('error')} for room {room_id}")
            await sio.emit('join_error', {
                'error': result.get('error'),
                'code': 'JOIN_FAILED',
                'statusCode': 403
            }, room=sid)
            return

        # Join Socket.IO room
        await sio.enter_room(sid, room_id)
        room_manager.user_rooms[sid] = room_id

        print(f"[JOIN SUCCESS] ✅ {user_data.get('username')} joined room {room_id} ({len(room.participants)} participants)")

        # Notify all participants
        print(f"[EMIT] Sending participant_joined to room {room_id}")
        await sio.emit('participant_joined', {
            'participant': {
                'userId': sid,
                **user_data
            },
            'room': room.to_dict()
        }, room=room_id)

        # Send room data to joiner
        print(f"[EMIT] Sending room_joined to {sid} (isHost: {is_actual_host})")
        await sio.emit('room_joined', {
            'success': True,
            'room': room.to_dict(),
            'questions': room.questions,
            'isHost': is_actual_host,  # Tell the user if they are the actual host
            'hostInfo': {
                'userId': room.host.user_id,
                'username': room.host.username,
                'avatar': room.host.avatar
            }
        }, room=sid)
        print(f"[EMIT] ✅ room_joined event sent successfully to {sid}")

    except Exception as e:
        print(f"[ERROR] join_room: {str(e)}")
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

        # Schedule cleanup after 5 minutes
        async def cleanup():
            await asyncio.sleep(5 * 60)
            await room_manager.remove_room(room_id)
            print(f"[CLEANUP] Room {room_id} deleted")

        asyncio.create_task(cleanup())

    except Exception as e:
        print(f"[ERROR] complete_battle: {str(e)}")


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
async def leave_room(sid, data):
    """Leave a room"""
    room_id = data.get('roomId') or data.get('pin')
    await handle_user_leave(sid, room_id)


# ==================== MATCHMAKING EVENTS ====================

@sio.event
async def find_match(sid, data):
    """Find a match for quiz battle"""
    try:
        player_name = data.get('playerName', 'Player')
        exam = data.get('exam', '')
        subject = data.get('subject', '')

        print(f"[MATCHMAKING] {player_name} looking for match in {exam} - {subject}")

        # Try to find a match
        opponent = matchmaking_manager.add_to_queue(sid, player_name, exam, subject)

        if opponent:
            # Match found! Create battle room
            room_id = f"room_{int(datetime.now(timezone.utc).timestamp())}_{generate_random_id()}"

            player1_data = {
                'socketId': sid,
                'playerName': player_name,
                'score': 0
            }

            player2_data = {
                'socketId': opponent.socket_id,
                'playerName': opponent.player_name,
                'score': 0
            }

            # Register battle
            matchmaking_manager.create_battle(room_id, player1_data, player2_data, exam, subject)

            # Join both players to Socket.IO room
            await sio.enter_room(sid, room_id)
            await sio.enter_room(opponent.socket_id, room_id)

            # Notify both players
            await sio.emit('match-found', {
                'roomId': room_id,
                'players': [
                    {'playerName': player_name},
                    {'playerName': opponent.player_name}
                ],
                'exam': exam,
                'subject': subject
            }, room=room_id)

            print(f"[MATCHMAKING] Match created: Room {room_id}")

        else:
            # Added to waiting list
            await sio.emit('waiting', {'message': 'Looking for opponent...'}, room=sid)
            print(f"[MATCHMAKING] {player_name} added to waiting list")

    except Exception as e:
        print(f"[ERROR] find_match: {str(e)}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def cancel_match(sid, data=None):
    """Cancel matchmaking"""
    try:
        removed = matchmaking_manager.remove_from_queue(sid)
        if removed:
            print(f"[MATCHMAKING] Player {sid} cancelled matchmaking")
            await sio.emit('match-cancelled', {'success': True}, room=sid)
    except Exception as e:
        print(f"[ERROR] cancel_match: {str(e)}")


@sio.event
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


# ==================== WEBRTC SIGNALING EVENTS ====================

@sio.event
async def webrtc_offer(sid, data):
    """WebRTC offer signaling"""
    try:
        room_id = data.get('roomId')
        offer = data.get('offer')

        # Forward to other users in room
        await sio.emit('webrtc-offer', {
            'offer': offer,
            'from': sid
        }, room=room_id, skip_sid=sid)

    except Exception as e:
        print(f"[ERROR] webrtc_offer: {str(e)}")


@sio.event
async def webrtc_answer(sid, data):
    """WebRTC answer signaling"""
    try:
        room_id = data.get('roomId')
        answer = data.get('answer')

        # Forward to other users in room
        await sio.emit('webrtc-answer', {
            'answer': answer,
            'from': sid
        }, room=room_id, skip_sid=sid)

    except Exception as e:
        print(f"[ERROR] webrtc_answer: {str(e)}")


@sio.event
async def webrtc_ice_candidate(sid, data):
    """WebRTC ICE candidate signaling"""
    try:
        room_id = data.get('roomId')
        candidate = data.get('candidate')

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