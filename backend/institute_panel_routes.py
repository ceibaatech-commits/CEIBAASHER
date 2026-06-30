from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import os
import re
import secrets
from motor.motor_asyncio import AsyncIOMotorClient
from jose import jwt, JWTError
import bcrypt
from utils.email_service import send_email

db = None


def init_db(database):
    global db
    db = database


router = APIRouter(prefix="/api/institutes", tags=["institutes"])

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def _create_owner_token(owner_doc: dict) -> str:
    payload = {
        "sub": owner_doc["id"],
        "institute_id": owner_doc["institute_id"],
        "role": "institute_owner",
        "iat": int(datetime.utcnow().timestamp())
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _extract_bearer_token(request: Request) -> str:
    header = request.headers.get("Authorization", "")
    if header.lower().startswith("bearer "):
        return header[7:].strip()
    return ""


async def _require_institute_owner(request: Request, target_institute_id: str) -> dict:
    token = _extract_bearer_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Missing owner token")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid owner token")

    role = payload.get("role")
    institute_id = payload.get("institute_id")
    owner_id = payload.get("sub")

    if role != "institute_owner":
        raise HTTPException(status_code=403, detail="Insufficient role")

    if institute_id != target_institute_id:
        raise HTTPException(status_code=403, detail="You can only edit your own institute panel")

    owner_doc = await db.institute_owner_accounts.find_one({"id": owner_id, "institute_id": institute_id}, {"_id": 0})
    if not owner_doc:
        raise HTTPException(status_code=401, detail="Owner account not found")

    return owner_doc


class InstituteProfileUpsert(BaseModel):
    institute_name: str = Field(..., min_length=2, max_length=120)
    logo_url: Optional[str] = ""
    description: Optional[str] = ""
    website_url: Optional[str] = ""


class VideoCreate(BaseModel):
    institute_id: str
    title: str = Field(..., min_length=3, max_length=180)
    description: Optional[str] = ""
    video_url: str
    thumbnail_url: Optional[str] = ""
    exam_id: Optional[str] = ""
    subject: Optional[str] = ""


class MCQQuestion(BaseModel):
    question: str = Field(..., min_length=5)
    options: List[str] = Field(..., min_length=2, max_length=6)
    correct_index: int
    explanation: Optional[str] = ""


class MCQSetCreate(BaseModel):
    institute_id: str
    title: str = Field(..., min_length=3, max_length=180)
    description: Optional[str] = ""
    thumbnail_url: Optional[str] = ""
    exam_id: Optional[str] = ""
    subject: Optional[str] = ""
    questions: List[MCQQuestion] = Field(..., min_length=1)


class MCQAttemptSubmit(BaseModel):
    user_name: str = Field(..., min_length=2, max_length=80)
    answers: List[int]


class InstituteOwnerRegister(BaseModel):
    institute_id: str = Field(..., min_length=3, max_length=120)
    institute_name: str = Field(..., min_length=2, max_length=120)
    owner_name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=180)
    password: str = Field(..., min_length=6, max_length=120)


class InstituteOwnerLogin(BaseModel):
    institute_id: str = Field(..., min_length=3, max_length=120)
    email: str = Field(..., min_length=5, max_length=180)
    password: str = Field(..., min_length=6, max_length=120)


class InstituteRegisterSendOTP(BaseModel):
    email: str = Field(..., min_length=5, max_length=180)


class InstituteRegisterVerifyOTP(BaseModel):
    email: str = Field(..., min_length=5, max_length=180)
    code: str = Field(..., min_length=6, max_length=6)
    institute_name: str = Field(..., min_length=2, max_length=120)
    owner_name: str = Field(..., min_length=2, max_length=120)
    password: str = Field(..., min_length=6, max_length=120)


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text


