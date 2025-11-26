import asyncio
import sys
sys.path.append('/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json

async def check_questions():
    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "test_database").strip('"')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Check questions collection
    count = await db.questions.count_documents({})
    print(f"Total questions in DB: {count}")
    
    if count > 0:
        # Get sample question
        sample = await db.questions.find_one({}, {"_id": 0})
        print("\nSample Question Structure:")
        print(json.dumps(sample, indent=2, default=str))
    
    client.close()

asyncio.run(check_questions())
