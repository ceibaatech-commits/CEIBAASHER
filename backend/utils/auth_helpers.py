"""Shared auth helpers and JWT utilities for recruitment module"""
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, Request
from jose import jwt, JWTError

from database import db

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def _extract_token(request: Request) -> Optional[str]:
    """Dual-mode token extraction: httpOnly session cookie first, then
    Authorization Bearer header. Matches the pattern in auth_routes._extract_token
    so student/recruiter endpoints work with cookie-based auth too.
    """
    token = request.cookies.get("session_token")
    if token:
        return token
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[len("Bearer "):]
    return None


async def _user_id_from_session(token: str) -> Optional[str]:
    """Look up an Emergent OAuth opaque session token in `user_sessions`.
    These tokens are NOT JWTs — they're opaque server-issued strings — so
    `jwt.decode` will reject them. Cookie-only Google-auth flows depend on
    this lookup. Returns the user_id if the session is live, else None.
    Mirrors profile_routes.get_user_from_session.
    """
    try:
        session_doc = await db.user_sessions.find_one(
            {"session_token": token},
            {"_id": 0},
        )
        if not session_doc:
            return None

        expires_at = session_doc.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at and expires_at < datetime.now(timezone.utc):
            await db.user_sessions.delete_one({"session_token": token})
            return None

        return session_doc.get("user_id")
    except Exception:
        return None


async def _resolve_user_id(token: str) -> Optional[str]:
    """Try opaque-session first (Emergent Google login),
    then fall back to JWT decode (custom JWT login)."""
    uid = await _user_id_from_session(token)
    if uid:
        return uid
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


async def get_current_student(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(401, "Not authenticated")
    user_id = await _resolve_user_id(token)
    if not user_id:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


async def get_current_recruiter(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(401, "Not authenticated")
    user_id = await _resolve_user_id(token)
    if not user_id:
        raise HTTPException(401, "Invalid token")
    rec = await db.recruiters.find_one({"id": user_id}, {"_id": 0})
    if not rec:
        raise HTTPException(401, "Recruiter not found")
    return rec


async def get_admin(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(401, "Auth required")
    # Sessions issued via the Emergent OAuth flow do not carry a "role" claim,
    # so admin gating still relies on the JWT path. Admin tokens are always JWTs.
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(401, "Invalid token")
    if payload.get("role") != "ceibaa_admin":
        raise HTTPException(403, "Admin only")
    return payload
