import re
import time
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Tuple
import secrets
import random
import uuid
from datetime import datetime, timezone
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

# In-memory TTL cache for parsed Google-Sheet questions
# Key: (sheet_url, sheet_name, topic_filter) -> (expires_at_epoch, questions_list)
_QUESTIONS_CACHE_TTL_SECONDS = 600  # 10 minutes
_questions_cache: Dict[Tuple[str, Optional[str], Optional[str]], Tuple[float, List[Dict[str, Any]]]] = {}


def _cache_get_questions(sheet_url: str, sheet_name: Optional[str], topic_filter: Optional[str]):
    key = (sheet_url, sheet_name, topic_filter)
    entry = _questions_cache.get(key)
    if not entry:
        return None
    expires_at, questions = entry
    if expires_at < time.time():
        _questions_cache.pop(key, None)
        return None
    return questions


def _cache_set_questions(sheet_url: str, sheet_name: Optional[str], topic_filter: Optional[str], questions: List[Dict[str, Any]]):
    key = (sheet_url, sheet_name, topic_filter)
    _questions_cache[key] = (time.time() + _QUESTIONS_CACHE_TTL_SECONDS, questions)

@router.get("/exams")
async def get_exams():
    """Get all available exams - combines hardcoded + database CRUD exams"""
    from exam_structure_routes import db
    
    # Get hardcoded exams
    hardcoded_exams = get_all_exams()
    
    # Get CRUD-created exams from database
    try:
        db_exams = await db.exams.find({"is_active": True}, {"_id": 0}).to_list(100)
        
        # Convert DB exams to the expected format
        for exam in db_exams:
            # Check if this exam already exists in hardcoded list
            existing = next((e for e in hardcoded_exams if e.get("id", "").upper() == exam.get("name", "").upper() or e.get("name", "").upper() == exam.get("name", "").upper()), None)
            if not existing:
                hardcoded_exams.append({
                    "id": exam.get("name"),  # Use name as ID for URL routing
                    "name": exam.get("name"),
                    "full_name": exam.get("name"),
                    "description": exam.get("description", ""),
                    "icon": exam.get("icon", "📚"),
                    "color": f"from-{exam.get('color', 'blue')}-500 to-{exam.get('color', 'blue')}-600",
                    "category": "Competitive Exams",
                    "duration": exam.get("duration", 180),
                    "total_marks": exam.get("total_marks", 100),
                    "total_questions": 0
                })
    except Exception as e:
        print(f"Error fetching CRUD exams: {e}")
    
    return {"success": True, "exams": hardcoded_exams}

