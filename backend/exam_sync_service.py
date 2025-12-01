"""
Exam Data Synchronization Service
Ensures data consistency between:
- exam_data.py (hardcoded exam metadata)
- exam_sheets collection (admin-created sheets with questions)
- questions collection (imported questions)
- Frontend display

Author: Ceibaa AI
"""

from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database reference
db = None

def init_db(database):
    """Initialize database connection"""
    global db
    db = database


# ==================== DATA AUDIT ====================

async def audit_exam_data() -> Dict[str, Any]:
    """
    Comprehensive audit of exam data across all sources.
    Identifies mismatches between hardcoded data, database, and sheets.
    """
    from exam_data import EXAM_DATA, get_all_exams
    
    audit_report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": {},
        "hardcoded_exams": [],
        "database_exams": [],
        "sheets_exams": [],
        "discrepancies": [],
        "missing_in_db": [],
        "missing_in_hardcode": [],
        "mismatched_data": [],
        "orphan_sheets": [],
        "orphan_questions": []
    }
    
    try:
        # 1. Get hardcoded exams from exam_data.py
        hardcoded_exams = list(EXAM_DATA.keys())
        audit_report["hardcoded_exams"] = hardcoded_exams
        
        # 2. Get unique exams from exam_sheets collection
        if db is not None:
            sheets_pipeline = [
                {"$group": {"_id": "$exam_name"}},
                {"$project": {"exam_name": "$_id", "_id": 0}}
            ]
            sheets_cursor = await db.exam_sheets.aggregate(sheets_pipeline).to_list(None)
            db_exams_from_sheets = [s["exam_name"] for s in sheets_cursor if s.get("exam_name")]
            audit_report["database_exams"] = db_exams_from_sheets
            
            # 3. Get unique exams from questions collection
            questions_pipeline = [
                {"$group": {"_id": "$exam_name"}},
                {"$project": {"exam_name": "$_id", "_id": 0}}
            ]
            questions_cursor = await db.questions.aggregate(questions_pipeline).to_list(None)
            db_exams_from_questions = [q["exam_name"] for q in questions_cursor if q.get("exam_name")]
            
            # 4. Compare and find discrepancies
            all_db_exams = set(db_exams_from_sheets) | set(db_exams_from_questions)
            hardcoded_set = set(hardcoded_exams)
            
            # Exams in hardcode but not in DB (need sheets)
            audit_report["missing_in_db"] = list(hardcoded_set - all_db_exams)
            
            # Exams in DB but not in hardcode (orphans or new)
            audit_report["missing_in_hardcode"] = list(all_db_exams - hardcoded_set)
            
            # 5. Check for sheets without questions
            sheets_with_questions = await db.exam_sheets.find(
                {"questions_imported": True, "question_count": {"$gt": 0}},
                {"_id": 0, "id": 1, "exam_name": 1, "subject": 1, "sub_topic": 1}
            ).to_list(None)
            
            sheets_without_questions = await db.exam_sheets.find(
                {"$or": [{"questions_imported": False}, {"question_count": 0}, {"question_count": None}]},
                {"_id": 0, "id": 1, "exam_name": 1, "subject": 1, "sub_topic": 1, "sheet_link": 1}
            ).to_list(None)
            
            audit_report["orphan_sheets"] = sheets_without_questions
            
            # 6. Check for questions without valid sheet reference
            orphan_questions = await db.questions.find(
                {"sheet_id": None},
                {"_id": 0, "id": 1, "exam_name": 1, "subject": 1}
            ).to_list(100)  # Limit to first 100
            
            audit_report["orphan_questions"] = orphan_questions
            
            # 7. Per-exam detailed analysis
            exam_details = []
            for exam_id in hardcoded_exams:
                exam_info = EXAM_DATA.get(exam_id, {})
                
                # Count sheets for this exam
                sheet_count = await db.exam_sheets.count_documents({"exam_name": exam_id})
                
                # Count questions for this exam
                question_count = await db.questions.count_documents({"exam_name": exam_id})
                
                # Get subjects covered
                subjects_cursor = await db.exam_sheets.distinct("subject", {"exam_name": exam_id})
                
                exam_details.append({
                    "exam_id": exam_id,
                    "name": exam_info.get("name", exam_id),
                    "in_hardcode": True,
                    "sheets_count": sheet_count,
                    "questions_count": question_count,
                    "subjects_covered": subjects_cursor,
                    "has_data": question_count > 0,
                    "status": "active" if question_count > 0 else "needs_content"
                })
            
            audit_report["exam_details"] = exam_details
            
        # Summary
        audit_report["summary"] = {
            "total_hardcoded_exams": len(hardcoded_exams),
            "total_db_exams": len(audit_report["database_exams"]),
            "missing_in_db_count": len(audit_report["missing_in_db"]),
            "missing_in_hardcode_count": len(audit_report["missing_in_hardcode"]),
            "orphan_sheets_count": len(audit_report["orphan_sheets"]),
            "orphan_questions_count": len(audit_report["orphan_questions"]),
            "sync_status": "OK" if len(audit_report["missing_in_db"]) == 0 and len(audit_report["orphan_sheets"]) == 0 else "NEEDS_SYNC"
        }
        
        logger.info(f"Audit complete: {audit_report['summary']}")
        
    except Exception as e:
        logger.error(f"Audit failed: {str(e)}")
        audit_report["error"] = str(e)
    
    return audit_report


