"""
X (Twitter) OAuth 2.0 Authentication Routes
"""
from fastapi import APIRouter, Request, HTTPException, Response
from fastapi.responses import RedirectResponse
import os
import httpx
import secrets
import jwt
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

# Environment variables
X_CLIENT_ID = os.environ.get('X_CLIENT_ID')
X_CLIENT_SECRET = os.environ.get('X_CLIENT_SECRET')
X_CALLBACK_URL = os.environ.get('X_CALLBACK_URL')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://post-animation-test.preview.emergentagent.com')
JWT_SECRET = os.environ.get('JWT_SECRET')
MONGO_URL = os.environ.get('MONGO_URL')

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client['test_database']

# OAuth 2.0 endpoints
X_AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize"
X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token"
X_USER_URL = "https://api.twitter.com/2/users/me"

# Temporary storage for state (in production, use Redis)
oauth_states = {}


@router.get("/login/x")
async def login_x():
    """Initiate X OAuth 2.0 flow"""
    try:
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        oauth_states[state] = True
        
        # Generate code verifier and challenge for PKCE
        code_verifier = secrets.token_urlsafe(32)
        oauth_states[f"verifier_{state}"] = code_verifier
        
        # Build authorization URL
        params = {
            "response_type": "code",
            "client_id": X_CLIENT_ID,
            "redirect_uri": X_CALLBACK_URL,
            "scope": "tweet.read users.read offline.access",
            "state": state,
            "code_challenge": code_verifier,
            "code_challenge_method": "plain"
        }
        
        auth_url = f"{X_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
        
        return RedirectResponse(url=auth_url)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate X login: {str(e)}")


@router.get("/auth/x/callback")
async def x_callback(code: str = None, state: str = None, error: str = None):
    """Handle X OAuth callback"""
    try:
        # Check for errors
        if error:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error={error}")
        
        if not code or not state:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=missing_parameters")
        
        # Verify state
        if state not in oauth_states:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=invalid_state")
        
        code_verifier = oauth_states.get(f"verifier_{state}")
        
        # Clean up state
        oauth_states.pop(state, None)
        oauth_states.pop(f"verifier_{state}", None)
        
        # Exchange code for access token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                X_TOKEN_URL,
                data={
                    "code": code,
                    "grant_type": "authorization_code",
                    "client_id": X_CLIENT_ID,
                    "redirect_uri": X_CALLBACK_URL,
                    "code_verifier": code_verifier
                },
                auth=(X_CLIENT_ID, X_CLIENT_SECRET),
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if token_response.status_code != 200:
                error_detail = token_response.text
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=token_exchange_failed")
            
            token_data = token_response.json()
            access_token = token_data.get('access_token')
            
            # Get user info
            user_response = await client.get(
                X_USER_URL,
                params={"user.fields": "id,name,username,profile_image_url"},
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if user_response.status_code != 200:
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=user_fetch_failed")
            
            user_data = user_response.json().get('data', {})
            
            # Check if user exists
            existing_user = await db.users.find_one({"x_id": user_data.get('id')}, {"_id": 0})
            
            if existing_user:
                # Update existing user
                await db.users.update_one(
                    {"x_id": user_data.get('id')},
                    {"$set": {
                        "name": user_data.get('name'),
                        "username": user_data.get('username'),
                        "profile_image": user_data.get('profile_image_url'),
                        "last_login": datetime.now().isoformat()
                    }}
                )
                user = existing_user
            else:
                # Create new user
                new_user = {
                    "x_id": user_data.get('id'),
                    "name": user_data.get('name'),
                    "username": user_data.get('username'),
                    "email": f"{user_data.get('username')}@x.placeholder.com",  # X doesn't provide email
                    "profile_image": user_data.get('profile_image_url'),
                    "auth_provider": "x",
                    "created_at": datetime.now().isoformat(),
                    "last_login": datetime.now().isoformat()
                }
                
                await db.users.insert_one(new_user)
                new_user.pop('_id', None)
                user = new_user
            
            # Generate JWT token
            token_payload = {
                "user_id": user.get('x_id'),
                "email": user.get('email'),
                "name": user.get('name'),
                "exp": datetime.utcnow() + timedelta(days=7)
            }
            
            jwt_token = jwt.encode(token_payload, JWT_SECRET, algorithm="HS256")
            
            # Redirect to frontend with token
            return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={jwt_token}")
            
    except Exception as e:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error={str(e)}")
