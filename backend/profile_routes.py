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

JWT_SECRET = os.getenv("JWT_SECRET", "ceibaa-super-secret-key")
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
    Supports both authentication methods for backward compatibility
    """
    # Try session cookie first (Emergent auth)
    if request and hasattr(request, 'cookies'):
        session_token = request.cookies.get("session_token")
        if session_token:
            user_id = await get_user_from_session(session_token)
            if user_id:
                return user_id
    
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
    return notification

# ==================== PROFILE ENDPOINTS ====================

# --- Close friend endpoint ---
@router.post("/close-friend")
async def toggle_close_friend(request: Request):
    """Add or remove a user from close friends list."""
    try:
        body = await request.json()
        target_user_id = body.get("target_user_id")
        action = body.get("action", "add")  # 'add' or 'remove'

        authorization = request.headers.get("authorization")
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")

        token = authorization.replace("Bearer ", "")
        import jwt
        payload = jwt.decode(token, os.environ.get("JWT_SECRET", "ceibaa-super-secret-key-2024-change-in-production"), algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        if action == "add":
            await db.close_friends.update_one(
                {"user_id": user_id, "friend_id": target_user_id},
                {"$set": {"user_id": user_id, "friend_id": target_user_id, "created_at": datetime.now(timezone.utc).isoformat()}},
                upsert=True
            )
            # Also update follow relationship type
            await db.follows.update_one(
                {"follower_id": user_id, "following_id": target_user_id},
                {"$set": {"follow_type": "close_friend"}}
            )
        else:
            await db.close_friends.delete_one({"user_id": user_id, "friend_id": target_user_id})
            await db.follows.update_one(
                {"follower_id": user_id, "following_id": target_user_id},
                {"$set": {"follow_type": "approved"}}
            )

        return {"success": True, "action": action}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Block user endpoint ---
@router.post("/block")
async def block_user(request: Request):
    """Block a user."""
    try:
        body = await request.json()
        target_user_id = body.get("target_user_id")

        authorization = request.headers.get("authorization")
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")

        token = authorization.replace("Bearer ", "")
        import jwt
        payload = jwt.decode(token, os.environ.get("JWT_SECRET", "ceibaa-super-secret-key-2024-change-in-production"), algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Add to blocks
        await db.blocks.update_one(
            {"blocker_id": user_id, "blocked_id": target_user_id},
            {"$set": {"blocker_id": user_id, "blocked_id": target_user_id, "created_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )

        # Remove any follow relationship
        await db.follows.delete_many({
            "$or": [
                {"follower_id": user_id, "following_id": target_user_id},
                {"follower_id": target_user_id, "following_id": user_id}
            ]
        })

        # Remove from close friends
        await db.close_friends.delete_many({
            "$or": [
                {"user_id": user_id, "friend_id": target_user_id},
                {"user_id": target_user_id, "friend_id": user_id}
            ]
        })

        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- User stats endpoint ---
@router.get("/stats/{user_id}")
async def get_user_stats(user_id: str):
    """Get quiz/battle stats for a user."""
    try:
        # Count quizzes completed
        quizzes_completed = await db.quiz_history.count_documents({"user_id": user_id})

        # Calculate average score
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "avg_score": {"$avg": "$accuracy"}}}
        ]
        avg_result = await db.quiz_history.aggregate(pipeline).to_list(1)
        avg_score = avg_result[0]["avg_score"] if avg_result else 0

        # Count battle wins
        battle_wins = await db.user_battle_history.count_documents({
            "user_id": user_id,
            "$or": [{"result": "won"}, {"is_winner": True}, {"rank": 1}]
        })

        # Calculate rank (by total XP or quizzes)
        rank = None
        try:
            user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "xp": 1, "total_xp": 1})
            if user_doc:
                user_xp = user_doc.get("total_xp", user_doc.get("xp", 0))
                if user_xp > 0:
                    rank = await db.users.count_documents({
                        "$or": [
                            {"total_xp": {"$gt": user_xp}},
                            {"xp": {"$gt": user_xp}}
                        ]
                    }) + 1
        except Exception:
            pass

        return {
            "success": True,
            "quizzes_completed": quizzes_completed,
            "avg_score": round(avg_score, 1) if avg_score else 0,
            "battle_wins": battle_wins,
            "rank": rank
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Mutual followers endpoint ---
@router.get("/mutual-followers/{target_user_id}")
async def get_mutual_followers(target_user_id: str, request: Request):
    """Get users that both the current user and target user follow."""
    try:
        authorization = request.headers.get("authorization")
        if not authorization:
            return {"success": True, "mutual": []}

        token = authorization.replace("Bearer ", "")
        import jwt
        payload = jwt.decode(token, os.environ.get("JWT_SECRET", "ceibaa-super-secret-key-2024-change-in-production"), algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            return {"success": True, "mutual": []}

        # Get people who follow the target user
        target_followers = await db.follows.find(
            {"following_id": target_user_id, "status": "approved"},
            {"_id": 0, "follower_id": 1}
        ).to_list(500)
        target_follower_ids = {f["follower_id"] for f in target_followers}

        # Get people the current user follows
        my_following = await db.follows.find(
            {"follower_id": user_id, "status": "approved"},
            {"_id": 0, "following_id": 1}
        ).to_list(500)
        my_following_ids = {f["following_id"] for f in my_following}

        # Intersection
        mutual_ids = list(target_follower_ids & my_following_ids)[:5]

        mutual_users = []
        for mid in mutual_ids:
            u = await db.users.find_one({"id": mid}, {"_id": 0, "id": 1, "name": 1, "username": 1, "profile_picture": 1})
            if u:
                mutual_users.append(u)

        return {"success": True, "mutual": mutual_users}
    except Exception as e:
        return {"success": True, "mutual": []}


@router.get("/{username}")
async def get_user_profile(username: str, current_user_id: Optional[str] = None):
    """
    Get user profile by username or user ID
    Returns full profile if public or if viewer is following (for private accounts)
    """
    try:
        # Get target user - try by username first, then by ID if that fails
        try:
            user = await get_user_by_username(username)
        except:
            # If username lookup fails, try looking up by ID (for UUID-based URLs)
            user = await db.users.find_one({"id": username}, {"_id": 0})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
        
        user.pop("_id", None)
        
        # Check if user is disabled
        is_disabled = user.get("is_disabled", False)
        
        # If user is disabled and viewer is not the user themselves, return limited info
        if is_disabled and current_user_id != user["id"]:
            return {
                "success": True,
                "profile": {
                    "id": user["id"],
                    "user_id": user["id"],
                    "username": user.get("username"),
                    "name": user.get("name"),
                    "profile_picture": user.get("profile_picture"),
                    "is_disabled": True,
                    "followers_count": 0,
                    "following_count": 0,
                    "posts_count": 0,
                    "can_view": False
                },
                "follow_status": None,
                "is_disabled": True
            }
        
        # Get follow counts
        followers_count, following_count = await get_follow_counts(user["id"])
        user["followers_count"] = followers_count
        user["following_count"] = following_count
        
        # Get posts count (excluding reposts to match frontend Posts tab filter)
        posts_count = await db.social_posts.count_documents({
            "user_id": user["id"],
            "is_retweet": {"$ne": True}
        })
        
        # Add comments count to posts count (comments are user activity too)
        comments_count = await db.comments.count_documents({
            "user_id": user["id"]
        })
        
        user["posts_count"] = posts_count + comments_count
        
        # Add badge information
        user["badges"] = {
            "isTeacher": user.get("isTeacher", False),
            "isProfessor": user.get("isProfessor", False),
            "isOfficial": user.get("isOfficial", False),
            "isInstitute": user.get("isInstitute", False)
        }
        
        # Determine profile visibility based on privacy settings and follow relationship
        is_private = user.get("is_private", False)
        follow_status = None
        
        # Case 1: User viewing their own profile - always full access
        if current_user_id == user["id"]:
            can_view_full_profile = True
        
        # Case 2: No current user (not logged in) - only see public profiles
        elif not current_user_id:
            can_view_full_profile = not is_private
        
        # Case 3: Logged in user viewing someone else's profile
        else:
            relationship = await check_follow_relationship(current_user_id, user["id"])
            if relationship:
                follow_status = relationship.get("status")
                # Can view if following (approved) OR if profile is public
                can_view_full_profile = (follow_status == "approved") or not is_private
            else:
                # Not following - can only view if profile is public
                can_view_full_profile = not is_private
        
        # If private and not following, return limited info
        if is_private and not can_view_full_profile:
            return {
                "success": True,
                "profile": {
                    "id": user["id"],
                    "user_id": user["id"],
                    "username": user.get("username"),
                    "name": user.get("name"),
                    "profile_picture": user.get("profile_picture"),
                    "is_private": True,
                    "followers_count": followers_count,
                    "following_count": following_count,
                    "can_view": False
                },
                "follow_status": follow_status
            }
        
        # Return full profile
        return {
            "success": True,
            "profile": user,
            "follow_status": follow_status,
            "can_view": can_view_full_profile,
            "is_disabled": is_disabled
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

@router.get("/id/{user_id}")
async def get_user_profile_by_id(user_id: str, current_user_id: Optional[str] = None):
    """Get user profile by user ID"""
    try:
        user = await get_user_by_id(user_id)
        username = user.get("username")
        if not username:
            raise HTTPException(status_code=404, detail="Username not found for user")
        return await get_user_profile(username, current_user_id)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

@router.put("/update")
async def update_user_profile(
    profile_data: ProfileUpdate,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Update user profile"""
    try:
        # Get user_id using hybrid authentication
        user_id = await get_user_id_from_request(authorization, request)
        
        # Get current user
        user = await get_user_by_id(user_id)
        
        # Build update data
        update_data = {}
        if profile_data.name is not None:
            update_data["name"] = profile_data.name
        if profile_data.bio is not None:
            update_data["bio"] = profile_data.bio
        if profile_data.location is not None:
            update_data["location"] = profile_data.location
        if profile_data.exam_focus is not None:
            update_data["exam_focus"] = profile_data.exam_focus
        if profile_data.profile_picture is not None:
            update_data["profile_picture"] = profile_data.profile_picture
        if profile_data.cover_photo is not None:
            update_data["cover_photo"] = profile_data.cover_photo
        if profile_data.website is not None:
            update_data["website"] = profile_data.website
        
        update_data["last_active"] = datetime.now(timezone.utc).isoformat()
        
        # Update user in database
        await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        
        # Fetch updated profile to return
        updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "updated_fields": list(update_data.keys()),
            "profile": updated_user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")

