import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Request, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from jose import jwt, JWTError

router = APIRouter()

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# JWT Config
JWT_SECRET = os.getenv("JWT_SECRET", "ceibaa-super-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Pydantic Models
class PostCreate(BaseModel):
    content: str
    hashtags: Optional[List[str]] = []
    quiz_id: Optional[str] = None
    quiz_title: Optional[str] = None
    media_urls: Optional[List[str]] = []
    post_type: Optional[str] = "text"  # text, quiz_result, achievement, battle_result, academic_question
    quiz_score: Optional[int] = None
    quiz_total: Optional[int] = None
    exam_name: Optional[str] = None
    opponent_id: Optional[str] = None
    opponent_name: Optional[str] = None
    battle_result: Optional[str] = None  # won, lost, draw
    # Academic question fields
    academic_class: Optional[str] = None  # e.g., "Class 9", "Class 11 (Science)"
    academic_subject: Optional[str] = None  # e.g., "Mathematics", "Hindi - Malhar"
    academic_chapter: Optional[str] = None  # e.g., "1. Number Systems"

class FriendRequest(BaseModel):
    receiver_id: str

class CommentCreate(BaseModel):
    content: str

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class StoryCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    background_color: Optional[str] = "#4F46E5"

class Post(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_profile_picture: Optional[str]
    is_verified: bool = False
    content: str
    hashtags: List[str] = []
    quiz_id: Optional[str] = None
    quiz_title: Optional[str] = None
    media_urls: List[str] = []
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    bookmarks_count: int = 0
    created_at: str
    is_liked: bool = False
    is_bookmarked: bool = False

# Helper Functions
def get_user_from_token(request: Request) -> dict:
    """Extract user from JWT token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_user_details(user_id: str) -> dict:
    """Get user details from database"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ==================== POSTS ====================

@router.post("/social/posts")
async def create_post(post: PostCreate, request: Request):
    """Create a new post"""
    current_user = get_user_from_token(request)
    user = await get_user_details(current_user["id"])
    
    post_id = str(uuid.uuid4())
    new_post = {
        "id": post_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_profile_picture": user.get("profile_picture"),
        "is_verified": user.get("is_verified", False),
        "content": post.content,
        "hashtags": post.hashtags,
        "quiz_id": post.quiz_id,
        "quiz_title": post.quiz_title,
        "media_urls": post.media_urls,
        "post_type": post.post_type,
        "quiz_score": post.quiz_score,
        "quiz_total": post.quiz_total,
        "exam_name": post.exam_name,
        "opponent_id": post.opponent_id,
        "opponent_name": post.opponent_name,
        "battle_result": post.battle_result,
        # Academic question fields
        "academic_class": post.academic_class,
        "academic_subject": post.academic_subject,
        "academic_chapter": post.academic_chapter,
        "likes_count": 0,
        "comments_count": 0,
        "shares_count": 0,
        "bookmarks_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.posts.insert_one(new_post)
    
    # Update hashtags collection
    for hashtag in post.hashtags:
        await db.hashtags.update_one(
            {"tag": hashtag},
            {
                "$inc": {"count": 1},
                "$set": {"last_used": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
    
    new_post.pop("_id", None)
    return {"success": True, "post": new_post}

@router.get("/social/feed")
async def get_feed(request: Request, skip: int = 0, limit: int = 20):
    """Get user's social feed"""
    current_user = get_user_from_token(request)
    
    # Get posts from followed users + own posts
    following = await db.follows.find({"follower_id": current_user["id"]}).to_list(None)
    following_ids = [f["following_id"] for f in following]
    following_ids.append(current_user["id"])
    
    posts = await db.posts.find(
        {"user_id": {"$in": following_ids}}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(None)
    
    # Check if current user liked/bookmarked each post
    for post in posts:
        post.pop("_id", None)
        
        # Check if liked
        like = await db.likes.find_one({
            "post_id": post["id"],
            "user_id": current_user["id"]
        })
        post["is_liked"] = bool(like)
        
        # Check if bookmarked
        bookmark = await db.bookmarks.find_one({
            "post_id": post["id"],
            "user_id": current_user["id"]
        })
        post["is_bookmarked"] = bool(bookmark)
    
    return posts

@router.get("/social/posts/{post_id}")
async def get_post(post_id: str, request: Request):
    """Get a single post by ID"""
    current_user = get_user_from_token(request)
    
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post.pop("_id", None)
    
    # Check if liked/bookmarked
    like = await db.likes.find_one({"post_id": post_id, "user_id": current_user["id"]})
    post["is_liked"] = bool(like)
    
    bookmark = await db.bookmarks.find_one({"post_id": post_id, "user_id": current_user["id"]})
    post["is_bookmarked"] = bool(bookmark)
    
    return post

@router.delete("/social/posts/{post_id}")
async def delete_post(post_id: str, request: Request):
    """Delete a post"""
    current_user = get_user_from_token(request)
    
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    await db.posts.delete_one({"id": post_id})
    await db.likes.delete_many({"post_id": post_id})
    await db.comments.delete_many({"post_id": post_id})
    await db.bookmarks.delete_many({"post_id": post_id})
    
    return {"message": "Post deleted successfully"}

# ==================== LIKES ====================

@router.post("/social/posts/{post_id}/like")
async def like_post(post_id: str, request: Request):
    """Like a post"""
    current_user = get_user_from_token(request)
    
    # Check if already liked
    existing_like = await db.likes.find_one({
        "post_id": post_id,
        "user_id": current_user["id"]
    })
    
    if existing_like:
        return {"message": "Already liked"}
    
    # Create like
    await db.likes.insert_one({
        "id": str(uuid.uuid4()),
        "post_id": post_id,
        "user_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Increment like count
    await db.posts.update_one(
        {"id": post_id},
        {"$inc": {"likes_count": 1}}
    )
    
    return {"message": "Post liked"}

@router.delete("/social/posts/{post_id}/like")
async def unlike_post(post_id: str, request: Request):
    """Unlike a post"""
    current_user = get_user_from_token(request)
    
    result = await db.likes.delete_one({
        "post_id": post_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count > 0:
        await db.posts.update_one(
            {"id": post_id},
            {"$inc": {"likes_count": -1}}
        )
    
    return {"message": "Post unliked"}

# ==================== COMMENTS ====================

@router.post("/social/posts/{post_id}/comments")
async def create_comment(post_id: str, comment: CommentCreate, request: Request):
    """Create a comment on a post"""
    current_user = get_user_from_token(request)
    user = await get_user_details(current_user["id"])
    
    comment_id = str(uuid.uuid4())
    new_comment = {
        "id": comment_id,
        "post_id": post_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_profile_picture": user.get("profile_picture"),
        "content": comment.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.comments.insert_one(new_comment)
    
    # Increment comment count
    await db.posts.update_one(
        {"id": post_id},
        {"$inc": {"comments_count": 1}}
    )
    
    new_comment.pop("_id", None)
    return new_comment

@router.get("/social/posts/{post_id}/comments")
async def get_comments(post_id: str, request: Request):
    """Get comments for a post"""
    get_user_from_token(request)  # Verify authentication
    
    comments = await db.comments.find(
        {"post_id": post_id}
    ).sort("created_at", -1).to_list(None)
    
    for comment in comments:
        comment.pop("_id", None)
    
    return comments

@router.delete("/social/comments/{comment_id}")
async def delete_comment(comment_id: str, request: Request):
    """Delete a comment"""
    current_user = get_user_from_token(request)
    
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.comments.delete_one({"id": comment_id})
    
    # Decrement comment count
    await db.posts.update_one(
        {"id": comment["post_id"]},
        {"$inc": {"comments_count": -1}}
    )
    
    return {"message": "Comment deleted"}

# ==================== BOOKMARKS ====================

@router.post("/social/posts/{post_id}/bookmark")
async def bookmark_post(post_id: str, request: Request):
    """Bookmark a post"""
    current_user = get_user_from_token(request)
    
    existing_bookmark = await db.bookmarks.find_one({
        "post_id": post_id,
        "user_id": current_user["id"]
    })
    
    if existing_bookmark:
        return {"message": "Already bookmarked"}
    
    await db.bookmarks.insert_one({
        "id": str(uuid.uuid4()),
        "post_id": post_id,
        "user_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.posts.update_one(
        {"id": post_id},
        {"$inc": {"bookmarks_count": 1}}
    )
    
    return {"message": "Post bookmarked"}

@router.delete("/social/posts/{post_id}/bookmark")
async def unbookmark_post(post_id: str, request: Request):
    """Remove bookmark from a post"""
    current_user = get_user_from_token(request)
    
    result = await db.bookmarks.delete_one({
        "post_id": post_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count > 0:
        await db.posts.update_one(
            {"id": post_id},
            {"$inc": {"bookmarks_count": -1}}
        )
    
    return {"message": "Bookmark removed"}

@router.get("/social/bookmarks")
async def get_bookmarks(request: Request):
    """Get user's bookmarked posts"""
    current_user = get_user_from_token(request)
    
    bookmarks = await db.bookmarks.find(
        {"user_id": current_user["id"]}
    ).sort("created_at", -1).to_list(None)
    
    post_ids = [b["post_id"] for b in bookmarks]
    posts = await db.posts.find({"id": {"$in": post_ids}}).to_list(None)
    
    for post in posts:
        post.pop("_id", None)
        post["is_bookmarked"] = True
        
        like = await db.likes.find_one({
            "post_id": post["id"],
            "user_id": current_user["id"]
        })
        post["is_liked"] = bool(like)
    
    return posts

# ==================== SHARES ====================

@router.post("/social/posts/{post_id}/share")
async def share_post(post_id: str, request: Request):
    """Share/retweet a post"""
    current_user = get_user_from_token(request)
    
    original_post = await db.posts.find_one({"id": post_id})
    if not original_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    user = await get_user_details(current_user["id"])
    
    # Create a new post that references the original
    share_id = str(uuid.uuid4())
    shared_post = {
        "id": share_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_profile_picture": user.get("profile_picture"),
        "is_verified": user.get("is_verified", False),
        "content": f"Shared: {original_post['content'][:50]}...",
        "original_post_id": post_id,
        "original_user_name": original_post["user_name"],
        "hashtags": [],
        "media_urls": [],
        "likes_count": 0,
        "comments_count": 0,
        "shares_count": 0,
        "bookmarks_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.insert_one(shared_post)
    
    # Increment share count on original post
    await db.posts.update_one(
        {"id": post_id},
        {"$inc": {"shares_count": 1}}
    )
    
    shared_post.pop("_id", None)
    return shared_post

# ==================== FOLLOW SYSTEM ====================

@router.post("/social/users/{user_id}/follow")
async def follow_user(user_id: str, request: Request):
    """Follow a user"""
    current_user = get_user_from_token(request)
    
    if current_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    existing_follow = await db.follows.find_one({
        "follower_id": current_user["id"],
        "following_id": user_id
    })
    
    if existing_follow:
        return {"message": "Already following"}
    
    await db.follows.insert_one({
        "id": str(uuid.uuid4()),
        "follower_id": current_user["id"],
        "following_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "User followed"}

@router.delete("/social/users/{user_id}/follow")
async def unfollow_user(user_id: str, request: Request):
    """Unfollow a user"""
    current_user = get_user_from_token(request)
    
    await db.follows.delete_one({
        "follower_id": current_user["id"],
        "following_id": user_id
    })
    
    return {"message": "User unfollowed"}

@router.get("/social/users/{user_id}/followers")
async def get_followers(user_id: str, request: Request):
    """Get user's followers"""
    get_user_from_token(request)
    
    followers = await db.follows.find({"following_id": user_id}).to_list(None)
    follower_ids = [f["follower_id"] for f in followers]
    
    users = await db.users.find({"id": {"$in": follower_ids}}).to_list(None)
    
    result = []
    for user in users:
        user.pop("_id", None)
        user.pop("password", None)
        result.append({
            "id": user["id"],
            "name": user["name"],
            "profile_picture": user.get("profile_picture"),
            "is_verified": user.get("is_verified", False)
        })
    
    return result

@router.get("/social/users/{user_id}/following")
async def get_following(user_id: str, request: Request):
    """Get users that this user follows"""
    get_user_from_token(request)
    
    following = await db.follows.find({"follower_id": user_id}).to_list(None)
    following_ids = [f["following_id"] for f in following]
    
    users = await db.users.find({"id": {"$in": following_ids}}).to_list(None)
    
    result = []
    for user in users:
        user.pop("_id", None)
        user.pop("password", None)
        result.append({
            "id": user["id"],
            "name": user["name"],
            "profile_picture": user.get("profile_picture"),
            "is_verified": user.get("is_verified", False)
        })
    
    return result

@router.get("/social/users/{user_id}/stats")
async def get_user_stats(user_id: str, request: Request):
    """Get user statistics"""
    get_user_from_token(request)
    
    posts_count = await db.posts.count_documents({"user_id": user_id})
    followers_count = await db.follows.count_documents({"following_id": user_id})
    following_count = await db.follows.count_documents({"follower_id": user_id})
    
    return {
        "posts_count": posts_count,
        "followers_count": followers_count,
        "following_count": following_count
    }

@router.get("/social/users/{user_id}/posts")
async def get_user_posts(user_id: str, request: Request, skip: int = 0, limit: int = 20):
    """Get posts by a specific user"""
    current_user = get_user_from_token(request)
    
    posts = await db.posts.find(
        {"user_id": user_id}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(None)
    
    for post in posts:
        post.pop("_id", None)
        
        like = await db.likes.find_one({
            "post_id": post["id"],
            "user_id": current_user["id"]
        })
        post["is_liked"] = bool(like)
        
        bookmark = await db.bookmarks.find_one({
            "post_id": post["id"],
            "user_id": current_user["id"]
        })
        post["is_bookmarked"] = bool(bookmark)
    
    return posts

# ==================== DIRECT MESSAGES ====================

@router.post("/social/messages")
async def send_message(message: MessageCreate, request: Request):
    """Send a direct message"""
    current_user = get_user_from_token(request)
    user = await get_user_details(current_user["id"])
    
    message_id = str(uuid.uuid4())
    new_message = {
        "id": message_id,
        "sender_id": user["id"],
        "sender_name": user["name"],
        "sender_profile_picture": user.get("profile_picture"),
        "receiver_id": message.receiver_id,
        "content": message.content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(new_message)
    
    new_message.pop("_id", None)
    return new_message

@router.get("/social/messages/conversations")
async def get_conversations(request: Request):
    """Get list of conversations"""
    current_user = get_user_from_token(request)
    
    # Get all messages where user is sender or receiver
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user["id"]},
            {"receiver_id": current_user["id"]}
        ]
    }).sort("created_at", -1).to_list(None)
    
    # Group by conversation partner
    conversations = {}
    for msg in messages:
        partner_id = msg["receiver_id"] if msg["sender_id"] == current_user["id"] else msg["sender_id"]
        
        if partner_id not in conversations:
            partner = await get_user_details(partner_id)
            conversations[partner_id] = {
                "partner_id": partner_id,
                "partner_name": partner["name"],
                "partner_profile_picture": partner.get("profile_picture"),
                "last_message": msg["content"],
                "last_message_time": msg["created_at"],
                "unread_count": 0
            }
        
        # Count unread messages from partner
        if msg["receiver_id"] == current_user["id"] and not msg["is_read"]:
            conversations[partner_id]["unread_count"] += 1
    
    return list(conversations.values())

@router.get("/social/messages/{user_id}")
async def get_messages_with_user(user_id: str, request: Request):
    """Get messages with a specific user"""
    current_user = get_user_from_token(request)
    
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user["id"], "receiver_id": user_id},
            {"sender_id": user_id, "receiver_id": current_user["id"]}
        ]
    }).sort("created_at", 1).to_list(None)
    
    # Mark messages as read
    await db.messages.update_many(
        {"sender_id": user_id, "receiver_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    for msg in messages:
        msg.pop("_id", None)
    
    return messages

# ==================== STORIES ====================

@router.post("/social/stories")
async def create_story(story: StoryCreate, request: Request):
    """Create a story (24hr content)"""
    current_user = get_user_from_token(request)
    user = await get_user_details(current_user["id"])
    
    story_id = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    
    new_story = {
        "id": story_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_profile_picture": user.get("profile_picture"),
        "content": story.content,
        "media_url": story.media_url,
        "background_color": story.background_color,
        "views_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat()
    }
    
    await db.stories.insert_one(new_story)
    
    new_story.pop("_id", None)
    return new_story

@router.get("/social/stories")
async def get_stories(request: Request):
    """Get active stories from followed users"""
    current_user = get_user_from_token(request)
    
    # Get followed users
    following = await db.follows.find({"follower_id": current_user["id"]}).to_list(None)
    following_ids = [f["following_id"] for f in following]
    following_ids.append(current_user["id"])
    
    # Get non-expired stories
    now = datetime.now(timezone.utc).isoformat()
    stories = await db.stories.find({
        "user_id": {"$in": following_ids},
        "expires_at": {"$gt": now}
    }).sort("created_at", -1).to_list(None)
    
    # Group by user
    stories_by_user = {}
    for story in stories:
        story.pop("_id", None)
        user_id = story["user_id"]
        
        if user_id not in stories_by_user:
            stories_by_user[user_id] = {
                "user_id": user_id,
                "user_name": story["user_name"],
                "user_profile_picture": story["user_profile_picture"],
                "stories": []
            }
        
        stories_by_user[user_id]["stories"].append(story)
    
    return list(stories_by_user.values())

@router.post("/social/stories/{story_id}/view")
async def view_story(story_id: str, request: Request):
    """Mark story as viewed"""
    get_user_from_token(request)
    
    await db.stories.update_one(
        {"id": story_id},
        {"$inc": {"views_count": 1}}
    )
    
    return {"message": "Story viewed"}

@router.delete("/social/stories/{story_id}")
async def delete_story(story_id: str, request: Request):
    """Delete a story"""
    current_user = get_user_from_token(request)
    
    story = await db.stories.find_one({"id": story_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    if story["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.stories.delete_one({"id": story_id})
    
    return {"message": "Story deleted"}

# ==================== FRIEND REQUESTS ====================

@router.post("/social/friend-requests")
async def send_friend_request(friend_request: FriendRequest, request: Request):
    """Send a friend request"""
    current_user = get_user_from_token(request)
    
    if current_user["id"] == friend_request.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    # Check if already friends
    existing_friendship = await db.friendships.find_one({
        "$or": [
            {"user1_id": current_user["id"], "user2_id": friend_request.receiver_id},
            {"user1_id": friend_request.receiver_id, "user2_id": current_user["id"]}
        ]
    })
    
    if existing_friendship:
        return {"message": "Already friends"}
    
    # Check if request already exists
    existing_request = await db.friend_requests.find_one({
        "sender_id": current_user["id"],
        "receiver_id": friend_request.receiver_id,
        "status": "pending"
    })
    
    if existing_request:
        return {"message": "Friend request already sent"}
    
    user = await get_user_details(current_user["id"])
    
    request_id = str(uuid.uuid4())
    new_request = {
        "id": request_id,
        "sender_id": user["id"],
        "sender_name": user["name"],
        "sender_profile_picture": user.get("profile_picture"),
        "receiver_id": friend_request.receiver_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.friend_requests.insert_one(new_request)
    
    new_request.pop("_id", None)
    return new_request

@router.get("/social/friend-requests")
async def get_friend_requests(request: Request):
    """Get pending friend requests"""
    current_user = get_user_from_token(request)
    
    requests = await db.friend_requests.find({
        "receiver_id": current_user["id"],
        "status": "pending"
    }).sort("created_at", -1).to_list(None)
    
    for req in requests:
        req.pop("_id", None)
    
    return requests

@router.post("/social/friend-requests/{request_id}/accept")
async def accept_friend_request(request_id: str, request: Request):
    """Accept a friend request"""
    current_user = get_user_from_token(request)
    
    friend_request = await db.friend_requests.find_one({"id": request_id})
    
    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    if friend_request["receiver_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update request status
    await db.friend_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Create friendship
    friendship_id = str(uuid.uuid4())
    await db.friendships.insert_one({
        "id": friendship_id,
        "user1_id": friend_request["sender_id"],
        "user2_id": friend_request["receiver_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Auto-follow each other
    follow_id_1 = str(uuid.uuid4())
    await db.follows.insert_one({
        "id": follow_id_1,
        "follower_id": friend_request["sender_id"],
        "following_id": friend_request["receiver_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    follow_id_2 = str(uuid.uuid4())
    await db.follows.insert_one({
        "id": follow_id_2,
        "follower_id": friend_request["receiver_id"],
        "following_id": friend_request["sender_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Friend request accepted"}

@router.post("/social/friend-requests/{request_id}/reject")
async def reject_friend_request(request_id: str, request: Request):
    """Reject a friend request"""
    current_user = get_user_from_token(request)
    
    friend_request = await db.friend_requests.find_one({"id": request_id})
    
    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    if friend_request["receiver_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.friend_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "rejected"}}
    )
    
    return {"message": "Friend request rejected"}

@router.get("/social/friends")
async def get_friends(request: Request):
    """Get user's friends list"""
    current_user = get_user_from_token(request)
    
    friendships = await db.friendships.find({
        "$or": [
            {"user1_id": current_user["id"]},
            {"user2_id": current_user["id"]}
        ]
    }).to_list(None)
    
    friend_ids = []
    for friendship in friendships:
        if friendship["user1_id"] == current_user["id"]:
            friend_ids.append(friendship["user2_id"])
        else:
            friend_ids.append(friendship["user1_id"])
    
    friends = await db.users.find({"id": {"$in": friend_ids}}).to_list(None)
    
    result = []
    for friend in friends:
        friend.pop("_id", None)
        friend.pop("password", None)
        result.append({
            "id": friend["id"],
            "name": friend["name"],
            "profile_picture": friend.get("profile_picture"),
            "is_verified": friend.get("is_verified", False)
        })
    
    return result

@router.delete("/social/friends/{friend_id}")
async def remove_friend(friend_id: str, request: Request):
    """Remove a friend"""
    current_user = get_user_from_token(request)
    
    # Delete friendship
    await db.friendships.delete_one({
        "$or": [
            {"user1_id": current_user["id"], "user2_id": friend_id},
            {"user1_id": friend_id, "user2_id": current_user["id"]}
        ]
    })
    
    return {"message": "Friend removed"}

@router.get("/social/friends/check/{user_id}")
async def check_friendship(user_id: str, request: Request):
    """Check if two users are friends"""
    current_user = get_user_from_token(request)
    
    friendship = await db.friendships.find_one({
        "$or": [
            {"user1_id": current_user["id"], "user2_id": user_id},
            {"user1_id": user_id, "user2_id": current_user["id"]}
        ]
    })
    
    return {"are_friends": bool(friendship)}

# ==================== BATTLE INTEGRATION ====================

@router.post("/social/share-battle-result")
async def share_battle_result(
    opponent_id: str,
    opponent_name: str,
    result: str,
    score: int,
    total: int,
    exam_name: str,
    request: Request
):
    """Automatically share battle result to social feed"""
    current_user = get_user_from_token(request)
    user = await get_user_details(current_user["id"])
    
    # Generate content based on result
    if result == "won":
        emoji = "🏆"
        content = f"{emoji} Just won a battle against {opponent_name}! Scored {score}/{total} in {exam_name}. #Battle #Victory #{exam_name.replace(' ', '')}"
    elif result == "lost":
        emoji = "💪"
        content = f"{emoji} Had an intense battle with {opponent_name} in {exam_name}! Scored {score}/{total}. Learning and improving! #Battle #{exam_name.replace(' ', '')}"
    else:
        emoji = "🤝"
        content = f"{emoji} Epic draw with {opponent_name}! Both scored {score}/{total} in {exam_name}. #Battle #Draw #{exam_name.replace(' ', '')}"
    
    hashtags = ["Battle", exam_name.replace(' ', '')]
    if result == "won":
        hashtags.append("Victory")
    
    post_id = str(uuid.uuid4())
    new_post = {
        "id": post_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_profile_picture": user.get("profile_picture"),
        "is_verified": user.get("is_verified", False),
        "content": content,
        "hashtags": hashtags,
        "post_type": "battle_result",
        "quiz_score": score,
        "quiz_total": total,
        "exam_name": exam_name,
        "opponent_id": opponent_id,
        "opponent_name": opponent_name,
        "battle_result": result,
        "likes_count": 0,
        "comments_count": 0,
        "shares_count": 0,
        "bookmarks_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.posts.insert_one(new_post)
    
    new_post.pop("_id", None)
    return new_post

@router.post("/social/share-quiz-score")
async def share_quiz_score(
    exam_name: str,
    topic_name: str,
    score: int,
    total: int,
    request: Request
):
    """Share quiz practice score"""
    current_user = get_user_from_token(request)
    user = await get_user_details(current_user["id"])
    
    percentage = int((score / total) * 100)
    
    if percentage >= 90:
        emoji = "🌟"
        message = "Excellent"
    elif percentage >= 75:
        emoji = "🎯"
        message = "Great"
    elif percentage >= 60:
        emoji = "👍"
        message = "Good"
    else:
        emoji = "📚"
        message = "Practicing"
    
    content = f"{emoji} {message} practice session! Scored {score}/{total} ({percentage}%) in {topic_name} - {exam_name}. #StudyProgress #{exam_name.replace(' ', '')} #{topic_name.replace(' ', '')}"
    
    hashtags = ["StudyProgress", exam_name.replace(' ', ''), topic_name.replace(' ', '')]
    
    post_id = str(uuid.uuid4())
    new_post = {
        "id": post_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_profile_picture": user.get("profile_picture"),
        "is_verified": user.get("is_verified", False),
        "content": content,
        "hashtags": hashtags,
        "post_type": "quiz_result",
        "quiz_score": score,
        "quiz_total": total,
        "exam_name": exam_name,
        "quiz_title": topic_name,
        "likes_count": 0,
        "comments_count": 0,
        "shares_count": 0,
        "bookmarks_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.posts.insert_one(new_post)
    
    new_post.pop("_id", None)
    return new_post

@router.get("/social/battle-chat/{opponent_id}")
async def get_battle_chat(opponent_id: str, request: Request):
    """Get chat messages with battle opponent (alias for messages)"""
    current_user = get_user_from_token(request)
    
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user["id"], "receiver_id": opponent_id},
            {"sender_id": opponent_id, "receiver_id": current_user["id"]}
        ]
    }).sort("created_at", 1).to_list(None)
    
    # Mark messages as read
    await db.messages.update_many(
        {"sender_id": opponent_id, "receiver_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    for msg in messages:
        msg.pop("_id", None)
    
    return messages


# ==================== TRENDING & DISCOVERY ====================

@router.get("/social/trending/hashtags")
async def get_trending_hashtags(request: Request, limit: int = 10):
    """Get trending hashtags"""
    get_user_from_token(request)
    
    hashtags = await db.hashtags.find().sort("count", -1).limit(limit).to_list(None)
    
    for tag in hashtags:
        tag.pop("_id", None)
    
    return hashtags

@router.get("/social/trending/posts")
async def get_trending_posts(request: Request, limit: int = 20):
    """Get trending posts (most engagement)"""
    current_user = get_user_from_token(request)
    
    # Get posts from last 7 days with most engagement
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    posts = await db.posts.find({
        "created_at": {"$gte": seven_days_ago}
    }).sort([
        ("likes_count", -1),
        ("comments_count", -1),
        ("shares_count", -1)
    ]).limit(limit).to_list(None)
    
    for post in posts:
        post.pop("_id", None)
        
        like = await db.likes.find_one({
            "post_id": post["id"],
            "user_id": current_user["id"]
        })
        post["is_liked"] = bool(like)
        
        bookmark = await db.bookmarks.find_one({
            "post_id": post["id"],
            "user_id": current_user["id"]
        })
        post["is_bookmarked"] = bool(bookmark)
    
    return posts

@router.get("/social/discover/users")
async def discover_users(request: Request, limit: int = 10):
    """Get suggested users to follow"""
    current_user = get_user_from_token(request)
    
    # Get users current user is following
    following = await db.follows.find({"follower_id": current_user["id"]}).to_list(None)
    following_ids = [f["following_id"] for f in following]
    following_ids.append(current_user["id"])
    
    # Get users not followed yet, prioritize verified users
    users = await db.users.find({
        "id": {"$nin": following_ids}
    }).sort("is_verified", -1).limit(limit).to_list(None)
    
    result = []
    for user in users:
        user.pop("_id", None)
        user.pop("password", None)
        
        # Get follower count
        followers_count = await db.follows.count_documents({"following_id": user["id"]})
        
        result.append({
            "id": user["id"],
            "name": user["name"],
            "profile_picture": user.get("profile_picture"),
            "is_verified": user.get("is_verified", False),
            "followers_count": followers_count
        })
    
    return result

@router.get("/social/search")
async def search(request: Request, q: str = Query(..., min_length=1)):
    """Search for posts, users, and hashtags"""
    get_user_from_token(request)
    
    # Search posts
    posts = await db.posts.find({
        "$or": [
            {"content": {"$regex": q, "$options": "i"}},
            {"hashtags": {"$regex": q, "$options": "i"}}
        ]
    }).limit(10).to_list(None)
    
    # Search users
    users = await db.users.find({
        "name": {"$regex": q, "$options": "i"}
    }).limit(10).to_list(None)
    
    # Search hashtags
    hashtags = await db.hashtags.find({
        "tag": {"$regex": q, "$options": "i"}
    }).limit(10).to_list(None)
    
    for post in posts:
        post.pop("_id", None)
    
    for user in users:
        user.pop("_id", None)
        user.pop("password", None)
    
    for tag in hashtags:
        tag.pop("_id", None)
    
    return {
        "posts": posts,
        "users": users,
        "hashtags": hashtags
    }
