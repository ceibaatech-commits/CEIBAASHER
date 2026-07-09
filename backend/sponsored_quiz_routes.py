"""
Sponsored Quiz Routes — Ceibaa Platform
Admins create quizzes (with MCQs imported from a public Google Sheet).
Active quizzes appear on the home-page banner carousel.
Users click → take the quiz → see their score + leaderboard.
"""
import csv
import io
import re
import requests
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Request, Depends, Header
from pydantic import BaseModel

router = APIRouter(tags=["sponsored_quiz"])

# Global db (set by init_db called from server.py)
db = None
ADMIN_COOKIE_NAME = "ceibaa_admin_token"


def init_db(database):
    global db
    db = database


# ── Admin auth dependency ──────────────────────────────────────────────────────

async def _require_admin(request: Request):
    """Raises 401/403 if the caller is not an authenticated admin."""
    token = request.cookies.get(ADMIN_COOKIE_NAME, "")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Admin authentication required")

    # 1) DB-backed session (canonical)
    session = await db.admin_sessions.find_one({"token": token})
    if session:
        expires_at = session.get("expires_at", "")
        if expires_at:
            try:
                expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) > expiry:
                    raise HTTPException(status_code=401, detail="Admin session expired")
            except ValueError:
                pass
        return {"user_id": session.get("user_id"), "role": session.get("role", "admin")}

    raise HTTPException(status_code=403, detail="Admin access required")


# ── Pydantic models ────────────────────────────────────────────────────────────

class SponsoredQuizCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    banner_image: Optional[str] = ""
    sponsor_name: Optional[str] = ""
    sheet_url: str
    time_per_question: Optional[int] = 30   # seconds
    published: Optional[bool] = False


class SponsoredQuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    banner_image: Optional[str] = None
    sponsor_name: Optional[str] = None
    sheet_url: Optional[str] = None
    time_per_question: Optional[int] = None
    published: Optional[bool] = None


class QuizAttemptSubmit(BaseModel):
    user_id: str
    user_name: str
    avatar_url: Optional[str] = ""
    # Client sends only what the user selected; server recomputes correctness & score
    answers: List[dict]          # [{question_id, selected_answer}]


# ── Google Sheet helpers ───────────────────────────────────────────────────────

def _extract_sheet_id(url: str) -> str:
    """Pull the sheet ID from any standard Google Sheets URL."""
    m = re.search(r"/spreadsheets/d/([a-zA-Z0-9_-]+)", url)
    if not m:
        raise ValueError("Could not extract Google Sheet ID from URL. "
                         "Make sure you paste the full URL of a publicly-shared sheet.")
    return m.group(1)


def _sheet_csv_url(sheet_id: str, gid: Optional[str] = None) -> str:
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    if gid:
        url += f"&gid={gid}"
    return url


def _parse_questions_from_csv(raw_csv: str) -> List[dict]:
    """
    Expected columns (header row ignored if it contains 'question'):
      A: Question text
      B: Option A
      C: Option B
      D: Option C
      E: Option D
      F: Correct Answer  (A / B / C / D)
      G: Explanation     (optional)
    """
    questions = []
    reader = csv.reader(io.StringIO(raw_csv))
    for i, row in enumerate(reader):
        # Skip completely empty rows and header rows
        if not any(cell.strip() for cell in row):
            continue
        if i == 0 and row and row[0].strip().lower() in ("question", "q", "questions", "#"):
            continue

        # Pad row to at least 6 columns
        while len(row) < 6:
            row.append("")

        question_text = row[0].strip()
        opt_a = row[1].strip() if len(row) > 1 else ""
        opt_b = row[2].strip() if len(row) > 2 else ""
        opt_c = row[3].strip() if len(row) > 3 else ""
        opt_d = row[4].strip() if len(row) > 4 else ""
        correct = row[5].strip().upper() if len(row) > 5 else ""
        explanation = row[6].strip() if len(row) > 6 else ""

        if not question_text or correct not in ("A", "B", "C", "D"):
            continue   # skip malformed rows

        questions.append({
            "id": str(uuid.uuid4()),
            "question": question_text,
            "option_a": opt_a,
            "option_b": opt_b,
            "option_c": opt_c,
            "option_d": opt_d,
            "correct_answer": correct,
            "explanation": explanation,
            "time_limit": 30,   # overridden per-quiz at serve time
            "points": 100,
        })

    return questions


