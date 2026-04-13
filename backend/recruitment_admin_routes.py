"""
CEIBAA Recruitment Portal - Admin Recruitment Cell Routes
Handles: Recruiter management, content moderation, global analytics
"""
import os
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import Optional
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from jose import jwt, JWTError
from database import db

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "ceibaa-super-secret-key-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# --- Brute Force Protection ---
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
_login_attempts = defaultdict(list)  # key: ip+email -> list of timestamps

def _check_rate_limit(ip: str, email: str):
    key = f"{ip}:{email}"
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=LOCKOUT_MINUTES)
    _login_attempts[key] = [t for t in _login_attempts[key] if t > cutoff]
    if len(_login_attempts[key]) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(429, f"Too many failed login attempts. Try again in {LOCKOUT_MINUTES} minutes.")

def _record_failed_attempt(ip: str, email: str):
    key = f"{ip}:{email}"
    _login_attempts[key].append(datetime.now(timezone.utc))

def _clear_attempts(ip: str, email: str):
    key = f"{ip}:{email}"
    _login_attempts.pop(key, None)

async def get_admin(request: Request):
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else None
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        admin_id = payload.get("sub")
        admin = await db.ceibaa_admins.find_one({"id": admin_id}, {"_id": 0})
        if not admin:
            raise HTTPException(403, "Not an admin")
        return admin
    except JWTError:
        raise HTTPException(401, "Invalid token")

# --- Models ---
class AdminLogin(BaseModel):
    email: str
    password: str

class CreateRecruiter(BaseModel):
    company_name: str
    email: str
    password: str
    mobile: Optional[str] = ""
    industry: Optional[str] = ""
    gst_number: Optional[str] = ""
    logo_url: Optional[str] = ""
    website: Optional[str] = ""

# --- Admin Auth ---
@router.post("/recruitment-admin/login")
async def admin_login(data: AdminLogin, request: Request):
    email = data.email.strip().lower()
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip, email)
    admin = await db.ceibaa_admins.find_one({"email": email}, {"_id": 0})
    if not admin:
        _record_failed_attempt(client_ip, email)
        raise HTTPException(401, "Invalid credentials")
    if not bcrypt.checkpw(data.password.encode(), admin["password_hash"].encode()):
        _record_failed_attempt(client_ip, email)
        raise HTTPException(401, "Invalid credentials")
    _clear_attempts(client_ip, email)
    token = jwt.encode(
        {"sub": admin["id"], "email": email, "role": "ceibaa_admin",
         "exp": datetime.now(timezone.utc) + timedelta(days=7)},
        JWT_SECRET, algorithm=JWT_ALGORITHM
    )
    return {"access_token": token, "token_type": "bearer", "admin": {"id": admin["id"], "name": admin["name"], "email": admin["email"]}}

@router.get("/recruitment-admin/me")
async def admin_me(request: Request):
    admin = await get_admin(request)
    return {"id": admin["id"], "name": admin["name"], "email": admin["email"]}

