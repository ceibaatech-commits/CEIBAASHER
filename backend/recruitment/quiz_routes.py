"""Recruitment: Quiz engine, leaderboard, auto-shortlist"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from database import db
from utils.auth_helpers import get_current_student, get_current_recruiter
from utils.email_service import send_email, SITE_URL
from models.recruitment_models import QuizSubmission, QuizAutoShortlistConfig

router = APIRouter()

@router.get("/recruitment/quiz/{quiz_id}/start")
async def start_quiz(quiz_id: str, request: Request):
    user = await get_current_student(request)
    post = await db.recruitment_posts.find_one({"id": quiz_id, "post_type": "quiz"}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Quiz not found")
    existing = await db.recruitment_quiz_attempts.find_one({"quiz_id": quiz_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(400, "Quiz already attempted")
    questions = [{"question": q.get("question", ""), "options": q.get("options", [])} for q in (post.get("questions") or [])]
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
    questions = post.get("questions") or []
    score = sum(1 for i, q in enumerate(questions) if str(i) in data.answers and data.answers[str(i)] == q.get("correct_answer"))
    total = len(questions)
    attempt = {"id": str(uuid.uuid4()), "quiz_id": quiz_id, "user_id": user["id"], "user_name": user.get("name", ""), "user_air": user.get("air_rank"), "answers": data.answers, "score": score, "total": total, "percentage": round((score / total * 100) if total > 0 else 0, 1), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.recruitment_quiz_attempts.insert_one(attempt.copy())
    attempt.pop("_id", None)
    return attempt

@router.get("/recruitment/quiz/{quiz_id}/leaderboard")
async def quiz_leaderboard(quiz_id: str):
    attempts = await db.recruitment_quiz_attempts.find({"quiz_id": quiz_id}, {"_id": 0}).sort("score", -1).to_list(100)
    return {"leaderboard": attempts}

@router.post("/recruitment/quiz/{quiz_id}/auto-shortlist")
async def quiz_auto_shortlist(quiz_id: str, data: QuizAutoShortlistConfig, request: Request):
    rec = await get_current_recruiter(request)
    post = await db.recruitment_posts.find_one({"id": quiz_id, "post_type": "quiz", "company_id": rec["id"]}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Quiz not found or unauthorized")
    if not data.top_n and data.min_percentage is None:
        raise HTTPException(400, "Provide top_n or min_percentage")
    attempts = await db.recruitment_quiz_attempts.find({"quiz_id": quiz_id}, {"_id": 0}).sort("score", -1).to_list(1000)
    if not attempts:
        return {"shortlisted": 0, "message": "No quiz attempts yet"}
    shortlist_user_ids = [a["user_id"] for a in attempts[:data.top_n]] if data.top_n else [a["user_id"] for a in attempts if a.get("percentage", 0) >= data.min_percentage]
    if not shortlist_user_ids:
        return {"shortlisted": 0, "message": "No candidates meet the criteria"}
    shortlisted_count = 0
    for uid in shortlist_user_ids:
        existing_app = await db.recruitment_applications.find_one({"post_id": quiz_id, "user_id": uid})
        if existing_app:
            if existing_app.get("status") == "applied":
                await db.recruitment_applications.update_one({"id": existing_app["id"]}, {"$set": {"status": "shortlisted", "shortlisted_via": "quiz_leaderboard", "updated_at": datetime.now(timezone.utc).isoformat()}})
                shortlisted_count += 1
        else:
            user = await db.users.find_one({"id": uid}, {"_id": 0})
            attempt = next((a for a in attempts if a["user_id"] == uid), None)
            if user and attempt:
                app_doc = {"id": str(uuid.uuid4()), "post_id": quiz_id, "company_id": rec["id"], "user_id": uid, "user_name": user.get("name", ""), "user_email": user.get("email", ""), "user_air": user.get("air_rank"), "user_exam_type": user.get("exam_type", ""), "user_college": user.get("college", ""), "user_avatar": user.get("profile_picture") or user.get("avatar", ""), "status": "shortlisted", "shortlisted_via": "quiz_leaderboard", "quiz_score": attempt.get("score"), "quiz_percentage": attempt.get("percentage"), "created_at": datetime.now(timezone.utc).isoformat()}
                await db.recruitment_applications.insert_one(app_doc)
                shortlisted_count += 1
                if user.get("email"):
                    await send_email(user["email"], f"Congratulations! Shortlisted — {post.get('title','')}", f'<div style="font-family:system-ui;max-width:500px;margin:0 auto;padding:24px"><h2>Congratulations {user.get("name","")}!</h2><p>Based on your quiz ({attempt.get("score")}/{attempt.get("total")} — {attempt.get("percentage")}%), you\'ve been <b style="color:#22c55e">shortlisted</b> for <b>{post.get("title","")}</b> at <b>{rec.get("company_name","")}</b>.</p></div>')
    await db.recruitment_posts.update_one({"id": quiz_id}, {"$set": {"auto_shortlist": {"top_n": data.top_n, "min_percentage": data.min_percentage, "last_run": datetime.now(timezone.utc).isoformat(), "shortlisted": shortlisted_count}}})
    return {"shortlisted": shortlisted_count, "total_attempts": len(attempts), "criteria": {"top_n": data.top_n, "min_percentage": data.min_percentage}}

@router.get("/recruitment/quiz/{quiz_id}/leaderboard-detailed")
async def quiz_leaderboard_detailed(quiz_id: str, request: Request):
    rec = await get_current_recruiter(request)
    post = await db.recruitment_posts.find_one({"id": quiz_id, "post_type": "quiz", "company_id": rec["id"]}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Quiz not found or unauthorized")
    attempts = await db.recruitment_quiz_attempts.find({"quiz_id": quiz_id}, {"_id": 0}).sort("score", -1).to_list(1000)
    for a in attempts:
        app = await db.recruitment_applications.find_one({"post_id": quiz_id, "user_id": a["user_id"]}, {"_id": 0})
        a["application_status"] = app.get("status") if app else None
        a["application_id"] = app.get("id") if app else None
    return {"leaderboard": attempts, "post": post, "auto_shortlist_config": post.get("auto_shortlist")}
