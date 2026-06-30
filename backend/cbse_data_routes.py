"""
CBSE Data API Routes - Single Source of Truth
Serves all CBSE subjects and chapters data to both frontend and admin panel
"""

from fastapi import APIRouter, HTTPException
import re
from board_master_data import (
    get_subjects_for_board_class,
    get_chapters_for_board_subject,
    get_all_board_data,
)
from board_sheet_data import (
    get_dynamic_board_admin_map,
    get_dynamic_board_chapters_for_subject,
    get_dynamic_board_subjects_for_class,
    is_dynamic_board,
)
import os

# MongoDB connection
from database import db

router = APIRouter(prefix="/cbse-data", tags=["CBSE Data"])


def _normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (value or "").lower())


async def _get_db_chapters_for_board_class_subject(class_num: str, subject_name: str, stream: str = None, board: str = None):
    """Return DB chapters for a board/class/subject if they exist."""
    board_key = (board or "cbse").lower()
    # Case-insensitive board match so legacy rows stored as "HBSE" still resolve
    # alongside newly-normalized "hbse" rows.
    board_filter = {"$regex": f"^{re.escape(board_key)}$", "$options": "i"}
    class_candidates = []

    base_class_name = f"Class {class_num}"
    class_candidates.append(base_class_name)
    if stream and class_num in {"11", "12"}:
        class_candidates.append(f"Class {class_num} ({stream.title()})")

    subject_key = _normalize_key(subject_name)

    for class_name in class_candidates:
        docs = await db.class_chapters.find(
            {"board": board_filter, "class_name": class_name},
            {"_id": 0}
        ).sort("chapter_number", 1).to_list(None)

        if not docs:
            continue

        # Prefer exact/normalized subject matches so renamed chapters show everywhere.
        normalized_docs = [doc for doc in docs if _normalize_key(doc.get("subject", "")) == subject_key]
        if normalized_docs:
            return normalized_docs

    return []


@router.get("/subjects/{class_num}")
async def get_class_subjects(class_num: str, stream: str = None, board: str = None):
    """
    Get all subjects for a CBSE class.
    For Class 11/12, stream parameter is required (science/commerce)
    """
    if is_dynamic_board(board):
        subjects = await get_dynamic_board_subjects_for_class(db, class_num, stream, board)
    else:
        subjects = get_subjects_for_board_class(class_num, stream, board)
    if not subjects:
        # Return empty list instead of error for classes without data
        return {"success": True, "class": class_num, "stream": stream, "subjects": []}
    
    return {
        "success": True,
        "class": class_num,
        "stream": stream,
        "subjects": subjects
    }


@router.get("/chapters/{class_num}/{subject_slug}")
async def get_subject_chapters(class_num: str, subject_slug: str, stream: str = None, board: str = None):
    """
    Get all chapters for a subject in a class.
    For Class 11/12, stream parameter is required (science/commerce)
    """
    db_chapters = await _get_db_chapters_for_board_class_subject(class_num, subject_slug.replace('---', ' - ').replace('-', ' ').title(), stream, board)
    if db_chapters:
        chapters = db_chapters
    elif is_dynamic_board(board):
        normalized_subject = subject_slug.replace('---', '|||').replace('-', ' ').replace('|||', ' - ').title()
        chapters = await get_dynamic_board_chapters_for_subject(db, class_num, normalized_subject, stream, board)
    else:
        chapters = get_chapters_for_board_subject(class_num, subject_slug, stream, board)
    
    return {
        "success": True,
        "class": class_num,
        "stream": stream,
        "subject": subject_slug,
        "chapters": chapters
    }


@router.get("/all")
async def get_all_data():
    """
    Get all CBSE data (subjects and chapters for all classes).
    Used by admin panel to populate dropdowns.
    """
    return {
        "success": True,
        "data": get_all_board_data()
    }


@router.get("/admin/class-subjects")
async def get_admin_class_subjects(board: str = None):
    """
    Get subjects organized by class for admin panel dropdown.
    Returns format compatible with ExamSheetManager.
    """
    if is_dynamic_board(board):
        return {
            "success": True,
            "class_subjects": await get_dynamic_board_admin_map(db, board)
        }

    result = {}
    
    # Classes 6-10
    for class_num in ["6", "7", "8", "9", "10"]:
        class_name = f"Class {class_num}"
        subjects = get_subjects_for_board_class(class_num, board=board)
        result[class_name] = {subj["name"]: [] for subj in subjects}
        
        # Add chapters for each subject
        for subj in subjects:
            db_chapters = await _get_db_chapters_for_board_class_subject(class_num, subj["name"], board=board)
            result[class_name][subj["name"]] = db_chapters or get_chapters_for_board_subject(class_num, subj["slug"], board=board)
    
    # Class 11 Science
    subjects_11_sci = get_subjects_for_board_class("11", "science", board=board)
    result["Class 11 (Science)"] = {}
    for subj in subjects_11_sci:
        db_chapters = await _get_db_chapters_for_board_class_subject("11", subj["name"], "science", board=board)
        result["Class 11 (Science)"][subj["name"]] = db_chapters or get_chapters_for_board_subject("11", subj["slug"], "science", board=board)
    
    # Class 11 Commerce
    subjects_11_com = get_subjects_for_board_class("11", "commerce", board=board)
    result["Class 11 (Commerce)"] = {}
    for subj in subjects_11_com:
        db_chapters = await _get_db_chapters_for_board_class_subject("11", subj["name"], "commerce", board=board)
        result["Class 11 (Commerce)"][subj["name"]] = db_chapters or get_chapters_for_board_subject("11", subj["slug"], "commerce", board=board)
    
    # Class 12 Science
    subjects_12_sci = get_subjects_for_board_class("12", "science", board=board)
    result["Class 12 (Science)"] = {}
    for subj in subjects_12_sci:
        db_chapters = await _get_db_chapters_for_board_class_subject("12", subj["name"], "science", board=board)
        result["Class 12 (Science)"][subj["name"]] = db_chapters or get_chapters_for_board_subject("12", subj["slug"], "science", board=board)
    
    # Class 12 Commerce
    subjects_12_com = get_subjects_for_board_class("12", "commerce", board=board)
    result["Class 12 (Commerce)"] = {}
    for subj in subjects_12_com:
        db_chapters = await _get_db_chapters_for_board_class_subject("12", subj["name"], "commerce", board=board)
        result["Class 12 (Commerce)"][subj["name"]] = db_chapters or get_chapters_for_board_subject("12", subj["slug"], "commerce", board=board)
    
    # Class 11 Humanities
    subjects_11_hum = get_subjects_for_board_class("11", "humanities", board=board)
    result["Class 11 (Humanities)"] = {}
    for subj in subjects_11_hum:
        db_chapters = await _get_db_chapters_for_board_class_subject("11", subj["name"], "humanities", board=board)
        result["Class 11 (Humanities)"][subj["name"]] = db_chapters or get_chapters_for_board_subject("11", subj["slug"], "humanities", board=board)
    
    # Class 12 Humanities
    subjects_12_hum = get_subjects_for_board_class("12", "humanities", board=board)
    result["Class 12 (Humanities)"] = {}
    for subj in subjects_12_hum:
        db_chapters = await _get_db_chapters_for_board_class_subject("12", subj["name"], "humanities", board=board)
        result["Class 12 (Humanities)"][subj["name"]] = db_chapters or get_chapters_for_board_subject("12", subj["slug"], "humanities", board=board)
    
    return {
        "success": True,
        "class_subjects": result
    }
