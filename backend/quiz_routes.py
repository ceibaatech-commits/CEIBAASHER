import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import random
from exam_data import get_all_exams, get_exam_details, get_exam_subjects, get_subject_topics, get_all_topics_flat

router = APIRouter(prefix="/quiz", tags=["quiz"])

# Demo questions (fallback)
from demo_questions import DEMO_QUESTIONS

class QuizStartRequest(BaseModel):
    exam: str
    subject: str
    topic: str = None  # Optional: for topic-specific quiz
    sub_topic: str = None  # NEW: Optional sub-topic for granular practice
    numberOfQuestions: int = 10  # NEW: Configurable question limit (default 10, max 100)

class QuizSubmitRequest(BaseModel):
    quizId: str
    answers: List[Dict[str, Any]]

# In-memory quiz sessions
quiz_sessions = {}

@router.get("/exams")
async def get_exams():
    """Get all available exams"""
    exams = get_all_exams()
    return {"success": True, "exams": exams}

@router.get("/exam/{exam_id}")
async def get_exam(exam_id: str):
    """Get complete exam details with syllabus"""
    exam = get_exam_details(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"success": True, "exam": exam}

@router.get("/subjects/{exam_id}")
async def get_subjects(exam_id: str):
    """Get all subjects for an exam"""
    subjects = get_exam_subjects(exam_id)
    if not subjects:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"success": True, "exam": exam_id, "subjects": subjects}

@router.get("/topics/all/{exam_id}")
async def get_all_topics(exam_id: str):
    """Get all topics across all subjects"""
    topics = get_all_topics_flat(exam_id)
    if not topics:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"success": True, "exam": exam_id, "topics": topics}

@router.get("/topics/{exam_id}/{subject}")
async def get_topics(exam_id: str, subject: str):
    """Get all topics for a subject"""
    topics = get_subject_topics(exam_id, subject)
    if not topics:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"success": True, "exam": exam_id, "subject": subject, "topics": topics}

@router.post("/start")
async def start_quiz(request: QuizStartRequest):
    from motor.motor_asyncio import AsyncIOMotorClient
    from google_sheets_service import GoogleSheetsService
    import os
    
    exam = request.exam
    subject = request.subject
    topic = request.topic
    sub_topic = request.sub_topic  # NEW: Get sub-topic
    
    # Try to get questions from Google Sheets first
    questions = []
    source = "demo"
    
    if topic:
        # Check if there's a Google Sheet mapping for this topic
        MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        DB_NAME = os.getenv("DB_NAME", "test_database")
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Build query using NEW field names that match Admin Sheet Manager
        # The 'subject' parameter from URL = 'syllabus_topic' in database
        # The 'topic' parameter from URL = 'subject' in database
        query = {
            "exam_name": exam,  # Changed from "exam_id" to match admin_routes
            "syllabus_topic": subject,
            "subject": topic
        }
        
        print(f"🔍 Querying exam_sheets collection for: {query}")
        
        # If sub_topic provided, try to find specific mapping
        if sub_topic:
            specific_query = {**query, "sub_topic": sub_topic}
            print(f"🔍 Looking for specific sub-topic: {specific_query}")
            specific_mapping = await db.exam_sheets.find_one(specific_query)
            sheet_mapping = specific_mapping
        else:
            sheet_mapping = await db.exam_sheets.find_one(query)
        
        if sheet_mapping:
            print(f"✅ Found sheet mapping in exam_sheets collection")
            print(f"   Sheet link: {sheet_mapping.get('sheet_link')}")
            print(f"   Questions imported: {sheet_mapping.get('questions_imported')}")
            print(f"   Question count: {sheet_mapping.get('question_count')}")
        else:
            print(f"❌ No sheet mapping found in exam_sheets collection")
            print(f"   Query used: {query}")
        
        if sheet_mapping:
            try:
                sheets_service = GoogleSheetsService()
                # Pass sub_topic filter if available
                filter_topic = sub_topic if sub_topic else topic
                
                # Extract sheet_link (admin saves as 'sheet_link' not 'sheet_url')
                sheet_url = sheet_mapping.get("sheet_link") or sheet_mapping.get("sheet_url")
                sheet_name = sheet_mapping.get("sheet_name")
                
                if not sheet_url:
                    print(f"⚠️ No sheet_link/sheet_url found in mapping for {exam}/{subject}/{topic}")
                    print(f"   Available keys: {list(sheet_mapping.keys())}")
                else:
                    questions = sheets_service.fetch_questions(
                        sheet_url,
                        sheet_name,
                        topic_filter=filter_topic  # Filter by sub-topic or topic
                    )
                    
                    if questions:
                        source = "google_sheets"
                        filter_info = f"{topic}/{sub_topic}" if sub_topic else topic
                        print(f"✅ Loaded {len(questions)} questions from Google Sheets for {exam}/{subject}/{filter_info}")
            except Exception as e:
                import traceback
                print(f"⚠️ Error fetching from Google Sheets: {e}")
                print(traceback.format_exc())
    
    # Fallback to demo questions if Google Sheets failed or not configured
    if not questions:
        if exam in DEMO_QUESTIONS and subject in DEMO_QUESTIONS[exam]:
            questions = DEMO_QUESTIONS[exam][subject]
            source = "demo"
        else:
            raise HTTPException(status_code=500, detail="Questions not available for this subject")
    
    # Get number of questions requested (default 10, max 100)
    num_questions = min(request.numberOfQuestions, 100)
    
    # Randomize and limit questions
    random.shuffle(questions)
    questions = questions[:num_questions]
    
    # For battle mode, include correctAnswer and explanation so frontend can validate immediately
    # Note: This is acceptable for battle mode where speed matters
    questions_for_client = [
        {
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
            "correctAnswer": q["correctAnswer"],
            "explanation": q.get("explanation", "")
        }
        for q in questions
    ]
    
    quiz_id = f"quiz_{random.randint(100000, 999999)}"
    quiz_sessions[quiz_id] = {
        "questions": questions,
        "exam": exam,
        "subject": subject,
        "topic": topic
    }
    
    return {
        "success": True,
        "quizId": quiz_id,
        "exam": exam,
        "subject": subject,
        "topic": topic,
        "questions": questions_for_client,
        "totalQuestions": len(questions),
        "timePerQuestion": 30
    }

@router.post("/submit")
async def submit_quiz(request: QuizSubmitRequest):
    quiz_id = request.quizId
    answers = request.answers
    
    if quiz_id not in quiz_sessions:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    session = quiz_sessions[quiz_id]
    questions = session["questions"]
    
    correct_answers = 0
    results = []
    
    for question in questions:
        user_answer = next((a for a in answers if a["questionId"] == question["id"]), None)
        is_correct = user_answer and user_answer.get("selectedOption") == question["correctAnswer"]
        
        if is_correct:
            correct_answers += 1
        
        results.append({
            "questionId": question["id"],
            "question": question["question"],
            "options": question["options"],
            "correctAnswer": question["correctAnswer"],
            "userAnswer": user_answer.get("selectedOption") if user_answer else None,
            "isCorrect": is_correct,
            "explanation": question.get("explanation", "")
        })
    
    score = round((correct_answers / len(questions)) * 100)
    
    # Clean up session
    del quiz_sessions[quiz_id]
    
    return {
        "success": True,
        "score": score,
        "correctAnswers": correct_answers,
        "totalQuestions": len(questions),
        "results": results
    }
