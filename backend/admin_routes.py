"""
Admin Routes for Ceibaa Platform
Handles admin panel operations like user management, analytics, etc.
"""
import re
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid

router = APIRouter()

# Global db instance (will be set from server.py)
db = None

def init_db(database):
    global db
    db = database

# ==================== PLATFORM SETTINGS ====================

class PlatformSettingsModel(BaseModel):
    allow_media_posts: Optional[bool] = False
    allow_image_posts: Optional[bool] = False
    allow_video_posts: Optional[bool] = False

@router.get("/admin/settings")
async def get_platform_settings():
    """Get platform settings for Victory Lane media posting"""
    try:
        settings = await db.platform_settings.find_one({"type": "victory_lane"}, {"_id": 0})
        if not settings:
            # Return default settings if none exist
            return {
                "success": True,
                "settings": {
                    "allow_media_posts": False,
                    "allow_image_posts": False,
                    "allow_video_posts": False
                }
            }
        return {"success": True, "settings": settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/settings")
async def update_platform_settings(settings: PlatformSettingsModel):
    """Update platform settings for Victory Lane media posting"""
    try:
        settings_data = {
            "type": "victory_lane",
            "allow_media_posts": settings.allow_media_posts,
            "allow_image_posts": settings.allow_image_posts,
            "allow_video_posts": settings.allow_video_posts,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.platform_settings.update_one(
            {"type": "victory_lane"},
            {"$set": settings_data},
            upsert=True
        )
        
        return {"success": True, "message": "Settings updated successfully", "settings": settings_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Public endpoint to check if media posts are allowed
@router.get("/settings/media-allowed")
async def check_media_allowed():
    """Public endpoint to check if media posts are allowed"""
    try:
        settings = await db.platform_settings.find_one({"type": "victory_lane"}, {"_id": 0})
        if not settings:
            return {
                "allow_media_posts": False,
                "allow_image_posts": False,
                "allow_video_posts": False
            }
        return {
            "allow_media_posts": settings.get("allow_media_posts", False),
            "allow_image_posts": settings.get("allow_image_posts", False),
            "allow_video_posts": settings.get("allow_video_posts", False)
        }
    except Exception as e:
        return {
            "allow_media_posts": False,
            "allow_image_posts": False,
            "allow_video_posts": False
        }

# ==================== USER MANAGEMENT ====================

class UserPermissionsModel(BaseModel):
    can_post_images: Optional[bool] = False
    can_post_videos: Optional[bool] = False
    is_disabled: Optional[bool] = False

@router.get("/admin/users")
async def get_all_users(limit: int = 5000, skip: int = 0):
    """
    Get all users with their details for admin panel
    Returns: List of users with id, name, email, status, permissions

    Pagination via `limit` (default 5000, capped at 50000) and `skip` (default 0).
    Organic signups are returned first, imported leads after — so the admin sees
    real users without scrolling through the imported list.
    """
    try:
        limit = max(1, min(int(limit), 50000))
        skip = max(0, int(skip))
        # Sort: imported=false (organic) before imported=true. Tiebreak by created_at desc.
        users = await (
            db.users.find({}, {"_id": 0, "password": 0, "token": 0, "secret": 0})
            .sort([("imported", 1), ("created_at", -1)])
            .skip(skip)
            .limit(limit)
            .to_list(limit)
        )
        
        # Enrich user data with status and permissions
        for user in users:
            user_id = user.get('id') or user.get('user_id')
            user['status'] = 'offline'
            
            # Use existing created_at, joined_at, or set as 'Unknown'
            if not user.get('created_at'):
                # Check for alternative date fields
                if user.get('joined_at'):
                    user['created_at'] = user.get('joined_at')
                elif user.get('last_login'):
                    user['created_at'] = user.get('last_login')
                # Don't set current time - leave as None so frontend shows 'N/A'
            
            if not user.get('id') and user.get('user_id'):
                user['id'] = user['user_id']
            
            # Add default permissions if not set (DEFAULT: FALSE - admin must enable)
            if 'can_post_images' not in user:
                user['can_post_images'] = False
            if 'can_post_videos' not in user:
                user['can_post_videos'] = False
            if 'is_disabled' not in user:
                user['is_disabled'] = False
        
        return {
            "success": True,
            "users": users,
            "count": len(users),
            "limit": limit,
            "skip": skip,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")

@router.put("/admin/users/{user_id}/permissions")
async def update_user_permissions(user_id: str, permissions: UserPermissionsModel):
    """
    Update individual user's permissions (can post images/videos, account status)
    """
    try:
        # Find user by id or user_id
        user = await db.users.find_one({"$or": [{"id": user_id}, {"user_id": user_id}]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update permissions
        update_data = {
            "can_post_images": permissions.can_post_images,
            "can_post_videos": permissions.can_post_videos,
            "is_disabled": permissions.is_disabled,
            "permissions_updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.update_one(
            {"$or": [{"id": user_id}, {"user_id": user_id}]},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "message": "User permissions updated",
            "user_id": user_id,
            "permissions": update_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating permissions: {str(e)}")

@router.get("/admin/users/{user_id}/permissions")
async def get_user_permissions(user_id: str):
    """
    Get individual user's permissions
    """
    try:
        user = await db.users.find_one(
            {"$or": [{"id": user_id}, {"user_id": user_id}]},
            {"_id": 0, "can_post_images": 1, "can_post_videos": 1, "is_disabled": 1, "name": 1, "username": 1}
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "user_id": user_id,
            "name": user.get("name") or user.get("username"),
            "can_post_images": user.get("can_post_images", False),
            "can_post_videos": user.get("can_post_videos", False),
            "is_disabled": user.get("is_disabled", False)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching permissions: {str(e)}")

def _media_disabled_response(globally_disabled: bool = False) -> dict:
    return {
        "can_post_images": False,
        "can_post_videos": False,
        "is_disabled": False,
        "media_disabled_globally": globally_disabled,
    }


async def _resolve_user_id_from_auth(authorization: Optional[str]) -> Optional[str]:
    """Extract user_id from either session token or JWT in Authorization header."""
    from jose import jwt, JWTError
    import os as _os

    if not authorization:
        return None
    token = authorization.replace("Bearer ", "")

    session = await db.user_sessions.find_one({"session_token": token})
    if session and session.get("user_id"):
        return session["user_id"]

    try:
        payload = jwt.decode(
            token,
            _os.environ["JWT_SECRET"],
            algorithms=[_os.getenv("JWT_ALGORITHM", "HS256")],
        )
        return payload.get("sub")
    except JWTError:
        return None


def _user_media_permissions(user: dict, global_images: bool, global_videos: bool) -> dict:
    """Compose per-user media permissions given the user doc and global toggles."""
    if user.get("is_disabled", False) or user.get("media_disabled", False):
        return {
            "can_post_images": False,
            "can_post_videos": False,
            "is_disabled": True,
            "media_disabled_globally": False,
        }

    user_images = user.get("can_post_images")
    user_videos = user.get("can_post_videos")
    if user_images is False or user_videos is False:
        return {
            "can_post_images": global_images and user_images is not False,
            "can_post_videos": global_videos and user_videos is not False,
            "is_disabled": False,
            "media_disabled_globally": False,
        }

    return {
        "can_post_images": global_images,
        "can_post_videos": global_videos,
        "is_disabled": False,
        "media_disabled_globally": False,
    }


# Public endpoint to get current user's media permissions
@router.get("/user/media-permissions")
async def get_current_user_media_permissions(authorization: Optional[str] = Header(None)):
    """
    Get current logged-in user's media posting permissions.

    Logic:
    - If global media is DISABLED -> no one can post media
    - If global media is ENABLED -> all authenticated users can post unless specifically disabled
    """
    try:
        global_settings = await db.platform_settings.find_one({"type": "victory_lane"}, {"_id": 0}) or {}
        global_media = global_settings.get("allow_media_posts", False)
        global_images = global_settings.get("allow_image_posts", False)
        global_videos = global_settings.get("allow_video_posts", False)

        if not global_media:
            return _media_disabled_response(globally_disabled=True)

        user_id = await _resolve_user_id_from_auth(authorization)
        if not user_id:
            return _media_disabled_response()

        user = await db.users.find_one({
            "$or": [{"id": user_id}, {"user_id": user_id}, {"email": user_id}]
        })

        if user:
            return _user_media_permissions(user, global_images, global_videos)

        # Valid token but user row not found — still allow when global is on
        return {
            "can_post_images": global_images,
            "can_post_videos": global_videos,
            "is_disabled": False,
            "media_disabled_globally": False,
        }
    except Exception as e:
        print(f"Error fetching media permissions: {e}")
        return {"can_post_images": False, "can_post_videos": False, "is_disabled": False}

@router.get("/admin/users/search")
async def search_users(query: str, limit: int = 20):
    """
    Search users by name, email, or ID
    """
    try:
        # Build search query
        search_filter = {
            "$or": [
                {"name": {"$regex": re.escape(query), "$options": "i"}},
                {"email": {"$regex": re.escape(query), "$options": "i"}},
                {"id": {"$regex": re.escape(query), "$options": "i"}}
            ]
        }
        
        users = await db.users.find(search_filter, {"_id": 0, "password": 0, "token": 0, "secret": 0}).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "users": users,
            "count": len(users)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching users: {str(e)}")


# ==================== EXAM SHEET MANAGEMENT ====================

class ExamSheet(BaseModel):
    type: str  # 'exam' or 'class'
    # For exam type
    exam_name: Optional[str] = None
    syllabus_topic: Optional[str] = None
    subject: Optional[str] = None
    sub_topic: Optional[str] = None
    sub_sub_topic: Optional[str] = None
    # For class type
    class_name: Optional[str] = None
    chapter: Optional[str] = None
    # Common
    sheet_link: str

@router.get("/admin/sheets")
async def get_all_sheets():
    """
    Get all exam sheets
    """
    try:
        sheets = await db.exam_sheets.find({}, {"_id": 0}).to_list(1000)
        return {
            "success": True,
            "sheets": sheets,
            "count": len(sheets)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sheets: {str(e)}")

# ---- Sheet helpers (extracted from create_sheet to reduce complexity) ----

def _exam_fields(sheet: "ExamSheet") -> dict:
    return {
        "exam_name": sheet.exam_name,
        "syllabus_topic": sheet.syllabus_topic,
        "subject": sheet.subject,
        "sub_topic": sheet.sub_topic,
        "sub_sub_topic": sheet.sub_sub_topic,
    }


def _class_fields(sheet: "ExamSheet") -> dict:
    return {
        "class_name": sheet.class_name,
        "subject": sheet.subject,
        "chapter": sheet.chapter,
    }


def _build_sheet_data(sheet: "ExamSheet", sheet_id: str) -> dict:
    data = {
        "id": sheet_id,
        "type": sheet.type,
        "sheet_link": sheet.sheet_link,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "questions_imported": False,
        "question_count": 0,
    }
    if sheet.type == "exam":
        data.update(_exam_fields(sheet))
    elif sheet.type == "class":
        data.update(_class_fields(sheet))
    return data


def _build_question_doc(sheet: "ExamSheet", sheet_id: str, idx: int, question: dict) -> dict:
    correct_answer = question["correctAnswer"]
    if isinstance(correct_answer, int):
        correct_answer = chr(ord('A') + correct_answer)

    doc = {
        "id": str(uuid.uuid4()),
        "sheet_id": sheet_id,
        "type": sheet.type,
        "question_number": idx + 1,
        "question": question["question"],
        "options": question["options"],
        "correctAnswer": correct_answer,
        "explanation": question.get("explanation", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if sheet.type == "exam":
        doc.update(_exam_fields(sheet))
    else:
        doc.update(_class_fields(sheet))
    return doc


async def _import_sheet_questions(sheet: "ExamSheet", sheet_id: str) -> int:
    """Fetch questions from the Google Sheet and insert them. Returns count imported."""
    from google_sheets_service import GoogleSheetsService
    sheets_service = GoogleSheetsService()

    print(f"Fetching questions from: {sheet.sheet_link}")
    questions = sheets_service.fetch_questions(sheet.sheet_link)
    print(f"Fetched {len(questions)} questions")

    if not questions:
        return 0

    for idx, question in enumerate(questions):
        await db.questions.insert_one(_build_question_doc(sheet, sheet_id, idx, question).copy())

    await db.exam_sheets.update_one(
        {"id": sheet_id},
        {"$set": {
            "questions_imported": True,
            "question_count": len(questions),
            "last_import": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return len(questions)


@router.post("/admin/sheets")
async def create_sheet(sheet: ExamSheet):
    """Create a new exam sheet entry and import questions."""
    try:
        sheet_id = str(uuid.uuid4())
        sheet_data = _build_sheet_data(sheet, sheet_id)

        await db.exam_sheets.insert_one(sheet_data.copy())
        sheet_data.pop("_id", None)

        try:
            imported = await _import_sheet_questions(sheet, sheet_id)
            if imported == 0:
                return {
                    "success": True,
                    "message": "Sheet created but no questions found. Please check sheet format.",
                    "sheet": sheet_data,
                    "questions_imported": 0,
                    "warning": "No questions imported. Verify sheet is public and has correct format.",
                    "sheet_id": sheet_id,
                }
            return {
                "success": True,
                "message": f"Sheet created successfully with {imported} questions imported",
                "sheet": sheet_data,
                "questions_imported": imported,
                "sheet_id": sheet_id,
            }
        except Exception as import_error:
            import traceback
            print(f"Error importing questions: {import_error}")
            print(traceback.format_exc())
            return {
                "success": True,
                "message": f"Sheet created but questions import failed: {str(import_error)}",
                "sheet": sheet_data,
                "questions_imported": 0,
                "error": str(import_error),
                "sheet_id": sheet_id,
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating sheet: {str(e)}")

@router.delete("/admin/sheets/{sheet_id}")
async def delete_sheet(sheet_id: str):
    """
    Delete an exam sheet AND all its associated questions
    """
    try:
        # First, delete all questions associated with this sheet
        questions_result = await db.questions.delete_many({"sheet_id": sheet_id})
        print(f"🗑️ Deleted {questions_result.deleted_count} questions for sheet {sheet_id}")
        
        # Then delete the sheet itself
        result = await db.exam_sheets.delete_one({"id": sheet_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Sheet not found")
        
        return {
            "success": True,
            "message": "Sheet and all questions deleted successfully",
            "deleted_questions": questions_result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting sheet: {str(e)}")

@router.get("/admin/sheets/search")
async def search_sheets(query: str):
    """
    Search sheets by exam name, class, subject, etc.
    """
    try:
        search_filter = {
            "$or": [
                {"exam_name": {"$regex": re.escape(query), "$options": "i"}},
                {"class_name": {"$regex": re.escape(query), "$options": "i"}},
                {"subject": {"$regex": re.escape(query), "$options": "i"}},
                {"syllabus_topic": {"$regex": re.escape(query), "$options": "i"}},
                {"chapter": {"$regex": re.escape(query), "$options": "i"}}
            ]
        }
        
        sheets = await db.exam_sheets.find(search_filter, {"_id": 0}).to_list(100)
        
        return {
            "success": True,
            "sheets": sheets,
            "count": len(sheets)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching sheets: {str(e)}")

def _question_doc_from_sheet_dict(sheet: dict, sheet_id: str, idx: int, question: dict) -> dict:
    """Build a question document from a dict-shaped sheet row (for re-import)."""
    correct_answer = question["correctAnswer"]
    if isinstance(correct_answer, int):
        correct_answer = chr(ord('A') + correct_answer)

    doc = {
        "id": str(uuid.uuid4()),
        "sheet_id": sheet_id,
        "type": sheet["type"],
        "question_number": idx + 1,
        "question": question["question"],
        "options": question["options"],
        "correctAnswer": correct_answer,
        "explanation": question.get("explanation", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if sheet["type"] == "exam":
        doc.update({
            "exam_name": sheet.get("exam_name"),
            "syllabus_topic": sheet.get("syllabus_topic"),
            "subject": sheet.get("subject"),
            "sub_topic": sheet.get("sub_topic"),
            "sub_sub_topic": sheet.get("sub_sub_topic"),
        })
    else:
        doc.update({
            "class_name": sheet.get("class_name"),
            "subject": sheet.get("subject"),
            "chapter": sheet.get("chapter"),
        })
    return doc


@router.post("/admin/sheets/{sheet_id}/import")
async def import_sheet_questions(sheet_id: str):
    """Manually import/re-import questions from a sheet."""
    try:
        sheet = await db.exam_sheets.find_one({"id": sheet_id}, {"_id": 0})
        if not sheet:
            raise HTTPException(status_code=404, detail="Sheet not found")

        from google_sheets_service import GoogleSheetsService
        sheets_service = GoogleSheetsService()

        delete_result = await db.questions.delete_many({"sheet_id": sheet_id})
        questions = sheets_service.fetch_questions(sheet["sheet_link"])

        if not questions:
            return {
                "success": False,
                "message": "No questions found in sheet",
                "error": "Sheet is empty or format is incorrect",
            }

        imported_count = 0
        for idx, question in enumerate(questions):
            await db.questions.insert_one(
                _question_doc_from_sheet_dict(sheet, sheet_id, idx, question).copy()
            )
            imported_count += 1

        await db.exam_sheets.update_one(
            {"id": sheet_id},
            {"$set": {
                "questions_imported": True,
                "question_count": imported_count,
                "last_import": datetime.now(timezone.utc).isoformat(),
            }},
        )

        return {
            "success": True,
            "message": f"Successfully imported {imported_count} questions",
            "deleted": delete_result.deleted_count,
            "imported": imported_count,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing questions: {str(e)}")

@router.get("/admin/sheets/{sheet_id}/test")
async def test_sheet_access(sheet_id: str):
    """
    Test if we can access and parse a Google Sheet
    """
    try:
        sheet = await db.exam_sheets.find_one({"id": sheet_id}, {"_id": 0})
        if not sheet:
            raise HTTPException(status_code=404, detail="Sheet not found")
        
        from google_sheets_service import GoogleSheetsService
        sheets_service = GoogleSheetsService()
        
        # Test sheet access
        test_result = sheets_service.test_sheet_access(sheet["sheet_link"])
        
        if test_result["success"]:
            # Try to fetch sample questions
            questions = sheets_service.fetch_questions(sheet["sheet_link"])
            test_result["question_count"] = len(questions)
            test_result["sample_questions"] = questions[:3] if questions else []
        
        return test_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing sheet: {str(e)}")

@router.get("/admin/users/{user_id}")
async def get_user_details(user_id: str):
    """
    Get detailed information about a specific user
    """
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        if not user:
            # Try with user_id field as fallback
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get additional stats (excluding reposts to match frontend Posts tab filter)
        posts_count = await db.social_posts.count_documents({
            "user_id": user_id,
            "is_retweet": {"$ne": True}
        })
        battles_count = await db.battles.count_documents({"participants": user_id}) if hasattr(db, 'battles') else 0
        
        # Get user's ceeps (following)
        following_count = await db.ceeps.count_documents({"user_id": user_id})
        followers_count = await db.ceeps.count_documents({"ceep_user_id": user_id})
        
        user['stats'] = {
            'posts_count': posts_count,
            'battles_count': battles_count,
            'following_count': following_count,
            'followers_count': followers_count
        }
        
        return {
            "success": True,
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user details: {str(e)}")

@router.get("/admin/stats/overview")
async def get_admin_overview_stats():
    """
    Get overview statistics for admin dashboard
    """
    try:
        # Count users
        total_users = await db.users.count_documents({})
        
        # Count posts
        total_posts = await db.social_posts.count_documents({})
        
        # Count battles (if collection exists)
        total_battles = 0
        try:
            total_battles = await db.battles.count_documents({})
        except:
            pass
        
        # Get recent registrations (last 7 days)
        from datetime import timedelta
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        
        recent_users = await db.users.count_documents({
            "created_at": {"$gte": seven_days_ago.isoformat()}
        })
        
        return {
            "success": True,
            "stats": {
                "total_users": total_users,
                "total_posts": total_posts,
                "total_battles": total_battles,
                "recent_users": recent_users
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overview stats: {str(e)}")

@router.get("/admin/stats/follows")
async def get_follows_count():
    """Get total number of follow relationships"""
    try:
        total_follows = await db.ceeps.count_documents({})
        return {"success": True, "count": total_follows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching follows: {str(e)}")

@router.get("/admin/stats/likes")
async def get_likes_count():
    """Get total number of likes"""
    try:
        total_likes = await db.post_likes.count_documents({})
        return {"success": True, "count": total_likes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching likes: {str(e)}")

@router.get("/admin/stats/comments")
async def get_comments_count():
    """Get total number of comments"""
    try:
        total_comments = await db.post_comments.count_documents({})
        return {"success": True, "count": total_comments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching comments: {str(e)}")

@router.put("/admin/users/{user_id}/status")
async def update_user_status(user_id: str, status: str):
    """
    Update user status (ban, suspend, activate)
    """
    try:
        valid_statuses = ['active', 'banned', 'suspended']
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "account_status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": f"User status updated to {status}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user status: {str(e)}")

@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str):
    """
    Delete a user (soft delete - marks as deleted but keeps data)
    """
    try:
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "deleted": True,
                "deleted_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": "User deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")

# ==================== MANUAL QUESTION ENTRY ====================

class ManualQuestion(BaseModel):
    question: str
    question_image: Optional[str] = None
    options: List
    correctAnswer: str
    explanation: Optional[str] = ""
    type: Optional[str] = "class"
    class_name: Optional[str] = None
    subject: Optional[str] = None
    chapter: Optional[str] = None
    exam_name: Optional[str] = None
    syllabus_topic: Optional[str] = None
    sub_topic: Optional[str] = None

@router.post("/admin/add-question")
async def add_manual_question(question_data: ManualQuestion):
    """
    Add a single question manually with image support
    """
    try:
        question_doc = {
            "id": str(uuid.uuid4()),
            "question": question_data.question,
            "question_image": question_data.question_image,
            "options": question_data.options,
            "correctAnswer": question_data.correctAnswer,
            "explanation": question_data.explanation or "",
            "type": question_data.type,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "source": "manual"
        }
        
        # Add categorization based on type
        if question_data.type == "class":
            question_doc.update({
                "class_name": question_data.class_name,
                "subject": question_data.subject,
                "chapter": question_data.chapter
            })
        else:
            question_doc.update({
                "exam_name": question_data.exam_name,
                "syllabus_topic": question_data.syllabus_topic,
                "subject": question_data.subject,
                "sub_topic": question_data.sub_topic
            })
        
        await db.questions.insert_one(question_doc.copy())
        
        return {
            "success": True,
            "message": "Question added successfully",
            "question_id": question_doc["id"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding question: {str(e)}")
