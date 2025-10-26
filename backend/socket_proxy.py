"""
Socket.io proxy to forward connections from main backend to battle-server
Each frontend client gets its own dedicated battle-server connection
"""
import socketio
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Socket.io server that frontend will connect to  
sio_server = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

BATTLE_SERVER_URL = 'http://localhost:5001'
# Map frontend client SID to their dedicated battle-server client
client_connections = {}  # {frontend_sid: battle_client}

@sio_server.event
async def connect(sid, environ):
    """When client connects to main backend, create dedicated battle-server connection"""
    logger.info(f'🔗 Client {sid} connected to proxy')
    
    # Create a new Socket.io client for this frontend client
    battle_client = socketio.AsyncClient(logger=False, engineio_logger=False)
    
    # Setup event forwarding from battle-server to this specific frontend client
    @battle_client.event
    async def player_joined(data):
        logger.info(f'📬 Forwarding player-joined to {sid}: {data}')
        await sio_server.emit('player-joined', data, room=sid)
    
    @battle_client.event
    async def match_found(data):
        logger.info(f'📬 Forwarding match-found to {sid}')
        await sio_server.emit('match-found', data, room=sid)
    
    @battle_client.event
    async def waiting(data):
        logger.info(f'📬 Forwarding waiting to {sid}')
        await sio_server.emit('waiting', data, room=sid)
    
    @battle_client.event
    async def quiz_started(data):
        logger.info(f'📬 Forwarding quiz-started to {sid}')
        await sio_server.emit('quiz-started', data, room=sid)
    
    @battle_client.event
    async def leaderboard_update(data):
        await sio_server.emit('leaderboard-update', data, room=sid)
    
    @battle_client.event
    async def quiz_ended(data):
        await sio_server.emit('quiz-ended', data, room=sid)
    
    @battle_client.event
    async def new_message(data):
        await sio_server.emit('new-message', data, room=sid)
    
    @battle_client.event
    async def new_reaction(data):
        await sio_server.emit('new-reaction', data, room=sid)
    
    @battle_client.event
    async def gift_received(data):
        await sio_server.emit('gift-received', data, room=sid)
    
    @battle_client.event
    async def player_left(data):
        logger.info(f'📬 Forwarding player-left to {sid}')
        await sio_server.emit('player-left', data, room=sid)
    
    @battle_client.event
    async def error(data):
        logger.error(f'📬 Forwarding error to {sid}: {data}')
        await sio_server.emit('error', data, room=sid)
    
    # Connect this client to battle-server
    try:
        await battle_client.connect(BATTLE_SERVER_URL)
        client_connections[sid] = battle_client
        logger.info(f'✅ Created dedicated battle-server connection for client {sid}')
    except Exception as e:
        logger.error(f'❌ Failed to connect client {sid} to battle-server: {e}')

@sio_server.event
async def disconnect(sid):
    """When client disconnects, cleanup their battle-server connection"""
    logger.info(f'❌ Client {sid} disconnected from proxy')
    if sid in client_connections:
        battle_client = client_connections[sid]
        try:
            await battle_client.disconnect()
        except:
            pass
        del client_connections[sid]
        logger.info(f'🗑️ Cleaned up battle-server connection for {sid}')

# Forward all events from client to their dedicated battle-server connection
@sio_server.event
async def join_room(sid, data):
    """Handle join_room (Python naming)"""
    logger.info(f'📨 Forwarding join_room from {sid}: {data}')
    if sid in client_connections:
        try:
            await client_connections[sid].emit('join-room', data)
        except Exception as e:
            logger.error(f'❌ Error forwarding join_room: {e}')

# Also handle the hyphenated version from JavaScript
@sio_server.on('join-room')
async def join_room_hyphen(sid, data):
    """Handle join-room (JavaScript naming)"""
    logger.info(f'📨 Forwarding join-room from {sid}: {data}')
    if sid in client_connections:
        try:
            await client_connections[sid].emit('join-room', data)
        except Exception as e:
            logger.error(f'❌ Error forwarding join-room: {e}')

@sio_server.event
async def find_match(sid, data):
    logger.info(f'📨 Forwarding find-match from {sid}: {data}')
    try:
        await sio_client.emit('find-match', data)
    except Exception as e:
        logger.error(f'❌ Error forwarding find-match: {e}')

@sio_server.on('start-quiz')
async def start_quiz_hyphen(sid, data):
    """Handle start-quiz (JavaScript naming)"""
    logger.info(f'📨 Forwarding start-quiz from {sid}')
    await sio_client.emit('start-quiz', data)

@sio_server.event
async def start_quiz(sid, data):
    """Handle start_quiz (Python naming)"""
    logger.info(f'📨 Forwarding start_quiz from {sid}')
    await sio_client.emit('start-quiz', data)

@sio_server.on('submit-answer')
async def submit_answer_hyphen(sid, data):
    """Handle submit-answer (JavaScript naming)"""
    logger.info(f'📨 Forwarding submit-answer from {sid}')
    await sio_client.emit('submit-answer', data)

@sio_server.event
async def submit_answer(sid, data):
    """Handle submit_answer (Python naming)"""
    logger.info(f'📨 Forwarding submit_answer from {sid}')
    await sio_client.emit('submit-answer', data)

@sio_server.on('send-message')
async def send_message_hyphen(sid, data):
    """Handle send-message (JavaScript naming)"""
    logger.info(f'📨 Forwarding send-message from {sid}')
    await sio_client.emit('send-message', data)

@sio_server.event
async def send_message(sid, data):
    """Handle send_message (Python naming)"""
    logger.info(f'📨 Forwarding send_message from {sid}')
    await sio_client.emit('send-message', data)

@sio_server.on('send-reaction')
async def send_reaction_hyphen(sid, data):
    await sio_client.emit('send-reaction', data)

@sio_server.event
async def send_reaction(sid, data):
    await sio_client.emit('send-reaction', data)

@sio_server.on('send-gift')
async def send_gift_hyphen(sid, data):
    await sio_client.emit('send-gift', data)

@sio_server.event
async def send_gift(sid, data):
    await sio_client.emit('send-gift', data)

@sio_server.event
async def cancel_matchmaking(sid):
    await sio_client.emit('cancel-matchmaking')

# Forward events from battle-server back to specific clients in rooms
@sio_client.event
async def player_joined(data):
    logger.info(f'📬 Received player-joined from battle-server: {data}')
    # Broadcast to all connected clients (room-based)
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

# Create ASGI app - don't specify socketio_path since FastAPI mounts it at /socket.io
socket_app = socketio.ASGIApp(sio_server)
