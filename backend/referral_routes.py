"""
Ceibaa Referral System Routes
- Generate unique referral codes for users
- Track referrals on signup
- Award coins (1 coin per successful referral)
- Leaderboard for top referrers
"""
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid
import secrets
import string
from jose import jwt, JWTError
import os

JWT_SECRET = os.getenv("JWT_SECRET", "ceibaa-super-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

router = APIRouter()
db = None

def init_db(database):
    global db
    db = database

def _decode_token(authorization: str) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def _get_user_id(authorization: Optional[str], request: Request) -> str:
    """Support both session and JWT auth"""
    if request and hasattr(request, 'cookies'):
        session_token = request.cookies.get("session_token")
        if session_token:
            session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
            if session:
                return session["user_id"]
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if session:
            return session["user_id"]
        return _decode_token(authorization)
    raise HTTPException(status_code=401, detail="Not authenticated")

def generate_referral_code() -> str:
    """Generate a short, unique, human-readable referral code"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(8))

async def ensure_referral_code(user_id: str) -> str:
    """Get or create a referral code for a user"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "referral_code": 1})
    if user and user.get("referral_code"):
        return user["referral_code"]
    
    # Generate unique code
    for _ in range(10):
        code = generate_referral_code()
        existing = await db.users.find_one({"referral_code": code})
        if not existing:
            await db.users.update_one({"id": user_id}, {"$set": {"referral_code": code}})
            return code
    raise HTTPException(status_code=500, detail="Could not generate unique referral code")


@router.get("/referral/my-code")
async def get_my_referral_code(request: Request, authorization: Optional[str] = Header(None)):
    """Get or generate the current user's referral code and stats"""
    user_id = await _get_user_id(authorization, request)
    code = await ensure_referral_code(user_id)
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "referral_coins": 1, "username": 1, "name": 1})
    
    total_referrals = await db.referrals.count_documents({"referrer_id": user_id, "status": "completed"})
    pending_referrals = await db.referrals.count_documents({"referrer_id": user_id, "status": "pending"})
    
    return {
        "success": True,
        "referral_code": code,
        "referral_coins": user.get("referral_coins", 0),
        "total_referrals": total_referrals,
        "pending_referrals": pending_referrals,
        "username": user.get("username", ""),
        "name": user.get("name", "")
    }


@router.get("/referral/leaderboard")
async def get_referral_leaderboard(limit: int = 20):
    """Get top referrers leaderboard sorted by coins"""
    users = await db.users.find(
        {"referral_coins": {"$gt": 0}},
        {"_id": 0, "id": 1, "name": 1, "username": 1, "profile_picture": 1, "referral_coins": 1, "isTeacher": 1, "isProfessor": 1, "isOfficial": 1, "isInstitute": 1}
    ).sort("referral_coins", -1).limit(limit).to_list(limit)
    
    return {"success": True, "leaderboard": users}


@router.get("/referral/validate/{code}")
async def validate_referral_code(code: str):
    """Validate a referral code and return referrer info"""
    user = await db.users.find_one(
        {"referral_code": code.upper()},
        {"_id": 0, "id": 1, "name": 1, "username": 1, "profile_picture": 1}
    )
    if not user:
        return {"success": False, "message": "Invalid referral code"}
    return {"success": True, "referrer": user}


async def process_referral(referral_code: str, new_user_id: str, new_user_email: str):
    """
    Called during signup when a referral code is provided.
    Awards 1 coin to the referrer.
    """
    if not referral_code:
        return
    
    code = referral_code.strip().upper()
    referrer = await db.users.find_one({"referral_code": code}, {"_id": 0, "id": 1, "name": 1})
    if not referrer:
        return
    
    # Prevent self-referral
    if referrer["id"] == new_user_id:
        return
    
    # Prevent duplicate referral (same email or user already referred)
    existing = await db.referrals.find_one({
        "$or": [
            {"referred_user_id": new_user_id},
            {"referred_email": new_user_email}
        ]
    })
    if existing:
        return
    
    # Create referral record
    referral_doc = {
        "id": str(uuid.uuid4()),
        "referrer_id": referrer["id"],
        "referred_user_id": new_user_id,
        "referred_email": new_user_email,
        "referral_code": code,
        "status": "completed",
        "coins_awarded": 1,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.referrals.insert_one(referral_doc)
    
    # Award 1 coin to referrer
    await db.users.update_one(
        {"id": referrer["id"]},
        {"$inc": {"referral_coins": 1}}
    )
    
    # Create notification for referrer
    notification_doc = {
        "id": str(uuid.uuid4()),
        "user_id": referrer["id"],
        "notification_type": "referral_bonus",
        "content": f"You earned 1 coin! A new user signed up with your referral link.",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification_doc)
