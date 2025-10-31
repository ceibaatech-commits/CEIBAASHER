"""
Ceibaa Social Feed Routes
Comprehensive social networking features for educational platform
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone
import uuid

router = APIRouter()

# Database connection will be injected
db = None

def init_db(database):
    """Initialize database connection"""
    global db
    db = database

# ==================== MODELS ====================

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    username: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    exam_focus: List[str] = []  # JEE, NEET, SSC, etc.
    subjects: List[str] = []
    verified: bool = False
    verified_type: Optional[str] = None  # educator, institution, government, expert
    
    # Stats
    total_battles: int = 0
    battles_won: int = 0
    current_streak: int = 0
    city_rank: Optional[int] = None
    state_rank: Optional[int] = None
    country_rank: Optional[int] = None
    subjects_mastered: List[str] = []
    certificates_earned: int = 0
    
    # Social stats
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PostCreate(BaseModel):
    post_type: Literal["battle_victory", "quiz_announcement", "study_tip", "achievement", "government", "video", "general"]
    content: str
    
    # Optional fields based on post type
    battle_stats: Optional[dict] = None  # For battle_victory
    quiz_details: Optional[dict] = None  # For quiz_announcement
    media_urls: Optional[List[str]] = None  # For video/images
    tags: Optional[List[str]] = None
    exam_category: Optional[str] = None  # JEE, NEET, etc.
    subject: Optional[str] = None

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    user_verified: bool = False
    user_verified_type: Optional[str] = None
    user_location: Optional[str] = None
    
    post_type: str
    content: str
    battle_stats: Optional[dict] = None
    quiz_details: Optional[dict] = None
    media_urls: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    exam_category: Optional[str] = None
    subject: Optional[str] = None
    
    # Engagement
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    
    # Visibility
    is_trending: bool = False
    trending_score: int = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    content: str
    parent_comment_id: Optional[str] = None  # For nested replies
    likes_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudyGroup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    exam_focus: str
    created_by: str
    members: List[str] = []
    member_count: int = 0
    is_private: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    notification_type: str  # like, comment, follow, challenge, gift, etc.
    content: str
    from_user_id: str
    from_user_name: str
    post_id: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ==================== USER PROFILE ENDPOINTS ====================

@router.get("/user/{user_id}")
async def get_user_profile(user_id: str, request: Request):
    """Get user profile with full stats"""
    db = get_db(request)
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get additional stats
    posts_count = await db.social_posts.count_documents({"user_id": user_id})
    followers_count = await db.followers.count_documents({"following_id": user_id})
    following_count = await db.followers.count_documents({"follower_id": user_id})
    
    user["posts_count"] = posts_count
    user["followers_count"] = followers_count
    user["following_count"] = following_count
    
    return {"success": True, "user": user}

@router.put("/user/profile")
async def update_user_profile(profile_data: dict):
    """Update user profile"""
    user_id = profile_data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    # Update allowed fields
    allowed_fields = ["name", "username", "bio", "location", "avatar", "exam_focus", "subjects"]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "Profile updated"}

@router.post("/user/follow/{target_user_id}")
async def follow_user(target_user_id: str, follower_data: dict):
    """Follow a user"""
    follower_id = follower_data.get("user_id")
    if not follower_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    if follower_id == target_user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if already following
    existing = await db.followers.find_one({
        "follower_id": follower_id,
        "following_id": target_user_id
    })
    
    if existing:
        return {"success": True, "message": "Already following"}
    
    # Create follow relationship
    follow_doc = {
        "id": str(uuid.uuid4()),
        "follower_id": follower_id,
        "following_id": target_user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.followers.insert_one(follow_doc)
    
    # Create notification
    follower = await db.users.find_one({"id": follower_id}, {"_id": 0, "name": 1})
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": target_user_id,
        "notification_type": "follow",
        "content": f"{follower.get('name', 'Someone')} started following you",
        "from_user_id": follower_id,
        "from_user_name": follower.get('name', 'Unknown'),
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    return {"success": True, "message": "User followed"}

@router.delete("/user/follow/{target_user_id}")
async def unfollow_user(target_user_id: str, follower_id: str):
    """Unfollow a user"""
    result = await db.followers.delete_one({
        "follower_id": follower_id,
        "following_id": target_user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Follow relationship not found")
    
    return {"success": True, "message": "User unfollowed"}

@router.get("/user/{user_id}/followers")
async def get_user_followers(user_id: str):
    """Get list of followers"""
    followers = await db.followers.find({"following_id": user_id}, {"_id": 0}).to_list(1000)
    
    # Get user details for each follower
    follower_ids = [f["follower_id"] for f in followers]
    users = await db.users.find(
        {"id": {"$in": follower_ids}},
        {"_id": 0, "id": 1, "name": 1, "avatar": 1, "verified": 1}
    ).to_list(1000)
    
    return {"success": True, "followers": users}

@router.get("/user/{user_id}/following")
async def get_user_following(user_id: str):
    """Get list of users being followed"""
    following = await db.followers.find({"follower_id": user_id}, {"_id": 0}).to_list(1000)
    
    # Get user details
    following_ids = [f["following_id"] for f in following]
    users = await db.users.find(
        {"id": {"$in": following_ids}},
        {"_id": 0, "id": 1, "name": 1, "avatar": 1, "verified": 1}
    ).to_list(1000)
    
    return {"success": True, "following": users}


# ==================== POST ENDPOINTS ====================

@router.post("/posts")
async def create_post(post_data: PostCreate, user_id: str):
    """Create a new post"""
    # Get user info
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create post document
    post_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_name": user.get("name", "Unknown"),
        "user_avatar": user.get("avatar"),
        "user_verified": user.get("verified", False),
        "user_verified_type": user.get("verified_type"),
        "user_location": user.get("location"),
        "post_type": post_data.post_type,
        "content": post_data.content,
        "battle_stats": post_data.battle_stats,
        "quiz_details": post_data.quiz_details,
        "media_urls": post_data.media_urls,
        "tags": post_data.tags or [],
        "exam_category": post_data.exam_category,
        "subject": post_data.subject,
        "likes_count": 0,
        "comments_count": 0,
        "shares_count": 0,
        "is_trending": False,
        "trending_score": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.social_posts.insert_one(post_doc)
    
    # Update user's post count
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"posts_count": 1}}
    )
    
    return {"success": True, "post": post_doc}

@router.get("/feed/for-you")
async def get_for_you_feed(user_id: str, skip: int = 0, limit: int = 10):
    """Get personalized feed based on user's interests"""
    # Get user's exam focus and subjects
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "exam_focus": 1, "subjects": 1})
    
    # Build query for personalized content
    query = {}
    if user and user.get("exam_focus"):
        query["exam_category"] = {"$in": user.get("exam_focus", [])}
    
    posts = await db.social_posts.find(query, {"_id": 0}) \
        .sort("created_at", -1) \
        .skip(skip) \
        .limit(limit) \
        .to_list(limit)
    
    # Enrich with like status
    for post in posts:
        liked = await db.post_likes.find_one({
            "user_id": user_id,
            "post_id": post["id"]
        })
        post["liked_by_user"] = liked is not None
    
    return {"success": True, "posts": posts, "count": len(posts)}

