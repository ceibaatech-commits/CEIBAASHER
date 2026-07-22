"""
Resume routes for CEIBAA users (Hugo Academic CV inspired schema).

Endpoints:
- GET  /api/recruitment/resume/me                 -> current user's resume
- PUT  /api/recruitment/resume/me                 -> upsert current user's resume
- GET  /api/recruitment/resume/user/{user_id}     -> recruiter reads a candidate's resume
                                                    (only allowed if the candidate has applied
                                                     to one of the recruiter's posts)

The resume is stored as an embedded document on the `users` collection under
the `resume` field.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from database import db
from utils.auth_helpers import get_current_student, get_current_recruiter

router = APIRouter()


# ---------- Schemas ----------
class ResumeBasics(BaseModel):
    name: str = ""
    headline: str = ""
    bio: str = ""
    location: str = ""
    email: str = ""
    phone: str = ""
    avatar_url: str = ""
    website: str = ""
    linkedin: str = ""
    github: str = ""


class ResumeEducation(BaseModel):
    institution: str = ""
    degree: str = ""
    field: str = ""
    start_year: str = ""
    end_year: str = ""
    grade: str = ""
    description: str = ""


class ResumeExperience(BaseModel):
    company: str = ""
    role: str = ""
    location: str = ""
    start: str = ""
    end: str = ""
    current: bool = False
    description: str = ""


class ResumeProject(BaseModel):
    title: str = ""
    description: str = ""
    tech: List[str] = []
    link: str = ""
    start: str = ""
    end: str = ""


class ResumeSkillGroup(BaseModel):
    category: str = ""
    items: List[str] = []


class ResumeCertification(BaseModel):
    title: str = ""
    issuer: str = ""
    date: str = ""
    link: str = ""


class ResumePublication(BaseModel):
    title: str = ""
    venue: str = ""
    date: str = ""
    link: str = ""
    authors: str = ""


class ResumeAward(BaseModel):
    title: str = ""
    issuer: str = ""
    date: str = ""
    description: str = ""


class ResumePayload(BaseModel):
    basics: ResumeBasics = Field(default_factory=ResumeBasics)
    education: List[ResumeEducation] = []
    experience: List[ResumeExperience] = []
    projects: List[ResumeProject] = []
    skills: List[ResumeSkillGroup] = []
    certifications: List[ResumeCertification] = []
    publications: List[ResumePublication] = []
    awards: List[ResumeAward] = []


def _empty_resume() -> Dict[str, Any]:
    return ResumePayload().model_dump()


def _resume_with_meta(resume: Optional[Dict[str, Any]], user: Dict[str, Any]) -> Dict[str, Any]:
    """Attach non-editable meta (owner name, avatar fallback, exam AIR) to response."""
    r = resume or _empty_resume()
    # Fallback basics from user profile if empty
    basics = r.get("basics") or {}
    if not basics.get("name"):
        basics["name"] = user.get("name", "")
    if not basics.get("email"):
        basics["email"] = user.get("email", "")
    if not basics.get("avatar_url"):
        basics["avatar_url"] = user.get("profile_picture") or user.get("avatar") or ""
    r["basics"] = basics
    r["meta"] = {
        "user_id": user["id"],
        "air_rank": user.get("air_rank"),
        "exam_type": user.get("exam_type", ""),
        "college": user.get("college", ""),
        "updated_at": r.get("updated_at"),
    }
    return r


# ---------- Routes ----------
@router.get("/recruitment/resume/me")
async def get_my_resume(request: Request):
    user = await get_current_student(request)
    resume = user.get("resume")
    return _resume_with_meta(resume, user)


@router.put("/recruitment/resume/me")
async def save_my_resume(payload: ResumePayload, request: Request):
    user = await get_current_student(request)
    data = payload.model_dump()
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": user["id"]}, {"$set": {"resume": data}})
    # refetch user for meta
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return _resume_with_meta(data, fresh or user)


@router.get("/recruitment/resume/user/{user_id}")
async def get_candidate_resume(user_id: str, request: Request):
    """Recruiter reads a candidate's resume. Access is gated: the candidate must
    have applied to at least one of the recruiter's posts."""
    rec = await get_current_recruiter(request)
    # Access check
    application = await db.recruitment_applications.find_one({
        "user_id": user_id,
        "company_id": rec["id"],
    })
    if not application:
        raise HTTPException(403, "This candidate has not applied to your postings")
    candidate = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(404, "Candidate not found")
    return _resume_with_meta(candidate.get("resume"), candidate)
