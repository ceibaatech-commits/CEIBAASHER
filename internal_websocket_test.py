#!/usr/bin/env python3
"""
Internal WebSocket Test - Test internal connections first
"""

import requests
import time
import socketio
import sys

def test_internal_websocket():
    """Test internal WebSocket connection"""
    try:
        # Test internal connection to /api/battlews through localhost:8001
        internal_url = "http://localhost:8001/api/battlews"
        print(f"🔗 Testing internal WebSocket connection to: {internal_url}")
        
        sio_client = socketio.SimpleClient()
        
        try:
            sio_client.connect(internal_url, transports=['polling', 'websocket'])
            
            if sio_client.connected:
                print(f"✅ Successfully connected to {internal_url}")
                
                # Check transport type
                transport = getattr(sio_client.eio, 'transport_name', 'unknown')
                print(f"🚀 Transport: {transport}")
                
                # Test stability
                time.sleep(2)
                
                if sio_client.connected:
                    print("✅ Connection stable after 2 seconds")
                else:
                    print("❌ Connection dropped")
                
                sio_client.disconnect()
                return True
            else:
                print(f"❌ Failed to connect to {internal_url}")
                return False
                
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

def test_battle_server_direct():
    """Test direct connection to battle-server"""
    try:
        battle_url = "http://localhost:5001"
        print(f"🔗 Testing direct battle-server connection to: {battle_url}")
        
        sio_client = socketio.SimpleClient()
        
        try:
            sio_client.connect(battle_url, transports=['polling', 'websocket'])
            
            if sio_client.connected:
                print(f"✅ Successfully connected to battle-server")
                
                # Test room creation via Socket.io
                sio_client.emit('create_room', {
                    'hostName': 'DirectTestHost',
                    'examId': 'JEE',
                    'subject': 'Physics',
                    'topic': 'Mechanics'
                })
                
                # Wait for response
                time.sleep(2)
                
                # Try to receive events
                events = []
                for i in range(5):
                    try:
                        event = sio_client.receive(timeout=1)
                        if event:
                            events.append(event)
                            print(f"📨 Received: {event}")
                    except:
                        pass
                
                if events:
                    print(f"✅ Received {len(events)} events from battle-server")
                else:
                    print("⚠️ No events received (may be normal)")
                
                sio_client.disconnect()
                return True
            else:
                print(f"❌ Failed to connect to battle-server")
                return False
                
        except Exception as e:
            print(f"❌ Battle-server connection error: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 INTERNAL WEBSOCKET TESTING")
    print("=" * 50)
    
    print("\n1️⃣ Testing Internal WebSocket Proxy")
    internal_success = test_internal_websocket()
    
    print("\n2️⃣ Testing Direct Battle-Server Connection")
    direct_success = test_battle_server_direct()
    
    print("\n📊 RESULTS")
    print("=" * 30)
    print(f"Internal Proxy: {'✅ PASS' if internal_success else '❌ FAIL'}")
    print(f"Direct Battle-Server: {'✅ PASS' if direct_success else '❌ FAIL'}")
    
    if internal_success and direct_success:
        print("\n🎉 Internal connections working - issue is with external routing")
    elif direct_success:
        print("\n⚠️ Battle-server works, but proxy has issues")
    else:
        print("\n🚨 Both internal connections have issues")