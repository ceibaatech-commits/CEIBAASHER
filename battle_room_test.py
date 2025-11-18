#!/usr/bin/env python3
"""
Battle Room System Test Suite
Tests the updated battle_rooms.py file to ensure all functionality remains intact
"""

import requests
import json
import time
import socketio
import asyncio
from pymongo import MongoClient
import sys
import os
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
import uuid

# Load environment variables
load_dotenv('/app/backend/.env')

# Configuration
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

# Get backend URL from frontend .env
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.split('=')[1].strip()
            break
    else:
        BACKEND_URL = "https://quizroom-revival.preview.emergentagent.com"

class BattleRoomTester:
    def __init__(self):
        self.mongo_client = None
        self.db = None
        self.test_results = []
        self.test_room_pin = None
        
    def setup_mongo(self):
        """Setup MongoDB connection for verification"""
        try:
            self.mongo_client = MongoClient(MONGO_URL)
            self.db = self.mongo_client[DB_NAME]
            # Test connection
            self.mongo_client.admin.command('ping')
            print("✅ MongoDB connection established")
            return True
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            return False
    
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

    def test_battle_room_joining_comprehensive(self):
        """
        Test the complete battle room joining flow as per review request:
        1. Room Creation Flow - POST /api/battle/create-room endpoint
        2. Socket.IO Connection - /api/battlews/socket.io
        3. Room Joining Flow - 'join_room' events
        4. Room State Persistence - MongoDB storage
        """
        print("\n🎯 TESTING BATTLE ROOM SYSTEM - COMPREHENSIVE")
        print("=" * 70)
        
        success_count = 0
        total_tests = 0
        
        # Test Scenario 1: Room Creation Flow
        print("\n🏠 TEST SCENARIO 1: Room Creation Flow")
        print("-" * 60)
        
        scenario1_success = self.test_battle_room_creation_flow()
        if scenario1_success:
            success_count += 1
        total_tests += 1
        
        # Test Scenario 2: Socket.IO Connection
        print("\n🔌 TEST SCENARIO 2: Socket.IO Connection")
        print("-" * 60)
        
        scenario2_success = self.test_battle_socketio_connection()
        if scenario2_success:
            success_count += 1
        total_tests += 1
        
        # Test Scenario 3: Room Joining Flow
        print("\n👥 TEST SCENARIO 3: Room Joining Flow")
        print("-" * 60)
        
        scenario3_success = self.test_battle_room_joining_flow()
        if scenario3_success:
            success_count += 1
        total_tests += 1
        
        # Test Scenario 4: Room State Persistence
        print("\n💾 TEST SCENARIO 4: Room State Persistence")
        print("-" * 60)
        
        scenario4_success = self.test_battle_room_persistence()
        if scenario4_success:
            success_count += 1
        total_tests += 1
        
        # Overall result
        success_rate = (success_count / total_tests) * 100
        
        if success_count == total_tests:
            self.log_result("Battle Room System - COMPREHENSIVE TEST", True, 
                          f"✅ ALL SCENARIOS PASSED ({success_count}/{total_tests} - {success_rate:.1f}% success rate)")
        else:
            self.log_result("Battle Room System - COMPREHENSIVE TEST", False, 
                          f"❌ SOME SCENARIOS FAILED ({success_count}/{total_tests} - {success_rate:.1f}% success rate)")
        
        return success_count == total_tests

    def test_battle_room_creation_flow(self):
        """
        Test Scenario 1: Room Creation Flow
        1. Test POST /api/battle/create-room endpoint
        2. Verify room creation returns valid 6-digit PIN
        3. Confirm room is saved to MongoDB
        4. Check that room can be fetched via GET /api/battle/room/{PIN}
        """
        try:
            # Step 1: Login as demo1 for authentication
            print("1️⃣ Logging in as demo1...")
            
            login_payload = {
                "username": "demo1",
                "password": "demo1"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/auth/demo-login",
                json=login_payload,
                timeout=30
            )
            
            if response.status_code != 200:
                self.log_result("Demo1 Login for Battle Room", False, 
                              f"Login failed: HTTP {response.status_code} - {response.text}")
                return False
            
            login_data = response.json()
            if 'access_token' not in login_data:
                self.log_result("Demo1 Login for Battle Room", False, 
                              f"No access token in response: {login_data}")
                return False
            
            jwt_token = login_data['access_token']
            user_info = login_data.get('user', {})
            
            self.log_result("Demo1 Login for Battle Room", True, 
                          f"✅ Login successful for user: {user_info.get('name')}")
            
            # Step 2: Create battle room via POST /api/battle/create-room
            print("2️⃣ Creating battle room...")
            
            room_payload = {
                "hostName": "Demo Student 1",
                "examId": "JEE",
                "subject": "Physics",
                "topic": "Mechanics",
                "maxParticipants": 10,
                "timePerQuestion": 30
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/battle/create-room",
                json=room_payload,
                timeout=30
            )
            
            if response.status_code != 200:
                self.log_result("Battle Room Creation API", False, 
                              f"Room creation failed: HTTP {response.status_code} - {response.text}")
                return False
            
            room_data = response.json()
            if not room_data.get('success') or 'pin' not in room_data:
                self.log_result("Battle Room Creation API", False, 
                              f"Invalid room creation response: {room_data}")
                return False
            
            room_pin = room_data['pin']
            room_info = room_data.get('room', {})
            
            # Step 3: Verify room PIN format (6-digit)
            print("3️⃣ Verifying room PIN format...")
            
            if len(room_pin) == 6 and room_pin.isdigit():
                self.log_result("Battle Room PIN Format", True, 
                              f"✅ Valid 6-digit PIN generated: {room_pin}")
                self.test_room_pin = room_pin  # Store for later tests
            else:
                self.log_result("Battle Room PIN Format", False, 
                              f"❌ Invalid PIN format: {room_pin} (expected 6 digits)")
                return False
            
            # Step 4: Verify room structure
            print("4️⃣ Verifying room data structure...")
            
            expected_fields = ['roomId', 'host', 'participants', 'status', 'config']
            missing_fields = [field for field in expected_fields if field not in room_info]
            
            if not missing_fields:
                self.log_result("Battle Room Data Structure", True, 
                              "✅ Room has all required fields")
                
                # Verify host information
                host_info = room_info.get('host', {})
                if host_info.get('username') == "Demo Student 1" and host_info.get('isHost') == True:
                    self.log_result("Battle Room Host Info", True, 
                                  "✅ Host information correct")
                else:
                    self.log_result("Battle Room Host Info", False, 
                                  f"❌ Host info incorrect: {host_info}")
                
                # Verify room status
                if room_info.get('status') == 'waiting':
                    self.log_result("Battle Room Initial Status", True, 
                                  "✅ Room status is 'waiting'")
                else:
                    self.log_result("Battle Room Initial Status", False, 
                                  f"❌ Unexpected status: {room_info.get('status')}")
                
            else:
                self.log_result("Battle Room Data Structure", False, 
                              f"❌ Missing fields: {missing_fields}")
                return False
            
            # Step 5: Test GET /api/battle/room/{PIN}
            print("5️⃣ Testing room retrieval via GET endpoint...")
            
            response = requests.get(
                f"{BACKEND_URL}/api/battle/room/{room_pin}",
                timeout=30
            )
            
            if response.status_code != 200:
                self.log_result("Battle Room Retrieval API", False, 
                              f"Room retrieval failed: HTTP {response.status_code} - {response.text}")
                return False
            
            retrieval_data = response.json()
            if not retrieval_data.get('success') or 'room' not in retrieval_data:
                self.log_result("Battle Room Retrieval API", False, 
                              f"Invalid retrieval response: {retrieval_data}")
                return False
            
            retrieved_room = retrieval_data['room']
            if retrieved_room.get('roomId') == room_pin:
                self.log_result("Battle Room Retrieval API", True, 
                              f"✅ Room successfully retrieved via GET /api/battle/room/{room_pin}")
            else:
                self.log_result("Battle Room Retrieval API", False, 
                              f"❌ Retrieved room ID mismatch: {retrieved_room.get('roomId')} != {room_pin}")
                return False
            
            return True
            
        except Exception as e:
            self.log_result("Battle Room Creation Flow", False, f"❌ Test error: {e}")
            import traceback
            traceback.print_exc()
            return False

    def test_battle_socketio_connection(self):
        """
        Test Scenario 2: Socket.IO Connection
        1. Test Socket.IO connection to /api/battlews/socket.io
        2. Verify handshake completes successfully
        3. Confirm connection remains stable
        """
        try:
            # Step 1: Test Socket.IO connection to external URL
            print("1️⃣ Testing Socket.IO connection to /api/battlews...")
            
            socketio_url = f"{BACKEND_URL}/api/battlews"
            
            sio = socketio.SimpleClient()
            
            # Connect with specific socketio_path and engineio version
            sio.connect(socketio_url, socketio_path='/socket.io', engineio_logger=False)
            
            if not sio.connected:
                self.log_result("Socket.IO Connection to /api/battlews", False, 
                              "❌ Failed to connect to Socket.IO server")
                return False
            
            self.log_result("Socket.IO Connection to /api/battlews", True, 
                          "✅ Successfully connected to Socket.IO server")
            
            # Step 2: Test handshake completion
            print("2️⃣ Testing Socket.IO handshake...")
            
            # Wait a moment for handshake to complete
            time.sleep(1)
            
            if sio.connected:
                self.log_result("Socket.IO Handshake", True, 
                              "✅ Handshake completed successfully")
            else:
                self.log_result("Socket.IO Handshake", False, 
                              "❌ Connection lost during handshake")
                return False
            
            # Step 3: Test connection stability
            print("3️⃣ Testing connection stability...")
            
            # Test basic event emission
            try:
                sio.emit('test-event', {'data': 'connection test'})
                self.log_result("Socket.IO Event Emission", True, 
                              "✅ Can emit events to server")
            except Exception as e:
                self.log_result("Socket.IO Event Emission", False, 
                              f"❌ Event emission failed: {e}")
                sio.disconnect()
                return False
            
            # Wait and check if still connected
            time.sleep(2)
            
            if sio.connected:
                self.log_result("Socket.IO Connection Stability", True, 
                              "✅ Connection remains stable")
            else:
                self.log_result("Socket.IO Connection Stability", False, 
                              "❌ Connection became unstable")
                return False
            
            # Clean up
            sio.disconnect()
            
            return True
            
        except Exception as e:
            self.log_result("Socket.IO Connection Test", False, f"❌ Connection error: {e}")
            import traceback
            traceback.print_exc()
            return False

    def test_battle_room_joining_flow(self):
        """
        Test Scenario 3: Room Joining Flow
        1. Test host joining room via 'join_room' event
        2. Verify 'room_joined' event is received
        3. Test second player joining same room
        4. Confirm both players see each other via 'participant_joined' events
        5. Verify room participant count updates correctly
        """
        if not hasattr(self, 'test_room_pin') or not self.test_room_pin:
            self.log_result("Room Joining Flow", False, 
                          "❌ No room PIN available from creation test")
            return False
        
        try:
            # Step 1: Connect host client
            print("1️⃣ Connecting host client...")
            
            socketio_url = f"{BACKEND_URL}/api/battlews"
            
            host_client = socketio.SimpleClient()
            host_client.connect(socketio_url, socketio_path='/socket.io')
            
            if not host_client.connected:
                self.log_result("Host Socket.IO Connection", False, 
                              "❌ Host failed to connect")
                return False
            
            self.log_result("Host Socket.IO Connection", True, 
                          "✅ Host connected successfully")
            
            # Step 2: Host joins room
            print("2️⃣ Host joining room...")
            
            host_user_data = {
                "username": "Host",
                "avatar": "👑",
                "isHost": True
            }
            
            host_events = []
            
            # Set up event listener for host
            def host_room_joined(data):
                host_events.append(('room_joined', data))
                print(f"🏠 Host received room_joined: {data}")
            
            def host_participant_joined(data):
                host_events.append(('participant_joined', data))
                print(f"🏠 Host received participant_joined: {data}")
            
            host_client.on('room_joined', host_room_joined)
            host_client.on('participant_joined', host_participant_joined)
            
            # Emit join_room event
            host_client.emit('join_room', {
                'roomId': self.test_room_pin,
                'userData': host_user_data
            })
            
            # Wait for response
            time.sleep(3)
            
            # Check if host received room_joined event
            room_joined_events = [e for e in host_events if e[0] == 'room_joined']
            
            if room_joined_events:
                room_data = room_joined_events[0][1]
                participant_count = room_data.get('room', {}).get('participantCount', 0)
                
                self.log_result("Host Room Joined Event", True, 
                              f"✅ Host received room_joined event with {participant_count} participant(s)")
                
                if participant_count == 1:
                    self.log_result("Host Room Participant Count", True, 
                                  "✅ Correct participant count (1) for host")
                else:
                    self.log_result("Host Room Participant Count", False, 
                                  f"❌ Unexpected participant count: {participant_count}")
            else:
                self.log_result("Host Room Joined Event", False, 
                              "❌ Host did not receive room_joined event")
                host_client.disconnect()
                return False
            
            # Step 3: Connect second player
            print("3️⃣ Connecting second player...")
            
            player2_client = socketio.SimpleClient()
            player2_client.connect(socketio_url, socketio_path='/socket.io')
            
            if not player2_client.connected:
                self.log_result("Player2 Socket.IO Connection", False, 
                              "❌ Player2 failed to connect")
                host_client.disconnect()
                return False
            
            self.log_result("Player2 Socket.IO Connection", True, 
                          "✅ Player2 connected successfully")
            
            # Step 4: Player2 joins room
            print("4️⃣ Player2 joining room...")
            
            player2_user_data = {
                "username": "Player2",
                "avatar": "👤",
                "isHost": False
            }
            
            player2_events = []
            
            # Set up event listener for player2
            def player2_room_joined(data):
                player2_events.append(('room_joined', data))
                print(f"👤 Player2 received room_joined: {data}")
            
            def player2_participant_joined(data):
                player2_events.append(('participant_joined', data))
                print(f"👤 Player2 received participant_joined: {data}")
            
            player2_client.on('room_joined', player2_room_joined)
            player2_client.on('participant_joined', player2_participant_joined)
            
            # Clear host events to track new ones
            host_events.clear()
            
            # Emit join_room event for player2
            player2_client.emit('join_room', {
                'roomId': self.test_room_pin,
                'userData': player2_user_data
            })
            
            # Wait for events to propagate
            time.sleep(3)
            
            # Step 5: Verify both players see each other
            print("5️⃣ Verifying participant visibility...")
            
            # Check if player2 received room_joined event
            player2_room_joined_events = [e for e in player2_events if e[0] == 'room_joined']
            
            if player2_room_joined_events:
                room_data = player2_room_joined_events[0][1]
                participant_count = room_data.get('room', {}).get('participantCount', 0)
                participants = room_data.get('room', {}).get('participants', [])
                
                self.log_result("Player2 Room Joined Event", True, 
                              f"✅ Player2 received room_joined event with {participant_count} participant(s)")
                
                if participant_count == 2:
                    self.log_result("Player2 Room Participant Count", True, 
                                  "✅ Correct participant count (2) after Player2 joined")
                else:
                    self.log_result("Player2 Room Participant Count", False, 
                                  f"❌ Unexpected participant count: {participant_count}")
                
                # Check if both players are visible
                usernames = [p.get('username') for p in participants]
                if 'Host' in usernames and 'Player2' in usernames:
                    self.log_result("Both Players Visible", True, 
                                  f"✅ Both players visible in participant list: {usernames}")
                else:
                    self.log_result("Both Players Visible", False, 
                                  f"❌ Missing players in list: {usernames}")
            else:
                self.log_result("Player2 Room Joined Event", False, 
                              "❌ Player2 did not receive room_joined event")
            
            # Check if host received participant_joined event for player2
            host_participant_joined_events = [e for e in host_events if e[0] == 'participant_joined']
            
            if host_participant_joined_events:
                participant_data = host_participant_joined_events[0][1]
                joined_username = participant_data.get('participant', {}).get('username')
                
                if joined_username == 'Player2':
                    self.log_result("Host Received Participant Joined", True, 
                                  f"✅ Host received participant_joined event for {joined_username}")
                else:
                    self.log_result("Host Received Participant Joined", False, 
                                  f"❌ Unexpected participant joined: {joined_username}")
            else:
                self.log_result("Host Received Participant Joined", False, 
                              "❌ Host did not receive participant_joined event")
            
            # Check if player2 received participant_joined events
            player2_participant_joined_events = [e for e in player2_events if e[0] == 'participant_joined']
            
            if player2_participant_joined_events:
                self.log_result("Player2 Received Participant Events", True, 
                              f"✅ Player2 received {len(player2_participant_joined_events)} participant_joined event(s)")
            else:
                self.log_result("Player2 Received Participant Events", True, 
                              "✅ Player2 may not receive participant_joined for themselves (expected)")
            
            # Clean up
            host_client.disconnect()
            player2_client.disconnect()
            
            return True
            
        except Exception as e:
            self.log_result("Room Joining Flow", False, f"❌ Test error: {e}")
            import traceback
            traceback.print_exc()
            return False

    def test_battle_room_persistence(self):
        """
        Test Scenario 4: Room State Persistence
        1. Verify room data is properly saved to MongoDB
        2. Check that participants are tracked correctly
        3. Confirm scores and answers structures are initialized properly
        """
        if not hasattr(self, 'test_room_pin') or not self.test_room_pin:
            self.log_result("Room State Persistence", False, 
                          "❌ No room PIN available from creation test")
            return False
        
        try:
            # Step 1: Check MongoDB connection
            print("1️⃣ Checking MongoDB connection...")
            
            if self.db is None:
                self.log_result("MongoDB Connection for Persistence", False, 
                              "❌ No database connection available")
                return False
            
            self.log_result("MongoDB Connection for Persistence", True, 
                          "✅ Database connection available")
            
            # Step 2: Query battle_rooms collection
            print("2️⃣ Querying battle_rooms collection...")
            
            battle_rooms = self.db.battle_rooms
            room_doc = battle_rooms.find_one({'roomId': self.test_room_pin})
            
            if not room_doc:
                self.log_result("Room in MongoDB", False, 
                              f"❌ Room {self.test_room_pin} not found in database")
                return False
            
            self.log_result("Room in MongoDB", True, 
                          f"✅ Room {self.test_room_pin} found in database")
            
            # Step 3: Verify room structure in database
            print("3️⃣ Verifying room structure in database...")
            
            required_fields = ['roomId', 'host', 'participants', 'status', 'config', 'scores', 'answers', 'createdAt']
            missing_fields = [field for field in required_fields if field not in room_doc]
            
            if not missing_fields:
                self.log_result("Room Database Structure", True, 
                              "✅ Room has all required fields in database")
            else:
                self.log_result("Room Database Structure", False, 
                              f"❌ Missing fields in database: {missing_fields}")
                return False
            
            # Step 4: Verify host information
            print("4️⃣ Verifying host information...")
            
            host_info = room_doc.get('host', {})
            if host_info.get('username') and host_info.get('isHost') == True:
                self.log_result("Host Info in Database", True, 
                              f"✅ Host info correct: {host_info.get('username')}")
            else:
                self.log_result("Host Info in Database", False, 
                              f"❌ Host info incorrect: {host_info}")
            
            # Step 5: Verify participants tracking
            print("5️⃣ Verifying participants tracking...")
            
            participants = room_doc.get('participants', [])
            if len(participants) >= 1:
                self.log_result("Participants Tracking", True, 
                              f"✅ {len(participants)} participant(s) tracked in database")
                
                # Check participant structure
                if participants:
                    participant = participants[0]
                    participant_fields = ['userId', 'username', 'avatar', 'isHost', 'joinedAt']
                    missing_participant_fields = [field for field in participant_fields if field not in participant]
                    
                    if not missing_participant_fields:
                        self.log_result("Participant Structure", True, 
                                      "✅ Participant has all required fields")
                    else:
                        self.log_result("Participant Structure", False, 
                                      f"❌ Missing participant fields: {missing_participant_fields}")
            else:
                self.log_result("Participants Tracking", False, 
                              "❌ No participants found in database")
            
            # Step 6: Verify scores and answers initialization
            print("6️⃣ Verifying scores and answers structures...")
            
            scores = room_doc.get('scores', {})
            answers = room_doc.get('answers', {})
            
            if isinstance(scores, dict):
                self.log_result("Scores Structure", True, 
                              f"✅ Scores structure initialized: {len(scores)} entries")
            else:
                self.log_result("Scores Structure", False, 
                              f"❌ Scores structure invalid: {type(scores)}")
            
            if isinstance(answers, dict):
                self.log_result("Answers Structure", True, 
                              f"✅ Answers structure initialized: {len(answers)} entries")
            else:
                self.log_result("Answers Structure", False, 
                              f"❌ Answers structure invalid: {type(answers)}")
            
            # Step 7: Verify room metadata
            print("7️⃣ Verifying room metadata...")
            
            created_at = room_doc.get('createdAt')
            status = room_doc.get('status')
            
            if created_at and isinstance(created_at, (int, float)):
                self.log_result("Room Creation Timestamp", True, 
                              f"✅ Creation timestamp present: {created_at}")
            else:
                self.log_result("Room Creation Timestamp", False, 
                              f"❌ Invalid creation timestamp: {created_at}")
            
            if status == 'waiting':
                self.log_result("Room Status in Database", True, 
                              f"✅ Room status correct: {status}")
            else:
                self.log_result("Room Status in Database", False, 
                              f"❌ Unexpected room status: {status}")
            
            return True
            
        except Exception as e:
            self.log_result("Room State Persistence", False, f"❌ Test error: {e}")
            import traceback
            traceback.print_exc()
            return False

    def run_all_tests(self):
        """Run all tests and print summary"""
        print("🚀 Starting Battle Room Test Suite")
        print("=" * 50)
        
        # Setup
        if not self.setup_mongo():
            print("❌ MongoDB setup failed, skipping tests")
            return
        
        # Run comprehensive test
        self.test_battle_room_joining_comprehensive()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {total - passed}")
        print(f"📈 Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['message']}")
        
        print("\n🏁 Battle Room test suite completed!")
        
        # Close MongoDB connection
        if self.mongo_client:
            self.mongo_client.close()

if __name__ == "__main__":
    tester = BattleRoomTester()
    tester.run_all_tests()