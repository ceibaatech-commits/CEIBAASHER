import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import random
from exam_data import get_all_exams, get_exam_details, get_exam_subjects, get_subject_topics, get_all_topics_flat

router = APIRouter(prefix="/quiz", tags=["quiz"])

# Demo questions (fallback)
from demo_questions import DEMO_QUESTIONS

class QuizStartRequest(BaseModel):
    exam: str
    subject: str
    topic: Optional[str] = None  # Optional: for topic-specific quiz
    sub_topic: Optional[str] = None  # NEW: Optional sub-topic for granular practice
    numberOfQuestions: int = 10  # NEW: Configurable question limit (default 10, max 100)
    # Class-based structure
    isClassBased: bool = False
    class_name: Optional[str] = None
    chapter: Optional[str] = None
    userId: Optional[str] = None  # NEW: User ID for auto-posting results

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
    """
    Get complete exam details with syllabus - DATABASE DRIVEN
    Now fetches from MongoDB exam_sheets collection, not hardcoded exam_data.py
    """
    # Import the database-driven function
    from exam_structure_routes import get_exam_structure_from_db, db
    
    # Try to get from database first
    structure = await get_exam_structure_from_db(exam_id)
    
    if structure:
        # Database has data - use it!
        # First try to get metadata from hardcoded exam_data for display purposes
        hardcoded_exam = get_exam_details(exam_id)
        
        exam = {
            "name": exam_id,
            "full_name": hardcoded_exam.get("full_name", exam_id) if hardcoded_exam else exam_id,
            "description": hardcoded_exam.get("description", f"Prepare for {exam_id} with comprehensive practice questions") if hardcoded_exam else f"Prepare for {exam_id} with comprehensive practice questions",
            "icon": hardcoded_exam.get("icon", "") if hardcoded_exam else "",
            "color": hardcoded_exam.get("color", "from-blue-500 to-cyan-500") if hardcoded_exam else "from-blue-500 to-cyan-500",
            "category": hardcoded_exam.get("category", "Competitive Exams") if hardcoded_exam else "Competitive Exams",
            "syllabus_topics": structure.get("syllabus_topics", {})  # Database-driven structure
        }
        return {"success": True, "exam": exam}
    else:
        # Fallback to hardcoded data if no database data exists
        exam = get_exam_details(exam_id)
        if not exam:
            raise HTTPException(
                status_code=404, 
                detail=f"No data found for {exam_id}. Please add question sheets in Admin Panel."
            )
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
    """
    Get all topics across all subjects - DATABASE DRIVEN
    Builds flat list from MongoDB exam_sheets collection AND questions collection
    """
    from exam_structure_routes import db
    
    try:
        # Get structure from database
        sheets = await db.exam_sheets.find({
            "type": "exam",
            "exam_name": {"$regex": f"^{exam_id}", "$options": "i"}
            # NOTE: Not filtering by questions_imported - show all sheets
        }).to_list(length=1000)
        
        # Build grouped topic list from database
        # Group by syllabus_topic + subject to show sub-topics together
        topics_dict = {}
        
        if sheets:
            for sheet in sheets:
                syllabus_topic = sheet.get("syllabus_topic")
                subject = sheet.get("subject")
                sub_topic = sheet.get("sub_topic")
                questions = sheet.get("question_count", 0)
                
                # Create unique key for grouping
                key = f"{syllabus_topic}||{subject}"
                
                if key not in topics_dict:
                    topics_dict[key] = {
                        "syllabus_topic": syllabus_topic,
                        "subject": subject,
                        "sub_topics": [],
                        "questions": 0
                    }
                
                # Add sub-topic if not already present
                if sub_topic and sub_topic not in topics_dict[key]["sub_topics"]:
                    topics_dict[key]["sub_topics"].append(sub_topic)
                
                # Sum up questions from exam_sheets
                topics_dict[key]["questions"] += questions
        
        # Also count questions from the questions collection (for image extraction and other sources)
        # This ensures questions added via image extraction are counted
        # We need to normalize both old format (syllabus_topic/subject) and new format (subject/topic)
        questions_pipeline = [
            {
                "$match": {
                    "$or": [
                        {"exam_id": {"$regex": f"^{exam_id}", "$options": "i"}},
                        {"exam_name": {"$regex": f"^{exam_id}", "$options": "i"}}
                    ]
                }
            },
            {
                "$project": {
                    # Normalize the grouping fields
                    # For display: syllabus_topic is the broad category (Physics, Chemistry)
                    # For display: subject is the specific topic (Mechanics, Organic Chemistry)
                    "normalized_syllabus_topic": {
                        "$cond": {
                            "if": {"$ne": [{"$ifNull": ["$syllabus_topic", None]}, None]},
                            "then": "$syllabus_topic",
                            "else": "$subject"
                        }
                    },
                    "normalized_subject": {
                        "$cond": {
                            "if": {"$ne": [{"$ifNull": ["$syllabus_topic", None]}, None]},
                            "then": "$subject",
                            "else": "$topic"
                        }
                    }
                }
            },
            {
                "$group": {
                    "_id": {
                        "syllabus_topic": "$normalized_syllabus_topic",
                        "subject": "$normalized_subject"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        question_counts = await db.questions.aggregate(questions_pipeline).to_list(1000)
        
        # Add/update topics from questions collection
        for qc in question_counts:
            group_id = qc["_id"]
            syllabus_topic = group_id.get("syllabus_topic")
            subject = group_id.get("subject")
            
            if syllabus_topic and subject:
                key = f"{syllabus_topic}||{subject}"
                
                if key not in topics_dict:
                    topics_dict[key] = {
                        "syllabus_topic": syllabus_topic,
                        "subject": subject,
                        "sub_topics": [],
                        "questions": qc["count"]
                    }
                else:
                    # Use the questions collection count as it's more accurate
                    # (exam_sheets might have stale or zero counts)
                    topics_dict[key]["questions"] = qc["count"]
        
        # Convert dict to list
        topics = list(topics_dict.values())
        
        if topics:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                content={"success": True, "exam": exam_id, "topics": topics},
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            )
        else:
            # Fallback to hardcoded
            topics = get_all_topics_flat(exam_id)
            if not topics:
                return {"success": True, "exam": exam_id, "topics": []}
            return {"success": True, "exam": exam_id, "topics": topics}
    
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weightage/{exam_id}")
async def get_exam_weightage(exam_id: str):
    """
    Get topic-wise weightage analysis for an exam
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    
    try:
        # Create direct database connection with explicit values
        mongo_url = os.getenv('MONGO_URL') or 'mongodb://localhost:27017'
        db_name = os.getenv('DB_NAME') or 'test_database'
        
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Get weightage data from database
        weightage = await db.exam_metadata.find_one({
            "exam_name": exam_id,
            "type": "weightage_analysis"
        })
        
        # Debug info
        all_metadata = await db.exam_metadata.find({}).to_list(length=10)
        
        client.close()
        
        if weightage and isinstance(weightage, dict):
            # Remove MongoDB _id
            if '_id' in weightage:
                del weightage['_id']
            return {"success": True, "weightage": weightage}
        else:
            return {"success": False, "message": f"Not found for {exam_id}. DB has {len(all_metadata)} docs: {[d.get('exam_name') for d in all_metadata]}"}
    
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/test-weightage-db")
async def test_weightage_db():
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    
    mongo_url = os.getenv('MONGO_URL') or 'mongodb://localhost:27017'
    db_name = os.getenv('DB_NAME') or 'test_database'
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    count = await db.exam_metadata.count_documents({})
    sbi_doc = await db.exam_metadata.find_one({"exam_name": "SBI_PO"})
    
    client.close()
    
    return {"count": count, "has_sbi": sbi_doc is not None}


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
    
    # Check if there's a Google Sheet mapping
    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "test_database")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Build query based on whether it's class-based or exam-based
    if request.isClassBased and request.class_name and request.chapter:
        # Class-based query (CBSE chapters)
        # Use regex to match chapter name with or without number prefix
        # e.g., "Components of Food" matches "1. Components of Food"
        import re
        chapter_pattern = re.compile(f"^\\d+\\.\\s*{re.escape(request.chapter)}$", re.IGNORECASE)
        
        query = {
            "class_name": request.class_name,
            "subject": request.subject,
            "chapter": {"$regex": chapter_pattern}
        }
        print(f"🔍 Querying exam_sheets collection for CLASS-BASED: class={request.class_name}, subject={request.subject}, chapter pattern={request.chapter}")
    elif topic:
        # Exam-based query (NEET, JEE, etc.)
        # Build query using NEW field names that match Admin Sheet Manager
        # The 'subject' parameter from URL = 'syllabus_topic' in database
        # The 'topic' parameter from URL = 'subject' in database
        
        # Handle exam name variations (e.g., "JEE" vs "JEE Main", "NEET" vs "NEET UG")
        # Use regex to match exam names flexibly
        exam_pattern = exam if exam.startswith("^") else f"^{exam}"
        
        query = {
            "exam_name": {"$regex": exam_pattern, "$options": "i"},  # Case-insensitive regex
            "syllabus_topic": subject,
            "subject": topic
        }
        
        print(f"🔍 Querying exam_sheets collection for EXAM-BASED: {query}")
    else:
        query = None
    
    if query:
        
        # If sub_topic provided, try to find specific mapping (only for exam-based)
        if sub_topic and not request.isClassBased:
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
    
    # Try to fetch from questions collection in MongoDB
    if not questions:
        try:
            # Build a flexible query that handles both old format (syllabus_topic/subject) 
            # and new format (exam_id/subject/topic)
            query_filter = {
                "$or": [
                    # New format from image extraction (exam_id + subject + topic)
                    {
                        "exam_id": exam,
                        "subject": subject,
                        **({"topic": topic} if topic else {})
                    },
                    # Old format from sheets (exam_name matches + syllabus_topic + subject)
                    {
                        "exam_name": {"$regex": f"^{exam}", "$options": "i"},
                        "syllabus_topic": subject,
                        **({"subject": topic} if topic else {})
                    }
                ]
            }
            
            # Optionally filter by status if the field exists
            # (some questions might not have status field)
            
            if sub_topic:
                # Add sub_topic filter to each $or condition
                query_filter = {
                    "$or": [
                        {
                            "exam_id": exam,
                            "subject": subject,
                            **({"topic": topic} if topic else {}),
                            "subtopic": sub_topic
                        },
                        {
                            "exam_name": {"$regex": f"^{exam}", "$options": "i"},
                            "syllabus_topic": subject,
                            **({"subject": topic} if topic else {}),
                            "sub_topic": sub_topic
                        }
                    ]
                }
            
            print(f"🔍 Querying questions collection with flexible filter")
            questions_cursor = db.questions.find(query_filter, {"_id": 0})
            db_questions = await questions_cursor.to_list(length=None)
            
            if db_questions:
                questions = db_questions
                source = "database"
                print(f"✅ Loaded {len(questions)} questions from database")
        except Exception as e:
            import traceback
            print(f"⚠️ Error fetching from database: {e}")
            print(traceback.format_exc())
    
    # Fallback to demo questions if database also failed
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
            "id": q.get("id", ""),
            "question": q.get("question", ""),
            "options": q.get("options", {}),
            "correctAnswer": q.get("correctAnswer") or q.get("correct_answer", ""),
            "explanation": q.get("explanation", "")
        }
        for q in questions
    ]
    
    # Normalize questions for session storage (ensure correctAnswer key exists)
    normalized_questions = [
        {
            **q,
            "correctAnswer": q.get("correctAnswer") or q.get("correct_answer", "")
        }
        for q in questions
    ]
    
    quiz_id = f"quiz_{random.randint(100000, 999999)}"
    quiz_sessions[quiz_id] = {
        "questions": normalized_questions,
        "exam": exam,
        "subject": subject,
        "topic": topic,
        "user_id": request.userId  # Store user ID for auto-posting
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
    user_id = session.get("user_id")
    
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
    
    # Auto-post quiz result to social feed
    if user_id and score >= 50:  # Only post if score is decent
        try:
            from social_auto_post import auto_post_quiz_result
            quiz_data = {
                "quiz_name": session.get("exam", "Quiz"),
                "score": score,
                "total_questions": len(questions),
                "correct_answers": correct_answers,
                "subject": session.get("subject", ""),
                "exam_category": session.get("exam", ""),
                "quiz_id": quiz_id
            }
            await auto_post_quiz_result(user_id, quiz_data)
        except Exception as e:
            print(f"[QUIZ] Failed to auto-post result: {str(e)}")
    
    # Clean up session
    del quiz_sessions[quiz_id]
    
    return {
        "success": True,
        "score": score,
        "correctAnswers": correct_answers,
        "totalQuestions": len(questions),
        "results": results
    }
