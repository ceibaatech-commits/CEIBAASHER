"""
User Management Routes - Teacher Status Management
Handles admin operations for managing user teacher status
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter()

# Global db instance
db = None

def init_db(database):
    global db
    db = database

# ==================== MODELS ====================

class TeacherStatusUpdate(BaseModel):
    isTeacher: bool

class OfficialStatusUpdate(BaseModel):
    isOfficial: bool

class InstituteStatusUpdate(BaseModel):
    isInstitute: bool

class ProfessorStatusUpdate(BaseModel):
    isProfessor: bool

# ==================== TEACHER STATUS MANAGEMENT ====================

@router.put("/admin/users/{user_id}/teacher-status")
async def update_teacher_status(user_id: str, status_update: TeacherStatusUpdate):
    """
    Update teacher status for a user
    Also updates all their posts and comments
    Enforces mutual exclusivity with Professor role
    """
    try:
        # Build update dict - if setting Teacher to True, set Professor to False
        user_update = {
            "isTeacher": status_update.isTeacher,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        if status_update.isTeacher:
            user_update["isProfessor"] = False
        
        # Update user's teacher status
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": user_update}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Build post/comment update dict
        post_update = {"isTeacher": status_update.isTeacher}
        if status_update.isTeacher:
            post_update["isProfessor"] = False
        
        # Update all posts by this user
        posts_result = await db.social_posts.update_many(
            {"user_id": user_id},
            {"$set": post_update}
        )
        
        # Update all comments by this user
        comments_result = await db.comments.update_many(
            {"user_id": user_id},
            {"$set": post_update}
        )
        
        return {
            "success": True,
            "message": f"Teacher status updated to {status_update.isTeacher}",
            "user_id": user_id,
            "isTeacher": status_update.isTeacher,
            "posts_updated": posts_result.modified_count,
            "comments_updated": comments_result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating teacher status: {str(e)}")

@router.get("/admin/users/{user_id}/teacher-status")
async def get_teacher_status(user_id: str):
    """
    Get teacher status for a user
    """
    try:
        user = await db.users.find_one(
            {"id": user_id},
            {"_id": 0, "id": 1, "name": 1, "isTeacher": 1}
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "user_id": user.get("id"),
            "name": user.get("name"),
            "isTeacher": user.get("isTeacher", False)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teacher status: {str(e)}")

@router.put("/admin/users/{user_id}/official-status")
async def update_official_status(user_id: str, status_update: OfficialStatusUpdate):
    """
    Update official status for a user (NGOs, Government offices)
    Also updates all their posts and comments
    """
    try:
        result = await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "isOfficial": status_update.isOfficial,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update all posts by this user
        posts_result = await db.social_posts.update_many(
            {"user_id": user_id},
            {"$set": {"isOfficial": status_update.isOfficial}}
        )
        
        # Update all comments by this user
        comments_result = await db.comments.update_many(
            {"user_id": user_id},
            {"$set": {"isOfficial": status_update.isOfficial}}
        )
        
        return {
            "success": True,
            "message": f"Official status updated to {status_update.isOfficial}",
            "user_id": user_id,
            "isOfficial": status_update.isOfficial,
            "posts_updated": posts_result.modified_count,
            "comments_updated": comments_result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating official status: {str(e)}")

@router.put("/admin/users/{user_id}/institute-status")
async def update_institute_status(user_id: str, status_update: InstituteStatusUpdate):
    """
    Update institute status for a user (Educational institutions, Organizations)
    Also updates all their posts and comments
    """
    try:
        result = await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "isInstitute": status_update.isInstitute,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update all posts by this user
        posts_result = await db.social_posts.update_many(
            {"user_id": user_id},
            {"$set": {"isInstitute": status_update.isInstitute}}
        )
        
        # Update all comments by this user
        comments_result = await db.comments.update_many(
            {"user_id": user_id},
            {"$set": {"isInstitute": status_update.isInstitute}}
        )
        
        return {
            "success": True,
            "message": f"Institute status updated to {status_update.isInstitute}",
            "user_id": user_id,
            "isInstitute": status_update.isInstitute,
            "posts_updated": posts_result.modified_count,
            "comments_updated": comments_result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating institute status: {str(e)}")

@router.put("/admin/users/{user_id}/professor-status")
async def update_professor_status(user_id: str, status_update: ProfessorStatusUpdate):
    """
    Update professor status for a user (Professors)
    Also updates all their posts and comments
    Enforces mutual exclusivity with Teacher role
    """
    try:
        # Build update dict - if setting Professor to True, set Teacher to False
        user_update = {
            "isProfessor": status_update.isProfessor,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        if status_update.isProfessor:
            user_update["isTeacher"] = False
        
        # Update user
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": user_update}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Build post/comment update dict
        post_update = {"isProfessor": status_update.isProfessor}
        if status_update.isProfessor:
            post_update["isTeacher"] = False
        
        # Update all posts by this user
        posts_result = await db.social_posts.update_many(
            {"user_id": user_id},
            {"$set": post_update}
        )
        
        # Update all comments by this user
        comments_result = await db.comments.update_many(
            {"user_id": user_id},
            {"$set": post_update}
        )
        
        return {
            "success": True,
            "message": f"Professor status updated to {status_update.isProfessor}",
            "user_id": user_id,
            "isProfessor": status_update.isProfessor,
            "posts_updated": posts_result.modified_count,
            "comments_updated": comments_result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating professor status: {str(e)}")


@router.post("/admin/fix-badge-data-integrity")
async def fix_badge_data_integrity():
    """
    Fix data integrity issues where posts/comments are missing badge fields
    or have mismatched badge values compared to their user
    """
    try:
        fixed_users = []
        
        # Get all users with badges
        users_with_badges = await db.users.find(
            {
                "$or": [
                    {"isTeacher": True},
                    {"isProfessor": True},
                    {"isOfficial": True},
                    {"isInstitute": True}
                ]
            },
            {"_id": 0, "id": 1, "name": 1, "isTeacher": 1, "isProfessor": 1, "isOfficial": 1, "isInstitute": 1}
        ).to_list(1000)
        
        for user in users_with_badges:
            user_id = user["id"]
            user_name = user.get("name", user_id)
            
            # Build the update for this user's posts/comments
            update_fields = {
                "isTeacher": user.get("isTeacher", False),
                "isProfessor": user.get("isProfessor", False),
                "isOfficial": user.get("isOfficial", False),
                "isInstitute": user.get("isInstitute", False)
            }
            
            # Update posts that either:
            # 1. Don't have the badge fields at all (missing)
            # 2. Have incorrect values
            posts_result = await db.social_posts.update_many(
                {"user_id": user_id},
                {"$set": update_fields}
            )
            
            comments_result = await db.comments.update_many(
                {"user_id": user_id},
                {"$set": update_fields}
            )
            
            if posts_result.modified_count > 0 or comments_result.modified_count > 0:
                fixed_users.append({
                    "user_id": user_id,
                    "user_name": user_name,
                    "posts_fixed": posts_result.modified_count,
                    "comments_fixed": comments_result.modified_count
                })
        
        return {
            "success": True,
            "message": "Badge data integrity check complete",
            "users_fixed": len(fixed_users),
            "details": fixed_users
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fixing badge data integrity: {str(e)}")
