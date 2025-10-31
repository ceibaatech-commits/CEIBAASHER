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
    try:
        logger.info(f'🔗 Client {sid} attempting to connect to proxy')
        logger.info(f'   Environment: {environ.get("HTTP_ORIGIN")}')
        logger.info(f'   Query string: {environ.get("QUERY_STRING")}')
        
        # Create a new Socket.io client for this frontend client
        battle_client = socketio.AsyncClient(logger=True, engineio_logger=True)
    
    # Setup event forwarding from battle-server to this specific frontend client
    # Register handlers programmatically
    async def handle_player_joined(data):
        logger.info(f'📬 Received player-joined from battle-server for {sid}: {data}')
        await sio_server.emit('player-joined', data, room=sid)
    
    async def handle_match_found(data):
        logger.info(f'📬 Received match-found from battle-server for {sid}')
        await sio_server.emit('match-found', data, room=sid)
    
    async def handle_waiting(data):
        logger.info(f'📬 Received waiting from battle-server for {sid}')
        await sio_server.emit('waiting', data, room=sid)
    
    async def handle_quiz_started(data):
        logger.info(f'📬 Received quiz-started from battle-server for {sid}')
        await sio_server.emit('quiz-started', data, room=sid)
    
    async def handle_new_question(data):
        logger.info(f'📬 Received new-question from battle-server for {sid}')
        await sio_server.emit('new-question', data, room=sid)
    
    async def handle_answer_result(data):
        logger.info(f'📬 Received answer-result from battle-server for {sid}')
        await sio_server.emit('answer-result', data, room=sid)
    
    async def handle_question_results(data):
        logger.info(f'📬 Received question-results from battle-server for {sid}')
        await sio_server.emit('question-results', data, room=sid)
    
    async def handle_leaderboard_update(data):
        logger.info(f'📬 Received leaderboard-update from battle-server for {sid}')
        await sio_server.emit('leaderboard-update', data, room=sid)
    
    async def handle_quiz_ended(data):
        logger.info(f'📬 Received quiz-ended from battle-server for {sid}')
        await sio_server.emit('quiz-ended', data, room=sid)
    
    async def handle_new_message(data):
        logger.info(f'📬 Received new-message from battle-server for {sid}')
        await sio_server.emit('new-message', data, room=sid)
    
    async def handle_new_reaction(data):
        logger.info(f'📬 Received new-reaction from battle-server for {sid}')
        await sio_server.emit('new-reaction', data, room=sid)
    
    async def handle_gift_received(data):
        logger.info(f'📬 Received gift-received from battle-server for {sid}')
        await sio_server.emit('gift-received', data, room=sid)
    
    async def handle_player_left(data):
        logger.info(f'📬 Received player-left from battle-server for {sid}')
        await sio_server.emit('player-left', data, room=sid)
    
    async def handle_error(data):
        logger.error(f'📬 Received error from battle-server for {sid}: {data}')
        await sio_server.emit('error', data, room=sid)
    
    # Register all handlers
    battle_client.on('player-joined', handle_player_joined)
    battle_client.on('match-found', handle_match_found)
    battle_client.on('waiting', handle_waiting)
    battle_client.on('quiz-started', handle_quiz_started)
    battle_client.on('new-question', handle_new_question)
    battle_client.on('answer-result', handle_answer_result)
    battle_client.on('question-results', handle_question_results)
    battle_client.on('leaderboard-update', handle_leaderboard_update)
    battle_client.on('quiz-ended', handle_quiz_ended)
    battle_client.on('new-message', handle_new_message)
    battle_client.on('new-reaction', handle_new_reaction)
    battle_client.on('gift-received', handle_gift_received)
    battle_client.on('player-left', handle_player_left)
    battle_client.on('error', handle_error)
    
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
    if sid in client_connections:
        try:
            await client_connections[sid].emit('find-match', data)
        except Exception as e:
            logger.error(f'❌ Error forwarding find-match: {e}')

@sio_server.on('start-quiz')
async def start_quiz_hyphen(sid, data):
    """Handle start-quiz (JavaScript naming)"""
    logger.info(f'📨 Forwarding start-quiz from {sid}')
    if sid in client_connections:
        await client_connections[sid].emit('start-quiz', data)

@sio_server.event
async def start_quiz(sid, data):
    """Handle start_quiz (Python naming)"""
    logger.info(f'📨 Forwarding start_quiz from {sid}')
    if sid in client_connections:
        await client_connections[sid].emit('start-quiz', data)

@sio_server.on('submit-answer')
async def submit_answer_hyphen(sid, data):
    """Handle submit-answer (JavaScript naming)"""
    logger.info(f'📨 Forwarding submit-answer from {sid}')
    if sid in client_connections:
        await client_connections[sid].emit('submit-answer', data)

@sio_server.event
async def submit_answer(sid, data):
    """Handle submit_answer (Python naming)"""
    logger.info(f'📨 Forwarding submit_answer from {sid}')
    if sid in client_connections:
        await client_connections[sid].emit('submit-answer', data)

@sio_server.on('send-message')
async def send_message_hyphen(sid, data):
    """Handle send-message (JavaScript naming)"""
    logger.info(f'📨 Forwarding send-message from {sid}')
    if sid in client_connections:
        await client_connections[sid].emit('send-message', data)

@sio_server.event
async def send_message(sid, data):
    """Handle send_message (Python naming)"""
    logger.info(f'📨 Forwarding send_message from {sid}')
    if sid in client_connections:
        await client_connections[sid].emit('send-message', data)

@sio_server.on('send-reaction')
async def send_reaction_hyphen(sid, data):
    if sid in client_connections:
        await client_connections[sid].emit('send-reaction', data)

@sio_server.event
async def send_reaction(sid, data):
    if sid in client_connections:
        await client_connections[sid].emit('send-reaction', data)

@sio_server.on('send-gift')
async def send_gift_hyphen(sid, data):
    if sid in client_connections:
        await client_connections[sid].emit('send-gift', data)

@sio_server.event
async def send_gift(sid, data):
    if sid in client_connections:
        await client_connections[sid].emit('send-gift', data)

@sio_server.event
async def cancel_matchmaking(sid):
    if sid in client_connections:
        await client_connections[sid].emit('cancel-matchmaking')

# Create ASGI app - don't specify socketio_path since FastAPI mounts it at /socket.io
socket_app = socketio.ASGIApp(sio_server)
