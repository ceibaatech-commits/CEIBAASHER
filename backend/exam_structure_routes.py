"""
Exam Structure Routes - Database-Driven Exam Hierarchy
This replaces hardcoded exam_data.py with dynamic database queries
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import os

router = APIRouter()

# Global db instance
db = None

def init_db(database):
    global db
    db = database


@router.get("/api/exams/structure")
async def get_all_exams_structure():
    """
    Get all exams with their complete structure from database
    Returns dynamic structure based on what's in exam_sheets collection
    """
    try:
        # Get all unique exams from exam_sheets
        pipeline = [
            {
                "$match": {
                    "type": "exam"  # Only exam type, not class or book
                    # NOTE: Not filtering by questions_imported - show all sheets
                }
            },
            {
                "$group": {
                    "_id": "$exam_name",
                    "exam_name": {"$first": "$exam_name"}
                }
            },
            {
                "$sort": {"exam_name": 1}
            }
        ]
        
        exams_cursor = db.exam_sheets.aggregate(pipeline)
        exams_list = await exams_cursor.to_list(length=None)
        
        # Build structure for each exam
        result = []
        for exam_doc in exams_list:
            exam_name = exam_doc["exam_name"]
            
            # Get structure for this exam
            structure = await get_exam_structure_from_db(exam_name)
            
            result.append({
                "id": exam_name,
                "name": exam_name,
                "structure": structure
            })
        
        return {
            "success": True,
            "exams": result
        }
    
    except Exception as e:
        import traceback
        print(f"Error fetching exam structure: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/exams/structure/{exam_id}")
async def get_exam_structure(exam_id: str):
    """
    Get complete structure for a specific exam from database
    This is what the frontend should use instead of hardcoded exam_data.py
    """
    try:
        structure = await get_exam_structure_from_db(exam_id)
        
        if not structure:
            raise HTTPException(
                status_code=404, 
                detail=f"No data found for exam: {exam_id}. Please add sheets in Admin Panel first."
            )
        
        return {
            "success": True,
            "exam_id": exam_id,
            "structure": structure
        }
    
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        print(f"Error fetching exam structure: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


async def get_exam_structure_from_db(exam_name: str) -> Dict[str, Any]:
    """
    Build exam structure dynamically from database
    Returns: {
        "syllabus_topics": {
            "Physics": {
                "subjects": {
                    "Mechanics": {
                        "sub_topics": ["Kinematics", "Laws of Motion"],
                        "question_count": 50
                    }
                }
            }
        }
    }
    """
    # Query all sheets for this exam
    # NOTE: Not filtering by questions_imported to show all registered sheets
    sheets = await db.exam_sheets.find({
        "type": "exam",
        "exam_name": {"$regex": f"^{exam_name}", "$options": "i"}
    }).to_list(length=1000)
    
    if not sheets:
        return None
    
    # Build hierarchical structure
    structure = {
        "syllabus_topics": {}
    }
    
    for sheet in sheets:
        syllabus_topic = sheet.get("syllabus_topic")
        subject = sheet.get("subject")
        sub_topic = sheet.get("sub_topic")
        question_count = sheet.get("question_count", 0)
        
        # Initialize syllabus_topic if needed
        if syllabus_topic and syllabus_topic not in structure["syllabus_topics"]:
            structure["syllabus_topics"][syllabus_topic] = {
                "subjects": {}
            }
        
        # Initialize subject if needed
        if syllabus_topic and subject:
            if subject not in structure["syllabus_topics"][syllabus_topic]["subjects"]:
                structure["syllabus_topics"][syllabus_topic]["subjects"][subject] = {
                    "sub_topics": [],
                    "question_count": 0
                }
            
            # Add sub_topic if provided
            if sub_topic:
                subject_data = structure["syllabus_topics"][syllabus_topic]["subjects"][subject]
                if sub_topic not in subject_data["sub_topics"]:
                    subject_data["sub_topics"].append(sub_topic)
            
            # Add question count
            structure["syllabus_topics"][syllabus_topic]["subjects"][subject]["question_count"] += question_count
    
    return structure


@router.get("/api/exams/{exam_id}/topics")
async def get_exam_topics(exam_id: str):
    """
    Get all syllabus topics for an exam (from database)
    """
    try:
        # Use regex to match exam names flexibly
        pipeline = [
            {
                "$match": {
                    "type": "exam",
                    "exam_name": {"$regex": f"^{exam_id}", "$options": "i"}
                    # NOTE: Not filtering by questions_imported
                }
            },
            {
                "$group": {
                    "_id": "$syllabus_topic",
                    "topic": {"$first": "$syllabus_topic"}
                }
            },
            {
                "$sort": {"topic": 1}
            }
        ]
        
        cursor = db.exam_sheets.aggregate(pipeline)
        topics = await cursor.to_list(length=None)
        
        topic_list = [t["topic"] for t in topics if t["topic"]]
        
        return {
            "success": True,
            "exam": exam_id,
            "syllabus_topics": topic_list
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/exams/{exam_id}/topics/{topic}/subjects")
async def get_topic_subjects(exam_id: str, topic: str):
    """
    Get all subjects for a syllabus topic (from database)
    """
    try:
        pipeline = [
            {
                "$match": {
                    "type": "exam",
                    "exam_name": {"$regex": f"^{exam_id}", "$options": "i"},
                    "syllabus_topic": topic
                }
            },
            {
                "$group": {
                    "_id": "$subject",
                    "subject": {"$first": "$subject"},
                    "total_questions": {"$sum": "$question_count"}
                }
            },
            {
                "$sort": {"subject": 1}
            }
        ]
        
        cursor = db.exam_sheets.aggregate(pipeline)
        subjects = await cursor.to_list(length=None)
        
        subject_list = [
            {
                "name": s["subject"],
                "question_count": s["total_questions"]
            }
            for s in subjects if s["subject"]
        ]
        
        return {
            "success": True,
            "exam": exam_id,
            "topic": topic,
            "subjects": subject_list
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/exams/{exam_id}/topics/{topic}/subjects/{subject}/subtopics")
async def get_subject_subtopics(exam_id: str, topic: str, subject: str):
    """
    Get all sub-topics for a subject (from database)
    """
    try:
        pipeline = [
            {
                "$match": {
                    "type": "exam",
                    "exam_name": {"$regex": f"^{exam_id}", "$options": "i"},
                    "syllabus_topic": topic,
                    "subject": subject,
                    "questions_imported": True
                }
            },
            {
                "$group": {
                    "_id": "$sub_topic",
                    "sub_topic": {"$first": "$sub_topic"},
                    "total_questions": {"$sum": "$question_count"}
                }
            },
            {
                "$sort": {"sub_topic": 1}
            }
        ]
        
        cursor = db.exam_sheets.aggregate(pipeline)
        subtopics = await cursor.to_list(length=None)
        
        subtopic_list = [
            {
                "name": s["sub_topic"] if s["sub_topic"] else "General",
                "question_count": s["total_questions"]
            }
            for s in subtopics
        ]
        
        return {
            "success": True,
            "exam": exam_id,
            "topic": topic,
            "subject": subject,
            "sub_topics": subtopic_list
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/exams/validate/{exam_id}")
async def validate_exam_data(exam_id: str):
    """
    Validate if exam has any data in database
    """
    try:
        count = await db.exam_sheets.count_documents({
            "type": "exam",
            "exam_name": {"$regex": f"^{exam_id}", "$options": "i"},
            "questions_imported": True
        })
        
        return {
            "success": True,
            "exam_id": exam_id,
            "has_data": count > 0,
            "sheet_count": count
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
