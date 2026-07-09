import asyncio
import os
import sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Ensure we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from profile_stats import _compute_stats_live

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "skill_drill_db")

async def backfill():
    print(f"> Backfilling user_stats in {DB_NAME}...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Create indexes
    await db.user_stats.create_index("user_id", unique=True)
    await db.user_stats.create_index([("average_score", -1)])
    await db.user_stats.create_index([("streak_days", -1)])
    print("[OK] Indexes ready on user_stats")

    # Get all users
    users = await db.users.find({}, {"id": 1}).to_list(None)
    total_users = len(users)
    print(f"> Processing {total_users} users")

    processed = 0
    errors = 0
    for idx, user_doc in enumerate(users):
        user_id = user_doc.get("id")
        if not user_id:
            continue
        try:
            stats = await _compute_stats_live(db, user_id)
            await db.user_stats.update_one(
                {"user_id": user_id},
                {"$set": stats},
                upsert=True
            )
            processed += 1
        except Exception as e:
            print(f"Error for user {user_id}: {e}")
            errors += 1
        
        if processed % 100 == 0:
            print(f"  ...{processed}/{total_users}")

    # Ranked active users count
    active_count = await db.user_stats.count_documents({"total_tests": {"$gt": 0}})

    print(f"[OK] Stats written for {processed} users ({errors} errors)")
    print(f"[OK] Ranked {active_count} active users")
    print(f"[OK] Backfill complete @ {datetime.now(timezone.utc).isoformat()}")

if __name__ == "__main__":
    asyncio.run(backfill())
