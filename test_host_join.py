import socketio
import time
import sys

# First create a room
import requests
response = requests.post('http://localhost:5001/api/battle/create-room', json={
    'hostName': 'Test Host',
    'examId': 'JEE',
    'subject': 'Physics',
    'topic': 'Mechanics'
})

data = response.json()
print(f"Room created: {data}")
pin = data['pin']

# Now connect as host
print(f"\nConnecting as HOST to room {pin}...")
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
    print("Connected! Joining as host...")
    sio.emit('join-room', {'pin': pin, 'playerName': 'Test Host', 'isHost': True})
    time.sleep(3)
    print("\nChecking room status...")
    room_check = requests.get(f'http://localhost:5001/api/battle/room/{pin}')
    print(f"Room status: {room_check.json()}")
    sio.disconnect()
except Exception as e:
    print(f"Connection failed: {e}")
    import traceback
    traceback.print_exc()
