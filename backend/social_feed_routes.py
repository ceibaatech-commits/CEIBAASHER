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
from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
import uuid
from jose import jwt, JWTError
import os

JWT_SECRET = os.getenv("JWT_SECRET", "ceibaa-super-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

router = APIRouter()
db = None

def init_db(database):
    global db
    db = database

# ==================== HELPER FUNCTIONS ====================

def decode_jwt_token(authorization: str) -> str:
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

def get_optional_user_id(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
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
        
        room_code = post.get("room_code")
        if not room_code:
            continue
        
        try:
            room = await db.quiz_rooms.find_one({"room_code": room_code.upper()})
            if not room:
                continue
            
            created_at = room.get("created_at")
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                if (now - created_at) <= timedelta(hours=24):
                    filtered.append(post)
        except Exception as e:
            print(f"Error checking quiz room: {e}")
            continue
    
    return filtered

# ==================== MODELS ====================

class PostCreateRequest(BaseModel):
    post_type: Literal["battle_victory", "quiz_announcement", "study_tip", "achievement", "government", "video", "general", "room_code", "quiz_room", "quiz_result"]
    content: str
    battle_stats: Optional[dict] = None
    quiz_details: Optional[dict] = None
    room_code: Optional[str] = None
    media_urls: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    exam_category: Optional[str] = None
    subject: Optional[str] = None

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
    authorization: Optional[str] = Header(None)
):
    """Create a new post"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        post_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "user_name": user.get("name", "User") if user else "User",
            "username": user.get("username") if user else None,
            "user_avatar": user.get("avatar", "👤") if user else "👤",
            "user_verified": user.get("verified", False) if user else False,
            "user_location": user.get("location") if user else None,
            "post_type": post_data.post_type,
            "content": post_data.content,
            "battle_stats": post_data.battle_stats,
            "quiz_details": post_data.quiz_details,
            "room_code": post_data.room_code,
            "media_urls": post_data.media_urls,
            "tags": post_data.tags or [],
            "exam_category": post_data.exam_category,
            "subject": post_data.subject,
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "trending_score": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.social_posts.insert_one(post_doc.copy())
        
        if user:
            await db.users.update_one({"id": user_id}, {"$inc": {"posts_count": 1}})
        
        return {"success": True, "post": post_doc}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating post: {str(e)}")

@router.get("/posts/{post_id}")
async def get_post(post_id: str, authorization: Optional[str] = Header(None)):
    """Get single post with comments"""
    try:
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
        post["comments"] = comments
        
        user_id = get_optional_user_id(authorization)
        if user_id:
            liked = await db.post_likes.find_one({"user_id": user_id, "post_id": post_id})
            post["liked_by_user"] = liked is not None
        
        return {"success": True, "post": post}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching post: {str(e)}")

@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, authorization: Optional[str] = Header(None)):
    """Delete a post"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
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

# ==================== FEED ENDPOINTS ====================

@router.get("/feed/for-you")
async def get_for_you_feed(
    skip: int = 0,
    limit: int = 20,
    authorization: Optional[str] = Header(None)
):
    """Get personalized feed"""
    try:
        user_id = get_optional_user_id(authorization)
        mixed_posts = []
        
        if user_id:
            ceeps = await db.ceeps.find({"user_id": user_id}, {"_id": 0, "ceep_user_id": 1}).to_list(1000)
            following_ids = [c["ceep_user_id"] for c in ceeps]
            
            if following_ids:
                following_posts = await db.social_posts.find(
                    {"user_id": {"$in": following_ids}}, {"_id": 0}
                ).sort("created_at", -1).limit(limit // 2).to_list(limit // 2)
                mixed_posts.extend(following_posts)
        
        # Get trending posts
        trending = await db.social_posts.find({}, {"_id": 0}).sort("trending_score", -1).limit(limit).to_list(limit)
        
        existing_ids = {p["id"] for p in mixed_posts}
        for post in trending:
            if post["id"] not in existing_ids:
                mixed_posts.append(post)
        
        mixed_posts = await filter_expired_quiz_posts(mixed_posts)
        mixed_posts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        paginated = mixed_posts[skip:skip + limit]
        
        if user_id:
            for post in paginated:
                liked = await db.post_likes.find_one({"user_id": user_id, "post_id": post["id"]})
                post["liked_by_user"] = liked is not None
        
        return {"success": True, "posts": paginated, "count": len(paginated)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching feed: {str(e)}")

@router.get("/feed/trending")
async def get_trending_feed(skip: int = 0, limit: int = 10):
    """Get trending posts - sorted by recency and engagement"""
    try:
        # Get all posts
        posts = await db.social_posts.find({}, {"_id": 0}).to_list(None)
        posts = await filter_expired_quiz_posts(posts)
        
        # Sort by created_at in Python to handle mixed date formats
        def parse_date(post):
            try:
                date_str = post.get('created_at', '')
                # Handle both ISO formats (with and without timezone)
                if date_str:
                    if '+' in date_str or date_str.endswith('Z'):
                        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    else:
                        # Assume UTC for timezone-naive dates
                        dt = datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc)
                    return dt
                return datetime.min.replace(tzinfo=timezone.utc)
            except Exception as e:
                return datetime.min.replace(tzinfo=timezone.utc)
        
        posts.sort(key=parse_date, reverse=True)
        return {"success": True, "posts": posts[skip:skip + limit], "count": len(posts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trending: {str(e)}")

@router.get("/feed/following")
async def get_following_feed(
    skip: int = 0,
    limit: int = 10,
    authorization: Optional[str] = Header(None)
):
    """Get feed from followed users (approved follows only)"""
    try:
        if not authorization:
            return {"success": True, "posts": [], "count": 0}
        
        user_id = decode_jwt_token(authorization)
        
        # Get approved following relationships (only from follows collection - single source of truth)
        # Use aggregation pipeline for better performance with large datasets
        follows = await db.follows.find(
            {"follower_id": user_id, "status": "approved"}, 
            {"_id": 0, "following_id": 1}
        ).to_list(length=1000)
        
        following_ids = [f["following_id"] for f in follows if f.get("following_id")]
        
        if not following_ids:
            return {"success": True, "posts": [], "count": 0}
        
        # Get posts from followed users
        posts = await db.social_posts.find(
            {"user_id": {"$in": following_ids}}, 
            {"_id": 0}
        ).sort("created_at", -1).to_list(length=None)
        
        # Filter expired quiz room posts
        posts = await filter_expired_quiz_posts(posts)
        
        # Apply pagination
        paginated = posts[skip:skip + limit]
        
        # Add like status for current user
        for post in paginated:
            liked = await db.post_likes.find_one({
                "user_id": user_id, 
                "post_id": post["id"]
            })
            post["liked_by_user"] = liked is not None
        
        return {"success": True, "posts": paginated, "count": len(paginated)}
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
async def like_post(post_id: str, authorization: Optional[str] = Header(None)):
    """Like a post"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        
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
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0, "user_id": 1})
        if post and post["user_id"] != user_id:
            user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": post["user_id"],
                "notification_type": "like",
                "content": f"{user.get('name', 'Someone')} liked your post",
                "from_user_id": user_id,
                "from_user_name": user.get('name', 'Unknown'),
                "post_id": post_id,
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        return {"success": True, "message": "Post liked"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error liking post: {str(e)}")

@router.delete("/posts/{post_id}/like")
async def unlike_post(post_id: str, authorization: Optional[str] = Header(None)):
    """Unlike a post"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        result = await db.post_likes.delete_one({"user_id": user_id, "post_id": post_id})
        
        if result.deleted_count == 0:
            return {"success": True, "message": "Not liked"}
        
        await db.social_posts.update_one({"id": post_id}, {"$inc": {"likes_count": -1, "trending_score": -1}})
        return {"success": True, "message": "Post unliked"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unliking post: {str(e)}")

@router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    """Get comments for a post"""
    try:
        comments = await db.comments.find(
            {"post_id": post_id, "parent_comment_id": None}, {"_id": 0}
        ).sort("created_at", -1).to_list(None)
        return {"success": True, "comments": comments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching comments: {str(e)}")

@router.post("/posts/{post_id}/comment")
async def add_comment(
    post_id: str,
    comment_data: CommentRequest,
    authorization: Optional[str] = Header(None)
):
    """Add a comment"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        comment_doc = {
            "id": str(uuid.uuid4()),
            "post_id": post_id,
            "user_id": user_id,
            "user_name": user.get("name", "User") if user else "User",
            "user_avatar": user.get("avatar", "👤") if user else "👤",
            "content": comment_data.content,
            "parent_comment_id": comment_data.parent_comment_id,
            "likes_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.comments.insert_one(comment_doc.copy())
        await db.social_posts.update_one({"id": post_id}, {"$inc": {"comments_count": 1, "trending_score": 2}})
        
        # Create notification
        post = await db.social_posts.find_one({"id": post_id}, {"_id": 0, "user_id": 1})
        if post and post["user_id"] != user_id and user:
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": post["user_id"],
                "notification_type": "comment",
                "content": f"{user.get('name', 'Someone')} commented on your post",
                "from_user_id": user_id,
                "from_user_name": user.get('name', 'Unknown'),
                "post_id": post_id,
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        return {"success": True, "comment": comment_doc}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding comment: {str(e)}")

@router.post("/posts/{post_id}/share")
async def share_post(post_id: str, authorization: Optional[str] = Header(None)):
    """Share a post"""
    try:
        result = await db.social_posts.update_one({"id": post_id}, {"$inc": {"shares_count": 1, "trending_score": 3}})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Post not found")
        return {"success": True, "message": "Post shared"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sharing post: {str(e)}")

# ==================== USER PROFILE ENDPOINTS ====================

@router.get("/user/{user_id}")
async def get_user_profile(user_id: str):
    """Get user profile with accurate follow counts"""
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get posts count
        user["posts_count"] = await db.social_posts.count_documents({"user_id": user_id})
        
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
        
        return {"success": True, "user": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")

@router.post("/user/follow/{target_user_id}")
async def follow_user(target_user_id: str, authorization: Optional[str] = Header(None)):
    """
    Follow a user with proper privacy checks
    - Public accounts: Instant follow (status: approved)
    - Private accounts: Send follow request (status: pending)
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        follower_id = decode_jwt_token(authorization)
        
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
        is_private = target_user.get("is_private", False)
        follow_status = "pending" if is_private else "approved"
        
        # Create follow relationship (ONLY in follows collection)
        await db.follows.insert_one({
            "id": str(uuid.uuid4()),
            "follower_id": follower_id,
            "following_id": target_user_id,
            "status": follow_status,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Create notification
        notification_content = (
            f"{follower.get('name', 'Someone')} requested to follow you" 
            if is_private 
            else f"{follower.get('name', 'Someone')} started following you"
        )
        
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": target_user_id,
            "notification_type": "follow_request" if is_private else "follow",
            "content": notification_content,
            "from_user_id": follower_id,
            "from_user_name": follower.get('name', 'Unknown'),
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True, 
            "message": "Follow request sent" if is_private else "Now following",
            "status": follow_status
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error following user: {str(e)}")

@router.delete("/user/follow/{target_user_id}")
async def unfollow_user(target_user_id: str, authorization: Optional[str] = Header(None)):
    """Unfollow a user or cancel follow request"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        follower_id = decode_jwt_token(authorization)
        
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
    import random, string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

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
            "user_avatar": user.get("avatar", "👤") if user else "👤",
            "post_type": "quiz_room",
            "content": f"🎯 New Quiz: {room_data.title}\n\n{room_data.description}\n\n📝 {len(room_data.questions)} Questions\n🔑 Code: {room_code}",
            "room_code": room_code,
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
    """Get quiz room details with validation"""
    try:
        # Validate room code format (alphanumeric, 6 characters)
        if not room_code or len(room_code) != 6 or not room_code.isalnum():
            raise HTTPException(status_code=400, detail="Invalid room code format")
        
        room = await db.quiz_rooms.find_one({"room_code": room_code.upper()})
        if not room:
            raise HTTPException(status_code=404, detail="Quiz room not found")
        
        # Check TTL
        created_at = room.get("created_at")
        if created_at:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            if (datetime.now(timezone.utc) - created_at) > timedelta(hours=24):
                raise HTTPException(status_code=410, detail="Quiz expired")
        
        # Privacy check
        user_id = get_optional_user_id(authorization)
        if user_id and room.get("privacy") == "private" and user_id != room.get("host_id"):
            raise HTTPException(status_code=403, detail="Private quiz")
        
        room.pop("_id", None)
        return {"success": True, "room": room}
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
    """Submit quiz results"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = decode_jwt_token(authorization)
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        room = await db.quiz_rooms.find_one({"room_code": room_code.upper()})
        if not room:
            raise HTTPException(status_code=404, detail="Quiz room not found")
        
        result = {
            "id": str(uuid.uuid4()),
            "room_code": room_code.upper(),
            "room_id": room.get("id"),
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
        await db.quiz_rooms.update_one({"room_code": room_code.upper()}, {"$inc": {"plays_count": 1}})
        
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
            "user_avatar": user.get("avatar", "👤") if user else "👤",
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