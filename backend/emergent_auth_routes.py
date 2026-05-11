"""
Emergent-managed Google Auth Routes
Provides hassle-free social authentication via Google OAuth
"""
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from jose import jwt as jose_jwt
import os
import httpx
import uuid

router = APIRouter()

# Environment variables
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Constants
EMERGENT_AUTH_ENDPOINT = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_EXPIRY_DAYS = 7


class SessionRequest(BaseModel):
    session_id: str


@router.post("/auth/emergent/session")
async def process_emergent_session(session_request: SessionRequest, response: Response):
    """
    Process Emergent auth session_id and create user session
    Called from frontend after OAuth redirect
    """
    try:
        session_id = session_request.session_id
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")
        
        # Call Emergent auth endpoint to exchange session_id for user data
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                EMERGENT_AUTH_ENDPOINT,
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(
                    status_code=auth_response.status_code,
                    detail="Failed to authenticate with Emergent"
                )
            
            user_data = auth_response.json()
        
        # Extract user information
        email = user_data.get("email")
        name = user_data.get("name")
        picture = user_data.get("picture")
        session_token = user_data.get("session_token")
        
        if not email or not session_token:
            raise HTTPException(status_code=400, detail="Invalid session data")
        
        # Check if user exists
        existing_user = await db.users.find_one(
            {"email": email},
            {"_id": 0}
        )
        
        if existing_user:
            # Update existing user
            user_id = existing_user.get("id") or existing_user.get("user_id")
            await db.users.update_one(
                {"email": email},
                {
                    "$set": {
                        "name": name,
                        "profile_picture": picture,
                        "last_login": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        else:
            # Create new user with custom user_id
            user_id = str(uuid.uuid4())
            username = email.split('@')[0].lower()
            
            # Ensure unique username
            existing_username = await db.users.find_one({"username": username})
            if existing_username:
                username = f"{username}{str(uuid.uuid4())[:8]}"
            
            new_user = {
                "id": user_id,
                "user_id": user_id,  # For backward compatibility
                "email": email,
                "name": name,
                "username": username,
                "profile_picture": picture,
                "provider": "emergent_google",
                "provider_id": email,
                "bio": "",
                "location": "",
                "exam_focus": [],
                "is_private": False,
                "streak_days": 0,
                "badges": [],
                "posts_count": 0,
                "followers_count": 0,
                "following_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_login": datetime.now(timezone.utc).isoformat(),
                "joined_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(new_user.copy())
        
        # Store session in database
        expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRY_DAYS)
        
        session_doc = {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        }
        
        # Upsert session (replace if exists)
        await db.user_sessions.update_one(
            {"user_id": user_id},
            {"$set": session_doc},
            upsert=True
        )
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=SESSION_EXPIRY_DAYS * 24 * 60 * 60
        )
        
        # Get complete user data
        user = await db.users.find_one(
            {"id": user_id},
            {"_id": 0, "provider_id": 0}
        )

        # Generate a JWT so every other route can authenticate this user
        jwt_token = jose_jwt.encode(
            {"sub": user_id, "email": email, "role": "user",
             "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)},
            JWT_SECRET, algorithm=JWT_ALGORITHM
        )
        
        return {
            "success": True,
            "user": user,
            "session_token": session_token,
            "access_token": jwt_token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing Emergent session: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to process session")


# NOTE: GET /auth/me and POST /auth/logout are defined in auth_routes.py.
# They handle both Emergent session-token users and JWT (email/password) users
# in a single unified handler.  Do not re-define those routes here.