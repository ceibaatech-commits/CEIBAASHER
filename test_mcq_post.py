import asyncio
import sys
sys.path.append('/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient
import os
import requests

async def test_mcq_post():
    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME = "test_database"
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get a user
    user = await db.users.find_one({}, {"_id": 0})
    if not user:
        print("No users found")
        return
    
    user_id = user.get("id") or user.get("user_id")
    print(f"Testing with user: {user.get('name')} ({user_id})")
    
    # Get a question
    question = await db.questions.find_one({}, {"_id": 0})
    if not question:
        print("No questions found")
        return
    
    print(f"\nQuestion: {question['question'][:80]}...")
    question_id = question['id']
    
    # Get JWT token (mock for testing)
    # In real scenario, this comes from login
    from jose import jwt
    JWT_SECRET = "ceibaa-super-secret-key"
    token = jwt.encode({"sub": user_id}, JWT_SECRET, algorithm="HS256")
    
    # Create MCQ post
    print("\nCreating MCQ post...")
    response = requests.post(
        f"http://localhost:8001/api/social/mcq/post?question_id={question_id}&caption=Test your knowledge!",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        data = response.json()
        if data['success']:
            post_id = data['post']['id']
            print(f"✅ MCQ post created: {post_id}")
            
            # Try to attempt the MCQ
            print("\nAttempting MCQ with answer 'A'...")
            attempt_response = requests.post(
                f"http://localhost:8001/api/social/mcq/attempt?post_id={post_id}&selected_answer=A",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if attempt_response.status_code == 200:
                attempt_data = attempt_response.json()
                print(f"✅ Attempt result: {attempt_data['message']}")
                print(f"   Correct answer: {attempt_data['correct_answer']}")
            else:
                print(f"❌ Attempt failed: {attempt_response.text}")
            
            # Get stats
            stats_response = requests.get(f"http://localhost:8001/api/social/mcq/stats/{post_id}")
            if stats_response.status_code == 200:
                stats = stats_response.json()['stats']
                print(f"\n📊 MCQ Stats:")
                print(f"   Attempts: {stats['attempt_count']}")
                print(f"   Success Rate: {stats['success_rate']}%")
        else:
            print(f"❌ Failed to create post: {data}")
    else:
        print(f"❌ Request failed: {response.status_code} - {response.text}")
    
    client.close()

asyncio.run(test_mcq_post())
