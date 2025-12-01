"""
Exam Synchronization API Routes
Provides endpoints for exam data management and synchronization
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api/exams", tags=["exams"])

# Database reference (set from server.py)
db = None

def init_db(database):
    global db
    db = database
    # Also initialize the sync service
    import exam_sync_service
    exam_sync_service.init_db(database)


# ==================== REQUEST MODELS ====================

class ExamCreate(BaseModel):
    name: str
    full_name: Optional[str] = None
    description: Optional[str] = ""
    icon: Optional[str] = "📚"
    color: Optional[str] = "from-blue-500 to-cyan-500"
    category: Optional[str] = "Competitive Exams"
    total_questions: Optional[int] = 0
    duration: Optional[str] = ""
    syllabus_topics: Optional[Dict[str, Any]] = {}


class ExamUpdate(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    total_questions: Optional[int] = None
    duration: Optional[str] = None
    syllabus_topics: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


# ==================== EXAM CRUD ENDPOINTS ====================

@router.get("")
async def get_all_exams(
    include_inactive: bool = Query(False, description="Include inactive exams"),
    category: Optional[str] = Query(None, description="Filter by category")
):
    """
    GET /api/exams - Fetch all exams
    Returns merged data from hardcoded exam_data.py and database metadata
    """
    from exam_data import EXAM_DATA, get_all_exams as get_hardcoded_exams
    import exam_sync_service
    
    try:
        # Get hardcoded exams
        hardcoded = get_hardcoded_exams()
        
        # Get database metadata (if exists)
        db_filter = {} if include_inactive else {"is_active": {"$ne": False}}
        if category:
            db_filter["category"] = category
        
        db_exams = await db.exam_metadata.find(db_filter, {"_id": 0}).to_list(None) if db else []
        
        # Create lookup for DB exams
        db_lookup = {e.get("exam_id"): e for e in db_exams}
        
        # Merge: DB takes precedence for metadata, hardcoded provides structure
        merged_exams = []
        seen_ids = set()
        
        for exam in hardcoded:
            exam_id = exam.get("id")
            seen_ids.add(exam_id)
            
            # Get DB override if exists
            db_override = db_lookup.get(exam_id, {})
            
            merged_exam = {
                "id": exam_id,
                "name": db_override.get("name") or exam.get("name"),
                "full_name": db_override.get("full_name") or exam.get("full_name"),
                "description": db_override.get("description") or exam.get("description"),
                "icon": db_override.get("icon") or exam.get("icon"),
                "color": db_override.get("color") or exam.get("color"),
                "category": db_override.get("category") or exam.get("category"),
                "total_questions": db_override.get("total_questions") or exam.get("total_questions"),
                "duration": db_override.get("duration") or exam.get("duration"),
                "is_active": db_override.get("is_active", True),
                "has_db_metadata": exam_id in db_lookup,
                "source": "merged"
            }
            
            # Apply category filter
            if category and merged_exam.get("category") != category:
                continue
            
            merged_exams.append(merged_exam)
        
        # Add DB-only exams (not in hardcoded)
        for exam_id, db_exam in db_lookup.items():
            if exam_id not in seen_ids:
                merged_exams.append({
                    **db_exam,
                    "source": "database_only"
                })
        
        # Get question counts for each exam
        for exam in merged_exams:
            count = await db.questions.count_documents({"exam_name": exam["id"]}) if db else 0
            exam["questions_in_db"] = count
        
        return {
            "success": True,
            "exams": merged_exams,
            "count": len(merged_exams),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{exam_id}")
async def get_exam(exam_id: str):
    """
    GET /api/exams/:id - Fetch single exam with full details
    """
    from exam_data import get_exam_details
    
    try:
        # Get hardcoded data
        hardcoded = get_exam_details(exam_id)
        
        # Get database metadata
        db_meta = await db.exam_metadata.find_one({"exam_id": exam_id}, {"_id": 0}) if db else None
        
        if not hardcoded and not db_meta:
            raise HTTPException(status_code=404, detail=f"Exam {exam_id} not found")
        
        # Merge data
        exam = hardcoded.copy() if hardcoded else {}
        if db_meta:
            for key, value in db_meta.items():
                if value is not None:
                    exam[key] = value
        
        # Get question count
        question_count = await db.questions.count_documents({"exam_name": exam_id}) if db else 0
        exam["questions_in_db"] = question_count
        
        # Get sheets count
        sheets_count = await db.exam_sheets.count_documents({"exam_name": exam_id}) if db else 0
        exam["sheets_count"] = sheets_count
        
        return {
            "success": True,
            "exam": exam
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_exam(exam: ExamCreate):
    """
    POST /api/exams - Create new exam
    """
    import exam_sync_service
    
    result = await exam_sync_service.create_exam(exam.dict())
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.put("/{exam_id}")
async def update_exam(exam_id: str, exam: ExamUpdate):
    """
    PUT /api/exams/:id - Update exam
    """
    import exam_sync_service
    
    update_data = {k: v for k, v in exam.dict().items() if v is not None}
    result = await exam_sync_service.update_exam(exam_id, update_data)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.delete("/{exam_id}")
async def delete_exam(
    exam_id: str,
    cascade: bool = Query(False, description="Delete associated sheets and questions")
):
    """
    DELETE /api/exams/:id - Delete exam
    """
    import exam_sync_service
    
    result = await exam_sync_service.delete_exam(exam_id, cascade=cascade)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


# ==================== SYNC ENDPOINTS ====================

@router.post("/sync")
async def trigger_sync(
    source: str = Query("hardcode", description="Source of truth: 'hardcode' or 'database'"),
    dry_run: bool = Query(True, description="Preview changes without applying")
):
    """
    POST /api/exams/sync - Manual sync trigger
    """
    import exam_sync_service
    
    try:
        result = await exam_sync_service.sync_exam_data(
            source_of_truth=source,
            dry_run=dry_run
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit")
async def audit_exams():
    """
    GET /api/exams/audit - Run data audit
    """
    import exam_sync_service
    
    try:
        result = await exam_sync_service.audit_exam_data()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/migrate")
async def run_migration(
    backup: bool = Query(True, description="Create backup before migration")
):
    """
    POST /api/exams/migrate - Run one-time migration
    """
    import exam_sync_service
    
    try:
        result = await exam_sync_service.run_migration(backup_first=backup)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== UTILITY ENDPOINTS ====================

@router.get("/categories")
async def get_categories():
    """
    GET /api/exams/categories - Get all exam categories
    """
    from exam_data import EXAM_DATA
    
    categories = set()
    for exam_id, exam in EXAM_DATA.items():
        if exam.get("category"):
            categories.add(exam["category"])
    
    # Also get from database
    if db:
        db_categories = await db.exam_metadata.distinct("category")
        categories.update([c for c in db_categories if c])
    
    return {
        "success": True,
        "categories": sorted(list(categories))
    }


@router.get("/stats")
async def get_exam_stats():
    """
    GET /api/exams/stats - Get exam statistics
    """
    from exam_data import EXAM_DATA
    
    try:
        stats = {
            "total_hardcoded_exams": len(EXAM_DATA),
            "total_db_metadata": await db.exam_metadata.count_documents({}) if db else 0,
            "total_sheets": await db.exam_sheets.count_documents({}) if db else 0,
            "total_questions": await db.questions.count_documents({}) if db else 0,
            "sheets_with_questions": await db.exam_sheets.count_documents({"question_count": {"$gt": 0}}) if db else 0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Category breakdown
        if db:
            category_pipeline = [
                {"$group": {"_id": "$category", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            categories = await db.exam_metadata.aggregate(category_pipeline).to_list(None)
            stats["by_category"] = {c["_id"]: c["count"] for c in categories if c["_id"]}
        
        return {"success": True, "stats": stats}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit-log")
async def get_audit_log(
    limit: int = Query(100, description="Number of entries to return"),
    exam_id: Optional[str] = Query(None, description="Filter by exam ID")
):
    """
    GET /api/exams/audit-log - Get exam change history
    """
    try:
        filter_query = {}
        if exam_id:
            filter_query["exam_id"] = exam_id
        
        logs = await db.exam_audit_log.find(
            filter_query,
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "logs": logs,
            "count": len(logs)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
