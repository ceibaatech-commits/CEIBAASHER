from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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
from image_extraction_routes import router as image_extraction_router
from battle_routes import router as battle_router
from social_routes import router as social_router
# Socket.io proxy now runs separately on port 5002
# from socket_proxy import socket_app  # Not needed anymore
from contact_routes import router as contact_router
from social_feed_routes import router as social_feed_router
import social_feed_routes
from ceep_routes import router as ceep_router
from admin_routes import router as admin_router
import ceep_routes
import admin_routes
from chapter_test_routes import router as chapter_test_router
from profile_routes import router as profile_router
from notification_routes import router as notification_router
import profile_routes
import notification_routes
from books_routes import router as books_router
import books_routes
from exam_structure_routes import router as exam_structure_router
import exam_structure_routes
from exam_metadata_routes import router as exam_metadata_router
from x_auth_routes import router as x_auth_router
from search_routes import router as search_router
from exam_sync_routes import router as exam_sync_router
import exam_sync_routes
# socketio_proxy_routes removed - using proper Socket.io ASGI app instead


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize social feed routes with db
social_feed_routes.init_db(db)
ceep_routes.init_db(db)
admin_routes.init_db(db)
profile_routes.init_db(db)
notification_routes.init_db(db)
books_routes.init_db(db)
exam_structure_routes.init_db(db)
exam_sync_routes.init_db(db)

# Initialize social auto-post utilities
import social_auto_post
social_auto_post.init_db(db)

# Create the main FastAPI app without a prefix
fastapi_app = FastAPI()

# Add session middleware for OAuth
fastapi_app.add_middleware(SessionMiddleware, secret_key=os.getenv("JWT_SECRET", "ceibaa-secret-key"))

# Import and mount Battle Socket.IO (Python-based real-time battle server)
from battle_socketio import socket_app as battle_socket_app, init_socketio_db
# Initialize battle Socket.IO with database (battle rooms stored in MongoDB)
init_socketio_db(db)
# Mount at /api/battlews so frontend connects via `${REACT_APP_BACKEND_URL}/api/battlews/socket.io`
fastapi_app.mount("/api/battlews", battle_socket_app)

# Import and mount Social Feed Socket.IO for real-time updates
from social_socketio import social_socket_app, init_social_socketio_db
init_social_socketio_db(db)
# Mount at /api/socialws for social feed real-time updates
fastapi_app.mount("/api/socialws", social_socket_app)

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

# Include the router in the main app
fastapi_app.include_router(api_router)
fastapi_app.include_router(quiz_router, prefix="/api")
fastapi_app.include_router(auth_router, prefix="/api")
fastapi_app.include_router(sheets_router, prefix="/api")
fastapi_app.include_router(battle_router)
# fastapi_app.include_router(social_router, prefix="/api")  # Disabled - using social_feed_router instead
fastapi_app.include_router(contact_router, prefix="/api")
fastapi_app.include_router(social_feed_router, prefix="/api/social")
fastapi_app.include_router(ceep_router, prefix="/api/ceep")
fastapi_app.include_router(admin_router, prefix="/api")
fastapi_app.include_router(chapter_test_router)
fastapi_app.include_router(profile_router, prefix="/api/profile")
fastapi_app.include_router(notification_router, prefix="/api")
fastapi_app.include_router(search_router)
fastapi_app.include_router(books_router)
fastapi_app.include_router(exam_structure_router)
fastapi_app.include_router(exam_metadata_router)
fastapi_app.include_router(x_auth_router, prefix="/api")
fastapi_app.include_router(exam_sync_router)  # Exam sync/management routes
# socketio_proxy_router removed - using proper Socket.io ASGI app at /api/battlews instead

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
# Export the FastAPI app directly; battle Socket.IO is mounted at /api/battlews
app = fastapi_app

print("[INIT] FastAPI running on port 8001")
print("[INIT] REST endpoints: /api/*")
print("[INIT] Battle Socket.IO endpoint: /api/battlews/socket.io")
print("[INIT] Battle rooms will persist to MongoDB")

