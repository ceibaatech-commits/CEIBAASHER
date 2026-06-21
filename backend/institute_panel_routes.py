from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid
import os
from motor.motor_asyncio import AsyncIOMotorClient
from jose import jwt, JWTError
import bcrypt

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

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


@router.get("/{institute_id}/profile")
async def get_institute_profile(institute_id: str):
    profile = await db.institute_profiles.find_one({"institute_id": institute_id}, {"_id": 0})
    if not profile:
        return {
            "success": True,
            "profile": {
                "institute_id": institute_id,
                "institute_name": institute_id.replace("-", " ").title(),
                "logo_url": "",
                "description": "",
                "website_url": ""
            }
        }
    return {"success": True, "profile": profile}


@router.put("/{institute_id}/profile")
async def upsert_institute_profile(institute_id: str, payload: InstituteProfileUpsert, request: Request):
    await _require_institute_owner(request, institute_id)
    doc = {
        "institute_id": institute_id,
        "institute_name": payload.institute_name,
        "logo_url": payload.logo_url or "",
        "description": payload.description or "",
        "website_url": payload.website_url or "",
        "updated_at": datetime.utcnow().isoformat()
    }
    await db.institute_profiles.update_one(
        {"institute_id": institute_id},
        {"$set": doc, "$setOnInsert": {"created_at": datetime.utcnow().isoformat()}},
        upsert=True
    )
    updated = await db.institute_profiles.find_one({"institute_id": institute_id}, {"_id": 0})
    return {"success": True, "profile": updated, "message": "Profile updated"}


@router.post("/videos")
async def create_video(payload: VideoCreate, request: Request):
    try:
        await _require_institute_owner(request, payload.institute_id)
        video_doc = {
            "id": str(uuid.uuid4()),
            "institute_id": payload.institute_id,
            "title": payload.title,
            "description": payload.description or "",
            "video_url": payload.video_url,
            "thumbnail_url": payload.thumbnail_url or "",
            "exam_id": payload.exam_id or "",
            "subject": payload.subject or "",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        await db.institute_videos.insert_one(video_doc)
        return {"success": True, "video": video_doc, "message": "Video uploaded"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{institute_id}/videos")
async def list_videos(institute_id: str):
    items = await db.institute_videos.find({"institute_id": institute_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"success": True, "videos": items}


@router.post("/mcqs")
async def create_mcq_set(payload: MCQSetCreate, request: Request):
    try:
        await _require_institute_owner(request, payload.institute_id)
        questions = []
        for q in payload.questions:
            if q.correct_index < 0 or q.correct_index >= len(q.options):
                raise HTTPException(status_code=400, detail="Invalid correct option index")
            questions.append({
                "question": q.question,
                "options": q.options,
                "correct_index": q.correct_index,
                "explanation": q.explanation or ""
            })

        mcq_doc = {
            "id": str(uuid.uuid4()),
            "institute_id": payload.institute_id,
            "title": payload.title,
            "description": payload.description or "",
            "thumbnail_url": payload.thumbnail_url or "",
            "exam_id": payload.exam_id or "",
            "subject": payload.subject or "",
            "questions": questions,
            "question_count": len(questions),
            "attempt_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        await db.institute_mcq_sets.insert_one(mcq_doc)
        safe_doc = dict(mcq_doc)
        safe_doc.pop("questions", None)
        return {"success": True, "mcq_set": safe_doc, "message": "MCQ set published"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{institute_id}/mcqs")
async def list_mcq_sets(institute_id: str):
    items = await db.institute_mcq_sets.find({"institute_id": institute_id}, {"_id": 0, "questions": 0}).sort("created_at", -1).to_list(500)
    return {"success": True, "mcq_sets": items}


@router.get("/mcqs/{mcq_id}")
async def get_mcq_set(mcq_id: str):
    item = await db.institute_mcq_sets.find_one({"id": mcq_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="MCQ set not found")
    return {"success": True, "mcq_set": item}


@router.post("/mcqs/{mcq_id}/attempt")
async def submit_mcq_attempt(mcq_id: str, payload: MCQAttemptSubmit):
    item = await db.institute_mcq_sets.find_one({"id": mcq_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="MCQ set not found")

    questions = item.get("questions", [])
    if not questions:
        raise HTTPException(status_code=400, detail="MCQ set has no questions")

    total = len(questions)
    answers = payload.answers or []
    correct = 0

    for i, q in enumerate(questions):
        if i < len(answers) and answers[i] == q.get("correct_index"):
            correct += 1

    score_percent = round((correct / total) * 100, 2)

    attempt_doc = {
        "id": str(uuid.uuid4()),
        "mcq_id": mcq_id,
        "institute_id": item.get("institute_id"),
        "user_name": payload.user_name,
        "answers": answers,
        "correct": correct,
        "total": total,
        "score_percent": score_percent,
        "created_at": datetime.utcnow().isoformat()
    }

    await db.institute_mcq_attempts.insert_one(attempt_doc)
    await db.institute_mcq_sets.update_one({"id": mcq_id}, {"$inc": {"attempt_count": 1}})

    return {
        "success": True,
        "result": {
            "correct": correct,
            "total": total,
            "score_percent": score_percent
        }
    }
