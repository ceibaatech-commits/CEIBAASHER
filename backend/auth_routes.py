import re
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Request, Response
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
JWT_SECRET = os.environ["JWT_SECRET"]
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
    remember: Optional[bool] = False

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
    import secrets
    for _ in range(10):
        suffix = str(secrets.randbelow(900) + 100)
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
        await oauth.twitter.authorize_access_token(request)
        
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
        await oauth.facebook.authorize_access_token(request)
        
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

# ---- Auth helpers (extracted from get_current_user to reduce complexity) ----

def _extract_token(request: Request) -> Optional[str]:
    """Extract bearer token from session cookie or Authorization header."""
    token = request.cookies.get("session_token")
    if token:
        return token
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[len("Bearer "):]
    return None


def _session_expired(session_doc: dict) -> bool:
    """Return True if the Emergent session has expired."""
    from datetime import timezone as _tz
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at is None:
        return False
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=_tz.utc)
    return expires_at < datetime.now(_tz.utc)


async def _user_by_id(user_id: str) -> Optional[dict]:
    """Fetch user by id or legacy user_id field, excluding sensitive fields."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "provider_id": 0})
    if user:
        return user
    # Backward-compat: some docs use user_id field
    return await db.users.find_one({"user_id": user_id}, {"_id": 0, "provider_id": 0})


async def _resolve_emergent_session(token: str) -> Optional[dict]:
    """
    Look up token in user_sessions. Returns the user doc if a valid session
    exists, None if no session (caller should try JWT), and deletes expired
    sessions as a side effect.
    """
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        return None
    if _session_expired(session_doc):
        await db.user_sessions.delete_one({"session_token": token})
        return None
    user = await _user_by_id(session_doc["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def _resolve_jwt(token: str) -> dict:
    """Decode JWT and return the associated user document."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.pop("_id", None)
    user.pop("provider_id", None)
    return user


