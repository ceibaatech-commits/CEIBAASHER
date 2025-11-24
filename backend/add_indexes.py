"""
Script to add recommended database indexes for improved performance
Run this script to create indexes on frequently queried fields
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

async def add_indexes():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['test_database']
    
    try:
        # ===== FOLLOWS COLLECTION =====
        print("\n📊 Adding indexes for 'follows' collection...")
        follows_collection = db['follows']
        
        # Index for finding followers of a user
        await follows_collection.create_index([("following_id", 1), ("status", 1)])
        print("✅ Created index: following_id + status")
        
        # Index for finding users that someone is following
        await follows_collection.create_index([("follower_id", 1), ("status", 1)])
        print("✅ Created index: follower_id + status")
        
        # Index for checking specific follow relationship
        await follows_collection.create_index([("follower_id", 1), ("following_id", 1)])
        print("✅ Created index: follower_id + following_id")
        
        # ===== SOCIAL_POSTS COLLECTION =====
        print("\n📊 Adding indexes for 'social_posts' collection...")
        social_posts_collection = db['social_posts']
        
        # Index for finding posts by user
        await social_posts_collection.create_index([("user_id", 1), ("created_at", -1)])
        print("✅ Created index: user_id + created_at (descending)")
        
        # Index for feed queries (for trending/for-you)
        await social_posts_collection.create_index([("created_at", -1)])
        print("✅ Created index: created_at (descending)")
        
        # Index for finding posts by type
        await social_posts_collection.create_index([("post_type", 1), ("created_at", -1)])
        print("✅ Created index: post_type + created_at")
        
        # Index for searching liked posts
        await social_posts_collection.create_index([("likes", 1)])
        print("✅ Created index: likes")
        
        # ===== EXAM_SHEETS COLLECTION =====
        print("\n📊 Adding indexes for 'exam_sheets' collection...")
        exam_sheets_collection = db['exam_sheets']
        
        # Compound index for efficient exam sheet queries
        await exam_sheets_collection.create_index([
            ("type", 1),
            ("exam_name", 1),
            ("syllabus_topic", 1),
            ("subject", 1)
        ])
        print("✅ Created index: type + exam_name + syllabus_topic + subject")
        
        # ===== BATTLE_ROOMS COLLECTION =====
        print("\n📊 Adding indexes for 'battle_rooms' collection...")
        battle_rooms_collection = db['battle_rooms']
        
        # Index for finding rooms by PIN
        await battle_rooms_collection.create_index([("roomId", 1)], unique=True)
        print("✅ Created index: roomId (unique)")
        
        # Index for finding rooms by host
        await battle_rooms_collection.create_index([("host.userId", 1), ("createdAt", -1)])
        print("✅ Created index: host.userId + createdAt")
        
        # Index for room status queries
        await battle_rooms_collection.create_index([("status", 1), ("createdAt", -1)])
        print("✅ Created index: status + createdAt")
        
        # ===== USERS COLLECTION =====
        print("\n📊 Adding indexes for 'users' collection...")
        users_collection = db['users']
        
        # Index for email lookups (if not already unique)
        await users_collection.create_index([("email", 1)], unique=True, sparse=True)
        print("✅ Created index: email (unique)")
        
        # Index for username search
        await users_collection.create_index([("username", 1)])
        print("✅ Created index: username")
        
        print("\n✅ ALL INDEXES CREATED SUCCESSFULLY!")
        print("\n📋 Summary:")
        print("   - follows collection: 3 indexes")
        print("   - social_posts collection: 4 indexes")
        print("   - exam_sheets collection: 1 compound index")
        print("   - battle_rooms collection: 3 indexes")
        print("   - users collection: 2 indexes")
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    finally:
        client.close()
        print("\n🔒 MongoDB connection closed")

if __name__ == "__main__":
    print("=" * 60)
    print("DATABASE INDEX CREATION SCRIPT")
    print("=" * 60)
    asyncio.run(add_indexes())