@router.get("/feed/trending")
async def get_trending_feed(skip: int = 0, limit: int = 10):
    """Get trending posts"""
    posts = await db.social_posts.find({"_id": 0}) \
        .sort([("trending_score", -1), ("created_at", -1)]) \
        .skip(skip) \
        .limit(limit) \
        .to_list(limit)
    
    return {"success": True, "posts": posts, "count": len(posts)}

@router.get("/feed/following")
async def get_following_feed(user_id: str, skip: int = 0, limit: int = 10):
    """Get feed from users you follow"""
    # Get list of users being followed
    following = await db.followers.find({"follower_id": user_id}, {"_id": 0}).to_list(1000)
    following_ids = [f["following_id"] for f in following]
    
    if not following_ids:
        return {"success": True, "posts": [], "count": 0}
    
    posts = await db.social_posts.find(
        {"user_id": {"$in": following_ids}},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {"success": True, "posts": posts, "count": len(posts)}

@router.get("/feed/leaderboard")
async def get_leaderboard_feed(skip: int = 0, limit: int = 10):
    """Get posts from leaderboard/top performers"""
    posts = await db.social_posts.find(
        {"post_type": {"$in": ["battle_victory", "achievement"]}},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {"success": True, "posts": posts, "count": len(posts)}

@router.get("/feed/my-circle")
async def get_my_circle_feed(user_id: str, skip: int = 0, limit: int = 10):
    """Get posts from study groups and close network"""
    # Get user's study groups
    groups = await db.study_groups.find(
        {"members": user_id},
        {"_id": 0, "id": 1}
    ).to_list(100)
    
    group_ids = [g["id"] for g in groups]
    
    # Get posts from groups or tagged with groups
    posts = await db.social_posts.find(
        {"$or": [
            {"group_id": {"$in": group_ids}},
            {"tags": {"$in": group_ids}}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {"success": True, "posts": posts, "count": len(posts)}

@router.get("/posts/{post_id}")
async def get_post(post_id: str):
    """Get single post with details"""
    post = await db.social_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get comments
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}) \
        .sort("created_at", -1).to_list(100)
    
    post["comments"] = comments
    
    return {"success": True, "post": post}

@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user_id: str):
    """Delete a post"""
    post = await db.social_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    await db.social_posts.delete_one({"id": post_id})
    await db.comments.delete_many({"post_id": post_id})
    await db.post_likes.delete_many({"post_id": post_id})
    
    return {"success": True, "message": "Post deleted"}


# ==================== ENGAGEMENT ENDPOINTS ====================

@router.post("/posts/{post_id}/like")
async def like_post(post_id: str, user_data: dict):
    """Like a post"""
    user_id = user_data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    # Check if already liked
    existing = await db.post_likes.find_one({"user_id": user_id, "post_id": post_id})
    if existing:
        return {"success": True, "message": "Already liked"}
    
    # Create like
    like_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "post_id": post_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.post_likes.insert_one(like_doc)
    
    # Increment like count
    result = await db.social_posts.update_one(
        {"id": post_id},
        {"$inc": {"likes_count": 1, "trending_score": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Create notification for post owner
    post = await db.social_posts.find_one({"id": post_id}, {"_id": 0, "user_id": 1})
    if post and post["user_id"] != user_id:
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
        notification = {
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
        await db.notifications.insert_one(notification)
    
    return {"success": True, "message": "Post liked"}

@router.delete("/posts/{post_id}/like")
async def unlike_post(post_id: str, user_id: str):
    """Unlike a post"""
    result = await db.post_likes.delete_one({"user_id": user_id, "post_id": post_id})
    
    if result.deleted_count == 0:
        return {"success": True, "message": "Not liked"}
    
    # Decrement like count
    await db.social_posts.update_one(
        {"id": post_id},
        {"$inc": {"likes_count": -1, "trending_score": -1}}
    )
    
    return {"success": True, "message": "Post unliked"}

@router.post("/posts/{post_id}/comment")
async def add_comment(post_id: str, comment_data: dict):
    """Add a comment to a post"""
    user_id = comment_data.get("user_id")
    content = comment_data.get("content")
    
    if not user_id or not content:
        raise HTTPException(status_code=400, detail="user_id and content required")
    
    # Get user info
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1, "avatar": 1})
    
    # Create comment
    comment_doc = {
        "id": str(uuid.uuid4()),
        "post_id": post_id,
        "user_id": user_id,
        "user_name": user.get("name", "Unknown"),
        "user_avatar": user.get("avatar"),
        "content": content,
        "parent_comment_id": comment_data.get("parent_comment_id"),
        "likes_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.comments.insert_one(comment_doc)
    
    # Increment comment count
    await db.social_posts.update_one(
        {"id": post_id},
        {"$inc": {"comments_count": 1, "trending_score": 2}}
    )
    
    # Create notification
    post = await db.social_posts.find_one({"id": post_id}, {"_id": 0, "user_id": 1})
    if post and post["user_id"] != user_id:
        notification = {
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
        await db.notifications.insert_one(notification)
    
    return {"success": True, "comment": comment_doc}

@router.post("/comments/{comment_id}/reply")
async def reply_to_comment(comment_id: str, reply_data: dict):
    """Reply to a comment (nested)"""
    # Get the parent comment
    parent = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Add reply as a comment with parent_comment_id
    reply_data["parent_comment_id"] = comment_id
    return await add_comment(parent["post_id"], reply_data)

@router.post("/posts/{post_id}/share")
async def share_post(post_id: str, user_data: dict):
    """Share a post"""
    user_id = user_data.get("user_id")
    
    # Increment share count
    result = await db.social_posts.update_one(
        {"id": post_id},
        {"$inc": {"shares_count": 1, "trending_score": 3}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True, "message": "Post shared"}

@router.post("/posts/{post_id}/gift")
async def send_gift(post_id: str, gift_data: dict):
    """Send a gift to post owner"""
    user_id = gift_data.get("user_id")
    gift_type = gift_data.get("gift_type")  # star, diamond, crown, trophy
    
    gift_values = {
        "star": {"cost": 10, "received": 5},
        "diamond": {"cost": 50, "received": 25},
        "crown": {"cost": 100, "received": 50},
        "trophy": {"cost": 200, "received": 100}
    }
    
    if gift_type not in gift_values:
        raise HTTPException(status_code=400, detail="Invalid gift type")
    
    # Get post owner
    post = await db.social_posts.find_one({"id": post_id}, {"_id": 0, "user_id": 1})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot send gift to yourself")
    
    # Create gift transaction
    gift_doc = {
        "id": str(uuid.uuid4()),
        "from_user_id": user_id,
        "to_user_id": post["user_id"],
        "post_id": post_id,
        "gift_type": gift_type,
        "cost": gift_values[gift_type]["cost"],
        "received": gift_values[gift_type]["received"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.gifts.insert_one(gift_doc)
    
    # Create notification
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": post["user_id"],
        "notification_type": "gift",
        "content": f"{user.get('name', 'Someone')} sent you a {gift_type}!",
        "from_user_id": user_id,
        "from_user_name": user.get('name', 'Unknown'),
        "post_id": post_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    return {"success": True, "message": f"{gift_type} sent!"}

@router.post("/posts/{post_id}/challenge")
async def challenge_user(post_id: str, challenge_data: dict):
    """Challenge post owner to a battle"""
    user_id = challenge_data.get("user_id")
    subject = challenge_data.get("subject")
    topic = challenge_data.get("topic")
    
    # Get post owner
    post = await db.social_posts.find_one({"id": post_id}, {"_id": 0, "user_id": 1})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot challenge yourself")
    
    # Create challenge
    challenge_doc = {
        "id": str(uuid.uuid4()),
        "from_user_id": user_id,
        "to_user_id": post["user_id"],
        "subject": subject,
        "topic": topic,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.challenges.insert_one(challenge_doc)
    
    # Create notification
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": post["user_id"],
        "notification_type": "challenge",
        "content": f"{user.get('name', 'Someone')} challenged you to a battle!",
        "from_user_id": user_id,
        "from_user_name": user.get('name', 'Unknown'),
        "post_id": post_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    return {"success": True, "message": "Challenge sent!", "challenge_id": challenge_doc["id"]}


# ==================== STUDY GROUP ENDPOINTS ====================

@router.post("/groups")
async def create_study_group(group_data: dict):
    """Create a study group"""
    user_id = group_data.get("user_id")
    name = group_data.get("name")
    description = group_data.get("description")
    exam_focus = group_data.get("exam_focus")
    
    if not all([user_id, name, exam_focus]):
        raise HTTPException(status_code=400, detail="user_id, name, and exam_focus required")
    
    group_doc = {
        "id": str(uuid.uuid4()),
        "name": name,
        "description": description or "",
        "exam_focus": exam_focus,
        "created_by": user_id,
        "members": [user_id],
        "member_count": 1,
        "is_private": group_data.get("is_private", False),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.study_groups.insert_one(group_doc)
    
    return {"success": True, "group": group_doc}

@router.get("/groups")
async def get_user_groups(user_id: str):
    """Get user's study groups"""
    groups = await db.study_groups.find(
        {"members": user_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"success": True, "groups": groups}

@router.post("/groups/{group_id}/join")
async def join_study_group(group_id: str, user_data: dict):
    """Join a study group"""
    user_id = user_data.get("user_id")
    
    # Check if group exists
    group = await db.study_groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if user_id in group.get("members", []):
        return {"success": True, "message": "Already a member"}
    
    # Add user to group
    await db.study_groups.update_one(
        {"id": group_id},
        {
            "$addToSet": {"members": user_id},
            "$inc": {"member_count": 1}
        }
    )
    
    return {"success": True, "message": "Joined group"}


# ==================== NOTIFICATION ENDPOINTS ====================

@router.get("/notifications")
async def get_notifications(user_id: str, skip: int = 0, limit: int = 20):
    """Get user notifications"""
    notifications = await db.notifications.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    unread_count = await db.notifications.count_documents({
        "user_id": user_id,
        "is_read": False
    })
    
    return {
        "success": True,
        "notifications": notifications,
        "unread_count": unread_count
    }

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    result = await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"is_read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True, "message": "Notification marked as read"}

@router.put("/notifications/read-all")
async def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"success": True, "message": "All notifications marked as read"}
