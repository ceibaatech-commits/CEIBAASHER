"""
Socket.io proxy to forward connections from main backend to battle-server
"""
import socketio
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Socket.io client that connects to battle-server
sio_client = socketio.AsyncClient(logger=True, engineio_logger=True)

# Create Socket.io server that frontend will connect to  
sio_server = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

BATTLE_SERVER_URL = 'http://localhost:5001'
client_to_server_sid = {}  # Map client sid to battle-server sid

@sio_server.event
async def connect(sid, environ):
    """When client connects to main backend"""
    logger.info(f'🔗 Client {sid} connected to proxy')
    client_to_server_sid[sid] = None
    
    # Connect to battle-server if not already connected
    if not sio_client.connected:
        try:
            await sio_client.connect(BATTLE_SERVER_URL)
            logger.info('✅ Proxy connected to battle-server')
        except Exception as e:
            logger.error(f'❌ Failed to connect to battle-server: {e}')

@sio_server.event
async def disconnect(sid):
    logger.info(f'❌ Client {sid} disconnected from proxy')
    if sid in client_to_server_sid:
        del client_to_server_sid[sid]

# Forward all events from client to battle-server
@sio_server.event
async def join_room(sid, data):
    """Handle join_room (Python naming)"""
    logger.info(f'📨 Forwarding join_room from {sid}: {data}')
    try:
        await sio_client.emit('join-room', data)
    except Exception as e:
        logger.error(f'❌ Error forwarding join_room: {e}')

# Also handle the hyphenated version from JavaScript
@sio_server.on('join-room')
async def join_room_hyphen(sid, data):
    """Handle join-room (JavaScript naming)"""
    logger.info(f'📨 Forwarding join-room from {sid}: {data}')
    try:
        await sio_client.emit('join-room', data)
    except Exception as e:
        logger.error(f'❌ Error forwarding join-room: {e}')

@sio_server.event
async def find_match(sid, data):
    logger.info(f'📨 Forwarding find-match from {sid}: {data}')
    try:
        await sio_client.emit('find-match', data)
    except Exception as e:
        logger.error(f'❌ Error forwarding find-match: {e}')

@sio_server.event
async def start_quiz(sid, data):
    logger.info(f'📨 Forwarding start-quiz from {sid}')
    await sio_client.emit('start-quiz', data)

@sio_server.event
async def submit_answer(sid, data):
    logger.info(f'📨 Forwarding submit-answer from {sid}')
    await sio_client.emit('submit-answer', data)

@sio_server.event
async def send_message(sid, data):
    logger.info(f'📨 Forwarding send-message from {sid}')
    await sio_client.emit('send-message', data)

@sio_server.event
async def send_reaction(sid, data):
    await sio_client.emit('send-reaction', data)

@sio_server.event
async def send_gift(sid, data):
    await sio_client.emit('send-gift', data)

@sio_server.event
async def cancel_matchmaking(sid):
    await sio_client.emit('cancel-matchmaking')

# Forward events from battle-server back to all connected clients
@sio_client.event
async def player_joined(data):
    logger.info(f'📬 Broadcasting player-joined from battle-server: {data}')
    await sio_server.emit('player-joined', data)

@sio_client.event
async def match_found(data):
    logger.info(f'📬 Broadcasting match-found from battle-server: {data}')
    await sio_server.emit('match-found', data)

@sio_client.event
async def waiting(data):
    logger.info(f'📬 Broadcasting waiting from battle-server: {data}')
    await sio_server.emit('waiting', data)

@sio_client.event
async def quiz_started(data):
    logger.info(f'📬 Broadcasting quiz-started')
    await sio_server.emit('quiz-started', data)

@sio_client.event
async def leaderboard_update(data):
    await sio_server.emit('leaderboard-update', data)

@sio_client.event
async def quiz_ended(data):
    await sio_server.emit('quiz-ended', data)

@sio_client.event
async def new_message(data):
    await sio_server.emit('new-message', data)

@sio_client.event
async def new_reaction(data):
    await sio_server.emit('new-reaction', data)

@sio_client.event
async def gift_received(data):
    await sio_server.emit('gift-received', data)

@sio_client.event
async def player_left(data):
    logger.info(f'📬 Broadcasting player-left')
    await sio_server.emit('player-left', data)

@sio_client.event
async def error(data):
    logger.error(f'📬 Broadcasting error from battle-server: {data}')
    await sio_server.emit('error', data)

@sio_client.event
async def connect():
    logger.info('✅ Socket.io client connected to battle-server')

@sio_client.event
async def connect_error(data):
    logger.error(f'❌ Connection error to battle-server: {data}')

@sio_client.event
async def disconnect():
    logger.warning('❌ Socket.io client disconnected from battle-server')

# Create ASGI app
socket_app = socketio.ASGIApp(sio_server, socketio_path='socket.io')
