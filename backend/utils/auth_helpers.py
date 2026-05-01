"""Shared auth helpers and JWT utilities for recruitment module"""
import os
from fastapi import HTTPException, Request
from jose import jwt, JWTError
from database import db

JWT_SECRET = os.getenv("JWT_SECRET", "ceibaa-super-secret-key-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def _extract_token(request: Request) -> str | None:
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


async def get_current_student(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except JWTError:
        raise HTTPException(401, "Invalid token")


async def get_current_recruiter(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        rec_id = payload.get("sub")
        rec = await db.recruiters.find_one({"id": rec_id}, {"_id": 0})
        if not rec:
            raise HTTPException(401, "Recruiter not found")
        return rec
    except JWTError:
        raise HTTPException(401, "Invalid token")


async def get_admin(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(401, "Auth required")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "ceibaa_admin":
            raise HTTPException(403, "Admin only")
        return payload
    except JWTError:
        raise HTTPException(401, "Invalid token")
