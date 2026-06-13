"""
Divya Tutor — Phase 2: Progress storage.

Tracks tutoring sessions, message counts, and quiz attempts per Ceibaa user
inside MongoDB. No new auth system — uses the existing dual-mode auth via
`get_user_id_from_request`.

Collections:
  • divya_sessions      — one row per tutoring session
  • divya_quiz_attempts — one row per completed quiz
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

from profile_routes import get_user_id_from_request


router = APIRouter(prefix="/divya/progress", tags=["divya-progress"])

# Mongo
_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Schemas ----------
class SessionStartIn(BaseModel):
    tutor: str
    language: str
    exam: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    pdf_name: Optional[str] = None


class SessionEndIn(BaseModel):
    session_id: str


class LogMessageIn(BaseModel):
    session_id: str
    role: str  # 'user' | 'tutor'


class QuizAttemptIn(BaseModel):
    session_id: Optional[str] = None
    tutor: str
    language: str
    exam: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    score: int
    total_questions: int


# ---------- Sessions ----------
@router.post("/session/start")
async def start_session(
    body: SessionStartIn,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    user_id = await get_user_id_from_request(authorization, request)
    sid = str(uuid.uuid4())
    doc = {
        "id": sid,
        "user_id": user_id,
        "tutor": body.tutor,
        "language": body.language,
        "exam": body.exam,
        "subject": body.subject,
        "topic": body.topic,
        "pdf_name": body.pdf_name,
        "started_at": _iso_now(),
        "ended_at": None,
        "duration_seconds": 0,
        "message_count": 0,
    }
    await _db.divya_sessions.insert_one(doc)
    return {"success": True, "session_id": sid}


@router.post("/session/end")
async def end_session(
    body: SessionEndIn,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    user_id = await get_user_id_from_request(authorization, request)
    s = await _db.divya_sessions.find_one(
        {"id": body.session_id, "user_id": user_id},
        {"_id": 0, "started_at": 1},
    )
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    started = datetime.fromisoformat(s["started_at"])
    duration = max(0, int((datetime.now(timezone.utc) - started).total_seconds()))
    await _db.divya_sessions.update_one(
        {"id": body.session_id, "user_id": user_id},
        {"$set": {"ended_at": _iso_now(), "duration_seconds": duration}},
    )
    return {"success": True, "duration_seconds": duration}


@router.post("/session/log-message")
async def log_message(
    body: LogMessageIn,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    """Cheap counter — we don't store the message body (text already lives in chat UI / external context)."""
    user_id = await get_user_id_from_request(authorization, request)
    res = await _db.divya_sessions.update_one(
        {"id": body.session_id, "user_id": user_id},
        {"$inc": {"message_count": 1}},
    )
    if res.matched_count == 0:
        # Session may not have been created (e.g. anonymous flow) — silently no-op
        return {"success": True, "tracked": False}
    return {"success": True, "tracked": True}


# ---------- Quiz attempts ----------
@router.post("/quiz")
async def save_quiz_attempt(
    body: QuizAttemptIn,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    user_id = await get_user_id_from_request(authorization, request)
    if body.total_questions <= 0 or body.score < 0 or body.score > body.total_questions:
        raise HTTPException(status_code=400, detail="Invalid score / total_questions")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_id": body.session_id,
        "tutor": body.tutor,
        "language": body.language,
        "exam": body.exam,
        "subject": body.subject,
        "topic": body.topic,
        "score": body.score,
        "total_questions": body.total_questions,
        "percentage": round(100.0 * body.score / body.total_questions, 1),
        "completed_at": _iso_now(),
    }
    await _db.divya_quiz_attempts.insert_one(doc)
    return {"success": True, "attempt_id": doc["id"], "percentage": doc["percentage"]}


# ---------- Stats ----------
@router.get("/stats")
async def get_progress_stats(
    request: Request,
    authorization: Optional[str] = Header(None),
):
    """Return aggregate progress data for the current user."""
    user_id = await get_user_id_from_request(authorization, request)
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)

    # Message totals via aggregation
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": None,
            "all_time_messages": {"$sum": "$message_count"},
            "all_time_seconds": {"$sum": "$duration_seconds"},
            "session_count": {"$sum": 1},
        }},
    ]
    agg = await _db.divya_sessions.aggregate(pipeline).to_list(1)
    totals = agg[0] if agg else {"all_time_messages": 0, "all_time_seconds": 0, "session_count": 0}

    # Today / week messages
    today_msgs = await _db.divya_sessions.aggregate([
        {"$match": {"user_id": user_id, "started_at": {"$gte": today_start.isoformat()}}},
        {"$group": {"_id": None, "n": {"$sum": "$message_count"}}},
    ]).to_list(1)
    week_msgs = await _db.divya_sessions.aggregate([
        {"$match": {"user_id": user_id, "started_at": {"$gte": week_start.isoformat()}}},
        {"$group": {"_id": None, "n": {"$sum": "$message_count"}}},
    ]).to_list(1)

    # Quiz attempts (most recent first)
    quizzes_raw = await _db.divya_quiz_attempts.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("completed_at", -1).limit(50).to_list(50)

    # Topics covered (unique non-null)
    topics: List[str] = []
    seen = set()
    async for s in _db.divya_sessions.find(
        {"user_id": user_id, "topic": {"$ne": None}},
        {"_id": 0, "topic": 1, "exam": 1, "subject": 1},
    ):
        label = " · ".join(x for x in [s.get("exam"), s.get("subject"), s.get("topic")] if x)
        if label and label not in seen:
            seen.add(label)
            topics.append(label)
            if len(topics) >= 100:
                break

    # Streak — consecutive days with at least one session
    day_set = set()
    async for s in _db.divya_sessions.find(
        {"user_id": user_id}, {"_id": 0, "started_at": 1}
    ):
        try:
            day_set.add(datetime.fromisoformat(s["started_at"]).date())
        except Exception:
            continue
    streak = 0
    cur = today_start.date()
    while cur in day_set:
        streak += 1
        cur -= timedelta(days=1)

    return {
        "success": True,
        "messages": {
            "today": (today_msgs[0]["n"] if today_msgs else 0),
            "week": (week_msgs[0]["n"] if week_msgs else 0),
            "all_time": totals.get("all_time_messages", 0),
        },
        "sessions": {
            "count": totals.get("session_count", 0),
            "total_seconds": totals.get("all_time_seconds", 0),
        },
        "streak_days": streak,
        "topics": topics,
        "quizzes": quizzes_raw,
    }
