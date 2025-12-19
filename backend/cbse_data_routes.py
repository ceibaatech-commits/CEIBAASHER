"""
CBSE Data API Routes - Single Source of Truth
Serves all CBSE subjects and chapters data to both frontend and admin panel
"""

from fastapi import APIRouter, HTTPException
from cbse_master_data import (
    get_subjects_for_class, 
    get_chapters_for_subject, 
    get_all_cbse_data,
    CBSE_SUBJECTS,
    CBSE_CHAPTERS
)

router = APIRouter(prefix="/cbse-data", tags=["CBSE Data"])


@router.get("/subjects/{class_num}")
async def get_class_subjects(class_num: str, stream: str = None):
    """
    Get all subjects for a CBSE class.
    For Class 11/12, stream parameter is required (science/commerce)
    """
    subjects = get_subjects_for_class(class_num, stream)
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
async def get_subject_chapters(class_num: str, subject_slug: str, stream: str = None):
    """
    Get all chapters for a subject in a class.
    For Class 11/12, stream parameter is required (science/commerce)
    """
    chapters = get_chapters_for_subject(class_num, subject_slug, stream)
    
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
        "data": get_all_cbse_data()
    }


@router.get("/admin/class-subjects")
async def get_admin_class_subjects():
    """
    Get subjects organized by class for admin panel dropdown.
    Returns format compatible with ExamSheetManager.
    """
    result = {}
    
    # Classes 6-10
    for class_num in ["6", "7", "8", "9", "10"]:
        class_name = f"Class {class_num}"
        subjects = get_subjects_for_class(class_num)
        result[class_name] = {subj["name"]: [] for subj in subjects}
        
        # Add chapters for each subject
        for subj in subjects:
            chapters = get_chapters_for_subject(class_num, subj["slug"])
            result[class_name][subj["name"]] = chapters
    
    # Class 11 Science
    subjects_11_sci = get_subjects_for_class("11", "science")
    result["Class 11 (Science)"] = {}
    for subj in subjects_11_sci:
        chapters = get_chapters_for_subject("11", subj["slug"], "science")
        result["Class 11 (Science)"][subj["name"]] = chapters
    
    # Class 11 Commerce
    subjects_11_com = get_subjects_for_class("11", "commerce")
    result["Class 11 (Commerce)"] = {}
    for subj in subjects_11_com:
        chapters = get_chapters_for_subject("11", subj["slug"], "commerce")
        result["Class 11 (Commerce)"][subj["name"]] = chapters
    
    # Class 12 Science
    subjects_12_sci = get_subjects_for_class("12", "science")
    result["Class 12 (Science)"] = {}
    for subj in subjects_12_sci:
        chapters = get_chapters_for_subject("12", subj["slug"], "science")
        result["Class 12 (Science)"][subj["name"]] = chapters
    
    # Class 12 Commerce
    subjects_12_com = get_subjects_for_class("12", "commerce")
    result["Class 12 (Commerce)"] = {}
    for subj in subjects_12_com:
        chapters = get_chapters_for_subject("12", subj["slug"], "commerce")
        result["Class 12 (Commerce)"][subj["name"]] = chapters
    
    return {
        "success": True,
        "class_subjects": result
    }
