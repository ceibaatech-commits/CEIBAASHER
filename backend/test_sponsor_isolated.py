import os
import sys
from unittest.mock import MagicMock, AsyncMock

# Setup env mock
os.environ['MONGO_URL'] = "mongodb://localhost:27017"
os.environ['DB_NAME'] = "test_db"

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

# Mock motor
sys.modules['motor'] = MagicMock()
sys.modules['motor.motor_asyncio'] = MagicMock()

# Mock database
import database
mock_db = MagicMock()
mock_db.sponsors = MagicMock()
# Use AsyncMock for insert_one
mock_db.sponsors.insert_one = AsyncMock(return_value=MagicMock())

database.db = mock_db

# Import sponsor routes
import sponsor_routes
from fastapi import FastAPI
from fastapi.testclient import TestClient

app = FastAPI()
app.include_router(sponsor_routes.router)

client = TestClient(app)

# Test POST /api/sponsors
response = client.post("/api/sponsors", json={
    "name": "jsjxdas",
    "logo_url": "https://asset.allen.in/495ea230-cf5b-4547-abc3-8748801",
    "link_url": "https://asset.allen.in/495ea230-cf5b-4547-abc3-8748801",
    "description": "dssd",
    "active_from": "2026-06-25",
    "active_to": "2026-07-09"
})

print("STATUS:", response.status_code)
print("BODY:", response.text)
