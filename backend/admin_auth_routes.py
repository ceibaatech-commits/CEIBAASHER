"""
Admin Authentication Routes
Secure admin login with database authentication
Dual-mode auth: HttpOnly cookie (preferred) + Authorization Bearer (legacy)
Dual-mode password verification: bcrypt (canonical) + legacy SHA-256 with
auto-upgrade to bcrypt on first successful login.
"""
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
import hashlib
import uuid
import os
import bcrypt

router = APIRouter(prefix="/admin/auth", tags=["Admin Auth"])

# Global db instance
db = None

# Cookie configuration (matches user auth cookie semantics)
ADMIN_COOKIE_NAME = "ceibaa_admin_token"
ADMIN_COOKIE_MAX_AGE_SEC = 24 * 60 * 60  # 24 hours — matches session expiry


def init_db(database):
    global db
    db = database


def _set_admin_cookie(response: Response, token: str) -> None:
    """Set httpOnly admin session cookie."""
    response.set_cookie(
        key=ADMIN_COOKIE_NAME,
        value=token,
        max_age=ADMIN_COOKIE_MAX_AGE_SEC,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )


def _clear_admin_cookie(response: Response) -> None:
    response.delete_cookie(key=ADMIN_COOKIE_NAME, path="/", samesite="lax")


def _extract_admin_token(request: Request) -> str:
    """Cookie-first, Authorization-header fallback (backwards compat)."""
    cookie_token = request.cookies.get(ADMIN_COOKIE_NAME)
    if cookie_token:
        return cookie_token
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
    return ""


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    success: bool
    token: str = None
    user: dict = None
    message: str = None


