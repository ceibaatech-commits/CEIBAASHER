import uuid
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from exam_data import EXAM_DATA
from board_master_data import get_subjects_for_board_class, get_chapters_for_board_subject

router = APIRouter()

class SponsorCreate(BaseModel):
    name: str
    logo_url: str
    link_url: str
    description: Optional[str] = ""
    active_from: Optional[str] = None
    active_to: Optional[str] = None

class SponsorUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    link_url: Optional[str] = None
    description: Optional[str] = None
    active_from: Optional[str] = None
    active_to: Optional[str] = None

class AssignmentCreate(BaseModel):
    sponsor_id: str
    scope_key: str


class ScopeMatchRequest(BaseModel):
    scope_keys: List[str]


BOARD_LABELS = {
    "cbse": "CBSE",
    "rbse": "Rajasthan Board (RBSE)",
    "hbse": "Haryana Board (HBSE)",
    "mpbse": "MP Board (MPBSE)",
    "upboard": "UP Board",
    "bseb": "Bihar Board (BSEB)",
}


def normalize_scope_key(value: str) -> str:
    normalized = (value or "").strip().lower()
    normalized = normalized.replace("&", " and ")
    normalized = re.sub(r"[\s_/]+", "-", normalized)
    normalized = re.sub(r"[^a-z0-9()\-]+", "-", normalized)
    normalized = re.sub(r"-+", "-", normalized)
    return normalized.strip("-")


def build_scope_search_keys(scope_key: str) -> List[str]:
    parts = [part for part in normalize_scope_key(scope_key).split("-") if part]
    return ["-".join(parts[:index]) for index in range(len(parts), 0, -1)]


def _stream_for_class_name(class_name: str) -> Optional[str]:
    lowered = (class_name or "").lower()
    if "science" in lowered:
        return "science"
    if "commerce" in lowered:
        return "commerce"
    if "humanities" in lowered:
        return "humanities"
    return None


def _class_number_for_name(class_name: str) -> str:
    match = re.search(r"(\d+)", class_name or "")
    return match.group(1) if match else ""


def _chapter_name(chapter: Any) -> str:
    if isinstance(chapter, dict):
        return str(chapter.get("chapter_name") or chapter.get("name") or "").strip()
    return str(chapter or "").strip()


def _board_label(board_key: str) -> str:
    normalized = normalize_scope_key(board_key)
    if normalized in BOARD_LABELS:
        return BOARD_LABELS[normalized]
    return normalized.replace("-", " ").upper()


def _board_filter(board_key: str) -> dict:
    return {"$regex": f"^{re.escape(board_key)}$", "$options": "i"}


def _class_scope_key(board_key: str, class_name: str) -> str:
    class_num = _class_number_for_name(class_name)
    stream = _stream_for_class_name(class_name)
    parts = [board_key, f"class-{class_num}"]
    if stream:
        parts.append(stream)
    return "-".join(parts)


def _append_scope_option(options: List[Dict[str, str]], seen: set[str], key: str, label: str, group: str):
    normalized_key = normalize_scope_key(key)
    if not normalized_key or normalized_key in seen:
        return
    seen.add(normalized_key)
    options.append({
        "key": normalized_key,
        "label": label,
        "group": group,
    })


