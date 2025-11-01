from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime

router = APIRouter()

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Pydantic models
class SheetMapping(BaseModel):
    exam_id: str
    subject: str
    topic: str
    sub_topic: Optional[str] = None  # NEW: Sub-topic for granular filtering
    sheet_url: str
    sheet_name: Optional[str] = None

class SheetMappingResponse(BaseModel):
    id: str
    exam_id: str
    subject: str
    topic: str
    sub_topic: Optional[str]
    sheet_url: str
    sheet_name: Optional[str]
    created_at: str
    updated_at: str

# Routes

@router.post("/sheets/add")
async def add_sheet_mapping(mapping: SheetMapping):
    """Add or update a Google Sheet mapping for an exam topic (with optional sub-topic)"""
    try:
        # Check if mapping already exists
        query = {
            "exam_id": mapping.exam_id,
            "subject": mapping.subject,
            "topic": mapping.topic
        }
        
        # Include sub_topic in query if provided
        if mapping.sub_topic:
            query["sub_topic"] = mapping.sub_topic
        
        existing = await db.question_sheets.find_one(query)
        
        if existing:
            # Update existing mapping
            await db.question_sheets.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "sheet_url": mapping.sheet_url,
                    "sheet_name": mapping.sheet_name,
                    "sub_topic": mapping.sub_topic,
                    "updated_at": datetime.utcnow().isoformat()
                }}
            )
            return {"success": True, "message": "Sheet mapping updated", "id": existing["id"]}
        else:
            # Create new mapping
            new_mapping = {
                "id": str(uuid.uuid4()),
                "exam_id": mapping.exam_id,
                "subject": mapping.subject,
                "topic": mapping.topic,
                "sub_topic": mapping.sub_topic,
                "sheet_url": mapping.sheet_url,
                "sheet_name": mapping.sheet_name,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            await db.question_sheets.insert_one(new_mapping)
            return {"success": True, "message": "Sheet mapping created", "id": new_mapping["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sheets/list")
async def list_sheet_mappings():
    """List all Google Sheet mappings"""
    try:
        sheets = await db.question_sheets.find().to_list(length=None)
        
        # Remove MongoDB _id field
        for sheet in sheets:
            sheet.pop("_id", None)
        
        return {"success": True, "sheets": sheets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sheets/get/{exam_id}/{subject}/{topic}")
async def get_sheet_mapping(exam_id: str, subject: str, topic: str):
    """Get Google Sheet mapping for a specific topic"""
    try:
        sheet = await db.question_sheets.find_one({
            "exam_id": exam_id,
            "subject": subject,
            "topic": topic
        })
        
        if not sheet:
            return {"success": False, "message": "No sheet mapping found"}
        
        sheet.pop("_id", None)
        return {"success": True, "sheet": sheet}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sheets/delete/{exam_id}/{subject}/{topic}")
async def delete_sheet_mapping(exam_id: str, subject: str, topic: str):
    """Delete a Google Sheet mapping"""
    try:
        result = await db.question_sheets.delete_one({
            "exam_id": exam_id,
            "subject": subject,
            "topic": topic
        })
        
        if result.deleted_count > 0:
            return {"success": True, "message": "Sheet mapping deleted"}
        else:
            return {"success": False, "message": "No sheet mapping found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sheets/test")
async def test_sheet_access(data: dict):
    """Test if a Google Sheet URL is accessible"""
    from google_sheets_service import GoogleSheetsService
    
    sheet_url = data.get("sheet_url")
    if not sheet_url:
        raise HTTPException(status_code=400, detail="sheet_url is required")
    
    service = GoogleSheetsService()
    result = service.test_sheet_access(sheet_url)
    
    return result
