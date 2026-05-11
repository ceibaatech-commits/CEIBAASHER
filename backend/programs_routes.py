import os
import logging
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from dotenv import load_dotenv
from jose import jwt, JWTError

load_dotenv()

router = APIRouter()
logger = logging.getLogger(__name__)

db = None
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

def init_db(database):
    global db
    db = database


# --- Models ---

class ProgramCreate(BaseModel):
    title: str
    short_description: str
    full_description: str = ""
    domain: str  # research, entrepreneurship, ai_tech, healthcare, competition, summer
    grade_min: int = 8
    grade_max: int = 12
    duration: str = ""
    price: Optional[str] = None
    seats_total: Optional[int] = None
    seats_left: Optional[int] = None
    mentor_name: Optional[str] = None
    mentor_credentials: Optional[str] = None
    mentor_avatar: Optional[str] = None
    thumbnail: Optional[str] = None
    highlights: List[str] = []
    what_you_build: List[str] = []
    related_exams: List[str] = []
    is_active: bool = True
    is_enrolling: bool = True
    slug: Optional[str] = None

class ProgramUpdate(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    domain: Optional[str] = None
    grade_min: Optional[int] = None
    grade_max: Optional[int] = None
    duration: Optional[str] = None
    price: Optional[str] = None
    seats_total: Optional[int] = None
    seats_left: Optional[int] = None
    mentor_name: Optional[str] = None
    mentor_credentials: Optional[str] = None
    mentor_avatar: Optional[str] = None
    thumbnail: Optional[str] = None
    highlights: Optional[List[str]] = None
    what_you_build: Optional[List[str]] = None
    related_exams: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_enrolling: Optional[bool] = None

class EnquiryCreate(BaseModel):
    program_id: str
    program_title: str
    name: str
    email: EmailStr
    phone: str = ""
    grade: str = ""
    school_name: str = ""
    message: str = ""


# --- Helpers ---

async def _resolve_admin_token(request: Optional[Request], authorization: Optional[str]) -> str:
    """Cookie-first (ceibaa_admin_token), Authorization-Bearer fallback."""
    if request is not None:
        cookie = request.cookies.get("ceibaa_admin_token")
        if cookie:
            return cookie
    if authorization:
        if authorization.lower().startswith("bearer "):
            return authorization[7:].strip()
        return authorization
    return ""


async def verify_admin(authorization: Optional[str] = None, request: Optional[Request] = None):
    token = await _resolve_admin_token(request, authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        session = await db.admin_sessions.find_one({"token": token})
        if session:
            return session.get("user_id")
        session = await db.user_sessions.find_one({"session_token": token})
        if session:
            user_id = session.get("user_id")
        else:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"$or": [{"id": user_id}, {"user_id": user_id}]})
        if not user or not (user.get("is_admin") or user.get("role") in ["admin", "super_admin"]):
            raise HTTPException(status_code=403, detail="Admin access required")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def make_slug(title: str) -> str:
    return title.lower().strip().replace(" ", "-").replace("&", "and").replace("/", "-")


# --- Public Routes ---

@router.get("/programs")
async def list_programs(domain: Optional[str] = None, grade: Optional[int] = None):
    query = {"is_active": True}
    if domain:
        query["domain"] = domain
    if grade:
        query["grade_min"] = {"$lte": grade}
        query["grade_max"] = {"$gte": grade}
    programs = await db.programs.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"success": True, "programs": programs}


@router.get("/programs/{program_id}")
async def get_program(program_id: str):
    program = await db.programs.find_one(
        {"$or": [{"id": program_id}, {"slug": program_id}]},
        {"_id": 0}
    )
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return {"success": True, "program": program}


@router.post("/programs/enquiry")
async def submit_enquiry(enquiry: EnquiryCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "program_id": enquiry.program_id,
        "program_title": enquiry.program_title,
        "name": enquiry.name,
        "email": enquiry.email,
        "phone": enquiry.phone,
        "grade": enquiry.grade,
        "school_name": enquiry.school_name,
        "message": enquiry.message,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.program_enquiries.insert_one(doc.copy())
    return {"success": True, "message": "Your interest has been registered! We'll contact you soon."}


# --- Admin Routes ---

@router.post("/admin/programs")
async def create_program(program: ProgramCreate, request: Request, authorization: Optional[str] = Header(None)):
    await verify_admin(authorization, request)
    doc = program.dict()
    doc["id"] = str(uuid.uuid4())
    doc["slug"] = program.slug or make_slug(program.title)
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    if doc.get("seats_left") is None and doc.get("seats_total"):
        doc["seats_left"] = doc["seats_total"]
    await db.programs.insert_one(doc.copy())
    doc.pop("_id", None)
    return {"success": True, "program": doc}


@router.put("/admin/programs/{program_id}")
async def update_program(program_id: str, updates: ProgramUpdate, request: Request, authorization: Optional[str] = Header(None)):
    await verify_admin(authorization, request)
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.programs.update_one({"id": program_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Program not found")
    return {"success": True, "message": "Program updated"}


@router.delete("/admin/programs/{program_id}")
async def delete_program(program_id: str, request: Request, authorization: Optional[str] = Header(None)):
    await verify_admin(authorization, request)
    result = await db.programs.delete_one({"id": program_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Program not found")
    return {"success": True, "message": "Program deleted"}


@router.get("/admin/programs/enquiries")
async def list_enquiries(
    request: Request,
    authorization: Optional[str] = Header(None),
    status: Optional[str] = None,
    program_id: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    await verify_admin(authorization, request)
    query = {}
    if status:
        query["status"] = status
    if program_id:
        query["program_id"] = program_id
    skip = (page - 1) * limit
    enquiries = await db.program_enquiries.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.program_enquiries.count_documents(query)
    return {
        "success": True,
        "enquiries": enquiries,
        "pagination": {"page": page, "limit": limit, "total": total}
    }


@router.put("/admin/programs/enquiries/{enquiry_id}")
async def update_enquiry(enquiry_id: str, request: Request, authorization: Optional[str] = Header(None), status: str = "contacted"):
    await verify_admin(authorization, request)
    result = await db.program_enquiries.update_one(
        {"id": enquiry_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return {"success": True, "message": "Enquiry updated"}
