"""
CEIBAA Recruitment Portal - Main Routes
Handles: Companies, Posts (Job/Quiz/Hackathon/Event), Applications, Feed, Quiz Engine
"""
import os
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from jose import jwt, JWTError
from database import db

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "ceibaa-super-secret-key-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# --- Brute Force Protection ---
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
_recruiter_login_attempts = defaultdict(list)

def _check_recruiter_rate_limit(ip: str, email: str):
    key = f"rec:{ip}:{email}"
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=LOCKOUT_MINUTES)
    _recruiter_login_attempts[key] = [t for t in _recruiter_login_attempts[key] if t > cutoff]
    if len(_recruiter_login_attempts[key]) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(429, f"Too many failed login attempts. Try again in {LOCKOUT_MINUTES} minutes.")

def _record_recruiter_failed(ip: str, email: str):
    _recruiter_login_attempts[f"rec:{ip}:{email}"].append(datetime.now(timezone.utc))

def _clear_recruiter_attempts(ip: str, email: str):
    _recruiter_login_attempts.pop(f"rec:{ip}:{email}", None)

# --- Auth helpers ---
async def get_current_student(request: Request):
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else None
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
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else None
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

# --- Pydantic Models ---
class RecruiterLogin(BaseModel):
    email: str
    password: str

class PostCreate(BaseModel):
    post_type: str  # job, quiz, hackathon, event
    title: str
    description: Optional[str] = ""
    # Job fields
    role_type: Optional[str] = None  # Full-time, Internship, Part-time
    location: Optional[str] = None
    salary: Optional[str] = None
    air_filter: Optional[int] = None
    min_qualification: Optional[str] = None
    deadline: Optional[str] = None
    screening_questions: Optional[List[str]] = []
    # Quiz fields
    num_questions: Optional[int] = None
    time_limit: Optional[int] = None
    reward: Optional[str] = None
    questions: Optional[list] = []
    top_n_shortlist: Optional[int] = None
    # Hackathon fields
    theme: Optional[str] = None
    prizes: Optional[dict] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    team_size: Optional[int] = 1
    submission_format: Optional[str] = None
    # Event fields
    event_type: Optional[str] = None
    event_date: Optional[str] = None
    platform: Optional[str] = None
    registration_limit: Optional[int] = None

class QuizSubmission(BaseModel):
    answers: dict  # {question_index: selected_option_index}

class HackathonSubmission(BaseModel):
    project_link: str
    description: Optional[str] = ""

class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    about: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    gst_number: Optional[str] = None
    employee_count: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    founding_year: Optional[str] = None

# --- Recruiter Auth ---
@router.post("/recruitment/recruiter/login")
async def recruiter_login(data: RecruiterLogin, request: Request):
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
    token = jwt.encode(
        {"sub": rec["id"], "email": email, "role": "recruiter",
         "exp": datetime.now(timezone.utc) + timedelta(days=7)},
        JWT_SECRET, algorithm=JWT_ALGORITHM
    )
    rec_safe = {k: v for k, v in rec.items() if k != "password_hash"}
    return {"access_token": token, "token_type": "bearer", "recruiter": rec_safe}

@router.get("/recruitment/recruiter/me")
async def recruiter_me(request: Request):
    rec = await get_current_recruiter(request)
    return {k: v for k, v in rec.items() if k != "password_hash"}

# --- Company Channel ---
@router.put("/recruitment/company/update")
async def update_company(data: CompanyUpdate, request: Request):
    rec = await get_current_recruiter(request)
    update = {k: v for k, v in data.dict().items() if v is not None}
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.recruiters.update_one({"id": rec["id"]}, {"$set": update})
    return {"status": "updated"}

