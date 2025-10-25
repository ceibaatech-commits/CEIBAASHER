"""
Socket.io proxy to forward connections from main backend to battle-server
"""
import socketio
import asyncio

# Create Socket.io client that connects to battle-server
sio_client = socketio.AsyncClient()

# Create Socket.io server that frontend will connect to  
sio_server = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

BATTLE_SERVER_URL = 'http://localhost:5001'

@sio_server.event
async def connect(sid, environ):
    """When client connects to main backend, connect to battle-server"""
    print(f'🔗 Client {sid} connected to proxy')
    
    # Connect to battle-server if not already connected
    if not sio_client.connected:
        try:
            await sio_client.connect(BATTLE_SERVER_URL)
            print('✅ Proxy connected to battle-server')
        except Exception as e:
            print(f'❌ Failed to connect to battle-server: {e}')

@sio_server.event
async def disconnect(sid):
    print(f'❌ Client {sid} disconnected from proxy')

# Forward all events from client to battle-server
@sio_server.event
async def join_room(sid, data):
    print(f'📨 Forwarding join-room from {sid}: {data}')
    await sio_client.emit('join-room', data)

@sio_server.event
async def find_match(sid, data):
    print(f'📨 Forwarding find-match from {sid}: {data}')
    await sio_client.emit('find-match', data)

@sio_server.event
async def start_quiz(sid, data):
    print(f'📨 Forwarding start-quiz from {sid}')
    await sio_client.emit('start-quiz', data)

@sio_server.event
async def submit_answer(sid, data):
    print(f'📨 Forwarding submit-answer from {sid}')
    await sio_client.emit('submit-answer', data)

@sio_server.event
async def send_message(sid, data):
    print(f'📨 Forwarding send-message from {sid}')
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
    print(f'📬 Broadcasting player-joined: {data}')
    await sio_server.emit('player-joined', data)

@sio_client.event
async def match_found(data):
    print(f'📬 Broadcasting match-found: {data}')
    await sio_server.emit('match-found', data)

@sio_client.event
async def waiting(data):
    print(f'📬 Broadcasting waiting: {data}')
    await sio_server.emit('waiting', data)

@sio_client.event
async def quiz_started(data):
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
    await sio_server.emit('player-left', data)

@sio_client.event
async def error(data):
    await sio_server.emit('error', data)

# Create ASGI app
socket_app = socketio.ASGIApp(sio_server, socketio_path='socket.io')