async def _append_exam_scope_options(options: List[Dict[str, str]], seen: set[str]) -> None:
    metadata_by_key: Dict[str, Dict[str, str]] = {}

    for exam_id, exam_data in EXAM_DATA.items():
        normalized_exam_id = normalize_scope_key(exam_id)
        exam_name = exam_data.get("name") or exam_data.get("full_name") or exam_id
        metadata_by_key[normalized_exam_id] = {
            "name": exam_name,
            "group": exam_data.get("category") or "Competitive Exams",
        }
        _append_scope_option(options, seen, exam_id, exam_name, metadata_by_key[normalized_exam_id]["group"])

        for topic_name, topic_data in (exam_data.get("syllabus_topics") or {}).items():
            topic_parts = [exam_id, topic_name]
            _append_scope_option(options, seen, "-".join(topic_parts), f"{exam_name} -> {topic_name}", metadata_by_key[normalized_exam_id]["group"])
            for subject_name in (topic_data.get("subjects") or {}).keys():
                _append_scope_option(
                    options,
                    seen,
                    "-".join([exam_id, topic_name, subject_name]),
                    f"{exam_name} -> {topic_name} -> {subject_name}",
                    metadata_by_key[normalized_exam_id]["group"],
                )

    if db is None:
        return

    metadata_rows = await db.exam_metadata.find({}, {"_id": 0, "exam_id": 1, "name": 1, "full_name": 1, "category": 1}).to_list(2000)
    for row in metadata_rows:
        exam_id = row.get("exam_id") or row.get("id") or row.get("name")
        if not exam_id:
            continue
        normalized_exam_id = normalize_scope_key(exam_id)
        metadata_by_key[normalized_exam_id] = {
            "name": row.get("name") or row.get("full_name") or exam_id,
            "group": row.get("category") or "Competitive Exams",
        }
        _append_scope_option(options, seen, exam_id, metadata_by_key[normalized_exam_id]["name"], metadata_by_key[normalized_exam_id]["group"])

    exam_sheet_rows = await db.exam_sheets.find(
        {"type": "exam"},
        {"_id": 0, "exam_name": 1, "syllabus_topic": 1, "subject": 1, "sub_topic": 1, "sub_sub_topic": 1},
    ).to_list(20000)

    for row in exam_sheet_rows:
        exam_id = str(row.get("exam_name") or "").strip()
        if not exam_id:
            continue

        normalized_exam_id = normalize_scope_key(exam_id)
        exam_meta = metadata_by_key.get(normalized_exam_id, {
            "name": exam_id,
            "group": "Competitive Exams",
        })
        exam_name = exam_meta["name"]
        group = exam_meta["group"]

        _append_scope_option(options, seen, exam_id, exam_name, group)

        syllabus_topic = str(row.get("syllabus_topic") or "").strip()
        subject_name = str(row.get("subject") or "").strip()
        sub_topic = str(row.get("sub_topic") or "").strip()
        sub_sub_topic = str(row.get("sub_sub_topic") or "").strip()

        if syllabus_topic:
            _append_scope_option(options, seen, "-".join([exam_id, syllabus_topic]), f"{exam_name} -> {syllabus_topic}", group)
        if syllabus_topic and subject_name:
            _append_scope_option(options, seen, "-".join([exam_id, syllabus_topic, subject_name]), f"{exam_name} -> {syllabus_topic} -> {subject_name}", group)
        if syllabus_topic and subject_name and sub_topic:
            _append_scope_option(options, seen, "-".join([exam_id, syllabus_topic, subject_name, sub_topic]), f"{exam_name} -> {syllabus_topic} -> {subject_name} -> {sub_topic}", group)
        if syllabus_topic and subject_name and sub_topic and sub_sub_topic:
            _append_scope_option(options, seen, "-".join([exam_id, syllabus_topic, subject_name, sub_topic, sub_sub_topic]), f"{exam_name} -> {syllabus_topic} -> {subject_name} -> {sub_topic} -> {sub_sub_topic}", group)


