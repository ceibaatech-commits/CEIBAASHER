#!/usr/bin/env python3
"""
Quick Socket.IO connection test to verify fixes
"""
import socketio
import asyncio
import time

# Get backend URL
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.split('=')[1].strip()
            break
    else:
        BACKEND_URL = "https://ceibaa-preview-1.preview.emergentagent.com"

print(f"🌐 Backend URL: {BACKEND_URL}")

async def test_connection():
    """Test Socket.IO connection and room joining"""
    
    # Create async Socket.IO client
    sio = socketio.AsyncClient(
        logger=True,
        engineio_logger=True
    )
    
    connection_success = False
    join_success = False
    
    @sio.event
    async def connect():
        nonlocal connection_success
        print("✅ [CLIENT] Connected to server!")
        print(f"📍 [CLIENT] Socket ID: {sio.sid}")
        connection_success = True
        
        # Try to join a test room
        print("📤 [CLIENT] Emitting join_room event...")
        await sio.emit('join_room', {
            'roomId': '123456',  # Test room
            'userData': {
                'username': 'TestUser',
                'isHost': False,
                'avatar': '🧪'
            }
        })
    
    @sio.event
    async def connect_error(data):
        print(f"❌ [CLIENT] Connection error: {data}")
    
    @sio.event
    async def disconnect():
        print("⚠️ [CLIENT] Disconnected from server")
    
    @sio.event
    async def room_joined(data):
        nonlocal join_success
        print(f"✅ [CLIENT] Room joined successfully!")
        print(f"📊 [CLIENT] Room data: {data}")
        join_success = True
    
    @sio.event
    async def join_error(data):
        print(f"ℹ️ [CLIENT] Join error (expected for test room): {data.get('error')}")
        # This is expected since we're using a test room that doesn't exist
        # The important thing is that we got a response
        nonlocal join_success
        join_success = True  # Mark as success if we got a response
    
    try:
        print(f"🔌 [CLIENT] Connecting to {BACKEND_URL}/api/battlews/socket.io...")
        print(f"⚙️ [CLIENT] Using WebSocket transport first")
        
        await sio.connect(
            BACKEND_URL,
            socketio_path='/api/battlews/socket.io',
            transports=['websocket', 'polling'],
            wait_timeout=20
        )
        
        # Wait for join response (max 10 seconds)
        print("⏳ [CLIENT] Waiting for join response...")
        for i in range(10):
            if join_success:
                break
            await asyncio.sleep(1)
            print(f"   ... waiting {i+1}s")
        
        if connection_success and join_success:
            print("\n✅ ✅ ✅ CONNECTION TEST PASSED!")
            print("✅ Socket.IO connection established")
            print("✅ Room joining flow working (got response)")
            print("✅ No timeout occurred")
        else:
            print("\n⚠️ CONNECTION TEST PARTIAL:")
            print(f"   Connection: {'✅' if connection_success else '❌'}")
            print(f"   Join Response: {'✅' if join_success else '❌ (timeout)'}")
        
        # Disconnect
        await sio.disconnect()
        print("\n🧹 [CLIENT] Disconnected cleanly")
        
    except Exception as e:
        print(f"\n❌ CONNECTION TEST FAILED!")
        print(f"   Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🧪 Starting Socket.IO Connection Test")
    print("=" * 60)
    asyncio.run(test_connection())
    print("=" * 60)
    print("🏁 Test Complete")
