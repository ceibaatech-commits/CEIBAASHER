import os
import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from jose import jwt, JWTError
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

router = APIRouter()

# Environment variables
JWT_SECRET = os.getenv("JWT_SECRET", "ceibaa-super-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# OAuth configuration
oauth = OAuth()

def init_oauth():
    """Initialize OAuth clients lazily"""
    if not hasattr(oauth, '_initialized'):
        # Twitter OAuth 1.0a
        oauth.register(
            name='twitter',
            client_id=os.getenv('TWITTER_API_KEY'),
            client_secret=os.getenv('TWITTER_API_SECRET'),
            request_token_url='https://api.twitter.com/oauth/request_token',
            access_token_url='https://api.twitter.com/oauth/access_token',
            authorize_url='https://api.twitter.com/oauth/authenticate',
            api_base_url='https://api.twitter.com/1.1/',
        )

        # Facebook OAuth 2.0
        oauth.register(
            name='facebook',
            client_id=os.getenv('FACEBOOK_APP_ID'),
            client_secret=os.getenv('FACEBOOK_APP_SECRET'),
            authorize_url='https://www.facebook.com/v12.0/dialog/oauth',
            access_token_url='https://graph.facebook.com/v12.0/oauth/access_token',
            api_base_url='https://graph.facebook.com/v12.0/',
            client_kwargs={'scope': 'email public_profile'},
        )
        
        oauth._initialized = True

# Pydantic models
class User(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    profile_picture: Optional[str] = None
    provider: str
    provider_id: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class DemoLoginRequest(BaseModel):
    username: str
    password: str

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_or_create_user(provider: str, provider_id: str, name: str, email: Optional[str], profile_picture: Optional[str]):
    # Check if user exists
    user = await db.users.find_one({"provider": provider, "provider_id": provider_id})
    
    if user:
        # Update last login
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow().isoformat()}}
        )
        return user
    
    # Create new user
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "name": name,
        "email": email,
        "profile_picture": profile_picture,
        "provider": provider,
        "provider_id": provider_id,
        "created_at": datetime.utcnow().isoformat(),
        "last_login": datetime.utcnow().isoformat()
    }
    
    await db.users.insert_one(new_user)
    return new_user

# Routes

@router.get("/auth/twitter")
async def twitter_login(request: Request):
    init_oauth()
    redirect_uri = os.getenv('TWITTER_CALLBACK_URL')
    return await oauth.twitter.authorize_redirect(request, redirect_uri)

@router.get("/auth/twitter/callback")
async def twitter_callback(request: Request):
    try:
        token = await oauth.twitter.authorize_access_token(request)
        
        # Get user info
        resp = await oauth.twitter.get('account/verify_credentials.json', params={'include_email': 'true'})
        user_data = resp.json()
        
        # Extract user info
        provider_id = str(user_data['id'])
        name = user_data['name']
        email = user_data.get('email')
        profile_picture = user_data.get('profile_image_url_https', '').replace('_normal', '_400x400')
        
        # Get or create user
        user = await get_or_create_user('twitter', provider_id, name, email, profile_picture)
        
        # Create JWT token
        access_token = create_access_token({"sub": user["id"], "provider": "twitter"})
        
        # Redirect to frontend with token
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={access_token}")
        
    except Exception as e:
        print(f"Twitter auth error: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/error?message=Twitter login failed")

@router.get("/auth/facebook")
async def facebook_login(request: Request):
    init_oauth()
    redirect_uri = os.getenv('FACEBOOK_CALLBACK_URL')
    return await oauth.facebook.authorize_redirect(request, redirect_uri)

@router.get("/auth/facebook/callback")
async def facebook_callback(request: Request):
    try:
        token = await oauth.facebook.authorize_access_token(request)
        
        # Get user info
        resp = await oauth.facebook.get('me?fields=id,name,email,picture.type(large)')
        user_data = resp.json()
        
        # Extract user info
        provider_id = user_data['id']
        name = user_data['name']
        email = user_data.get('email')
        profile_picture = user_data.get('picture', {}).get('data', {}).get('url')
        
        # Get or create user
        user = await get_or_create_user('facebook', provider_id, name, email, profile_picture)
        
        # Create JWT token
        access_token = create_access_token({"sub": user["id"], "provider": "facebook"})
        
        # Redirect to frontend with token
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={access_token}")
        
    except Exception as e:
        print(f"Facebook auth error: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/error?message=Facebook login failed")