async def _append_board_scope_options(options: List[Dict[str, str]], seen: set[str]) -> None:
    board_class_specs = {
        "cbse": [("6", None), ("7", None), ("8", None), ("9", None), ("10", None), ("11", "science"), ("11", "commerce"), ("11", "humanities"), ("12", "science"), ("12", "commerce"), ("12", "humanities")],
        "rbse": [("6", None), ("7", None), ("8", None), ("9", None), ("10", None)],
        "hbse": [("6", None), ("7", None), ("8", None), ("9", None), ("10", None)],
        "upboard": [("6", None), ("7", None), ("8", None), ("9", None), ("10", None)],
        "bseb": [("6", None), ("7", None), ("8", None), ("9", None), ("10", None)],
        "mpbse": [("6", None), ("7", None), ("8", None), ("9", None), ("10", None)],
    }

    if db is None:
        for board_key, class_specs in board_class_specs.items():
            board_label = _board_label(board_key)
            _append_scope_option(options, seen, board_key, board_label, "Boards")
            for class_num, stream in class_specs:
                class_name = f"Class {class_num}"
                if stream:
                    class_name = f"Class {class_num} ({stream.title()})"
                subjects = get_subjects_for_board_class(class_num, stream, board=board_key)
                if not subjects:
                    continue
                class_key = _class_scope_key(board_key, class_name)
                _append_scope_option(options, seen, class_key, f"{board_label} -> {class_name}", "Boards")
                for subject in subjects:
                    subject_name = subject["name"]
                    subject_key = "-".join([class_key, subject_name])
                    _append_scope_option(options, seen, subject_key, f"{board_label} -> {class_name} -> {subject_name}", "Boards")
                    for chapter in get_chapters_for_board_subject(class_num, subject["slug"], stream, board=board_key):
                        chapter_name = _chapter_name(chapter)
                        if chapter_name:
                            _append_scope_option(options, seen, "-".join([subject_key, chapter_name]), f"{board_label} -> {class_name} -> {subject_name} -> {chapter_name}", "Boards")
        return

    boards = set(board_class_specs.keys())
    boards.update(normalize_scope_key(board) for board in await db.class_chapters.distinct("board") if board)
    boards.update(normalize_scope_key(board) for board in await db.exam_sheets.distinct("board", {"type": "class"}) if board)

    for board_key in sorted(board for board in boards if board):
        board_label = _board_label(board_key)
        _append_scope_option(options, seen, board_key, board_label, "Boards")

        class_rows = await db.class_chapters.find(
            {"board": _board_filter(board_key)},
            {"_id": 0, "class_name": 1, "subject": 1, "chapter_name": 1},
        ).to_list(10000)
        sheet_rows = await db.exam_sheets.find(
            {"type": "class", "board": _board_filter(board_key)},
            {"_id": 0, "class_name": 1, "subject": 1, "chapter": 1},
        ).to_list(10000)

        class_subjects: Dict[str, Dict[str, List[str]]] = {}

        for row in class_rows:
            class_name = str(row.get("class_name") or "").strip()
            subject_name = str(row.get("subject") or "").strip()
            chapter_name = str(row.get("chapter_name") or "").strip()
            if not class_name or not subject_name:
                continue
            class_subjects.setdefault(class_name, {}).setdefault(subject_name, [])
            if chapter_name:
                class_subjects[class_name][subject_name].append(chapter_name)

        for row in sheet_rows:
            class_name = str(row.get("class_name") or "").strip()
            subject_name = str(row.get("subject") or "").strip()
            chapter_name = str(row.get("chapter") or "").strip()
            if not class_name or not subject_name:
                continue
            class_subjects.setdefault(class_name, {}).setdefault(subject_name, [])
            if chapter_name:
                class_subjects[class_name][subject_name].append(chapter_name)

        # Fallback to static board master data so scopes stay visible even when DB rows are absent.
        for class_num, stream in board_class_specs.get(board_key, []):
            class_name = f"Class {class_num}"
            if stream:
                class_name = f"Class {class_num} ({stream.title()})"

            static_subjects = get_subjects_for_board_class(class_num, stream, board=board_key)
            if not static_subjects:
                continue

            class_subjects.setdefault(class_name, {})
            for subject in static_subjects:
                subject_name = subject.get("name")
                if not subject_name:
                    continue
                class_subjects[class_name].setdefault(subject_name, [])
                static_chapters = get_chapters_for_board_subject(class_num, subject.get("slug", ""), stream, board=board_key)
                for chapter in static_chapters or []:
                    chapter_name = _chapter_name(chapter)
                    if chapter_name:
                        class_subjects[class_name][subject_name].append(chapter_name)

        for class_name in sorted(class_subjects.keys()):
            class_key = _class_scope_key(board_key, class_name)
            _append_scope_option(options, seen, class_key, f"{board_label} -> {class_name}", "Boards")

            for subject_name in sorted(class_subjects[class_name].keys(), key=str.lower):
                subject_key = "-".join([class_key, subject_name])
                _append_scope_option(options, seen, subject_key, f"{board_label} -> {class_name} -> {subject_name}", "Boards")
                chapter_names = sorted({_chapter_name(chapter) for chapter in class_subjects[class_name][subject_name] if _chapter_name(chapter)}, key=str.lower)
                for chapter_name in chapter_names:
                    _append_scope_option(options, seen, "-".join([subject_key, chapter_name]), f"{board_label} -> {class_name} -> {subject_name} -> {chapter_name}", "Boards")


