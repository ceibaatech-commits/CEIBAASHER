"""
Ceibaa Social Feed Routes - Optimized Version

ARCHITECTURE DECISIONS:
-----------------------
1. FOLLOW SYSTEM: Uses 'follows' collection as single source of truth
   - 'ceeps' collection is LEGACY and no longer used for new follows
   - All new follow relationships stored ONLY in 'follows' collection
   - Supports privacy: 'approved' (public) or 'pending' (private accounts)
   
2. DATA CONSISTENCY:
   - No duplicate entries across collections
   - Counts based solely on 'follows' collection with status='approved'
   - profile_routes.py may query both for backward compatibility with old data
   
3. PERFORMANCE OPTIMIZATIONS:
   - Date parsing standardized to ISO format with timezone
   - Aggregation pipelines for large datasets
   - Proper pagination to avoid memory issues

RECOMMENDED DATABASE INDEXES:
-----------------------------
db.follows.createIndex({ "follower_id": 1, "following_id": 1 }, { unique: true })
db.follows.createIndex({ "following_id": 1, "status": 1 })
db.follows.createIndex({ "follower_id": 1, "status": 1 })
db.social_posts.createIndex({ "user_id": 1, "created_at": -1 })
db.social_posts.createIndex({ "created_at": -1 })
db.post_likes.createIndex({ "user_id": 1, "post_id": 1 }, { unique: true })
db.quiz_rooms.createIndex({ "room_code": 1 }, { unique: true })
"""
from fastapi import APIRouter, HTTPException, Header, Query, Request
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
import uuid
from jose import jwt, JWTError
import os
import asyncio