def hash_password(password: str) -> str:
    """Hash password using bcrypt (canonical — aligned with /api/auth/login)."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def _legacy_sha256(password: str) -> str:
    """Legacy SHA-256 hex hash (pre-Feb-2026)."""
    return hashlib.sha256(password.encode()).hexdigest()


def _is_bcrypt_hash(value: str) -> bool:
    """bcrypt hashes always start with $2a$, $2b$, $2y$ — quick sniff."""
    return isinstance(value, str) and value.startswith("$2") and len(value) >= 50


def _verify_admin_password(plain: str, user: dict) -> Tuple[bool, bool]:
    """Verify an admin's plaintext password against either format.

    Returns (is_match, used_legacy_format).
    `used_legacy_format=True` means the caller should upgrade the doc to bcrypt
    on next write to retire the SHA-256 field.

    Order of preference:
      1. bcrypt in `password_hash` (canonical — matches /api/auth/login)
      2. bcrypt in `password` (some older docs store bcrypt here)
      3. SHA-256 hex in `password` (legacy — auto-upgrade flag returned)
    """
    if not plain:
        return False, False

    plain_bytes = plain.encode("utf-8")

    # 1) bcrypt in password_hash (canonical)
    canonical = user.get("password_hash") or ""
    if _is_bcrypt_hash(canonical):
        try:
            if bcrypt.checkpw(plain_bytes, canonical.encode("utf-8")):
                return True, False
        except (ValueError, TypeError):
            pass  # malformed hash — fall through to other checks

    # 2) bcrypt accidentally stored under password
    legacy_field = user.get("password") or ""
    if _is_bcrypt_hash(legacy_field):
        try:
            if bcrypt.checkpw(plain_bytes, legacy_field.encode("utf-8")):
                return True, True  # treat as legacy so we normalize the field name
        except (ValueError, TypeError):
            pass

    # 3) Legacy SHA-256 hex in password
    if legacy_field and legacy_field == _legacy_sha256(plain):
        return True, True

    return False, False


async def _upgrade_admin_password_to_bcrypt(user: dict, plain: str) -> None:
    """One-shot migration: rewrite password_hash with bcrypt and clear legacy fields.
    Called only on a successful legacy-format login. Best-effort — swallow errors.
    """
    try:
        new_hash = hash_password(plain)
        uid_match = {"$or": [
            {"id": user.get("id")},
            {"user_id": user.get("user_id") or user.get("id")},
            {"email": user.get("email")},
        ]}
        await db.users.update_one(
            uid_match,
            {"$set": {"password_hash": new_hash},
             "$unset": {"password": ""}},
        )
    except Exception as e:
        print(f"[ADMIN_AUTH] Failed to upgrade password to bcrypt: {e}")


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


async def _find_admin_user(username: str) -> Optional[dict]:
    """Find an admin user by username or email (case-insensitive)."""
    lower = username.lower().strip()
    return await db.users.find_one({
        "$and": [
            {"$or": [
                {"username": lower},
                {"email": lower},
                {"username": username},
                {"email": username},
            ]},
            {"$or": [
                {"is_admin": True},
                {"role": {"$in": ["admin", "super_admin"]}},
                {"is_super_admin": True},
            ]},
        ],
    })


async def _log_admin_login_attempt(username: str, ip: str, success: bool, reason: str = None, user_id: str = None) -> None:
    doc = {
        "username": username,
        "ip_address": ip,
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if reason is not None:
        doc["reason"] = reason
    if user_id is not None:
        doc["user_id"] = user_id
    await db.admin_login_logs.insert_one(doc)


async def _create_admin_session(user: dict, ip: str) -> str:
    token = f"admin_{uuid.uuid4().hex}_{int(datetime.now().timestamp())}"
    await db.admin_sessions.insert_one({
        "token": token,
        "user_id": user.get("id") or user.get("user_id"),
        "username": user.get("username") or user.get("email"),
        "role": user.get("role", "admin"),
        "ip_address": ip,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
    })
    return token


def _admin_user_response(user: dict) -> dict:
    return {
        "id": user.get("id") or user.get("user_id"),
        "username": user.get("username"),
        "email": user.get("email"),
        "name": user.get("name"),
        "role": user.get("role", "admin"),
        "is_super_admin": user.get("is_super_admin", False),
    }


@router.post("/login")
async def admin_login(request: Request, response: Response, credentials: AdminLoginRequest):
    """
    Secure admin login endpoint.
    Authenticates against database, not hardcoded credentials.
    Sets httpOnly cookie AND returns token in JSON (dual-mode for legacy clients).
    """
    try:
        ip = _client_ip(request)
        user = await _find_admin_user(credentials.username)

        if not user:
            await _log_admin_login_attempt(credentials.username, ip, False, reason="user_not_found")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        matched, used_legacy = _verify_admin_password(credentials.password, user)
        if not matched:
            await _log_admin_login_attempt(credentials.username, ip, False,
                                           reason="wrong_password", user_id=user.get("id"))
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Opportunistic upgrade — silent, best-effort.
        if used_legacy:
            await _upgrade_admin_password_to_bcrypt(user, credentials.password)

        admin_token = await _create_admin_session(user, ip)
        await _log_admin_login_attempt(credentials.username, ip, True, user_id=user.get("id"))

        # Dual-mode: set httpOnly cookie (preferred) + return token in JSON (legacy)
        _set_admin_cookie(response, admin_token)

        return {
            "success": True,
            "token": admin_token,
            "user": _admin_user_response(user),
            "message": "Login successful",
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Admin login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")


@router.post("/logout")
async def admin_logout(request: Request, response: Response):
    """Logout and invalidate admin session — clears both cookie and DB record."""
    try:
        token = _extract_admin_token(request)
        if token:
            await db.admin_sessions.delete_one({"token": token})
        _clear_admin_cookie(response)
        return {"success": True, "message": "Logged out successfully"}
    except Exception:
        _clear_admin_cookie(response)
        return {"success": True, "message": "Logged out"}


@router.get("/verify")
async def verify_admin_session(request: Request):
    """Verify if admin session is still valid (cookie-first, Bearer fallback)"""
    try:
        token = _extract_admin_token(request)

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


@router.get("/me")
async def admin_me(request: Request):
    """Return current admin user info (cookie-first). Used by frontend to hydrate state."""
    token = _extract_admin_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.admin_sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Session expired")
    expires_at = session.get("expires_at", "")
    if expires_at:
        expiry_time = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expiry_time:
            await db.admin_sessions.delete_one({"token": token})
            raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one(
        {"$or": [{"id": session.get("user_id")}, {"user_id": session.get("user_id")}]},
        {"_id": 0, "password": 0}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "user": _admin_user_response(user)}


async def seed_super_admin(database) -> None:
    """Seed the default super admin user on startup if not present or needs update."""
    try:
        email = "admin@ceibaa.in"
        password = "SuperAdmin@123"
        username = "admin"
        
        # Hash password using bcrypt
        salt = bcrypt.gensalt()
        pwd_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
        
        # Check if user already exists
        user = await database.users.find_one({"email": email})
        
        if user:
            # Update user to ensure admin/super_admin flags and password hash are set
            await database.users.update_one(
                {"email": email},
                {"$set": {
                    "role": "super_admin",
                    "is_admin": True,
                    "is_super_admin": True,
                    "password_hash": pwd_hash,
                },
                "$unset": {
                    "password": ""
                }}
            )
            print(f"[ADMIN_AUTH] Updated super admin credentials for {email}")
        else:
            # Create new super admin
            import uuid
            user_id = str(uuid.uuid4())
            new_admin = {
                "id": user_id,
                "user_id": user_id,
                "email": email,
                "username": username,
                "name": "Super Admin",
                "role": "super_admin",
                "is_admin": True,
                "is_super_admin": True,
                "password_hash": pwd_hash,
                "provider": "local",
                "provider_id": "local",
                "verified": True,
                "rating": 1500,
                "streak": 0,
                "posts_count": 0,
                "ceeping_count": 0,
                "ceepers_count": 0,
                "referral_coins": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await database.users.insert_one(new_admin)
            print(f"[ADMIN_AUTH] Created default super admin user {email}")
    except Exception as e:
        print(f"[ADMIN_AUTH] Failed to seed super admin: {e}")

 