async def build_scope_catalog() -> List[Dict[str, str]]:
    options: List[Dict[str, str]] = []
    seen: set[str] = set()
    await _append_exam_scope_options(options, seen)
    await _append_board_scope_options(options, seen)
    options.sort(key=lambda option: (option["group"], option["label"]))
    return options


async def resolve_scope_label(scope_key: str) -> str:
    normalized_key = normalize_scope_key(scope_key)
    for option in await build_scope_catalog():
        if option["key"] == normalized_key:
            return option["label"]
    return normalized_key

async def find_matching_assignment(db, scope_key: str):
    search_keys = build_scope_search_keys(scope_key)
    
    assignments = await db.sponsor_assignments.find({"scope_key": {"$in": search_keys}}).to_list(100)
    if not assignments:
        return None
    
    assignments.sort(key=lambda a: search_keys.index(a["scope_key"]))
    
    now = datetime.now(timezone.utc)
    for assignment in assignments:
        sponsor = await db.sponsors.find_one({"id": assignment["sponsor_id"]})
        if not sponsor:
            continue
        
        active_from = sponsor.get("active_from")
        active_to = sponsor.get("active_to")
        
        if active_from:
            try:
                from_dt = datetime.fromisoformat(active_from.replace("Z", "+00:00"))
                if now < from_dt:
                    continue
            except Exception:
                pass
        
        if active_to:
            try:
                to_dt = datetime.fromisoformat(active_to.replace("Z", "+00:00"))
                if now > to_dt:
                    continue
            except Exception:
                pass
        
        return {
            "assignment": assignment,
            "sponsor": sponsor
        }
    return None


async def find_first_matching_assignment(db, scope_keys: List[str]):
    for scope_key in scope_keys:
        normalized_scope_key = normalize_scope_key(scope_key)
        if not normalized_scope_key:
            continue
        match = await find_matching_assignment(db, normalized_scope_key)
        if match:
            return match
    return None

