#!/usr/bin/env python3
"""
Backend Test Suite for Ceibaa Battle Server
Tests the battle-server running on port 5001 with MongoDB integration
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
        BACKEND_URL = "https://prep-together.preview.emergentagent.com"

class BattleServerTester:
    def __init__(self):
        self.base_url = BATTLE_SERVER_URL
        self.mongo_client = None
        self.db = None
        self.test_results = []
        
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
    
    def test_health_check(self):
        """Test battle-server health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'Battle server running':
                    self.log_result("Health Check", True, "Battle server is running")
                    return True
                else:
                    self.log_result("Health Check", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {e}")
            return False
    
    def test_create_room(self):
        """Test room creation API"""
        try:
            payload = {
                "hostName": "TestHost",
                "examId": "NEET",
                "subject": "Physics", 
                "topic": "Mechanics"
            }
            
            response = requests.post(
                f"{self.base_url}/api/battle/create-room",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'pin' in data and 'room' in data:
                    pin = data['pin']
                    room = data['room']
                    
                    # Validate PIN format (6 digits)
                    if len(pin) == 6 and pin.isdigit():
                        self.log_result("Create Room API", True, f"Room created with PIN: {pin}")
                        
                        # Store PIN for subsequent tests
                        self.test_pin = pin
                        
                        # Verify room data structure
                        expected_fields = ['pin', 'hostName', 'examId', 'subject', 'topic']
                        if all(field in room for field in expected_fields):
                            self.log_result("Room Data Structure", True, "All required fields present")
                        else:
                            missing = [f for f in expected_fields if f not in room]
                            self.log_result("Room Data Structure", False, f"Missing fields: {missing}")
                        
                        return True
                    else:
                        self.log_result("Create Room API", False, f"Invalid PIN format: {pin}")
                        return False
                else:
                    self.log_result("Create Room API", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Create Room API", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Create Room API", False, f"Request error: {e}")
            return False
    
    def test_get_room_info(self):
        """Test get room info API"""
        if not hasattr(self, 'test_pin'):
            self.log_result("Get Room Info", False, "No PIN available from create room test")
            return False
            
        try:
            response = requests.get(
                f"{self.base_url}/api/battle/room/{self.test_pin}",
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'room' in data:
                    room = data['room']
                    expected_fields = ['pin', 'hostName', 'examId', 'subject', 'topic', 'status', 'players']
                    
                    if all(field in room for field in expected_fields):
                        self.log_result("Get Room Info", True, f"Room info retrieved for PIN: {self.test_pin}")
                        
                        # Verify room status
                        if room['status'] == 'waiting':
                            self.log_result("Room Status", True, "Room status is 'waiting'")
                        else:
                            self.log_result("Room Status", False, f"Unexpected status: {room['status']}")
                        
                        return True
                    else:
                        missing = [f for f in expected_fields if f not in room]
                        self.log_result("Get Room Info", False, f"Missing fields: {missing}")
                        return False
                else:
                    self.log_result("Get Room Info", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_result("Get Room Info", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Get Room Info", False, f"Request error: {e}")
            return False
    
    def test_get_nonexistent_room(self):
        """Test get room info for non-existent room"""
        try:
            fake_pin = "999999"
            response = requests.get(
                f"{self.base_url}/api/battle/room/{fake_pin}",
                timeout=5
            )
            
            if response.status_code == 404:
                data = response.json()
                if not data.get('success') and 'message' in data:
                    self.log_result("Non-existent Room Handling", True, "Correctly returns 404 for invalid PIN")
                    return True
                else:
                    self.log_result("Non-existent Room Handling", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Non-existent Room Handling", False, f"Expected 404, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Non-existent Room Handling", False, f"Request error: {e}")
            return False
    
    def test_socket_connection(self):
        """Test Socket.io connection"""
        try:
            sio = socketio.SimpleClient()
            
            # Test connection
            sio.connect(f"{self.base_url}")
            
            if sio.connected:
                self.log_result("Socket.io Connection", True, "Successfully connected to Socket.io server")
                
                # Test basic event emission (without expecting response)
                try:
                    sio.emit('test-event', {'data': 'test'})
                    self.log_result("Socket.io Event Emission", True, "Can emit events to server")
                except Exception as e:
                    self.log_result("Socket.io Event Emission", False, f"Event emission failed: {e}")
                
                sio.disconnect()
                return True
            else:
                self.log_result("Socket.io Connection", False, "Failed to connect")
                return False
                
        except Exception as e:
            self.log_result("Socket.io Connection", False, f"Connection error: {e}")
            return False
    
    def test_mongodb_collections(self):
        """Test MongoDB collections exist and can be accessed"""
        if self.db is None:
            self.log_result("MongoDB Collections", False, "No database connection")
            return False
        
        try:
            # Check if battle_rooms collection exists and has data
            battle_rooms = self.db.battle_rooms
            room_count = battle_rooms.count_documents({})
            
            if room_count > 0:
                self.log_result("MongoDB battle_rooms Collection", True, f"Found {room_count} room(s)")
                
                # Check if our test room is saved
                if hasattr(self, 'test_pin'):
                    test_room = battle_rooms.find_one({'pin': self.test_pin})
                    if test_room:
                        self.log_result("Test Room in MongoDB", True, "Test room saved to database")
                        
                        # Verify room structure
                        required_fields = ['pin', 'hostName', 'examId', 'subject', 'topic', 'questions', 'quizId']
                        if all(field in test_room for field in required_fields):
                            self.log_result("MongoDB Room Structure", True, "Room has all required fields")
                        else:
                            missing = [f for f in required_fields if f not in test_room]
                            self.log_result("MongoDB Room Structure", False, f"Missing fields: {missing}")
                    else:
                        self.log_result("Test Room in MongoDB", False, "Test room not found in database")
            else:
                self.log_result("MongoDB battle_rooms Collection", False, "No rooms found in database")
            
            # Check quiz_results collection (may be empty if no quiz completed)
            quiz_results = self.db.quiz_results
            results_count = quiz_results.count_documents({})
            self.log_result("MongoDB quiz_results Collection", True, f"Collection accessible, {results_count} result(s)")
            
            return True
            
        except Exception as e:
            self.log_result("MongoDB Collections", False, f"Database error: {e}")
            return False
    
    def test_answer_validation_logic(self):
        """Test the answer validation logic by examining the code structure"""
        try:
            # Read the server.js file to verify answer validation implementation
            with open('/app/battle-server/server.js', 'r') as f:
                content = f.read()
            
            # Check for proper answer validation (not Math.random)
            if 'currentQ.correctAnswer === answerIndex' in content:
                self.log_result("Answer Validation Logic", True, "Uses proper correctAnswer comparison")
            elif 'Math.random' in content:
                self.log_result("Answer Validation Logic", False, "Still using Math.random for validation")
            else:
                self.log_result("Answer Validation Logic", False, "Answer validation logic unclear")
            
            # Check for answer-result event emission
            if 'answer-result' in content and 'isCorrect' in content:
                self.log_result("Answer Result Event", True, "Emits answer-result with isCorrect flag")
            else:
                self.log_result("Answer Result Event", False, "Missing answer-result event emission")
            
            # Check for host control events
            host_events = ['pause-quiz', 'resume-quiz', 'kick-player', 'skip-question', 'end-quiz']
            found_events = [event for event in host_events if event in content]
            
            if len(found_events) == len(host_events):
                self.log_result("Host Control Events", True, f"All host events implemented: {', '.join(found_events)}")
            else:
                missing = [event for event in host_events if event not in found_events]
                self.log_result("Host Control Events", False, f"Missing events: {missing}")
            
            return True
            
        except Exception as e:
            self.log_result("Answer Validation Logic", False, f"Code analysis error: {e}")
            return False

    def test_contact_form_valid_request(self):
        """Test contact form with valid data including all fields"""
        try:
            payload = {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+91 9876543210",
                "message": "This is a test message from the contact form. I'm interested in learning more about Ceibaa's exam preparation features."
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/contact",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success' and 'message' in data:
                    self.log_result("Contact Form - Valid Request (All Fields)", True, 
                                  f"Email sent successfully: {data['message']}")
                    return True
                else:
                    self.log_result("Contact Form - Valid Request (All Fields)", False, 
                                  f"Unexpected response structure: {data}")
                    return False
            else:
                self.log_result("Contact Form - Valid Request (All Fields)", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Contact Form - Valid Request (All Fields)", False, f"Request error: {e}")
            return False

    def test_contact_form_without_phone(self):
        """Test contact form without optional phone field"""
        try:
            payload = {
                "name": "Jane Smith",
                "email": "jane.smith@example.com",
                "message": "Testing contact form without phone number. This should work since phone is optional."
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/contact",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    self.log_result("Contact Form - Without Phone (Optional)", True, 
                                  "Form submission works without phone field")
                    return True
                else:
                    self.log_result("Contact Form - Without Phone (Optional)", False, 
                                  f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Contact Form - Without Phone (Optional)", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Contact Form - Without Phone (Optional)", False, f"Request error: {e}")
            return False

    def test_contact_form_missing_name(self):
        """Test contact form with missing required name field"""
        try:
            payload = {
                "email": "test@example.com",
                "message": "Test message without name"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/contact",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 422:
                self.log_result("Contact Form - Missing Name Validation", True, 
                              "Correctly validates missing name field (422)")
                return True
            else:
                self.log_result("Contact Form - Missing Name Validation", False, 
                              f"Expected 422, got {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Contact Form - Missing Name Validation", False, f"Request error: {e}")
            return False

    def test_contact_form_missing_email(self):
        """Test contact form with missing required email field"""
        try:
            payload = {
                "name": "Test User",
                "message": "Test message without email"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/contact",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 422:
                self.log_result("Contact Form - Missing Email Validation", True, 
                              "Correctly validates missing email field (422)")
                return True
            else:
                self.log_result("Contact Form - Missing Email Validation", False, 
                              f"Expected 422, got {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Contact Form - Missing Email Validation", False, f"Request error: {e}")
            return False

    def test_contact_form_missing_message(self):
        """Test contact form with missing required message field"""
        try:
            payload = {
                "name": "Test User",
                "email": "test@example.com"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/contact",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 422:
                self.log_result("Contact Form - Missing Message Validation", True, 
                              "Correctly validates missing message field (422)")
                return True
            else:
                self.log_result("Contact Form - Missing Message Validation", False, 
                              f"Expected 422, got {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Contact Form - Missing Message Validation", False, f"Request error: {e}")
            return False

    def test_contact_form_invalid_email(self):
        """Test contact form with invalid email format"""
        try:
            payload = {
                "name": "Test User",
                "email": "invalid-email-format",
                "message": "Test message with invalid email"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/contact",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 422:
                self.log_result("Contact Form - Invalid Email Format", True, 
                              "Correctly validates invalid email format (422)")
                return True
            else:
                self.log_result("Contact Form - Invalid Email Format", False, 
                              f"Expected 422, got {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Contact Form - Invalid Email Format", False, f"Request error: {e}")
            return False

    def test_sendgrid_configuration(self):
        """Test if SendGrid is properly configured"""
        try:
            sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
            sender_email = os.getenv('SENDER_EMAIL')
            
            if sendgrid_api_key:
                self.log_result("SendGrid API Key Configuration", True, 
                              "SendGrid API key is configured")
            else:
                self.log_result("SendGrid API Key Configuration", False, 
                              "SendGrid API key not found in environment")
                return False
            
            if sender_email:
                self.log_result("Sender Email Configuration", True, 
                              f"Sender email configured: {sender_email}")
            else:
                self.log_result("Sender Email Configuration", False, 
                              "Sender email not configured")
            
            return True
            
        except Exception as e:
            self.log_result("SendGrid Configuration", False, f"Configuration check error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Ceibaa Backend Tests")
        print("=" * 60)
        
        # Setup
        mongo_connected = self.setup_mongo()
        
        # Contact Form API Tests (NEW - Primary Focus)
        print("\n📧 Testing Contact Form API...")
        self.test_sendgrid_configuration()
        self.test_contact_form_valid_request()
        self.test_contact_form_without_phone()
        self.test_contact_form_missing_name()
        self.test_contact_form_missing_email()
        self.test_contact_form_missing_message()
        self.test_contact_form_invalid_email()
        
        # Battle Server API Tests (Existing)
        print("\n📡 Testing Battle Server APIs...")
        self.test_health_check()
        self.test_create_room()
        self.test_get_room_info()
        self.test_get_nonexistent_room()
        
        # Socket.io Tests
        print("\n🔌 Testing Socket.io...")
        self.test_socket_connection()
        
        # MongoDB Tests
        if mongo_connected:
            print("\n🗄️ Testing MongoDB Integration...")
            self.test_mongodb_collections()
        
        # Code Logic Tests
        print("\n🔍 Testing Implementation Logic...")
        self.test_answer_validation_logic()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # List failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        # List contact form specific results
        contact_tests = [result for result in self.test_results if 'Contact Form' in result['test'] or 'SendGrid' in result['test']]
        if contact_tests:
            print(f"\n📧 CONTACT FORM API RESULTS ({len(contact_tests)} tests):")
            for test in contact_tests:
                status = "✅" if test['success'] else "❌"
                print(f"  {status} {test['test']}")
        
        # Cleanup
        if self.mongo_client:
            self.mongo_client.close()
        
        return passed == total

if __name__ == "__main__":
    tester = BattleServerTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)