@router.get("/exam/{exam_id}")
async def get_exam(exam_id: str):
    """
    Get complete exam details with syllabus - DATABASE DRIVEN
    Now fetches from:
    1. CRUD collections (exams, categories, chapters)
    2. MongoDB exam_sheets collection
    3. Hardcoded exam_data.py (fallback)
    """
    from exam_structure_routes import get_exam_structure_from_db, db
    
    # First, check CRUD exams collection
    crud_exam = await db.exams.find_one({
        "name": {"$regex": f"^{re.escape(exam_id)}$", "$options": "i"},
        "is_active": True
    })
    
    if crud_exam:
        # Build syllabus structure from CRUD categories and chapters
        categories = await db.categories.find({
            "exam_id": crud_exam.get("id"),
            "is_active": True
        }, {"_id": 0}).to_list(100)
        
        chapters = await db.chapters.find({
            "exam_id": crud_exam.get("id"),
            "is_active": True
        }, {"_id": 0}).to_list(1000)
        
        # Build syllabus_topics structure
        syllabus_topics = {}
        for cat in categories:
            cat_name = cat.get("name")
            syllabus_topics[cat_name] = {
                "topics": []
            }
        
        for chapter in chapters:
            cat_name = chapter.get("category_name")
            if cat_name in syllabus_topics:
                syllabus_topics[cat_name]["topics"].append({
                    "name": chapter.get("name"),
                    "sub_topics": chapter.get("sub_topics", [])
                })
        
        # Add empty topics for categories without chapters
        for cat_name, cat_data in syllabus_topics.items():
            if not cat_data["topics"]:
                cat_data["topics"].append({
                    "name": "General",
                    "sub_topics": []
                })
        
        exam = {
            "name": crud_exam.get("name"),
            "full_name": crud_exam.get("name"),
            "description": crud_exam.get("description", f"Prepare for {exam_id} with comprehensive practice questions"),
            "icon": crud_exam.get("icon", "📚"),
            "color": f"from-{crud_exam.get('color', 'blue')}-500 to-{crud_exam.get('color', 'blue')}-600",
            "category": "Competitive Exams",
            "duration": crud_exam.get("duration", 180),
            "total_marks": crud_exam.get("total_marks", 100),
            "syllabus_topics": syllabus_topics
        }
        return {"success": True, "exam": exam}
    
    # Try to get from exam_sheets database
    structure = await get_exam_structure_from_db(exam_id)
    
    if structure:
        # Database has data - use it!
        hardcoded_exam = get_exam_details(exam_id)
        
        exam = {
            "name": exam_id,
            "full_name": hardcoded_exam.get("full_name", exam_id) if hardcoded_exam else exam_id,
            "description": hardcoded_exam.get("description", f"Prepare for {exam_id} with comprehensive practice questions") if hardcoded_exam else f"Prepare for {exam_id} with comprehensive practice questions",
            "icon": hardcoded_exam.get("icon", "") if hardcoded_exam else "",
            "color": hardcoded_exam.get("color", "from-blue-500 to-cyan-500") if hardcoded_exam else "from-blue-500 to-cyan-500",
            "category": hardcoded_exam.get("category", "Competitive Exams") if hardcoded_exam else "Competitive Exams",
            "syllabus_topics": structure.get("syllabus_topics", {})
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
    Builds flat list from:
    1. CRUD chapters collection (admin-created)
    2. MongoDB exam_sheets collection (legacy)
    3. Questions collection (image extraction, etc.)
    """
    from exam_structure_routes import db
    
    try:
        topics_dict = {}
        
        # ========== STEP 1: Get CRUD-created chapters ==========
        # First, find the exam in the exams collection
        crud_exam = await db.exams.find_one({
            "name": {"$regex": f"^{re.escape(exam_id)}", "$options": "i"},
            "is_active": True
        })
        
        if crud_exam:
            # Get all categories for this exam
            categories = await db.categories.find({
                "exam_id": crud_exam.get("id"),
                "is_active": True
            }, {"_id": 0}).to_list(100)
            
            # Get all chapters for this exam
            chapters = await db.chapters.find({
                "exam_id": crud_exam.get("id"),
                "is_active": True
            }, {"_id": 0}).to_list(1000)
            
            # First, add chapters
            for chapter in chapters:
                category_name = chapter.get("category_name")  # e.g., "Physics"
                chapter_name = chapter.get("name")  # e.g., "Mechanics"
                sub_topics = chapter.get("sub_topics", [])
                
                if category_name and chapter_name:
                    key = f"{category_name}||{chapter_name}"
                    if key not in topics_dict:
                        topics_dict[key] = {
                            "syllabus_topic": category_name,
                            "subject": chapter_name,
                            "sub_topics": sub_topics,
                            "questions": 0
                        }
            
            # Also add categories without chapters (as placeholder topics)
            # This allows categories to show up even before chapters are created
            category_ids_with_chapters = set(ch.get("category_id") for ch in chapters)
            for cat in categories:
                if cat.get("id") not in category_ids_with_chapters:
                    # This category has no chapters, show it as a placeholder
                    key = f"{cat.get('name')}||General"
                    if key not in topics_dict:
                        topics_dict[key] = {
                            "syllabus_topic": cat.get("name"),
                            "subject": "General",
                            "sub_topics": [],
                            "questions": 0
                        }
        
        # ========== STEP 2: Get legacy exam_sheets structure ==========
        sheets = await db.exam_sheets.find({
            "type": "exam",
            "exam_name": {"$regex": f"^{re.escape(exam_id)}", "$options": "i"}
        }).to_list(length=1000)
        
        if sheets:
            for sheet in sheets:
                syllabus_topic = sheet.get("syllabus_topic")
                subject = sheet.get("subject")
                sub_topic = sheet.get("sub_topic")
                questions = sheet.get("question_count", 0)
                
                if syllabus_topic and subject:
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
                        {"exam_id": {"$regex": f"^{re.escape(exam_id)}", "$options": "i"}},
                        {"exam_name": {"$regex": f"^{re.escape(exam_id)}", "$options": "i"}}
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
        # Class-based query (CBSE chapters for Classes 6-12)
        # Use regex to match chapter name with or without number prefix
        # Database stores: "1. Components of Food", "2. Is Matter Around Us Pure"
        # Frontend sends: "Components of Food", "Is Matter Around Us Pure"
        
        # Normalize the chapter name for fuzzy matching
        chapter_clean = request.chapter
        
        # Handle common spelling variations across all classes
        spelling_fixes = {
            "matters ": "matter ",  # Class 9 Science: "Matters in Our Surroundings" -> "Matter in Our Surroundings"
            "heron's formula": "herons formula",  # Class 9 Math
            "euclid's geometry": "euclids geometry",  # Class 9 Math
        }
        
        chapter_lower = chapter_clean.lower()
        for wrong, correct in spelling_fixes.items():
            if chapter_lower.startswith(wrong):
                chapter_clean = correct.title() + chapter_clean[len(wrong):]
                break
        
        # Build regex that matches:
        # 1. With number prefix: "1. Chapter Name", "12. Chapter Name"
        # 2. Without number prefix: "Chapter Name"
        # 3. Case-insensitive
        # 4. Allow optional trailing 's' for pluralization variations
        escaped_chapter = re.escape(chapter_clean)
        chapter_pattern = re.compile(
            f"^(\\d+\\.\\s*)?{escaped_chapter}s?$",
            re.IGNORECASE
        )
        
        # Build class_name pattern to match both "Class 11" and "Class 11 (Science)" formats
        class_name_pattern = re.compile(
            f"^{re.escape(request.class_name)}(\\s*\\(.*\\))?$",
            re.IGNORECASE
        )
        
        query = {
            "class_name": {"$regex": class_name_pattern},
            "subject": request.subject,
            "chapter": {"$regex": chapter_pattern}
        }
        print(f"🔍 Querying exam_sheets for CLASS-BASED: class={request.class_name}, subject={request.subject}, chapter={request.chapter} (normalized: {chapter_clean})")
    elif topic:
        # Exam-based query (NEET, JEE, etc.)
        # Build query using NEW field names that match Admin Sheet Manager
        # The 'subject' parameter from URL = 'syllabus_topic' in database
        # The 'topic' parameter from URL = 'subject' in database
        
        # Handle exam name variations (e.g., "JEE" vs "JEE Main", "NEET" vs "NEET UG")
        # Use regex to match exam names flexibly
        exam_pattern = exam if exam.startswith("^") else f"^{re.escape(exam)}"
        
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
            print("✅ Found sheet mapping in exam_sheets collection")
            print(f"   Sheet link: {sheet_mapping.get('sheet_link')}")
            print(f"   Questions imported: {sheet_mapping.get('questions_imported')}")
            print(f"   Question count: {sheet_mapping.get('question_count')}")
        else:
            print("❌ No sheet mapping found in exam_sheets collection")
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
                    cached = _cache_get_questions(sheet_url, sheet_name, filter_topic)
                    if cached is not None:
                        questions = cached
                        print(f"⚡ Cache HIT for {sheet_url} / {sheet_name} / {filter_topic} — {len(questions)} questions")
                    else:
                        questions = sheets_service.fetch_questions(
                            sheet_url,
                            sheet_name,
                            topic_filter=filter_topic  # Filter by sub-topic or topic
                        )
                        if questions:
                            _cache_set_questions(sheet_url, sheet_name, filter_topic, questions)
                            print(f"💾 Cache MISS — fetched & cached {len(questions)} questions")

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
            
            # Check if this is a class-based quiz (Classes 6-12)
            if request.isClassBased and request.class_name and request.chapter:
                # CLASS-BASED QUERY: Query by class_name, subject, and chapter
                # Handle chapter names with or without number prefix and minor spelling variations
                # Database stores: "1. Components of Food", "2. Is Matter Around Us Pure"
                # Frontend sends: "Components of Food", "Is Matter Around Us Pure"
                
                # Normalize the chapter name for fuzzy matching
                chapter_clean = request.chapter
                
                # Handle common spelling variations across all classes
                spelling_fixes = {
                    "matters ": "matter ",  # Class 9 Science: "Matters in Our Surroundings" -> "Matter in Our Surroundings"
                    "heron's formula": "herons formula",  # Class 9 Math
                    "euclid's geometry": "euclids geometry",  # Class 9 Math
                }
                
                chapter_lower = chapter_clean.lower()
                for wrong, correct in spelling_fixes.items():
                    if chapter_lower.startswith(wrong):
                        chapter_clean = correct.title() + chapter_clean[len(wrong):]
                        break
                
                # Build regex that matches:
                # 1. With number prefix: "1. Chapter Name", "12. Chapter Name"
                # 2. Without number prefix: "Chapter Name"
                # 3. Case-insensitive
                # 4. Allow optional trailing 's' for pluralization variations
                escaped_chapter = re.escape(chapter_clean)
                chapter_pattern = re.compile(
                    f"^(\\d+\\.\\s*)?{escaped_chapter}s?$",
                    re.IGNORECASE
                )
                
                # Build class_name pattern to match both "Class 11" and "Class 11 (Science)" formats
                # Database may store: "Class 11", "Class 11 (Science)", "Class 11 (Commerce)", etc.
                class_name_pattern = re.compile(
                    f"^{re.escape(request.class_name)}(\\s*\\(.*\\))?$",
                    re.IGNORECASE
                )
                
                query_filter = {
                    "class_name": {"$regex": class_name_pattern},
                    "subject": request.subject,
                    "chapter": {"$regex": chapter_pattern}
                }
                print(f"🔍 Querying questions for CLASS-BASED: class={request.class_name}, subject={request.subject}, chapter={request.chapter} (normalized: {chapter_clean})")
            else:
                # EXAM-BASED QUERY: Build a flexible query that handles both old format (syllabus_topic/subject) 
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
                            "exam_name": {"$regex": f"^{re.escape(exam)}", "$options": "i"},
                            "syllabus_topic": subject,
                            **({"subject": topic} if topic else {})
                        }
                    ]
                }
                
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
                                "exam_name": {"$regex": f"^{re.escape(exam)}", "$options": "i"},
                                "syllabus_topic": subject,
                                **({"subject": topic} if topic else {}),
                                "sub_topic": sub_topic
                            }
                        ]
                    }
                print(f"🔍 Querying questions collection for EXAM-BASED: exam={exam}, subject={subject}, topic={topic}")
            
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
            "options": q.get("options", []),
            "correctAnswer": q.get("correctAnswer") if q.get("correctAnswer") is not None else q.get("correct_answer", ""),
            "explanation": q.get("explanation", "")
        }
        for q in questions
    ]
    
    # Normalize questions for session storage (ensure correctAnswer key exists)
    normalized_questions = [
        {
            **q,
            "correctAnswer": q.get("correctAnswer") if q.get("correctAnswer") is not None else q.get("correct_answer", "")
        }
        for q in questions
    ]
    
    quiz_id = f"quiz_{secrets.randbelow(900000) + 100000}"
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
        
        # Handle answer comparison - both selectedOption and correctAnswer can be:
        # - An integer index (0, 1, 2, 3)
        # - A letter string ("A", "B", "C", "D")
        selected_option = user_answer.get("selectedOption") if user_answer else None
        correct_answer = question.get("correctAnswer") if question.get("correctAnswer") is not None else question.get("correct_answer")
        
        is_correct = False
        selected_letter = None
        correct_index = None
        
        # Normalize correct answer to index
        if correct_answer is not None:
            if isinstance(correct_answer, int):
                correct_index = correct_answer
            elif isinstance(correct_answer, str):
                if correct_answer.isdigit():
                    correct_index = int(correct_answer)
                elif len(correct_answer) == 1 and correct_answer.upper() in 'ABCD':
                    correct_index = ord(correct_answer.upper()) - 65
                else:
                    # Try to parse as integer string
                    try:
                        correct_index = int(correct_answer)
                    except (ValueError, TypeError):
                        correct_index = None
        
        # Normalize selected option to index
        selected_index = None
        if selected_option is not None:
            if isinstance(selected_option, int):
                selected_index = selected_option
            elif isinstance(selected_option, str):
                if selected_option.isdigit():
                    selected_index = int(selected_option)
                elif len(selected_option) == 1 and selected_option.upper() in 'ABCD':
                    selected_index = ord(selected_option.upper()) - 65
                else:
                    try:
                        selected_index = int(selected_option)
                    except (ValueError, TypeError):
                        selected_index = None
        
        # Convert indices to letters for display
        if selected_index is not None:
            selected_letter = chr(65 + selected_index)  # 0->A, 1->B, etc.
        
        correct_letter = None
        if correct_index is not None:
            correct_letter = chr(65 + correct_index)
        
        # Compare indices
        if selected_index is not None and correct_index is not None:
            is_correct = selected_index == correct_index
        
        if is_correct:
            correct_answers += 1
        
        results.append({
            "questionId": question["id"],
            "question": question["question"],
            "options": question["options"],
            "correctAnswer": correct_letter or str(correct_answer),
            "selectedOption": selected_letter,
            "userAnswer": selected_letter,
            "isCorrect": is_correct,
            "explanation": question.get("explanation", "")
        })
    
    score = round((correct_answers / len(questions)) * 100)
    
    # Save quiz result to quiz_history for performance tracking
    if user_id:
        try:
            from exam_structure_routes import db
            
            # Fetch user name — check DB first, then fall back for demo users
            user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1, "username": 1})
            if user_doc:
                user_name = user_doc.get("name", "Unknown")
            else:
                # Handle demo users with hardcoded IDs
                demo_names = {"demo1-uuid": "Demo Student 1", "demo2-uuid": "Demo Student 2", "demo3-uuid": "Demo Student 3"}
                user_name = demo_names.get(user_id, "User")
            
            wrong_answers = len(questions) - correct_answers - sum(1 for a in answers if a.get("selectedOption") is None)
            skipped = len(questions) - correct_answers - wrong_answers
            if wrong_answers < 0:
                wrong_answers = len(questions) - correct_answers
                skipped = 0
            
            history_doc = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "user_name": user_name,
                "exam": session.get("exam", "Practice"),
                "subject": session.get("subject", "General"),
                "topic": session.get("topic", ""),
                "total_questions": len(questions),
                "correct_answers": correct_answers,
                "wrong_answers": wrong_answers,
                "score": correct_answers,
                "accuracy": score,
                "xp_earned": correct_answers * 8 + (10 if score >= 80 else 0),
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "duration_seconds": 0,
                "source": "chapter_quiz"
            }
            await db.quiz_history.insert_one(history_doc)
            print(f"[QUIZ] Saved quiz history for user {user_name} ({user_id}) - Score: {score}%")

            # Canonical test-history record (Mongo + per-attempt S3 archive)
            from test_history_service import record_test_attempt
            await record_test_attempt(
                db,
                user_id=user_id,
                test_id=quiz_id,
                test_name=f"{session.get('exam', 'Practice')} — {session.get('topic') or session.get('subject', 'General')}",
                subject=session.get("subject", "General"),
                exam_category=session.get("exam", "Practice"),
                total_marks=len(questions),
                marks_obtained=correct_answers,
                questions_total=len(questions),
                questions_attempted=correct_answers + wrong_answers,
                questions_correct=correct_answers,
                questions_wrong=wrong_answers,
                questions_skipped=skipped,
                topic_breakdown=[{
                    "topic": session.get("topic") or session.get("subject", "General"),
                    "chapter": session.get("topic") or "",
                    "questions_total": len(questions),
                    "questions_attempted": correct_answers + wrong_answers,
                    "questions_correct": correct_answers,
                    "score": correct_answers,
                }],
            )
        except Exception as e:
            print(f"[QUIZ] Failed to save quiz history: {str(e)}")
    
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
