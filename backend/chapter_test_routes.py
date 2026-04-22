from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from cbse_chapter_data import get_chapters_by_class_subject, get_all_subjects_for_class, get_chapter_details
import os
import secrets

# Import MongoDB connection
import motor.motor_asyncio
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')
mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

router = APIRouter(prefix="/api/chapter-tests", tags=["chapter-tests"])


class ChapterResponse(BaseModel):
    chapter_number: int
    chapter_name: str
    total_questions: int
    difficulty: str
    duration: int
    attempted: bool = False
    last_score: Optional[int] = None


@router.get("/chapters")
async def get_chapters(class_param: str = None, subject: str = None):
    """Get all chapters for a specific class and subject"""
    try:
        # Extract class number from parameter
        if class_param:
            class_number = class_param.replace('class-', '').replace('Class ', '')
        else:
            return {"success": False, "error": "Class parameter is required"}
        
        if not subject:
            return {"success": False, "error": "Subject parameter is required"}
        
        # Normalize subject name: convert from URL slug to proper name
        # Handle special cases with dashes like "Hindi - Malhar" -> "hindi---malhar"
        # First replace triple dashes with special marker, then single dashes with spaces
        normalized_subject = subject.replace('---', '|||').replace('-', ' ').replace('|||', ' - ').title()
        
        # Fix common words that should stay lowercase (and, of, the, in, etc.)
        # These words are typically lowercase in titles except at the start
        lowercase_words = ['And', 'Of', 'The', 'In', 'On', 'At', 'To', 'For', 'With', 'Or']
        words = normalized_subject.split(' ')
        for i, word in enumerate(words):
            if i > 0 and word in lowercase_words:  # Don't lowercase first word
                words[i] = word.lower()
        normalized_subject = ' '.join(words)
        
        # Get chapters from data
        chapters = get_chapters_by_class_subject(class_number, normalized_subject)
        
        # Format response
        chapter_list = []
        for chapter in chapters:
            chapter_list.append({
                "chapter_number": chapter["chapter_number"],
                "chapter_name": chapter["chapter_name"],
                "total_questions": chapter["total_questions"],
                "difficulty": chapter["difficulty"],
                "duration": chapter["duration"],
                "attempted": False,  # TODO: Get from database based on user progress
                "last_score": None   # TODO: Get from database
            })
        
        return {
            "success": True,
            "chapters": chapter_list,
            "class": class_number,
            "subject": subject
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/subjects/{class_number}")
async def get_subjects(class_number: str):
    """Get all subjects available for a class"""
    try:
        # Extract class number
        class_num = class_number.replace('class-', '').replace('Class ', '')
        subjects = get_all_subjects_for_class(class_num)
        
        return {
            "success": True,
            "subjects": subjects,
            "class": class_num
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chapter/{class_number}/{subject}/{chapter_number}")
async def get_chapter(class_number: str, subject: str, chapter_number: int):
    """Get details of a specific chapter"""
    try:
        class_num = class_number.replace('class-', '').replace('Class ', '')
        chapter = get_chapter_details(class_num, subject, chapter_number)
        
        if not chapter:
            return {"success": False, "error": "Chapter not found"}
        
        return {
            "success": True,
            "chapter": chapter
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/classes")
async def get_all_classes():
    """Get list of all available classes"""
    return {
        "success": True,
        "classes": [6, 7, 8, 9, 10, 11, 12]
    }


@router.get("/questions")
async def get_chapter_questions(
    class_param: str = Query(..., description="Class number e.g., class-7"),
    subject: str = Query(..., description="Subject slug e.g., english---poorvi"),
    chapter: int = Query(..., description="Chapter number"),
    limit: int = Query(20, description="Number of questions to return"),
    randomize: bool = Query(True, description="Whether to randomize questions")
):
    """Get questions for a specific chapter from the database"""
    try:
        # Extract class number
        class_number = class_param.replace('class-', '').replace('Class ', '')
        
        # Normalize subject name
        normalized_subject = subject.replace('---', '|||').replace('-', ' ').replace('|||', ' - ').title()
        
        # Build query
        query = {
            "class_name": f"Class {class_number}",
            "chapter_number": chapter
        }
        
        # Add subject filter - try different formats
        if 'poorvi' in subject.lower():
            query["subject"] = {"$regex": "poorvi", "$options": "i"}
        else:
            query["subject"] = {"$regex": normalized_subject, "$options": "i"}
        
        # Get questions from database
        questions_cursor = db.questions.find(query, {"_id": 0})
        questions = await questions_cursor.to_list(length=500)
        
        if not questions:
            return {
                "success": False,
                "error": f"No questions found for Class {class_number}, {normalized_subject}, Chapter {chapter}",
                "questions": []
            }
        
        # Randomize if requested
        if randomize and len(questions) > limit:
            questions = random.sample(questions, limit)
        else:
            questions = questions[:limit]
        
        return {
            "success": True,
            "total_available": len(questions),
            "questions": questions,
            "class": class_number,
            "subject": normalized_subject,
            "chapter": chapter
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/start-test")
async def start_chapter_test(
    class_param: str = Query(...),
    subject: str = Query(...),
    chapter: int = Query(...),
    num_questions: int = Query(20, description="Number of questions for the test")
):
    """Start a chapter test with randomized questions"""
    try:
        class_number = class_param.replace('class-', '').replace('Class ', '')
        
        # Build query
        query = {
            "class_name": f"Class {class_number}",
            "chapter_number": chapter
        }
        
        if 'poorvi' in subject.lower():
            query["subject"] = {"$regex": "poorvi", "$options": "i"}
        
        # Get all questions
        questions_cursor = db.questions.find(query, {"_id": 0})
        all_questions = await questions_cursor.to_list(length=500)
        
        if not all_questions:
            return {"success": False, "error": "No questions found"}
        
        # Randomize and limit
        test_questions = random.sample(all_questions, min(num_questions, len(all_questions)))
        
        # Remove explanation for test mode (don't show until submitted)
        for q in test_questions:
            q.pop('explanation', None)
        
        return {
            "success": True,
            "test_id": f"test-{class_number}-{chapter}-{secrets.token_hex(4)}",
            "total_questions": len(test_questions),
            "duration_minutes": max(30, len(test_questions) * 1.5),
            "questions": test_questions
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
