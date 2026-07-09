"""
banner_routes.py

Admin-managed home-page banners.

Each banner has:
  id            – UUID string
  title         – Display title (optional, for admin labelling)
  image_url     – Full URL of the banner image
  target_type   – 'quiz_room' | 'battle' | 'leaderboard' | 'url'
  target_id     – Room code / battle pin / leaderboard id / absolute URL
  is_active     – Whether the banner appears on the home page
  display_order – Lower number appears first
  created_at    – ISO timestamp

Public endpoint:  GET  /api/banners          (only active, ordered)
Admin endpoints:  POST /api/banners
                  PUT  /api/banners/{id}
                  DELETE /api/banners/{id}
                  PATCH /api/banners/{id}/order
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db

router = APIRouter()

COLLECTION = "banners"

TargetType = Literal["quiz_room", "battle", "leaderboard", "url"]


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class BannerCreate(BaseModel):
    title: str = ""
    image_url: str
    target_type: TargetType
    target_id: str
    is_active: bool = True
    display_order: int = 0


class BannerUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    target_type: Optional[TargetType] = None
    target_id: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class BannerOrderPatch(BaseModel):
    display_order: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize(doc: dict) -> dict:
    """Return a JSON-safe banner dict from a MongoDB document."""
    return {
        "id": doc.get("id", str(doc.get("_id", ""))),
        "title": doc.get("title", ""),
        "image_url": doc.get("image_url", ""),
        "target_type": doc.get("target_type", "url"),
        "target_id": doc.get("target_id", ""),
        "is_active": doc.get("is_active", True),
        "display_order": doc.get("display_order", 0),
        "created_at": doc.get("created_at", ""),
    }


# ---------------------------------------------------------------------------
# Public route — home page consumes this
# ---------------------------------------------------------------------------

@router.get("/api/banners")
async def get_active_banners():
    """Return all active banners ordered by display_order asc."""
    try:
        cursor = db[COLLECTION].find(
            {"is_active": True},
            sort=[("display_order", 1), ("created_at", 1)],
        )
        docs = await cursor.to_list(length=50)
        return {"success": True, "banners": [_serialize(d) for d in docs]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Admin CRUD
# ---------------------------------------------------------------------------

@router.get("/api/admin/banners")
async def admin_get_all_banners():
    """Return every banner (active + inactive) for the admin panel."""
    try:
        cursor = db[COLLECTION].find(
            {},
            sort=[("display_order", 1), ("created_at", 1)],
        )
        docs = await cursor.to_list(length=200)
        return {"success": True, "banners": [_serialize(d) for d in docs]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/admin/banners")
async def create_banner(body: BannerCreate):
    """Create a new banner."""
    if not body.image_url.strip():
        raise HTTPException(status_code=400, detail="image_url is required")
    if not body.target_id.strip():
        raise HTTPException(status_code=400, detail="target_id is required")

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "title": body.title.strip(),
        "image_url": body.image_url.strip(),
        "target_type": body.target_type,
        "target_id": body.target_id.strip(),
        "is_active": body.is_active,
        "display_order": body.display_order,
        "created_at": now,
    }
    await db[COLLECTION].insert_one(doc)
    return {"success": True, "banner": _serialize(doc)}


@router.put("/api/admin/banners/{banner_id}")
async def update_banner(banner_id: str, body: BannerUpdate):
    """Update an existing banner."""
    existing = await db[COLLECTION].find_one({"id": banner_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Banner not found")

    updates = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if not updates:
        return {"success": True, "banner": _serialize(existing)}

    await db[COLLECTION].update_one({"id": banner_id}, {"$set": updates})
    updated = await db[COLLECTION].find_one({"id": banner_id})
    return {"success": True, "banner": _serialize(updated)}


@router.patch("/api/admin/banners/{banner_id}/order")
async def reorder_banner(banner_id: str, body: BannerOrderPatch):
    """Update only the display order of a banner."""
    existing = await db[COLLECTION].find_one({"id": banner_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Banner not found")
    await db[COLLECTION].update_one(
        {"id": banner_id}, {"$set": {"display_order": body.display_order}}
    )
    return {"success": True}


@router.delete("/api/admin/banners/{banner_id}")
async def delete_banner(banner_id: str):
    """Permanently delete a banner."""
    result = await db[COLLECTION].delete_one({"id": banner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"success": True}


# ---------------------------------------------------------------------------
# Admin helper — browse existing quiz / battle rooms for the banner picker
# ---------------------------------------------------------------------------

@router.get("/api/admin/rooms/quiz")
async def admin_list_quiz_rooms(search: str = "", limit: int = 30):
    """
    Return recent quiz rooms for the banner picker.
    Optional `search` filters by room_code or title (case-insensitive).
    """
    try:
        query: dict = {}
        if search.strip():
            escaped = search.strip().replace("(", "\\(").replace(")", "\\)")
            query = {
                "$or": [
                    {"room_code": {"$regex": escaped, "$options": "i"}},
                    {"title": {"$regex": escaped, "$options": "i"}},
                    {"category": {"$regex": escaped, "$options": "i"}},
                ]
            }
        cursor = db["quiz_rooms"].find(
            query,
            {"_id": 0, "id": 1, "room_code": 1, "title": 1, "category": 1,
             "question_count": 1, "privacy": 1, "created_at": 1, "host_name": 1},
            sort=[("created_at", -1)],
        )
        docs = await cursor.to_list(length=limit)
        return {"success": True, "rooms": docs}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/admin/rooms/battle")
async def admin_list_battle_rooms(search: str = "", limit: int = 30):
    """
    Return recent battle rooms for the banner picker.
    """
    try:
        query: dict = {}
        if search.strip():
            escaped = search.strip().replace("(", "\\(").replace(")", "\\)")
            query = {
                "$or": [
                    {"roomId": {"$regex": escaped, "$options": "i"}},
                    {"config.subject": {"$regex": escaped, "$options": "i"}},
                ]
            }
        cursor = db["battle_rooms"].find(
            query,
            {"_id": 0, "roomId": 1, "config": 1, "status": 1, "createdAt": 1},
            sort=[("createdAt", -1)],
        )
        docs = await cursor.to_list(length=limit)
        rooms = [
            {
                "room_code": d.get("roomId"),
                "title": (d.get("config") or {}).get("subject", "Battle Room"),
                "category": (d.get("config") or {}).get("category", ""),
                "status": d.get("status", "waiting"),
                "created_at": d.get("createdAt"),
            }
            for d in docs
        ]
        return {"success": True, "rooms": rooms}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Google Sheet → quiz-room questions importer
# ---------------------------------------------------------------------------

class SheetFetchRequest(BaseModel):
    sheet_url: str
    time_limit: int = 30   # default seconds per question


@router.post("/api/admin/banners/fetch-sheet")
async def fetch_sheet_questions(body: SheetFetchRequest):
    """
    Fetch questions from a *public* Google Sheet and return them shaped
    for POST /api/social/quiz-rooms.

    Expected sheet columns (order-independent, case-insensitive):
        Question | A | B | C | D | Answer | Explanation
    Answer values accepted: A / B / C / D  or  1 / 2 / 3 / 4
    """
    if not body.sheet_url.strip():
        raise HTTPException(status_code=400, detail="sheet_url is required")

    try:
        from google_sheets_service import GoogleSheetsService
        svc = GoogleSheetsService()
        raw = svc.fetch_questions(body.sheet_url.strip())
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch sheet: {exc}")

    if not raw:
        raise HTTPException(
            status_code=422,
            detail="No questions found. Verify the sheet is public and uses the correct column format."
        )

    letter_map = ["A", "B", "C", "D"]

    questions = []
    for idx, q in enumerate(raw):
        options = q.get("options") or []
        ca_idx  = max(0, min(3, int(q.get("correctAnswer", 0))))
        questions.append({
            "question_text":  q.get("question", "").strip(),
            "option_a":       (options[0] if len(options) > 0 else "").strip(),
            "option_b":       (options[1] if len(options) > 1 else "").strip(),
            "option_c":       (options[2] if len(options) > 2 else "").strip(),
            "option_d":       (options[3] if len(options) > 3 else "").strip(),
            "correct_answer": letter_map[ca_idx],
            "time_limit":     body.time_limit,
            "explanation":    q.get("explanation", "").strip(),
        })

    return {"success": True, "count": len(questions), "questions": questions}
