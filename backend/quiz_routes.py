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

class QuizSubmitRequest(BaseModel):
    quizId: str
    answers: List[Dict[str, Any]]

# In-memory quiz sessions
quiz_sessions = {}

@router.get("/exams")
async def get_exams():
    exams = [
        {"name": exam, "subjects": list(subjects.keys())}
        for exam, subjects in SHEETS_CONFIG.items()
    ]
    return {"success": True, "exams": exams}

@router.get("/subjects/{exam}")
async def get_subjects(exam: str):
    if exam not in SHEETS_CONFIG:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    subjects = [
        {"name": subject, "sheetId": sheet_id}
        for subject, sheet_id in SHEETS_CONFIG[exam].items()
    ]
    return {"success": True, "exam": exam, "subjects": subjects}

@router.post("/start")
async def start_quiz(request: QuizStartRequest):
    exam = request.exam
    subject = request.subject
    
    if exam not in SHEETS_CONFIG or subject not in SHEETS_CONFIG[exam]:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Use demo questions
    if exam in DEMO_QUESTIONS and subject in DEMO_QUESTIONS[exam]:
        questions = DEMO_QUESTIONS[exam][subject]
        random.shuffle(questions)
        questions = questions[:10]
    else:
        raise HTTPException(status_code=500, detail="Questions not available")
    
    # Remove correct answers
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
        "subject": subject
    }
    
    return {
        "success": True,
        "quizId": quiz_id,
        "exam": exam,
        "subject": subject,
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
