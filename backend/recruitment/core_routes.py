"""Recruitment: Core routes — Auth, Companies, Feed, Applications, Posts CRUD"""
import os
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import Optional
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Request, Query, Response
from jose import jwt
from database import db
from utils.auth_helpers import get_current_student, get_current_recruiter, JWT_SECRET, JWT_ALGORITHM
from utils.email_service import send_email, SITE_URL
from models.recruitment_models import RecruiterLogin, PostCreate, CompanyUpdate, HackathonSubmission

router = APIRouter()

# --- Brute Force Protection ---
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
_recruiter_login_attempts = defaultdict(list)

def _check_recruiter_rate_limit(ip, email):
    key = f"rec:{ip}:{email}"
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=LOCKOUT_MINUTES)
    _recruiter_login_attempts[key] = [t for t in _recruiter_login_attempts[key] if t > cutoff]
    if len(_recruiter_login_attempts[key]) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(429, f"Too many failed login attempts. Try again in {LOCKOUT_MINUTES} minutes.")

def _record_recruiter_failed(ip, email):
    _recruiter_login_attempts[f"rec:{ip}:{email}"].append(datetime.now(timezone.utc))

def _clear_recruiter_attempts(ip, email):
    _recruiter_login_attempts.pop(f"rec:{ip}:{email}", None)

# === Recruiter Auth ===
@router.post("/recruitment/recruiter/login")
async def recruiter_login(data: RecruiterLogin, request: Request, response: Response):
    email = data.email.strip().lower()
    client_ip = request.client.host if request.client else "unknown"
    _check_recruiter_rate_limit(client_ip, email)
    rec = await db.recruiters.find_one({"email": email}, {"_id": 0})
    if not rec:
        _record_recruiter_failed(client_ip, email)
        raise HTTPException(401, "Invalid credentials")
    if not bcrypt.checkpw(data.password.encode(), rec["password_hash"].encode()):
        _record_recruiter_failed(client_ip, email)
        raise HTTPException(401, "Invalid credentials")
    if rec.get("status") == "revoked":
        raise HTTPException(403, "Access revoked by CEIBAA admin")
    _clear_recruiter_attempts(client_ip, email)
    token = jwt.encode({"sub": rec["id"], "email": email, "role": "recruiter", "exp": datetime.now(timezone.utc) + timedelta(days=7)}, JWT_SECRET, algorithm=JWT_ALGORITHM)
    # Stage 3: Set JWT as httpOnly session_token cookie so frontend doesn't
    # need to stash `recruiter_token` in localStorage. utils/auth_helpers
    # is already dual-mode (cookie or Bearer header).
    response.set_cookie(
        key="session_token",
        value=token,
        max_age=7 * 24 * 60 * 60,  # 7 days
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )
    rec_safe = {k: v for k, v in rec.items() if k != "password_hash"}
    return {"access_token": token, "token_type": "bearer", "recruiter": rec_safe}

@router.get("/recruitment/recruiter/me")
async def recruiter_me(request: Request):
    rec = await get_current_recruiter(request)
    return {k: v for k, v in rec.items() if k != "password_hash"}

# === Company Channel ===
@router.put("/recruitment/company/update")
async def update_company(data: CompanyUpdate, request: Request):
    rec = await get_current_recruiter(request)
    update = {k: v for k, v in data.dict().items() if v is not None}
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.recruiters.update_one({"id": rec["id"]}, {"$set": update})
    return {"status": "updated"}

@router.get("/recruitment/companies")
async def list_companies(industry: Optional[str] = None, search: Optional[str] = None, page: int = 1, limit: int = 20):
    query = {"status": {"$ne": "revoked"}}
    if industry:
        query["industry"] = {"$regex": industry, "$options": "i"}
    if search:
        query["$or"] = [{"company_name": {"$regex": search, "$options": "i"}}, {"industry": {"$regex": search, "$options": "i"}}]
    skip = (page - 1) * limit
    companies = await db.recruiters.find(query, {"_id": 0, "password_hash": 0}).sort("company_name", 1).skip(skip).limit(limit).to_list(limit)
    total = await db.recruiters.count_documents(query)
    for c in companies:
        c["followers_count"] = await db.recruitment_follows.count_documents({"company_id": c["id"]})
        c["posts_count"] = await db.recruitment_posts.count_documents({"company_id": c["id"], "status": "approved"})
        c["open_roles"] = await db.recruitment_posts.count_documents({"company_id": c["id"], "status": "approved", "post_type": {"$in": ["job", "internship"]}})
    return {"companies": companies, "total": total, "page": page}

