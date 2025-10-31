from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import socketio
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
from quiz_routes import router as quiz_router
from auth_routes import router as auth_router
from exam_weightage import EXAM_WEIGHTAGE
from sheets_routes import router as sheets_router
from battle_proxy_routes import router as battle_proxy_router
from social_routes import router as social_router
from socket_proxy import socket_app
from contact_routes import router as contact_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main FastAPI app without a prefix
fastapi_app = FastAPI()

# Import socket server
from socket_proxy import sio_server

# Add session middleware for OAuth
fastapi_app.add_middleware(SessionMiddleware, secret_key=os.getenv("JWT_SECRET", "ceibaa-secret-key"))

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@fastapi_app.get("/api/quiz/weightage/{exam_id}")
async def get_exam_weightage(exam_id: str):
    """Get topic-wise weightage analysis for an exam"""
    weightage_data = EXAM_WEIGHTAGE.get(exam_id)
    if not weightage_data:
        return {"success": False, "message": "Weightage data not available for this exam"}
    return {"success": True, "weightage": weightage_data}

# Include the router in the main app
fastapi_app.include_router(api_router)
fastapi_app.include_router(quiz_router, prefix="/api")
fastapi_app.include_router(auth_router, prefix="/api")
fastapi_app.include_router(sheets_router, prefix="/api")
fastapi_app.include_router(battle_proxy_router, prefix="/api")
fastapi_app.include_router(social_router, prefix="/api")
fastapi_app.include_router(contact_router, prefix="/api")

# Test routes for debugging
from test_routes import router as test_router
fastapi_app.include_router(test_router, prefix="/api")

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@fastapi_app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
# Export both the FastAPI app and Socket.io ASGI app
# Uvicorn will serve the combined app
app = socketio.ASGIApp(sio_server, other_asgi_app=fastapi_app)

