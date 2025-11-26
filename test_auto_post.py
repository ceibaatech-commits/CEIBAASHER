"""
Test script for auto-posting quiz results
"""
import asyncio
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone

async def test_auto_post():
    # Connect to database
    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "test_database")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Initialize social_auto_post
    from social_auto_post import init_db, auto_post_quiz_result, auto_post_battle_result
    init_db(db)
    
    print("=" * 60)
    print("TEST 1: Auto-post Quiz Result")
    print("=" * 60)
    
    # Get a real user from database
    user = await db.users.find_one({}, {"_id": 0})
    if not user:
        print("❌ No users found in database")
        return
    
    user_id = user.get("id") or user.get("user_id")
    print(f"✓ Testing with user: {user.get('name')} ({user_id})")
    
    # Test quiz result post
    quiz_data = {
        "quiz_name": "JEE Main Physics - Mechanics",
        "score": 85,
        "total_questions": 20,
        "correct_answers": 17,
        "time_taken": 450,  # 7 minutes 30 seconds
        "rank": 5,
        "subject": "Physics",
        "exam_category": "JEE Main",
        "quiz_id": "quiz_test_123"
    }
    
    post_id = await auto_post_quiz_result(user_id, quiz_data)
    
    if post_id:
        print(f"✅ Quiz result post created: {post_id}")
        
        # Fetch and display the post
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0})
        if post:
            print(f"\nPost Details:")
            print(f"  Type: {post['post_type']}")
            print(f"  Content Preview: {post['content'][:100]}...")
            print(f"  Likes: {post['likes_count']}")
            print(f"  Trending Score: {post['trending_score']}")
    else:
        print("❌ Failed to create quiz result post")
    
    print("\n" + "=" * 60)
    print("TEST 2: Auto-post Battle Result")
    print("=" * 60)
    
    # Test battle result post
    battle_data = {
        "room_code": "ABC123",
        "score": 450,
        "rank": 1,
        "total_participants": 8,
        "subject": "Mathematics",
        "exam_category": "NEET",
        "questions_answered": 15,
        "total_questions": 20
    }
    
    post_id = await auto_post_battle_result(user_id, battle_data)
    
    if post_id:
        print(f"✅ Battle result post created: {post_id}")
        
        # Fetch and display the post
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0})
        if post:
            print(f"\nPost Details:")
            print(f"  Type: {post['post_type']}")
            print(f"  Content Preview: {post['content'][:100]}...")
            print(f"  Likes: {post['likes_count']}")
            print(f"  Trending Score: {post['trending_score']}")
    else:
        print("❌ Failed to create battle result post")
    
    print("\n" + "=" * 60)
    print("Verifying posts in social feed...")
    print("=" * 60)
    
    # Get recent posts
    posts = await db.social_posts.find(
        {"user_id": user_id, "auto_posted": True},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    print(f"\n✓ Found {len(posts)} auto-posted items for user")
    for i, post in enumerate(posts, 1):
        print(f"\n{i}. {post['post_type']} - {post.get('battle_stats', {}).get('subject', 'N/A')}")
        print(f"   Created: {post['created_at']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_auto_post())