@router.post("/api/sponsors")
async def create_sponsor(sponsor: SponsorCreate):
    sponsor_id = str(uuid.uuid4())
    sponsor_data = sponsor.dict()
    sponsor_data["id"] = sponsor_id
    sponsor_data["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.sponsors.insert_one(sponsor_data)
    sponsor_data.pop("_id", None)
    return {"success": True, "sponsor": sponsor_data}

@router.get("/api/sponsors")
async def list_sponsors():
    sponsors = await db.sponsors.find({}, {"_id": 0}).to_list(1000)
    return {"success": True, "sponsors": sponsors}

@router.put("/api/sponsors/{sponsor_id}")
async def update_sponsor(sponsor_id: str, sponsor: SponsorUpdate):
    existing = await db.sponsors.find_one({"id": sponsor_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    
    update_data = {k: v for k, v in sponsor.dict().items() if v is not None}
    if update_data:
        await db.sponsors.update_one({"id": sponsor_id}, {"$set": update_data})
    
    updated = await db.sponsors.find_one({"id": sponsor_id}, {"_id": 0})
    return {"success": True, "sponsor": updated}

@router.delete("/api/sponsors/{sponsor_id}")
async def delete_sponsor(sponsor_id: str):
    res = await db.sponsors.delete_one({"id": sponsor_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    await db.sponsor_assignments.delete_many({"sponsor_id": sponsor_id})
    return {"success": True}

@router.post("/api/sponsors/assignments")
async def create_assignment(assignment: AssignmentCreate):
    sponsor = await db.sponsors.find_one({"id": assignment.sponsor_id})
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")

    normalized_scope_key = normalize_scope_key(assignment.scope_key)
    if not normalized_scope_key:
        raise HTTPException(status_code=400, detail="Invalid scope key")
    
    assignment_id = str(uuid.uuid4())
    assignment_data = {
        "id": assignment_id,
        "sponsor_id": assignment.sponsor_id,
        "scope_key": normalized_scope_key,
        "impressions": 0,
        "clicks": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sponsor_assignments.insert_one(assignment_data)
    assignment_data.pop("_id", None)
    return {"success": True, "assignment": assignment_data}

@router.get("/api/sponsors/assignments")
async def list_assignments():
    assignments = await db.sponsor_assignments.find({}, {"_id": 0}).to_list(1000)
    scope_catalog = await build_scope_catalog()
    scope_labels = {option["key"]: option["label"] for option in scope_catalog}
    enriched = []
    for a in assignments:
        a["scope_key"] = normalize_scope_key(a.get("scope_key", ""))
        a["scope_label"] = scope_labels.get(a["scope_key"], a["scope_key"])
        sponsor = await db.sponsors.find_one({"id": a["sponsor_id"]}, {"_id": 0, "name": 1, "logo_url": 1})
        if sponsor:
            a["sponsor_name"] = sponsor["name"]
            a["sponsor_logo_url"] = sponsor["logo_url"]
        enriched.append(a)
    return {"success": True, "assignments": enriched}


@router.get("/api/sponsors/scopes")
async def list_sponsor_scopes():
    scopes = await build_scope_catalog()
    return {"success": True, "scopes": scopes}

@router.delete("/api/sponsors/assignments/{assignment_id}")
async def delete_assignment(assignment_id: str):
    res = await db.sponsor_assignments.delete_one({"id": assignment_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"success": True}

@router.get("/api/sponsors/match/{scope_key}")
async def match_sponsor(scope_key: str):
    normalized_scope_key = normalize_scope_key(scope_key)
    match = await find_matching_assignment(db, normalized_scope_key)
    if not match:
        return {"success": True, "match": None}
    
    match["assignment"].pop("_id", None)
    match["sponsor"].pop("_id", None)
    match["assignment"]["scope_key"] = normalize_scope_key(match["assignment"].get("scope_key", ""))
    match["assignment"]["scope_label"] = await resolve_scope_label(match["assignment"]["scope_key"])
    return {
        "success": True,
        "match": {
            "assignment": match["assignment"],
            "sponsor": match["sponsor"]
        }
    }


@router.post("/api/sponsors/match")
async def match_sponsor_from_scopes(payload: ScopeMatchRequest):
    if not payload.scope_keys:
        return {"success": True, "match": None}

    match = await find_first_matching_assignment(db, payload.scope_keys)
    if not match:
        return {"success": True, "match": None}

    match["assignment"].pop("_id", None)
    match["sponsor"].pop("_id", None)
    match["assignment"]["scope_key"] = normalize_scope_key(match["assignment"].get("scope_key", ""))
    match["assignment"]["scope_label"] = await resolve_scope_label(match["assignment"]["scope_key"])
    return {
        "success": True,
        "match": {
            "assignment": match["assignment"],
            "sponsor": match["sponsor"]
        }
    }

@router.post("/api/sponsors/assignments/{assignment_id}/impression")
async def record_impression(assignment_id: str):
    res = await db.sponsor_assignments.update_one(
        {"id": assignment_id},
        {"$inc": {"impressions": 1}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"success": True}

@router.post("/api/sponsors/assignments/{assignment_id}/click")
async def record_click(assignment_id: str):
    res = await db.sponsor_assignments.update_one(
        {"id": assignment_id},
        {"$inc": {"clicks": 1}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"success": True}
