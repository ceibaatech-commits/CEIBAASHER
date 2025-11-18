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
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
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
    """Handle client connection"""
    print(f"[CONNECT] Client connected: {sid}")
    return True


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"[DISCONNECT] Client disconnected: {sid}")
    
    # Cleanup matchmaking
    matchmaking_manager.cleanup_player(sid)
    
    # Find battle room and notify opponent if in matched battle
    battle = matchmaking_manager.get_player_battle(sid)
    if battle:
        await sio.emit('opponent-disconnected', {}, room=battle.room_id, skip_sid=sid)
    
    # Find and cleanup user's room
    room = room_manager.get_user_room(sid)
    if room:
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
        
        room = room_manager.get_room(room_id)
        
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
        if user_data.get('isHost') == True:
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
        
        print(f"[JOIN SUCCESS] {user_data.get('username')} joined room {room_id} ({len(room.participants)} participants)")
        
        # Notify all participants
        await sio.emit('participant_joined', {
            'participant': {
                'userId': sid,
                **user_data
            },
            'room': room.to_dict()
        }, room=room_id)
        
        # Send room data to joiner
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
        
    except Exception as e:
        print(f"[ERROR] join_room: {str(e)}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def set_room_questions(sid, data):
    """Set questions for a room (host only)"""
    try:
        room_id = data.get('roomId')
        questions = data.get('questions', [])
        
        room = room_manager.get_room(room_id)
        
        if not room:
            await sio.emit('error', {'message': 'Room not found'}, room=sid)
            return
        
        # Only host can set questions
        if room.host.user_id != sid:
            await sio.emit('error', {'message': 'Only host can set questions'}, room=sid)
            return
        
        room.questions = questions
        print(f"[QUESTIONS] Host set {len(questions)} questions for room {room_id}")
        
        # Notify host
        await sio.emit('questions_set', {'success': True}, room=sid)
        
        # Broadcast to all participants
        await sio.emit('questions_updated', {'questions': questions}, room=room_id)
        print(f"[BROADCAST] Questions sent to all participants in room {room_id}")
        
    except Exception as e:
        print(f"[ERROR] set_room_questions: {str(e)}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def start_battle(sid, data):
    """Start the battle (host only)"""
    try:
        room_id = data.get('roomId')
        room = room_manager.get_room(room_id)
        
        if not room:
            await sio.emit('error', {'message': 'Room not found'}, room=sid)
            return
        
        if room.host.user_id != sid:
            await sio.emit('error', {'message': 'Only host can start battle'}, room=sid)
            return
        
        if len(room.participants) < 2:
            await sio.emit('error', {'message': 'Need at least 2 participants'}, room=sid)
            return
        
        room.status = 'starting'
        print(f"[START] Battle starting in room {room_id}")
        
        # Countdown
        for countdown in [3, 2, 1]:
            await sio.emit('countdown', {'count': countdown}, room=room_id)
            await asyncio.sleep(1)
        
        # Start battle
        room.status = 'active'
        await sio.emit('battle_started', {
            'room': room.to_dict(),
            'currentQuestion': 0
        }, room=room_id)
        
        print(f"[ACTIVE] Battle active in room {room_id}")
        
    except Exception as e:
        print(f"[ERROR] start_battle: {str(e)}")
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
        
        room = room_manager.get_room(room_id)
        if not room:
            return
        
        # Record answer
        room.submit_answer(sid, question_id, answer_id, time_spent)
        
        # Update score if correct
        if is_correct:
            room.update_score(sid, points)
        
        # Get session for username
        session = await sio.get_session(sid)
        username = session.get('userData', {}).get('username', 'User') if session else 'User'
        
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
        
        print(f"[ANSWER] {username} answered Q{question_id}: {'Correct' if is_correct else 'Wrong'}")
        
    except Exception as e:
        print(f"[ERROR] submit_answer: {str(e)}")


@sio.event
async def next_question(sid, data):
    """Move to next question (host only)"""
    try:
        room_id = data.get('roomId')
        room = room_manager.get_room(room_id)
        
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
        room = room_manager.get_room(room_id)
        
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


@sio.event
async def send_message(sid, data):
    """Send chat message"""
    try:
        room_id = data.get('roomId')
        message = data.get('message')
        
        room = room_manager.get_room(room_id)
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
        room_id = data.get('roomId')
        reaction = data.get('reaction')
        
        room = room_manager.get_room(room_id)
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
async def leave_room(sid, data):
    """Leave a room"""
    room_id = data.get('roomId')
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
    """Handle user leaving a room"""
    try:
        room = room_manager.get_room(room_id)
        if not room:
            return
        
        room.remove_participant(sid)
        room_manager.user_rooms.pop(sid, None)
        await sio.leave_room(sid, room_id)
        
        print(f"[LEAVE] User {sid} left room {room_id}")
        
        # If host left, assign new host or close room
        if room.host.user_id == sid:
            if len(room.participants) > 0:
                # Assign new host
                room.host = room.participants[0]
                room.host.is_host = True
                await sio.emit('host_changed', {'newHost': {
                    'userId': room.host.user_id,
                    'username': room.host.username,
                    'avatar': room.host.avatar,
                    'isHost': True
                }}, room=room_id)
                print(f"[HOST] New host assigned in {room_id}")
            else:
                # No participants left, close room
                await room_manager.remove_room(room_id)
                print(f"[CLOSE] Room {room_id} closed - no participants")
                return
        
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
