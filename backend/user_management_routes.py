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
    """
    try:
        # Update user's teacher status
        result = await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "isTeacher": status_update.isTeacher,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update all posts by this user
        posts_result = await db.social_posts.update_many(
            {"user_id": user_id},
            {"$set": {"isTeacher": status_update.isTeacher}}
        )
        
        # Update all comments by this user
        comments_result = await db.comments.update_many(
            {"user_id": user_id},
            {"$set": {"isTeacher": status_update.isTeacher}}
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
        
        return {
            "success": True,
            "message": f"Official status updated to {status_update.isOfficial}",
            "user_id": user_id,
            "isOfficial": status_update.isOfficial
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating official status: {str(e)}")

@router.put("/admin/users/{user_id}/institute-status")
async def update_institute_status(user_id: str, status_update: InstituteStatusUpdate):
    """
    Update institute status for a user (Educational institutions, Organizations)
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
        
        return {
            "success": True,
            "message": f"Institute status updated to {status_update.isInstitute}",
            "user_id": user_id,
            "isInstitute": status_update.isInstitute
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
    """
    try:
        # Update user
        result = await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "isProfessor": status_update.isProfessor,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update all posts by this user
        posts_result = await db.social_posts.update_many(
            {"user_id": user_id},
            {"$set": {"isProfessor": status_update.isProfessor}}
        )
        
        # Update all comments by this user
        comments_result = await db.comments.update_many(
            {"user_id": user_id},
            {"$set": {"isProfessor": status_update.isProfessor}}
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
