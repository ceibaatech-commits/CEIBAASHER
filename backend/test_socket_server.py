import socketio
import uvicorn

# Create bare Socket.io server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

@sio.event
async def connect(sid, environ):
    print(f'✅ Client {sid} connected!')

@sio.event
async def disconnect(sid):
    print(f'❌ Client {sid} disconnected')

# Create ASGI app
app = socketio.ASGIApp(sio)

if __name__ == '__main__':
    print('🚀 Starting test Socket.io server on port 5002...')
    uvicorn.run(app, host='0.0.0.0', port=5002)
