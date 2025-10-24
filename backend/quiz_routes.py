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
    
    # Try to get questions from Google Sheets first
    questions = []
    source = "demo"
    
    if topic:
        # Check if there's a Google Sheet mapping for this topic
        MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        DB_NAME = os.getenv("DB_NAME", "test_database")
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        sheet_mapping = await db.question_sheets.find_one({
            "exam_id": exam,
            "subject": subject,
            "topic": topic
        })
        
        if sheet_mapping:
            try:
                sheets_service = GoogleSheetsService()
                questions = sheets_service.fetch_questions(
                    sheet_mapping["sheet_url"],
                    sheet_mapping.get("sheet_name")
                )
                
                if questions:
                    source = "google_sheets"
                    print(f"✅ Loaded {len(questions)} questions from Google Sheets for {exam}/{subject}/{topic}")
            except Exception as e:
                print(f"⚠️ Error fetching from Google Sheets: {e}")
    
    # Fallback to demo questions if Google Sheets failed or not configured
    if not questions:
        if exam in DEMO_QUESTIONS and subject in DEMO_QUESTIONS[exam]:
            questions = DEMO_QUESTIONS[exam][subject]
            source = "demo"
        else:
            raise HTTPException(status_code=500, detail="Questions not available for this subject")
    
    # Randomize and limit to 10 questions
    random.shuffle(questions)
    questions = questions[:10]
    
    # Remove correct answers for client
    questions_for_client = [
        {
            "id": q["id"],
            "question": q["question"],
            "options": q["options"]
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
