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
from account_security_routes import router as account_security_router
from exam_weightage import EXAM_WEIGHTAGE
from sheets_routes import router as sheets_router
from image_extraction_routes import router as image_extraction_router
from battle_routes import router as battle_router
from battle_async_routes import router as battle_async_router
import battle_async_routes
from contact_routes import router as contact_router
from programs_routes import router as programs_router
from social_feed_routes import router as social_feed_router
import social_feed_routes
from ceep_routes import router as ceep_router
from admin_routes import router as admin_router
import ceep_routes
import admin_routes
from chapter_test_routes import router as chapter_test_router
from profile_routes import router as profile_router
from profile_follow_routes import router as profile_follow_router
from profile_content_routes import router as profile_content_router
from notification_routes import router as notification_router
import profile_routes
import profile_follow_routes
import profile_content_routes
import notification_routes
from books_routes import router as books_router
import books_routes
from exam_structure_routes import router as exam_structure_router
import exam_structure_routes
from exam_metadata_routes import router as exam_metadata_router
from x_auth_routes import router as x_auth_router
from emergent_auth_routes import router as emergent_auth_router
from search_routes import router as search_router
from exam_sync_routes import router as exam_sync_router
from exam_management_routes import router as exam_management_router
from admin_data_routes import router as admin_data_router
import exam_sync_routes
from user_management_routes import router as user_management_router
import user_management_routes
from dashboard_routes import router as dashboard_router
from question_image_routes import router as question_image_router
from cbse_data_routes import router as cbse_data_router
from class_chapters_routes import router as class_chapters_router
from admin_realtime_analytics_routes import router as admin_analytics_router
from referral_routes import router as referral_router
import referral_routes
from media_upload_routes import router as media_upload_router
import media_upload_routes
from messaging_routes import router as messaging_router
import messaging_routes
from institute_panel_routes import router as institute_panel_router
 
# ── Divya AI Tutor (merged: podcast + live tutor, Sarvam TTS) ─────────────────
from divya_routes import router as divya_router, live_router as divya_live_router
from divya_progress_routes import router as divya_progress_router
 
 
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
profile_follow_routes.db = profile_routes.db  # shared db reference after init
profile_content_routes.db = profile_routes.db
notification_routes.init_db(db)
books_routes.init_db(db)
exam_structure_routes.init_db(db)
exam_sync_routes.init_db(db)
user_management_routes.init_db(db)
battle_async_routes.init_db(db)
 
# Initialize referral routes
referral_routes.init_db(db)
 
# Initialize media upload routes
media_upload_routes.init_db(db)
 
# Initialize messaging routes
messaging_routes.init_db(db)
 
# Initialize social auto-post utilities
import social_auto_post
social_auto_post.init_db(db)

# Initialize institute panel routes
import institute_panel_routes
institute_panel_routes.init_db(db)
 
# Create the main FastAPI app without a prefix
fastapi_app = FastAPI()
 
origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()]
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Add session middleware for OAuth
fastapi_app.add_middleware(SessionMiddleware, secret_key=os.environ["JWT_SECRET"])
 
# Import and mount Battle Socket.IO
from battle_socketio import socket_app as battle_socket_app, init_socketio_db, start_matchmaking_sweep
init_socketio_db(db)
fastapi_app.mount("/api/battlews", battle_socket_app)
 
# Import and mount Social Feed Socket.IO
from social_socketio import social_socket_app, init_social_socketio_db
init_social_socketio_db(db)
fastapi_app.mount("/api/socialws", social_socket_app)
 
# Import and mount Messaging Socket.IO
from messaging_socketio import messaging_socket_app, init_messaging_socketio_db
init_messaging_socketio_db(db)
fastapi_app.mount("/api/messagews", messaging_socket_app)
 
# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
 
 
# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
 
class StatusCheckCreate(BaseModel):
    client_name: str
 
@api_router.get("/")
async def root():
    return {"message": "Hello World"}
 
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj
 
@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks
 
# Include the router in the main app
fastapi_app.include_router(api_router)
fastapi_app.include_router(quiz_router, prefix="/api")
fastapi_app.include_router(auth_router, prefix="/api")
fastapi_app.include_router(account_security_router, prefix="/api")
fastapi_app.include_router(sheets_router, prefix="/api")
fastapi_app.include_router(image_extraction_router, prefix="/api")
fastapi_app.include_router(battle_router)
fastapi_app.include_router(battle_async_router)
 
# Contact/Support routes
import contact_routes
contact_routes.init_db(db)
fastapi_app.include_router(contact_router, prefix="/api")
 
# Programs/Courses routes
import programs_routes
programs_routes.init_db(db)
fastapi_app.include_router(programs_router, prefix="/api")
 
