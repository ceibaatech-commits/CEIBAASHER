#!/usr/bin/env python3
"""
Advanced Socket.IO Integration Test
Tests actual Socket.IO functionality using HTTP polling transport
"""
import requests
import json
import time
import re

BACKEND_URL = "https://socialsmart-1.preview.emergentagent.com"
SOCKET_URL = f"{BACKEND_URL}/api/battlews"

def test_socketio_handshake():
    """Test Socket.IO handshake and session establishment"""
    try:
        # Perform Socket.IO handshake
        response = requests.get(f"{SOCKET_URL}/socket.io/", params={
            'transport': 'polling',
            'EIO': '4'
        })
        
        if response.status_code != 200:
            return False, f"Handshake failed: {response.status_code}"
            
        # Parse handshake response
        handshake_data = response.text
        if not handshake_data.startswith('0{'):
            return False, f"Invalid handshake format: {handshake_data[:50]}"
            
        # Extract session ID
        try:
            session_data = json.loads(handshake_data[1:])  # Remove '0' prefix
            sid = session_data.get('sid')
            if not sid:
                return False, "No session ID in handshake"
                
            return True, f"Handshake successful, SID: {sid}"
        except json.JSONDecodeError:
            return False, f"Invalid JSON in handshake: {handshake_data[:100]}"
            
    except Exception as e:
        return False, f"Handshake error: {e}"

def test_room_creation_and_retrieval():
    """Test room creation via REST API and retrieval"""
    try:
        # Login demo user
        login_response = requests.post(f"{BACKEND_URL}/api/auth/demo-login", json={
            'username': 'demo1',
            'password': 'demo1'
        })
        
        if login_response.status_code != 200:
            return False, f"Login failed: {login_response.status_code}"
            
        token = login_response.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}'}
        
        # Create room
        room_data = {
            'examId': 'JEE',
            'subject': 'Physics',
            'topic': 'Mechanics',
            'hostName': 'Test Host'
        }
        
        create_response = requests.post(f"{BACKEND_URL}/api/battle/create-room", 
                                      json=room_data, headers=headers)
        
        if create_response.status_code != 200:
            return False, f"Room creation failed: {create_response.status_code}"
            
        room_info = create_response.json()
        room_id = room_info.get('roomId') or room_info.get('pin')
        
        if not room_id:
            return False, "No room ID returned"
            
        # Retrieve room details
        get_response = requests.get(f"{BACKEND_URL}/api/battle/room/{room_id}")
        
        if get_response.status_code != 200:
            return False, f"Room retrieval failed: {get_response.status_code}"
            
        room_details = get_response.json()
        room_data = room_details.get('room', {})
        
        # Verify room structure
        required_fields = ['roomId', 'host', 'participants', 'status', 'config']
        missing_fields = [field for field in required_fields if field not in room_data]
        
        if missing_fields:
            return False, f"Missing room fields: {missing_fields}"
            
        return True, f"Room {room_id} created and retrieved successfully with {len(room_data.get('participants', []))} participants"
        
    except Exception as e:
        return False, f"Room test error: {e}"

def test_battle_room_manager():
    """Test battle room manager functionality"""
    try:
        # Test active rooms endpoint
        response = requests.get(f"{BACKEND_URL}/api/battle/rooms")
        
        if response.status_code != 200:
            return False, f"Active rooms endpoint failed: {response.status_code}"
            
        rooms_data = response.json()
        rooms = rooms_data.get('rooms', [])
        total = rooms_data.get('total', 0)
        
        # Test health check
        health_response = requests.get(f"{BACKEND_URL}/api/battle/health")
        
        if health_response.status_code != 200:
            return False, f"Health check failed: {health_response.status_code}"
            
        health_data = health_response.json()
        
        if health_data.get('status') != 'healthy':
            return False, f"Battle service not healthy: {health_data}"
            
        return True, f"Battle room manager healthy with {total} total rooms, {len(rooms)} active"
        
    except Exception as e:
        return False, f"Room manager test error: {e}"

def run_integration_tests():
    """Run all Socket.IO integration tests"""
    tests = [
        ("Socket.IO Handshake", test_socketio_handshake),
        ("Room Creation & Retrieval", test_room_creation_and_retrieval),
        ("Battle Room Manager", test_battle_room_manager)
    ]
    
    print("🔧 Socket.IO Integration Tests")
    print("=" * 50)
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            success, message = test_func()
            status = "✅" if success else "❌"
            print(f"{status} {test_name}: {message}")
            if success:
                passed += 1
        except Exception as e:
            print(f"❌ {test_name}: Test failed with exception: {e}")
    
    print("=" * 50)
    print(f"📊 Integration Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    return passed == total

if __name__ == "__main__":
    success = run_integration_tests()
    exit(0 if success else 1)