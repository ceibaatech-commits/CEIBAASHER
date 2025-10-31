"""
Socket.io Battle Proxy Server
Properly proxies Socket.io connections (including WebSocket) from frontend to battle-server
Uses python-socketio to handle Socket.io protocol correctly
"""
import socketio
import os
import aiohttp
import asyncio
import logging

logger = logging.getLogger(__name__)

# Create Socket.io server for proxying
sio_proxy = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # Allow all origins for Socket.io
    logger=True,
    engineio_logger=True
)

# Create ASGI app
battle_proxy_app = socketio.ASGIApp(
    sio_proxy,
    socketio_path='',  # No path prefix here, will be mounted at /api/battlews
)

# Battle server URL (internal)
BATTLE_SERVER_URL = "http://localhost:5001"

# Store client connections mapping
# frontend_sid -> battle_server_socket
client_connections = {}

# Create Socket.io clients to connect to battle-server
class BattleServerClient:
    def __init__(self, frontend_sid):
        self.frontend_sid = frontend_sid
        self.sio_client = socketio.AsyncClient(logger=True, engineio_logger=True)
        self.connected = False
        
    async def connect(self):
        """Connect to battle-server"""
        try:
            await self.sio_client.connect(
                BATTLE_SERVER_URL,
                transports=['polling', 'websocket']
            )
            self.connected = True
            logger.info(f"✅ Proxy client connected to battle-server for frontend {self.frontend_sid}")
            
            # Set up event forwarding from battle-server to frontend
            self.setup_battle_server_handlers()
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to battle-server: {e}")
            self.connected = False
    
    def setup_battle_server_handlers(self):
        """Forward all events from battle-server to frontend client"""
        
        @self.sio_client.on('*')
        async def catch_all(event, data):
            """Forward all events from battle-server to frontend"""
            logger.info(f"📤 Forwarding event '{event}' from battle-server to frontend {self.frontend_sid}")
            await sio_proxy.emit(event, data, to=self.frontend_sid)
    
    async def emit(self, event, data):
        """Emit event to battle-server"""
        if self.connected:
            await self.sio_client.emit(event, data)
    
    async def disconnect(self):
        """Disconnect from battle-server"""
        if self.connected:
            await self.sio_client.disconnect()
            self.connected = False


# Socket.io event handlers for proxy server
@sio_proxy.event
async def connect(sid, environ):
    """Frontend client connected to proxy"""
    logger.info(f"🔵 Frontend client connected: {sid}")
    
    # Create a dedicated battle-server client for this frontend client
    battle_client = BattleServerClient(sid)
    await battle_client.connect()
    
    # Store the connection mapping
    client_connections[sid] = battle_client
    
    logger.info(f"✅ Proxy setup complete for {sid}")


@sio_proxy.event
async def disconnect(sid):
    """Frontend client disconnected from proxy"""
    logger.info(f"🔴 Frontend client disconnected: {sid}")
    
    # Disconnect the corresponding battle-server client
    if sid in client_connections:
        battle_client = client_connections[sid]
        await battle_client.disconnect()
        del client_connections[sid]


@sio_proxy.on('*')
async def catch_all_from_frontend(event, sid, data):
    """
    Catch all events from frontend and forward to battle-server
    This ensures all Socket.io events are proxied correctly
    """
    logger.info(f"📥 Received event '{event}' from frontend {sid}")
    
    # Get the battle-server client for this frontend
    battle_client = client_connections.get(sid)
    
    if battle_client and battle_client.connected:
        # Forward the event to battle-server
        logger.info(f"📤 Forwarding event '{event}' to battle-server")
        await battle_client.emit(event, data)
    else:
        logger.warning(f"⚠️ No battle-server connection for frontend {sid}")


# Specific event handlers for important battle events
@sio_proxy.event
async def join_room(sid, data):
    """Forward join-room event to battle-server AND join the room on proxy side"""
    logger.info(f"🏠 join_room from {sid}: {data}")
    battle_client = client_connections.get(sid)
    if battle_client:
        # Make the proxy client also join the room on battle-server
        # This ensures broadcasts to the room reach the proxy client
        await battle_client.emit('join_room', data)
        logger.info(f"✅ Proxy client for {sid} joined room {data.get('roomId', 'unknown')}")


@sio_proxy.event
async def set_room_questions(sid, data):
    """Forward set-room-questions event to battle-server"""
    logger.info(f"📝 set_room_questions from {sid}: {data.get('roomId', 'unknown')}")
    battle_client = client_connections.get(sid)
    if battle_client:
        await battle_client.emit('set_room_questions', data)


@sio_proxy.event
async def create_room(sid, data):
    """Forward create-room event to battle-server"""
    logger.info(f"🏗️ create_room from {sid}: {data}")
    battle_client = client_connections.get(sid)
    if battle_client:
        await battle_client.emit('create_room', data)


@sio_proxy.event
async def start_quiz(sid, data):
    """Forward start-quiz event to battle-server"""
    logger.info(f"▶️ start_quiz from {sid}: {data}")
    battle_client = client_connections.get(sid)
    if battle_client:
        await battle_client.emit('start_quiz', data)


@sio_proxy.event
async def submit_answer(sid, data):
    """Forward submit-answer event to battle-server"""
    logger.info(f"✍️ submit_answer from {sid}: {data}")
    battle_client = client_connections.get(sid)
    if battle_client:
        await battle_client.emit('submit_answer', data)


@sio_proxy.event
async def next_question(sid, data):
    """Forward next-question event to battle-server"""
    logger.info(f"⏭️ next_question from {sid}: {data}")
    battle_client = client_connections.get(sid)
    if battle_client:
        await battle_client.emit('next_question', data)


@sio_proxy.event
async def send_message(sid, data):
    """Forward send-message event to battle-server"""
    logger.info(f"💬 send_message from {sid}: {data}")
    battle_client = client_connections.get(sid)
    if battle_client:
        await battle_client.emit('send_message', data)


@sio_proxy.event
async def send_reaction(sid, data):
    """Forward send-reaction event to battle-server"""
    logger.info(f"😀 send_reaction from {sid}: {data}")
    battle_client = client_connections.get(sid)
    if battle_client:
        await battle_client.emit('send_reaction', data)


logger.info("✅ Socket.io Battle Proxy Server initialized")
