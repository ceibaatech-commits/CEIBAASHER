"""
Ceibaa Database Index Script
Adds indexes to all frequently queried collections for production performance.
Safe to run multiple times — MongoDB silently skips existing indexes.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


# Declarative index specs grouped by collection.
# Each entry: (keys, name, **kwargs)
INDEX_SPECS = {
    "users": [
        ([("id", 1)],                      "idx_id",              {"unique": True}),
        ([("email", 1)],                   "idx_email",           {"unique": True, "sparse": True}),
        ([("username", 1)],                "idx_username",        {"unique": True, "sparse": True}),
        ([("referral_code", 1)],           "idx_referral_code",   {"sparse": True}),
        ([("referral_coins", -1)],         "idx_referral_coins",  {}),
    ],
    "social_posts": [
        ([("id", 1)],                                          "idx_id",            {"unique": True}),
        ([("user_id", 1), ("created_at", -1)],                 "idx_user_created",  {}),
        ([("created_at", -1)],                                 "idx_created",       {}),
        ([("post_type", 1), ("created_at", -1)],               "idx_type_created",  {}),
        ([("is_retweet", 1), ("original_post_id", 1)],         "idx_retweet",       {}),
        ([("tags", 1)],                                        "idx_tags",          {}),
    ],
    "follows": [
        ([("follower_id", 1), ("following_id", 1)], "idx_pair",              {"unique": True}),
        ([("following_id", 1), ("status", 1)],      "idx_following_status",  {}),
        ([("follower_id", 1), ("status", 1)],       "idx_follower_status",   {}),
    ],
    "ceeps": [
        ([("ceeper_user_id", 1), ("status", 1)],         "idx_ceeper_status", {}),
        ([("ceep_user_id", 1), ("status", 1)],           "idx_ceep_status",   {}),
        ([("ceeper_user_id", 1), ("ceep_user_id", 1)],   "idx_pair",          {}),
    ],
    "post_likes": [
        ([("user_id", 1), ("post_id", 1)], "idx_user_post", {"unique": True}),
        ([("post_id", 1)],                 "idx_post",      {}),
    ],
    "comments": [
        ([("post_id", 1), ("created_at", -1)], "idx_post_created", {}),
        ([("id", 1)],                          "idx_id",           {}),
        ([("user_id", 1)],                     "idx_user",         {}),
    ],
    "user_sessions": [
        ([("session_token", 1)], "idx_token", {"unique": True}),
        ([("user_id", 1)],       "idx_user",  {}),
    ],
    "notifications": [
        ([("user_id", 1), ("created_at", -1)], "idx_user_created", {}),
        ([("user_id", 1), ("is_read", 1)],     "idx_user_read",    {}),
    ],
    "quiz_rooms": [
        ([("room_code", 1)],                       "idx_room_code",       {}),
        ([("host_id", 1), ("created_at", -1)],     "idx_host_created",    {}),
        ([("status", 1), ("created_at", -1)],      "idx_status_created",  {}),
    ],
    "battle_rooms": [
        ([("roomId", 1)],                                 "idx_roomId",          {}),
        ([("host.userId", 1), ("createdAt", -1)],         "idx_host_created",    {}),
        ([("status", 1), ("createdAt", -1)],              "idx_status_created",  {}),
    ],
    "exam_sheets": [
        ([("type", 1), ("exam_name", 1), ("syllabus_topic", 1), ("subject", 1)], "idx_compound", {}),
        ([("exam_name", 1)], "idx_exam_name", {}),
    ],
    "referrals": [
        ([("referrer_id", 1), ("status", 1)], "idx_referrer_status", {}),
        ([("referred_user_id", 1)],           "idx_referred",        {"unique": True}),
        ([("referred_email", 1)],             "idx_referred_email",  {}),
    ],
    "questions": [
        ([("sheet_id", 1)],                      "idx_sheet",         {}),
        ([("exam_name", 1), ("subject", 1)],     "idx_exam_subject",  {}),
    ],
    "support_tickets": [
        ([("user_id", 1), ("created_at", -1)], "idx_user_created", {}),
    ],
}


async def create_index_safe(collection, keys, name, **kwargs):
    try:
        await collection.create_index(keys, name=name, **kwargs)
        print(f"  + {name}")
    except Exception as e:
        print(f"  ~ {name} (skipped: {str(e)[:60]})")


async def _apply_indexes_for_collection(db, collection_name: str, specs: list) -> None:
    print(collection_name)
    coll = db[collection_name]
    for keys, name, opts in specs:
        await create_index_safe(coll, keys, name, **opts)


async def add_indexes():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    try:
        for coll_name, specs in INDEX_SPECS.items():
            await _apply_indexes_for_collection(db, coll_name, specs)
        print("\nDone. All indexes created.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(add_indexes())
