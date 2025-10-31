import socketio
import time

# Test connecting to backend proxy
print("Testing socket connection to backend proxy...")
sio = socketio.Client()

@sio.event
def connect():
    print("✅ Connected to proxy!")
    
@sio.event
def disconnect():
    print("❌ Disconnected from proxy")

@sio.on('player-joined')
def on_player_joined(data):
    print(f"📬 Received player-joined: {data}")

@sio.on('error')
def on_error(data):
    print(f"❌ Received error: {data}")

try:
    sio.connect('http://localhost:8001', socketio_path='/socket.io')
    print("Connected! Sending join-room...")
    sio.emit('join-room', {'pin': '508926', 'playerName': 'Test Player', 'isHost': False})
    time.sleep(5)
    sio.disconnect()
except Exception as e:
    print(f"Connection failed: {e}")
