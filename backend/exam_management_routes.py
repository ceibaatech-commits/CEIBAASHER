"""
Exam Management Routes - CRUD operations for Exams, Categories, and Chapters
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ============== PYDANTIC MODELS ==============

class ExamCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    duration: Optional[int] = 180  # minutes
    total_marks: Optional[int] = 100
    icon: Optional[str] = "📚"
    color: Optional[str] = "blue"
    is_active: Optional[bool] = True

class ExamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    total_marks: Optional[int] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryCreate(BaseModel):
    exam_id: str
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = "📖"
    color: Optional[str] = "indigo"
    is_active: Optional[bool] = True

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

class ChapterCreate(BaseModel):
    exam_id: str
    category_id: str
    name: str
    description: Optional[str] = ""
    sub_topics: Optional[List[str]] = []
    is_active: Optional[bool] = True

class ChapterUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sub_topics: Optional[List[str]] = None
    is_active: Optional[bool] = None

# ============== EXAM CRUD ==============

@router.get("/exams")
async def get_all_exams():
    """Get all exams"""
    try:
        exams = await db.exams.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
        return {"success": True, "exams": exams}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/exams/{exam_id}")
async def get_exam(exam_id: str):
    """Get a specific exam"""
    try:
        exam = await db.exams.find_one({"id": exam_id}, {"_id": 0})
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        return {"success": True, "exam": exam}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/exams")
async def create_exam(exam: ExamCreate):
    """Create a new exam"""
    try:
        exam_data = {
            "id": str(uuid.uuid4()),
            "name": exam.name,
            "description": exam.description,
            "duration": exam.duration,
            "total_marks": exam.total_marks,
            "icon": exam.icon,
            "color": exam.color,
            "is_active": exam.is_active,
            "categories_count": 0,
            "chapters_count": 0,
            "questions_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        await db.exams.insert_one(exam_data)
        
        # Return without _id
        exam_data.pop("_id", None)
        return {"success": True, "exam": exam_data, "message": "Exam created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/exams/{exam_id}")
async def update_exam(exam_id: str, exam: ExamUpdate):
    """Update an exam"""
    try:
        # Build update dict with only provided fields
        update_data = {k: v for k, v in exam.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = await db.exams.update_one(
            {"id": exam_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        # Also update related categories and chapters if name changed
        if exam.name:
            await db.categories.update_many(
                {"exam_id": exam_id},
                {"$set": {"exam_name": exam.name}}
            )
            await db.chapters.update_many(
                {"exam_id": exam_id},
                {"$set": {"exam_name": exam.name}}
            )
        
        updated = await db.exams.find_one({"id": exam_id}, {"_id": 0})
        return {"success": True, "exam": updated, "message": "Exam updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/exams/{exam_id}")
async def delete_exam(exam_id: str):
    """Delete an exam and all related categories, chapters, and questions"""
    try:
        # Check if exam exists
        exam = await db.exams.find_one({"id": exam_id})
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        # Delete related data
        await db.categories.delete_many({"exam_id": exam_id})
        await db.chapters.delete_many({"exam_id": exam_id})
        await db.questions.delete_many({"exam_id": exam_id})
        
        # Delete the exam
        await db.exams.delete_one({"id": exam_id})
        
        return {"success": True, "message": f"Exam '{exam.get('name')}' and all related data deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== CATEGORY CRUD ==============

@router.get("/categories")
async def get_all_categories(exam_id: Optional[str] = None):
    """Get all categories, optionally filtered by exam"""
    try:
        query = {}
        if exam_id:
            query["exam_id"] = exam_id
        
        categories = await db.categories.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
        return {"success": True, "categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/{category_id}")
async def get_category(category_id: str):
    """Get a specific category"""
    try:
        category = await db.categories.find_one({"id": category_id}, {"_id": 0})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"success": True, "category": category}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories")
async def create_category(category: CategoryCreate):
    """Create a new category (subject)"""
    try:
        # Get exam name
        exam = await db.exams.find_one({"id": category.exam_id})
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        category_data = {
            "id": str(uuid.uuid4()),
            "exam_id": category.exam_id,
            "exam_name": exam.get("name"),
            "name": category.name,
            "description": category.description,
            "icon": category.icon,
            "color": category.color,
            "is_active": category.is_active,
            "chapters_count": 0,
            "questions_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        await db.categories.insert_one(category_data)
        
        # Update exam's category count
        await db.exams.update_one(
            {"id": category.exam_id},
            {"$inc": {"categories_count": 1}}
        )
        
        category_data.pop("_id", None)
        return {"success": True, "category": category_data, "message": "Category created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/categories/{category_id}")
async def update_category(category_id: str, category: CategoryUpdate):
    """Update a category"""
    try:
        update_data = {k: v for k, v in category.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = await db.categories.update_one(
            {"id": category_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Update related chapters if name changed
        if category.name:
            await db.chapters.update_many(
                {"category_id": category_id},
                {"$set": {"category_name": category.name}}
            )
        
        updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
        return {"success": True, "category": updated, "message": "Category updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete a category and all related chapters and questions"""
    try:
        category = await db.categories.find_one({"id": category_id})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Delete related data
        await db.chapters.delete_many({"category_id": category_id})
        await db.questions.delete_many({"category_id": category_id})
        
        # Delete the category
        await db.categories.delete_one({"id": category_id})
        
        # Update exam's category count
        await db.exams.update_one(
            {"id": category.get("exam_id")},
            {"$inc": {"categories_count": -1}}
        )
        
        return {"success": True, "message": f"Category '{category.get('name')}' and all related data deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== CHAPTER CRUD ==============

@router.get("/chapters")
async def get_all_chapters(exam_id: Optional[str] = None, category_id: Optional[str] = None):
    """Get all chapters, optionally filtered by exam or category"""
    try:
        query = {}
        if exam_id:
            query["exam_id"] = exam_id
        if category_id:
            query["category_id"] = category_id
        
        chapters = await db.chapters.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
        return {"success": True, "chapters": chapters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chapters/{chapter_id}")
async def get_chapter(chapter_id: str):
    """Get a specific chapter"""
    try:
        chapter = await db.chapters.find_one({"id": chapter_id}, {"_id": 0})
        if not chapter:
            raise HTTPException(status_code=404, detail="Chapter not found")
        return {"success": True, "chapter": chapter}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chapters")
async def create_chapter(chapter: ChapterCreate):
    """Create a new chapter (topic)"""
    try:
        # Get exam and category names
        exam = await db.exams.find_one({"id": chapter.exam_id})
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        category = await db.categories.find_one({"id": chapter.category_id})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        chapter_data = {
            "id": str(uuid.uuid4()),
            "exam_id": chapter.exam_id,
            "exam_name": exam.get("name"),
            "category_id": chapter.category_id,
            "category_name": category.get("name"),
            "name": chapter.name,
            "description": chapter.description,
            "sub_topics": chapter.sub_topics,
            "is_active": chapter.is_active,
            "questions_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        await db.chapters.insert_one(chapter_data)
        
        # Update counts
        await db.exams.update_one(
            {"id": chapter.exam_id},
            {"$inc": {"chapters_count": 1}}
        )
        await db.categories.update_one(
            {"id": chapter.category_id},
            {"$inc": {"chapters_count": 1}}
        )
        
        chapter_data.pop("_id", None)
        return {"success": True, "chapter": chapter_data, "message": "Chapter created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/chapters/{chapter_id}")
async def update_chapter(chapter_id: str, chapter: ChapterUpdate):
    """Update a chapter"""
    try:
        update_data = {k: v for k, v in chapter.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = await db.chapters.update_one(
            {"id": chapter_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Chapter not found")
        
        updated = await db.chapters.find_one({"id": chapter_id}, {"_id": 0})
        return {"success": True, "chapter": updated, "message": "Chapter updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chapters/{chapter_id}")
async def delete_chapter(chapter_id: str):
    """Delete a chapter and all related questions"""
    try:
        chapter = await db.chapters.find_one({"id": chapter_id})
        if not chapter:
            raise HTTPException(status_code=404, detail="Chapter not found")
        
        # Delete related questions
        await db.questions.delete_many({"chapter_id": chapter_id})
        
        # Delete the chapter
        await db.chapters.delete_one({"id": chapter_id})
        
        # Update counts
        await db.exams.update_one(
            {"id": chapter.get("exam_id")},
            {"$inc": {"chapters_count": -1}}
        )
        await db.categories.update_one(
            {"id": chapter.get("category_id")},
            {"$inc": {"chapters_count": -1}}
        )
        
        return {"success": True, "message": f"Chapter '{chapter.get('name')}' and all related questions deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== STATS ==============

@router.get("/stats")
async def get_management_stats():
    """Get overall stats for exam management"""
    try:
        exams_count = await db.exams.count_documents({})
        categories_count = await db.categories.count_documents({})
        chapters_count = await db.chapters.count_documents({})
        questions_count = await db.questions.count_documents({})
        
        return {
            "success": True,
            "stats": {
                "exams": exams_count,
                "categories": categories_count,
                "chapters": chapters_count,
                "questions": questions_count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
