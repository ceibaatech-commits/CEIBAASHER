"""
CEIBAA Recruitment Portal - Admin Recruitment Cell Routes
Handles: Recruiter management, content moderation, global analytics,
         Company verification (GST/PAN/CIN), document management
"""
import os
import uuid
import bcrypt
import resend
import cloudinary
import cloudinary.uploader
from datetime import datetime, timezone, timedelta
from typing import Optional
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Response
from pydantic import BaseModel
from jose import jwt, JWTError
from database import db

router = APIRouter()

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Email
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "onboarding@resend.dev")
SITE_URL = os.getenv("SITE_URL", "https://ceibaa.com")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

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
    # Stage 3: dual-mode — prefer httpOnly session_token cookie, fall back to Bearer header.
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        token = auth[len("Bearer "):] if auth.startswith("Bearer ") else None
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
async def admin_login(data: AdminLogin, request: Request, response: Response):
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
    # Stage 3: set httpOnly session_token cookie so frontend doesn't need to stash the JWT.
    response.set_cookie(
        key="session_token",
        value=token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
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


# ==================== COMPANY VERIFICATION & DOCUMENT MANAGEMENT ====================

@router.get("/recruitment-admin/recruiter/{rec_id}")
async def get_recruiter_detail(rec_id: str, request: Request):
    """Get full recruiter details including verification docs"""
    await get_admin(request)
    rec = await db.recruiters.find_one({"id": rec_id}, {"_id": 0, "password_hash": 0})
    if not rec:
        raise HTTPException(404, "Recruiter not found")
    rec["posts_count"] = await db.recruitment_posts.count_documents({"company_id": rec_id})
    rec["apps_count"] = await db.recruitment_applications.count_documents({"company_id": rec_id})
    return rec

class CompanyVerificationUpdate(BaseModel):
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    cin_number: Optional[str] = None
    verified_email: Optional[bool] = None
    verified_mobile: Optional[bool] = None
    verified_gst: Optional[bool] = None
    verified_pan: Optional[bool] = None
    verified_cin: Optional[bool] = None
    admin_notes: Optional[str] = None

@router.put("/recruitment-admin/recruiter/{rec_id}/verification")
async def update_company_verification(rec_id: str, data: CompanyVerificationUpdate, request: Request):
    """Admin edits company GST/PAN/CIN and verification status"""
    await get_admin(request)
    rec = await db.recruiters.find_one({"id": rec_id})
    if not rec:
        raise HTTPException(404, "Recruiter not found")
    update = {}
    for field in ["gst_number", "pan_number", "cin_number", "verified_email", "verified_mobile",
                   "verified_gst", "verified_pan", "verified_cin", "admin_notes"]:
        val = getattr(data, field, None)
        if val is not None:
            update[field] = val
    if update:
        update["verification_updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.recruiters.update_one({"id": rec_id}, {"$set": update})
    return {"updated": list(update.keys())}

@router.post("/recruitment-admin/recruiter/{rec_id}/upload-document")
async def upload_company_document(rec_id: str, request: Request, file: UploadFile = File(...), doc_type: str = "gst_certificate"):
    """Upload company verification document (GST cert, PAN card, CIN cert, incorporation cert)"""
    await get_admin(request)
    rec = await db.recruiters.find_one({"id": rec_id})
    if not rec:
        raise HTTPException(404, "Recruiter not found")
    allowed_types = ["gst_certificate", "pan_card", "cin_certificate", "incorporation_certificate"]
    if doc_type not in allowed_types:
        raise HTTPException(400, f"doc_type must be one of: {allowed_types}")
    if not file.filename:
        raise HTTPException(400, "No file provided")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(400, "Only PDF, JPG, PNG files allowed")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10MB)")
    try:
        resource_type = "raw" if ext == ".pdf" else "image"
        result = cloudinary.uploader.upload(
            content,
            resource_type=resource_type,
            folder=f"company_docs/{rec_id}",
            public_id=f"{doc_type}_{uuid.uuid4().hex[:8]}",
            overwrite=True,
        )
        doc_url = result["secure_url"]
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")
    # Store document URL on the recruiter
    doc_field = f"{doc_type}_url"
    await db.recruiters.update_one({"id": rec_id}, {"$set": {
        doc_field: doc_url,
        f"{doc_type}_uploaded_at": datetime.now(timezone.utc).isoformat()
    }})
    return {"url": doc_url, "doc_type": doc_type, "filename": file.filename}

@router.post("/recruitment-admin/recruiter/{rec_id}/send-verification-email")
async def send_verification_email(rec_id: str, request: Request):
    """Send verification email to the company"""
    await get_admin(request)
    rec = await db.recruiters.find_one({"id": rec_id}, {"_id": 0, "password_hash": 0})
    if not rec:
        raise HTTPException(404, "Recruiter not found")
    email = rec.get("email")
    if not email:
        raise HTTPException(400, "No email on file")
    verification_code = uuid.uuid4().hex[:8].upper()
    await db.recruiters.update_one({"id": rec_id}, {"$set": {
        "email_verification_code": verification_code,
        "email_verification_sent_at": datetime.now(timezone.utc).isoformat()
    }})
    if not RESEND_API_KEY:
        return {"sent": False, "reason": "Email service not configured", "code": verification_code}
    try:
        resend.Emails.send({
            "from": SENDER_EMAIL, "to": [email],
            "subject": f"CEIBAA — Email Verification for {rec.get('company_name', '')}",
            "html": f"""
                <div style="font-family:system-ui;max-width:500px;margin:0 auto;padding:24px">
                    <h2 style="color:#1e293b">Email Verification</h2>
                    <p>Hi {rec.get('company_name','')},</p>
                    <p>Please verify your company email by entering this code in the CEIBAA portal:</p>
                    <div style="background:#f1f5f9;padding:20px;border-radius:12px;text-align:center;margin:16px 0">
                        <span style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#3b82f6">{verification_code}</span>
                    </div>
                    <p style="color:#64748b;font-size:14px">This code expires in 24 hours.</p>
                    <p style="color:#94a3b8;font-size:12px;margin-top:24px">— CEIBAA Recruitment Cell</p>
                </div>
            """
        })
        return {"sent": True, "to": email}
    except Exception as e:
        return {"sent": False, "error": str(e), "code": verification_code}

@router.post("/recruitment-admin/recruiter/{rec_id}/verify-email-code")
async def verify_email_code(rec_id: str, request: Request):
    """Admin verifies the code returned by the company"""
    await get_admin(request)
    body = await request.json()
    code = body.get("code", "").strip().upper()
    rec = await db.recruiters.find_one({"id": rec_id})
    if not rec:
        raise HTTPException(404, "Recruiter not found")
    stored_code = rec.get("email_verification_code", "")
    if not stored_code or code != stored_code:
        raise HTTPException(400, "Invalid verification code")
    await db.recruiters.update_one({"id": rec_id}, {"$set": {
        "verified_email": True,
        "email_verified_at": datetime.now(timezone.utc).isoformat()
    }, "$unset": {"email_verification_code": ""}})
    return {"verified": True}
