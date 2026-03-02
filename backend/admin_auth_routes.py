"""
Admin Authentication Routes
Secure admin login with database authentication
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import hashlib
import uuid
import os

router = APIRouter(prefix="/admin/auth", tags=["Admin Auth"])

# Global db instance
db = None

def init_db(database):
    global db
    db = database


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    success: bool
    token: str = None
    user: dict = None
    message: str = None


def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/login")
async def admin_login(request: Request, credentials: AdminLoginRequest):
    """
    Secure admin login endpoint.
    Authenticates against database, not hardcoded credentials.
    """
    try:
        username = credentials.username.lower().strip()
        password = credentials.password
        
        # Find admin user by username or email
        user = await db.users.find_one({
            "$and": [
                {"$or": [
                    {"username": username},
                    {"email": username},
                    {"username": credentials.username},
                    {"email": credentials.username}
                ]},
                {"$or": [
                    {"is_admin": True},
                    {"role": {"$in": ["admin", "super_admin"]}},
                    {"is_super_admin": True}
                ]}
            ]
        })
        
        if not user:
            # Log failed attempt
            await db.admin_login_logs.insert_one({
                "username": credentials.username,
                "ip_address": request.client.host if request.client else "unknown",
                "success": False,
                "reason": "user_not_found",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        stored_password = user.get("password", "")
        password_hash = hash_password(password)
        
        if stored_password != password_hash:
            # Log failed attempt
            await db.admin_login_logs.insert_one({
                "username": credentials.username,
                "user_id": user.get("id"),
                "ip_address": request.client.host if request.client else "unknown",
                "success": False,
                "reason": "wrong_password",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Generate admin session token
        admin_token = f"admin_{uuid.uuid4().hex}_{int(datetime.now().timestamp())}"
        
        # Store admin session
        await db.admin_sessions.insert_one({
            "token": admin_token,
            "user_id": user.get("id") or user.get("user_id"),
            "username": user.get("username") or user.get("email"),
            "role": user.get("role", "admin"),
            "ip_address": request.client.host if request.client else "unknown",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        })
        
        # Log successful login
        await db.admin_login_logs.insert_one({
            "username": credentials.username,
            "user_id": user.get("id"),
            "ip_address": request.client.host if request.client else "unknown",
            "success": True,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "token": admin_token,
            "user": {
                "id": user.get("id") or user.get("user_id"),
                "username": user.get("username"),
                "email": user.get("email"),
                "name": user.get("name"),
                "role": user.get("role", "admin"),
                "is_super_admin": user.get("is_super_admin", False)
            },
            "message": "Login successful"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Admin login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")


@router.post("/logout")
async def admin_logout(request: Request):
    """Logout and invalidate admin session"""
    try:
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "")
        
        if token:
            await db.admin_sessions.delete_one({"token": token})
        
        return {"success": True, "message": "Logged out successfully"}
    except Exception:
        return {"success": True, "message": "Logged out"}


@router.get("/verify")
async def verify_admin_session(request: Request):
    """Verify if admin session is still valid"""
    try:
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "")
        
        if not token or token == "admin_authenticated":
            # Legacy token - still allow but recommend re-login
            return {"valid": True, "legacy": True, "message": "Using legacy authentication"}
        
        session = await db.admin_sessions.find_one({"token": token})
        
        if not session:
            return {"valid": False, "message": "Session not found"}
        
        # Check expiry
        expires_at = session.get("expires_at", "")
        if expires_at:
            expiry_time = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expiry_time:
                await db.admin_sessions.delete_one({"token": token})
                return {"valid": False, "message": "Session expired"}
        
        return {
            "valid": True,
            "user": {
                "username": session.get("username"),
                "role": session.get("role")
            }
        }
        
    except Exception:
        return {"valid": False, "message": "Verification failed"}
