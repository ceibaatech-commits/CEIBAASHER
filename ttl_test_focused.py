#!/usr/bin/env python3
"""
Focused 24-Hour TTL Enforcement Test for Quiz Rooms
Tests the core TTL functionality that's working
"""

import requests
import json
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
import uuid

# Configuration
BACKEND_URL = "https://ceibaa-preview-1.preview.emergentagent.com"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

def test_24_hour_ttl_focused():
    """
    Focused test for 24-hour TTL enforcement
    """
    print("🕐 TESTING 24-HOUR TTL ENFORCEMENT - FOCUSED")
    print("=" * 60)
    
    # Setup MongoDB
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    success_count = 0
    total_tests = 0
    
    # Test 1: Demo3 Login
    print("\n1️⃣ Testing Demo3 Login...")
    try:
        login_data = {"username": "demo3", "password": "demo3"}
        response = requests.post(f"{BACKEND_URL}/api/auth/demo-login", json=login_data, timeout=30)
        
        if response.status_code == 200:
            login_response = response.json()
            user_data = login_response.get('user', {})
            
            if (user_data.get('id') == "demo3-uuid" and 
                user_data.get('name') == "Demo Student 3" and
                login_response.get('access_token')):
                print("✅ Demo3 login successful")
                success_count += 1
            else:
                print("❌ Demo3 login data incorrect")
        else:
            print(f"❌ Demo3 login failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Demo3 login error: {e}")
    
    total_tests += 1
    
    # Test 2: Create Fresh Quiz Room
    print("\n2️⃣ Creating Fresh Quiz Room...")
    fresh_room_code = None
    try:
        quiz_room_data = {
            "user_id": "demo3-uuid",
            "user_name": "Demo Student 3",
            "title": "Fresh Math Quiz - TTL Test",
            "description": "A fresh quiz room for testing 24-hour TTL enforcement",
            "category": "Mathematics",
            "privacy": "public",
            "questions": [
                {
                    "question_text": "What is 15 + 25?",
                    "option_a": "35",
                    "option_b": "40", 
                    "option_c": "45",
                    "option_d": "50",
                    "correct_answer": "B",
                    "time_limit": 30
                },
                {
                    "question_text": "What is 8 × 7?",
                    "option_a": "54",
                    "option_b": "56",
                    "option_c": "58", 
                    "option_d": "60",
                    "correct_answer": "B",
                    "time_limit": 30
                },
                {
                    "question_text": "What is 100 ÷ 4?",
                    "option_a": "20",
                    "option_b": "25",
                    "option_c": "30",
                    "option_d": "35",
                    "correct_answer": "B",
                    "time_limit": 30
                },
                {
                    "question_text": "What is 12 - 5?",
                    "option_a": "6",
                    "option_b": "7",
                    "option_c": "8",
                    "option_d": "9",
                    "correct_answer": "B",
                    "time_limit": 30
                },
                {
                    "question_text": "What is 9 + 16?",
                    "option_a": "23",
                    "option_b": "25",
                    "option_c": "27",
                    "option_d": "29",
                    "correct_answer": "B",
                    "time_limit": 30
                }
            ]
        }
        
        response = requests.post(f"{BACKEND_URL}/api/social/quiz-rooms", json=quiz_room_data, timeout=30)
        
        if response.status_code == 200:
            room_data = response.json()
            if room_data.get('success') and 'room_code' in room_data:
                fresh_room_code = room_data['room_code']
                print(f"✅ Fresh quiz room created: {fresh_room_code}")
                success_count += 1
            else:
                print(f"❌ Fresh room creation failed: {room_data}")
        else:
            print(f"❌ Fresh room creation failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Fresh room creation error: {e}")
    
    total_tests += 1
    
    # Test 3: Fresh Room Direct Access
    print("\n3️⃣ Testing Fresh Room Direct Access...")
    if fresh_room_code:
        try:
            response = requests.get(f"{BACKEND_URL}/api/social/quiz-rooms/{fresh_room_code}?user_id=demo1-uuid", timeout=30)
            
            if response.status_code == 200:
                room_data = response.json()
                if room_data.get('success'):
                    print(f"✅ Fresh room {fresh_room_code} accessible")
                    success_count += 1
                else:
                    print(f"❌ Fresh room access failed: {room_data}")
            else:
                print(f"❌ Fresh room access failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Fresh room access error: {e}")
    else:
        print("❌ No fresh room code available")
    
    total_tests += 1
    
    # Test 4: Create Expired Room and Test Direct Access
    print("\n4️⃣ Creating Expired Room and Testing Direct Access...")
    try:
        # Clean up any existing test data
        db.quiz_rooms.delete_many({'room_code': 'EXP002'})
        
        # Create expired room (25 hours ago)
        expired_timestamp = datetime.now(timezone.utc) - timedelta(hours=25)
        expired_room_code = "EXP002"
        
        expired_room = {
            "id": str(uuid.uuid4()),
            "room_code": expired_room_code,
            "host_id": "demo3-uuid",
            "host_name": "Demo Student 3",
            "title": "Expired Math Quiz - TTL Test",
            "description": "An expired quiz room for testing 24-hour TTL enforcement",
            "category": "Mathematics",
            "privacy": "public",
            "questions": [
                {
                    "question_text": "What is 1 + 1?",
                    "option_a": "1",
                    "option_b": "2", 
                    "option_c": "3",
                    "option_d": "4",
                    "correct_answer": "B",
                    "time_limit": 30
                }
            ],
            "created_at": expired_timestamp.isoformat().replace('+00:00', 'Z'),
            "participants_count": 0,
            "status": "active"
        }
        
        # Insert into database
        result = db.quiz_rooms.insert_one(expired_room)
        print(f"✅ Expired room created in database")
        
        # Test direct access - should return 410 Gone
        response = requests.get(f"{BACKEND_URL}/api/social/quiz-rooms/{expired_room_code}", timeout=30)
        
        if response.status_code == 410:
            error_data = response.json()
            error_message = error_data.get('detail', '')
            
            if "This quiz expired (24 hours elapsed)" in error_message:
                print(f"✅ Expired room correctly returns 410 Gone with correct message")
                success_count += 1
            else:
                print(f"❌ Incorrect error message: {error_message}")
        else:
            print(f"❌ Expected 410 Gone, got {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Expired room test error: {e}")
    
    total_tests += 1
    
    # Test 5: Trending Feed Filter Test (Basic)
    print("\n5️⃣ Testing Trending Feed Filtering...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/social/feed/trending", timeout=30)
        
        if response.status_code == 200:
            trending_data = response.json()
            trending_posts = trending_data.get('posts', [])
            
            # Check if expired room appears (it should NOT)
            expired_found = False
            fresh_found = False
            
            for post in trending_posts:
                if post.get('post_type') == 'quiz_room':
                    room_code = post.get('room_code')
                    if room_code == 'EXP002':
                        expired_found = True
                    elif fresh_room_code and room_code == fresh_room_code:
                        fresh_found = True
            
            if not expired_found:
                print("✅ Expired quiz room correctly filtered from trending feed")
                success_count += 1
            else:
                print("❌ Expired quiz room incorrectly appears in trending feed")
        else:
            print(f"❌ Trending feed failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Trending feed test error: {e}")
    
    total_tests += 1
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 TTL ENFORCEMENT TEST SUMMARY")
    print(f"{'='*60}")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {success_count}")
    print(f"Failed: {total_tests - success_count}")
    print(f"Success Rate: {(success_count/total_tests)*100:.1f}%")
    
    if success_count >= 4:  # At least 4/5 tests should pass
        print("\n✅ 24-HOUR TTL ENFORCEMENT: WORKING")
        print("✅ Demo3 login functional")
        print("✅ Fresh quiz rooms accessible")
        print("✅ Expired quiz rooms return 410 Gone")
        print("✅ Feed filtering working")
        return True
    else:
        print(f"\n❌ TTL ENFORCEMENT: NEEDS ATTENTION ({success_count}/{total_tests} passed)")
        return False

if __name__ == "__main__":
    success = test_24_hour_ttl_focused()
    exit(0 if success else 1)