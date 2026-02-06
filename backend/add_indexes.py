"""
Ceibaa Database Index Script
Adds indexes to all frequently queried collections for production performance.
Safe to run multiple times - MongoDB silently skips existing indexes.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

async def create_index_safe(collection, keys, name, **kwargs):
    try:
        await collection.create_index(keys, name=name, **kwargs)
        print(f"  + {name}")
    except Exception as e:
        print(f"  ~ {name} (skipped: {str(e)[:60]})")

async def add_indexes():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    try:
        # ===== USERS (87 queries) =====
        print("users")
        c = db['users']
        await create_index_safe(c, [("id", 1)], "idx_id", unique=True)
        await create_index_safe(c, [("email", 1)], "idx_email", unique=True, sparse=True)
        await create_index_safe(c, [("username", 1)], "idx_username", unique=True, sparse=True)
        await create_index_safe(c, [("referral_code", 1)], "idx_referral_code", sparse=True)
        await create_index_safe(c, [("referral_coins", -1)], "idx_referral_coins")

        # ===== SOCIAL_POSTS (47 queries) =====
        print("social_posts")
        c = db['social_posts']
        await create_index_safe(c, [("id", 1)], "idx_id", unique=True)
        await create_index_safe(c, [("user_id", 1), ("created_at", -1)], "idx_user_created")
        await create_index_safe(c, [("created_at", -1)], "idx_created")
        await create_index_safe(c, [("post_type", 1), ("created_at", -1)], "idx_type_created")
        await create_index_safe(c, [("is_retweet", 1), ("original_post_id", 1)], "idx_retweet")
        await create_index_safe(c, [("tags", 1)], "idx_tags")

        # ===== FOLLOWS (28 queries) =====
        print("follows")
        c = db['follows']
        await create_index_safe(c, [("follower_id", 1), ("following_id", 1)], "idx_pair", unique=True)
        await create_index_safe(c, [("following_id", 1), ("status", 1)], "idx_following_status")
        await create_index_safe(c, [("follower_id", 1), ("status", 1)], "idx_follower_status")

        # ===== CEEPS (14 queries) =====
        print("ceeps")
        c = db['ceeps']
        await create_index_safe(c, [("ceeper_user_id", 1), ("status", 1)], "idx_ceeper_status")
        await create_index_safe(c, [("ceep_user_id", 1), ("status", 1)], "idx_ceep_status")
        await create_index_safe(c, [("ceeper_user_id", 1), ("ceep_user_id", 1)], "idx_pair")

        # ===== POST_LIKES (8 queries) =====
        print("post_likes")
        c = db['post_likes']
        await create_index_safe(c, [("user_id", 1), ("post_id", 1)], "idx_user_post", unique=True)
        await create_index_safe(c, [("post_id", 1)], "idx_post")

        # ===== COMMENTS (7 queries) =====
        print("comments")
        c = db['comments']
        await create_index_safe(c, [("post_id", 1), ("created_at", -1)], "idx_post_created")
        await create_index_safe(c, [("id", 1)], "idx_id")
        await create_index_safe(c, [("user_id", 1)], "idx_user")

        # ===== USER_SESSIONS (7 queries) =====
        print("user_sessions")
        c = db['user_sessions']
        await create_index_safe(c, [("session_token", 1)], "idx_token", unique=True)
        await create_index_safe(c, [("user_id", 1)], "idx_user")

        # ===== NOTIFICATIONS (6 queries) =====
        print("notifications")
        c = db['notifications']
        await create_index_safe(c, [("user_id", 1), ("created_at", -1)], "idx_user_created")
        await create_index_safe(c, [("user_id", 1), ("is_read", 1)], "idx_user_read")

        # ===== QUIZ_ROOMS (10 queries) =====
        print("quiz_rooms")
        c = db['quiz_rooms']
        await create_index_safe(c, [("room_code", 1)], "idx_room_code")
        await create_index_safe(c, [("host_id", 1), ("created_at", -1)], "idx_host_created")
        await create_index_safe(c, [("status", 1), ("created_at", -1)], "idx_status_created")

        # ===== BATTLE_ROOMS (7 queries) =====
        print("battle_rooms")
        c = db['battle_rooms']
        await create_index_safe(c, [("roomId", 1)], "idx_roomId")
        await create_index_safe(c, [("host.userId", 1), ("createdAt", -1)], "idx_host_created")
        await create_index_safe(c, [("status", 1), ("createdAt", -1)], "idx_status_created")

        # ===== EXAM_SHEETS (28 queries) =====
        print("exam_sheets")
        c = db['exam_sheets']
        await create_index_safe(c, [("type", 1), ("exam_name", 1), ("syllabus_topic", 1), ("subject", 1)], "idx_compound")
        await create_index_safe(c, [("exam_name", 1)], "idx_exam_name")

        # ===== REFERRALS =====
        print("referrals")
        c = db['referrals']
        await create_index_safe(c, [("referrer_id", 1), ("status", 1)], "idx_referrer_status")
        await create_index_safe(c, [("referred_user_id", 1)], "idx_referred", unique=True)
        await create_index_safe(c, [("referred_email", 1)], "idx_referred_email")

        # ===== QUESTIONS (15 queries) =====
        print("questions")
        c = db['questions']
        await create_index_safe(c, [("sheet_id", 1)], "idx_sheet")
        await create_index_safe(c, [("exam_name", 1), ("subject", 1)], "idx_exam_subject")

        # ===== SUPPORT_TICKETS (8 queries) =====
        print("support_tickets")
        c = db['support_tickets']
        await create_index_safe(c, [("user_id", 1), ("created_at", -1)], "idx_user_created")

        print("\nDone. All indexes created.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(add_indexes())
