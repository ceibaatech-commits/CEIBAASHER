"""
Test History routes — one MongoDB document per completed attempt
(`test_history` collection) + per-attempt JSON archive on S3.

Mounted in server.py with prefix "/api/test-history" (all backend routes in
this app must be /api-prefixed for the Kubernetes ingress).

Auth: `user_id` is a plain query param for now — to be replaced with JWT auth
(utils.auth_helpers.get_current_student) once wired into the student flow.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.concurrency import run_in_threadpool

from test_history_models import TestHistoryCreate, TestHistoryEntry
from test_history_s3 import build_s3_key, upload_test_attempt, delete_test_attempt

router = APIRouter(tags=["test-history"])


def get_db():
    """Stub DB dependency — returns the shared Motor database. Swap or
    override (app.dependency_overrides[get_db]) in tests / future auth work."""
    from database import db
    return db


async def resolve_user_id(
    request: Request,
    user_id: Optional[str] = Query(None, description="Explicit user id (tests/internal). Omit to resolve from auth."),
) -> str:
    """Dual-mode: explicit `user_id` param wins (back-compat for internal/test
    callers), otherwise resolve from the httpOnly session cookie / Bearer JWT
    (supports both custom JWT and opaque Google-OAuth sessions)."""
    if user_id:
        return user_id
    from utils.auth_helpers import _extract_token, _resolve_user_id
    token = _extract_token(request)
    uid = await _resolve_user_id(token) if token else None
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return uid


def _public(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


@router.post("/")
async def save_test_attempt(
    payload: TestHistoryCreate,
    user_id: str = Depends(resolve_user_id),
    db=Depends(get_db),
):
    """Save a completed test, then archive it as an individual JSON file on S3
    ({user_id}/{test_id}_{completed_at}.json). Mongo write always succeeds or
    errors loudly; the S3 upload is best-effort and reported in the response."""
    entry = TestHistoryEntry(
        id=str(uuid.uuid4()),
        user_id=user_id,
        created_at=datetime.now(timezone.utc),
        s3_key=build_s3_key(user_id, payload.test_id, payload.completed_at),
        **payload.dict(),
    )
    doc = entry.to_doc()
    await db.test_history.insert_one(dict(doc))

    s3_uploaded = await run_in_threadpool(upload_test_attempt, doc, entry.s3_key)
    if not s3_uploaded:
        await db.test_history.update_one({"id": entry.id}, {"$set": {"s3_key": None}})
        doc["s3_key"] = None

    return {
        "success": True,
        "entry": _public(doc),
        "s3_uploaded": s3_uploaded,
        "s3_key": entry.s3_key if s3_uploaded else None,
    }


@router.get("/")
async def list_test_history(
    user_id: str = Depends(resolve_user_id),
    subject: Optional[str] = None,
    exam_category: Optional[str] = None,
    is_battle: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db=Depends(get_db),
):
    """Paginated attempt list for a user, newest first."""
    query = {"user_id": user_id}
    if subject:
        query["subject"] = subject
    if exam_category:
        query["exam_category"] = exam_category
    if is_battle is not None:
        query["is_battle"] = is_battle

    total = await db.test_history.count_documents(query)
    cursor = (
        db.test_history.find(query)
        .sort("completed_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items = [_public(d) for d in await cursor.to_list(length=page_size)]

    return {
        "success": True,
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/{entry_id}")
async def get_test_attempt(
    entry_id: str,
    user_id: str = Depends(resolve_user_id),
    db=Depends(get_db),
):
    doc = await db.test_history.find_one({"id": entry_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Test history entry not found")
    return {"success": True, "entry": _public(doc)}


@router.delete("/{entry_id}")
async def delete_test_attempt_entry(
    entry_id: str,
    user_id: str = Depends(resolve_user_id),
    db=Depends(get_db),
):
    doc = await db.test_history.find_one({"id": entry_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Test history entry not found")

    await db.test_history.delete_one({"id": entry_id, "user_id": user_id})

    s3_deleted = False
    if doc.get("s3_key"):
        s3_deleted = await run_in_threadpool(delete_test_attempt, doc["s3_key"])

    return {"success": True, "deleted_id": entry_id, "s3_deleted": s3_deleted}
