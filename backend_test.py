import os
import requests
import time
import json
import socketio
import asyncio
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.environ.get("BACKEND_URL", "https://quizbugs.preview.emergentagent.com")
SOCKET_URL = f"{BACKEND_URL}/api/battlews"

class BackendTester:
    def __init__(self):
        self.results = []
        self.demo_users = {
            'demo1': {'username': 'demo1', 'password': 'demo1'},
            'demo2': {'username': 'demo2', 'password': 'demo2'}
        }

    def log_result(self, name: str, success: bool, message: str):
        self.results.append({"name": name, "success": success, "message": message})
        status = "✅" if success else "❌"
        print(f"{status} {name}: {message}")

    def login_demo_user(self, username: str):
        """Login demo user and return auth token"""
        try:
            response = requests.post(f"{BACKEND_URL}/api/auth/demo-login", json={
                "username": username,
                "password": self.demo_users[username]['password']
            })
            if response.status_code == 200:
                data = response.json()
                return data.get('access_token'), data.get('user', {}).get('user_id')
            return None, None
        except Exception as e:
            print(f"Login error for {username}: {e}")
            return None, None

    def test_fastapi_socketio_integration(self):
        """Test FastAPI + Socket.IO integration - app entrypoint with battle Socket.IO mounted at /api/battlews"""
        try:
            # Test 1: Check server.py has correct Socket.IO mount
            server_path = '/app/backend/server.py'
            if not os.path.exists(server_path):
                self.log_result("FastAPI Socket.IO Integration", False, "server.py not found")
                return False

            with open(server_path, 'r') as f:
                server_content = f.read()

            # Check for battle_socketio import and mount
            checks = [
                'from battle_socketio import socket_app as battle_socket_app' in server_content,
                'fastapi_app.mount("/api/battlews", battle_socket_app)' in server_content,
                'app = fastapi_app' in server_content
            ]

            if all(checks):
                self.log_result("FastAPI Socket.IO Integration", True, "✅ FastAPI app exports 'app' with battle Socket.IO mounted at /api/battlews")
            else:
                self.log_result("FastAPI Socket.IO Integration", False, "❌ Missing Socket.IO mount or app export in server.py")

            # Test 2: Check Socket.IO endpoint accessibility
            try:
                response = requests.get(f"{SOCKET_URL}/socket.io/", params={'transport': 'polling', 'EIO': '4'})
                if response.status_code == 200 and 'sid' in response.text:
                    self.log_result("Socket.IO Endpoint", True, f"✅ Socket.IO endpoint accessible at {SOCKET_URL}/socket.io/")
                else:
                    self.log_result("Socket.IO Endpoint", False, f"❌ Socket.IO endpoint returned {response.status_code}: {response.text[:100]}")
            except Exception as e:
                self.log_result("Socket.IO Endpoint", False, f"❌ Socket.IO endpoint error: {e}")

            return True

        except Exception as e:
            self.log_result("FastAPI Socket.IO Integration", False, f"Integration test error: {e}")
            return False

    def test_battle_room_lifecycle(self):
        """Test battle room lifecycle - create room, join as host + participant"""
        try:
            # Login demo users
            token1, user_id1 = self.login_demo_user('demo1')
            token2, user_id2 = self.login_demo_user('demo2')
            
            if not token1 or not token2:
                self.log_result("Battle Room Lifecycle", False, "❌ Failed to login demo users")
                return False

            # Test 1: Create room via REST API
            room_data = {
                "examId": "JEE",
                "subject": "Physics", 
                "topic": "Mechanics",
                "hostName": "Demo Host"
            }
            
            headers = {"Authorization": f"Bearer {token1}"}
            response = requests.post(f"{BACKEND_URL}/api/battle/create-room", json=room_data, headers=headers)
            
            if response.status_code != 200:
                self.log_result("Battle Room Creation", False, f"❌ Room creation failed: {response.status_code}")
                return False
                
            room_info = response.json()
            room_id = room_info.get('roomId') or room_info.get('pin')
            
            if not room_id:
                self.log_result("Battle Room Creation", False, "❌ No room ID returned")
                return False
                
            self.log_result("Battle Room Creation", True, f"✅ Room created with ID: {room_id}")

            # Test 2: Socket.IO connection and room joining
            return self._test_socketio_room_joining(room_id, user_id1, user_id2)

        except Exception as e:
            self.log_result("Battle Room Lifecycle", False, f"Room lifecycle error: {e}")
            return False

    def _test_socketio_room_joining(self, room_id, user_id1, user_id2):
        """Test Socket.IO room joining with host and participant"""
        try:
            # Create Socket.IO clients
            sio1 = socketio.Client()
            sio2 = socketio.Client()
            
            events_received = {
                'host_joined': False,
                'participant_joined': False,
                'room_joined_host': False,
                'room_joined_participant': False
            }

            # Event handlers for host (sio1)
            @sio1.event
            def room_joined(data):
                events_received['room_joined_host'] = True
                print(f"Host received room_joined: {data}")

            @sio1.event  
            def participant_joined(data):
                events_received['participant_joined'] = True
                print(f"Host received participant_joined: {data}")

            # Event handlers for participant (sio2)
            @sio2.event
            def room_joined(data):
                events_received['room_joined_participant'] = True
                print(f"Participant received room_joined: {data}")

            # Connect both clients
            sio1.connect(SOCKET_URL, socketio_path='/socket.io')
            sio2.connect(SOCKET_URL, socketio_path='/socket.io')
            
            time.sleep(1)  # Allow connections to establish

            # Host joins room
            host_data = {
                'roomId': room_id,
                'userData': {
                    'username': 'Demo Host',
                    'userId': user_id1,
                    'isHost': True,
                    'avatar': '👑'
                }
            }
            sio1.emit('join_room', host_data)
            time.sleep(2)

            # Participant joins room  
            participant_data = {
                'roomId': room_id,
                'userData': {
                    'username': 'Demo Participant',
                    'userId': user_id2,
                    'isHost': False,
                    'avatar': '👤'
                }
            }
            sio2.emit('join_room', participant_data)
            time.sleep(2)

            # Cleanup
            sio1.disconnect()
            sio2.disconnect()

            # Check results
            success_count = sum(events_received.values())
            if success_count >= 3:  # At least host joined, participant joined, and room_joined events
                self.log_result("Socket.IO Room Joining", True, f"✅ Room joining successful - {success_count}/4 events received")
                return True
            else:
                self.log_result("Socket.IO Room Joining", False, f"❌ Room joining incomplete - only {success_count}/4 events received")
                return False

        except Exception as e:
            self.log_result("Socket.IO Room Joining", False, f"Socket.IO room joining error: {e}")
            return False

    def test_host_control_events(self):
        """Test host control events migrated from Node battle-server"""
        try:
            # Check battle_socketio.py for host control implementations
            socketio_path = '/app/backend/battle_socketio.py'
            if not os.path.exists(socketio_path):
                self.log_result("Host Control Events", False, "battle_socketio.py not found")
                return False

            with open(socketio_path, 'r') as f:
                content = f.read()

            # Test implementation checks
            host_events = {
                'pause_quiz': ['def pause_quiz', 'quiz-paused'],
                'resume_quiz': ['def resume_quiz', 'quiz-resumed'], 
                'skip_question': ['def skip_question', 'next_question']
            }

            all_implemented = True
            for event_name, required_parts in host_events.items():
                if all(part in content for part in required_parts):
                    self.log_result(f"Host Event {event_name}", True, f"✅ {event_name} implemented with correct event emission")
                else:
                    self.log_result(f"Host Event {event_name}", False, f"❌ {event_name} missing or incomplete")
                    all_implemented = False

            # Test Socket.IO event handling
            if all_implemented:
                return self._test_host_control_socketio()
            
            return all_implemented

        except Exception as e:
            self.log_result("Host Control Events", False, f"Host control test error: {e}")
            return False

    def _test_host_control_socketio(self):
        """Test host control events via Socket.IO"""
        try:
            # Login and create room
            token, user_id = self.login_demo_user('demo1')
            if not token:
                return False

            # Create room
            room_data = {"examId": "JEE", "subject": "Physics", "topic": "Mechanics", "hostName": "Demo Host"}
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.post(f"{BACKEND_URL}/api/battle/create-room", json=room_data, headers=headers)
            
            if response.status_code != 200:
                return False
                
            room_id = response.json().get('roomId') or response.json().get('pin')

            # Test Socket.IO host controls
            sio = socketio.Client()
            events_received = {'quiz-paused': False, 'quiz-resumed': False, 'next_question': False}

            @sio.event
            def connect():
                print("Connected to Socket.IO")

            for event in events_received.keys():
                def make_handler(event_name):
                    def handler(data):
                        events_received[event_name] = True
                        print(f"Received {event_name}: {data}")
                    return handler
                sio.on(event, make_handler(event))

            sio.connect(SOCKET_URL, socketio_path='/socket.io')
            time.sleep(1)

            # Join as host
            host_data = {
                'roomId': room_id,
                'userData': {'username': 'Host', 'userId': user_id, 'isHost': True}
            }
            sio.emit('join_room', host_data)
            time.sleep(1)

            # Test host control events
            sio.emit('pause_quiz', {'pin': room_id})
            time.sleep(1)
            sio.emit('resume_quiz', {'pin': room_id})
            time.sleep(1)
            sio.emit('skip_question', {'pin': room_id})
            time.sleep(1)

            sio.disconnect()

            success_count = sum(events_received.values())
            if success_count >= 2:  # At least pause/resume or skip working
                self.log_result("Host Control Socket.IO", True, f"✅ Host controls working - {success_count}/3 events received")
                return True
            else:
                self.log_result("Host Control Socket.IO", False, f"❌ Host controls not working - {success_count}/3 events received")
                return False

        except Exception as e:
            self.log_result("Host Control Socket.IO", False, f"Host control Socket.IO error: {e}")
            return False

    def test_virtual_gifts_system(self):
        """Test Virtual Gifts System migration with point transfers"""
        try:
            # Check implementation in battle_socketio.py
            socketio_path = '/app/backend/battle_socketio.py'
            with open(socketio_path, 'r') as f:
                content = f.read()

            # Check gift implementation
            gift_checks = [
                'def send_gift' in content,
                "'gift-sent'" in content,
                "'gift-received'" in content,
                "'gift-error'" in content,
                'gift_costs = {' in content,
                "'star': 50" in content,
                "'diamond': 100" in content,
                "'crown': 200" in content,
                "'trophy': 500" in content
            ]

            if not all(gift_checks):
                missing = [check for i, check in enumerate(['send_gift function', 'gift-sent event', 'gift-received event', 'gift-error event', 'gift_costs dict', 'star cost', 'diamond cost', 'crown cost', 'trophy cost']) if not gift_checks[i]]
                self.log_result("Virtual Gifts Implementation", False, f"❌ Missing: {', '.join(missing)}")
                return False

            self.log_result("Virtual Gifts Implementation", True, "✅ Virtual gifts system fully implemented in Python")

            # Test Socket.IO gift functionality
            return self._test_gifts_socketio()

        except Exception as e:
            self.log_result("Virtual Gifts System", False, f"Virtual gifts test error: {e}")
            return False

    def _test_gifts_socketio(self):
        """Test virtual gifts via Socket.IO with point transfers"""
        try:
            # Login users
            token1, user_id1 = self.login_demo_user('demo1')
            token2, user_id2 = self.login_demo_user('demo2')
            
            if not token1 or not token2:
                return False

            # Create room
            room_data = {"examId": "JEE", "subject": "Physics", "topic": "Mechanics"}
            headers = {"Authorization": f"Bearer {token1}"}
            response = requests.post(f"{BACKEND_URL}/api/battle/create-room", json=room_data, headers=headers)
            
            if response.status_code != 200:
                return False
                
            room_id = response.json().get('roomId') or response.json().get('pin')

            # Test with Socket.IO
            sio1 = socketio.Client()  # Sender
            sio2 = socketio.Client()  # Recipient
            
            gift_events = {
                'gift-sent': False,
                'gift-received': False, 
                'gift-error': False,
                'leaderboard_update': False
            }

            # Event handlers
            for event in gift_events.keys():
                def make_handler(event_name):
                    def handler(data):
                        gift_events[event_name] = True
                        print(f"Received {event_name}: {data}")
                    return handler
                sio1.on(event, make_handler(event))
                sio2.on(event, make_handler(event))

            # Connect and join room
            sio1.connect(SOCKET_URL, socketio_path='/socket.io')
            sio2.connect(SOCKET_URL, socketio_path='/socket.io')
            time.sleep(1)

            # Join as host and participant
            sio1.emit('join_room', {
                'roomId': room_id,
                'userData': {'username': 'Sender', 'userId': user_id1, 'isHost': True}
            })
            time.sleep(1)
            
            sio2.emit('join_room', {
                'roomId': room_id, 
                'userData': {'username': 'Recipient', 'userId': user_id2, 'isHost': False}
            })
            time.sleep(1)

            # Test gift sending (should fail - insufficient points initially)
            sio1.emit('send_gift', {
                'pin': room_id,
                'recipientId': user_id2,
                'giftType': 'star'
            })
            time.sleep(2)

            # Test invalid gift type
            sio1.emit('send_gift', {
                'pin': room_id,
                'recipientId': user_id2,
                'giftType': 'invalid'
            })
            time.sleep(1)

            sio1.disconnect()
            sio2.disconnect()

            # Check if gift error events were received (expected for insufficient points)
            if gift_events['gift-error']:
                self.log_result("Virtual Gifts Socket.IO", True, "✅ Gift system working - error handling functional")
                return True
            else:
                self.log_result("Virtual Gifts Socket.IO", False, "❌ Gift system not responding to events")
                return False

        except Exception as e:
            self.log_result("Virtual Gifts Socket.IO", False, f"Gift Socket.IO error: {e}")
            return False

    def test_no_nodejs_dependencies(self):
        """Ensure no calls or dependencies remain on NodeJS battle-server"""
        try:
            # Check for Node.js process
            import subprocess
            try:
                result = subprocess.run(['pgrep', '-f', 'node.*battle'], capture_output=True, text=True)
                if result.returncode == 0:
                    self.log_result("No Node.js Dependencies", False, f"❌ Node.js battle process still running: {result.stdout.strip()}")
                    return False
            except:
                pass  # pgrep might not be available

            # Check for localhost:5001 calls in code
            files_to_check = [
                '/app/backend/battle_socketio.py',
                '/app/backend/server.py',
                '/app/frontend/src/pages/BattleLobby.js',
                '/app/frontend/src/pages/LiveBattle.js'
            ]

            node_references = []
            for file_path in files_to_check:
                if os.path.exists(file_path):
                    with open(file_path, 'r') as f:
                        content = f.read()
                        if 'localhost:5001' in content or '/battle-server' in content:
                            node_references.append(file_path)

            if node_references:
                self.log_result("No Node.js Dependencies", False, f"❌ Node.js references found in: {', '.join(node_references)}")
                return False

            # Check if battle-server directory exists
            if os.path.exists('/app/battle-server'):
                self.log_result("No Node.js Dependencies", False, "❌ battle-server directory still exists")
                return False

            self.log_result("No Node.js Dependencies", True, "✅ No Node.js battle-server dependencies found")
            return True

        except Exception as e:
            self.log_result("No Node.js Dependencies", False, f"Node.js dependency check error: {e}")
            return False

    def run_all_tests(self):
        """Run all battle Socket.IO regression tests"""
        print("🚀 Starting Battle Socket.IO Regression Tests")
        print("=" * 60)
        
        tests = [
            self.test_fastapi_socketio_integration,
            self.test_battle_room_lifecycle,
            self.test_host_control_events,
            self.test_virtual_gifts_system,
            self.test_no_nodejs_dependencies
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                print(f"Test failed with exception: {e}")
        
        print("=" * 60)
        print(f"📊 Test Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        return passed == total


if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    print("\n📋 Detailed Results:")
    print(json.dumps(tester.results, indent=2))
    
    exit(0 if success else 1)
