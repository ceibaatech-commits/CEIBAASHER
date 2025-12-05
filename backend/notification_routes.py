"""
Notification System Routes
Handles all notification types and delivery
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
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

class Notification(BaseModel):
    """Notification model"""
    id: str
    user_id: str
    type: str  # follow, like, comment, quiz_created, score_beaten, daily_streak
    actor_id: Optional[str] = None
    actor_name: str
    actor_avatar: Optional[str] = None
    content: str
    reference_id: Optional[str] = None  # post_id, quiz_id, etc.
    is_read: bool = False
    created_at: str

class NotificationPreferences(BaseModel):
    """User notification preferences"""
    push_new_follower: bool = True
    push_post_likes: bool = True
    push_comments: bool = True
    push_quiz_created: bool = True
    push_score_beaten: bool = True
    push_daily_streak: bool = True
    email_weekly_summary: bool = True
    email_daily_digest: bool = False
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "08:00"

# ==================== HELPER FUNCTIONS ====================

async def create_notification(
    user_id: str,
    notification_type: str,
    actor_id: Optional[str],
    actor_name: str,
    actor_avatar: Optional[str],
    content: str,
    reference_id: Optional[str] = None
):
    """Create a new notification"""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "actor_id": actor_id,
        "actor_name": actor_name,
        "actor_avatar": actor_avatar or "",
        "content": content,
        "reference_id": reference_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    return notification

# ==================== NOTIFICATION ENDPOINTS ====================

@router.get("/notifications")
async def get_notifications(
    notification_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    authorization: Optional[str] = Header(None)
):
    """
    Get notifications for current user
    Can filter by type and unread status
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Decode JWT token to get user_id
        token = authorization.replace("Bearer ", "")
        try:
            import jwt
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get("sub")
        except:
            user_id = token  # Fallback for simple tokens
        
        # Build query
        query = {"user_id": user_id}
        if notification_type:
            query["notification_type"] = notification_type
        if unread_only:
            query["is_read"] = False
        
        # Get notifications
        notifications_cursor = db.notifications.find(
            query
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        notifications = await notifications_cursor.to_list(length=limit)
        
        # Remove MongoDB _id
        for notif in notifications:
            notif.pop("_id", None)
        
        # Get total count
        total_count = await db.notifications.count_documents(query)
        unread_count = await db.notifications.count_documents({
            "user_id": user_id,
            "is_read": False
        })
        
        return {
            "success": True,
            "notifications": notifications,
            "total": total_count,
            "unread_count": unread_count,
            "showing": len(notifications)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")

@router.get("/notifications/unread-count")
async def get_unread_count(
    authorization: Optional[str] = Header(None)
):
    """Get count of unread notifications"""
    try:
        if not authorization:
            return {"success": True, "count": 0}
        
        # Decode JWT token to get user_id
        token = authorization.replace("Bearer ", "")
        try:
            import jwt
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get("sub")
        except:
            user_id = token
        
        count = await db.notifications.count_documents({
            "user_id": user_id,
            "is_read": False
        })
        
        return {
            "success": True,
            "count": count
        }
        
    except Exception as e:
        print(f"Error getting unread count: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting unread count: {str(e)}")

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    authorization: Optional[str] = Header(None)
):
    """Mark a notification as read"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Decode JWT token to get user_id
        token = authorization.replace("Bearer ", "")
        try:
            import jwt
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get("sub")
        except:
            user_id = token  # Fallback for simple tokens
        
        # Update notification
        result = await db.notifications.update_one(
            {
                "id": notification_id,
                "user_id": user_id
            },
            {"$set": {"is_read": True}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {
            "success": True,
            "message": "Notification marked as read"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking notification as read: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error marking notification as read: {str(e)}")

@router.put("/notifications/mark-all-read")
async def mark_all_notifications_read(
    authorization: Optional[str] = Header(None)
):
    """Mark all notifications as read"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Decode JWT token to get user_id
        token = authorization.replace("Bearer ", "")
        try:
            import jwt
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get("sub")
        except:
            user_id = token  # Fallback for simple tokens
        
        # Update all unread notifications
        result = await db.notifications.update_many(
            {
                "user_id": user_id,
                "is_read": False
            },
            {"$set": {"is_read": True}}
        )
        
        return {
            "success": True,
            "message": f"Marked {result.modified_count} notifications as read",
            "count": result.modified_count
        }
        
    except Exception as e:
        print(f"Error marking all notifications as read: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error marking all notifications as read: {str(e)}")

@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    authorization: Optional[str] = Header(None)
):
    """Delete a notification"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = authorization.replace("Bearer ", "")
        
        # Delete notification
        result = await db.notifications.delete_one({
            "id": notification_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {
            "success": True,
            "message": "Notification deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting notification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting notification: {str(e)}")

@router.delete("/notifications/old")
async def delete_old_notifications(
    days: int = 30,
    authorization: Optional[str] = Header(None)
):
    """Delete notifications older than specified days"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = authorization.replace("Bearer ", "")
        
        # Calculate cutoff date
        from datetime import timedelta
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Delete old notifications
        result = await db.notifications.delete_many({
            "user_id": user_id,
            "created_at": {"$lt": cutoff_date.isoformat()}
        })
        
        return {
            "success": True,
            "message": f"Deleted {result.deleted_count} old notifications",
            "count": result.deleted_count
        }
        
    except Exception as e:
        print(f"Error deleting old notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting old notifications: {str(e)}")

