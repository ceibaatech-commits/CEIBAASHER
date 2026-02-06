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
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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


# Password hashing
import bcrypt

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

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
        
        # Google OAuth 2.0
        oauth.register(
            name='google',
            client_id=os.getenv('GOOGLE_CLIENT_ID'),
            client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'},
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



class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    referral_code: Optional[str] = None

class EmailLoginRequest(BaseModel):
    email: str
    password: str

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def generate_unique_username(base_name: str):
    """Generate a unique username from name"""
    # Clean and format base name
    base = base_name.lower().replace(" ", "").replace("_", "")[:15]
    
    # Try base name first
    existing = await db.users.find_one({"username": base})
    if not existing:
        return base
    
    # Add random suffix if needed
    import random
    for _ in range(10):
        suffix = str(random.randint(100, 999))
        username = f"{base}{suffix}"
        existing = await db.users.find_one({"username": username})
        if not existing:
            return username
    
    # Fallback: use UUID
    return f"{base}{str(uuid.uuid4())[:8]}"

async def get_or_create_user(provider: str, provider_id: str, name: str, email: Optional[str], profile_picture: Optional[str]):
    # Check if user exists
    user = await db.users.find_one({"provider": provider, "provider_id": provider_id})
    
    if user:
        # Update last login
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow().isoformat()}}
        )
        # Ensure username exists
        if not user.get("username"):
            username = await generate_unique_username(name)
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"username": username}}
            )
            user["username"] = username
        return user
    
    # Create new user with username
    user_id = str(uuid.uuid4())
    username = await generate_unique_username(name)
    
    new_user = {
        "id": user_id,
        "username": username,
        "name": name,
        "email": email,
        "profile_picture": profile_picture,
        "provider": provider,
        "provider_id": provider_id,
        "bio": "",
        "location": "",
        "exam_focus": [],
        "is_private": False,
        "streak_days": 0,
        "badges": [],
        "created_at": datetime.utcnow().isoformat(),
        "last_login": datetime.utcnow().isoformat(),
        "joined_at": datetime.utcnow().isoformat()
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

@router.get("/auth/google")
async def google_login(request: Request):
    init_oauth()
    redirect_uri = os.getenv('GOOGLE_CALLBACK_URL', f"{request.base_url}api/auth/google/callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google/callback")
async def google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        
        # Get user info from ID token
        user_info = token.get('userinfo')
        if not user_info:
            # Fallback: fetch from userinfo endpoint
            resp = await oauth.google.get('https://www.googleapis.com/oauth2/v3/userinfo')
            user_info = resp.json()
        
        # Extract user info
        provider_id = user_info['sub']  # Google's unique user ID
        name = user_info.get('name', user_info.get('email', 'Unknown'))
        email = user_info.get('email')
        profile_picture = user_info.get('picture')
        
        # Get or create user
        user = await get_or_create_user('google', provider_id, name, email, profile_picture)
        
        # Create JWT token
        access_token = create_access_token({"sub": user["id"], "provider": "google"})
        
        # Redirect to frontend with token
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={access_token}")
        
    except Exception as e:
        print(f"Google auth error: {e}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=Google login failed")

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

@router.get("/auth/search-user")
async def search_user(name: str):
    """
    Search for a user by name and return their user_id
    """
    try:
        # Try exact match first
        user = await db.users.find_one({"name": name}, {"_id": 0, "id": 1})
        if user:
            return {"user_id": user.get("id")}
        
        # Try case-insensitive match
        user = await db.users.find_one(
            {"name": {"$regex": f"^{name}$", "$options": "i"}},
            {"_id": 0, "id": 1}
        )
        if user:
            return {"user_id": user.get("id")}
        
        # User not found
        return {"user_id": None}
    except Exception as e:
        print(f"Error searching for user: {e}")
        return {"user_id": None}

@router.post("/auth/demo-login")
async def demo_login(login_data: DemoLoginRequest):
    """Demo login endpoint - No social login, only demo accounts"""
    try:
        print(f"🔍 Demo login attempt - Username: '{login_data.username}', Password: '{login_data.password}'")
        
        # Define demo users
        demo_users = {
            "demo1": {
                "id": "demo1-uuid",
                "username": "demostudent1",
                "name": "Demo Student 1",
                "email": "demo1@ceibaa.com",
                "profile_picture": "https://ui-avatars.com/api/?name=Demo+Student+1&background=3B82F6&color=fff&size=200",
                "provider": "demo",
                "provider_id": "demo1",
                "password": "demo1",
                "bio": "Preparing for JEE Main 2025",
                "location": "Mumbai, India",
                "exam_focus": ["JEE"],
                "is_private": False,
                "streak_days": 5,
                "badges": ["Quiz Master"],
                "created_at": datetime.utcnow().isoformat(),
                "joined_at": datetime.utcnow().isoformat()
            },
            "demo2": {
                "id": "demo2-uuid",
                "username": "demostudent2",
                "name": "Demo Student 2",
                "email": "demo2@ceibaa.com",
                "profile_picture": "https://ui-avatars.com/api/?name=Demo+Student+2&background=10B981&color=fff&size=200",
                "provider": "demo",
                "provider_id": "demo2",
                "password": "demo2",
                "bio": "NEET aspirant | Class 12",
                "location": "Delhi, India",
                "exam_focus": ["NEET"],
                "is_private": False,
                "streak_days": 3,
                "badges": ["Top Scorer"],
                "created_at": datetime.utcnow().isoformat(),
                "joined_at": datetime.utcnow().isoformat()
            },
            "demo3": {
                "id": "demo3-uuid",
                "username": "demostudent3",
                "name": "Demo Student 3",
                "email": "demo3@ceibaa.com",
                "profile_picture": "https://ui-avatars.com/api/?name=Demo+Student+3&background=F59E0B&color=fff&size=200",
                "provider": "demo",
                "provider_id": "demo3",
                "password": "demo3",
                "bio": "SSC CGL aspirant",
                "location": "Bangalore, India",
                "exam_focus": ["SSC"],
                "is_private": False,
                "streak_days": 7,
                "badges": ["Consistent"],
                "created_at": datetime.utcnow().isoformat(),
                "joined_at": datetime.utcnow().isoformat()
            }
        }

        # Check credentials
        username_lower = login_data.username.lower().strip()
        if username_lower not in demo_users:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        user_data = demo_users[username_lower]
        if login_data.password != user_data["password"]:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Upsert user into database to ensure permissions work
        # This makes sure demo users exist in the database with their data
        try:
            user_in_db = await db.users.find_one({"id": user_data["id"]})
            print(f"📝 User in DB: {user_in_db is not None}")
            if not user_in_db:
                # Insert demo user into database (without password in stored doc)
                user_to_store = {**user_data}
                user_to_store.pop("password", None)  # Don't store password in db
                result = await db.users.insert_one(user_to_store)
                print(f"📝 Inserted user with ID: {result.inserted_id}")
            else:
                # Update existing user's data (keep permissions if they exist)
                update_data = {**user_data}
                update_data.pop("password", None)
                # Preserve existing permissions
                for field in ["can_post_images", "can_post_videos", "is_disabled"]:
                    if field in user_in_db:
                        update_data[field] = user_in_db[field]
                await db.users.update_one(
                    {"id": user_data["id"]},
                    {"$set": update_data}
                )
                # Refresh user data with db permissions
                user_in_db = await db.users.find_one({"id": user_data["id"]}, {"_id": 0})
                if user_in_db:
                    user_data.update({
                        "can_post_images": user_in_db.get("can_post_images", False),
                        "can_post_videos": user_in_db.get("can_post_videos", False),
                        "is_disabled": user_in_db.get("is_disabled", False)
                    })
        except Exception as db_err:
            print(f"❌ DB error during user upsert: {db_err}")
        
        # Generate JWT token
        token_data = {
            "sub": user_data["id"],
            "email": user_data["email"],
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        access_token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # Return user data
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in demo login: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/auth/signup")
async def signup(request: SignupRequest):
    """Create new user account"""
    try:
        # Validate input
        if not request.name or len(request.name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
        
        if not request.email or '@' not in request.email:
            raise HTTPException(status_code=400, detail="Please enter a valid email")
        
        if not request.password or len(request.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Check if email already exists
        email_lower = request.email.strip().lower()
        existing_user = await db.users.find_one({"email": email_lower})
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered. Please login.")
        
        # Hash password
        hashed_password = hash_password(request.password)
        
        # Create user document
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "user_id": user_id,  # For backward compatibility
            "name": request.name.strip(),
            "email": email_lower,
            "username": email_lower.split('@')[0],
            "password": hashed_password,
            "avatar": None,
            "verified": False,
            "rating": 1200,
            "streak": 0,
            "posts_count": 0,
            "ceeping_count": 0,
            "ceepers_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            "last_login": datetime.utcnow().isoformat()
        }
        
        # Insert user
        await db.users.insert_one(user_doc.copy())
        
        # Generate JWT token
        token_data = {
            "sub": user_id,
            "email": email_lower,
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # Return user data (without password)
        user_response = {
            "id": user_id,
            "user_id": user_id,
            "name": user_doc["name"],
            "email": user_doc["email"],
            "username": user_doc["username"],
            "avatar": user_doc["avatar"],
            "verified": user_doc["verified"],
            "rating": user_doc["rating"],
            "streak": user_doc["streak"]
        }
        
        return {
            "user": user_response,
            "token": token,
            "access_token": token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Signup failed. Please try again.")


@router.post("/auth/login")
async def email_login(login_data: EmailLoginRequest):
    """Login with email and password"""
    try:
        email_lower = login_data.email.strip().lower()
        
        # Find user by email
        user = await db.users.find_one({"email": email_lower}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if user has a password (signed up with email)
        stored_password = user.get("password")
        if not stored_password:
            # User might have signed up with Google
            raise HTTPException(
                status_code=401, 
                detail="This account uses Google login. Please use 'Continue with Google'."
            )
        
        # Verify password
        if not verify_password(login_data.password, stored_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Update last login
        await db.users.update_one(
            {"email": email_lower},
            {"$set": {"last_login": datetime.utcnow().isoformat()}}
        )
        
        # Generate JWT token
        token_data = {
            "sub": user["id"],
            "email": email_lower,
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # Return user data (without password)
        user_response = {
            "id": user["id"],
            "user_id": user.get("user_id", user["id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "username": user.get("username"),
            "avatar": user.get("avatar") or user.get("profile_picture"),
            "profile_picture": user.get("profile_picture") or user.get("avatar"),
            "verified": user.get("verified", False),
            "rating": user.get("rating", 1200),
            "streak": user.get("streak", 0),
            "isTeacher": user.get("isTeacher", False),
            "isProfessor": user.get("isProfessor", False),
            "isOfficial": user.get("isOfficial", False),
            "isInstitute": user.get("isInstitute", False)
        }
        
        return {
            "user": user_response,
            "token": token,
            "access_token": token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")


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
