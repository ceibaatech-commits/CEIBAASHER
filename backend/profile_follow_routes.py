"""Profile Follow Routes — follow/unfollow, requests, status, close-friends, block."""
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
    JWT_SECRET, JWT_ALGORITHM, ProfileUpdate, FollowRequest,
)

router = APIRouter()


# ---------- Block helpers (shared across feed/profile/etc) ----------
async def get_blocked_user_ids(user_id: str) -> set:
    """Return set of user_ids that have a block relationship with `user_id`
    in EITHER direction (current user blocked them OR they blocked current user).
    Used to filter posts/profiles/matchmaking results.
    """
    if not user_id:
        return set()
    blocked = set()
    async for b in db.blocks.find(
        {"$or": [{"blocker_id": user_id}, {"blocked_id": user_id}]},
        {"_id": 0, "blocker_id": 1, "blocked_id": 1},
    ):
        blocked.add(b["blocked_id"] if b["blocker_id"] == user_id else b["blocker_id"])
    blocked.discard(user_id)
    return blocked


async def is_blocked_between(viewer_id: Optional[str], target_id: str) -> bool:
    """True iff either party has blocked the other."""
    if not viewer_id or viewer_id == target_id:
        return False
    doc = await db.blocks.find_one({
        "$or": [
            {"blocker_id": viewer_id, "blocked_id": target_id},
            {"blocker_id": target_id, "blocked_id": viewer_id},
        ]
    }, {"_id": 0, "blocker_id": 1})
    return doc is not None


@router.get("/close-friend-ids")
async def get_close_friend_ids(request: Request, authorization: Optional[str] = Header(None)):
    """Get list of close friend user IDs for the current user."""
    try:
        user_id = await get_user_id_from_request(authorization, request)
        docs = await db.close_friends.find(
            {"user_id": user_id},
            {"_id": 0, "friend_id": 1}
        ).to_list(500)
        friend_ids = [d["friend_id"] for d in docs if d.get("friend_id")]
        return {"success": True, "friend_ids": friend_ids}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": True, "friend_ids": []}