# ==================== NOTIFICATION PREFERENCES ====================

@router.get("/notifications/preferences")
async def get_notification_preferences(
    authorization: Optional[str] = Header(None)
):
    """Get notification preferences for current user"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = authorization.replace("Bearer ", "")
        
        # Get preferences from database
        prefs = await db.notification_preferences.find_one({"user_id": user_id})
        
        if not prefs:
            # Return default preferences
            return {
                "success": True,
                "preferences": {
                    "push_new_follower": True,
                    "push_post_likes": True,
                    "push_comments": True,
                    "push_quiz_created": True,
                    "push_score_beaten": True,
                    "push_daily_streak": True,
                    "email_weekly_summary": True,
                    "email_daily_digest": False,
                    "quiet_hours_enabled": False,
                    "quiet_hours_start": "22:00",
                    "quiet_hours_end": "08:00"
                }
            }
        
        prefs.pop("_id", None)
        prefs.pop("user_id", None)
        
        return {
            "success": True,
            "preferences": prefs
        }
        
    except Exception as e:
        print(f"Error fetching notification preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching notification preferences: {str(e)}")

@router.put("/notifications/preferences")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    authorization: Optional[str] = Header(None)
):
    """Update notification preferences"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = authorization.replace("Bearer ", "")
        
        # Update preferences
        prefs_data = preferences.dict()
        prefs_data["user_id"] = user_id
        
        await db.notification_preferences.update_one(
            {"user_id": user_id},
            {"$set": prefs_data},
            upsert=True
        )
        
        return {
            "success": True,
            "message": "Notification preferences updated"
        }
        
    except Exception as e:
        print(f"Error updating notification preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating notification preferences: {str(e)}")

# ==================== NOTIFICATION CREATION (HELPER ENDPOINTS) ====================

@router.post("/notifications/create/like")
async def create_like_notification(
    post_id: str,
    post_owner_id: str,
    authorization: Optional[str] = Header(None)
):
    """Create notification for post like"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        liker_id = authorization.replace("Bearer ", "")
        
        # Don't notify if liking own post
        if liker_id == post_owner_id:
            return {"success": True, "message": "No notification for own like"}
        
        # Get liker info
        liker = await db.users.find_one({"id": liker_id})
        if not liker:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create notification
        await create_notification(
            user_id=post_owner_id,
            notification_type="like",
            actor_id=liker_id,
            actor_name=liker.get("name", "Unknown"),
            actor_avatar=liker.get("profile_picture"),
            content=f"{liker.get('name', 'Someone')} liked your post",
            reference_id=post_id
        )
        
        return {
            "success": True,
            "message": "Like notification created"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating like notification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating like notification: {str(e)}")

@router.post("/notifications/create/comment")
async def create_comment_notification(
    post_id: str,
    post_owner_id: str,
    comment_text: str,
    authorization: Optional[str] = Header(None)
):
    """Create notification for comment"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        commenter_id = authorization.replace("Bearer ", "")
        
        # Don't notify if commenting on own post
        if commenter_id == post_owner_id:
            return {"success": True, "message": "No notification for own comment"}
        
        # Get commenter info
        commenter = await db.users.find_one({"id": commenter_id})
        if not commenter:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Truncate comment for notification
        comment_preview = comment_text[:50] + "..." if len(comment_text) > 50 else comment_text
        
        # Create notification
        await create_notification(
            user_id=post_owner_id,
            notification_type="comment",
            actor_id=commenter_id,
            actor_name=commenter.get("name", "Unknown"),
            actor_avatar=commenter.get("profile_picture"),
            content=f"{commenter.get('name', 'Someone')} commented: {comment_preview}",
            reference_id=post_id
        )
        
        return {
            "success": True,
            "message": "Comment notification created"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating comment notification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating comment notification: {str(e)}")

@router.post("/notifications/create/score-beaten")
async def create_score_beaten_notification(
    quiz_id: str,
    beaten_user_id: str,
    quiz_title: str,
    authorization: Optional[str] = Header(None)
):
    """Create notification when someone beats user's score"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        winner_id = authorization.replace("Bearer ", "")
        
        # Get winner info
        winner = await db.users.find_one({"id": winner_id})
        if not winner:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create notification
        await create_notification(
            user_id=beaten_user_id,
            notification_type="score_beaten",
            actor_id=winner_id,
            actor_name=winner.get("name", "Unknown"),
            actor_avatar=winner.get("profile_picture"),
            content=f"{winner.get('name', 'Someone')} beat your score in {quiz_title}!",
            reference_id=quiz_id
        )
        
        return {
            "success": True,
            "message": "Score beaten notification created"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating score beaten notification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating score beaten notification: {str(e)}")
