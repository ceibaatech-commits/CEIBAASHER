"""Recruitment: Bulk actions, CSV export, Resume upload, Email endpoints"""
import os
import io
import csv
import uuid
import cloudinary
import cloudinary.uploader
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from database import db
from utils.auth_helpers import get_current_student, get_current_recruiter, get_admin, JWT_SECRET, JWT_ALGORITHM
from utils.email_service import send_email, SITE_URL
from models.recruitment_models import BulkStatusUpdate, BulkShortlistByAIR, SendCredentialsEmail

router = APIRouter()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# === Resume Upload ===
@router.post("/recruitment/resume/upload")
async def upload_resume(request: Request, file: UploadFile = File(...)):
    user = await get_current_student(request)
    if not file.filename:
        raise HTTPException(400, "No file provided")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".doc", ".docx"]:
        raise HTTPException(400, "Only PDF, DOC, DOCX files allowed")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 5MB)")
    try:
        result = cloudinary.uploader.upload(content, resource_type="raw", folder="resumes", public_id=f"{user['id']}_{uuid.uuid4().hex[:8]}", overwrite=True)
        resume_url = result["secure_url"]
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")
    await db.users.update_one({"id": user["id"]}, {"$set": {"resume_url": resume_url}})
    return {"resume_url": resume_url, "filename": file.filename}

@router.delete("/recruitment/resume")
async def delete_resume(request: Request):
    user = await get_current_student(request)
    await db.users.update_one({"id": user["id"]}, {"$unset": {"resume_url": ""}})
    return {"deleted": True}

# === Bulk Status ===
@router.post("/recruitment/applicants/{post_id}/bulk-status")
async def bulk_update_status(post_id: str, data: BulkStatusUpdate, request: Request):
    rec = await get_current_recruiter(request)
    post = await db.recruitment_posts.find_one({"id": post_id, "company_id": rec["id"]}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Post not found or unauthorized")
    if data.status not in ["shortlisted", "rejected", "interview", "offer", "accepted"]:
        raise HTTPException(400, "Invalid status")
    result = await db.recruitment_applications.update_many({"id": {"$in": data.app_ids}, "post_id": post_id}, {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    for aid in data.app_ids:
        app = await db.recruitment_applications.find_one({"id": aid}, {"_id": 0})
        if app and app.get("user_email"):
            await send_email(app["user_email"], f"Application Update — {data.status.title()}", f"<p>Hi {app.get('user_name','')}, your application for <b>{post.get('title','')}</b> at <b>{rec.get('company_name','')}</b> status: <b>{data.status.title()}</b>.</p>")
    return {"updated": result.modified_count, "status": data.status}

# === Shortlist by AIR ===
@router.post("/recruitment/applicants/{post_id}/shortlist-by-air")
async def shortlist_by_air_rank(post_id: str, data: BulkShortlistByAIR, request: Request):
    rec = await get_current_recruiter(request)
    post = await db.recruitment_posts.find_one({"id": post_id, "company_id": rec["id"]}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Post not found or unauthorized")
    result = await db.recruitment_applications.update_many({"post_id": post_id, "user_air": {"$lte": data.max_air}, "status": "applied"}, {"$set": {"status": "shortlisted", "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"shortlisted": result.modified_count, "max_air": data.max_air}

# === CSV Export ===
@router.get("/recruitment/applicants/{post_id}/export-csv")
async def export_applicants_csv(post_id: str, request: Request):
    rec = await get_current_recruiter(request)
    post = await db.recruitment_posts.find_one({"id": post_id, "company_id": rec["id"]}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Post not found or unauthorized")
    apps = await db.recruitment_applications.find({"post_id": post_id}, {"_id": 0}).sort("user_air", 1).to_list(5000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "AIR Rank", "Exam", "College", "Status", "Applied Date", "Resume URL"])
    for a in apps:
        writer.writerow([a.get("user_name", ""), a.get("user_email", ""), a.get("user_air", ""), a.get("user_exam_type", ""), a.get("user_college", ""), a.get("status", ""), a.get("created_at", ""), a.get("resume_url", "")])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=applicants_{post_id}_{datetime.now().strftime('%Y%m%d')}.csv"})

# === Send Credentials Email ===
@router.post("/recruitment/send-credentials")
async def send_credentials_email(data: SendCredentialsEmail, request: Request):
    await get_admin(request)
    ok = await send_email(data.email, f"Your CEIBAA Recruiter Login Credentials", f'<div style="font-family:system-ui;max-width:500px;margin:0 auto;padding:24px"><h2 style="color:#1e293b">Welcome to CEIBAA, {data.name}!</h2><p>Your recruiter account has been created:</p><div style="background:#f1f5f9;padding:16px;border-radius:12px;margin:16px 0"><p style="margin:4px 0"><b>Portal:</b> <a href="{SITE_URL}/recruiter">{SITE_URL}/recruiter</a></p><p style="margin:4px 0"><b>Email:</b> {data.email}</p><p style="margin:4px 0"><b>Password:</b> {data.password}</p></div></div>')
    return {"sent": ok, "to": data.email}

# === Event Reminder ===
@router.post("/recruitment/posts/{post_id}/send-reminder")
async def send_event_reminder(post_id: str, request: Request):
    rec = await get_current_recruiter(request)
    post = await db.recruitment_posts.find_one({"id": post_id, "company_id": rec["id"]}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Post not found or unauthorized")
    if post.get("post_type") not in ["event", "hackathon"]:
        raise HTTPException(400, "Only events and hackathons support reminders")
    apps = await db.recruitment_applications.find({"post_id": post_id}, {"_id": 0}).to_list(5000)
    sent_count = 0
    for a in apps:
        email = a.get("user_email")
        if email:
            ok = await send_email(email, f"Reminder: {post.get('title', 'Event')} — {rec.get('company_name', '')}", f'<div style="font-family:system-ui;max-width:500px;margin:0 auto;padding:24px"><h2>Hi {a.get("user_name","")}!</h2><p>Reminder for <b>{post.get("title","")}</b> by <b>{rec.get("company_name","")}</b>.</p></div>')
            if ok:
                sent_count += 1
    return {"sent": sent_count, "total": len(apps)}