@router.post("/auth/register/send-otp")
async def send_register_otp(payload: InstituteRegisterSendOTP):
    email = payload.email.lower().strip()
    existing = await db.institute_owner_accounts.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="An owner account already exists with this email")

    code = "".join(secrets.choice("0123456789") for _ in range(6))
    
    await db.institute_register_otps.delete_many({"email": email})
    await db.institute_register_otps.insert_one({
        "email": email,
        "code": code,
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    })

    html_content = f"""
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #0f172a;">Verify your Institute Owner Email</h2>
      <p style="color: #475569;">Use the verification code below to verify your email address and generate your new Institute ID:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #f1f5f9; border-radius: 8px; text-align: center; margin: 20px 0; color: #0f172a; font-family: monospace;">
        {code}
      </div>
      <p style="color: #64748b; font-size: 12px;">This code will expire in 10 minutes.</p>
    </div>
    """
    try:
        await send_email(email, "Verify your Institute Owner Email", html_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send verification email: " + str(e))

    return {"success": True, "message": "Verification code sent to your email"}


@router.post("/auth/register/verify-otp")
async def verify_register_otp(payload: InstituteRegisterVerifyOTP):
    email = payload.email.lower().strip()
    
    otp_doc = await db.institute_register_otps.find_one({"email": email})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="No verification code found or code expired")

    if otp_doc["code"] != payload.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if otp_doc["expires_at"] < datetime.utcnow():
        await db.institute_register_otps.delete_one({"email": email})
        raise HTTPException(status_code=400, detail="Verification code has expired")

    await db.institute_register_otps.delete_one({"email": email})

    base_id = _slugify(payload.institute_name)
    if len(base_id) < 3:
        base_id = "inst"
    
    institute_id = base_id
    counter = 1
    while await db.institute_owner_accounts.find_one({"institute_id": institute_id}):
        suffix = "".join(secrets.choice("abcdefghijklmnopqrstuvwxyz0123456789") for _ in range(3))
        institute_id = f"{base_id}-{suffix}"
        counter += 1
        if counter > 10:
            institute_id = f"{base_id}-{secrets.token_hex(4)}"
            break

    owner_doc = {
        "id": str(uuid.uuid4()),
        "institute_id": institute_id,
        "institute_name": payload.institute_name,
        "owner_name": payload.owner_name,
        "email": email,
        "password_hash": _hash_password(payload.password),
        "role": "institute_owner",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    await db.institute_owner_accounts.insert_one(owner_doc)

    await db.institute_profiles.update_one(
        {"institute_id": institute_id},
        {
            "$setOnInsert": {
                "institute_id": institute_id,
                "institute_name": payload.institute_name,
                "logo_url": "",
                "description": "",
                "website_url": "",
                "created_at": datetime.utcnow().isoformat()
            },
            "$set": {"updated_at": datetime.utcnow().isoformat()}
        },
        upsert=True
    )

    token = _create_owner_token(owner_doc)
    return {
        "success": True,
        "token": token,
        "institute_id": institute_id,
        "owner": {
            "id": owner_doc["id"],
            "institute_id": owner_doc["institute_id"],
            "owner_name": owner_doc["owner_name"],
            "email": owner_doc["email"],
            "role": owner_doc["role"]
        }
    }


@router.post("/auth/register")
async def register_institute_owner(payload: InstituteOwnerRegister):
    existing = await db.institute_owner_accounts.find_one({
        "institute_id": payload.institute_id,
        "email": payload.email.lower().strip()
    })
    if existing:
        raise HTTPException(status_code=409, detail="Owner already exists for this institute/email")

    owner_doc = {
        "id": str(uuid.uuid4()),
        "institute_id": payload.institute_id,
        "institute_name": payload.institute_name,
        "owner_name": payload.owner_name,
        "email": payload.email.lower().strip(),
        "password_hash": _hash_password(payload.password),
        "role": "institute_owner",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    await db.institute_owner_accounts.insert_one(owner_doc)

    # Ensure profile exists at registration time.
    await db.institute_profiles.update_one(
        {"institute_id": payload.institute_id},
        {
            "$setOnInsert": {
                "institute_id": payload.institute_id,
                "institute_name": payload.institute_name,
                "logo_url": "",
                "description": "",
                "website_url": "",
                "created_at": datetime.utcnow().isoformat()
            },
            "$set": {"updated_at": datetime.utcnow().isoformat()}
        },
        upsert=True
    )

    token = _create_owner_token(owner_doc)
    return {
        "success": True,
        "token": token,
        "owner": {
            "id": owner_doc["id"],
            "institute_id": owner_doc["institute_id"],
            "owner_name": owner_doc["owner_name"],
            "email": owner_doc["email"],
            "role": owner_doc["role"]
        }
    }


@router.post("/auth/login")
async def login_institute_owner(payload: InstituteOwnerLogin):
    owner = await db.institute_owner_accounts.find_one({
        "institute_id": payload.institute_id,
        "email": payload.email.lower().strip()
    }, {"_id": 0})

    if not owner or not _verify_password(payload.password, owner.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid institute owner credentials")

    await db.institute_owner_accounts.update_one(
        {"id": owner["id"]},
        {"$set": {"updated_at": datetime.utcnow().isoformat(), "last_login_at": datetime.utcnow().isoformat()}}
    )

    token = _create_owner_token(owner)
    return {
        "success": True,
        "token": token,
        "owner": {
            "id": owner["id"],
            "institute_id": owner["institute_id"],
            "owner_name": owner.get("owner_name", ""),
            "email": owner["email"],
            "role": owner.get("role", "institute_owner")
        }
    }


@router.get("/auth/verify")
async def verify_institute_owner(request: Request):
    token = _extract_bearer_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Missing owner token")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid owner token")

    institute_id = payload.get("institute_id")
    if not institute_id:
        raise HTTPException(status_code=401, detail="Invalid owner token payload")

    owner = await _require_institute_owner(request, target_institute_id=institute_id)
    return {
        "success": True,
        "owner": {
            "id": owner["id"],
            "institute_id": owner["institute_id"],
            "owner_name": owner.get("owner_name", ""),
            "email": owner["email"],
            "role": owner.get("role", "institute_owner")
        }
    }


@router.get("/")
async def list_institutes():
    cursor = db.institute_profiles.find({}, {"_id": 0})
    profiles = await cursor.to_list(length=100)
    return {"success": True, "institutes": profiles}


@router.get("/{institute_id}/profile")
async def get_institute_profile(institute_id: str):
    profile = await db.institute_profiles.find_one({"institute_id": institute_id}, {"_id": 0})
    if not profile:
        return {
            "success": True,
            "is_listed": False,
            "profile": {
                "institute_id": institute_id,
                "institute_name": institute_id.replace("-", " ").title(),
                "logo_url": "",
                "description": "",
                "website_url": ""
            }
        }
    return {"success": True, "is_listed": True, "profile": profile}


@router.put("/{institute_id}/profile")
async def upsert_institute_profile(institute_id: str, payload: InstituteProfileUpsert, request: Request):
    await _require_institute_owner(request, institute_id)
    profile_doc = {
        "institute_id": institute_id,
        "institute_name": payload.institute_name,
        "logo_url": payload.logo_url,
        "description": payload.description,
        "website_url": payload.website_url,
        "updated_at": datetime.utcnow().isoformat()
    }
    await db.institute_profiles.update_one(
        {"institute_id": institute_id},
        {"$set": profile_doc},
        upsert=True
    )
    return {"success": True, "profile": profile_doc}


@router.get("/{institute_id}/videos")
async def list_institute_videos(institute_id: str):
    cursor = db.institute_videos.find({"institute_id": institute_id}, {"_id": 0}).sort("created_at", -1)
    videos = await cursor.to_list(length=100)
    return {"success": True, "videos": videos}


@router.post("/videos")
async def create_institute_video(payload: VideoCreate, request: Request):
    await _require_institute_owner(request, payload.institute_id)
    video_doc = {
        "id": str(uuid.uuid4()),
        "institute_id": payload.institute_id,
        "title": payload.title,
        "description": payload.description,
        "video_url": payload.video_url,
        "thumbnail_url": payload.thumbnail_url,
        "exam_id": payload.exam_id,
        "subject": payload.subject,
        "created_at": datetime.utcnow().isoformat()
    }
    await db.institute_videos.insert_one(video_doc)
    return {"success": True, "video": video_doc}


@router.get("/{institute_id}/mcqs")
async def list_institute_mcq_sets(institute_id: str):
    cursor = db.institute_mcq_sets.find({"institute_id": institute_id}, {"_id": 0}).sort("created_at", -1)
    mcqs = await cursor.to_list(length=100)
    return {"success": True, "mcq_sets": mcqs}


@router.post("/mcqs")
async def create_institute_mcq_set(payload: MCQSetCreate, request: Request):
    await _require_institute_owner(request, payload.institute_id)
    mcq_set_doc = {
        "id": str(uuid.uuid4()),
        "institute_id": payload.institute_id,
        "title": payload.title,
        "description": payload.description,
        "thumbnail_url": payload.thumbnail_url,
        "exam_id": payload.exam_id,
        "subject": payload.subject,
        "question_count": len(payload.questions),
        "questions": [q.dict() for q in payload.questions],
        "attempt_count": 0,
        "created_at": datetime.utcnow().isoformat()
    }
    await db.institute_mcq_sets.insert_one(mcq_set_doc)
    return {"success": True, "mcq_set": mcq_set_doc}


@router.get("/mcqs/{mcq_id}")
async def get_institute_mcq_set_public(mcq_id: str):
    mcq_set = await db.institute_mcq_sets.find_one({"id": mcq_id}, {"_id": 0})
    if not mcq_set:
        raise HTTPException(status_code=404, detail="MCQ set not found")
    return {"success": True, "mcq_set": mcq_set}


@router.post("/mcqs/{mcq_id}/attempt")
async def submit_mcq_attempt(mcq_id: str, payload: MCQAttemptSubmit):
    mcq_set = await db.institute_mcq_sets.find_one({"id": mcq_id})
    if not mcq_set:
        raise HTTPException(status_code=404, detail="MCQ set not found")

    questions = mcq_set.get("questions", [])
    correct = 0
    total = len(questions)

    for idx, q in enumerate(questions):
        user_ans = payload.answers[idx] if idx < len(payload.answers) else -1
        if user_ans == q.get("correct_index"):
            correct += 1

    score_percent = round((correct / total) * 100, 1) if total > 0 else 0

    attempt_doc = {
        "id": str(uuid.uuid4()),
        "mcq_set_id": mcq_id,
        "user_name": payload.user_name,
        "score": correct,
        "total": total,
        "score_percent": score_percent,
        "created_at": datetime.utcnow().isoformat()
    }
    await db.institute_mcq_attempts.insert_one(attempt_doc)

    await db.institute_mcq_sets.update_one(
        {"id": mcq_id},
        {"$inc": {"attempt_count": 1}}
    )

    return {
        "success": True,
        "result": {
            "correct": correct,
            "total": total,
            "score_percent": score_percent
        }
    }