# --- Recruiter Management ---
@router.post("/recruitment-admin/recruiters")
async def create_recruiter(data: CreateRecruiter, request: Request):
    await get_admin(request)
    email = data.email.strip().lower()
    existing = await db.recruiters.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Email already registered")
    slug = data.company_name.lower().replace(" ", "-").replace(".", "")[:50]
    # Ensure unique slug
    slug_check = await db.recruiters.find_one({"slug": slug})
    if slug_check:
        slug = f"{slug}-{str(uuid.uuid4())[:6]}"
    password_hash = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    rec = {
        "id": str(uuid.uuid4()),
        "company_name": data.company_name,
        "slug": slug,
        "email": email,
        "mobile": data.mobile,
        "password_hash": password_hash,
        "industry": data.industry,
        "gst_number": data.gst_number,
        "logo_url": data.logo_url or f"https://ui-avatars.com/api/?name={data.company_name.replace(' ', '+')}&background=4f7cff&color=fff&size=200",
        "banner_url": "",
        "website": data.website,
        "about": "",
        "employee_count": "",
        "founding_year": "",
        "status": "active",
        "verified_email": False,
        "verified_mobile": False,
        "verified_gst": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.recruiters.insert_one(rec.copy())
    rec.pop("_id", None)
    rec.pop("password_hash", None)
    return rec

@router.get("/recruitment-admin/recruiters")
async def list_recruiters(request: Request):
    await get_admin(request)
    recs = await db.recruiters.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(200)
    for r in recs:
        r["posts_count"] = await db.recruitment_posts.count_documents({"company_id": r["id"]})
    return {"recruiters": recs}

@router.put("/recruitment-admin/recruiter/{rec_id}/verify")
async def verify_recruiter(rec_id: str, request: Request):
    await get_admin(request)
    body = await request.json()
    update = {}
    for field in ["verified_email", "verified_mobile", "verified_gst"]:
        if field in body:
            update[field] = body[field]
    if update:
        await db.recruiters.update_one({"id": rec_id}, {"$set": update})
    return {"status": "updated"}

@router.put("/recruitment-admin/recruiter/{rec_id}/revoke")
async def revoke_recruiter(rec_id: str, request: Request):
    await get_admin(request)
    await db.recruiters.update_one({"id": rec_id}, {"$set": {"status": "revoked"}})
    # Take all their posts offline
    await db.recruitment_posts.update_many({"company_id": rec_id}, {"$set": {"status": "revoked"}})
    return {"status": "revoked"}

@router.put("/recruitment-admin/recruiter/{rec_id}/activate")
async def activate_recruiter(rec_id: str, request: Request):
    await get_admin(request)
    await db.recruiters.update_one({"id": rec_id}, {"$set": {"status": "active"}})
    return {"status": "activated"}

# --- Content Moderation ---
@router.get("/recruitment-admin/pending-posts")
async def pending_posts(request: Request):
    await get_admin(request)
    posts = await db.recruitment_posts.find({"status": "pending"}, {"_id": 0}).sort("created_at", 1).to_list(100)
    for p in posts:
        company = await db.recruiters.find_one({"id": p["company_id"]}, {"_id": 0, "password_hash": 0})
        if company:
            p["company_name"] = company.get("company_name", "")
            p["company_logo"] = company.get("logo_url", "")
    return {"posts": posts}

@router.put("/recruitment-admin/post/{post_id}/approve")
async def approve_post(post_id: str, request: Request):
    await get_admin(request)
    await db.recruitment_posts.update_one(
        {"id": post_id},
        {"$set": {"status": "approved", "approved_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "approved"}

@router.put("/recruitment-admin/post/{post_id}/reject")
async def reject_post(post_id: str, request: Request):
    await get_admin(request)
    body = await request.json()
    await db.recruitment_posts.update_one(
        {"id": post_id},
        {"$set": {"status": "rejected", "rejection_reason": body.get("reason", "")}}
    )
    return {"status": "rejected"}

@router.put("/recruitment-admin/post/{post_id}/takedown")
async def takedown_post(post_id: str, request: Request):
    await get_admin(request)
    body = await request.json()
    await db.recruitment_posts.update_one(
        {"id": post_id},
        {"$set": {"status": "taken_down", "takedown_reason": body.get("reason", "")}}
    )
    return {"status": "taken_down"}

# --- Global Analytics ---
@router.get("/recruitment-admin/analytics")
async def global_analytics(request: Request):
    await get_admin(request)
    total_recruiters = await db.recruiters.count_documents({"status": "active"})
    active_listings = await db.recruitment_posts.count_documents({"status": "approved"})
    total_apps = await db.recruitment_applications.count_documents({})
    placed = await db.recruitment_applications.count_documents({"status": "accepted"})
    pending_posts = await db.recruitment_posts.count_documents({"status": "pending"})
    # Top hiring companies
    pipeline = [
        {"$match": {"status": {"$in": ["offer", "accepted"]}}},
        {"$group": {"_id": "$company_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_hiring = await db.recruitment_applications.aggregate(pipeline).to_list(5)
    for t in top_hiring:
        company = await db.recruiters.find_one({"id": t["_id"]}, {"_id": 0, "company_name": 1, "logo_url": 1})
        t["company_name"] = company.get("company_name", "") if company else ""
        t["company_logo"] = company.get("logo_url", "") if company else ""
    return {
        "total_recruiters": total_recruiters,
        "active_listings": active_listings,
        "total_applications": total_apps,
        "students_placed": placed,
        "pending_posts": pending_posts,
        "top_hiring": top_hiring
    }

# --- Student Management (Read-only) ---
@router.get("/recruitment-admin/students")
async def list_students(request: Request, page: int = 1, limit: int = 50):
    await get_admin(request)
    skip = (page - 1) * limit
    students = await db.users.find({}, {"_id": 0, "password": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    for s in students:
        s["applications_count"] = await db.recruitment_applications.count_documents({"user_id": s.get("id", "")})
        s["placed"] = await db.recruitment_applications.count_documents({"user_id": s.get("id", ""), "status": "accepted"}) > 0
    return {"students": students, "total": total}
