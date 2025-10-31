from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from google_sheets_service import GoogleSheetsService
import os

router = APIRouter(prefix="/test", tags=["testing"])

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")

@router.get("/sheets/list")
async def test_list_sheets():
    """List all Google Sheets mapped in the database"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    sheets = await db.question_sheets.find().to_list(length=None)
    
    result = []
    for sheet in sheets:
        sheet.pop("_id", None)
        result.append({
            "exam_id": sheet["exam_id"],
            "subject": sheet["subject"],
            "topic": sheet["topic"],
            "sheet_url": sheet["sheet_url"][:50] + "..." if len(sheet["sheet_url"]) > 50 else sheet["sheet_url"]
        })
    
    client.close()
    return {"success": True, "count": len(result), "sheets": result}

@router.get("/sheets/questions/{exam_id}/{subject}/{topic}")
async def test_get_questions(exam_id: str, subject: str, topic: str):
    """Test fetching questions for a specific topic"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Find sheet mapping
    sheet_mapping = await db.question_sheets.find_one({
        "exam_id": exam_id,
        "subject": subject,
        "topic": topic
    })
    
    if not sheet_mapping:
        client.close()
        return {
            "success": False,
            "message": f"No sheet mapping found for {exam_id}/{subject}/{topic}"
        }
    
    # Fetch questions
    service = GoogleSheetsService()
    questions = service.fetch_questions(
        sheet_mapping["sheet_url"],
        sheet_mapping.get("sheet_name"),
        topic_filter=topic
    )
    
    client.close()
    
    if not questions:
        return {
            "success": False,
            "message": "Sheet mapping exists but no questions were fetched (check sheet accessibility or format)"
        }
    
    return {
        "success": True,
        "exam_id": exam_id,
        "subject": subject,
        "topic": topic,
        "total_questions": len(questions),
        "questions": questions[:3],  # Return first 3 questions as preview
        "sheet_url": sheet_mapping["sheet_url"]
    }

@router.get("/quiz/simulate-start/{exam_id}/{subject}/{topic}")
async def test_simulate_quiz_start(exam_id: str, subject: str, topic: str):
    """Simulate what happens when quiz/start is called"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    sheet_mapping = await db.question_sheets.find_one({
        "exam_id": exam_id,
        "subject": subject,
        "topic": topic
    })
    
    result = {
        "exam_id": exam_id,
        "subject": subject,
        "topic": topic,
        "sheet_mapping_found": sheet_mapping is not None
    }
    
    if sheet_mapping:
        service = GoogleSheetsService()
        questions = service.fetch_questions(
            sheet_mapping["sheet_url"],
            sheet_mapping.get("sheet_name"),
            topic_filter=topic
        )
        
        result["questions_fetched"] = len(questions)
        result["will_use_google_sheets"] = len(questions) > 0
        result["will_use_demo_data"] = len(questions) == 0
        
        if questions:
            result["sample_question"] = questions[0]["question"]
    else:
        result["questions_fetched"] = 0
        result["will_use_google_sheets"] = False
        result["will_use_demo_data"] = True
    
    client.close()
    return result
