"""battle_socketio.py — core room + game handlers + ASGI app.
Social, matchmaking, and WebRTC handlers live in separate modules.
"""
from battle_shared import (
    sio, db, user_activity, room_manager, matchmaking_manager,
    _validate_join_preconditions, _handle_host_reconnect,
    _validate_gift_request,
    _persist_battle_completion, _save_battle_history, _auto_post_battle_results,
    _validate_start_preconditions, _persist_battle_start,
    generate_random_id, handle_user_leave, init_socketio_db, start_matchmaking_sweep,
)
from datetime import datetime, timezone
import asyncio, os, string, secrets, socketio as _sio_mod

# ASGI app — mounted at /api/battlews in server.py
socket_app = _sio_mod.ASGIApp(sio)

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


async def _check_join_capacity(sid, room, username):
    """Return True if join can proceed, False if already-rejected error was sent."""
    is_existing = any(p.username == username for p in room.participants)
    if is_existing or room.is_joinable():
        return True, is_existing
    if room.status != 'active':
        print(f"[JOIN ERROR] Room {room.room_id} not joinable for new participant")
        await sio.emit('join_error', {
            'error': 'Room is not accepting participants.',
            'code': 'ROOM_CLOSED',
            'statusCode': 403,
        }, room=sid)
        return False, is_existing
    return True, is_existing


async def _emit_room_joined_payloads(sid, room_id, room, sid_for_user, user_data, is_host, participant):
    """Emit participant_joined to the room + room_joined to the new socket."""
    joined_at = getattr(participant, 'joined_at', None) if participant else None
    await sio.emit('participant_joined', {
        'participant': {
            'userId': sid_for_user,
            'username': user_data.get('username'),
            'avatar': user_data.get('avatar'),
            'isHost': is_host,
            'joinedAt': joined_at,
        },
        'room': room.to_dict(),
    }, room=room_id)

    await sio.emit('room_joined', {
        'success': True,
        'room': room.to_dict(),
        'questions': room.questions,
        'isHost': is_host,
        'hostInfo': {
            'userId': room.host.user_id,
            'username': room.host.username,
            'avatar': room.host.avatar,
        },
        'timeRemaining': room.get_time_remaining(),
    }, room=sid)


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
        username = user_data.get('username', '')
        print(f"[JOIN ATTEMPT] {username} trying to join room {room_id}")

        room = await room_manager.get_room(room_id)

        precondition_error = _validate_join_preconditions(room)
        if precondition_error:
            print(f"[JOIN ERROR] {precondition_error['error']} for room {room_id}")
            await sio.emit('join_error', precondition_error, room=sid)
            return

        can_join, _ = await _check_join_capacity(sid, room, username)
        if not can_join:
            return

        user_activity[sid] = datetime.now(timezone.utc).timestamp()
        await sio.save_session(sid, {'userData': user_data})

        is_actual_host = _handle_host_reconnect(room, sid, user_data)
        user_data['isHost'] = is_actual_host

        result = room.add_participant(sid, user_data)
        if not result.get('success'):
            print(f"[JOIN ERROR] {result.get('error')} for room {room_id}")
            await sio.emit('join_error', {
                'error': result.get('error', 'Failed to join room'),
                'code': result.get('code', 'JOIN_FAILED'),
                'statusCode': 403,
            }, room=sid)
            return

        await sio.enter_room(sid, room_id)
        room_manager.user_rooms[sid] = room_id
        await room_manager.save_room_to_db(room)

        print(f"[JOIN SUCCESS] ✅ {username} joined room {room_id} ({len(room.participants)} participants)")

        await _emit_room_joined_payloads(
            sid, room_id, room, sid, user_data, is_actual_host, result.get('participant'),
        )

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
        leaderboard = room.get_leaderboard()

        final_results = {
            'leaderboard': leaderboard,
            'totalQuestions': room.current_question,
            'participants': len(room.participants)
        }

        await sio.emit('battle_completed', final_results, room=room_id)
        print(f"[COMPLETE] Battle completed in room {room_id}")

        await _persist_battle_completion(room_id, room, leaderboard)
        await _save_battle_history(room_id, room, leaderboard)
        await _auto_post_battle_results(room_id, room, leaderboard)

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

        precondition_error = _validate_start_preconditions(room)
        if precondition_error:
            await sio.emit('start_error', precondition_error, room=sid)
            return

        # Start the room - NO HOST CHECK REQUIRED
        room.status = 'active'
        room.current_question = 0
        room.deactivate()  # Prevent new joins once started
        await room_manager.save_room_to_db(room)

        # Get the username of who started
        starter_name = next((p.username for p in room.participants if p.user_id == sid), 'Unknown')
        print(f"[START] Battle started in room {room_id} by {starter_name}")

        await _persist_battle_start(room_id, room)

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


# Register split handler modules (importing triggers @sio.event registration)
import battle_social_handlers   # noqa: F401
import battle_webrtc_handlers   # noqa: F401
