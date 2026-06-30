from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
from datetime import datetime

router = APIRouter()

# MongoDB connection
from database import db

# Pydantic models
class SheetMapping(BaseModel):
    exam_id: str
    subject: str
    topic: str
    sub_topic: Optional[str] = None  # Sub-topic for granular filtering
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
        # CRITICAL FIX: Explicitly include sub_topic in the query
        # This differentiates between 'Algebra' (sub_topic=None) and 'Algebra > Linear' (sub_topic='Linear')
        query = {
            "exam_id": mapping.exam_id,
            "subject": mapping.subject,
            "topic": mapping.topic,
            "sub_topic": mapping.sub_topic  # Handles both specific string and None
        }
        
        existing = await db.question_sheets.find_one(query)
        
        if existing:
            # Update existing mapping
            await db.question_sheets.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "sheet_url": mapping.sheet_url,
                    "sheet_name": mapping.sheet_name,
                    # sub_topic is already in the unique query, but updating it safeguards data consistency
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
                "sub_topic": mapping.sub_topic, # Explicitly storing None if not provided
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
async def get_sheet_mapping(
    exam_id: str, 
    subject: str, 
    topic: str, 
    sub_topic: Optional[str] = None # Added as query param
):
    """
    Get Google Sheet mapping for a specific topic.
    Use ?sub_topic=X to get a specific sub-topic.
    """
    try:
        # CRITICAL FIX: Added sub_topic to query
        query = {
            "exam_id": exam_id,
            "subject": subject,
            "topic": topic,
            "sub_topic": sub_topic
        }
        
        sheet = await db.question_sheets.find_one(query)
        
        if not sheet:
            topic_display = f"{topic} -> {sub_topic}" if sub_topic else topic
            return {"success": False, "message": f"No sheet mapping found for {topic_display}"}
        
        sheet.pop("_id", None)
        return {"success": True, "sheet": sheet}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sheets/delete/{exam_id}/{subject}/{topic}")
async def delete_sheet_mapping(
    exam_id: str, 
    subject: str, 
    topic: str, 
    sub_topic: Optional[str] = None # Added as query param
):
    """
    Delete a Google Sheet mapping.
    Must match sub_topic exactly (or be omitted/null) to delete.
    """
    try:
        # CRITICAL FIX: Added sub_topic to query to prevent accidental deletions of wrong sub-topics
        query = {
            "exam_id": exam_id,
            "subject": subject,
            "topic": topic,
            "sub_topic": sub_topic
        }
        
        result = await db.question_sheets.delete_one(query)
        
        if result.deleted_count > 0:
            return {"success": True, "message": "Sheet mapping deleted"}
        else:
            return {"success": False, "message": "No sheet mapping found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sheets/test")
async def test_sheet_access(data: dict):
    """Test if a Google Sheet URL is accessible"""
    # Note: Ideally move this import to the top if circular dependencies allow
    from google_sheets_service import GoogleSheetsService
    
    sheet_url = data.get("sheet_url")
    if not sheet_url:
        raise HTTPException(status_code=400, detail="sheet_url is required")
    
    try:
        service = GoogleSheetsService()
        result = service.test_sheet_access(sheet_url)
        return result
    except Exception as e:
        # Catching service instantiation errors or other unexpected failures
        raise HTTPException(status_code=500, detail=f"Failed to test sheet: {str(e)}")