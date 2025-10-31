import socketio
import time

PIN = '249434'  # Use the room from previous test

print(f"Connecting as PLAYER to room {PIN}...")
sio = socketio.Client()

@sio.event
def connect():
    print("✅ Connected to proxy!")
    
@sio.on('player-joined')
def on_player_joined(data):
    print(f"✅ Received player-joined: {data}")
    
@sio.on('error')
def on_error(data):
    print(f"❌ Received error: {data}")

try:
    sio.connect('http://localhost:8001', socketio_path='/socket.io')
    print("Connected! Joining as player...")
    sio.emit('join-room', {'pin': PIN, 'playerName': 'Player 1', 'isHost': False})
    time.sleep(5)
    sio.disconnect()
except Exception as e:
    print(f"Connection failed: {e}")