@router.get("/auth/me")
async def get_current_user(
    request: Request,
    response: Response,
):
    """
    Get the currently authenticated user.

    Priority order:
    1. Emergent session token (cookie or Bearer) looked up in user_sessions.
    2. Email/password JWT fallback (JWT_SECRET).

    Returns the user document (without _id / provider_id) on success, or 401.
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # 1. Emergent session path (non-fatal on failure; falls through to JWT)
    try:
        user = await _resolve_emergent_session(token)
        if user is not None:
            return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"[auth/me] Session lookup error (falling back to JWT): {e}")

    # 2. JWT fallback
    return await _resolve_jwt(token)


@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """
    Log out the current user.

    For Emergent / Google OAuth sessions the session record is deleted from
    ``user_sessions`` and the ``session_token`` cookie is cleared.
    For JWT users (email/password) the cookie clear is a no-op and the client
    is expected to discard the token locally.
    """
    try:
        session_token = request.cookies.get("session_token")

        if session_token:
            # Remove Emergent session from database (JWT users have no DB session)
            await db.user_sessions.delete_one({"session_token": session_token})

        # Clear cookie regardless of auth method
        response.delete_cookie(
            key="session_token",
            path="/",
            secure=True,
            samesite="lax",
        )

        return {"success": True, "message": "Logged out successfully"}

    except Exception as e:
        print(f"[auth/logout] Error: {e}")
        # Always report success to the client so the frontend can clean up
        return {"success": True, "message": "Logged out"}

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
            {"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}},
            {"_id": 0, "id": 1}
        )
        if user:
            return {"user_id": user.get("id")}
        
        # User not found
        return {"user_id": None}
    except Exception as e:
        print(f"Error searching for user: {e}")
        return {"user_id": None}

# ---- Demo login helpers (extracted to reduce complexity) ----

def _build_demo_user(username: str, display_name: str, bg_color: str,
                     password: str, bio: str, location: str, exam: str,
                     streak: int, badge: str) -> dict:
    now = datetime.utcnow().isoformat()
    return {
        "id": f"{username}-uuid",
        "username": f"demostudent{username[-1]}",
        "name": display_name,
        "email": f"{username}@ceibaa.com",
        "profile_picture": f"https://ui-avatars.com/api/?name={display_name.replace(' ', '+')}&background={bg_color}&color=fff&size=200",
        "provider": "demo",
        "provider_id": username,
        "password": password,
        "bio": bio,
        "location": location,
        "exam_focus": [exam],
        "is_private": False,
        "streak_days": streak,
        "badges": [badge],
        "created_at": now,
        "joined_at": now,
    }


def _demo_users() -> dict:
    return {
        "demo1": _build_demo_user("demo1", "Demo Student 1", "3B82F6", "demo1",
                                  "Preparing for JEE Main 2025", "Mumbai, India", "JEE", 5, "Quiz Master"),
        "demo2": _build_demo_user("demo2", "Demo Student 2", "10B981", "demo2",
                                  "NEET aspirant | Class 12", "Delhi, India", "NEET", 3, "Top Scorer"),
        "demo3": _build_demo_user("demo3", "Demo Student 3", "F59E0B", "demo3",
                                  "SSC CGL aspirant", "Bangalore, India", "SSC", 7, "Consistent"),
    }


async def _upsert_demo_user(user_data: dict) -> None:
    """Ensure the demo user exists in DB and sync permissions back into user_data."""
    try:
        # Prefer username match (handles historical ID drift)
        user_in_db = await db.users.find_one({"username": user_data["username"]})
        if user_in_db:
            user_data["id"] = user_in_db["id"]
        else:
            user_in_db = await db.users.find_one({"id": user_data["id"]})

        if not user_in_db:
            user_to_store = {k: v for k, v in user_data.items() if k != "password"}
            await db.users.insert_one(user_to_store)
            return

        update_data = {k: v for k, v in user_data.items() if k != "password"}
        # Preserve existing permission flags
        for field in ("can_post_images", "can_post_videos", "is_disabled"):
            if field in user_in_db:
                update_data[field] = user_in_db[field]
        await db.users.update_one({"id": user_data["id"]}, {"$set": update_data})
        refreshed = await db.users.find_one({"id": user_data["id"]}, {"_id": 0})
        if refreshed:
            user_data.update({
                "can_post_images": refreshed.get("can_post_images", False),
                "can_post_videos": refreshed.get("can_post_videos", False),
                "is_disabled": refreshed.get("is_disabled", False),
            })
    except Exception as db_err:
        # Non-fatal: login still proceeds with in-memory data
        print(f"[demo-login] DB upsert error: {db_err}")


def _issue_jwt(user_id: str, email: str) -> str:
    token_data = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _set_auth_cookie(response: Response, token: str, remember: bool = False) -> None:
    """
    Set the auth token as an httpOnly cookie for dual-mode auth.

    Args:
        response: FastAPI Response object.
        token: JWT to store.
        remember: If True, the cookie persists for 30 days ("Stay signed in");
                  otherwise ACCESS_TOKEN_EXPIRE_MINUTES is used.

    Backwards compatible: the legacy Bearer-token flow still works because the
    same value is also returned in the JSON body. The cookie is the preferred
    delivery mechanism for new code (safer against XSS).
    """
    max_age_seconds = (30 * 24 * 60 * 60) if remember else (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    response.set_cookie(
        key="session_token",
        value=token,
        max_age=max_age_seconds,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )


@router.post("/auth/demo-login")
async def demo_login(login_data: DemoLoginRequest, response: Response):
    """Demo login endpoint - No social login, only demo accounts"""
    try:
        demo_users = _demo_users()
        username_lower = login_data.username.lower().strip()

        if username_lower not in demo_users:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        user_data = demo_users[username_lower]
        if login_data.password != user_data["password"]:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        await _upsert_demo_user(user_data)

        access_token = _issue_jwt(user_data["id"], user_data["email"])
        _set_auth_cookie(response, access_token)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in demo login: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")


# ---- Signup helpers (extracted to reduce complexity) ----

def _validate_signup_payload(request: "SignupRequest") -> str:
    """Validate signup input. Returns the lowercased email."""
    if not request.name or len(request.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    if not request.email or '@' not in request.email:
        raise HTTPException(status_code=400, detail="Please enter a valid email")
    if not request.password or len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    return request.email.strip().lower()


def _new_user_doc(user_id: str, name: str, email_lower: str, hashed_password: str) -> dict:
    now = datetime.utcnow().isoformat()
    return {
        "id": user_id,
        "user_id": user_id,  # For backward compatibility
        "name": name.strip(),
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
        "referral_coins": 0,
        "created_at": now,
        "last_login": now,
    }


async def _process_referral_safe(referral_code: Optional[str], user_id: str, email_lower: str) -> None:
    """Non-blocking referral processing."""
    if not referral_code:
        return
    try:
        from referral_routes import process_referral
        await process_referral(referral_code, user_id, email_lower)
    except Exception as ref_err:
        print(f"Referral processing error (non-blocking): {ref_err}")


def _public_user_response(user_doc: dict) -> dict:
    return {
        "id": user_doc["id"],
        "user_id": user_doc["id"],
        "name": user_doc["name"],
        "email": user_doc["email"],
        "username": user_doc["username"],
        "avatar": user_doc["avatar"],
        "verified": user_doc["verified"],
        "rating": user_doc["rating"],
        "streak": user_doc["streak"],
    }


@router.post("/auth/signup")
async def signup(request: SignupRequest, response: Response):
    """Create new user account"""
    try:
        email_lower = _validate_signup_payload(request)

        if await db.users.find_one({"email": email_lower}):
            raise HTTPException(status_code=400, detail="Email already registered. Please login.")

        user_id = str(uuid.uuid4())
        user_doc = _new_user_doc(user_id, request.name, email_lower, hash_password(request.password))
        await db.users.insert_one(user_doc.copy())

        await _process_referral_safe(request.referral_code, user_id, email_lower)

        token = _issue_jwt(user_id, email_lower)
        _set_auth_cookie(response, token)
        return {
            "user": _public_user_response(user_doc),
            "token": token,
            "access_token": token,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Signup failed. Please try again.")


def _build_user_response(user: dict) -> dict:
    """Trim a user record for client responses (no password, flat shape)."""
    return {
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
        "isInstitute": user.get("isInstitute", False),
    }


async def _authenticate_email_credentials(email_lower: str, password: str) -> dict:
    """Look up a user and verify the password. Raises HTTPException on any failure.
    Returns the loaded user document on success.
    """
    user = await db.users.find_one({"email": email_lower}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    stored_password = user.get("password")
    if not stored_password:
        # User might have signed up with Google
        raise HTTPException(
            status_code=401,
            detail="This account uses Google login. Please use 'Continue with Google'.",
        )

    try:
        ok = verify_password(password, stored_password)
    except ValueError:
        # Stored hash is not bcrypt (e.g. legacy SHA-256 digest). Treat as bad
        # credential instead of crashing into a 500.
        print(f"[auth] legacy/corrupt password hash for {email_lower}; rejecting as 401")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return user


@router.post("/auth/login")
async def email_login(login_data: EmailLoginRequest, response: Response):
    """Login with email and password"""
    try:
        email_lower = login_data.email.strip().lower()
        user = await _authenticate_email_credentials(email_lower, login_data.password)

        # Update last login
        await db.users.update_one(
            {"email": email_lower},
            {"$set": {"last_login": datetime.utcnow().isoformat()}},
        )

        # Issue token + set httpOnly cookie
        token = _issue_jwt(user["id"], email_lower)
        _set_auth_cookie(response, token, remember=bool(login_data.remember))

        return {
            "user": _build_user_response(user),
            "token": token,
            "access_token": token,
            "token_type": "bearer",
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")


@router.post("/auth/create-demo-users")
async def create_demo_users():
    """Create demo user accounts for testing (run once)."""
    try:
        now = datetime.utcnow().isoformat()

        def _make(name: str, provider_id: str, password: str, color: str) -> dict:
            slug = name.replace(' ', '+')
            return {
                "id": str(uuid.uuid4()),
                "name": name,
                "email": f"{provider_id.lower()}@ceibaa.demo",
                "profile_picture": f"https://ui-avatars.com/api/?name={slug}&background={color}&color=fff&size=200",
                "provider": "demo",
                "provider_id": provider_id,
                "password": password,
                "created_at": now,
                "last_login": now,
            }

        specs = [
            ("Test User",       "12345",   "123445", "4F46E5"),
            ("Sher From Delhi", "sher123", "sher123", "DC2626"),
            ("Sher20",          "sher20",  "sher20", "10B981"),
            ("Sher25",          "Sher25",  "Sher25", "F59E0B"),
        ]
        demo_users = [_make(*s) for s in specs]
        provider_ids = [s[1] for s in specs]

        await db.users.delete_many({"provider": "demo", "provider_id": {"$in": provider_ids}})
        await db.users.insert_many(demo_users)

        return {
            "message": "Demo users created successfully",
            "users": [
                {"username": pid, "password": pw, "name": nm}
                for (nm, pid, pw, _color) in specs
            ],
        }
    except Exception as e:
        print(f"Error creating demo users: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create demo users: {str(e)}")