async def _import_questions_from_sheet(sheet_url: str) -> List[dict]:
    """Fetch + parse a public Google Sheet. Returns list of question dicts."""
    try:
        sheet_id = _extract_sheet_id(sheet_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Try the gid parameter if present in the URL
    gid_match = re.search(r"[?&]gid=(\d+)", sheet_url)
    gid = gid_match.group(1) if gid_match else None

    csv_url = _sheet_csv_url(sheet_id, gid)
    try:
        resp = requests.get(csv_url, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(
            status_code=400,
            detail=(
                "Could not fetch the Google Sheet. "
                "Make sure the sheet is shared with 'Anyone with the link can view'. "
                f"Error: {e}"
            )
        )

    questions = _parse_questions_from_csv(resp.text)

    if len(questions) < 5:
        raise HTTPException(
            status_code=400,
            detail=f"Sheet must have at least 5 valid questions (found {len(questions)}). "
                   "Check the column format: Question | Opt A | Opt B | Opt C | Opt D | Correct (A/B/C/D) | Explanation"
        )
    if len(questions) > 25:
        questions = questions[:25]   # cap at 25

    return questions


# ═════════════════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/api/sponsored-quizzes")
async def list_active_quizzes():
    """Home-page carousel — returns published quizzes, newest first."""
    try:
        quizzes = await db.sponsored_quizzes.find(
            {"published": True},
            {"_id": 0, "questions": 0}   # strip questions for list view
        ).sort("created_at", -1).to_list(20)
        return {"success": True, "quizzes": quizzes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/sponsored-quizzes/{quiz_id}")
async def get_quiz_detail(quiz_id: str):
    """Return a single published quiz WITH its questions (for the quiz page)."""
    try:
        quiz = await db.sponsored_quizzes.find_one(
            {"id": quiz_id, "published": True}, {"_id": 0}
        )
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found or not published")

        # Inject time_limit from quiz setting into each question
        tpq = quiz.get("time_per_question", 30)
        for q in quiz.get("questions", []):
            q["time_limit"] = tpq

        return {"success": True, "quiz": quiz}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/sponsored-quizzes/{quiz_id}/attempt")
async def submit_attempt(quiz_id: str, attempt: QuizAttemptSubmit):
    """Save a user's quiz attempt. Score and correctness are computed server-side."""
    try:
        quiz = await db.sponsored_quizzes.find_one(
            {"id": quiz_id, "published": True}, {"_id": 0}
        )
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Build a lookup map from question id → correct_answer using canonical DB data
        questions = quiz.get("questions", [])
        correct_map = {q["id"]: q["correct_answer"].upper() for q in questions if q.get("id") and q.get("correct_answer")}
        total = len(questions)
        if total == 0:
            raise HTTPException(status_code=400, detail="Quiz has no questions")

        # Recompute correctness server-side — ignore any client-supplied is_correct / score
        verified_answers = []
        correct_count = 0
        for a in attempt.answers:
            qid = a.get("question_id")
            selected = (a.get("selected_answer") or "").upper()
            canonical_correct = correct_map.get(qid)
            is_correct = bool(canonical_correct and selected == canonical_correct)
            if is_correct:
                correct_count += 1
            verified_answers.append({
                "question_id": qid,
                "selected_answer": selected or None,
                "correct_answer": canonical_correct,
                "is_correct": is_correct,
            })

        server_score = correct_count * 100   # 100 pts per correct answer
        percentage = round((correct_count / total) * 100, 1)

        doc = {
            "id": str(uuid.uuid4()),
            "quiz_id": quiz_id,
            "quiz_title": quiz.get("title", ""),
            "user_id": attempt.user_id,
            "user_name": attempt.user_name,
            "avatar_url": attempt.avatar_url or "",
            "answers": verified_answers,
            "score": server_score,
            "correct": correct_count,
            "total_questions": total,
            "percentage": percentage,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.sponsored_quiz_attempts.insert_one(doc.copy())

        # Rank: how many distinct attempts scored higher (ties broken by completed_at asc)
        rank_position = await db.sponsored_quiz_attempts.count_documents(
            {"quiz_id": quiz_id, "score": {"$gt": server_score}}
        )

        return {
            "success": True,
            "result": {
                "score": server_score,
                "correct": correct_count,
                "total": total,
                "percentage": percentage,
                "rank": rank_position + 1,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/sponsored-quizzes/{quiz_id}/leaderboard")
async def get_leaderboard(quiz_id: str):
    """Return the top 20 attempts for a quiz, sorted by score desc."""
    try:
        attempts = await db.sponsored_quiz_attempts.find(
            {"quiz_id": quiz_id},
            {"_id": 0, "answers": 0}
        ).sort("score", -1).limit(20).to_list(20)
        return {"success": True, "leaderboard": attempts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═════════════════════════════════════════════════════════════════════════════
# ADMIN ENDPOINTS  (all require admin session)
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/api/admin/sponsored-quizzes")
async def admin_list_quizzes(_: dict = Depends(_require_admin)):
    """Admin — list all quizzes regardless of published status."""
    try:
        quizzes = await db.sponsored_quizzes.find(
            {}, {"_id": 0, "questions": 0}
        ).sort("created_at", -1).to_list(100)
        return {"success": True, "quizzes": quizzes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/admin/sponsored-quizzes/{quiz_id}")
async def admin_get_quiz(quiz_id: str, _: dict = Depends(_require_admin)):
    """Admin — get a single quiz including its questions."""
    try:
        quiz = await db.sponsored_quizzes.find_one({"id": quiz_id}, {"_id": 0})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        return {"success": True, "quiz": quiz}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/admin/sponsored-quizzes")
async def admin_create_quiz(payload: SponsoredQuizCreate, _: dict = Depends(_require_admin)):
    """Admin — create a new sponsored quiz and import questions from sheet."""
    questions = await _import_questions_from_sheet(payload.sheet_url)

    doc = {
        "id": str(uuid.uuid4()),
        "title": payload.title,
        "description": payload.description or "",
        "banner_image": payload.banner_image or "",
        "sponsor_name": payload.sponsor_name or "",
        "sheet_url": payload.sheet_url,
        "time_per_question": payload.time_per_question or 30,
        "published": payload.published or False,
        "questions": questions,
        "question_count": len(questions),
        "attempt_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.sponsored_quizzes.insert_one(doc.copy())
    doc.pop("_id", None)
    doc.pop("questions", None)   # don't return full question list
    doc["question_count"] = len(questions)
    return {"success": True, "quiz": doc, "question_count": len(questions)}


@router.put("/api/admin/sponsored-quizzes/{quiz_id}")
async def admin_update_quiz(quiz_id: str, payload: SponsoredQuizUpdate, _: dict = Depends(_require_admin)):
    """Admin — update quiz metadata (re-imports questions if sheet_url changed)."""
    existing = await db.sponsored_quizzes.find_one({"id": quiz_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Quiz not found")

    update: dict = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if payload.title is not None:
        update["title"] = payload.title
    if payload.description is not None:
        update["description"] = payload.description
    if payload.banner_image is not None:
        update["banner_image"] = payload.banner_image
    if payload.sponsor_name is not None:
        update["sponsor_name"] = payload.sponsor_name
    if payload.time_per_question is not None:
        update["time_per_question"] = payload.time_per_question
    if payload.published is not None:
        update["published"] = payload.published

    # Re-import questions if the sheet URL changed
    if payload.sheet_url is not None and payload.sheet_url != existing.get("sheet_url"):
        questions = await _import_questions_from_sheet(payload.sheet_url)
        update["sheet_url"] = payload.sheet_url
        update["questions"] = questions
        update["question_count"] = len(questions)

    await db.sponsored_quizzes.update_one({"id": quiz_id}, {"$set": update})
    return {"success": True}


@router.post("/api/admin/sponsored-quizzes/{quiz_id}/reimport")
async def admin_reimport_questions(quiz_id: str, _: dict = Depends(_require_admin)):
    """Admin — re-fetch questions from the sheet without changing anything else."""
    existing = await db.sponsored_quizzes.find_one({"id": quiz_id}, {"_id": 0, "sheet_url": 1})
    if not existing:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = await _import_questions_from_sheet(existing["sheet_url"])
    await db.sponsored_quizzes.update_one(
        {"id": quiz_id},
        {"$set": {
            "questions": questions,
            "question_count": len(questions),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    return {"success": True, "question_count": len(questions)}


@router.patch("/api/admin/sponsored-quizzes/{quiz_id}/publish")
async def admin_toggle_publish(quiz_id: str, _: dict = Depends(_require_admin)):
    """Admin — toggle published flag."""
    existing = await db.sponsored_quizzes.find_one({"id": quiz_id}, {"_id": 0, "published": 1})
    if not existing:
        raise HTTPException(status_code=404, detail="Quiz not found")

    new_published = not existing.get("published", False)
    await db.sponsored_quizzes.update_one(
        {"id": quiz_id},
        {"$set": {"published": new_published, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "published": new_published}


@router.delete("/api/admin/sponsored-quizzes/{quiz_id}")
async def admin_delete_quiz(quiz_id: str, _: dict = Depends(_require_admin)):
    """Admin — permanently delete a quiz and all its attempts."""
    result = await db.sponsored_quizzes.delete_one({"id": quiz_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quiz not found")
    await db.sponsored_quiz_attempts.delete_many({"quiz_id": quiz_id})
    return {"success": True}
