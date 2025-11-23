"""
Exam Metadata API Routes
Provides dynamic exam structure data to frontend
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List
from exam_data import EXAM_DATA

router = APIRouter()

@router.get("/api/exam-metadata")
async def get_exam_metadata():
    """
    Return exam metadata for frontend dropdowns
    This ensures frontend always has the latest exam structure
    """
    
    metadata = {
        "exams": [],
        "syllabusTopicsMap": {},
        "subjectsMap": {},
        "subTopicsMap": {}
    }
    
    # Build exams list with details
    for exam_id, data in EXAM_DATA.items():
        metadata["exams"].append({
            "id": exam_id,
            "name": data.get("name", exam_id),
            "full_name": data.get("full_name", ""),
            "category": data.get("category", "Other")
        })
    
    # Build syllabus topics map (Exam ID -> Syllabus Topics)
    for exam_id, data in EXAM_DATA.items():
        metadata["syllabusTopicsMap"][exam_id] = list(data["syllabus_topics"].keys())
    
    # Build subjects map (Syllabus Topic -> Subjects)
    all_subjects = {}
    for exam_id, data in EXAM_DATA.items():
        for syllabus_topic, topic_data in data["syllabus_topics"].items():
            if syllabus_topic not in all_subjects:
                all_subjects[syllabus_topic] = list(topic_data["subjects"].keys())
    metadata["subjectsMap"] = all_subjects
    
    # Build sub_topics map (Subject -> Sub Topics)
    all_sub_topics = {}
    for exam_id, data in EXAM_DATA.items():
        for syllabus_topic, topic_data in data["syllabus_topics"].items():
            for subject, subject_data in topic_data["subjects"].items():
                if subject not in all_sub_topics:
                    all_sub_topics[subject] = subject_data.get("sub_topics", [])
    metadata["subTopicsMap"] = all_sub_topics
    
    return metadata

@router.get("/api/exam-metadata/{exam_id}")
async def get_exam_metadata_by_id(exam_id: str):
    """
    Get metadata for a specific exam
    """
    if exam_id not in EXAM_DATA:
        raise HTTPException(status_code=404, detail=f"Exam {exam_id} not found")
    
    exam_data = EXAM_DATA[exam_id]
    
    return {
        "id": exam_id,
        "name": exam_data.get("name", exam_id),
        "full_name": exam_data.get("full_name", ""),
        "category": exam_data.get("category", "Other"),
        "syllabus_topics": list(exam_data["syllabus_topics"].keys()),
        "structure": {
            syllabus_topic: {
                "subjects": list(topic_data["subjects"].keys())
            }
            for syllabus_topic, topic_data in exam_data["syllabus_topics"].items()
        }
    }
