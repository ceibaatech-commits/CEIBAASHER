"""
Profile Management Routes
Handles user profiles, follow system, and social features

RECOMMENDED DATABASE INDEXES FOR PERFORMANCE:
-----------------------------------------------
db.follows.createIndex({ "follower_id": 1, "following_id": 1 }, { unique: true })
db.follows.createIndex({ "following_id": 1, "status": 1 })
db.follows.createIndex({ "follower_id": 1, "status": 1 })
db.ceeps.createIndex({ "user_id": 1, "ceep_user_id": 1 }, { unique: true })
db.ceeps.createIndex({ "ceep_user_id": 1 })
db.social_posts.createIndex({ "user_id": 1, "created_at": -1 })
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "id": 1 }, { unique: true })
"""
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import JWT settings after loading env
import os
from jose import jwt, JWTError

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

router = APIRouter()

# Database connection will be injected
db = None

def init_db(database):
    """Initialize database connection"""
    global db
    db = database

# ==================== MODELS ====================

class ProfileUpdate(BaseModel):
    """Model for updating user profile"""
    name: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=150)
    location: Optional[str] = None
    exam_focus: Optional[List[str]] = None
    profile_picture: Optional[str] = None
    cover_photo: Optional[str] = None
    website: Optional[str] = None

class UserProfile(BaseModel):
    """Extended user profile model"""
    user_id: str
    username: str
    name: str
    email: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    cover_photo: Optional[str] = None
    location: Optional[str] = None
    exam_focus: List[str] = []
    website: Optional[str] = None
    
    # Privacy
    is_private: bool = False
    
    # Stats
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    quiz_rooms_created: int = 0
    quiz_rooms_participated: int = 0
    total_score: int = 0
    
    # Engagement
    joined_at: str
    last_active: Optional[str] = None
    streak_days: int = 0
    badges: List[str] = []

class FollowRequest(BaseModel):
    """Model for follow action"""
    target_user_id: str

class FollowResponse(BaseModel):
    """Response for follow action"""
    success: bool
    message: str
    status: str  # "approved" or "pending"

# ==================== HELPER FUNCTIONS ====================

async def get_user_from_session(session_token: str) -> Optional[str]:
    """Get user_id from session token (Emergent auth)"""
    try:
        # Find session in database
        session_doc = await db.user_sessions.find_one(
            {"session_token": session_token},
            {"_id": 0}
        )
        
        if not session_doc:
            return None
        
        # Check expiry
        expires_at = session_doc["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < datetime.now(timezone.utc):
            # Clean up expired session
            await db.user_sessions.delete_one({"session_token": session_token})
            return None
        
        return session_doc["user_id"]
    except Exception as e:
        print(f"Error validating session: {e}")
        return None

def decode_jwt_token(authorization: str) -> str:
    """Decode JWT token and extract user_id (old auth)"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token - no user ID found")
        return user_id
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

async def get_user_id_from_request(authorization: Optional[str], request: Request = None) -> str:
    """
    Get user_id from either session cookie (Emergent auth) or Authorization header (old JWT)
    Supports both authentication methods for backward compatibility.

    Stage 3 fix: the session_token cookie may contain either an Emergent session
    id OR a raw JWT (email/password login). Try both before 401-ing.
    """
    # Try session cookie first
    if request and hasattr(request, 'cookies'):
        session_token = request.cookies.get("session_token")
        if session_token:
            user_id = await get_user_from_session(session_token)
            if user_id:
                return user_id
            # Fall back to JWT decode on the cookie value itself
            try:
                payload = jwt.decode(session_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                uid = payload.get("sub")
                if uid:
                    return uid
            except JWTError:
                pass

    # Try Authorization header with session token or JWT
    if authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            # Try as session token first
            user_id = await get_user_from_session(token)
            if user_id:
                return user_id
            # Fall back to JWT
            return decode_jwt_token(authorization)

    raise HTTPException(status_code=401, detail="Not authenticated")

async def get_user_by_id(user_id: str):
    """Get user from database by ID"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_user_by_username(username: str):
    """Get user from database by username"""
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def check_follow_relationship(follower_id: str, following_id: str):
    """Check if follow relationship exists"""
    relationship = await db.follows.find_one({
        "follower_id": follower_id,
        "following_id": following_id
    })
    return relationship

async def get_follow_counts(user_id: str):
    """
    Get follower and following counts with proper deduplication
    Note: App writes to both 'ceeps' (legacy) and 'follows' (current) collections for compatibility
    We must deduplicate to avoid double-counting
    """
    # Get all follower relationships from both collections (with reasonable limit)
    followers_follows = await db.follows.find({
        "following_id": user_id,
        "status": "approved"
    }, {"follower_id": 1, "_id": 0}).to_list(length=10000)
    
    followers_ceeps = await db.ceeps.find({
        "ceep_user_id": user_id
    }, {"user_id": 1, "_id": 0}).to_list(length=10000)
    
    # Deduplicate follower IDs
    follower_ids = set()
    for follow in followers_follows:
        follower_ids.add(follow.get("follower_id"))
    for ceep in followers_ceeps:
        follower_ids.add(ceep.get("user_id"))
    follower_ids.discard(None)  # Remove any None values
    
    # Get all following relationships from both collections (with reasonable limit)
    following_follows = await db.follows.find({
        "follower_id": user_id,
        "status": "approved"
    }, {"following_id": 1, "_id": 0}).to_list(length=10000)
    
    following_ceeps = await db.ceeps.find({
        "user_id": user_id
    }, {"ceep_user_id": 1, "_id": 0}).to_list(length=10000)
    
    # Deduplicate following IDs
    following_ids = set()
    for follow in following_follows:
        following_ids.add(follow.get("following_id"))
    for ceep in following_ceeps:
        following_ids.add(ceep.get("ceep_user_id"))
    following_ids.discard(None)  # Remove any None values
    
    return len(follower_ids), len(following_ids)

async def create_notification(
    user_id: str,
    notification_type: str,
    actor_id: str,
    actor_name: str,
    actor_avatar: str,
    content: str,
    reference_id: Optional[str] = None
):
    """Create a notification"""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "actor_id": actor_id,
        "actor_name": actor_name,
        "actor_avatar": actor_avatar,
        "content": content,
        "reference_id": reference_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    # Best-effort real-time badge push (replaces 30s polling)
    try:
        from social_socketio import emit_unread_notifications_count
        await emit_unread_notifications_count(user_id)
    except Exception:
        pass
    return notification

# ==================== PROFILE ENDPOINTS ====================

# --- Close friend IDs endpoint ---
