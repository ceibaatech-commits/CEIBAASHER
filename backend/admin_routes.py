"""
Admin Routes for Ceibaa Platform
Handles admin panel operations like user management, analytics, etc.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid

router = APIRouter()

# Global db instance (will be set from server.py)
db = None

def init_db(database):
    global db
    db = database

# ==================== USER MANAGEMENT ====================

@router.get("/admin/users")
async def get_all_users():
    """
    Get all users with their details for admin panel
    Returns: List of users with id, name, email, status, registration date
    """
    try:
        # Fetch all users from database
        users = await db.users.find({}, {"_id": 0}).to_list(1000)
        
        # Enrich user data with status (for now, set all as offline - can be updated with real-time tracking)
        for user in users:
            # Check if user has recent activity (within last 15 minutes)
            user_id = user.get('id') or user.get('user_id')
            
            # For now, set status based on a simple heuristic
            # You can implement real-time presence tracking later
            user['status'] = 'offline'  # Default to offline
            
            # Ensure all required fields exist
            if not user.get('created_at'):
                user['created_at'] = datetime.now(timezone.utc).isoformat()
            
            # Normalize user_id field
            if not user.get('id') and user.get('user_id'):
                user['id'] = user['user_id']
        
        return {
            "success": True,
            "users": users,
            "count": len(users)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")

@router.get("/admin/users/search")
async def search_users(query: str, limit: int = 20):
    """
    Search users by name, email, or ID
    """
    try:
        # Build search query
        search_filter = {
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}},
                {"id": {"$regex": query, "$options": "i"}}
            ]
        }
        
        users = await db.users.find(search_filter, {"_id": 0}).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "users": users,
            "count": len(users)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching users: {str(e)}")

@router.get("/admin/users/{user_id}")
async def get_user_details(user_id: str):
    """
    Get detailed information about a specific user
    """
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        if not user:
            # Try with user_id field as fallback
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get additional stats
        posts_count = await db.social_posts.count_documents({"user_id": user_id})
        battles_count = await db.battles.count_documents({"participants": user_id}) if hasattr(db, 'battles') else 0
        
        # Get user's ceeps (following)
        following_count = await db.ceeps.count_documents({"user_id": user_id})
        followers_count = await db.ceeps.count_documents({"ceep_user_id": user_id})
        
        user['stats'] = {
            'posts_count': posts_count,
            'battles_count': battles_count,
            'following_count': following_count,
            'followers_count': followers_count
        }
        
        return {
            "success": True,
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user details: {str(e)}")

@router.get("/admin/stats/overview")
async def get_admin_overview_stats():
    """
    Get overview statistics for admin dashboard
    """
    try:
        # Count users
        total_users = await db.users.count_documents({})
        
        # Count posts
        total_posts = await db.social_posts.count_documents({})
        
        # Count battles (if collection exists)
        total_battles = 0
        try:
            total_battles = await db.battles.count_documents({})
        except:
            pass
        
        # Get recent registrations (last 7 days)
        seven_days_ago = datetime.now(timezone.utc)
        seven_days_ago = seven_days_ago.replace(day=seven_days_ago.day - 7)
        
        recent_users = await db.users.count_documents({
            "created_at": {"$gte": seven_days_ago.isoformat()}
        })
        
        return {
            "success": True,
            "stats": {
                "total_users": total_users,
                "total_posts": total_posts,
                "total_battles": total_battles,
                "recent_users": recent_users
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overview stats: {str(e)}")

@router.put("/admin/users/{user_id}/status")
async def update_user_status(user_id: str, status: str):
    """
    Update user status (ban, suspend, activate)
    """
    try:
        valid_statuses = ['active', 'banned', 'suspended']
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "account_status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": f"User status updated to {status}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user status: {str(e)}")

@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str):
    """
    Delete a user (soft delete - marks as deleted but keeps data)
    """
    try:
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "deleted": True,
                "deleted_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": "User deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")