fastapi_app.include_router(social_feed_router, prefix="/api/social")
fastapi_app.include_router(ceep_router, prefix="/api/ceep")
fastapi_app.include_router(admin_router, prefix="/api")
fastapi_app.include_router(chapter_test_router)
fastapi_app.include_router(profile_router, prefix="/api/profile")
fastapi_app.include_router(profile_follow_router, prefix="/api/profile")
fastapi_app.include_router(profile_content_router, prefix="/api/profile")
fastapi_app.include_router(notification_router, prefix="/api")
fastapi_app.include_router(search_router)
fastapi_app.include_router(books_router)
fastapi_app.include_router(exam_structure_router)
fastapi_app.include_router(exam_metadata_router)
fastapi_app.include_router(x_auth_router, prefix="/api")
fastapi_app.include_router(emergent_auth_router, prefix="/api")
fastapi_app.include_router(exam_sync_router)
fastapi_app.include_router(exam_management_router, prefix="/api/admin/manage")
fastapi_app.include_router(referral_router, prefix="/api")
fastapi_app.include_router(admin_data_router, prefix="/api/admin")
fastapi_app.include_router(class_chapters_router)
fastapi_app.include_router(admin_analytics_router)
fastapi_app.include_router(user_management_router, prefix="/api")
fastapi_app.include_router(dashboard_router)
fastapi_app.include_router(messaging_router, prefix="/api/messages")
fastapi_app.include_router(question_image_router, prefix="/api")
fastapi_app.include_router(cbse_data_router, prefix="/api")
fastapi_app.include_router(media_upload_router, prefix="/api")
fastapi_app.include_router(institute_panel_router)
 
# Employee routes
from employee_routes import router as employee_router
import employee_routes
employee_routes.init_db(db)
fastapi_app.include_router(employee_router, prefix="/api")
 
# Milestone and monetization routes
from milestone_routes import router as milestone_router
import milestone_routes
milestone_routes.init_db(db)
fastapi_app.include_router(milestone_router, prefix="/api")
 
# SEO routes
from seo_routes import router as seo_router
import seo_routes
seo_routes.init_db(db)
fastapi_app.include_router(seo_router, prefix="/api")
 
# Translation routes
from translation_routes import router as translation_router
import translation_routes
translation_routes.init_db(db)
fastapi_app.include_router(translation_router, prefix="/api/translate")
 
# Test routes
from test_routes import router as test_router
fastapi_app.include_router(test_router, prefix="/api")
 
# ── Divya AI Tutor routes (podcast + live, Sarvam TTS) ────────────────────────
fastapi_app.include_router(divya_router,      prefix="/api")  # /api/divya/*
fastapi_app.include_router(divya_live_router, prefix="/api")  # /api/divya/live/*
fastapi_app.include_router(divya_progress_router, prefix="/api")  # /api/divya/progress/*
 
# Live Battles Admin Routes
from live_battles_admin_routes import router as live_battles_admin_router
import live_battles_admin_routes
live_battles_admin_routes.init_db(db)
fastapi_app.include_router(live_battles_admin_router, prefix="/api")
 
# Parents Mode Routes
from parents_mode_routes import router as parents_mode_router
import parents_mode_routes
parents_mode_routes.init_db(db)
fastapi_app.include_router(parents_mode_router, prefix="/api")
 
# Admin Auth Routes
from admin_auth_routes import router as admin_auth_router
import admin_auth_routes
admin_auth_routes.init_db(db)
fastapi_app.include_router(admin_auth_router, prefix="/api")
 
from push_notification_routes import router as push_router
fastapi_app.include_router(push_router, prefix="/api")
 
# Recruitment Portal Routes
from recruitment_routes import router as recruitment_router
from recruitment_admin_routes import router as recruitment_admin_router
fastapi_app.include_router(recruitment_router, prefix="/api")
fastapi_app.include_router(recruitment_admin_router, prefix="/api")
 
# Agora RTC Token Routes
from agora_routes import router as agora_router
fastapi_app.include_router(agora_router, prefix="/api")

# Test History Routes (MongoDB + per-attempt S3 JSON archive)
from test_history_routes import router as test_history_router
fastapi_app.include_router(test_history_router, prefix="/api/test-history")
 
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
 
@fastapi_app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
 
@fastapi_app.on_event("startup")
async def startup_matchmaking():
    start_matchmaking_sweep()
 
@fastapi_app.on_event("startup")
async def seed_recruitment():
    from recruitment_seed import seed_recruitment_data
    await seed_recruitment_data(db)

@fastapi_app.on_event("startup")
async def startup_test_history_indexes():
    from indexes import ensure_test_history_indexes
    await ensure_test_history_indexes(db)


@fastapi_app.on_event("startup")
async def startup_general_indexes():
    from add_indexes import ensure_all_indexes
    await ensure_all_indexes(db)
 
app = fastapi_app
 
print("[INIT] FastAPI running on port 8001")
print("[INIT] REST endpoints: /api/*")
print("[INIT] Battle Socket.IO endpoint: /api/battlews/socket.io")
print("[INIT] Battle rooms will persist to MongoDB")
print("[INIT] Board API endpoints added: /api/battle/async/user/{user_id}/rooms, /api/battle/async/rooms/{pin}/submission/{user_id}")
print("[INIT] Divya AI Tutor: /api/divya/* and /api/divya/live/* (Sarvam TTS)")
