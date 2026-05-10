"""
Parents Mode Routes
Allows parents to temporarily disable 1v1 Battle Mode for their children.
The mode auto-disables after 12 hours.
"""
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
import os

router = APIRouter(prefix="/user/parents-mode", tags=["Parents Mode"])

# Global db instance
db = None

def init_db(database):
    global db
    db = database

JWT_SECRET = os.getenv("JWT_SECRET", "ceibaa-super-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

PARENTS_MODE_DURATION_HOURS = 12


def _extract_token(request: Optional[Request], authorization: Optional[str]) -> Optional[str]:
    """Cookie-first, Bearer-fallback (matches utils.auth_helpers pattern)."""
    if request is not None:
        cookie_token = request.cookies.get("session_token")
        if cookie_token:
            return cookie_token
    if authorization and authorization.startswith("Bearer "):
        return authorization[len("Bearer "):]
    return None


async def get_user_from_token(authorization: Optional[str], request: Optional[Request] = None) -> dict:
    """Get user from authorization (cookie-first, Bearer-fallback)"""
    token = _extract_token(request, authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        # Try session token first
        session = await db.user_sessions.find_one({"session_token": token})
        user_id = session.get("user_id") if session else None
        
        # Try JWT decode
        if not user_id:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({
            "$or": [{"id": user_id}, {"user_id": user_id}, {"email": user_id}]
        })
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def is_parents_mode_active(user: dict) -> tuple:
    """
    Check if parents mode is currently active.
    Returns (is_active, time_remaining_seconds, expires_at)
    """
    if not user.get("parents_mode_enabled"):
        return False, 0, None
    
    enabled_at_str = user.get("parents_mode_enabled_at")
    if not enabled_at_str:
        return False, 0, None
    
    # Parse the enabled_at timestamp
    if isinstance(enabled_at_str, str):
        enabled_at = datetime.fromisoformat(enabled_at_str.replace('Z', '+00:00'))
    else:
        enabled_at = enabled_at_str
    
    # Calculate expiry time (12 hours after enabled)
    expires_at = enabled_at + timedelta(hours=PARENTS_MODE_DURATION_HOURS)
    now = datetime.now(timezone.utc)
    
    if now >= expires_at:
        # Mode has expired
        return False, 0, None
    
    # Mode is still active
    time_remaining = (expires_at - now).total_seconds()
    return True, int(time_remaining), expires_at.isoformat()


@router.get("/status")
async def get_parents_mode_status(request: Request, authorization: Optional[str] = Header(None)):
    """
    Get current parents mode status for the user.
    Returns whether it's active and time remaining.
    """
    user = await get_user_from_token(authorization, request)
    
    is_active, time_remaining, expires_at = is_parents_mode_active(user)
    
    # If expired, auto-disable in database
    if user.get("parents_mode_enabled") and not is_active:
        user_id = user.get("id") or user.get("user_id")
        await db.users.update_one(
            {"$or": [{"id": user_id}, {"user_id": user_id}]},
            {
                "$set": {
                    "parents_mode_enabled": False,
                    "parents_mode_disabled_at": datetime.now(timezone.utc).isoformat(),
                    "parents_mode_disabled_reason": "auto_expired"
                }
            }
        )
    
    return {
        "success": True,
        "parents_mode_active": is_active,
        "time_remaining_seconds": time_remaining,
        "expires_at": expires_at,
        "duration_hours": PARENTS_MODE_DURATION_HOURS,
        "battle_mode_blocked": is_active
    }


@router.post("/enable")
async def enable_parents_mode(request: Request, authorization: Optional[str] = Header(None)):
    """
    Enable parents mode. This will:
    - Block access to 1v1 Battle Mode
    - Auto-disable after 12 hours
    - Cannot be manually disabled by the user
    """
    user = await get_user_from_token(authorization, request)
    user_id = user.get("id") or user.get("user_id")
    
    # Check if already active
    is_active, time_remaining, expires_at = is_parents_mode_active(user)
    if is_active:
        return {
            "success": True,
            "message": "Parents mode is already active",
            "already_active": True,
            "time_remaining_seconds": time_remaining,
            "expires_at": expires_at
        }
    
    # Enable parents mode
    now = datetime.now(timezone.utc)
    new_expires_at = now + timedelta(hours=PARENTS_MODE_DURATION_HOURS)
    
    await db.users.update_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}]},
        {
            "$set": {
                "parents_mode_enabled": True,
                "parents_mode_enabled_at": now.isoformat(),
                "parents_mode_expires_at": new_expires_at.isoformat()
            },
            "$inc": {
                "parents_mode_enable_count": 1
            }
        }
    )
    
    # Log the action
    await db.parents_mode_logs.insert_one({
        "user_id": user_id,
        "action": "enabled",
        "enabled_at": now.isoformat(),
        "expires_at": new_expires_at.isoformat(),
        "duration_hours": PARENTS_MODE_DURATION_HOURS
    })
    
    return {
        "success": True,
        "message": f"Parents mode enabled. 1v1 Battle Mode will be blocked for {PARENTS_MODE_DURATION_HOURS} hours.",
        "parents_mode_active": True,
        "time_remaining_seconds": PARENTS_MODE_DURATION_HOURS * 3600,
        "expires_at": new_expires_at.isoformat(),
        "battle_mode_blocked": True
    }


@router.get("/check-battle-access")
async def check_battle_access(request: Request, authorization: Optional[str] = Header(None)):
    """
    Quick check if user can access 1v1 Battle Mode.
    Used by frontend before allowing navigation to battle pages.
    """
    user = await get_user_from_token(authorization, request)
    
    is_active, time_remaining, expires_at = is_parents_mode_active(user)
    
    if is_active:
        # Format remaining time
        hours = time_remaining // 3600
        minutes = (time_remaining % 3600) // 60
        time_str = f"{hours}h {minutes}m"
        
        return {
            "success": True,
            "can_access_battle": False,
            "reason": "parents_mode_active",
            "message": f"Battle Mode is disabled by Parents Mode. It will be available again in {time_str}.",
            "time_remaining_seconds": time_remaining,
            "expires_at": expires_at
        }
    
    return {
        "success": True,
        "can_access_battle": True,
        "reason": None,
        "message": None
    }
