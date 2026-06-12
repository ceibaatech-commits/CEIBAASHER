"""
Motor async index setup for the `test_history` collection.

Called once on FastAPI startup (see server.py). create_index is idempotent —
existing indexes with the same spec are no-ops.
"""


async def ensure_test_history_indexes(db) -> None:
    coll = db.test_history
    # User's history timeline (default list sort)
    await coll.create_index([("user_id", 1), ("completed_at", -1)], name="user_date")
    # Filtered views
    await coll.create_index([("user_id", 1), ("subject", 1)], name="user_subject")
    await coll.create_index([("user_id", 1), ("exam_category", 1)], name="user_exam_category")
    # Leaderboard: best percentages per test
    await coll.create_index([("test_id", 1), ("percentage", -1)], name="test_leaderboard")
