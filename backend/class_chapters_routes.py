"""
Class-Based Chapters Management Routes
Allows admins to upload and manage chapters for CBSE, RBSE, and other boards
Single source of truth for chapter data served to both admin panel and quiz pages
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import os
from database import db

router = APIRouter(prefix="/api/admin/class-chapters", tags=["class-chapters"])

# ============== PYDANTIC MODELS ==============

class ChapterData(BaseModel):
    chapter_number: int
    chapter_name: str
    total_questions: int = 50
    difficulty: str = "Medium"
    duration: int = 35

class ClassChapterCreate(BaseModel):
    board: str  # 'cbse', 'rbse', 'hbse', etc.
    class_name: str  # 'Class 6', 'Class 7', etc.
    subject: str
    chapters: List[ChapterData]  # List of chapters to upload

class ClassChapterUpdate(BaseModel):
    board: str
    class_name: str
    subject: str
    chapter_number: int
    chapter_data: ChapterData

class ClassChapterDelete(BaseModel):
    board: str
    class_name: str
    subject: str
    chapter_number: int

class BulkChaptersDelete(BaseModel):
    board: str
    class_name: str
    subject: str

# ============== ROUTES ==============

@router.get("/chapters")
async def get_class_chapters(
    board: str = None,
    class_name: str = None,
    subject: str = None,
    skip: int = 0,
    limit: int = 1000
):
    """
    Get chapters for a specific board, class, and subject
    If no filters provided, returns all chapters
    """
    try:
        query = {}
        if board:
            query["board"] = board
        if class_name:
            query["class_name"] = class_name
        if subject:
            query["subject"] = subject
        
        total = await db.class_chapters.count_documents(query)
        chapters = await db.class_chapters.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "chapters": chapters,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chapters")
async def create_class_chapters(data: ClassChapterCreate):
    """
    Upload chapters for a class subject.
    If chapters already exist for this board/class/subject, they are replaced.
    Board is normalized to lowercase (e.g. "HBSE" → "hbse") so the
    student-facing endpoints and ExamSheetManager dropdowns can find them.
    """
    try:
        # Normalize on write so downstream queries (which use lowercase board
        # via board_sheet_data.normalize_board) always match.
        normalized_board = (data.board or "").strip().lower()
        normalized_class = (data.class_name or "").strip()
        normalized_subject = (data.subject or "").strip()

        # Delete existing chapters for this board/class/subject (case-insensitive
        # so legacy uppercase rows are replaced too).
        import re
        await db.class_chapters.delete_many({
            "board": {"$regex": f"^{re.escape(normalized_board)}$", "$options": "i"},
            "class_name": normalized_class,
            "subject": {"$regex": f"^{re.escape(normalized_subject)}$", "$options": "i"},
        })
        
        # Insert new chapters
        chapters_to_insert = []
        for ch in data.chapters:
            chapter_doc = {
                "id": str(uuid.uuid4()),
                "board": normalized_board,
                "class_name": normalized_class,
                "subject": normalized_subject,
                "chapter_number": ch.chapter_number,
                "chapter_name": (ch.chapter_name or "").strip(),
                "total_questions": ch.total_questions,
                "difficulty": ch.difficulty,
                "duration": ch.duration,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            chapters_to_insert.append(chapter_doc)
        
        if chapters_to_insert:
            result = await db.class_chapters.insert_many(chapters_to_insert)
            inserted_count = len(result.inserted_ids)
        else:
            inserted_count = 0
        
        return {
            "success": True,
            "message": f"Successfully uploaded {inserted_count} chapters for {normalized_class} {normalized_subject}",
            "board": normalized_board,
            "class_name": normalized_class,
            "subject": normalized_subject,
            "chapters_uploaded": inserted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading chapters: {str(e)}")

@router.put("/chapters/{chapter_id}")
async def update_class_chapter(chapter_id: str, update_data: ChapterData):
    """Update a specific chapter"""
    try:
        updated_doc = {
            "chapter_number": update_data.chapter_number,
            "chapter_name": update_data.chapter_name,
            "total_questions": update_data.total_questions,
            "difficulty": update_data.difficulty,
            "duration": update_data.duration,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = await db.class_chapters.update_one(
            {"id": chapter_id},
            {"$set": updated_doc}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Chapter not found")
        
        updated = await db.class_chapters.find_one({"id": chapter_id}, {"_id": 0})
        return {
            "success": True,
            "message": "Chapter updated successfully",
            "chapter": updated
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chapters/{chapter_id}")
async def delete_class_chapter(chapter_id: str):
    """Delete a specific chapter"""
    try:
        result = await db.class_chapters.delete_one({"id": chapter_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Chapter not found")
        
        return {
            "success": True,
            "message": "Chapter deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chapters")
async def delete_class_chapters_bulk(data: BulkChaptersDelete):
    """Delete all chapters for a board, class, and subject"""
    try:
        result = await db.class_chapters.delete_many({
            "board": data.board,
            "class_name": data.class_name,
            "subject": data.subject
        })
        
        return {
            "success": True,
            "message": f"Deleted {result.deleted_count} chapters for {data.class_name} {data.subject}",
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_chapters_statistics():
    """Get statistics about uploaded chapters"""
    try:
        total_chapters = await db.class_chapters.count_documents({})
        
        # Get breakdown by board
        board_stats = await db.class_chapters.aggregate([
            {"$group": {
                "_id": "$board",
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]).to_list(None)
        
        # Get breakdown by class
        class_stats = await db.class_chapters.aggregate([
            {"$group": {
                "_id": "$class_name",
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]).to_list(None)
        
        return {
            "success": True,
            "total_chapters": total_chapters,
            "board_breakdown": board_stats,
            "class_breakdown": class_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import-default")
async def import_default_chapters():
    """
    Import default chapters from hardcoded data files into database.
    This one-time operation seeds the database with existing chapter data.
    """
    try:
        from cbse_master_data import CBSE_CHAPTERS
        from board_chapter_data import RBSE_CHAPTER_DATA

        imported_count = 0

        # Helper: split "1. Chapter Name" strings into number + name.
        def _parse_chapter_string(idx: int, raw: str):
            raw = (raw or "").strip()
            m = _re_num.match(raw)
            if m:
                return int(m.group(1)), m.group(2).strip()
            return idx, raw

        import re as _re_local2
        _re_num = _re_local2.compile(r"^\s*(\d+)\.\s*(.+)$")

        def _to_chapter_doc(board: str, class_name: str, subject: str, chapter_number: int, chapter_name: str):
            return {
                "id": str(uuid.uuid4()),
                "board": board,
                "class_name": class_name,
                "subject": subject,
                "chapter_number": chapter_number,
                "chapter_name": chapter_name,
                "total_questions": 50,
                "difficulty": "Medium",
                "duration": 35,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

        # Import CBSE data — structure: {class_key: {subject: [chapter_str, ...]}}
        for class_key, subjects in CBSE_CHAPTERS.items():
            class_name = f"Class {class_key}"
            for subject, chapters in subjects.items():
                # Delete existing chapters for this class/subject
                await db.class_chapters.delete_many({
                    "board": "cbse",
                    "class_name": class_name,
                    "subject": subject
                })
                for i, raw in enumerate(chapters, start=1):
                    if isinstance(raw, dict):
                        num = raw.get("chapter_number", i)
                        name = raw.get("chapter_name", "")
                    else:
                        num, name = _parse_chapter_string(i, raw)
                    if not name:
                        continue
                    doc = _to_chapter_doc("cbse", class_name, subject, num, name)
                    if isinstance(raw, dict):
                        doc["total_questions"] = raw.get("total_questions", 50)
                        doc["difficulty"] = raw.get("difficulty", "Medium")
                        doc["duration"] = raw.get("duration", 35)
                    await db.class_chapters.insert_one(doc)
                    imported_count += 1

        # Import RBSE data — structure: {class_key: {subject: [chapter_dict, ...]}}
        for class_key, subjects in RBSE_CHAPTER_DATA.items():
            class_name = f"Class {class_key}"
            for subject, chapters in subjects.items():
                await db.class_chapters.delete_many({
                    "board": "rbse",
                    "class_name": class_name,
                    "subject": subject
                })
                for i, raw in enumerate(chapters, start=1):
                    if isinstance(raw, dict):
                        num = raw.get("chapter_number", i)
                        name = raw.get("chapter_name", "")
                    else:
                        num, name = _parse_chapter_string(i, raw)
                    if not name:
                        continue
                    doc = _to_chapter_doc("rbse", class_name, subject, num, name)
                    if isinstance(raw, dict):
                        doc["total_questions"] = raw.get("total_questions", 50)
                        doc["difficulty"] = raw.get("difficulty", "Medium")
                        doc["duration"] = raw.get("duration", 35)
                    await db.class_chapters.insert_one(doc)
                    imported_count += 1

        return {
            "success": True,
            "message": f"Successfully imported {imported_count} chapters from hardcoded data into database",
            "imported_count": imported_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing chapters: {str(e)}")



# ============== COPY FROM BOARD ==============

class CopyFromBoardPayload(BaseModel):
    source_board: str
    target_board: str
    class_name: str
    subject: str


def _load_hardcoded_chapters(board: str, class_name: str, subject: str):
    """Return a list of chapter dicts for a (board, class, subject) triple
    pulled from the hardcoded data files. Empty list if not found."""
    board_key = (board or "").lower()
    # class_name might be "Class 10" or "Class 10 (Science)" — extract number
    import re as _re
    m = _re.search(r"Class\s+(\d+)", class_name or "")
    if not m:
        return []
    class_key = m.group(1)

    def _match_subject_key(subj_map: dict, subject_name: str):
        """Case + separator insensitive subject key match."""
        norm = _re.sub(r"[^a-z0-9]+", "", (subject_name or "").lower())
        for k in subj_map.keys():
            if _re.sub(r"[^a-z0-9]+", "", k.lower()) == norm:
                return k
        return None

    # try RBSE_CHAPTER_DATA first (already dict-shaped)
    if board_key == "rbse":
        try:
            from board_chapter_data import RBSE_CHAPTER_DATA
            subj_map = RBSE_CHAPTER_DATA.get(class_key) or {}
            key = _match_subject_key(subj_map, subject)
            entries = subj_map.get(key) if key else []
            out = []
            for i, raw in enumerate(entries, start=1):
                if isinstance(raw, dict):
                    out.append({
                        "chapter_number": raw.get("chapter_number", i),
                        "chapter_name": raw.get("chapter_name", ""),
                        "total_questions": raw.get("total_questions", 50),
                        "difficulty": raw.get("difficulty", "Medium"),
                        "duration": raw.get("duration", 35),
                    })
                else:
                    mm = _re.match(r"^\s*(\d+)\.\s*(.+)$", raw or "")
                    if mm:
                        out.append({"chapter_number": int(mm.group(1)), "chapter_name": mm.group(2).strip(),
                                    "total_questions": 50, "difficulty": "Medium", "duration": 35})
                    elif raw:
                        out.append({"chapter_number": i, "chapter_name": raw,
                                    "total_questions": 50, "difficulty": "Medium", "duration": 35})
            return out
        except Exception:
            return []
    if board_key == "cbse":
        try:
            from cbse_master_data import CBSE_CHAPTERS
            subj_map = CBSE_CHAPTERS.get(class_key) or {}
            key = _match_subject_key(subj_map, subject)
            entries = subj_map.get(key) if key else []
            out = []
            for i, raw in enumerate(entries, start=1):
                mm = _re.match(r"^\s*(\d+)\.\s*(.+)$", raw or "")
                if mm:
                    out.append({"chapter_number": int(mm.group(1)), "chapter_name": mm.group(2).strip(),
                                "total_questions": 50, "difficulty": "Medium", "duration": 35})
                elif raw:
                    out.append({"chapter_number": i, "chapter_name": raw,
                                "total_questions": 50, "difficulty": "Medium", "duration": 35})
            return out
        except Exception:
            return []
    return []


@router.get("/available-sources")
async def available_source_boards(
    class_name: str = Query(...),
    subject: str = Query(...),
):
    """Return the list of boards that already have chapters for the given
    class + subject combo (from DB and hardcoded data), so the admin can pick
    a source board to copy from."""
    import re as _re
    subj_filter = {"$regex": f"^{_re.escape(subject)}$", "$options": "i"}
    class_filter = {"$regex": f"^{_re.escape(class_name)}$", "$options": "i"}
    # DB counts grouped by board
    pipeline = [
        {"$match": {"class_name": class_filter, "subject": subj_filter}},
        {"$group": {"_id": {"$toLower": "$board"}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    db_rows = await db.class_chapters.aggregate(pipeline).to_list(None)
    counts = {row["_id"]: row["count"] for row in db_rows if row.get("_id")}

    # Augment with hardcoded fallbacks (CBSE, RBSE)
    for hard_board in ("cbse", "rbse"):
        if hard_board not in counts:
            hard = _load_hardcoded_chapters(hard_board, class_name, subject)
            if hard:
                counts[hard_board] = len(hard)

    return {
        "success": True,
        "boards": sorted(counts.keys()),
        "chapters_count": counts,
    }


@router.get("/preview-source")
async def preview_source_chapters(
    board: str = Query(...),
    class_name: str = Query(...),
    subject: str = Query(...),
):
    """Preview chapters that would be copied from the source board."""
    import re as _re
    board_filter = {"$regex": f"^{_re.escape(board)}$", "$options": "i"}
    subj_filter = {"$regex": f"^{_re.escape(subject)}$", "$options": "i"}
    class_filter = {"$regex": f"^{_re.escape(class_name)}$", "$options": "i"}
    docs = await db.class_chapters.find(
        {"board": board_filter, "class_name": class_filter, "subject": subj_filter},
        {"_id": 0, "chapter_number": 1, "chapter_name": 1, "total_questions": 1, "difficulty": 1, "duration": 1},
    ).sort("chapter_number", 1).to_list(None)
    if not docs:
        docs = _load_hardcoded_chapters(board, class_name, subject)
    return {"success": True, "chapters": docs, "count": len(docs)}


@router.post("/copy-from-board")
async def copy_from_board(payload: CopyFromBoardPayload):
    """Copy all chapters from source_board -> target_board for a given
    class + subject. Replaces any existing chapters on the target board."""
    src = (payload.source_board or "").strip().lower()
    tgt = (payload.target_board or "").strip().lower()
    if not src or not tgt:
        raise HTTPException(400, "source_board and target_board are required")
    if src == tgt:
        raise HTTPException(400, "source and target board cannot be the same")

    import re as _re
    board_filter = {"$regex": f"^{_re.escape(src)}$", "$options": "i"}
    subj_filter = {"$regex": f"^{_re.escape(payload.subject)}$", "$options": "i"}
    class_filter = {"$regex": f"^{_re.escape(payload.class_name)}$", "$options": "i"}

    # 1) Try DB source
    source_docs = await db.class_chapters.find(
        {"board": board_filter, "class_name": class_filter, "subject": subj_filter},
        {"_id": 0},
    ).sort("chapter_number", 1).to_list(None)

    # 2) Fallback: hardcoded data
    if not source_docs:
        source_docs = _load_hardcoded_chapters(src, payload.class_name, payload.subject)

    if not source_docs:
        raise HTTPException(404, f"No chapters found on '{src}' for {payload.class_name} · {payload.subject}")

    # Replace any existing on target board
    await db.class_chapters.delete_many({
        "board": tgt,
        "class_name": payload.class_name,
        "subject": payload.subject,
    })

    now = datetime.utcnow().isoformat()
    to_insert = []
    for i, ch in enumerate(source_docs, start=1):
        to_insert.append({
            "id": str(uuid.uuid4()),
            "board": tgt,
            "class_name": payload.class_name,
            "subject": payload.subject,
            "chapter_number": ch.get("chapter_number", i),
            "chapter_name": ch.get("chapter_name", ""),
            "total_questions": ch.get("total_questions", 50),
            "difficulty": ch.get("difficulty", "Medium"),
            "duration": ch.get("duration", 35),
            "copied_from_board": src,
            "created_at": now,
            "updated_at": now,
        })
    if to_insert:
        await db.class_chapters.insert_many(to_insert)

    return {
        "success": True,
        "message": f"Copied {len(to_insert)} chapters from {src} to {tgt}",
        "count": len(to_insert),
        "source_board": src,
        "target_board": tgt,
        "class_name": payload.class_name,
        "subject": payload.subject,
    }
