from fastapi import APIRouter, HTTPException
from google_sheets_service import GoogleSheetsService
import os
from database import db

router = APIRouter(prefix="/test", tags=["testing"])



@router.get("/sheets/list")
async def test_list_sheets():
    # List all Google Sheets mapped in the database
    
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
    
    return {"success": True, "count": len(result), "sheets": result}

@router.get("/sheets/questions/{exam_id}/{subject}/{topic}")
async def test_get_questions(exam_id: str, subject: str, topic: str):
    # Test fetching questions for a specific topic
    
    # Find sheet mapping
    sheet_mapping = await db.question_sheets.find_one({
        "exam_id": exam_id,
        "subject": subject,
        "topic": topic
    })
    
    if not sheet_mapping:
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
    # Simulate what happens when quiz/start is called
    
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
    
    return result
