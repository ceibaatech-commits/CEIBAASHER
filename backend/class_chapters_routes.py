"""
Class-Based Chapters Management Routes
Allows admins to upload and manage chapters for CBSE, RBSE, and other boards
Single source of truth for chapter data served to both admin panel and quiz pages
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

router = APIRouter(prefix="/api/admin/class-chapters", tags=["class-chapters"])

# ============== PYDANTIC MODELS ==============

class ChapterData(BaseModel):
    chapter_number: int
    chapter_name: str
    total_questions: int = 50
    difficulty: str = "Medium"
    duration: int = 35

class ClassChapterCreate(BaseModel):
    board: str  # 'cbse', 'rbse', 'hbse', etc.
    class_name: str  # 'Class 6', 'Class 7', etc.
    subject: str
    chapters: List[ChapterData]  # List of chapters to upload

class ClassChapterUpdate(BaseModel):
    board: str
    class_name: str
    subject: str
    chapter_number: int
    chapter_data: ChapterData

class ClassChapterDelete(BaseModel):
    board: str
    class_name: str
    subject: str
    chapter_number: int

class BulkChaptersDelete(BaseModel):
    board: str
    class_name: str
    subject: str

# ============== ROUTES ==============

@router.get("/chapters")
async def get_class_chapters(
    board: str = None,
    class_name: str = None,
    subject: str = None,
    skip: int = 0,
    limit: int = 1000
):
    """
    Get chapters for a specific board, class, and subject
    If no filters provided, returns all chapters
    """
    try:
        query = {}
        if board:
            query["board"] = board
        if class_name:
            query["class_name"] = class_name
        if subject:
            query["subject"] = subject
        
        total = await db.class_chapters.count_documents(query)
        chapters = await db.class_chapters.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "chapters": chapters,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chapters")
async def create_class_chapters(data: ClassChapterCreate):
    """
    Upload chapters for a class subject.
    If chapters already exist for this board/class/subject, they are replaced.
    Board is normalized to lowercase (e.g. "HBSE" → "hbse") so the
    student-facing endpoints and ExamSheetManager dropdowns can find them.
    """
    try:
        # Normalize on write so downstream queries (which use lowercase board
        # via board_sheet_data.normalize_board) always match.
        normalized_board = (data.board or "").strip().lower()
        normalized_class = (data.class_name or "").strip()
        normalized_subject = (data.subject or "").strip()

        # Delete existing chapters for this board/class/subject (case-insensitive
        # so legacy uppercase rows are replaced too).
        import re
        await db.class_chapters.delete_many({
            "board": {"$regex": f"^{re.escape(normalized_board)}$", "$options": "i"},
            "class_name": normalized_class,
            "subject": {"$regex": f"^{re.escape(normalized_subject)}$", "$options": "i"},
        })
        
        # Insert new chapters
        chapters_to_insert = []
        for ch in data.chapters:
            chapter_doc = {
                "id": str(uuid.uuid4()),
                "board": normalized_board,
                "class_name": normalized_class,
                "subject": normalized_subject,
                "chapter_number": ch.chapter_number,
                "chapter_name": (ch.chapter_name or "").strip(),
                "total_questions": ch.total_questions,
                "difficulty": ch.difficulty,
                "duration": ch.duration,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            chapters_to_insert.append(chapter_doc)
        
        if chapters_to_insert:
            result = await db.class_chapters.insert_many(chapters_to_insert)
            inserted_count = len(result.inserted_ids)
        else:
            inserted_count = 0
        
        return {
            "success": True,
            "message": f"Successfully uploaded {inserted_count} chapters for {normalized_class} {normalized_subject}",
            "board": normalized_board,
            "class_name": normalized_class,
            "subject": normalized_subject,
            "chapters_uploaded": inserted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading chapters: {str(e)}")

@router.put("/chapters/{chapter_id}")
async def update_class_chapter(chapter_id: str, update_data: ChapterData):
    """Update a specific chapter"""
    try:
        updated_doc = {
            "chapter_number": update_data.chapter_number,
            "chapter_name": update_data.chapter_name,
            "total_questions": update_data.total_questions,
            "difficulty": update_data.difficulty,
            "duration": update_data.duration,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = await db.class_chapters.update_one(
            {"id": chapter_id},
            {"$set": updated_doc}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Chapter not found")
        
        updated = await db.class_chapters.find_one({"id": chapter_id}, {"_id": 0})
        return {
            "success": True,
            "message": "Chapter updated successfully",
            "chapter": updated
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chapters/{chapter_id}")
async def delete_class_chapter(chapter_id: str):
    """Delete a specific chapter"""
    try:
        result = await db.class_chapters.delete_one({"id": chapter_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Chapter not found")
        
        return {
            "success": True,
            "message": "Chapter deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chapters")
async def delete_class_chapters_bulk(data: BulkChaptersDelete):
    """Delete all chapters for a board, class, and subject"""
    try:
        result = await db.class_chapters.delete_many({
            "board": data.board,
            "class_name": data.class_name,
            "subject": data.subject
        })
        
        return {
            "success": True,
            "message": f"Deleted {result.deleted_count} chapters for {data.class_name} {data.subject}",
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_chapters_statistics():
    """Get statistics about uploaded chapters"""
    try:
        total_chapters = await db.class_chapters.count_documents({})
        
        # Get breakdown by board
        board_stats = await db.class_chapters.aggregate([
            {"$group": {
                "_id": "$board",
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]).to_list(None)
        
        # Get breakdown by class
        class_stats = await db.class_chapters.aggregate([
            {"$group": {
                "_id": "$class_name",
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]).to_list(None)
        
        return {
            "success": True,
            "total_chapters": total_chapters,
            "board_breakdown": board_stats,
            "class_breakdown": class_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import-default")
async def import_default_chapters():
    """
    Import default chapters from hardcoded data files into database
    This one-time operation seeds the database with existing chapter data
    """
    try:
        from cbse_master_data import CBSE_DATA
        from board_chapter_data import RBSE_CHAPTER_DATA
        
        imported_count = 0
        
        # Import CBSE data
        for class_key, class_data in CBSE_DATA.items():
            class_name = class_data.get('class_name', f'Class {class_key}')
            for subject, chapters in class_data.get('subjects', {}).items():
                # Delete existing chapters for this class/subject
                await db.class_chapters.delete_many({
                    "board": "cbse",
                    "class_name": class_name,
                    "subject": subject
                })
                
                # Insert new chapters
                for chapter in chapters:
                    chapter_doc = {
                        "id": str(uuid.uuid4()),
                        "board": "cbse",
                        "class_name": class_name,
                        "subject": subject,
                        "chapter_number": chapter.get("chapter_number", 0),
                        "chapter_name": chapter.get("chapter_name", ""),
                        "total_questions": chapter.get("total_questions", 50),
                        "difficulty": chapter.get("difficulty", "Medium"),
                        "duration": chapter.get("duration", 35),
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    await db.class_chapters.insert_one(chapter_doc)
                    imported_count += 1
        
        # Import RBSE data (similar structure)
        for class_key, class_data in RBSE_CHAPTER_DATA.items():
            class_name = f'Class {class_key}'
            for subject, chapters in class_data.items():
                # Delete existing chapters
                await db.class_chapters.delete_many({
                    "board": "rbse",
                    "class_name": class_name,
                    "subject": subject
                })
                
                # Insert new chapters
                for chapter in chapters:
                    chapter_doc = {
                        "id": str(uuid.uuid4()),
                        "board": "rbse",
                        "class_name": class_name,
                        "subject": subject,
                        "chapter_number": chapter.get("chapter_number", 0),
                        "chapter_name": chapter.get("chapter_name", ""),
                        "total_questions": chapter.get("total_questions", 50),
                        "difficulty": chapter.get("difficulty", "Medium"),
                        "duration": chapter.get("duration", 35),
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    await db.class_chapters.insert_one(chapter_doc)
                    imported_count += 1
        
        return {
            "success": True,
            "message": f"Successfully imported {imported_count} chapters from hardcoded data into database",
            "imported_count": imported_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing chapters: {str(e)}")
