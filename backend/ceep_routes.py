"""
Ceep System Routes - One-way following system
Similar to Twitter follow/unfollow
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Will be set by server.py
db = None

def init_db(database):
    global db
    db = database


class CeepRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    ceep_user_id: str = Field(..., min_length=1)
    user_name: Optional[str] = None
    ceep_user_name: Optional[str] = None


class UnceepRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    ceep_user_id: str = Field(..., min_length=1)


@router.post("/ceep")
async def ceep_user(request: CeepRequest):
    """
    One-way Ceep - User A ceeps User B
    Similar to Twitter follow
    """
    try:
        # Check if already ceeped
        existing = await db.ceeps.find_one({
            "user_id": request.user_id,
            "ceep_user_id": request.ceep_user_id
        })
        
        if existing:
            return {
                "success": False,
                "message": "Already ceeped this user"
            }
        
        # Create ceep relationship
        ceep_doc = {
            "ceep_id": str(uuid.uuid4()),
            "user_id": request.user_id,
            "user_name": request.user_name,
            "ceep_user_id": request.ceep_user_id,
            "ceep_user_name": request.ceep_user_name,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.ceeps.insert_one(ceep_doc)
        
        # Update ceep counts
        # Increment ceeping_count for user
        await db.users.update_one(
            {"user_id": request.user_id},
            {"$inc": {"ceeping_count": 1}},
            upsert=True
        )
        
        # Increment ceepers_count for ceeped user
        await db.users.update_one(
            {"user_id": request.ceep_user_id},
            {"$inc": {"ceepers_count": 1}},
            upsert=True
        )
        
        return {
            "success": True,
            "message": f"You are now ceeping {request.ceep_user_name}!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ceeping user: {str(e)}")


@router.post("/unceep")
async def unceep_user(request: UnceepRequest):
    """
    Remove ceep relationship
    """
    try:
        result = await db.ceeps.delete_one({
            "user_id": request.user_id,
            "ceep_user_id": request.ceep_user_id
        })
        
        if result.deleted_count == 0:
            return {
                "success": False,
                "message": "Not ceeped"
            }
        
        # Update ceep counts
        await db.users.update_one(
            {"user_id": request.user_id},
            {"$inc": {"ceeping_count": -1}}
        )
        
        await db.users.update_one(
            {"user_id": request.ceep_user_id},
            {"$inc": {"ceepers_count": -1}}
        )
        
        return {
            "success": True,
            "message": "Unceeped successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unceeping user: {str(e)}")


@router.get("/ceeps/{user_id}")
async def get_ceeps(user_id: str):
    """
    Get all users that a user is ceeping (following)
    """
    ceeps = await db.ceeps.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    return {
        "success": True,
        "ceeps": ceeps,
        "count": len(ceeps)
    }

@router.get("/is-following/{user_id}/{target_user_id}")
async def check_is_following(user_id: str, target_user_id: str):
    """
    Check if user_id is following target_user_id
    """
    existing = await db.ceeps.find_one({
        "user_id": user_id,
        "ceep_user_id": target_user_id
    })
    return {
        "is_following": existing is not None
    }


@router.get("/ceepers/{user_id}")
async def get_user_ceepers(user_id: str):
    """
    Get list of users who are ceeping this user
    """
    try:
        ceepers = await db.ceeps.find({"ceep_user_id": user_id}, {"_id": 0}).to_list(length=None)
        return {
            "success": True,
            "ceepers": ceepers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ceepers: {str(e)}")


@router.get("/check-ceep/{user_id}/{ceep_user_id}")
async def check_if_ceeped(user_id: str, ceep_user_id: str):
    """
    Check if user A is ceeping user B
    """
    try:
        ceep = await db.ceeps.find_one({
            "user_id": user_id,
            "ceep_user_id": ceep_user_id
        })
        
        return {
            "success": True,
            "is_ceeped": ceep is not None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking ceep: {str(e)}")


@router.get("/ceep-stats/{user_id}")
async def get_ceep_stats(user_id: str):
    """
    Get ceep statistics for a user
    """
    try:
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        return {
            "success": True,
            "stats": {
                "ceeping_count": user.get("ceeping_count", 0) if user else 0,
                "ceepers_count": user.get("ceepers_count", 0) if user else 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ceep stats: {str(e)}")
