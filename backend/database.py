"""
Shared database module — single source of truth for the MongoDB connection.
Import `db` from here instead of `from server import db` to avoid circular imports.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / '.env')

# Ensure crucial environment variables are populated with local/dev fallbacks
# to prevent subsequent module imports from crashing with KeyError.
if "MONGO_URL" not in os.environ:
    print("[WARNING] MONGO_URL environment variable is not set. Falling back to default: mongodb://localhost:27017", file=sys.stderr)
    os.environ["MONGO_URL"] = "mongodb://localhost:27017"

if "DB_NAME" not in os.environ:
    print("[WARNING] DB_NAME environment variable is not set. Falling back to default: test_database", file=sys.stderr)
    os.environ["DB_NAME"] = "test_database"

if "JWT_SECRET" not in os.environ:
    print("[WARNING] JWT_SECRET environment variable is not set. Falling back to local development secret.", file=sys.stderr)
    os.environ["JWT_SECRET"] = "local-development-only-secret"

mongo_url = os.environ["MONGO_URL"]
db_name = os.environ["DB_NAME"]

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]
