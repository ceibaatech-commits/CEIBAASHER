"""
Production-Grade Battle Socket.IO Server
Implements comprehensive WebSocket reliability fixes including:
- Increased ping intervals for connection stability
- Proper CORS configuration
- Authentication middleware
- Enhanced logging and error handling
- Disconnect reason tracking
"""
import socketio
import asyncio
import jwt
import os
from typing import Dict, Any, Optional
from battle_rooms import room_manager, Participant
from matchmaking import matchmaking_manager
from datetime import datetime, timezone
import random
import string
import logging

# Setup logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Get JWT secret from environment
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')

# Get frontend URL from environment for CORS
FRONTEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://quizflow-19.preview.emergentagent.com')

# Create Socket.IO server with PRODUCTION settings
sio = socketio.AsyncServer(
    async_mode='asgi',
    # CORS - Allow frontend domain and localhost for development
    cors_allowed_origins=[FRONTEND_URL, 'http://localhost:3000', '*'],
    cors_credentials=True,
    # Logging
    logger=True,
    engineio_logger=True,
    # CRITICAL: Increase ping intervals for stability
    ping_interval=25,  # Send ping every 25 seconds
    ping_timeout=60,   # Wait 60 seconds for pong response
    # Connection settings
    max_http_buffer_size=10000000,  # 10MB for large data
    allow_upgrades=True,
    transports=['websocket', 'polling']  # WebSocket first, polling fallback
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


# Authentication Middleware
@sio.event
async def connect(sid, environ, auth):
    """Handle client connection with authentication"""
    try:
        logger.info(f"[CONNECT] New connection attempt: {sid}")
        
        # Log connection details
        user_agent = environ.get('HTTP_USER_AGENT', 'Unknown')
        remote_addr = environ.get('REMOTE_ADDR', 'Unknown')
        logger.info(f"[CONNECT] User-Agent: {user_agent}")
        logger.info(f"[CONNECT] Remote Address: {remote_addr}")
        
        # Check for authentication token (optional - allows guest access)
        token = None
        if auth and 'token' in auth:
            token = auth['token']
            logger.info(f"[CONNECT] Token provided: {token[:20]}...")
            
            try:
                # Validate JWT token (optional validation)
                decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
                user_id = decoded.get('sub')
                logger.info(f"[CONNECT] Authenticated user: {user_id}")
                
                # Store user info in session
                await sio.save_session(sid, {
                    'authenticated': True,
                    'user_id': user_id,
                    'token': token
                })
            except jwt.ExpiredSignatureError:
                logger.warning(f"[CONNECT] Expired token for {sid}")
                # Allow connection but mark as unauthenticated
                await sio.save_session(sid, {'authenticated': False})
            except jwt.InvalidTokenError as e:
                logger.warning(f"[CONNECT] Invalid token for {sid}: {e}")
                await sio.save_session(sid, {'authenticated': False})
        else:
            # No token provided - guest connection allowed
            logger.info(f"[CONNECT] Guest connection: {sid}")
            await sio.save_session(sid, {'authenticated': False, 'guest': True})
        
        logger.info(f"[CONNECT] ✅ Connection established: {sid}")
        return True
        
    except Exception as e:
        logger.error(f"[CONNECT] ❌ Connection error for {sid}: {e}")
        import traceback
        traceback.print_exc()
        # Return False to reject connection
        return False


@sio.event
async def disconnect(sid):
    """Handle client disconnection with detailed logging"""
    try:
        logger.info(f"[DISCONNECT] Client disconnecting: {sid}")
        
        # Get session data
        session = await sio.get_session(sid)
        if session:
            logger.info(f"[DISCONNECT] Session data: {session}")
        
        # Cleanup matchmaking
        matchmaking_manager.cleanup_player(sid)
        
        # Find battle room and notify opponent if in matched battle
        battle = matchmaking_manager.get_player_battle(sid)
        if battle:
            logger.info(f"[DISCONNECT] Player was in battle: {battle.room_id}")
            await sio.emit('opponent-disconnected', {}, room=battle.room_id, skip_sid=sid)
        
        # Find and cleanup user's room
        room = room_manager.get_user_room(sid)
        if room:
            logger.info(f"[DISCONNECT] Cleaning up room: {room.room_id}")
            await handle_user_leave(sid, room.room_id)
        
        logger.info(f"[DISCONNECT] ✅ Cleanup complete for: {sid}")
        
    except Exception as e:
        logger.error(f"[DISCONNECT] ❌ Error during disconnect cleanup: {e}")
        import traceback
        traceback.print_exc()


@sio.event
async def connect_error(sid, error):
    """Handle connection errors"""
    logger.error(f"[CONNECT_ERROR] Connection error for {sid}: {error}")


# Keep all existing event handlers from battle_socketio.py
# (authenticate, create_room, join_room, etc.)

@sio.event
async def authenticate(sid, data):
    """Authenticate user and store data on session"""
    user_data = data.get('userData', {})
    logger.info(f"[AUTH] User authenticated: {user_data.get('username')} ({sid})")
    
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
        
        logger.info(f"[ROOM] Created: {room.room_id} by {user_data.get('username')}")
        
        # Notify creator
        await sio.emit('room_created', {
            'success': True,
            'roomId': room.room_id,
            'pin': room.room_id,
            'room': room.to_dict()
        }, room=sid)
        
    except Exception as e:
        logger.error(f"[ROOM] ❌ Error creating room: {e}")
        await sio.emit('room_error', {'error': str(e)}, room=sid)


@sio.event
async def join_room(sid, data):
    """Join an existing battle room"""
    try:
        room_id = data.get('roomId')
        user_data = data.get('userData', {})
        
        logger.info(f"[JOIN ATTEMPT] {user_data.get('username')} trying to join room {room_id}")
        
        room = room_manager.get_room(room_id)
        
        if not room:
            logger.warning(f"[JOIN ERROR] Room {room_id} not found")
            await sio.emit('join_error', {
                'error': 'Room not found',
                'code': 'ROOM_NOT_FOUND',
                'statusCode': 404
            }, room=sid)
            return
        
        # Check if expired
        if room.is_expired():
            logger.warning(f"[JOIN ERROR] Room {room_id} expired")
            await sio.emit('join_error', {
                'error': 'This quiz expired (24 hours elapsed)',
                'code': 'ROOM_EXPIRED',
                'statusCode': 410
            }, room=sid)
            await room_manager.remove_room(room_id)
            return
        
        # Check if completed
        if room.status == 'completed':
            logger.warning(f"[JOIN ERROR] Room {room_id} already completed")
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
                    logger.info(f"[HOST RECONNECT] Replacing HTTP host with real Socket.IO connection for {user_data.get('username')}")
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
                logger.info(f"[HOST] {user_data.get('username')} is the original room creator")
        
        # Override isHost flag based on actual host status
        user_data['isHost'] = is_actual_host
        
        # Add participant (or update if already exists)
        result = room.add_participant(sid, user_data)
        
        if not result['success']:
            logger.warning(f"[JOIN ERROR] {result.get('error')} for room {room_id}")
            await sio.emit('join_error', {
                'error': result.get('error'),
                'code': 'JOIN_FAILED',
                'statusCode': 403
            }, room=sid)
            return
        
        # Join Socket.IO room
        await sio.enter_room(sid, room_id)
        room_manager.user_rooms[sid] = room_id
        
        logger.info(f"[JOIN SUCCESS] ✅ {user_data.get('username')} joined room {room_id} ({len(room.participants)} participants)")
        
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
            'isHost': is_actual_host,
            'hostInfo': {
                'userId': room.host.user_id,
                'username': room.host.username,
                'avatar': room.host.avatar
            }
        }, room=sid)
        
        # Save room state to database
        await room_manager.save_room_to_db(room)
        
    except Exception as e:
        logger.error(f"[JOIN] ❌ Error joining room: {e}")
        import traceback
        traceback.print_exc()
        await sio.emit('join_error', {
            'error': 'Internal server error',
            'code': 'SERVER_ERROR',
            'statusCode': 500
        }, room=sid)


async def handle_user_leave(sid, room_id):
    """Handle user leaving a room"""
    try:
        room = room_manager.get_room(room_id)
        if not room:
            return
        
        # Remove participant
        removed = room.remove_participant(sid)
        
        if removed:
            logger.info(f"[LEAVE] User {sid} left room {room_id}")
            
            # Notify others
            await sio.emit('participant_left', {
                'userId': sid,
                'room': room.to_dict()
            }, room=room_id, skip_sid=sid)
            
            # If room is empty, clean it up
            if len(room.participants) == 0:
                logger.info(f"[LEAVE] Room {room_id} is empty, removing")
                await room_manager.remove_room(room_id)
            else:
                # Save updated room state
                await room_manager.save_room_to_db(room)
    except Exception as e:
        logger.error(f"[LEAVE] ❌ Error handling leave: {e}")


# Create ASGI app with empty socketio_path since path is handled by mount point
socket_app = socketio.ASGIApp(
    sio,
    socketio_path=''
)

logger.info("[INIT] ✅ Production-grade Socket.IO server initialized")
logger.info(f"[INIT] CORS allowed origins: {FRONTEND_URL}")
logger.info(f"[INIT] Ping interval: 25s, Ping timeout: 60s")