# ==================== SYNCHRONIZATION ====================

async def sync_exam_data(
    source_of_truth: str = "hardcode",  # 'hardcode' or 'database'
    dry_run: bool = True
) -> Dict[str, Any]:
    """
    Synchronize exam data between hardcoded and database sources.
    
    Args:
        source_of_truth: Which source to use as authoritative
        dry_run: If True, only report what would change without making changes
    """
    from exam_data import EXAM_DATA
    
    sync_report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source_of_truth": source_of_truth,
        "dry_run": dry_run,
        "actions": [],
        "errors": [],
        "summary": {}
    }
    
    try:
        if source_of_truth == "hardcode":
            # Ensure all hardcoded exams exist in database metadata
            for exam_id, exam_data in EXAM_DATA.items():
                # Check if exam metadata exists
                existing = await db.exam_metadata.find_one({"exam_id": exam_id})
                
                if not existing:
                    action = {
                        "type": "CREATE_METADATA",
                        "exam_id": exam_id,
                        "data": {
                            "exam_id": exam_id,
                            "name": exam_data.get("name", exam_id),
                            "full_name": exam_data.get("full_name", exam_id),
                            "description": exam_data.get("description", ""),
                            "icon": exam_data.get("icon", ""),
                            "color": exam_data.get("color", "from-blue-500 to-cyan-500"),
                            "category": exam_data.get("category", ""),
                            "total_questions": exam_data.get("total_questions", 0),
                            "duration": exam_data.get("duration", ""),
                            "synced_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                    
                    if not dry_run:
                        await db.exam_metadata.insert_one(action["data"].copy())
                        action["status"] = "COMPLETED"
                    else:
                        action["status"] = "WOULD_CREATE"
                    
                    sync_report["actions"].append(action)
                else:
                    # Check if update needed
                    needs_update = (
                        existing.get("name") != exam_data.get("name") or
                        existing.get("full_name") != exam_data.get("full_name") or
                        existing.get("category") != exam_data.get("category")
                    )
                    
                    if needs_update:
                        action = {
                            "type": "UPDATE_METADATA",
                            "exam_id": exam_id,
                            "changes": {
                                "name": exam_data.get("name"),
                                "full_name": exam_data.get("full_name"),
                                "category": exam_data.get("category"),
                                "synced_at": datetime.now(timezone.utc).isoformat()
                            }
                        }
                        
                        if not dry_run:
                            await db.exam_metadata.update_one(
                                {"exam_id": exam_id},
                                {"$set": action["changes"]}
                            )
                            action["status"] = "COMPLETED"
                        else:
                            action["status"] = "WOULD_UPDATE"
                        
                        sync_report["actions"].append(action)
        
        # Summary
        sync_report["summary"] = {
            "total_actions": len(sync_report["actions"]),
            "creates": len([a for a in sync_report["actions"] if "CREATE" in a["type"]]),
            "updates": len([a for a in sync_report["actions"] if "UPDATE" in a["type"]]),
            "errors": len(sync_report["errors"]),
            "status": "SUCCESS" if len(sync_report["errors"]) == 0 else "PARTIAL"
        }
        
    except Exception as e:
        logger.error(f"Sync failed: {str(e)}")
        sync_report["errors"].append(str(e))
        sync_report["summary"]["status"] = "FAILED"
    
    return sync_report


# ==================== EXAM CRUD OPERATIONS ====================

async def create_exam(exam_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new exam entry in both metadata and prepare for sheets.
    """
    try:
        exam_id = exam_data.get("exam_id") or exam_data.get("name", "").upper().replace(" ", "_")
        
        # Validate required fields
        required_fields = ["name"]
        missing = [f for f in required_fields if not exam_data.get(f)]
        if missing:
            return {"success": False, "error": f"Missing required fields: {missing}"}
        
        # Check for duplicates
        existing = await db.exam_metadata.find_one({"exam_id": exam_id})
        if existing:
            return {"success": False, "error": f"Exam {exam_id} already exists"}
        
        # Create metadata document
        metadata_doc = {
            "id": str(uuid.uuid4()),
            "exam_id": exam_id,
            "name": exam_data.get("name"),
            "full_name": exam_data.get("full_name", exam_data.get("name")),
            "description": exam_data.get("description", ""),
            "icon": exam_data.get("icon", "📚"),
            "color": exam_data.get("color", "from-blue-500 to-cyan-500"),
            "category": exam_data.get("category", "Competitive Exams"),
            "total_questions": exam_data.get("total_questions", 0),
            "duration": exam_data.get("duration", ""),
            "syllabus_topics": exam_data.get("syllabus_topics", {}),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.exam_metadata.insert_one(metadata_doc.copy())
        
        # Log the action
        await log_exam_action("CREATE", exam_id, metadata_doc)
        
        return {
            "success": True,
            "message": f"Exam {exam_id} created successfully",
            "exam": {k: v for k, v in metadata_doc.items() if k != "_id"}
        }
        
    except Exception as e:
        logger.error(f"Create exam failed: {str(e)}")
        return {"success": False, "error": str(e)}


async def update_exam(exam_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an existing exam's metadata.
    """
    try:
        existing = await db.exam_metadata.find_one({"exam_id": exam_id})
        if not existing:
            return {"success": False, "error": f"Exam {exam_id} not found"}
        
        # Prepare update
        update_fields = {
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Only update allowed fields
        allowed_fields = [
            "name", "full_name", "description", "icon", "color",
            "category", "total_questions", "duration", "syllabus_topics", "is_active"
        ]
        
        for field in allowed_fields:
            if field in update_data:
                update_fields[field] = update_data[field]
        
        await db.exam_metadata.update_one(
            {"exam_id": exam_id},
            {"$set": update_fields}
        )
        
        # Log the action
        await log_exam_action("UPDATE", exam_id, update_fields)
        
        # Get updated document
        updated = await db.exam_metadata.find_one({"exam_id": exam_id}, {"_id": 0})
        
        return {
            "success": True,
            "message": f"Exam {exam_id} updated successfully",
            "exam": updated
        }
        
    except Exception as e:
        logger.error(f"Update exam failed: {str(e)}")
        return {"success": False, "error": str(e)}


async def delete_exam(exam_id: str, cascade: bool = False) -> Dict[str, Any]:
    """
    Delete an exam and optionally cascade delete sheets and questions.
    """
    try:
        existing = await db.exam_metadata.find_one({"exam_id": exam_id})
        if not existing:
            return {"success": False, "error": f"Exam {exam_id} not found"}
        
        deleted_counts = {
            "metadata": 0,
            "sheets": 0,
            "questions": 0
        }
        
        if cascade:
            # Delete all related sheets
            sheets_result = await db.exam_sheets.delete_many({"exam_name": exam_id})
            deleted_counts["sheets"] = sheets_result.deleted_count
            
            # Delete all related questions
            questions_result = await db.questions.delete_many({"exam_name": exam_id})
            deleted_counts["questions"] = questions_result.deleted_count
        
        # Delete metadata
        await db.exam_metadata.delete_one({"exam_id": exam_id})
        deleted_counts["metadata"] = 1
        
        # Log the action
        await log_exam_action("DELETE", exam_id, {"cascade": cascade, "deleted": deleted_counts})
        
        return {
            "success": True,
            "message": f"Exam {exam_id} deleted successfully",
            "deleted_counts": deleted_counts
        }
        
    except Exception as e:
        logger.error(f"Delete exam failed: {str(e)}")
        return {"success": False, "error": str(e)}


# ==================== LOGGING ====================

async def log_exam_action(action: str, exam_id: str, data: Dict[str, Any]):
    """Log exam CRUD actions for audit trail"""
    try:
        log_entry = {
            "id": str(uuid.uuid4()),
            "action": action,
            "exam_id": exam_id,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.exam_audit_log.insert_one(log_entry)
        logger.info(f"[EXAM_LOG] {action} - {exam_id}")
    except Exception as e:
        logger.error(f"Failed to log action: {str(e)}")


# ==================== VALIDATION ====================

def validate_exam_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate exam data before create/update"""
    errors = []
    warnings = []
    
    # Required fields
    if not data.get("name"):
        errors.append("Name is required")
    
    # Field type validation
    if data.get("total_questions") and not isinstance(data["total_questions"], int):
        try:
            data["total_questions"] = int(data["total_questions"])
        except:
            errors.append("total_questions must be a number")
    
    # Icon validation
    if data.get("icon"):
        icon = data["icon"]
        if not (icon.startswith("http") or len(icon) <= 4):  # URL or emoji
            warnings.append("Icon should be a URL or emoji")
    
    # Color validation
    if data.get("color"):
        if not data["color"].startswith("from-"):
            warnings.append("Color should be a Tailwind gradient (e.g., 'from-blue-500 to-cyan-500')")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "sanitized_data": data
    }


# ==================== MIGRATION ====================

async def run_migration(backup_first: bool = True) -> Dict[str, Any]:
    """
    One-time migration to sync all exam data and clean up.
    """
    migration_report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "backup_created": False,
        "steps": [],
        "errors": []
    }
    
    try:
        # Step 1: Backup
        if backup_first:
            backup_id = f"migration_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Backup exam_sheets
            sheets = await db.exam_sheets.find({}).to_list(None)
            if sheets:
                for s in sheets:
                    s.pop("_id", None)
                await db[f"backup_{backup_id}_sheets"].insert_many([s.copy() for s in sheets])
            
            # Backup questions
            questions = await db.questions.find({}).to_list(10000)
            if questions:
                for q in questions:
                    q.pop("_id", None)
                await db[f"backup_{backup_id}_questions"].insert_many([q.copy() for q in questions])
            
            migration_report["backup_created"] = True
            migration_report["backup_id"] = backup_id
            migration_report["steps"].append({"step": "BACKUP", "status": "SUCCESS"})
        
        # Step 2: Sync hardcoded exams to metadata
        sync_result = await sync_exam_data(source_of_truth="hardcode", dry_run=False)
        migration_report["steps"].append({
            "step": "SYNC_METADATA",
            "status": "SUCCESS" if sync_result["summary"]["status"] == "SUCCESS" else "PARTIAL",
            "details": sync_result["summary"]
        })
        
        # Step 3: Clean duplicate sheets
        # Find duplicates
        pipeline = [
            {"$group": {
                "_id": {"exam_name": "$exam_name", "subject": "$subject", "sub_topic": "$sub_topic"},
                "count": {"$sum": 1},
                "ids": {"$push": "$id"}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]
        duplicates = await db.exam_sheets.aggregate(pipeline).to_list(None)
        
        duplicates_removed = 0
        for dup in duplicates:
            # Keep the first, remove the rest
            ids_to_remove = dup["ids"][1:]
            result = await db.exam_sheets.delete_many({"id": {"$in": ids_to_remove}})
            duplicates_removed += result.deleted_count
        
        migration_report["steps"].append({
            "step": "CLEAN_DUPLICATES",
            "status": "SUCCESS",
            "duplicates_removed": duplicates_removed
        })
        
        # Step 4: Verify integrity
        audit = await audit_exam_data()
        migration_report["steps"].append({
            "step": "VERIFY_INTEGRITY",
            "status": "SUCCESS" if audit["summary"]["sync_status"] == "OK" else "NEEDS_ATTENTION",
            "audit_summary": audit["summary"]
        })
        
        migration_report["status"] = "SUCCESS"
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        migration_report["errors"].append(str(e))
        migration_report["status"] = "FAILED"
    
    return migration_report


# ==================== REAL-TIME SYNC ====================

async def notify_frontend_update(exam_id: str, action: str):
    """
    Notify frontend of exam data changes (for real-time updates).
    This integrates with the social_socketio for broadcasting.
    """
    try:
        from social_socketio import social_sio
        await social_sio.emit('exam_updated', {
            'exam_id': exam_id,
            'action': action,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Notified frontend: {action} for {exam_id}")
    except Exception as e:
        logger.warning(f"Could not notify frontend: {str(e)}")
