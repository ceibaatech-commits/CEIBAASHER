"""Profile Content Routes — user posts, quiz-rooms, liked posts, reposts."""
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid, os
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / '.env')
from jose import jwt, JWTError
from profile_routes import (
    db, get_user_id_from_request, get_user_by_id, get_user_by_username,
    check_follow_relationship, get_follow_counts, create_notification,
    JWT_SECRET, JWT_ALGORITHM,
)

router = APIRouter()
@router.get("/{username}/posts")
async def get_user_posts(
    username: str,
    request: Request,
    current_user_id: Optional[str] = None,
    authorization: Optional[str] = Header(None),
):
    """Get all posts by a specific user, including their comments on other posts"""
    try:
        # Resolve current viewer (cookie/Bearer aware) — fallback to query param
        viewer_id = current_user_id
        if not viewer_id:
            try:
                viewer_id = await get_user_id_from_request(authorization, request)
            except Exception:
                viewer_id = None
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
        # Also check by username to handle demo user ID mismatch
        posts = await db.social_posts.find({
            "$or": [
                {"user_id": user_id},
                {"username": user.get("username", "")},
                {"user_name": user.get("name", "")}
            ]
        }).sort("created_at", -1).to_list(length=100)
        
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

        # Enrich posts with viewer-specific interaction state so refresh keeps
        # heart/repost fill + counters in sync with the DB.
        if viewer_id and posts:
            real_post_ids = [p.get("id") for p in posts if p.get("id") and not p.get("is_comment")]
            # Liked posts by viewer
            liked_ids = set()
            if real_post_ids:
                async for row in db.post_likes.find(
                    {"user_id": viewer_id, "post_id": {"$in": real_post_ids}},
                    {"_id": 0, "post_id": 1},
                ):
                    liked_ids.add(row.get("post_id"))
            # Reposts by viewer — collect original_post_ids viewer has retweeted
            shared_original_ids = set()
            async for row in db.social_posts.find(
                {"user_id": viewer_id, "is_retweet": True},
                {"_id": 0, "original_post_id": 1},
            ):
                if row.get("original_post_id"):
                    shared_original_ids.add(row["original_post_id"])

            for p in posts:
                pid = p.get("id")
                p["liked_by_user"] = pid in liked_ids
                p["shared_by_user"] = pid in shared_original_ids
        else:
            for p in posts:
                p.setdefault("liked_by_user", False)
                p.setdefault("shared_by_user", False)

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
        
        # Also fetch quiz rooms directly by host_id to cover async battle-created rooms
        direct_quiz_rooms = await db.quiz_rooms.find({"host_id": user_id}, {"_id": 0}).to_list(length=100)
        
        # Also fetch async battle rooms by host_id
        async_battle_rooms = await db.async_battle_rooms.find({"host_id": user_id}, {"_id": 0}).to_list(length=100)
        
        quiz_room_map = {}
        
        # Add direct quiz rooms (from social_feed endpoint)
        for room in direct_quiz_rooms:
            room_code = room.get("room_code")
            if not room_code:
                continue
            room["question_count"] = len(room.get("questions", []))
            room.pop("questions", None)
            quiz_room_map[room_code] = room
        
        # Add async battle rooms (ensure room_code for deduplication)
        for async_room in async_battle_rooms:
            # Use PIN as identifier for async rooms (they don't have room_code field)
            pin = async_room.get("pin")
            if not pin:
                continue
            # Convert async room format to standard quiz room format
            standard_room = {
                "room_code": f"async_{pin}",  # Prefix to distinguish from regular quiz rooms
                "title": f"Async Battle Room {pin}",
                "description": f"Exam: {async_room.get('exam_category', 'General')} | Subject: {async_room.get('subject', 'General')}",
                "category": async_room.get("exam_category", "General"),
                "question_count": len(async_room.get("questions", [])),
                "privacy": "public",
                "host_id": user_id,
                "host_name": async_room.get("host_name"),
                "created_at": async_room.get("created_at"),
                "pin": pin,
                "max_participants": async_room.get("max_participants"),
                "participant_count": async_room.get("participant_count", 0)
            }
            quiz_room_map[f"async_{pin}"] = standard_room
        
        # Extract room codes and fetch full room details from post records
        room_codes = [post.get("room_code") for post in quiz_room_posts if post.get("room_code")]
        for room_code in room_codes:
            if room_code in quiz_room_map:
                continue
            # Try to get full room details from quiz_rooms collection
            room = await db.quiz_rooms.find_one({"room_code": room_code}, {"_id": 0})
            
            if room:
                room["question_count"] = len(room.get("questions", []))
                room.pop("questions", None)
                quiz_room_map[room_code] = room
            else:
                # Fallback: Build room data from the post itself
                matching_post = next((p for p in quiz_room_posts if p.get("room_code") == room_code), None)
                if matching_post:
                    quiz_room_map[room_code] = {
                        "room_code": room_code,
                        "title": matching_post.get("quiz_details", {}).get("title") or f"Quiz Room {room_code}",
                        "description": matching_post.get("content", ""),
                        "category": matching_post.get("quiz_details", {}).get("category", "General"),
                        "question_count": matching_post.get("quiz_details", {}).get("question_count", 0),
                        "privacy": "public",
                        "host_id": user_id,
                        "host_username": user.get("username"),
                        "host_name": user.get("name"),
                        "created_at": matching_post.get("created_at")
                    }
        
        quiz_rooms = list(quiz_room_map.values())
        quiz_rooms.sort(key=lambda r: r.get("created_at") or "", reverse=True)
        
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