@router.put("/privacy")
async def update_privacy_settings(
    is_private: bool,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Toggle account privacy (public/private)"""
    try:
        # Get user_id using hybrid authentication
        user_id = await get_user_id_from_request(authorization, request)
        
        # Update privacy setting
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"is_private": is_private}}
        )
        
        return {
            "success": True,
            "message": f"Account is now {'private' if is_private else 'public'}",
            "is_private": is_private
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating privacy: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating privacy: {str(e)}")

# ==================== FOLLOW SYSTEM ENDPOINTS ====================

@router.post("/follow")
async def follow_user(
    follow_request: FollowRequest,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Follow a user
    - Public accounts: Instant follow
    - Private accounts: Send follow request
    """
    try:
        # Get user_id using hybrid authentication
        follower_id = await get_user_id_from_request(authorization, request)
        following_id = follow_request.target_user_id
        
        # Can't follow yourself
        if follower_id == following_id:
            raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
        # Check if already following
        existing = await check_follow_relationship(follower_id, following_id)
        if existing:
            return {
                "success": False,
                "message": "Already following or request pending",
                "status": existing.get("status")
            }
        
        # Get target user
        target_user = await get_user_by_id(following_id)
        is_private = target_user.get("is_private", False)
        
        # Get follower info for notification
        follower = await get_user_by_id(follower_id)
        
        # Create follow relationship
        follow_status = "pending" if is_private else "approved"
        follow_doc = {
            "id": str(uuid.uuid4()),
            "follower_id": follower_id,
            "following_id": following_id,
            "status": follow_status,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.follows.insert_one(follow_doc)
        
        # Create notification
        if is_private:
            notification_content = f"{follower.get('name', 'Someone')} requested to follow you"
        else:
            notification_content = f"{follower.get('name', 'Someone')} started following you"
        
        await create_notification(
            user_id=following_id,
            notification_type="follow" if not is_private else "follow_request",
            actor_id=follower_id,
            actor_name=follower.get("name", "Unknown"),
            actor_avatar=follower.get("profile_picture", ""),
            content=notification_content
        )
        
        return {
            "success": True,
            "message": "Follow request sent" if is_private else "Now following",
            "status": follow_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error following user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error following user: {str(e)}")

@router.delete("/unfollow/{target_user_id}")
async def unfollow_user(
    target_user_id: str,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Unfollow a user or cancel follow request"""
    try:
        # Get user_id using hybrid authentication
        follower_id = await get_user_id_from_request(authorization, request)
        
        # Delete follow relationship
        result = await db.follows.delete_one({
            "follower_id": follower_id,
            "following_id": target_user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Follow relationship not found")
        
        return {
            "success": True,
            "message": "Unfollowed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error unfollowing user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error unfollowing user: {str(e)}")

@router.post("/follow-request/{request_id}/approve")
async def approve_follow_request(
    request_id: str,
    req: Request,
    authorization: Optional[str] = Header(None)
):
    """Approve a follow request (for private accounts)"""
    try:
        # Get user_id using hybrid authentication
        user_id = await get_user_id_from_request(authorization, req)
        
        # Get follow request
        follow_request = await db.follows.find_one({
            "id": request_id,
            "following_id": user_id,
            "status": "pending"
        })
        
        if not follow_request:
            raise HTTPException(status_code=404, detail="Follow request not found")
        
        # Update status to approved
        await db.follows.update_one(
            {"id": request_id},
            {"$set": {"status": "approved"}}
        )
        
        # Get follower info
        follower = await get_user_by_id(follow_request["follower_id"])
        current_user = await get_user_by_id(user_id)
        
        # Create notification for requester
        await create_notification(
            user_id=follow_request["follower_id"],
            notification_type="follow_approved",
            actor_id=user_id,
            actor_name=current_user.get("name", "Unknown"),
            actor_avatar=current_user.get("profile_picture", ""),
            content=f"{current_user.get('name', 'Someone')} accepted your follow request"
        )
        
        return {
            "success": True,
            "message": "Follow request approved"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error approving follow request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error approving follow request: {str(e)}")

@router.delete("/follow-request/{request_id}/decline")
async def decline_follow_request(
    request_id: str,
    req: Request,
    authorization: Optional[str] = Header(None)
):
    """Decline a follow request"""
    try:
        # Get user_id using hybrid authentication
        user_id = await get_user_id_from_request(authorization, req)
        
        # Delete follow request
        result = await db.follows.delete_one({
            "id": request_id,
            "following_id": user_id,
            "status": "pending"
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Follow request not found")
        
        return {
            "success": True,
            "message": "Follow request declined"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error declining follow request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error declining follow request: {str(e)}")

@router.get("/followers/{user_id}")
async def get_followers(
    user_id: str,
    skip: int = 0,
    limit: int = 50
):
    """Get list of followers for a user from all collections"""
    try:
        # Get approved followers from follows collection
        followers_cursor = db.follows.find({
            "following_id": user_id,
            "status": "approved"
        }).sort("created_at", -1)
        followers_data_follows = await followers_cursor.to_list(length=None)
        
        # Get followers from ceeps collection
        ceepers_cursor = db.ceeps.find({
            "ceep_user_id": user_id
        }).sort("created_at", -1)
        followers_data_ceeps = await ceepers_cursor.to_list(length=None)
        
        # Combine and deduplicate followers by user_id
        seen_user_ids = set()
        all_followers_data = []
        
        for follow in followers_data_follows:
            if follow["follower_id"] not in seen_user_ids:
                seen_user_ids.add(follow["follower_id"])
                all_followers_data.append({
                    "user_id": follow["follower_id"],
                    "created_at": follow.get("created_at")
                })
        
        for ceep in followers_data_ceeps:
            if ceep["user_id"] not in seen_user_ids:
                seen_user_ids.add(ceep["user_id"])
                all_followers_data.append({
                    "user_id": ceep["user_id"],
                    "created_at": ceep.get("created_at")
                })
        
        # Sort by created_at and apply pagination
        all_followers_data.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        paginated_followers = all_followers_data[skip:skip + limit]
        
        # Get follower user details
        followers = []
        for follow_data in paginated_followers:
            follower = await db.users.find_one({"id": follow_data["user_id"]})
            if follower:
                follower.pop("_id", None)
                followers.append({
                    "user_id": follower["id"],
                    "username": follower.get("username"),
                    "name": follower.get("name"),
                    "profile_picture": follower.get("profile_picture"),
                    "bio": follower.get("bio"),
                    "followed_at": follow_data.get("created_at")
                })
        
        return {
            "success": True,
            "followers": followers,
            "total": len(all_followers_data),
            "showing": len(followers)
        }
        
    except Exception as e:
        print(f"Error fetching followers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching followers: {str(e)}")

@router.get("/following/{user_id}")
async def get_following(
    user_id: str,
    skip: int = 0,
    limit: int = 50
):
    """Get list of users that a user is following from all collections"""
    try:
        # Get approved following from follows collection
        following_cursor = db.follows.find({
            "follower_id": user_id,
            "status": "approved"
        }).sort("created_at", -1)
        following_data_follows = await following_cursor.to_list(length=None)
        
        # Get following from ceeps collection
        ceeps_cursor = db.ceeps.find({
            "user_id": user_id
        }).sort("created_at", -1)
        following_data_ceeps = await ceeps_cursor.to_list(length=None)
        
        # Combine and deduplicate by following_user_id
        seen_user_ids = set()
        all_following_data = []
        
        for follow in following_data_follows:
            if follow["following_id"] not in seen_user_ids:
                seen_user_ids.add(follow["following_id"])
                all_following_data.append({
                    "user_id": follow["following_id"],
                    "created_at": follow.get("created_at")
                })
        
        for ceep in following_data_ceeps:
            if ceep["ceep_user_id"] not in seen_user_ids:
                seen_user_ids.add(ceep["ceep_user_id"])
                all_following_data.append({
                    "user_id": ceep["ceep_user_id"],
                    "created_at": ceep.get("created_at")
                })
        
        # Sort by created_at and apply pagination
        all_following_data.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        paginated_following = all_following_data[skip:skip + limit]
        
        # Get following user details
        following = []
        for follow_data in paginated_following:
            followed_user = await db.users.find_one({"id": follow_data["user_id"]})
            if followed_user:
                followed_user.pop("_id", None)
                following.append({
                    "user_id": followed_user["id"],
                    "username": followed_user.get("username"),
                    "name": followed_user.get("name"),
                    "profile_picture": followed_user.get("profile_picture"),
                    "bio": followed_user.get("bio"),
                    "followed_at": follow_data.get("created_at")
                })
        
        return {
            "success": True,
            "following": following,
            "total": len(all_following_data),
            "showing": len(following)
        }
        
    except Exception as e:
        print(f"Error fetching following: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching following: {str(e)}")

@router.get("/follow-requests")
async def get_follow_requests(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Get pending follow requests for current user"""
    try:
        # Get user_id using hybrid authentication
        user_id = await get_user_id_from_request(authorization, request)
        
        # Get pending requests
        requests_cursor = db.follows.find({
            "following_id": user_id,
            "status": "pending"
        }).sort("created_at", -1)
        
        requests_data = await requests_cursor.to_list(length=None)
        
        # Get requester details
        requests = []
        for request in requests_data:
            requester = await db.users.find_one({"id": request["follower_id"]})
            if requester:
                requester.pop("_id", None)
                
                # Check for mutual followers (people who follow both current user and requester)
                # Get all followers of the requester
                requester_followers = await db.follows.find({
                    "following_id": request["follower_id"],
                    "status": "approved"
                }, {"follower_id": 1, "_id": 0}).to_list(length=None)
                
                requester_follower_ids = [f["follower_id"] for f in requester_followers]
                
                # Count how many of these followers the current user also follows
                if requester_follower_ids:
                    mutual_count = await db.follows.count_documents({
                        "follower_id": user_id,
                        "following_id": {"$in": requester_follower_ids},
                        "status": "approved"
                    })
                else:
                    mutual_count = 0
                
                requests.append({
                    "request_id": request["id"],
                    "user_id": requester["id"],
                    "username": requester.get("username"),
                    "name": requester.get("name"),
                    "profile_picture": requester.get("profile_picture"),
                    "bio": requester.get("bio"),
                    "requested_at": request.get("created_at"),
                    "mutual_followers": mutual_count
                })
        
        return {
            "success": True,
            "requests": requests,
            "total": len(requests)
        }
        
    except Exception as e:
        print(f"Error fetching follow requests: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching follow requests: {str(e)}")

@router.get("/follow-status/{target_user_id}")
async def get_follow_status(
    target_user_id: str,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Check follow status between current user and target user"""
    try:
        if not authorization:
            return {
                "success": True,
                "following": False,
                "status": None
            }
        
        # Get user_id using hybrid authentication
        try:
            user_id = await get_user_id_from_request(authorization, request)
        except HTTPException:
            return {
                "success": True,
                "following": False,
                "status": None
            }
        
        # Check relationship
        relationship = await check_follow_relationship(user_id, target_user_id)
        
        if relationship:
            return {
                "success": True,
                "following": relationship.get("status") == "approved",
                "status": relationship.get("status"),
                "followed_at": relationship.get("created_at")
            }
        
        return {
            "success": True,
            "following": False,
            "status": None
        }
        
    except Exception as e:
        print(f"Error checking follow status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking follow status: {str(e)}")


# ==================== USER ACTIVITY ENDPOINTS ====================

@router.get("/{username}/posts")
async def get_user_posts(username: str, current_user_id: Optional[str] = None):
    """Get all posts by a specific user, including their comments on other posts"""
    try:
        # Get user by username first, then try by ID if that fails
        try:
            user = await get_user_by_username(username)
        except:
            # If username lookup fails, try looking up by ID (for UUID-based URLs)
            user = await db.users.find_one({"id": username}, {"_id": 0})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
        user_id = user["id"]
        
        # Check if the user is disabled
        # If disabled, only the user themselves can see their posts
        is_disabled = user.get("is_disabled", False)
        if is_disabled and current_user_id != user_id:
            return {
                "success": True,
                "posts": [],
                "message": "This user's posts are not available"
            }
        
        # Privacy check - posts are publicly visible
        # (Privacy setting is optional but doesn't restrict post visibility)
        # This ensures consistency between timeline and profile views
        can_view = True
        
        # Fetch user's posts from social_posts collection
        posts = await db.social_posts.find({"user_id": user_id}).sort("created_at", -1).to_list(length=100)
        
        # Remove MongoDB _id field from each post and ensure is_retweet is explicitly set
        for post in posts:
            post.pop("_id", None)
            # Ensure is_retweet is explicitly false if not present
            if "is_retweet" not in post:
                post["is_retweet"] = False
        
        # Fetch user's comments
        comments = await db.comments.find({"user_id": user_id}).sort("created_at", -1).to_list(length=100)
        
        # For each comment, fetch the original post and create a comment-post object
        for comment in comments:
            comment.pop("_id", None)
            
            # Fetch the original post that was commented on
            original_post = await db.social_posts.find_one({"id": comment.get("post_id")}, {"_id": 0})
            
            if original_post:
                # Create a comment-post hybrid object to display in the feed
                comment_post = {
                    "id": f"comment_{comment.get('id')}",  # Unique ID for the comment-post
                    "comment_id": comment.get("id"),
                    "user_id": user_id,
                    "user_name": user.get("name", "User"),
                    "username": user.get("username"),
                    "user_avatar": user.get("profile_picture"),
                    "is_comment": True,  # Flag to identify this as a comment
                    "content": comment.get("content"),  # Comment content
                    "comment_content": comment.get("content"),  # Backward compatibility
                    "created_at": comment.get("created_at"),
                    "is_retweet": False,
                    "likes_count": comment.get("likes_count", 0),
                    "comments_count": 0,  # Comments don't have nested comments in display
                    "shares_count": 0,
                    # Original post preview
                    "original_post": {
                        "id": original_post.get("id"),
                        "user_id": original_post.get("user_id"),
                        "user_name": original_post.get("user_name"),
                        "username": original_post.get("username"),
                        "user_avatar": original_post.get("user_avatar"),
                        "content": original_post.get("content"),
                        "post_type": original_post.get("post_type"),
                        "created_at": original_post.get("created_at"),
                        "quiz_details": original_post.get("quiz_details"),
                        "room_code": original_post.get("room_code")
                    }
                }
                posts.append(comment_post)
        
        # Sort all posts (including comment-posts) by created_at
        # Handle both datetime objects and strings
        def get_sort_key(post):
            created_at = post.get("created_at", "")
            if isinstance(created_at, datetime):
                return created_at.isoformat()
            return str(created_at)
        
        posts.sort(key=get_sort_key, reverse=True)
        
        return {
            "success": True,
            "posts": posts
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user posts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching user posts: {str(e)}")

@router.get("/{username}/quiz-rooms")
async def get_user_quiz_rooms(username: str, current_user_id: Optional[str] = None):
    """Get all quiz rooms created by a specific user"""
    try:
        # Get user by username first, then try by ID if that fails
        try:
            user = await get_user_by_username(username)
        except:
            # If username lookup fails, try looking up by ID (for UUID-based URLs)
            user = await db.users.find_one({"id": username}, {"_id": 0})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
        user_id = user["id"]
        
        # Privacy check - quiz rooms are publicly visible
        # (Privacy setting is optional but doesn't restrict quiz room visibility)
        # This ensures consistency between timeline and profile views
        can_view = True
        
        # Fetch user's quiz rooms
        # First get all quiz room posts by this user
        quiz_room_posts = await db.social_posts.find({
            "user_id": user_id,
            "post_type": "quiz_room"
        }, {"_id": 0}).sort("created_at", -1).to_list(length=100)
        
        # Extract room codes and fetch full room details
        room_codes = [post.get("room_code") for post in quiz_room_posts if post.get("room_code")]
        
        quiz_rooms = []
        for room_code in room_codes:
            # Try to get full room details from quiz_rooms collection
            room = await db.quiz_rooms.find_one({"room_code": room_code}, {"_id": 0})
            
            if room:
                # Full room data found in quiz_rooms collection
                # Don't include full questions array in list view
                room["question_count"] = len(room.get("questions", []))
                room.pop("questions", None)
                quiz_rooms.append(room)
            else:
                # Fallback: Build room data from the post itself
                # This handles cases where quiz_rooms collection is empty/missing
                matching_post = next((p for p in quiz_room_posts if p.get("room_code") == room_code), None)
                if matching_post:
                    quiz_room_data = {
                        "room_code": room_code,
                        "title": matching_post.get("quiz_details", {}).get("title") or f"Quiz Room {room_code}",
                        "description": matching_post.get("content", ""),
                        "category": matching_post.get("quiz_details", {}).get("category", "General"),
                        "question_count": matching_post.get("quiz_details", {}).get("question_count", 0),
                        "privacy": "public",  # Default to public
                        "host_id": user_id,
                        "host_username": user.get("username"),
                        "host_name": user.get("name"),
                        "created_at": matching_post.get("created_at")
                    }
                    quiz_rooms.append(quiz_room_data)
        
        return {
            "success": True,
            "quiz_rooms": quiz_rooms
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user quiz rooms: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching user quiz rooms: {str(e)}")

@router.get("/{username}/liked-posts")
async def get_user_liked_posts(username: str, current_user_id: Optional[str] = None):
    """Get all posts liked by a specific user"""
    try:
        # Get user by username first, then try by ID if that fails
        try:
            user = await get_user_by_username(username)
        except:
            # If username lookup fails, try looking up by ID (for UUID-based URLs)
            user = await db.users.find_one({"id": username}, {"_id": 0})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
        user_id = user["id"]
        
        # Check if can view (privacy check) - only own user or if public
        is_private = user.get("is_private", False)
        can_view = (current_user_id == user_id) or not is_private
        
        if is_private and current_user_id != user_id:
            # Check if following
            if current_user_id:
                relationship = await check_follow_relationship(current_user_id, user_id)
                can_view = relationship and relationship.get("status") == "approved"
            else:
                can_view = False
        
        if not can_view:
            return {
                "success": False,
                "message": "This account is private"
            }
        
        # Fetch all likes by this user
        likes = await db.post_likes.find({"user_id": user_id}).sort("created_at", -1).to_list(length=100)
        
        # Get the post IDs
        post_ids = [like.get("post_id") for like in likes]
        
        # Fetch the actual posts
        posts = await db.social_posts.find({"id": {"$in": post_ids}}).to_list(length=100)
        
        # Remove MongoDB _id field and ensure is_retweet is explicitly set
        for post in posts:
            post.pop("_id", None)
            # Ensure is_retweet is explicitly false if not present
            if "is_retweet" not in post:
                post["is_retweet"] = False
        
        return {
            "success": True,
            "posts": posts
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching liked posts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching liked posts: {str(e)}")


@router.get("/{username}/reposts")
async def get_user_reposts(username: str, current_user_id: Optional[str] = None):
    """Get all reposts/shares by a specific user"""
    try:
        # Get user by username first, then try by ID if that fails
        user = await db.users.find_one({"username": username}, {"_id": 0})
        if not user:
            # Try looking up by ID (for UUID-based URLs)
            user = await db.users.find_one({"id": username}, {"_id": 0})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user.get("id")
        
        # Privacy check - reposts are publicly visible
        
        # Fetch user's reposts from social_posts collection
        reposts = await db.social_posts.find({
            "user_id": user_id,
            "is_retweet": True
        }).sort("created_at", -1).to_list(length=100)
        
        # Process reposts and get original post data
        for repost in reposts:
            repost.pop("_id", None)
            
            # Get original post data if available
            original_post_id = repost.get("original_post_id")
            if original_post_id:
                original_post = await db.social_posts.find_one({"id": original_post_id}, {"_id": 0})
                if original_post:
                    repost["original_post"] = original_post
        
        return {
            "success": True,
            "reposts": reposts
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user reposts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching user reposts: {str(e)}")


@router.post("/admin/fix-posts-retweet-field")
async def fix_posts_retweet_field():
    """
    One-time database fix: Set is_retweet to False for all posts where it's not set or is null
    This fixes the profile page display issue where posts don't appear
    """
    try:
        # Fix posts where is_retweet doesn't exist
        result1 = await db.social_posts.update_many(
            {"is_retweet": {"$exists": False}},
            {"$set": {"is_retweet": False}}
        )
        
        # Fix posts where is_retweet is null
        result2 = await db.social_posts.update_many(
            {"is_retweet": None},
            {"$set": {"is_retweet": False}}
        )
        
        # Count posts that are marked as reposts but don't have original_user_id
        # (These are false reposts - posts incorrectly marked as reposts)
        false_reposts = await db.social_posts.count_documents({
            "is_retweet": True,
            "original_user_id": {"$exists": False}
        })
        
        # Fix false reposts
        result3 = await db.social_posts.update_many(
            {
                "is_retweet": True,
                "original_user_id": {"$exists": False}
            },
            {"$set": {"is_retweet": False}}
        )
        
        return {
            "success": True,
            "message": "Database fix completed",
            "fixed_missing_field": result1.modified_count,
            "fixed_null_values": result2.modified_count,
            "fixed_false_reposts": result3.modified_count,
            "total_fixed": result1.modified_count + result2.modified_count + result3.modified_count
        }
        
    except Exception as e:
        print(f"Error fixing posts retweet field: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fixing database: {str(e)}")