@router.get("/recruitment/companies")
async def list_companies(
    industry: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    query = {"status": {"$ne": "revoked"}}
    if industry:
        query["industry"] = {"$regex": industry, "$options": "i"}
    if search:
        query["$or"] = [
            {"company_name": {"$regex": search, "$options": "i"}},
            {"industry": {"$regex": search, "$options": "i"}}
        ]
    skip = (page - 1) * limit
    companies = await db.recruiters.find(query, {"_id": 0, "password_hash": 0}).sort("company_name", 1).skip(skip).limit(limit).to_list(limit)
    total = await db.recruiters.count_documents(query)
    # Add follower and post counts
    for c in companies:
        c["followers_count"] = await db.recruitment_follows.count_documents({"company_id": c["id"]})
        c["posts_count"] = await db.recruitment_posts.count_documents({"company_id": c["id"], "status": "approved"})
        c["open_roles"] = await db.recruitment_posts.count_documents({"company_id": c["id"], "status": "approved", "post_type": {"$in": ["job", "internship"]}})
    return {"companies": companies, "total": total, "page": page}

@router.get("/recruitment/company/{slug}")
async def get_company(slug: str, request: Request):
    company = await db.recruiters.find_one(
        {"$or": [{"slug": slug}, {"id": slug}]},
        {"_id": 0, "password_hash": 0}
    )
    if not company:
        raise HTTPException(404, "Company not found")
    company["followers_count"] = await db.recruitment_follows.count_documents({"company_id": company["id"]})
    company["posts_count"] = await db.recruitment_posts.count_documents({"company_id": company["id"], "status": "approved"})
    company["open_roles"] = await db.recruitment_posts.count_documents({"company_id": company["id"], "status": "approved", "post_type": {"$in": ["job", "internship"]}})
    # Check if current user follows
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

# --- Follow / Unfollow ---
@router.post("/recruitment/follow/{company_id}")
async def follow_company(company_id: str, request: Request):
    user = await get_current_student(request)
    existing = await db.recruitment_follows.find_one({"user_id": user["id"], "company_id": company_id})
    if existing:
        await db.recruitment_follows.delete_one({"user_id": user["id"], "company_id": company_id})
        return {"status": "unfollowed"}
    await db.recruitment_follows.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "company_id": company_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"status": "followed"}

# --- Posts CRUD (Recruiter) ---
@router.post("/recruitment/posts")
async def create_post(data: PostCreate, request: Request):
    rec = await get_current_recruiter(request)
    post = {
        "id": str(uuid.uuid4()),
        "company_id": rec["id"],
        "company_name": rec.get("company_name", ""),
        "company_logo": rec.get("logo_url", ""),
        "status": "pending",  # needs admin approval
        **data.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "likes_count": 0,
        "comments_count": 0,
    }
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

# --- Student Feed ---
@router.get("/recruitment/feed")
async def student_feed(request: Request, page: int = 1, limit: int = 20):
    try:
        user = await get_current_student(request)
        follows = await db.recruitment_follows.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
        followed_ids = [f["company_id"] for f in follows]
        if followed_ids:
            query = {"company_id": {"$in": followed_ids}, "status": "approved"}
        else:
            query = {"status": "approved"}
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

