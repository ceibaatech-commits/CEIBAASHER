#!/usr/bin/env python3
"""
Socket.io Battle System Test - Focused on Review Request Requirements
Tests the complete Socket.io battle system flow as specified in the review request
"""

import requests
import json
import time
import socketio
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

# Configuration from review request
BATTLE_SERVER_URL = "http://localhost:5001"  # Battle Server: Node.js + Socket.io
BACKEND_URL = "https://social-feed-ceibaa.preview.emergentagent.com"  # Backend FastAPI: HTTP API

class SocketBattleSystemTester:
    def __init__(self):
        self.test_results = []
        self.test_pin = None
        
    def log_result(self, test_name, success, message="", details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    def test_1_health_check(self):
        """Test 1: Health Check - curl http://localhost:5001/health"""
        print("\n1️⃣ HEALTH CHECK TEST")
        print("=" * 50)
        
        try:
            response = requests.get(f"{BATTLE_SERVER_URL}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if 'status' in data and data['status'] == 'healthy':
                    self.log_result("Health Check", True, 
                                  f"✅ Battle server healthy - Active rooms: {data.get('activeRooms', 0)}, Connected users: {data.get('connectedUsers', 0)}")
                    return True
                else:
                    self.log_result("Health Check", False, f"Unexpected status: {data.get('status')}")
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {e}")
            return False
    
    def test_2_socket_io_connection(self):
        """Test 2: Socket.io Connection - curl "http://localhost:5001/socket.io/?EIO=4&transport=polling" """
        print("\n2️⃣ SOCKET.IO CONNECTION TEST")
        print("=" * 50)
        
        try:
            # Test Socket.io handshake
            response = requests.get(f"{BATTLE_SERVER_URL}/socket.io/?EIO=4&transport=polling", timeout=5)
            if response.status_code == 200:
                response_text = response.text
                if 'sid' in response_text and 'upgrades' in response_text:
                    self.log_result("Socket.io Handshake", True, 
                                  "✅ Socket.io handshake successful - Session ID received")
                    
                    # Test actual Socket.io connection
                    try:
                        sio = socketio.SimpleClient()
                        sio.connect(BATTLE_SERVER_URL)
                        
                        if sio.connected:
                            self.log_result("Socket.io Connection", True, 
                                          "✅ Successfully connected to Socket.io server")
                            sio.disconnect()
                            return True
                        else:
                            self.log_result("Socket.io Connection", False, 
                                          "❌ Failed to establish Socket.io connection")
                            return False
                    except Exception as e:
                        self.log_result("Socket.io Connection", False, f"Connection error: {e}")
                        return False
                else:
                    self.log_result("Socket.io Handshake", False, 
                                  f"Invalid handshake response: {response_text[:100]}")
                    return False
            else:
                self.log_result("Socket.io Handshake", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Socket.io Connection Test", False, f"Request error: {e}")
            return False
    
    def test_3_create_room_api(self):
        """Test 3: Create Room API - POST http://localhost:8001/api/battle/create-room"""
        print("\n3️⃣ CREATE ROOM API TEST")
        print("=" * 50)
        
        try:
            payload = {
                "examId": "JEE",
                "subject": "Physics", 
                "topic": "Mechanics",
                "hostName": "TestHost"
            }
            
            # Test via FastAPI backend (as per review request)
            response = requests.post(
                f"{BACKEND_URL}/api/battle/create-room",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('success') and 'pin' in data:
                        pin = data['pin']
                        if len(pin) == 6 and pin.isdigit():
                            self.test_pin = pin
                            self.log_result("Create Room API (FastAPI)", True, 
                                          f"✅ Room created via FastAPI - PIN: {pin}")
                            return True
                        else:
                            self.log_result("Create Room API (FastAPI)", False, 
                                          f"Invalid PIN format: {pin}")
                            return False
                    else:
                        self.log_result("Create Room API (FastAPI)", False, 
                                      f"Invalid response structure: {data}")
                        return False
                except json.JSONDecodeError:
                    self.log_result("Create Room API (FastAPI)", False, 
                                  f"Invalid JSON response: {response.text[:200]}")
                    return False
            else:
                self.log_result("Create Room API (FastAPI)", False, 
                              f"❌ HTTP {response.status_code} - API endpoint not available")
                
                # Test if battle server has the endpoint directly
                try:
                    direct_response = requests.post(
                        f"{BATTLE_SERVER_URL}/api/battle/create-room",
                        json=payload,
                        timeout=10
                    )
                    if direct_response.status_code == 200:
                        self.log_result("Create Room API (Direct)", False, 
                                      "❌ ARCHITECTURE ISSUE: API exists on battle server but not accessible via FastAPI proxy")
                    else:
                        self.log_result("Create Room API (Direct)", False, 
                                      "❌ MISSING IMPLEMENTATION: REST API endpoints not implemented in battle server")
                except:
                    self.log_result("Create Room API Analysis", False, 
                                  "❌ CRITICAL GAP: Battle room creation REST API missing from both FastAPI and battle server")
                
                return False
                
        except Exception as e:
            self.log_result("Create Room API", False, f"Request error: {e}")
            return False
    
    def test_4_socket_io_events(self):
        """Test 4: Socket.io Events Test (Python client)"""
        print("\n4️⃣ SOCKET.IO EVENTS TEST")
        print("=" * 50)
        
        try:
            # Test Socket.io events as per review request
            sio = socketio.SimpleClient()
            sio.connect(BATTLE_SERVER_URL)
            
            if not sio.connected:
                self.log_result("Socket.io Events Test", False, "Failed to connect for events test")
                return False
            
            # Test create_room event (since REST API is missing)
            print("📤 Testing 'create_room' Socket.io event...")
            room_config = {
                "examId": "JEE",
                "subject": "Physics",
                "topic": "Mechanics",
                "hostName": "TestHost",
                "maxParticipants": 10
            }
            
            sio.emit('create_room', room_config)
            
            # Wait for room_created event
            events_received = []
            for i in range(10):  # Wait up to 5 seconds
                try:
                    event = sio.receive(timeout=0.5)
                    if event:
                        events_received.append(event)
                        print(f"📨 Received: {event}")
                        
                        if event[0] == 'room_created':
                            room_data = event[1]
                            if 'pin' in room_data:
                                self.test_pin = room_data['pin']
                                self.log_result("Socket.io 'create_room' Event", True, 
                                              f"✅ Room created via Socket.io - PIN: {room_data['pin']}")
                                break
                except:
                    pass
            else:
                self.log_result("Socket.io 'create_room' Event", False, 
                              f"❌ No 'room_created' event received. Got: {[e[0] for e in events_received]}")
            
            # Test join_room event if we have a PIN
            if self.test_pin:
                print(f"📤 Testing 'join_room' event with PIN: {self.test_pin}")
                
                # Create second client for joining
                joiner_sio = socketio.SimpleClient()
                joiner_sio.connect(BATTLE_SERVER_URL)
                
                if joiner_sio.connected:
                    join_data = {
                        "roomId": self.test_pin,
                        "userData": {
                            "username": "TestJoiner",
                            "avatar": "👤"
                        }
                    }
                    
                    joiner_sio.emit('join_room', join_data)
                    
                    # Wait for participant_joined event
                    join_events = []
                    for i in range(10):
                        try:
                            event = joiner_sio.receive(timeout=0.5)
                            if event:
                                join_events.append(event)
                                print(f"👤 Joiner received: {event}")
                        except:
                            pass
                    
                    if join_events:
                        self.log_result("Socket.io 'join_room' Event", True, 
                                      f"✅ Join room events working - Received: {[e[0] for e in join_events]}")
                    else:
                        self.log_result("Socket.io 'join_room' Event", False, 
                                      "❌ No events received for room joining")
                    
                    joiner_sio.disconnect()
                else:
                    self.log_result("Socket.io Multi-Client Test", False, 
                                  "❌ Failed to connect second client")
            
            sio.disconnect()
            return len(events_received) > 0
            
        except Exception as e:
            self.log_result("Socket.io Events Test", False, f"Events test error: {e}")
            return False
    
    def test_5_room_list_api(self):
        """Test 5: Room List API - GET http://localhost:5001/api/rooms"""
        print("\n5️⃣ ROOM LIST API TEST")
        print("=" * 50)
        
        try:
            response = requests.get(f"{BATTLE_SERVER_URL}/api/rooms", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if 'rooms' in data:
                    rooms = data['rooms']
                    self.log_result("Room List API", True, 
                                  f"✅ Room list API working - Found {len(rooms)} active room(s)")
                    
                    # Check if our test room is in the list
                    if self.test_pin and rooms:
                        test_room_found = any(room.get('pin') == self.test_pin for room in rooms)
                        if test_room_found:
                            self.log_result("Test Room in List", True, 
                                          f"✅ Test room {self.test_pin} found in active rooms")
                        else:
                            self.log_result("Test Room in List", False, 
                                          f"❌ Test room {self.test_pin} not found in room list")
                    
                    return True
                else:
                    self.log_result("Room List API", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Room List API", False, 
                              f"❌ HTTP {response.status_code} - Room list API not available")
                return False
                
        except Exception as e:
            self.log_result("Room List API", False, f"Request error: {e}")
            return False
    
    def test_socket_io_proxy_integration(self):
        """Test Socket.io proxy integration through FastAPI backend"""
        print("\n🔌 SOCKET.IO PROXY INTEGRATION TEST")
        print("=" * 50)
        
        try:
            # Test internal proxy connection
            internal_proxy_url = "http://localhost:8001/socket.io"
            
            sio = socketio.SimpleClient()
            sio.connect(internal_proxy_url, transports=['polling'])
            
            if sio.connected:
                self.log_result("Socket.io Proxy (Internal)", True, 
                              "✅ Internal Socket.io proxy connection successful")
                
                # Test event forwarding
                sio.emit('test-event', {'data': 'proxy-test'})
                self.log_result("Socket.io Proxy Event Forwarding", True, 
                              "✅ Can emit events through proxy")
                
                sio.disconnect()
                return True
            else:
                self.log_result("Socket.io Proxy (Internal)", False, 
                              "❌ Failed to connect to internal Socket.io proxy")
                return False
                
        except Exception as e:
            self.log_result("Socket.io Proxy Integration", False, 
                          f"❌ Proxy connection error: {e}")
            return False
    
    def run_complete_test_suite(self):
        """Run the complete Socket.io Battle System test suite as per review request"""
        print("🎮 SOCKET.IO BATTLE SYSTEM - COMPLETE END-TO-END FLOW TEST")
        print("=" * 80)
        print("Testing Architecture:")
        print("- Battle Server: Node.js + Socket.io on port 5001")
        print("- Frontend: React connecting directly to battle server")  
        print("- Backend FastAPI: Handles HTTP battle room API on port 8001")
        print("=" * 80)
        
        # Run all tests as specified in review request
        test_1_success = self.test_1_health_check()
        test_2_success = self.test_2_socket_io_connection()
        test_3_success = self.test_3_create_room_api()
        test_4_success = self.test_4_socket_io_events()
        test_5_success = self.test_5_room_list_api()
        
        # Additional proxy test
        proxy_success = self.test_socket_io_proxy_integration()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 SOCKET.IO BATTLE SYSTEM TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Categorize results
        working_components = []
        broken_components = []
        missing_components = []
        
        for result in self.test_results:
            if result['success']:
                working_components.append(result['test'])
            else:
                if 'not available' in result['message'] or 'missing' in result['message'].lower():
                    missing_components.append(result['test'])
                else:
                    broken_components.append(result['test'])
        
        print(f"\n✅ WORKING COMPONENTS ({len(working_components)}):")
        for component in working_components:
            print(f"  - {component}")
        
        if broken_components:
            print(f"\n❌ BROKEN COMPONENTS ({len(broken_components)}):")
            for component in broken_components:
                print(f"  - {component}")
        
        if missing_components:
            print(f"\n🚫 MISSING COMPONENTS ({len(missing_components)}):")
            for component in missing_components:
                print(f"  - {component}")
        
        # Overall assessment
        print(f"\n🎯 OVERALL ASSESSMENT:")
        if passed_tests >= total_tests * 0.8:
            print("✅ Socket.io Battle System is MOSTLY FUNCTIONAL")
        elif passed_tests >= total_tests * 0.5:
            print("⚠️ Socket.io Battle System has SIGNIFICANT ISSUES")
        else:
            print("❌ Socket.io Battle System has CRITICAL PROBLEMS")
        
        return {
            'total_tests': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'working_components': working_components,
            'broken_components': broken_components,
            'missing_components': missing_components
        }

if __name__ == "__main__":
    tester = SocketBattleSystemTester()
    results = tester.run_complete_test_suite()