# --- Close friend endpoint ---
@router.post("/close-friend")
async def toggle_close_friend(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Add or remove a user from close friends list."""
    try:
        body = await request.json()
        target_user_id = body.get("target_user_id")
        action = body.get("action", "add")  # 'add' or 'remove'

        # Hybrid auth (cookie OR bearer)
        user_id = await get_user_id_from_request(authorization, request)

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
async def block_user(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Block a user."""
    try:
        body = await request.json()
        target_user_id = body.get("target_user_id")
        if not target_user_id:
            raise HTTPException(status_code=400, detail="target_user_id is required")

        # Hybrid auth (cookie OR bearer)
        user_id = await get_user_id_from_request(authorization, request)

        # Can't block yourself
        if user_id == target_user_id:
            raise HTTPException(status_code=400, detail="Cannot block yourself")

        # Target user must exist
        target = await db.users.find_one({"id": target_user_id}, {"_id": 0, "id": 1})
        if not target:
            raise HTTPException(status_code=404, detail="User not found")

        # Add to blocks (atomic upsert)
        await db.blocks.update_one(
            {"blocker_id": user_id, "blocked_id": target_user_id},
            {"$set": {"blocker_id": user_id, "blocked_id": target_user_id, "created_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )

        # Remove any follow relationship (both directions)
        await db.follows.delete_many({
            "$or": [
                {"follower_id": user_id, "following_id": target_user_id},
                {"follower_id": target_user_id, "following_id": user_id}
            ]
        })

        # Remove from close friends (both directions)
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
        # Resolve all possible user IDs (handle demo user ID mismatch)
        user_ids = [user_id]
        user_doc = await db.users.find_one(
            {"$or": [{"id": user_id}, {"username": user_id}]},
            {"_id": 0, "id": 1, "username": 1, "xp": 1, "total_xp": 1}
        )
        if user_doc and user_doc.get("id") != user_id:
            user_ids.append(user_doc["id"])

        # Also check for demo user IDs
        demo_mapping = {"demo1-uuid": "demostudent1", "demo2-uuid": "demostudent2", "demo3-uuid": "demostudent3"}
        reverse_demo = {v: k for k, v in demo_mapping.items()}
        if user_id in demo_mapping:
            mapped_user = await db.users.find_one({"username": demo_mapping[user_id]}, {"_id": 0, "id": 1})
            if mapped_user:
                user_ids.append(mapped_user["id"])
        elif user_id in reverse_demo:
            user_ids.append(reverse_demo[user_id])
        if user_doc:
            uname = user_doc.get("username", "")
            if uname in reverse_demo:
                user_ids.append(reverse_demo[uname])

        user_ids = list(set(user_ids))
        uid_query = {"user_id": {"$in": user_ids}}

        # Count quizzes completed
        quizzes_completed = await db.quiz_history.count_documents(uid_query)

        # Calculate average score
        pipeline = [
            {"$match": uid_query},
            {"$group": {"_id": None, "avg_score": {"$avg": "$accuracy"}}}
        ]
        avg_result = await db.quiz_history.aggregate(pipeline).to_list(1)
        avg_score = avg_result[0]["avg_score"] if avg_result else 0

        # Count battle wins
        battle_wins = await db.user_battle_history.count_documents({
            **uid_query,
            "$or": [{"result": "won"}, {"is_winner": True}, {"rank": 1}]
        })

        # Calculate rank
        rank = None
        if user_doc:
            user_xp = user_doc.get("total_xp", user_doc.get("xp", 0))
            if user_xp and user_xp > 0:
                rank = await db.users.count_documents({
                    "$or": [
                        {"total_xp": {"$gt": user_xp}},
                        {"xp": {"$gt": user_xp}}
                    ]
                }) + 1

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
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
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


# NOTE: Literal single-segment GET routes must be declared BEFORE
# `@router.get("/{username}")` below — otherwise FastAPI matches them as
# a username path parameter and returns 404 "User not found".

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
        for req_doc in requests_data:  # renamed from `request` to avoid shadowing the FastAPI param
            requester = await db.users.find_one({"id": req_doc["follower_id"]})
            if requester:
                requester.pop("_id", None)

                # Check for mutual followers (people who follow both current user and requester)
                requester_followers = await db.follows.find({
                    "following_id": req_doc["follower_id"],
                    "status": "approved"
                }, {"follower_id": 1, "_id": 0}).to_list(length=None)

                requester_follower_ids = [f["follower_id"] for f in requester_followers]

                if requester_follower_ids:
                    mutual_count = await db.follows.count_documents({
                        "follower_id": user_id,
                        "following_id": {"$in": requester_follower_ids},
                        "status": "approved"
                    })
                else:
                    mutual_count = 0

                requests.append({
                    "request_id": req_doc["id"],
                    "user_id": requester["id"],
                    "username": requester.get("username"),
                    "name": requester.get("name"),
                    "profile_picture": requester.get("profile_picture"),
                    "bio": requester.get("bio"),
                    "requested_at": req_doc.get("created_at"),
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


@router.get("/{username}")
async def get_user_profile(
    username: str,
    request: Request,
    current_user_id: Optional[str] = None,
    authorization: Optional[str] = Header(None),
):
    """
    Get user profile by username or user ID
    Returns full profile if public or if viewer is following (for private accounts)
    """
    try:
        # If the frontend didn't pass current_user_id (e.g. AuthContext not yet
        # hydrated), fall back to the cookie/bearer session so the block check
        # still works.
        if not current_user_id:
            try:
                current_user_id = await get_user_id_from_request(authorization, request)
            except HTTPException:
                current_user_id = None

        # Get target user - try by username first, then by ID if that fails
        try:
            user = await get_user_by_username(username)
        except Exception:
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

        # Block check: hide the profile from either side if a block exists
        if current_user_id and current_user_id != user["id"]:
            if await is_blocked_between(current_user_id, user["id"]):
                return {
                    "success": True,
                    "profile": {
                        "id": user["id"],
                        "user_id": user["id"],
                        "username": user.get("username"),
                        "name": user.get("name"),
                        "is_unavailable": True,
                        "can_view": False,
                    },
                    "follow_status": None,
                    "is_blocked": True,
                    "message": "This account is not available",
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

        # Can't unfollow yourself
        if follower_id == target_user_id:
            raise HTTPException(status_code=400, detail="Cannot unfollow yourself")

        # Delete follow relationship
        result = await db.follows.delete_one({
            "follower_id": follower_id,
            "following_id": target_user_id
        })

        # Also drop any close-friend mapping (idempotent)
        await db.close_friends.delete_one({
            "user_id": follower_id,
            "friend_id": target_user_id
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


# `/follow-requests` was moved ABOVE `/{username}` to fix FastAPI route-ordering
# collision (the catch-all captured the literal path as a username). See
# the earlier declaration for the actual handler.


@router.get("/follow-status/{target_user_id}")
async def get_follow_status(
    target_user_id: str,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Check follow status between current user and target user"""
    try:
        # Get user_id using hybrid authentication (cookie OR bearer)
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

