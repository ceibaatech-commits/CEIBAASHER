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

# ==================== TEACHER STATUS MANAGEMENT ====================

@router.put("/admin/users/{user_id}/teacher-status")
async def update_teacher_status(user_id: str, status_update: TeacherStatusUpdate):
    """
    Update teacher status for a user
    Admin endpoint to toggle isTeacher flag
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
        
        return {
            "success": True,
            "message": f"Teacher status updated to {status_update.isTeacher}",
            "user_id": user_id,
            "isTeacher": status_update.isTeacher
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