JWT_SECRET = os.getenv("JWT_SECRET", "ceibaa-super-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

router = APIRouter()
db = None

# Import social socketio for real-time broadcasts
import social_socketio

def init_db(database):
    global db
    db = database

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
    """Decode JWT token (old auth system)"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

async def get_user_id_from_request(authorization: Optional[str], request: any = None) -> str:
    """
    Get user_id from either session cookie (Emergent auth) or Authorization header (old JWT)
    Supports both authentication methods for backward compatibility.

    Stage 3 fix: the session_token cookie may contain either an Emergent session
    id OR a raw JWT (email/password/demo login). Try both before 401-ing.
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

    # Try Authorization header with session token
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

def get_optional_user_id(authorization: Optional[str]) -> Optional[str]:
    """Legacy function for optional JWT auth"""
    if not authorization:
        return None
    try:
        return decode_jwt_token(authorization)
    except HTTPException:
        return None

async def get_optional_user_id_async(authorization: Optional[str], request=None) -> Optional[str]:
    """Get user_id optionally from session token or JWT (supports both auth methods)"""
    # Try session cookie first
    if request and hasattr(request, 'cookies'):
        session_token = request.cookies.get("session_token")
        if session_token:
            user_id = await get_user_from_session(session_token)
            if user_id:
                return user_id
            # Stage 3 fix: fall back to JWT decode on cookie value
            try:
                payload = jwt.decode(session_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                uid = payload.get("sub")
                if uid:
                    return uid
            except JWTError:
                pass
    # Try Authorization header
    if not authorization:
        return None
    if authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        # Try as session token first
        user_id = await get_user_from_session(token)
        if user_id:
            return user_id
    # Fall back to JWT
    try:
        return decode_jwt_token(authorization)
    except HTTPException:
        return None

async def filter_expired_quiz_posts(posts: list) -> list:
    """Filter out expired quiz room posts (>24 hours)"""
    filtered = []
    now = datetime.now(timezone.utc)
    
    for post in posts:
        if post.get("post_type") != "quiz_room":
            filtered.append(post)
            continue
        
        # Check room_code in both root level and quiz_details
        room_code = post.get("room_code")
        if not room_code and post.get("quiz_details"):
            room_code = post.get("quiz_details", {}).get("room_code")
        
        if not room_code:
            # If no room code found, skip this post
            continue
        
        try:
            # Check in quiz_rooms collection first
            room = await db.quiz_rooms.find_one({"room_code": str(room_code).upper()})
            
            # If not found, check battle_rooms collection (Victory Lane creates rooms here)
            if not room:
                room = await db.battle_rooms.find_one({"roomId": str(room_code)})
            
            if not room:
                # Room doesn't exist in either collection, skip
                continue
            
            created_at = room.get("created_at") or room.get("createdAt")
            if created_at:
                # Handle different timestamp formats
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                elif isinstance(created_at, (int, float)):
                    # Unix timestamp - convert to datetime
                    created_at = datetime.fromtimestamp(created_at, tz=timezone.utc)
                
                # Check if within 24 hours
                if (now - created_at) <= timedelta(hours=24):
                    filtered.append(post)
        except Exception as e:
            print(f"Error checking quiz room {room_code}: {e}")
            continue
    
    return filtered

# ==================== MODELS ====================

class PostCreateRequest(BaseModel):
    post_type: Literal["battle_victory", "quiz_announcement", "study_tip", "achievement", "government", "video", "general", "room_code", "quiz_room", "quiz_result", "mcq", "question", "academic_question"]
    mcq_data: Optional[dict] = None
    content: str
    battle_stats: Optional[dict] = None
    quiz_details: Optional[dict] = None
    room_code: Optional[str] = None
    media_urls: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    exam_category: Optional[str] = None
    subject: Optional[str] = None
    # Academic question fields
    academic_class: Optional[str] = None  # e.g., "Class 9", "Class 11 (Science)"
    academic_subject: Optional[str] = None  # e.g., "Mathematics", "Hindi - Malhar"
    academic_chapter: Optional[str] = None  # e.g., "1. Number Systems"
    hashtags: Optional[List[str]] = None  # For hashtags

class CommentRequest(BaseModel):
    content: str
    parent_comment_id: Optional[str] = None

class LikeRequest(BaseModel):
    pass  # Empty body, user_id from token

class FollowRequest(BaseModel):
    pass

class GiftRequest(BaseModel):
    gift_type: str

class ChallengeRequest(BaseModel):
    subject: Optional[str] = None
    topic: Optional[str] = None

class BattlePostCreate(BaseModel):
    score: int
    rank: int
    exam: str
    topic: str
    opponents: List[str]
    total_participants: int
    questions_correct: Optional[int] = None

class QuizQuestion(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: Literal["A", "B", "C", "D"]
    time_limit: int = Field(default=30, ge=10, le=60)

class QuizRoomCreate(BaseModel):
    title: str
    description: str
    category: str
    privacy: Literal["public", "private", "followers_only"] = "public"
    questions: List[QuizQuestion] = Field(min_length=5, max_length=100)

class QuizResultSubmit(BaseModel):
    score: int = 0
    total_questions: int = 0
    answers: List[dict] = []

class StudyGroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    exam_focus: str
    is_private: bool = False

# ==================== POST ENDPOINTS ====================

@router.post("/posts")
async def create_post(
    post_data: PostCreateRequest,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Create a new post"""
    try:
        # Get user_id using new hybrid authentication (session or JWT)
        user_id = await get_user_id_from_request(authorization, request)
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        # Extract room_code from quiz_details if present and not provided at root
        room_code = post_data.room_code
        if not room_code and post_data.quiz_details:
            room_code = post_data.quiz_details.get("room_code")
        
        post_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "user_name": user.get("name", "User") if user else "User",
            "username": user.get("username") if user else None,
            "user_avatar": user.get("profile_picture") or user.get("avatar", "👤") if user else "👤",
            "user_verified": user.get("verified", False) if user else False,
            "user_location": user.get("location") if user else None,
            "isTeacher": user.get("isTeacher", False) if user else False,
            "isProfessor": user.get("isProfessor", False) if user else False,
            "isOfficial": user.get("isOfficial", False) if user else False,
            "isInstitute": user.get("isInstitute", False) if user else False,
            "post_type": post_data.post_type,
            "content": post_data.content,
            "battle_stats": post_data.battle_stats,
            "quiz_details": post_data.quiz_details,
            "mcq_data": post_data.mcq_data,
            "room_code": room_code,
            "media_urls": post_data.media_urls,
            "tags": post_data.tags or [],
            "hashtags": post_data.hashtags or [],
            "exam_category": post_data.exam_category,
            "subject": post_data.subject,
            # Academic question fields
            "academic_class": post_data.academic_class,
            "academic_subject": post_data.academic_subject,
            "academic_chapter": post_data.academic_chapter,
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "attempt_count": 0 if post_data.post_type == "mcq" else None,
            "correct_attempt_count": 0 if post_data.post_type == "mcq" else None,
            "trending_score": 100 if post_data.post_type == "quiz_room" else 0,  # Quiz rooms start with higher score
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.social_posts.insert_one(post_doc.copy())
        
        if user:
            await db.users.update_one({"id": user_id}, {"$inc": {"posts_count": 1}})
        
        # Broadcast new post in real-time
        asyncio.create_task(social_socketio.broadcast_new_post(post_doc))
        
        return {"success": True, "post": post_doc}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating post: {str(e)}")

@router.get("/posts/{post_id}")
async def get_post(post_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Get single post with comments"""
    try:
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Enrich post with current badge data from user
        if post.get("user_id"):
            post_author = await db.users.find_one(
                {"id": post["user_id"]},
                {"_id": 0, "id": 1, "profile_picture": 1, "isTeacher": 1, "isProfessor": 1, "isOfficial": 1, "isInstitute": 1, "is_verified": 1}
            )
            if post_author:
                post["user_avatar"] = post_author.get("profile_picture") or post.get("user_avatar")
                post["isTeacher"] = post_author.get("isTeacher", False)
                post["isProfessor"] = post_author.get("isProfessor", False)
                post["isOfficial"] = post_author.get("isOfficial", False)
                post["isInstitute"] = post_author.get("isInstitute", False)
                post["is_verified"] = post_author.get("is_verified", False)
        
        comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
        
        # Enrich comments with current badge data
        comment_user_ids = list(set(c.get("user_id") for c in comments if c.get("user_id")))
        if comment_user_ids:
            comment_users = await db.users.find(
                {"id": {"$in": comment_user_ids}},
                {"_id": 0, "id": 1, "username": 1, "profile_picture": 1, "isTeacher": 1, "isProfessor": 1, "isOfficial": 1, "isInstitute": 1}
            ).to_list(1000)
            comment_user_map = {u["id"]: u for u in comment_users}
            for comment in comments:
                u = comment_user_map.get(comment.get("user_id"))
                if u:
                    comment["isTeacher"] = u.get("isTeacher", False)
                    comment["isProfessor"] = u.get("isProfessor", False)
                    comment["isOfficial"] = u.get("isOfficial", False)
                    comment["isInstitute"] = u.get("isInstitute", False)
                    if not comment.get("username"):
                        comment["username"] = u.get("username")
        
        post["comments"] = comments
        
        user_id = await get_optional_user_id_async(authorization, request)
        if user_id:
            liked = await db.post_likes.find_one({"user_id": user_id, "post_id": post_id})
            post["liked_by_user"] = liked is not None
        
        return {"success": True, "post": post}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching post: {str(e)}")

@router.get("/academic-posts")
async def get_academic_posts(
    class_name: Optional[str] = Query(None, description="Class name e.g., 'Class 9'"),
    subject: Optional[str] = Query(None, description="Subject name e.g., 'Mathematics'"),
    chapter: Optional[str] = Query(None, description="Chapter name e.g., '1. Number Systems'"),
    skip: int = 0,
    limit: int = 20
):
    """Get academic question posts filtered by class, subject, and/or chapter"""
    try:
        query = {"post_type": "academic_question"}
        
        if class_name:
            # For Class 11/12, also match with stream suffix like "Class 11 (Science)"
            if class_name in ["Class 11", "Class 12"]:
                query["academic_class"] = {"$regex": f"^{class_name}", "$options": "i"}
            else:
                query["academic_class"] = class_name
        if subject:
            # Use regex for flexible matching (handles display names vs slugs)
            query["academic_subject"] = {"$regex": subject.replace("-", ".*").replace("  ", " "), "$options": "i"}
        if chapter:
            query["academic_chapter"] = chapter
        
        posts = await db.social_posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(None)
        
        # Get total count for pagination
        total = await db.social_posts.count_documents(query)
        
        return {
            "success": True,
            "posts": posts,
            "total": total,
            "has_more": (skip + limit) < total
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching academic posts: {str(e)}")

@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Delete a post"""
    try:
        user_id = await get_user_id_from_request(authorization, request)
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0})
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        if post["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await db.social_posts.delete_one({"id": post_id})
        await db.comments.delete_many({"post_id": post_id})
        await db.post_likes.delete_many({"post_id": post_id})
        
        return {"success": True, "message": "Post deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting post: {str(e)}")

# ==================== HYDRATION ENDPOINTS (X Algorithm Inspired) ====================

class HydrationRequest(BaseModel):
    """Request body for batch engagement hydration"""
    post_ids: List[str]
    user_id: Optional[str] = None

@router.post("/posts/hydrate")
async def hydrate_posts_engagement(
    request_data: HydrationRequest,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Hydrate engagement metrics for multiple posts.
    Similar to X's candidate hydration layer - fetches fresh engagement data
    independently from post content for real-time accuracy.
    """
    try:
        user_id = await get_optional_user_id_async(authorization, request) or request_data.user_id
        post_ids = request_data.post_ids
        
        if not post_ids or len(post_ids) == 0:
            return {"success": True, "engagement": {}}
        
        # Limit batch size to prevent abuse
        if len(post_ids) > 100:
            post_ids = post_ids[:100]
        
        engagement_data = {}
        
        # Fetch posts in batch
        posts = await db.social_posts.find(
            {"id": {"$in": post_ids}},
            {
                "_id": 0,
                "id": 1,
                "likes_count": 1,
                "comments_count": 1,
                "shares_count": 1,
                "views": 1,
                "share_count": 1,
                "comment_count": 1,
                "like_count": 1,
            }
        ).to_list(None)
        
        # Build engagement map
        for post in posts:
            post_id = post["id"]
            engagement_data[post_id] = {
                "likes_count": post.get("likes_count") or post.get("like_count") or 0,
                "comment_count": post.get("comments_count") or post.get("comment_count") or 0,
                "share_count": post.get("shares_count") or post.get("share_count") or 0,
                "views": post.get("views") or 0,
            }
        
        # Check if user has liked/shared these posts
        if user_id:
            # Get user's likes
            user_likes = await db.post_likes.find(
                {"user_id": user_id, "post_id": {"$in": post_ids}},
                {"_id": 0, "post_id": 1}
            ).to_list(None)
            liked_post_ids = {like["post_id"] for like in user_likes}
            
            # Get user's shares/reposts
            user_shares = await db.social_posts.find(
                {
                    "user_id": user_id,
                    "is_retweet": True,
                    "original_post_id": {"$in": post_ids}
                },
                {"_id": 0, "original_post_id": 1}
            ).to_list(None)
            shared_post_ids = {share["original_post_id"] for share in user_shares}
            
            # Update engagement data with user state
            for post_id in engagement_data:
                engagement_data[post_id]["liked_by_user"] = post_id in liked_post_ids
                engagement_data[post_id]["shared_by_user"] = post_id in shared_post_ids
        
        return {"success": True, "engagement": engagement_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error hydrating engagement: {str(e)}")

@router.get("/posts/{post_id}/engagement")
async def get_post_engagement(
    post_id: str,
    request: Request,
    user_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    """
    Get fresh engagement metrics for a single post.
    Used for real-time updates on single post views.
    """
    try:
        current_user = await get_optional_user_id_async(authorization, request) or user_id
        
        post = await db.social_posts.find_one(
            {"id": post_id},
            {
                "_id": 0,
                "likes_count": 1,
                "comments_count": 1,
                "shares_count": 1,
                "views": 1,
                "share_count": 1,
                "comment_count": 1,
                "like_count": 1,
            }
        )
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        engagement = {
            "likes_count": post.get("likes_count") or post.get("like_count") or 0,
            "comment_count": post.get("comments_count") or post.get("comment_count") or 0,
            "share_count": post.get("shares_count") or post.get("share_count") or 0,
            "views": post.get("views") or 0,
            "liked_by_user": False,
            "shared_by_user": False,
        }
        
        if current_user:
            # Check if user liked
            liked = await db.post_likes.find_one({"user_id": current_user, "post_id": post_id})
            engagement["liked_by_user"] = liked is not None
            
            # Check if user shared
            shared = await db.social_posts.find_one({
                "user_id": current_user,
                "is_retweet": True,
                "original_post_id": post_id
            })
            engagement["shared_by_user"] = shared is not None
        
        return {"success": True, "engagement": engagement}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching engagement: {str(e)}")

class BatchQuizRoomRequest(BaseModel):
    room_codes: List[str]

@router.post("/quiz-rooms/batch")
async def batch_get_quiz_rooms(request_data: BatchQuizRoomRequest):
    """
    Batch hydrate quiz room data for multiple posts.
    Fetches fresh room_code, status, participants for Quiz Room cards.
    """
    try:
        room_codes = request_data.room_codes
        
        if not room_codes or len(room_codes) == 0:
            return {"success": True, "rooms": {}}
        
        # Limit batch size
        if len(room_codes) > 50:
            room_codes = room_codes[:50]
        
        rooms_data = {}
        
        # Fetch from quiz_rooms collection
        rooms = await db.quiz_rooms.find(
            {"room_code": {"$in": [code.upper() for code in room_codes]}},
            {"_id": 0}
        ).to_list(None)
        
        for room in rooms:
            rooms_data[room["room_code"]] = {
                "room_code": room.get("room_code"),
                "title": room.get("title"),
                "category": room.get("category"),
                "status": room.get("status", "waiting"),
                "participants": room.get("participants", 0),
                "max_participants": room.get("max_participants", 10),
                "num_questions": len(room.get("questions", [])),
                "time_limit": room.get("questions", [{}])[0].get("time_limit", 15) if room.get("questions") else 15,
                "privacy": room.get("privacy", "public"),
                "difficulty": room.get("difficulty", "Medium"),
            }
        
        return {"success": True, "rooms": rooms_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error batch fetching quiz rooms: {str(e)}")

# ==================== FEED ENDPOINTS ====================

@router.get("/feed/for-you")
async def get_for_you_feed(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    authorization: Optional[str] = Header(None)
):
    """Get personalized feed with pagination"""
    try:
        # Validate parameters
        if skip < 0:
            raise HTTPException(status_code=400, detail="skip parameter must be non-negative")
        if limit < 0:
            raise HTTPException(status_code=400, detail="limit parameter must be non-negative")
        if limit > 100:
            limit = 100  # Cap at 100 for performance
        
        user_id = await get_optional_user_id_async(authorization, request)
        mixed_posts = []
        
        # Fetch ALL posts first, then paginate after combining and deduplicating
        if user_id:
            ceeps = await db.ceeps.find({"user_id": user_id}, {"_id": 0, "ceep_user_id": 1}).to_list(1000)
            following_ids = [c["ceep_user_id"] for c in ceeps]
            
            if following_ids:
                following_posts = await db.social_posts.find(
                    {"user_id": {"$in": following_ids}}, {"_id": 0}
                ).sort("created_at", -1).limit(100).to_list(100)
                mixed_posts.extend(following_posts)
        
        # Get trending posts (with limit for performance)
        trending = await db.social_posts.find({}, {"_id": 0}).sort("trending_score", -1).limit(100).to_list(100)
        
        # Get recent quiz rooms (last 24 hours) to ensure they appear
        recent_quiz_rooms = await db.social_posts.find(
            {"post_type": "quiz_room"}, {"_id": 0}
        ).sort("created_at", -1).limit(20).to_list(20)
        
        # Combine and deduplicate
        existing_ids = {p["id"] for p in mixed_posts}
        for post in trending + recent_quiz_rooms:
            if post["id"] not in existing_ids:
                mixed_posts.append(post)
                existing_ids.add(post["id"])
        
        # Filter expired quiz rooms
        mixed_posts = await filter_expired_quiz_posts(mixed_posts)
        
        # Sort by created_at with proper date parsing
        def parse_date(post):
            try:
                date_val = post.get('created_at', '')
                if isinstance(date_val, datetime):
                    return date_val if date_val.tzinfo else date_val.replace(tzinfo=timezone.utc)
                if date_val:
                    if '+' in date_val or date_val.endswith('Z'):
                        dt = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
                    else:
                        dt = datetime.fromisoformat(date_val).replace(tzinfo=timezone.utc)
                    return dt
                return datetime.min.replace(tzinfo=timezone.utc)
            except Exception:
                return datetime.min.replace(tzinfo=timezone.utc)
        
        mixed_posts.sort(key=parse_date, reverse=True)
        
        # NOW apply pagination after combining and deduplicating
        total_posts = len(mixed_posts)
        paginated = mixed_posts[skip:skip + limit]
        has_more = (skip + limit) < total_posts
        
        # Enrich posts with current user profile pictures and badges
        unique_user_ids = list(set(post.get("user_id") for post in paginated if post.get("user_id")))
        if unique_user_ids:
            users = await db.users.find(
                {"id": {"$in": unique_user_ids}},
                {"_id": 0, "id": 1, "profile_picture": 1, "is_disabled": 1, "isTeacher": 1, "isProfessor": 1, "isOfficial": 1, "isInstitute": 1}
            ).to_list(1000)
            user_map = {u["id"]: u for u in users}
            disabled_users = {u["id"] for u in users if u.get("is_disabled", False)}
            
            # Filter out posts from disabled users
            paginated = [p for p in paginated if p.get("user_id") not in disabled_users]
            
            for post in paginated:
                u = user_map.get(post.get("user_id"))
                if u:
                    if u.get("profile_picture"):
                        post["user_avatar"] = u["profile_picture"]
                    post["isTeacher"] = u.get("isTeacher", False)
                    post["isProfessor"] = u.get("isProfessor", False)
                    post["isOfficial"] = u.get("isOfficial", False)
                    post["isInstitute"] = u.get("isInstitute", False)
        
        # Batch query all likes at once instead of N+1 queries
        if user_id and paginated:
            post_ids = [p["id"] for p in paginated]
            likes = await db.post_likes.find(
                {"user_id": user_id, "post_id": {"$in": post_ids}},
                {"_id": 0, "post_id": 1}
            ).to_list(100)
            liked_post_ids = {like["post_id"] for like in likes}
            
            for post in paginated:
                post["liked_by_user"] = post["id"] in liked_post_ids
            
            # Also check which posts the user has shared/reposted
            reposts = await db.social_posts.find(
                {"user_id": user_id, "is_retweet": True, "original_post_id": {"$in": post_ids}},
                {"_id": 0, "original_post_id": 1}
            ).to_list(100)
            reposted_post_ids = {repost["original_post_id"] for repost in reposts}
            
            for post in paginated:
                post["shared_by_user"] = post["id"] in reposted_post_ids
        
        # Ensure is_retweet is explicitly false if not present
        for post in paginated:
            if "is_retweet" not in post:
                post["is_retweet"] = False
        
        # Enrich quiz_room posts with actual room data
        for post in paginated:
            if post.get("post_type") == "quiz_room":
                room_code = post.get("room_code")
                if not room_code and post.get("quiz_details"):
                    room_code = post.get("quiz_details", {}).get("room_code")
                
                if room_code:
                    # Try to find the room in quiz_rooms or battle_rooms
                    room = await db.quiz_rooms.find_one({"room_code": str(room_code).upper()}, {"_id": 0})
                    if not room:
                        room = await db.battle_rooms.find_one({"roomId": str(room_code)}, {"_id": 0})
                    
                    if room:
                        post["quiz_room"] = {
                            "room_code": room_code.upper() if room_code else None,
                            "title": room.get("title") or room.get("quizTitle") or "Quiz Room",
                            "category": room.get("category") or room.get("subject") or "General",
                            "subject": room.get("subject") or room.get("category"),
                            "difficulty": room.get("difficulty") or "Medium",
                            "num_questions": room.get("num_questions") or room.get("questionCount") or len(room.get("questions", [])),
                            "time_limit": room.get("time_limit") or room.get("timeLimit") or 15,
                            "max_participants": room.get("max_participants") or room.get("maxParticipants") or 10,
                            "participants": len(room.get("participants", [])) if isinstance(room.get("participants"), list) else (room.get("participants") or 0),
                            "privacy": room.get("privacy") or "public",
                            "status": room.get("status") or "waiting",
                            "created_by": room.get("created_by") or room.get("hostId"),
                            "host_name": room.get("host_name") or room.get("hostName")
                        }
        
        return {
            "success": True, 
            "posts": paginated, 
            "count": len(paginated),
            "has_more": has_more,
            "total": total_posts
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching feed: {str(e)}")

@router.get("/feed/trending")
async def get_trending_feed(skip: int = 0, limit: int = 10):
    """Get trending posts - sorted by recency and engagement"""
    try:
        # Get posts with limit for performance
        posts = await db.social_posts.find({}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(200)
        posts = await filter_expired_quiz_posts(posts)
        
        # Sort by created_at in Python to handle mixed date formats
        def parse_date(post):
            try:
                date_val = post.get('created_at', '')
                if isinstance(date_val, datetime):
                    return date_val if date_val.tzinfo else date_val.replace(tzinfo=timezone.utc)
                # Handle both ISO formats (with and without timezone)
                if date_val:
                    if '+' in date_val or date_val.endswith('Z'):
                        dt = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
                    else:
                        # Assume UTC for timezone-naive dates
                        dt = datetime.fromisoformat(date_val).replace(tzinfo=timezone.utc)
                    return dt
                return datetime.min.replace(tzinfo=timezone.utc)
            except Exception as e:
                return datetime.min.replace(tzinfo=timezone.utc)
        
        posts.sort(key=parse_date, reverse=True)
        total_posts = len(posts)
        paginated = posts[skip:skip + limit]
        has_more = (skip + limit) < total_posts
        
        # Enrich posts with current user profile pictures and badges
        unique_user_ids = list(set(post.get("user_id") for post in paginated if post.get("user_id")))
        if unique_user_ids:
            users = await db.users.find(
                {"id": {"$in": unique_user_ids}},
                {"_id": 0, "id": 1, "profile_picture": 1, "is_disabled": 1, "isTeacher": 1, "isProfessor": 1, "isOfficial": 1, "isInstitute": 1}
            ).to_list(1000)
            user_map = {u["id"]: u for u in users}
            disabled_users = {u["id"] for u in users if u.get("is_disabled", False)}
            
            # Filter out posts from disabled users
            paginated = [p for p in paginated if p.get("user_id") not in disabled_users]
            
            for post in paginated:
                u = user_map.get(post.get("user_id"))
                if u:
                    if u.get("profile_picture"):
                        post["user_avatar"] = u["profile_picture"]
                    post["isTeacher"] = u.get("isTeacher", False)
                    post["isProfessor"] = u.get("isProfessor", False)
                    post["isOfficial"] = u.get("isOfficial", False)
                    post["isInstitute"] = u.get("isInstitute", False)
        
        # Ensure is_retweet is explicitly false if not present
        for post in paginated:
            if "is_retweet" not in post:
                post["is_retweet"] = False
        
        return {
            "success": True, 
            "posts": paginated, 
            "count": len(paginated),
            "has_more": has_more,
            "total": total_posts
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trending: {str(e)}")

@router.get("/feed/following")
async def get_following_feed(
    request: Request,
    skip: int = 0,
    limit: int = 10,
    authorization: Optional[str] = Header(None)
):
    """Get feed from followed users (approved follows only) with pagination"""
    try:
        # Validate parameters
        if skip < 0:
            raise HTTPException(status_code=400, detail="skip parameter must be non-negative")
        if limit < 0:
            raise HTTPException(status_code=400, detail="limit parameter must be non-negative")
        if limit > 100:
            limit = 100  # Cap at 100 for performance
            
        if not authorization:
            return {"success": True, "posts": [], "count": 0, "has_more": False}
        
        user_id = await get_optional_user_id_async(authorization, request)
        if not user_id:
            return {"success": True, "posts": [], "count": 0, "has_more": False}
        
        # Get approved following relationships (only from follows collection - single source of truth)
        # Use aggregation pipeline for better performance with large datasets
        follows = await db.follows.find(
            {"follower_id": user_id, "status": "approved"}, 
            {"_id": 0, "following_id": 1}
        ).to_list(length=1000)
        
        following_ids = [f["following_id"] for f in follows if f.get("following_id")]
        
        if not following_ids:
            return {"success": True, "posts": [], "count": 0, "has_more": False}
        
        # Get posts from followed users
        posts = await db.social_posts.find(
            {"user_id": {"$in": following_ids}}, 
            {"_id": 0}
        ).sort("created_at", -1).to_list(length=None)
        
        # Filter expired quiz room posts
        posts = await filter_expired_quiz_posts(posts)
        
        total_posts = len(posts)
        # Apply pagination
        paginated = posts[skip:skip + limit]
        has_more = (skip + limit) < total_posts
        
        # Enrich posts with current user profile pictures and badges
        unique_user_ids = list(set(post.get("user_id") for post in paginated if post.get("user_id")))
        if unique_user_ids:
            users = await db.users.find(
                {"id": {"$in": unique_user_ids}},
                {"_id": 0, "id": 1, "profile_picture": 1, "is_disabled": 1, "isTeacher": 1, "isProfessor": 1, "isOfficial": 1, "isInstitute": 1}
            ).to_list(1000)
            user_map = {u["id"]: u for u in users}
            disabled_users = {u["id"] for u in users if u.get("is_disabled", False)}
            
            # Filter out posts from disabled users
            paginated = [p for p in paginated if p.get("user_id") not in disabled_users]
            
            for post in paginated:
                u = user_map.get(post.get("user_id"))
                if u:
                    if u.get("profile_picture"):
                        post["user_avatar"] = u["profile_picture"]
                    post["isTeacher"] = u.get("isTeacher", False)
                    post["isProfessor"] = u.get("isProfessor", False)
                    post["isOfficial"] = u.get("isOfficial", False)
                    post["isInstitute"] = u.get("isInstitute", False)
        
        # Add like status for current user
        for post in paginated:
            liked = await db.post_likes.find_one({
                "user_id": user_id, 
                "post_id": post["id"]
            })
            post["liked_by_user"] = liked is not None
            # Ensure is_retweet is explicitly false if not present
            if "is_retweet" not in post:
                post["is_retweet"] = False
        
        return {
            "success": True, 
            "posts": paginated, 
            "count": len(paginated),
            "has_more": has_more,
            "total": total_posts
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching feed: {str(e)}")

@router.get("/feed/leaderboard")
async def get_leaderboard_feed(skip: int = 0, limit: int = 10):
    """Get battle/achievement posts"""
    try:
        posts = await db.social_posts.find(
            {"post_type": {"$in": ["battle_victory", "achievement"]}}, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        return {"success": True, "posts": posts, "count": len(posts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leaderboard: {str(e)}")

# ==================== ENGAGEMENT ENDPOINTS ====================

@router.post("/posts/{post_id}/like")
async def like_post(post_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Like a post"""
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        existing = await db.post_likes.find_one({"user_id": user_id, "post_id": post_id})
        if existing:
            return {"success": True, "message": "Already liked"}
        
        await db.post_likes.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "post_id": post_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        result = await db.social_posts.update_one(
            {"id": post_id},
            {"$inc": {"likes_count": 1, "trending_score": 1}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Create notification
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0, "user_id": 1, "likes_count": 1})
        if post and post["user_id"] != user_id:
            user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
            notification_doc = {
                "id": str(uuid.uuid4()),
                "user_id": post["user_id"],
                "notification_type": "like",
                "content": f"{user.get('name', 'Someone')} liked your post",
                "from_user_id": user_id,
                "from_user_name": user.get('name', 'Unknown'),
                "post_id": post_id,
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notification_doc)
            # Send real-time notification
            asyncio.create_task(social_socketio.send_notification(post["user_id"], notification_doc))
        
        # Broadcast like in real-time
        likes_count = post.get("likes_count", 0) + 1 if post else 1
        asyncio.create_task(social_socketio.broadcast_post_liked(post_id, user_id, likes_count))
        
        return {"success": True, "message": "Post liked"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error liking post: {str(e)}")

@router.delete("/posts/{post_id}/like")
async def unlike_post(post_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Unlike a post"""
    try:
        user_id = await get_user_id_from_request(authorization, request)
        result = await db.post_likes.delete_one({"user_id": user_id, "post_id": post_id})
        
        if result.deleted_count == 0:
            return {"success": True, "message": "Not liked"}
        
        await db.social_posts.update_one({"id": post_id}, {"$inc": {"likes_count": -1, "trending_score": -1}})
        
        # Get updated likes count and broadcast
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0, "likes_count": 1})
        likes_count = post.get("likes_count", 0) if post else 0
        asyncio.create_task(social_socketio.broadcast_post_unliked(post_id, user_id, likes_count))
        
        return {"success": True, "message": "Post unliked"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unliking post: {str(e)}")


@router.post("/posts/{post_id}/view")
async def increment_post_view(post_id: str):
    """Increment view count for a post"""
    try:
        # Increment the views count
        result = await db.social_posts.update_one(
            {"id": post_id},
            {"$inc": {"views": 1}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Get updated view count
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0, "views": 1})
        views = post.get("views", 1) if post else 1
        
        return {"success": True, "views": views}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error incrementing view: {str(e)}")


@router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    """Get comments for a post with updated user isTeacher status"""
    try:
        comments = await db.comments.find(
            {"post_id": post_id, "parent_comment_id": None}, {"_id": 0}
        ).sort("created_at", -1).to_list(None)
        
        # Enrich comments with current badge data from users collection
        unique_user_ids = list(set(comment.get("user_id") for comment in comments if comment.get("user_id")))
        if unique_user_ids:
            users = await db.users.find(
                {"id": {"$in": unique_user_ids}},
                {"_id": 0, "id": 1, "isTeacher": 1, "isProfessor": 1, "isOfficial": 1, "isInstitute": 1, "username": 1}
            ).to_list(1000)
            user_data = {u["id"]: u for u in users}
            
            for comment in comments:
                if comment.get("user_id") in user_data:
                    comment["isTeacher"] = user_data[comment["user_id"]].get("isTeacher", False)
                    comment["isProfessor"] = user_data[comment["user_id"]].get("isProfessor", False)
                    comment["isOfficial"] = user_data[comment["user_id"]].get("isOfficial", False)
                    comment["isInstitute"] = user_data[comment["user_id"]].get("isInstitute", False)
                    if not comment.get("username") and user_data[comment["user_id"]].get("username"):
                        comment["username"] = user_data[comment["user_id"]]["username"]
        
        return {"success": True, "comments": comments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching comments: {str(e)}")

@router.post("/posts/{post_id}/comment")
async def add_comment(
    post_id: str,
    comment_data: CommentRequest,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Add a comment"""
    try:
        # Get user_id using new hybrid authentication
        user_id = await get_user_id_from_request(authorization, request)
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        comment_doc = {
            "id": str(uuid.uuid4()),
            "post_id": post_id,
            "user_id": user_id,
            "user_name": user.get("name", "User") if user else "User",
            "username": user.get("username") if user else user.get("name", "User"),
            "user_avatar": user.get("profile_picture") or user.get("avatar", "👤") if user else "👤",
            "isTeacher": user.get("isTeacher", False) if user else False,
            "isProfessor": user.get("isProfessor", False) if user else False,
            "isOfficial": user.get("isOfficial", False) if user else False,
            "isInstitute": user.get("isInstitute", False) if user else False,
            "content": comment_data.content,
            "parent_comment_id": comment_data.parent_comment_id,
            "likes_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.comments.insert_one(comment_doc.copy())
        result = await db.social_posts.update_one({"id": post_id}, {"$inc": {"comments_count": 1, "trending_score": 2}})
        
        # Get updated comments count
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0, "user_id": 1, "comments_count": 1})
        comments_count = post.get("comments_count", 1) if post else 1
        
        # Broadcast new comment in real-time
        asyncio.create_task(social_socketio.broadcast_new_comment(post_id, comment_doc, comments_count))
        
        # Create notification
        if post and post["user_id"] != user_id and user:
            notification_doc = {
                "id": str(uuid.uuid4()),
                "user_id": post["user_id"],
                "notification_type": "comment",
                "content": f"{user.get('name', 'Someone')} commented on your post",
                "from_user_id": user_id,
                "from_user_name": user.get('name', 'Unknown'),
                "post_id": post_id,
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notification_doc)
            # Send real-time notification
            asyncio.create_task(social_socketio.send_notification(post["user_id"], notification_doc))
        
        return {"success": True, "comment": comment_doc}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding comment: {str(e)}")


@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Delete a comment - only the comment author can delete"""
    try:
        user_id = await get_optional_user_id_async(authorization, request)
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Find the comment
        comment = await db.comments.find_one({"id": comment_id})
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        # Check if user owns the comment
        if comment.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="You can only delete your own comments")
        
        # Delete the comment
        await db.comments.delete_one({"id": comment_id})
        
        # Decrement comment count on the post
        await db.social_posts.update_one(
            {"id": comment.get("post_id")},
            {"$inc": {"comments_count": -1}}
        )
        
        return {"success": True, "message": "Comment deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting comment: {str(e)}")


@router.post("/posts/{post_id}/share")
async def share_post(post_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Share a post - creates a retweet post on user's profile"""
    try:
        # Get current user using hybrid authentication
        user_id = await get_user_id_from_request(authorization, request)
        
        # Get the original post
        original_post = await db.social_posts.find_one({"id": post_id}, {"_id": 0})
        if not original_post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check if user already retweeted this post
        existing_retweet = await db.social_posts.find_one({
            "user_id": user_id,
            "is_retweet": True,
            "original_post_id": post_id
        })
        if existing_retweet:
            return {"success": False, "message": "You already shared this post"}
        
        # Get user info
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create retweet post
        retweet_post = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "user_name": user.get("name", ""),
            "username": user.get("username", ""),
            "user_avatar": user.get("profile_picture"),
            "is_verified": user.get("is_verified", False),
            "content": original_post.get("content", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "trending_score": 0,
            "liked_by": [],
            "bookmarked_by": [],
            "is_retweet": True,
            "original_post_id": post_id,
            "original_user_id": original_post.get("user_id"),
            "original_user_name": original_post.get("user_name"),
            "original_username": original_post.get("username"),
            "original_user_avatar": original_post.get("user_avatar"),
            "original_created_at": original_post.get("created_at"),
            # Copy media and metadata from original post
            "media_urls": original_post.get("media_urls", []),
            "media_url": original_post.get("media_url"),
            "media_type": original_post.get("media_type"),
            "hashtags": original_post.get("hashtags", []),
            "tags": original_post.get("tags", []),
            "post_type": original_post.get("post_type", "general"),
            "quiz_details": original_post.get("quiz_details"),
            "quiz_room": original_post.get("quiz_room"),
            "exam_category": original_post.get("exam_category"),
            "subject": original_post.get("subject"),
            "topic": original_post.get("topic"),
            "battle_stats": original_post.get("battle_stats"),
        }
        
        # Copy badges from user
        if user.get("isTeacher"):
            retweet_post["isTeacher"] = True
        if user.get("isProfessor"):
            retweet_post["isProfessor"] = True
        
        # Insert retweet post
        await db.social_posts.insert_one(retweet_post)
        
        # Increment share count on original post
        await db.social_posts.update_one(
            {"id": post_id}, 
            {"$inc": {"shares_count": 1, "trending_score": 3}}
        )
        
        # Get updated shares count and broadcast
        updated_post = await db.social_posts.find_one({"id": post_id}, {"_id": 0, "shares_count": 1})
        shares_count = updated_post.get("shares_count", 1) if updated_post else 1
        asyncio.create_task(social_socketio.broadcast_post_shared(post_id, shares_count))
        
        return {"success": True, "message": "Post shared", "retweet_id": retweet_post["id"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sharing post: {str(e)}")


@router.delete("/posts/{post_id}/unshare")
async def unshare_post(post_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Remove a repost/share of a post"""
    try:
        user_id = await get_optional_user_id_async(authorization, request)
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Find the user's repost of this post
        shared_post = await db.social_posts.find_one({
            "user_id": user_id,
            "original_post_id": post_id,
            "is_retweet": True
        })
        
        if not shared_post:
            raise HTTPException(status_code=404, detail="Repost not found")
        
        # Delete the repost
        await db.social_posts.delete_one({"id": shared_post["id"]})
        
        # Decrement share count on original post
        await db.social_posts.update_one(
            {"id": post_id},
            {"$inc": {"shares_count": -1}}
        )
        
        # Get updated shares count and broadcast
        updated_post = await db.social_posts.find_one({"id": post_id}, {"_id": 0, "shares_count": 1})
        shares_count = max(updated_post.get("shares_count", 0), 0) if updated_post else 0
        
        return {"success": True, "message": "Repost removed", "shares_count": shares_count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing repost: {str(e)}")


# ==================== BOOKMARK ENDPOINTS ====================

@router.post("/posts/{post_id}/bookmark")
async def bookmark_post(post_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Bookmark a post"""
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        # Check if post exists
        post = await db.social_posts.find_one({"id": post_id})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check if already bookmarked
        existing_bookmark = await db.bookmarks.find_one({
            "post_id": post_id,
            "user_id": user_id
        })
        
        if existing_bookmark:
            return {"success": True, "message": "Already bookmarked"}
        
        # Create bookmark
        await db.bookmarks.insert_one({
            "id": str(uuid.uuid4()),
            "post_id": post_id,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Update post's bookmarked_by array
        await db.social_posts.update_one(
            {"id": post_id},
            {"$addToSet": {"bookmarked_by": user_id}}
        )
        
        return {"success": True, "message": "Post bookmarked"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error bookmarking post: {str(e)}")


@router.delete("/posts/{post_id}/bookmark")
async def unbookmark_post(post_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Remove bookmark from a post"""
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        # Delete bookmark
        result = await db.bookmarks.delete_one({
            "post_id": post_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            return {"success": True, "message": "Bookmark not found"}
        
        # Update post's bookmarked_by array
        await db.social_posts.update_one(
            {"id": post_id},
            {"$pull": {"bookmarked_by": user_id}}
        )
        
        return {"success": True, "message": "Bookmark removed"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing bookmark: {str(e)}")


@router.get("/bookmarks")
async def get_user_bookmarks(request: Request, authorization: Optional[str] = Header(None)):
    """Get user's bookmarked posts"""
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        # Get all bookmarks for user
        bookmarks = await db.bookmarks.find(
            {"user_id": user_id}
        ).sort("created_at", -1).to_list(length=100)
        
        post_ids = [b["post_id"] for b in bookmarks]
        
        # Get the actual posts
        posts = await db.social_posts.find(
            {"id": {"$in": post_ids}},
            {"_id": 0}
        ).to_list(length=100)
        
        # Mark all as bookmarked
        for post in posts:
            post["user_bookmarked"] = True
        
        return {"success": True, "posts": posts}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching bookmarks: {str(e)}")


# ==================== USER PROFILE ENDPOINTS ====================

@router.get("/user/{user_id}")
async def get_user_profile(user_id: str):
    """Get user profile with accurate follow counts"""
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get posts count (excluding reposts to match frontend Posts tab filter)
        user["posts_count"] = await db.social_posts.count_documents({
            "user_id": user_id,
            "is_retweet": {"$ne": True}
        })
        
        # Count followers (only approved follows from follows collection - single source of truth)
        user["followers_count"] = await db.follows.count_documents({
            "following_id": user_id, 
            "status": "approved"
        })
        
        # Count following (only approved follows)
        user["following_count"] = await db.follows.count_documents({
            "follower_id": user_id, 
            "status": "approved"
        })
        
        # Add badge information in structured format
        user["badges"] = {
            "isTeacher": user.get("isTeacher", False),
            "isProfessor": user.get("isProfessor", False),
            "isOfficial": user.get("isOfficial", False),
            "isInstitute": user.get("isInstitute", False)
        }
        
        return {"success": True, "user": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")

@router.get("/user/{user_id}/posts")
async def get_user_posts(user_id: str, skip: int = 0, limit: int = 50):
    """Get all posts from a specific user"""
    try:
        posts_cursor = db.social_posts.find(
            {"user_id": user_id}, 
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        posts = await posts_cursor.to_list(length=limit)
        
        return {"success": True, "posts": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user posts: {str(e)}")

@router.get("/user/{user_id}/followers")
async def get_user_followers(user_id: str):
    """Get list of users who follow this user"""
    try:
        # Get follower IDs from follows collection
        follows_cursor = db.follows.find(
            {"following_id": user_id, "status": "approved"},
            {"_id": 0, "follower_id": 1}
        )
        follows = await follows_cursor.to_list(length=1000)
        follower_ids = [f["follower_id"] for f in follows]
        
        # Get user details for all followers
        if not follower_ids:
            return {"success": True, "followers": []}
        
        users_cursor = db.users.find(
            {"id": {"$in": follower_ids}},
            {"_id": 0, "id": 1, "name": 1, "username": 1, "bio": 1, "is_verified": 1, "profile_picture": 1}
        )
        followers = await users_cursor.to_list(length=1000)
        
        # Add follower counts to each user
        for follower in followers:
            follower["followers_count"] = await db.follows.count_documents({
                "following_id": follower["id"],
                "status": "approved"
            })
        
        return {"success": True, "followers": followers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching followers: {str(e)}")

@router.get("/user/{user_id}/following")
async def get_user_following(user_id: str):
    """Get list of users this user follows"""
    try:
        # Get following IDs from follows collection
        follows_cursor = db.follows.find(
            {"follower_id": user_id, "status": "approved"},
            {"_id": 0, "following_id": 1}
        )
        follows = await follows_cursor.to_list(length=1000)
        following_ids = [f["following_id"] for f in follows]
        
        # Get user details for all following
        if not following_ids:
            return {"success": True, "following": []}
        
        users_cursor = db.users.find(
            {"id": {"$in": following_ids}},
            {"_id": 0, "id": 1, "name": 1, "username": 1, "bio": 1, "is_verified": 1, "profile_picture": 1}
        )
        following = await users_cursor.to_list(length=1000)
        
        # Add follower counts to each user
        for user in following:
            user["followers_count"] = await db.follows.count_documents({
                "following_id": user["id"],
                "status": "approved"
            })
        
        return {"success": True, "following": following}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching following: {str(e)}")

@router.post("/user/follow/{target_user_id}")
async def follow_user(target_user_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """
    Follow a user with proper privacy checks
    - Public accounts: Instant follow (status: approved)
    - Private accounts: Send follow request (status: pending)
    """
    try:
        follower_id = await get_user_id_from_request(authorization, request)
        
        # Validate users exist
        if follower_id == target_user_id:
            raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
        # Check if already following (only check follows collection - single source of truth)
        existing_follow = await db.follows.find_one({
            "follower_id": follower_id, 
            "following_id": target_user_id
        })
        
        if existing_follow:
            return {
                "success": True, 
                "message": "Already following or request pending",
                "status": existing_follow.get("status")
            }
        
        # Get target user to check privacy settings
        target_user = await db.users.find_one({"id": target_user_id}, {"_id": 0})
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get follower info for notification
        follower = await db.users.find_one({"id": follower_id}, {"_id": 0, "name": 1})
        if not follower:
            raise HTTPException(status_code=404, detail="Follower user not found")
        
        # Determine follow status based on privacy settings
        # Auto-approve all follows (privacy is optional but follows are instant)
        is_private = target_user.get("is_private", False)
        follow_status = "approved"  # Always approved for instant follow
        
        # Create follow relationship (ONLY in follows collection)
        await db.follows.insert_one({
            "id": str(uuid.uuid4()),
            "follower_id": follower_id,
            "following_id": target_user_id,
            "status": follow_status,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Create notification (always show as "started following" since auto-approved)
        notification_content = f"{follower.get('name', 'Someone')} started following you"
        
        notification_doc = {
            "id": str(uuid.uuid4()),
            "user_id": target_user_id,
            "notification_type": "follow",  # Always "follow" since auto-approved
            "content": notification_content,
            "from_user_id": follower_id,
            "from_user_name": follower.get('name', 'Unknown'),
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification_doc)
        
        # Send real-time notification and broadcast follow event (always broadcast since auto-approved)
        asyncio.create_task(social_socketio.send_notification(target_user_id, notification_doc))
        asyncio.create_task(social_socketio.broadcast_user_followed(follower_id, target_user_id, follower.get('name', 'Unknown')))
        
        return {
            "success": True, 
            "message": "Now following",  # Always instant follow
            "status": follow_status
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error following user: {str(e)}")

@router.delete("/user/follow/{target_user_id}")
async def unfollow_user(target_user_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Unfollow a user or cancel follow request"""
    try:
        follower_id = await get_user_id_from_request(authorization, request)
        
        # Delete from follows collection (single source of truth)
        result = await db.follows.delete_one({
            "follower_id": follower_id, 
            "following_id": target_user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Not following this user")
        
        return {"success": True, "message": "Unfollowed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unfollowing: {str(e)}")

# ==================== QUIZ ROOM ENDPOINTS ====================

def generate_room_code():
    import secrets, string
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))

async def ensure_unique_room_code():
    while True:
        code = generate_room_code()
        if not await db.quiz_rooms.find_one({"room_code": code}):
            return code

@router.post("/quiz-rooms")
async def create_quiz_room(room_data: QuizRoomCreate, authorization: Optional[str] = Header(None)):
    """Create a quiz room"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        user_name = user.get("name", "User") if user else "User"
        
        room_code = await ensure_unique_room_code()
        
        room = {
            "id": str(uuid.uuid4()),
            "room_code": room_code,
            "host_id": user_id,
            "host_name": user_name,
            "title": room_data.title,
            "description": room_data.description,
            "category": room_data.category,
            "privacy": room_data.privacy,
            "questions": [q.model_dump() for q in room_data.questions],
            "question_count": len(room_data.questions),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "plays_count": 0,
            "likes_count": 0,
            "is_active": True
        }
        
        await db.quiz_rooms.insert_one(room.copy())
        
        # Create social post
        post = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "user_name": user_name,
            "username": user.get("username") if user else None,
            "user_avatar": user.get("profile_picture") or user.get("avatar", "👤") if user else "👤",
            "post_type": "quiz_room",
            "content": f"📚 New Quiz: {room_data.title}\n\n{room_data.description}\n\n📝 {len(room_data.questions)} Questions\n🔑 Code: {room_code}",
            "room_code": room_code,
            "quiz_room": {
                "room_code": room_code,
                "title": room_data.title,
                "description": room_data.description,
                "category": room_data.category,
                "privacy": room_data.privacy,
                "num_questions": len(room_data.questions),
                "time_limit": room_data.questions[0].time_limit if room_data.questions else 15,
                "status": "waiting"
            },
            "quiz_details": {"room_code": room_code, "title": room_data.title, "question_count": len(room_data.questions)},
            "tags": [f"#{room_data.category.replace(' ', '')}", "#QuizRoom"],
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "trending_score": 100,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.social_posts.insert_one(post)
        
        return {"success": True, "room_code": room_code, "room_id": room["id"], "post_id": post["id"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating quiz room: {str(e)}")

@router.get("/quiz-rooms")
async def get_quiz_rooms(
    privacy: Optional[str] = None,
    category: Optional[str] = None,
    host_id: Optional[str] = None,
    limit: int = 50
):
    """Get quiz rooms"""
    try:
        query = {"is_active": True}
        if privacy:
            query["privacy"] = privacy
        if category:
            query["category"] = category
        if host_id:
            query["host_id"] = host_id
        
        rooms = await db.quiz_rooms.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
        return {"success": True, "rooms": rooms, "count": len(rooms)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching rooms: {str(e)}")

@router.get("/quiz-rooms/{room_code}")
async def get_quiz_room(room_code: str, authorization: Optional[str] = Header(None)):
    """Get quiz room details with validation - checks both quiz_rooms and battle_rooms"""
    try:
        # Validate room code format (alphanumeric, 6 characters)
        if not room_code or len(room_code) != 6 or not room_code.isalnum():
            raise HTTPException(status_code=400, detail="Invalid room code format")
        
        room = None
        source = None
        
        # First check quiz_rooms collection
        room = await db.quiz_rooms.find_one({"room_code": room_code.upper()})
        if room:
            source = "quiz_rooms"
        else:
            # Also check battle_rooms collection (for Victory Lane created rooms)
            battle_room = await db.battle_rooms.find_one({"roomId": room_code})
            if battle_room:
                source = "battle_rooms"
                
                # Transform battle_room questions to quiz_room format
                transformed_questions = []
                for q in battle_room.get("questions", []):
                    # Handle both formats - battle room uses options array, quiz room uses option_a, option_b, etc.
                    options = q.get("options", [])
                    transformed_q = {
                        "id": q.get("id"),
                        "question_text": q.get("question") or q.get("question_text", ""),
                        "correct_answer": q.get("correctAnswer") or q.get("correct_answer", "a"),
                        "time_limit": q.get("time_limit", 30)
                    }
                    
                    # Map options array to option_a, option_b, etc.
                    option_letters = ['a', 'b', 'c', 'd']
                    for i, opt in enumerate(options[:4]):
                        if isinstance(opt, dict):
                            transformed_q[f"option_{option_letters[i]}"] = opt.get("text", "")
                        else:
                            transformed_q[f"option_{option_letters[i]}"] = str(opt)
                    
                    # Ensure all option fields exist
                    for letter in option_letters:
                        if f"option_{letter}" not in transformed_q:
                            transformed_q[f"option_{letter}"] = ""
                    
                    transformed_questions.append(transformed_q)
                
                # Transform battle_room format to quiz_room format
                room = {
                    "room_code": battle_room.get("roomId"),
                    "title": battle_room.get("config", {}).get("subject", "Quiz"),
                    "category": battle_room.get("config", {}).get("category", "General"),
                    "questions": transformed_questions,
                    "host_id": battle_room.get("host", {}).get("userId"),
                    "host_name": battle_room.get("host", {}).get("username"),
                    "created_at": battle_room.get("createdAt"),
                    "privacy": battle_room.get("config", {}).get("privacy", "public"),
                    "time_limit": battle_room.get("config", {}).get("time_per_question", 30),
                    "max_participants": battle_room.get("config", {}).get("max_participants", 50),
                    "status": battle_room.get("status", "waiting")
                }
        
        if not room:
            raise HTTPException(status_code=404, detail="Quiz room not found")
        
        # Check TTL (24 hours expiry)
        created_at = room.get("created_at")
        if created_at:
            if isinstance(created_at, (int, float)):
                # Unix timestamp from battle_rooms
                created_dt = datetime.fromtimestamp(created_at, tz=timezone.utc)
            elif isinstance(created_at, str):
                created_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            elif isinstance(created_at, datetime):
                created_dt = created_at if created_at.tzinfo else created_at.replace(tzinfo=timezone.utc)
            else:
                created_dt = None
            
            if created_dt and (datetime.now(timezone.utc) - created_dt) > timedelta(hours=24):
                raise HTTPException(status_code=410, detail="Quiz expired")
        
        # Privacy check
        user_id = await get_optional_user_id_async(authorization)
        if user_id and room.get("privacy") == "private" and user_id != room.get("host_id"):
            raise HTTPException(status_code=403, detail="Private quiz")
        
        room.pop("_id", None)
        return {"success": True, "room": room, "source": source}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching room: {str(e)}")

@router.post("/quiz-rooms/{room_code}/submit")
async def submit_quiz_results(
    room_code: str,
    result_data: QuizResultSubmit,
    authorization: Optional[str] = Header(None)
):
    """Submit quiz results - handles both quiz_rooms and battle_rooms"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        # Check both quiz_rooms and battle_rooms collections
        room = await db.quiz_rooms.find_one({"room_code": room_code.upper()})
        room_collection = "quiz_rooms"
        
        if not room:
            room = await db.battle_rooms.find_one({"roomId": room_code})
            room_collection = "battle_rooms"
        
        if not room:
            raise HTTPException(status_code=404, detail="Quiz room not found")
        
        result = {
            "id": str(uuid.uuid4()),
            "room_code": room_code.upper() if room_collection == "quiz_rooms" else room_code,
            "room_id": room.get("id") or room.get("roomId"),
            "user_id": user_id,
            "user_name": user.get("name", "User") if user else "User",
            "score": result_data.score,
            "total_questions": result_data.total_questions,
            "correct_answers": sum(1 for a in result_data.answers if a.get("is_correct")),
            "answers": result_data.answers,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "time_taken_seconds": sum(a.get("time_taken", 0) for a in result_data.answers)
        }
        
        await db.quiz_results.insert_one(result.copy())
        
        # Also save to quiz_history for dashboard test-history tracking
        try:
            correct_count = sum(1 for a in result_data.answers if a.get("is_correct"))
            total_q = result_data.total_questions
            wrong_count = total_q - correct_count
            score_pct = round((correct_count / total_q) * 100) if total_q > 0 else 0
            
            history_entry = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "user_name": user.get("name", "User") if user else "User",
                "exam": room.get("category", room.get("exam_category", "Quiz Room")),
                "subject": room.get("subject", "Mixed"),
                "topic": room.get("title", "Quiz Room"),
                "total_questions": total_q,
                "correct_answers": correct_count,
                "wrong_answers": wrong_count,
                "score": correct_count,
                "accuracy": score_pct,
                "xp_earned": correct_count * 7,
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "duration_seconds": sum(a.get("time_taken", 0) for a in result_data.answers),
                "source": "quiz_room"
            }
            await db.quiz_history.insert_one(history_entry)
        except Exception as e:
            print(f"[QUIZ_ROOM] Failed to save to quiz_history: {str(e)}")
        
        # Update play count in the appropriate collection
        if room_collection == "quiz_rooms":
            await db.quiz_rooms.update_one({"room_code": room_code.upper()}, {"$inc": {"plays_count": 1}})
        else:
            await db.battle_rooms.update_one({"roomId": room_code}, {"$inc": {"plays_count": 1}})
        
        return {"success": True, "message": "Results submitted", "result": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting results: {str(e)}")

@router.get("/quiz-rooms/{room_code}/leaderboard")
async def get_quiz_leaderboard(room_code: str):
    """Get quiz leaderboard"""
    try:
        results = await db.quiz_results.find(
            {"room_code": room_code.upper()}, {"_id": 0}
        ).sort([("score", -1), ("time_taken_seconds", 1)]).to_list(100)
        
        leaderboard = [{
            "user_id": r.get("user_id"),
            "user_name": r.get("user_name"),
            "score": r.get("score", 0),
            "correct_answers": r.get("correct_answers", 0),
            "total_questions": r.get("total_questions", 0),
            "time_taken_seconds": r.get("time_taken_seconds", 0)
        } for r in results]
        
        return {"success": True, "leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leaderboard: {str(e)}")

@router.delete("/quiz-rooms/{room_code}")
async def delete_quiz_room(room_code: str, authorization: Optional[str] = Header(None)):
    """Delete quiz room (host only)"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        room = await db.quiz_rooms.find_one({"room_code": room_code.upper()})
        
        if not room:
            raise HTTPException(status_code=404, detail="Quiz room not found")
        if room["host_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only host can delete")
        
        await db.quiz_rooms.update_one(
            {"room_code": room_code.upper()},
            {"$set": {"is_active": False, "deleted_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"success": True, "message": "Quiz room deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting room: {str(e)}")

# ==================== BATTLE POST ====================

@router.post("/battle-post")
async def create_battle_post(battle_data: BattlePostCreate, authorization: Optional[str] = Header(None)):
    """Create post from battle results"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        user_name = user.get("name", "User") if user else "User"
        
        rank_emoji = "🥇" if battle_data.rank == 1 else "🥈" if battle_data.rank == 2 else "🥉" if battle_data.rank == 3 else "🎯"
        
        content = f"{rank_emoji} Battle Complete!\n📊 Score: {battle_data.score}\n🏆 Rank: #{battle_data.rank}/{battle_data.total_participants}"
        if battle_data.opponents:
            content += f"\n👥 vs: {', '.join(battle_data.opponents[:3])}"
        
        post = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "user_name": user_name,
            "user_avatar": user.get("profile_picture") or user.get("avatar", "👤") if user else "👤",
            "post_type": "battle_victory",
            "content": content,
            "battle_stats": {
                "score": battle_data.score,
                "rank": battle_data.rank,
                "total_participants": battle_data.total_participants,
                "opponents": battle_data.opponents
            },
            "tags": [f"#{battle_data.exam}", f"#{battle_data.topic.replace(' ', '')}"],
            "exam_category": battle_data.exam,
            "subject": battle_data.topic,
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "trending_score": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.social_posts.insert_one(post)
        await db.users.update_one({"id": user_id}, {"$inc": {"posts_count": 1, "total_battles": 1}})
        
        return {"success": True, "message": "Battle posted!", "post_id": post["id"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating battle post: {str(e)}")

# ==================== STUDY GROUPS ====================

@router.post("/groups")
async def create_study_group(group_data: StudyGroupCreate, authorization: Optional[str] = Header(None)):
    """Create study group"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        
        group = {
            "id": str(uuid.uuid4()),
            "name": group_data.name,
            "description": group_data.description,
            "exam_focus": group_data.exam_focus,
            "created_by": user_id,
            "members": [user_id],
            "member_count": 1,
            "is_private": group_data.is_private,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.study_groups.insert_one(group)
        return {"success": True, "group": group}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating group: {str(e)}")

@router.get("/groups")
async def get_user_groups(authorization: Optional[str] = Header(None)):
    """Get user's study groups"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        groups = await db.study_groups.find({"members": user_id}, {"_id": 0}).to_list(100)
        return {"success": True, "groups": groups}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching groups: {str(e)}")

@router.post("/groups/{group_id}/join")
async def join_study_group(group_id: str, authorization: Optional[str] = Header(None)):
    """Join a study group"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        group = await db.study_groups.find_one({"id": group_id}, {"_id": 0})
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if user_id in group.get("members", []):
            return {"success": True, "message": "Already a member"}
        
        await db.study_groups.update_one(
            {"id": group_id},
            {"$addToSet": {"members": user_id}, "$inc": {"member_count": 1}}
        )
        
        return {"success": True, "message": "Joined group"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error joining group: {str(e)}")

# ==================== NOTIFICATIONS ====================

@router.get("/notifications")
async def get_notifications(
    skip: int = 0,
    limit: int = 20,
    authorization: Optional[str] = Header(None)
):
    """Get user notifications"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        
        notifications = await db.notifications.find(
            {"user_id": user_id}, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        unread_count = await db.notifications.count_documents({"user_id": user_id, "is_read": False})
        
        return {"success": True, "notifications": notifications, "unread_count": unread_count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, authorization: Optional[str] = Header(None)):
    """Mark notification as read"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        result = await db.notifications.update_one(
            {"id": notification_id, "user_id": user_id},
            {"$set": {"is_read": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"success": True, "message": "Marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.put("/notifications/read-all")
async def mark_all_read(authorization: Optional[str] = Header(None)):
    """Mark all notifications as read"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        await db.notifications.update_many({"user_id": user_id, "is_read": False}, {"$set": {"is_read": True}})
        
        return {"success": True, "message": "All marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ==================== MCQ POST ENDPOINTS ====================

@router.get("/mcq/browse")
async def browse_mcqs(
    exam: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    authorization: Optional[str] = Header(None)
):
    """Browse MCQs from database for posting"""
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        # Build query
        query = {}
        if exam:
            query["exam_name"] = {"$regex": exam, "$options": "i"}
        if subject:
            query["syllabus_topic"] = {"$regex": subject, "$options": "i"}
        if topic:
            query["subject"] = {"$regex": topic, "$options": "i"}
        
        # Fetch questions
        questions = await db.questions.find(query, {"_id": 0}).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "questions": questions,
            "count": len(questions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching MCQs: {str(e)}")


@router.get("/mcq/exams")
async def get_exam_list():
    """Get list of available exams for MCQ filtering - synced with main app structure"""
    try:
        from exam_data import EXAM_DATA
        
        exams = []
        for exam_id, data in EXAM_DATA.items():
            exams.append({
                "id": exam_id,
                "name": data.get("name", exam_id),
                "category": data.get("category", "Other")
            })
        
        return {
            "success": True,
            "exams": exams
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching exams: {str(e)}")


@router.get("/mcq/subjects")
async def get_subject_list(exam: str = Query(...)):
    """Get subjects (syllabus topics) for a specific exam"""
    try:
        from exam_data import EXAM_DATA
        
        if exam not in EXAM_DATA:
            raise HTTPException(status_code=404, detail=f"Exam {exam} not found")
        
        exam_data = EXAM_DATA[exam]
        subjects = list(exam_data.get("syllabus_topics", {}).keys())
        
        return {
            "success": True,
            "subjects": subjects
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching subjects: {str(e)}")


@router.get("/mcq/topics")
async def get_topic_list(exam: str = Query(...), subject: str = Query(...)):
    """Get topics (chapters/subjects) for a specific exam and syllabus topic"""
    try:
        from exam_data import EXAM_DATA
        
        if exam not in EXAM_DATA:
            raise HTTPException(status_code=404, detail=f"Exam {exam} not found")
        
        exam_data = EXAM_DATA[exam]
        syllabus_topics = exam_data.get("syllabus_topics", {})
        
        if subject not in syllabus_topics:
            raise HTTPException(status_code=404, detail=f"Subject {subject} not found for {exam}")
        
        subject_data = syllabus_topics[subject]
        topics = list(subject_data.get("subjects", {}).keys())
        
        return {
            "success": True,
            "topics": topics
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topics: {str(e)}")


@router.post("/mcq/post")
async def create_mcq_post(
    question_id: str,
    caption: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """Create a social post with an MCQ"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        if db is None:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        user_id = decode_jwt_token(authorization)
        
        # Get user details
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        # Get question from database
        question = await db.questions.find_one({"id": question_id}, {"_id": 0})
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Create MCQ post
        post_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "user_name": user.get("name", "User") if user else "User",
            "username": user.get("username") if user else None,
            "user_avatar": user.get("profile_picture") or user.get("avatar", "👤") if user else "👤",
            "user_verified": user.get("verified", False) if user else False,
            "user_location": user.get("location") if user else None,
            "post_type": "mcq",
            "content": caption or f"Test your knowledge! 🧠",
            "mcq_data": {
                "question_id": question_id,
                "question": question.get("question"),
                "options": question.get("options", []),
                "correct_answer": question.get("correctAnswer"),
                "explanation": question.get("explanation", ""),
                "subject": question.get("subject"),
                "topic": question.get("syllabus_topic"),
                "exam": question.get("exam_name")
            },
            "battle_stats": None,
            "quiz_details": None,
            "room_code": None,
            "media_urls": [],
            "tags": [
                question.get("exam_name"),
                question.get("syllabus_topic"),
                question.get("subject")
            ],
            "exam_category": question.get("exam_name"),
            "subject": question.get("subject"),
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "attempt_count": 0,
            "correct_attempt_count": 0,
            "trending_score": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.social_posts.insert_one(post_doc.copy())
        
        if user:
            await db.users.update_one({"id": user_id}, {"$inc": {"posts_count": 1}})
        
        # Broadcast new post in real-time
        asyncio.create_task(social_socketio.broadcast_new_post(post_doc))
        
        return {"success": True, "post": post_doc}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating MCQ post: {str(e)}")


@router.post("/mcq/attempt")
async def attempt_mcq(
    post_id: str,
    selected_answer: str,
    authorization: Optional[str] = Header(None)
):
    """Attempt an MCQ in a post"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        if db is None:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        user_id = decode_jwt_token(authorization)
        
        # Get post
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0})
        if not post or post.get("post_type") != "mcq":
            raise HTTPException(status_code=404, detail="MCQ post not found")
        
        # Check if user already attempted
        existing_attempt = await db.mcq_attempts.find_one({
            "post_id": post_id,
            "user_id": user_id
        })
        
        if existing_attempt:
            return {
                "success": False,
                "message": "Already attempted",
                "is_correct": existing_attempt.get("is_correct"),
                "correct_answer": post.get("mcq_data", {}).get("correct_answer"),
                "explanation": post.get("mcq_data", {}).get("explanation")
            }
        
        # Check answer
        mcq_data = post.get("mcq_data", {})
        correct_answer = mcq_data.get("correct_answer")
        is_correct = selected_answer.upper() == correct_answer.upper()
        
        # Save attempt
        attempt_doc = {
            "id": str(uuid.uuid4()),
            "post_id": post_id,
            "user_id": user_id,
            "selected_answer": selected_answer.upper(),
            "is_correct": is_correct,
            "attempted_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.mcq_attempts.insert_one(attempt_doc.copy())
        
        # Update post stats
        update_data = {"$inc": {"attempt_count": 1}}
        if is_correct:
            update_data["$inc"]["correct_attempt_count"] = 1
            update_data["$inc"]["trending_score"] = 5
        
        await db.social_posts.update_one({"id": post_id}, update_data)
        
        return {
            "success": True,
            "is_correct": is_correct,
            "correct_answer": correct_answer,
            "explanation": mcq_data.get("explanation", ""),
            "message": "✅ Correct!" if is_correct else "❌ Incorrect"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error attempting MCQ: {str(e)}")


@router.get("/mcq/stats/{post_id}")
async def get_mcq_stats(post_id: str):
    """Get MCQ attempt statistics"""
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0})
        if not post or post.get("post_type") != "mcq":
            raise HTTPException(status_code=404, detail="MCQ post not found")
        
        attempt_count = post.get("attempt_count", 0)
        correct_count = post.get("correct_attempt_count", 0)
        success_rate = round((correct_count / attempt_count * 100) if attempt_count > 0 else 0)
        
        return {
            "success": True,
            "stats": {
                "attempt_count": attempt_count,
                "correct_count": correct_count,
                "success_rate": success_rate
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")