@router.get("/recruitment/company/{slug}")
async def get_company(slug: str, request: Request):
    company = await db.recruiters.find_one({"$or": [{"slug": slug}, {"id": slug}]}, {"_id": 0, "password_hash": 0})
    if not company:
        raise HTTPException(404, "Company not found")
    company["followers_count"] = await db.recruitment_follows.count_documents({"company_id": company["id"]})
    company["posts_count"] = await db.recruitment_posts.count_documents({"company_id": company["id"], "status": "approved"})
    company["open_roles"] = await db.recruitment_posts.count_documents({"company_id": company["id"], "status": "approved", "post_type": {"$in": ["job", "internship"]}})
    try:
        user = await get_current_student(request)
        follow = await db.recruitment_follows.find_one({"user_id": user["id"], "company_id": company["id"]})
        company["is_following"] = follow is not None
    except:
        company["is_following"] = False
    return company

@router.get("/recruitment/company/{slug}/posts")
async def get_company_posts(slug: str, post_type: Optional[str] = None, page: int = 1, limit: int = 20):
    company = await db.recruiters.find_one({"$or": [{"slug": slug}, {"id": slug}]}, {"_id": 0})
    if not company:
        raise HTTPException(404, "Company not found")
    query = {"company_id": company["id"], "status": "approved"}
    if post_type:
        query["post_type"] = post_type
    skip = (page - 1) * limit
    posts = await db.recruitment_posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.recruitment_posts.count_documents(query)
    for p in posts:
        p["company_name"] = company.get("company_name", "")
        p["company_logo"] = company.get("logo_url", "")
        p["applications_count"] = await db.recruitment_applications.count_documents({"post_id": p["id"]})
    return {"posts": posts, "total": total}

# === Follow ===
@router.post("/recruitment/follow/{company_id}")
async def follow_company(company_id: str, request: Request):
    user = await get_current_student(request)
    existing = await db.recruitment_follows.find_one({"user_id": user["id"], "company_id": company_id})
    if existing:
        await db.recruitment_follows.delete_one({"user_id": user["id"], "company_id": company_id})
        return {"status": "unfollowed"}
    await db.recruitment_follows.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"], "company_id": company_id, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"status": "followed"}

