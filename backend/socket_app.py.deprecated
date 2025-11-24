"""
Socket.io proxy - ASGI app only (no server)
This module is imported by server.py
"""
import socketio
import logging

logger = logging.getLogger(__name__)

# Battle-server URL
BATTLE_SERVER_URL = 'http://localhost:5001'

# Create Socket.io server
sio_server = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Store client connections
client_connections = {}

@sio_server.event
async def connect(sid, environ):
    """When client connects, create dedicated battle-server connection"""
    try:
        logger.info(f'✅ Client {sid} connected to Socket.io proxy')
        
        # Create dedicated battle-server connection
        battle_client = socketio.AsyncClient(logger=True, engineio_logger=True)
        
        # Define event handlers
        async def handle_player_joined(data):
            await sio_server.emit('player-joined', data, room=sid)
        
        async def handle_quiz_started(data):
            await sio_server.emit('quiz-started', data, room=sid)
        
        async def handle_new_question(data):
            await sio_server.emit('new-question', data, room=sid)
        
        async def handle_answer_result(data):
            await sio_server.emit('answer-result', data, room=sid)
        
        async def handle_leaderboard_update(data):
            await sio_server.emit('leaderboard-update', data, room=sid)
        
        async def handle_quiz_ended(data):
            await sio_server.emit('quiz-ended', data, room=sid)
        
        async def handle_player_left(data):
            await sio_server.emit('player-left', data, room=sid)
        
        async def handle_error(data):
            await sio_server.emit('error', data, room=sid)
        
        # Register handlers
        battle_client.on('player-joined', handle_player_joined)
        battle_client.on('quiz-started', handle_quiz_started)
        battle_client.on('new-question', handle_new_question)
        battle_client.on('answer-result', handle_answer_result)
        battle_client.on('leaderboard-update', handle_leaderboard_update)
        battle_client.on('quiz-ended', handle_quiz_ended)
        battle_client.on('player-left', handle_player_left)
        battle_client.on('error', handle_error)
        
        # Connect to battle-server
        await battle_client.connect(BATTLE_SERVER_URL)
        client_connections[sid] = battle_client
        logger.info(f'✅ Connected {sid} to battle-server')
        
    except Exception as e:
        logger.error(f'❌ Error: {e}')
        import traceback
        traceback.print_exc()
        raise

@sio_server.event
async def disconnect(sid):
    """Cleanup on disconnect"""
    logger.info(f'❌ Client {sid} disconnected')
    if sid in client_connections:
        try:
            await client_connections[sid].disconnect()
            del client_connections[sid]
        except:
            pass

@sio_server.event
async def join_room(sid, data):
    """Forward join-room"""
    logger.info(f'📤 join-room from {sid}')
    if sid in client_connections:
        await client_connections[sid].emit('join-room', data)

@sio_server.event
async def start_quiz(sid, data):
    """Forward start-quiz"""
    if sid in client_connections:
        await client_connections[sid].emit('start-quiz', data)

@sio_server.event
async def submit_answer(sid, data):
    """Forward submit-answer"""
    if sid in client_connections:
        await client_connections[sid].emit('submit-answer', data)

# Create ASGI app
socket_asgi_app = socketio.ASGIApp(sio_server)
