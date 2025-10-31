"""
Standalone Socket.io proxy server
Runs on port 5002, separate from FastAPI
"""
import socketio
import uvicorn
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
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
        
        # Define event handlers for this client
        async def handle_player_joined(data):
            logger.info(f'📬 player-joined for {sid}')
            await sio_server.emit('player-joined', data, room=sid)
        
        async def handle_quiz_started(data):
            logger.info(f'📬 quiz-started for {sid}')
            await sio_server.emit('quiz-started', data, room=sid)
        
        async def handle_new_question(data):
            logger.info(f'📬 new-question for {sid}')
            await sio_server.emit('new-question', data, room=sid)
        
        async def handle_answer_result(data):
            logger.info(f'📬 answer-result for {sid}')
            await sio_server.emit('answer-result', data, room=sid)
        
        async def handle_leaderboard_update(data):
            logger.info(f'📬 leaderboard-update for {sid}')
            await sio_server.emit('leaderboard-update', data, room=sid)
        
        async def handle_quiz_ended(data):
            logger.info(f'📬 quiz-ended for {sid}')
            await sio_server.emit('quiz-ended', data, room=sid)
        
        async def handle_player_left(data):
            logger.info(f'📬 player-left for {sid}')
            await sio_server.emit('player-left', data, room=sid)
        
        async def handle_error(data):
            logger.error(f'📬 error for {sid}: {data}')
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
        logger.info(f'✅ Connected client {sid} to battle-server')
        
    except Exception as e:
        logger.error(f'❌ Error connecting {sid}: {e}')
        import traceback
        traceback.print_exc()
        raise

@sio_server.event
async def disconnect(sid):
    """When client disconnects, cleanup"""
    logger.info(f'❌ Client {sid} disconnected')
    if sid in client_connections:
        try:
            await client_connections[sid].disconnect()
            del client_connections[sid]
        except:
            pass

@sio_server.event
async def join_room(sid, data):
    """Forward join-room to battle-server"""
    logger.info(f'📤 Forwarding join-room from {sid}: {data}')
    if sid in client_connections:
        await client_connections[sid].emit('join-room', data)

@sio_server.event
async def start_quiz(sid, data):
    """Forward start-quiz to battle-server"""
    logger.info(f'📤 Forwarding start-quiz from {sid}')
    if sid in client_connections:
        await client_connections[sid].emit('start-quiz', data)

@sio_server.event
async def submit_answer(sid, data):
    """Forward submit-answer to battle-server"""
    logger.info(f'📤 Forwarding submit-answer from {sid}')
    if sid in client_connections:
        await client_connections[sid].emit('submit-answer', data)

@sio_server.event
async def send_message(sid, data):
    """Forward send-message to battle-server"""
    if sid in client_connections:
        await client_connections[sid].emit('send-message', data)

@sio_server.event
async def send_reaction(sid, data):
    """Forward send-reaction to battle-server"""
    if sid in client_connections:
        await client_connections[sid].emit('send-reaction', data)

# Create ASGI app
app = socketio.ASGIApp(sio_server)

if __name__ == '__main__':
    logger.info('🚀 Starting Socket.io proxy server on port 5002...')
    uvicorn.run(app, host='0.0.0.0', port=5002, log_level='info')