# === Posts CRUD ===
@router.post("/recruitment/posts")
async def create_post(data: PostCreate, request: Request):
    rec = await get_current_recruiter(request)
    post = {"id": str(uuid.uuid4()), "company_id": rec["id"], "company_name": rec.get("company_name", ""), "company_logo": rec.get("logo_url", ""), "status": "pending", **data.dict(), "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat(), "likes_count": 0, "comments_count": 0}
    await db.recruitment_posts.insert_one(post.copy())
    post.pop("_id", None)
    return post

@router.get("/recruitment/posts/my")
async def get_my_posts(request: Request, status: Optional[str] = None):
    rec = await get_current_recruiter(request)
    query = {"company_id": rec["id"]}
    if status:
        query["status"] = status
    posts = await db.recruitment_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    for p in posts:
        p["applications_count"] = await db.recruitment_applications.count_documents({"post_id": p["id"]})
    return {"posts": posts}

@router.get("/recruitment/posts/{post_id}")
async def get_post(post_id: str):
    post = await db.recruitment_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Post not found")
    company = await db.recruiters.find_one({"id": post["company_id"]}, {"_id": 0, "password_hash": 0})
    if company:
        post["company_name"] = company.get("company_name", "")
        post["company_logo"] = company.get("logo_url", "")
        post["company_slug"] = company.get("slug", "")
    post["applications_count"] = await db.recruitment_applications.count_documents({"post_id": post_id})
    return post

# === Feed ===
@router.get("/recruitment/feed")
async def student_feed(request: Request, page: int = 1, limit: int = 20):
    try:
        user = await get_current_student(request)
        follows = await db.recruitment_follows.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
        followed_ids = [f["company_id"] for f in follows]
        query = {"company_id": {"$in": followed_ids}, "status": "approved"} if followed_ids else {"status": "approved"}
    except:
        query = {"status": "approved"}
    skip = (page - 1) * limit
    posts = await db.recruitment_posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.recruitment_posts.count_documents(query)
    for p in posts:
        company = await db.recruiters.find_one({"id": p["company_id"]}, {"_id": 0, "password_hash": 0})
        if company:
            p["company_name"] = company.get("company_name", "")
            p["company_logo"] = company.get("logo_url", "")
            p["company_slug"] = company.get("slug", "")
    return {"posts": posts, "total": total, "page": page}

# === Applications ===
@router.post("/recruitment/apply/{post_id}")
async def apply_to_post(post_id: str, request: Request):
    user = await get_current_student(request)
    post = await db.recruitment_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Post not found")
    if post.get("status") != "approved":
        raise HTTPException(400, "Post not available")
    user_air = user.get("air_rank")
    if post.get("air_filter") and user_air and user_air > post["air_filter"]:
        raise HTTPException(403, "Your AIR rank does not meet the eligibility criteria")
    existing = await db.recruitment_applications.find_one({"post_id": post_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(400, "Already applied")
    app = {"id": str(uuid.uuid4()), "post_id": post_id, "company_id": post["company_id"], "user_id": user["id"], "user_name": user.get("name", ""), "user_email": user.get("email", ""), "user_air": user.get("air_rank"), "user_exam_type": user.get("exam_type", ""), "user_college": user.get("college", ""), "user_avatar": user.get("profile_picture") or user.get("avatar"), "status": "applied", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.recruitment_applications.insert_one(app.copy())
    app.pop("_id", None)
    return app

@router.get("/recruitment/my-applications")
async def my_applications(request: Request):
    user = await get_current_student(request)
    apps = await db.recruitment_applications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for a in apps:
        post = await db.recruitment_posts.find_one({"id": a["post_id"]}, {"_id": 0})
        if post:
            a["post_title"] = post.get("title", "")
            a["post_type"] = post.get("post_type", "")
            a["company_name"] = post.get("company_name", "")
            a["company_logo"] = post.get("company_logo", "")
    return {"applications": apps}

@router.get("/recruitment/applicants/{post_id}")
async def get_applicants(post_id: str, request: Request):
    rec = await get_current_recruiter(request)
    post = await db.recruitment_posts.find_one({"id": post_id, "company_id": rec["id"]}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Post not found or unauthorized")
    apps = await db.recruitment_applications.find({"post_id": post_id}, {"_id": 0}).sort("user_air", 1).to_list(1000)
    for a in apps:
        if a.get("status") not in ["shortlisted", "offer", "accepted"]:
            a.pop("user_email", None)
            a.pop("user_phone", None)
    return {"applicants": apps, "post": post}

@router.put("/recruitment/applicant/{app_id}/status")
async def update_applicant_status(app_id: str, request: Request):
    rec = await get_current_recruiter(request)
    body = await request.json()
    new_status = body.get("status")
    if new_status not in ["shortlisted", "rejected", "interview", "offer", "accepted"]:
        raise HTTPException(400, "Invalid status")
    app = await db.recruitment_applications.find_one({"id": app_id}, {"_id": 0})
    if not app:
        raise HTTPException(404, "Application not found")
    post = await db.recruitment_posts.find_one({"id": app["post_id"], "company_id": rec["id"]})
    if not post:
        raise HTTPException(403, "Unauthorized")
    await db.recruitment_applications.update_one({"id": app_id}, {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    user_email = app.get("user_email")
    if user_email:
        status_labels = {"shortlisted": "Shortlisted", "interview": "Interview Scheduled", "offer": "Offer Extended", "accepted": "Accepted", "rejected": "Not Selected"}
        colors = {"shortlisted": "#22c55e", "interview": "#8b5cf6", "offer": "#f59e0b", "accepted": "#22c55e", "rejected": "#ef4444"}
        sl = status_labels.get(new_status, new_status.title())
        await send_email(user_email, f"Application Update — {sl}", f'<div style="font-family:system-ui;max-width:500px;margin:0 auto;padding:24px"><h2 style="color:#1e293b">Hi {app.get("user_name","")},</h2><p>Your application for <b>{post.get("title","")}</b> at <b>{rec.get("company_name","")}</b>:</p><div style="background:{colors.get(new_status,"#3b82f6")};color:white;padding:12px 20px;border-radius:12px;text-align:center;font-size:18px;font-weight:bold;margin:16px 0">{sl}</div><p style="color:#64748b;font-size:14px">Track at <a href="{SITE_URL}/my-applications" style="color:#3b82f6">My Applications</a>.</p></div>')
    return {"status": new_status}

# === Hackathon ===
@router.post("/recruitment/hackathon/{hack_id}/register")
async def register_hackathon(hack_id: str, request: Request):
    user = await get_current_student(request)
    existing = await db.recruitment_hackathon_regs.find_one({"hackathon_id": hack_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(400, "Already registered")
    reg = {"id": str(uuid.uuid4()), "hackathon_id": hack_id, "user_id": user["id"], "user_name": user.get("name", ""), "status": "registered", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.recruitment_hackathon_regs.insert_one(reg.copy())
    reg.pop("_id", None)
    return reg

@router.post("/recruitment/hackathon/{hack_id}/submit")
async def submit_hackathon(hack_id: str, data: HackathonSubmission, request: Request):
    user = await get_current_student(request)
    reg = await db.recruitment_hackathon_regs.find_one({"hackathon_id": hack_id, "user_id": user["id"]})
    if not reg:
        raise HTTPException(400, "Not registered")
    await db.recruitment_hackathon_regs.update_one({"hackathon_id": hack_id, "user_id": user["id"]}, {"$set": {"project_link": data.project_link, "description": data.description, "status": "submitted", "submitted_at": datetime.now(timezone.utc).isoformat()}})
    return {"status": "submitted"}

# === Event ===
@router.post("/recruitment/event/{event_id}/register")
async def register_event(event_id: str, request: Request):
    user = await get_current_student(request)
    existing = await db.recruitment_event_regs.find_one({"event_id": event_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(400, "Already registered")
    post = await db.recruitment_posts.find_one({"id": event_id, "post_type": "event"}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Event not found")
    reg_count = await db.recruitment_event_regs.count_documents({"event_id": event_id})
    if post.get("registration_limit") and reg_count >= post["registration_limit"]:
        raise HTTPException(400, "Registration full")
    reg = {"id": str(uuid.uuid4()), "event_id": event_id, "user_id": user["id"], "user_name": user.get("name", ""), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.recruitment_event_regs.insert_one(reg.copy())
    reg.pop("_id", None)
    return reg

# === Analytics ===
@router.get("/recruitment/analytics")
async def recruiter_analytics(request: Request):
    rec = await get_current_recruiter(request)
    cid = rec["id"]
    total_apps = await db.recruitment_applications.count_documents({"company_id": cid})
    shortlisted = await db.recruitment_applications.count_documents({"company_id": cid, "status": "shortlisted"})
    offers = await db.recruitment_applications.count_documents({"company_id": cid, "status": {"$in": ["offer", "accepted"]}})
    accepted = await db.recruitment_applications.count_documents({"company_id": cid, "status": "accepted"})
    posts_count = await db.recruitment_posts.count_documents({"company_id": cid})
    approved = await db.recruitment_posts.count_documents({"company_id": cid, "status": "approved"})
    pending = await db.recruitment_posts.count_documents({"company_id": cid, "status": "pending"})
    followers = await db.recruitment_follows.count_documents({"company_id": cid})
    post_stats = []
    all_posts = await db.recruitment_posts.find({"company_id": cid}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for p in all_posts:
        a = await db.recruitment_applications.count_documents({"post_id": p["id"]})
        s = await db.recruitment_applications.count_documents({"post_id": p["id"], "status": "shortlisted"})
        post_stats.append({"id": p["id"], "title": p["title"], "post_type": p["post_type"], "status": p["status"], "applications": a, "shortlisted": s, "created_at": p["created_at"]})
    return {"total_applications": total_apps, "shortlisted": shortlisted, "offers_sent": offers, "accepted": accepted, "acceptance_rate": round(accepted / offers * 100, 1) if offers > 0 else 0, "total_posts": posts_count, "approved_posts": approved, "pending_posts": pending, "followers": followers, "post_stats": post_stats}

# === Student Profile ===
@router.get("/recruitment/student-profile")
async def get_student_recruitment_profile(request: Request):
    user = await get_current_student(request)
    apps_count = await db.recruitment_applications.count_documents({"user_id": user["id"]})
    quiz_count = await db.recruitment_quiz_attempts.count_documents({"user_id": user["id"]})
    return {"id": user["id"], "name": user.get("name", ""), "email": user.get("email", ""), "avatar": user.get("profile_picture") or user.get("avatar"), "air_rank": user.get("air_rank"), "exam_type": user.get("exam_type", ""), "college": user.get("college", ""), "resume_url": user.get("resume_url", ""), "badges": user.get("badges", []), "applications_count": apps_count, "quizzes_attempted": quiz_count}
