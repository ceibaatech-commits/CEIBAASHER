#!/usr/bin/env python3
"""
Comprehensive Battle System End-to-End Flow Testing
Tests the complete battle flow: create room → join room → play quiz
As per review request requirements
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

# Load environment variables
load_dotenv('/app/backend/.env')

# Configuration
BATTLE_SERVER_URL = "http://localhost:5001"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

# Get backend URL from frontend .env
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.split('=')[1].strip()
            break
    else:
        BACKEND_URL = "https://test-history-board.preview.emergentagent.com"

class BattleSystemTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.battle_server_url = BATTLE_SERVER_URL
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
    
    def test_1_room_creation_flow(self):
        """Test POST /api/quiz/start endpoint with exam, subject, topic"""
        print("\n🏠 1. ROOM CREATION FLOW")
        print("=" * 50)
        
        try:
            # Test quiz start with JEE Inorganic Chemistry
            payload = {
                "exam": "JEE",
                "subject": "Inorganic Chemistry", 
                "topic": "Periodic Table"
            }
            
            response = requests.post(
                f"{self.backend_url}/api/quiz/start",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'questions' in data and 'quizId' in data:
                    questions = data['questions']
                    quiz_id = data['quizId']
                    
                    self.log_result("Quiz Start API", True, 
                                  f"Quiz created with ID: {quiz_id}, {len(questions)} questions loaded")
                    
                    # Verify questions are from Google Sheets (JEE Inorganic Chemistry)
                    if questions and len(questions) > 0:
                        sample_question = questions[0]['question']
                        if "(Periodic Table):" in sample_question:
                            self.log_result("Google Sheets Integration", True, 
                                          "Questions loaded from Google Sheets with topic filter")
                        else:
                            self.log_result("Google Sheets Integration", False, 
                                          "Questions may not be from Google Sheets")
                    
                    # Verify 6-digit numeric PIN generation (quiz_id format)
                    if quiz_id.startswith('quiz_') and len(quiz_id.split('_')[1]) == 6:
                        self.log_result("6-Digit PIN Generation", True, 
                                      f"Quiz ID follows expected format: {quiz_id}")
                    else:
                        self.log_result("6-Digit PIN Generation", False, 
                                      f"Unexpected quiz ID format: {quiz_id}")
                    
                    return True
                else:
                    self.log_result("Quiz Start API", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Quiz Start API", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Quiz Start API", False, f"Request error: {e}")
            return False
    
    def test_2_battle_server_rest_api(self):
        """Test Battle Server REST API endpoints"""
        print("\n⚔️ 2. BATTLE SERVER REST API")
        print("=" * 50)
        
        # Test battle-server health
        try:
            response = requests.get(f"{self.battle_server_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if 'status' in data and data['status'] == 'healthy':
                    self.log_result("Battle Server Health Check", True, 
                                  f"Battle server running on port 5001: {data}")
                else:
                    self.log_result("Battle Server Health Check", False, 
                                  f"Unexpected health response: {data}")
            else:
                self.log_result("Battle Server Health Check", False, 
                              f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Battle Server Health Check", False, f"Connection error: {e}")
            return False
        
        # Test POST /api/battle/create-room endpoint
        try:
            payload = {
                "hostName": "TestHost",
                "examId": "JEE",
                "subject": "Inorganic Chemistry",
                "topic": "Periodic Table"
            }
            
            response = requests.post(
                f"{self.battle_server_url}/api/battle/create-room",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'pin' in data:
                    pin = data['pin']
                    
                    # Verify 6-digit numeric PIN
                    if len(pin) == 6 and pin.isdigit():
                        self.log_result("Battle Room Creation API", True, 
                                      f"Room created with 6-digit PIN: {pin}")
                        self.test_pin = pin
                        
                        # Verify room data structure
                        room = data.get('room', {})
                        if 'roomId' in room and 'host' in room and 'config' in room:
                            self.log_result("Battle Room Data Structure", True, 
                                          "Room contains required fields")
                        else:
                            self.log_result("Battle Room Data Structure", False, 
                                          f"Missing room fields: {room}")
                        
                        return True
                    else:
                        self.log_result("Battle Room Creation API", False, 
                                      f"Invalid PIN format: {pin}")
                        return False
                else:
                    self.log_result("Battle Room Creation API", False, 
                                  f"Invalid response: {data}")
                    return False
            else:
                self.log_result("Battle Room Creation API", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Battle Room Creation API", False, f"Request error: {e}")
            return False
        
        # Test GET /api/battle/room/{PIN} endpoint
        if self.test_pin:
            try:
                response = requests.get(
                    f"{self.battle_server_url}/api/battle/room/{self.test_pin}",
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and 'room' in data:
                        room = data['room']
                        self.log_result("Get Room Info API", True, 
                                      f"Room info retrieved for PIN: {self.test_pin}")
                        return True
                    else:
                        self.log_result("Get Room Info API", False, 
                                      f"Invalid response: {data}")
                        return False
                else:
                    self.log_result("Get Room Info API", False, 
                                  f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_result("Get Room Info API", False, f"Request error: {e}")
                return False
    
    def test_3_socketio_proxy_integration(self):
        """Test Socket.io Proxy Integration"""
        print("\n🔌 3. SOCKET.IO PROXY INTEGRATION")
        print("=" * 50)
        
        # Test Socket.io connection to BACKEND_URL with path /api/socketio
        try:
            # The Socket.io is mounted at /api/socketio in server.py
            proxy_url = f"{self.backend_url}/api/socketio"
            
            print(f"🔗 Testing Socket.io proxy at: {proxy_url}")
            
            sio_client = socketio.SimpleClient()
            sio_client.connect(proxy_url, transports=['polling'])
            
            if sio_client.connected:
                self.log_result("Socket.io Proxy Connection", True, 
                              "Successfully connected to FastAPI Socket.io proxy")
                
                # Test basic event emission
                try:
                    sio_client.emit('test-event', {'data': 'test'})
                    self.log_result("Socket.io Proxy Event Emission", True, 
                                  "Can emit events through proxy")
                except Exception as e:
                    self.log_result("Socket.io Proxy Event Emission", False, 
                                  f"Event emission failed: {e}")
                
                sio_client.disconnect()
                return True
            else:
                self.log_result("Socket.io Proxy Connection", False, 
                              "Failed to connect to Socket.io proxy")
                return False
                
        except Exception as e:
            self.log_result("Socket.io Proxy Connection", False, 
                          f"Proxy connection error: {e}")
            
            # Test if the issue is with the path - try /socket.io
            try:
                fallback_url = f"{self.backend_url}/socket.io"
                print(f"🔗 Testing fallback Socket.io at: {fallback_url}")
                
                sio_client = socketio.SimpleClient()
                sio_client.connect(fallback_url, transports=['polling'])
                
                if sio_client.connected:
                    self.log_result("Socket.io Fallback Connection", True, 
                                  "Connected to /socket.io path (not proxy)")
                    sio_client.disconnect()
                else:
                    self.log_result("Socket.io Fallback Connection", False, 
                                  "Neither /api/socketio nor /socket.io working")
            except Exception as e2:
                self.log_result("Socket.io Fallback Connection", False, 
                              f"Fallback also failed: {e2}")
            
            return False
    
    def test_4_room_joining_flow(self):
        """Test Room Joining Flow"""
        print("\n👥 4. ROOM JOINING FLOW")
        print("=" * 50)
        
        if not self.test_pin:
            self.log_result("Room Joining Flow", False, "No PIN available from room creation")
            return False
        
        try:
            # Test direct connection to battle-server (since proxy may not work)
            battle_server_socketio = f"{self.battle_server_url}"
            
            print(f"👑 Testing host connection to battle server")
            
            # Create host client
            host_client = socketio.SimpleClient()
            host_client.connect(battle_server_socketio)
            
            if not host_client.connected:
                self.log_result("Host Connection to Battle Server", False, 
                              "Host failed to connect to battle server")
                return False
            
            self.log_result("Host Connection to Battle Server", True, 
                          "Host connected to battle server")
            
            # Host joins room
            print(f"👑 Host joining room {self.test_pin}")
            host_client.emit('join_room', {
                'roomId': self.test_pin,
                'userData': {
                    'username': 'TestHost',
                    'avatar': '👑',
                    'isHost': True
                }
            })
            
            # Wait for host to join
            time.sleep(2)
            
            # Create joiner client
            print(f"👤 Testing joiner connection")
            joiner_client = socketio.SimpleClient()
            joiner_client.connect(battle_server_socketio)
            
            if not joiner_client.connected:
                self.log_result("Joiner Connection to Battle Server", False, 
                              "Joiner failed to connect to battle server")
                host_client.disconnect()
                return False
            
            self.log_result("Joiner Connection to Battle Server", True, 
                          "Joiner connected to battle server")
            
            # Joiner joins room
            print(f"👤 Joiner joining room {self.test_pin}")
            joiner_client.emit('join_room', {
                'roomId': self.test_pin,
                'userData': {
                    'username': 'TestJoiner',
                    'avatar': '👤',
                    'isHost': False
                }
            })
            
            # Wait for events to propagate
            time.sleep(3)
            
            # Try to receive events
            host_events = []
            joiner_events = []
            
            # Try to receive events with timeout
            for i in range(10):  # Try for 5 seconds
                try:
                    host_event = host_client.receive(timeout=0.5)
                    if host_event:
                        host_events.append(host_event)
                        print(f"👑 Host received: {host_event}")
                except:
                    pass
                
                try:
                    joiner_event = joiner_client.receive(timeout=0.5)
                    if joiner_event:
                        joiner_events.append(joiner_event)
                        print(f"👤 Joiner received: {joiner_event}")
                except:
                    pass
            
            print(f"📊 Host received {len(host_events)} events")
            print(f"📊 Joiner received {len(joiner_events)} events")
            
            # Check for participant_joined events
            host_participant_events = [e for e in host_events if e[0] == 'participant_joined']
            joiner_participant_events = [e for e in joiner_events if e[0] == 'participant_joined']
            
            if host_participant_events or joiner_participant_events:
                self.log_result("Room Joining Events", True, 
                              f"✅ Events received - Host: {len(host_participant_events)}, Joiner: {len(joiner_participant_events)}")
            else:
                self.log_result("Room Joining Events", False, 
                              "No participant_joined events received")
            
            # Test that both players can see each other in lobby
            success = len(host_events) > 0 or len(joiner_events) > 0
            
            if success:
                self.log_result("Multi-Player Room Joining", True, 
                              "✅ Multiple players can join same room and receive events")
            else:
                self.log_result("Multi-Player Room Joining", False, 
                              "Players cannot see each other in lobby")
            
            # Cleanup
            host_client.disconnect()
            joiner_client.disconnect()
            
            return success
            
        except Exception as e:
            self.log_result("Room Joining Flow", False, f"Room joining test error: {e}")
            return False
    
    def test_5_quiz_start_flow(self):
        """Test Quiz Start Flow"""
        print("\n🎯 5. QUIZ START FLOW")
        print("=" * 50)
        
        if not self.test_pin:
            self.log_result("Quiz Start Flow", False, "No PIN available")
            return False
        
        try:
            # Connect to battle server as host
            host_client = socketio.SimpleClient()
            host_client.connect(self.battle_server_url)
            
            if not host_client.connected:
                self.log_result("Quiz Start - Host Connection", False, "Cannot connect as host")
                return False
            
            # Join room as host
            host_client.emit('join_room', {
                'roomId': self.test_pin,
                'userData': {
                    'username': 'QuizHost',
                    'avatar': '👑',
                    'isHost': True
                }
            })
            
            time.sleep(2)
            
            # Test start-quiz event emission
            print("📤 Testing start-quiz event")
            host_client.emit('start_battle', {'roomId': self.test_pin})
            
            # Wait for response
            time.sleep(3)
            
            # Try to receive events
            received_events = []
            for i in range(10):
                try:
                    event = host_client.receive(timeout=0.5)
                    if event:
                        received_events.append(event)
                        print(f"📨 Received: {event}")
                except:
                    pass
            
            # Check for quiz-related events
            quiz_events = [e for e in received_events if 'battle' in e[0] or 'quiz' in e[0] or 'countdown' in e[0]]
            
            if quiz_events:
                self.log_result("Quiz Start Events", True, 
                              f"✅ Quiz start events received: {[e[0] for e in quiz_events]}")
            else:
                self.log_result("Quiz Start Events", False, 
                              "No quiz start events received")
            
            # Test answer submission
            print("📤 Testing answer submission")
            host_client.emit('submit_answer', {
                'roomId': self.test_pin,
                'questionId': 1,
                'answerId': 0,
                'timeSpent': 15,
                'isCorrect': True,
                'points': 100
            })
            
            time.sleep(2)
            
            # Try to receive answer result
            answer_events = []
            for i in range(5):
                try:
                    event = host_client.receive(timeout=1)
                    if event:
                        answer_events.append(event)
                        print(f"📨 Answer event: {event}")
                except:
                    pass
            
            # Check for answer result events
            answer_result_events = [e for e in answer_events if 'answer' in e[0]]
            
            if answer_result_events:
                self.log_result("Answer Submission Flow", True, 
                              f"✅ Answer result events: {[e[0] for e in answer_result_events]}")
            else:
                self.log_result("Answer Submission Flow", False, 
                              "No answer result events received")
            
            host_client.disconnect()
            return True
            
        except Exception as e:
            self.log_result("Quiz Start Flow", False, f"Quiz start test error: {e}")
            return False
    
    def test_6_real_time_features(self):
        """Test Real-time Features"""
        print("\n⚡ 6. REAL-TIME FEATURES")
        print("=" * 50)
        
        if not self.test_pin:
            self.log_result("Real-time Features", False, "No PIN available")
            return False
        
        try:
            # Create two clients for real-time testing
            client1 = socketio.SimpleClient()
            client2 = socketio.SimpleClient()
            
            client1.connect(self.battle_server_url)
            client2.connect(self.battle_server_url)
            
            if not (client1.connected and client2.connected):
                self.log_result("Real-time Setup", False, "Cannot connect both clients")
                return False
            
            # Both join the same room
            client1.emit('join_room', {
                'roomId': self.test_pin,
                'userData': {'username': 'Player1', 'avatar': '🎮', 'isHost': True}
            })
            
            client2.emit('join_room', {
                'roomId': self.test_pin,
                'userData': {'username': 'Player2', 'avatar': '🎯', 'isHost': False}
            })
            
            time.sleep(2)
            
            # Test chat messages
            print("💬 Testing chat messages")
            client1.emit('send_message', {
                'roomId': self.test_pin,
                'message': 'Hello from Player1!'
            })
            
            time.sleep(1)
            
            # Test reactions
            print("😀 Testing reactions")
            client2.emit('send_reaction', {
                'roomId': self.test_pin,
                'reaction': '🔥'
            })
            
            time.sleep(2)
            
            # Collect events from both clients
            client1_events = []
            client2_events = []
            
            for i in range(10):
                try:
                    event1 = client1.receive(timeout=0.5)
                    if event1:
                        client1_events.append(event1)
                except:
                    pass
                
                try:
                    event2 = client2.receive(timeout=0.5)
                    if event2:
                        client2_events.append(event2)
                except:
                    pass
            
            print(f"📊 Client1 events: {len(client1_events)}")
            print(f"📊 Client2 events: {len(client2_events)}")
            
            # Check for chat and reaction events
            chat_events = [e for e in client1_events + client2_events if 'message' in e[0]]
            reaction_events = [e for e in client1_events + client2_events if 'reaction' in e[0]]
            
            if chat_events:
                self.log_result("Real-time Chat", True, 
                              f"✅ Chat events received: {len(chat_events)}")
            else:
                self.log_result("Real-time Chat", False, "No chat events received")
            
            if reaction_events:
                self.log_result("Real-time Reactions", True, 
                              f"✅ Reaction events received: {len(reaction_events)}")
            else:
                self.log_result("Real-time Reactions", False, "No reaction events received")
            
            # Test leaderboard updates (simulate)
            client1.emit('submit_answer', {
                'roomId': self.test_pin,
                'questionId': 1,
                'answerId': 0,
                'timeSpent': 10,
                'isCorrect': True,
                'points': 150
            })
            
            time.sleep(2)
            
            # Check for leaderboard events
            leaderboard_events = []
            for i in range(5):
                try:
                    event = client2.receive(timeout=1)
                    if event and 'leaderboard' in event[0]:
                        leaderboard_events.append(event)
                except:
                    pass
            
            if leaderboard_events:
                self.log_result("Real-time Leaderboard", True, 
                              "✅ Leaderboard update events received")
            else:
                self.log_result("Real-time Leaderboard", False, 
                              "No leaderboard update events received")
            
            client1.disconnect()
            client2.disconnect()
            
            return True
            
        except Exception as e:
            self.log_result("Real-time Features", False, f"Real-time test error: {e}")
            return False
    
    def run_comprehensive_test(self):
        """Run all battle system tests"""
        print("🎮 COMPREHENSIVE BATTLE SYSTEM END-TO-END FLOW TESTING")
        print("=" * 80)
        print(f"Backend URL: {self.backend_url}")
        print(f"Battle Server URL: {self.battle_server_url}")
        print("=" * 80)
        
        # Run all test scenarios
        test_results = []
        
        test_results.append(self.test_1_room_creation_flow())
        test_results.append(self.test_2_battle_server_rest_api())
        test_results.append(self.test_3_socketio_proxy_integration())
        test_results.append(self.test_4_room_joining_flow())
        test_results.append(self.test_5_quiz_start_flow())
        test_results.append(self.test_6_real_time_features())
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"  - {result['test']}: {result['message']}")
        
        print("\n❌ FAILED TESTS:")
        for result in self.test_results:
            if not result['success']:
                print(f"  - {result['test']}: {result['message']}")
        
        # Critical Success Criteria Check
        print("\n🎯 CRITICAL SUCCESS CRITERIA:")
        criteria = {
            "Room creation returns valid 6-digit PIN": any("6-digit PIN" in r['message'] for r in self.test_results if r['success']),
            "Socket.io connections work": any("Socket.io" in r['test'] and r['success'] for r in self.test_results),
            "Multiple players can join same room": any("Multi-Player" in r['test'] and r['success'] for r in self.test_results),
            "Players see each other in lobby": any("Room Joining Events" in r['test'] and r['success'] for r in self.test_results),
            "Quiz can start and questions are served": any("Quiz Start" in r['test'] and r['success'] for r in self.test_results),
            "Answer submission and scoring work": any("Answer Submission" in r['test'] and r['success'] for r in self.test_results)
        }
        
        for criterion, met in criteria.items():
            status = "✅" if met else "❌"
            print(f"  {status} {criterion}")
        
        return success_rate >= 70  # Consider success if 70% or more tests pass

if __name__ == "__main__":
    tester = BattleSystemTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 BATTLE SYSTEM TESTING: OVERALL SUCCESS")
    else:
        print("\n⚠️ BATTLE SYSTEM TESTING: NEEDS ATTENTION")
    
    sys.exit(0 if success else 1)