# --- Applications ---
@router.post("/recruitment/apply/{post_id}")
async def apply_to_post(post_id: str, request: Request):
    user = await get_current_student(request)
    post = await db.recruitment_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Post not found")
    if post.get("status") != "approved":
        raise HTTPException(400, "Post not available")
    # Check AIR filter
    user_air = user.get("air_rank")
    if post.get("air_filter") and user_air and user_air > post["air_filter"]:
        raise HTTPException(403, "Your AIR rank does not meet the eligibility criteria")
    # Check duplicate
    existing = await db.recruitment_applications.find_one({"post_id": post_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(400, "Already applied")
    app = {
        "id": str(uuid.uuid4()),
        "post_id": post_id,
        "company_id": post["company_id"],
        "user_id": user["id"],
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "user_air": user.get("air_rank"),
        "user_exam_type": user.get("exam_type", ""),
        "user_college": user.get("college", ""),
        "user_avatar": user.get("profile_picture") or user.get("avatar"),
        "status": "applied",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
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
    # Only reveal contact info for shortlisted applicants
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
    await db.recruitment_applications.update_one(
        {"id": app_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": new_status}

# --- Quiz Attempt ---
@router.get("/recruitment/quiz/{quiz_id}/start")
async def start_quiz(quiz_id: str, request: Request):
    user = await get_current_student(request)
    post = await db.recruitment_posts.find_one({"id": quiz_id, "post_type": "quiz"}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Quiz not found")
    # Check if already attempted
    existing = await db.recruitment_quiz_attempts.find_one({"quiz_id": quiz_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(400, "Quiz already attempted")
    # Return questions without answers
    questions = []
    for q in (post.get("questions") or []):
        questions.append({
            "question": q.get("question", ""),
            "options": q.get("options", []),
        })
    return {"quiz": {"id": post["id"], "title": post["title"], "time_limit": post.get("time_limit", 30), "questions": questions}}

@router.post("/recruitment/quiz/{quiz_id}/submit")
async def submit_quiz(quiz_id: str, data: QuizSubmission, request: Request):
    user = await get_current_student(request)
    post = await db.recruitment_posts.find_one({"id": quiz_id, "post_type": "quiz"}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Quiz not found")
    existing = await db.recruitment_quiz_attempts.find_one({"quiz_id": quiz_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(400, "Already submitted")
    # Score
    questions = post.get("questions") or []
    score = 0
    total = len(questions)
    for i, q in enumerate(questions):
        if str(i) in data.answers and data.answers[str(i)] == q.get("correct_answer"):
            score += 1
    attempt = {
        "id": str(uuid.uuid4()),
        "quiz_id": quiz_id,
        "user_id": user["id"],
        "user_name": user.get("name", ""),
        "user_air": user.get("air_rank"),
        "answers": data.answers,
        "score": score,
        "total": total,
        "percentage": round((score / total * 100) if total > 0 else 0, 1),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.recruitment_quiz_attempts.insert_one(attempt.copy())
    attempt.pop("_id", None)
    return attempt

@router.get("/recruitment/quiz/{quiz_id}/leaderboard")
async def quiz_leaderboard(quiz_id: str):
    attempts = await db.recruitment_quiz_attempts.find(
        {"quiz_id": quiz_id}, {"_id": 0}
    ).sort("score", -1).to_list(100)
    return {"leaderboard": attempts}

# --- Hackathon ---
@router.post("/recruitment/hackathon/{hack_id}/register")
async def register_hackathon(hack_id: str, request: Request):
    user = await get_current_student(request)
    existing = await db.recruitment_hackathon_regs.find_one({"hackathon_id": hack_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(400, "Already registered")
    reg = {
        "id": str(uuid.uuid4()),
        "hackathon_id": hack_id,
        "user_id": user["id"],
        "user_name": user.get("name", ""),
        "status": "registered",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.recruitment_hackathon_regs.insert_one(reg.copy())
    reg.pop("_id", None)
    return reg

@router.post("/recruitment/hackathon/{hack_id}/submit")
async def submit_hackathon(hack_id: str, data: HackathonSubmission, request: Request):
    user = await get_current_student(request)
    reg = await db.recruitment_hackathon_regs.find_one({"hackathon_id": hack_id, "user_id": user["id"]})
    if not reg:
        raise HTTPException(400, "Not registered")
    await db.recruitment_hackathon_regs.update_one(
        {"hackathon_id": hack_id, "user_id": user["id"]},
        {"$set": {"project_link": data.project_link, "description": data.description,
                  "status": "submitted", "submitted_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "submitted"}

# --- Event Registration ---
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
    reg = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "user_id": user["id"],
        "user_name": user.get("name", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.recruitment_event_regs.insert_one(reg.copy())
    reg.pop("_id", None)
    return reg

# --- Recruiter Analytics ---
@router.get("/recruitment/analytics")
async def recruiter_analytics(request: Request):
    rec = await get_current_recruiter(request)
    cid = rec["id"]
    total_apps = await db.recruitment_applications.count_documents({"company_id": cid})
    shortlisted = await db.recruitment_applications.count_documents({"company_id": cid, "status": "shortlisted"})
    offers = await db.recruitment_applications.count_documents({"company_id": cid, "status": {"$in": ["offer", "accepted"]}})
    accepted = await db.recruitment_applications.count_documents({"company_id": cid, "status": "accepted"})
    posts = await db.recruitment_posts.count_documents({"company_id": cid})
    approved = await db.recruitment_posts.count_documents({"company_id": cid, "status": "approved"})
    pending = await db.recruitment_posts.count_documents({"company_id": cid, "status": "pending"})
    followers = await db.recruitment_follows.count_documents({"company_id": cid})
    # Per-post stats
    post_stats = []
    all_posts = await db.recruitment_posts.find({"company_id": cid}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for p in all_posts:
        apps = await db.recruitment_applications.count_documents({"post_id": p["id"]})
        short = await db.recruitment_applications.count_documents({"post_id": p["id"], "status": "shortlisted"})
        post_stats.append({
            "id": p["id"], "title": p["title"], "post_type": p["post_type"],
            "status": p["status"], "applications": apps, "shortlisted": short,
            "created_at": p["created_at"]
        })
    return {
        "total_applications": total_apps,
        "shortlisted": shortlisted,
        "offers_sent": offers,
        "accepted": accepted,
        "acceptance_rate": round(accepted / offers * 100, 1) if offers > 0 else 0,
        "total_posts": posts,
        "approved_posts": approved,
        "pending_posts": pending,
        "followers": followers,
        "post_stats": post_stats
    }

# --- Student Profile for Recruitment ---
@router.get("/recruitment/student-profile")
async def get_student_recruitment_profile(request: Request):
    user = await get_current_student(request)
    # Get badges count
    apps_count = await db.recruitment_applications.count_documents({"user_id": user["id"]})
    quiz_count = await db.recruitment_quiz_attempts.count_documents({"user_id": user["id"]})
    return {
        "id": user["id"],
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "avatar": user.get("profile_picture") or user.get("avatar"),
        "air_rank": user.get("air_rank"),
        "exam_type": user.get("exam_type", ""),
        "college": user.get("college", ""),
        "school": user.get("school", ""),
        "state": user.get("state", ""),
        "skills": user.get("skills", []),
        "linkedin": user.get("linkedin", ""),
        "github": user.get("github", ""),
        "resume_url": user.get("resume_url", ""),
        "badges": user.get("badges", []),
        "applications_count": apps_count,
        "quizzes_attempted": quiz_count
    }


# --- Like / Unlike Post ---
@router.post("/recruitment/posts/{post_id}/like")
async def toggle_like(post_id: str, request: Request):
    user = await get_current_student(request)
    post = await db.recruitment_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(404, "Post not found")
    existing = await db.recruitment_likes.find_one({"user_id": user["id"], "post_id": post_id})
    if existing:
        await db.recruitment_likes.delete_one({"user_id": user["id"], "post_id": post_id})
        await db.recruitment_posts.update_one({"id": post_id}, {"$inc": {"likes_count": -1}})
        return {"liked": False, "likes_count": max((post.get("likes_count", 0) - 1), 0)}
    await db.recruitment_likes.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "post_id": post_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.recruitment_posts.update_one({"id": post_id}, {"$inc": {"likes_count": 1}})
    return {"liked": True, "likes_count": post.get("likes_count", 0) + 1}

# --- Comment on Post ---
class CommentCreate(BaseModel):
    text: str

@router.post("/recruitment/posts/{post_id}/comment")
async def add_comment(post_id: str, data: CommentCreate, request: Request):
    user = await get_current_student(request)
    post = await db.recruitment_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(404, "Post not found")
    comment = {
        "id": str(uuid.uuid4()), "post_id": post_id, "user_id": user["id"],
        "user_name": user.get("name", "Anonymous"),
        "user_avatar": user.get("profile_picture") or user.get("avatar", ""),
        "text": data.text.strip(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.recruitment_comments.insert_one(comment.copy())
    comment.pop("_id", None)
    await db.recruitment_posts.update_one({"id": post_id}, {"$inc": {"comments_count": 1}})
    return comment

@router.get("/recruitment/posts/{post_id}/comments")
async def get_comments(post_id: str):
    comments = await db.recruitment_comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"comments": comments}

# --- Bookmark / Save Post ---
@router.post("/recruitment/posts/{post_id}/bookmark")
async def toggle_bookmark(post_id: str, request: Request):
    user = await get_current_student(request)
    post = await db.recruitment_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(404, "Post not found")
    existing = await db.recruitment_bookmarks.find_one({"user_id": user["id"], "post_id": post_id})
    if existing:
        await db.recruitment_bookmarks.delete_one({"user_id": user["id"], "post_id": post_id})
        return {"bookmarked": False}
    await db.recruitment_bookmarks.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "post_id": post_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"bookmarked": True}

@router.get("/recruitment/my-bookmarks")
async def get_my_bookmarks(request: Request):
    user = await get_current_student(request)
    bookmarks = await db.recruitment_bookmarks.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    post_ids = [b["post_id"] for b in bookmarks]
    posts = []
    for pid in post_ids:
        post = await db.recruitment_posts.find_one({"id": pid}, {"_id": 0})
        if post:
            company = await db.recruiters.find_one({"id": post["company_id"]}, {"_id": 0, "password_hash": 0})
            if company:
                post["company_name"] = company.get("company_name", "")
                post["company_logo"] = company.get("logo_url", "")
                post["company_slug"] = company.get("slug", "")
            posts.append(post)
    return {"posts": posts}

# --- Share Post (track share count) ---
@router.post("/recruitment/posts/{post_id}/share")
async def share_post(post_id: str):
    post = await db.recruitment_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(404, "Post not found")
    await db.recruitment_posts.update_one({"id": post_id}, {"$inc": {"shares_count": 1}})
    return {"shared": True, "share_url": f"/apply/{post_id}" if post.get("post_type") in ["job", "internship"] else f"/quiz-recruit/{post_id}" if post.get("post_type") == "quiz" else f"/hackathon/{post_id}"}

# --- Check user interactions on feed posts ---
@router.get("/recruitment/my-interactions")
async def get_my_interactions(request: Request):
    user = await get_current_student(request)
    likes = await db.recruitment_likes.find({"user_id": user["id"]}, {"_id": 0, "post_id": 1}).to_list(500)
    bookmarks = await db.recruitment_bookmarks.find({"user_id": user["id"]}, {"_id": 0, "post_id": 1}).to_list(500)
    return {
        "liked_post_ids": [l["post_id"] for l in likes],
        "bookmarked_post_ids": [b["post_id"] for b in bookmarks]
    }