@router.get("/auth/me")
async def get_current_user(request: Request):
    # Get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user from database
        user = await db.users.find_one({"id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove MongoDB _id field
        user.pop("_id", None)
        
        return user
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/auth/logout")
async def logout():
    # In a stateless JWT system, logout is handled client-side by removing the token
    return {"message": "Logged out successfully"}

@router.post("/auth/demo-login")
async def demo_login(login_data: DemoLoginRequest):
    """Demo login endpoint for testing purposes"""
    try:
        print(f"🔍 Demo login attempt - Username: '{login_data.username}', Password: '{login_data.password}'")
        
        # Find user by username (stored in provider_id for demo accounts)
        user = await db.users.find_one({
            "provider": "demo",
            "provider_id": login_data.username
        })
        
        print(f"🔍 User lookup result: {user is not None}")
        if user:
            print(f"🔍 Found user: {user.get('name')}, provider_id: '{user.get('provider_id')}', password in DB: '{user.get('password')}'")
        
        if not user:
            print(f"❌ User not found with provider_id: '{login_data.username}'")
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Check password (stored in a 'password' field for demo accounts)
        db_password = user.get("password")
        input_password = login_data.password
        
        print(f"🔍 Password comparison: DB='{db_password}' vs Input='{input_password}', Match={db_password == input_password}")
        
        if db_password != input_password:
            print(f"❌ Password mismatch!")
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        print(f"✅ Login successful for user: {user.get('name')}")
        
        # Update last login
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow().isoformat()}}
        )
        
        # Create JWT token
        access_token = create_access_token({"sub": user["id"], "provider": "demo"})
        
        # Remove sensitive fields
        user.pop("_id", None)
        user.pop("password", None)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Demo login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/auth/create-demo-users")
async def create_demo_users():
    """Create demo user accounts for testing (run once)"""
    try:
        # Demo user 1: Main test account
        demo_user_1 = {
            "id": str(uuid.uuid4()),
            "name": "Test User",
            "email": "testuser@ceibaa.demo",
            "profile_picture": "https://ui-avatars.com/api/?name=Test+User&background=4F46E5&color=fff&size=200",
            "provider": "demo",
            "provider_id": "12345",
            "password": "123445",
            "created_at": datetime.utcnow().isoformat(),
            "last_login": datetime.utcnow().isoformat()
        }
        
        # Demo user 2: Opponent account
        demo_user_2 = {
            "id": str(uuid.uuid4()),
            "name": "Sher From Delhi",
            "email": "sher@ceibaa.demo",
            "profile_picture": "https://ui-avatars.com/api/?name=Sher+From+Delhi&background=DC2626&color=fff&size=200",
            "provider": "demo",
            "provider_id": "sher123",
            "password": "sher123",
            "created_at": datetime.utcnow().isoformat(),
            "last_login": datetime.utcnow().isoformat()
        }
        
        # Demo user 3: sher20
        demo_user_3 = {
            "id": str(uuid.uuid4()),
            "name": "Sher20",
            "email": "sher20@ceibaa.demo",
            "profile_picture": "https://ui-avatars.com/api/?name=Sher20&background=10B981&color=fff&size=200",
            "provider": "demo",
            "provider_id": "sher20",
            "password": "sher20",
            "created_at": datetime.utcnow().isoformat(),
            "last_login": datetime.utcnow().isoformat()
        }
        
        # Demo user 4: Sher25
        demo_user_4 = {
            "id": str(uuid.uuid4()),
            "name": "Sher25",
            "email": "sher25@ceibaa.demo",
            "profile_picture": "https://ui-avatars.com/api/?name=Sher25&background=F59E0B&color=fff&size=200",
            "provider": "demo",
            "provider_id": "Sher25",
            "password": "Sher25",
            "created_at": datetime.utcnow().isoformat(),
            "last_login": datetime.utcnow().isoformat()
        }
        
        # Check if users already exist and delete them
        await db.users.delete_many({"provider": "demo", "provider_id": {"$in": ["12345", "sher123", "sher20", "Sher25"]}})
        
        # Insert demo users
        await db.users.insert_many([demo_user_1, demo_user_2, demo_user_3, demo_user_4])
        
        return {
            "message": "Demo users created successfully",
            "users": [
                {
                    "username": "12345",
                    "password": "123445",
                    "name": "Test User"
                },
                {
                    "username": "sher123",
                    "password": "sher123",
                    "name": "Sher From Delhi"
                },
                {
                    "username": "sher20",
                    "password": "sher20",
                    "name": "Sher20"
                },
                {
                    "username": "Sher25",
                    "password": "Sher25",
                    "name": "Sher25"
                }
            ]
        }
    except Exception as e:
        print(f"Error creating demo users: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create demo users: {str(e)}")
