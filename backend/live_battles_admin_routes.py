"""
Live Battles Admin Routes
Handles admin monitoring of live battles, battle reports, and super admin features.
Includes real-time WebSocket updates and IP/session tracking for security.
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
from jose import jwt, JWTError
import os

router = APIRouter(prefix="/admin/battles", tags=["Admin Battles"])

# Global db instance
db = None

def init_db(database):
    global db
    db = database

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# ==================== DATABASE SCHEMA REFERENCE ====================
"""
Collection: live_battles
{
    "id": "battle_uuid",
    "room_id": "room_123456789_abc123",
    "type": "1v1" | "group",
    "status": "waiting" | "in_progress" | "completed" | "terminated",
    "players": [
        {
            "user_id": "user_uuid",
            "username": "player1",
            "socket_id": "sid_xxx",
            "ip_address": "192.168.x.xxx",  # Masked for privacy
            "joined_at": "2026-02-28T00:00:00Z",
            "score": 0,
            "is_host": true
        }
    ],
    "exam": "NDA",
    "subject": "Mathematics",
    "total_questions": 10,
    "duration_seconds": 0,
    "started_at": "2026-02-28T00:00:00Z",
    "ended_at": null,
    "winner_id": null,
    "is_demo": false,
    "created_at": "2026-02-28T00:00:00Z",
    "updated_at": "2026-02-28T00:00:00Z"
}

Collection: battle_reports
{
    "id": "report_uuid",
    "battle_id": "battle_uuid",
    "room_id": "room_xxx",
    "reported_by": {
        "user_id": "reporter_uuid",
        "username": "reporter_name"
    },
    "reported_user": {
        "user_id": "offender_uuid",
        "username": "offender_name"
    },
    "reason": "offensive_content" | "harassment" | "cheating" | "inappropriate_behavior" | "other",
    "description": "User was using offensive language...",
    "evidence": {
        "chat_messages": [...],
        "screenshots": [...]
    },
    "status": "pending" | "reviewed" | "action_taken" | "dismissed",
    "admin_notes": "",
    "reviewed_by": null,
    "reviewed_at": null,
    "action_taken": null,
    "created_at": "2026-02-28T00:00:00Z"
}

Collection: users (add field)
{
    ...existing fields,
    "role": "user" | "admin" | "super_admin",
    "is_super_admin": false
}
"""

# ==================== MODELS ====================

class BattleReportCreate(BaseModel):
    battle_id: str
    room_id: str
    reported_user_id: str
    reported_username: str
    reason: str  # offensive_content, harassment, cheating, inappropriate_behavior, other
    description: Optional[str] = ""
    chat_messages: Optional[List[Dict]] = []

class BattleReportReview(BaseModel):
    status: str  # reviewed, action_taken, dismissed
    admin_notes: Optional[str] = ""
    action_taken: Optional[str] = None  # warning, temp_ban, permanent_ban, none

class BattleSession(BaseModel):
    room_id: str
    player_data: Dict[str, Any]
    final_score: int
    duration_seconds: int
    outcome: str  # win, loss, draw, incomplete

# ==================== HELPER FUNCTIONS ====================

def mask_ip_address(ip: str) -> str:
    """Mask IP address for privacy (GDPR compliance)"""
    if not ip:
        return "unknown"
    parts = ip.split('.')
    if len(parts) == 4:
        return f"{parts[0]}.{parts[1]}.xxx.xxx"
    return ip[:len(ip)//2] + "xxx"

async def verify_super_admin(authorization: Optional[str] = Header(None)) -> dict:
    """Verify user is an Admin or Super Admin"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user_id = None
        
        # Try admin_sessions first (from admin login)
        admin_session = await db.admin_sessions.find_one({"token": token})
        if admin_session:
            user_id = admin_session.get("user_id")
        
        # Try user_sessions
        if not user_id:
            session = await db.user_sessions.find_one({"session_token": token})
            if session:
                user_id = session.get("user_id")
        
        # Try JWT decode
        if not user_id:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if user is admin or super admin
        user = await db.users.find_one({
            "$or": [{"id": user_id}, {"user_id": user_id}, {"email": user_id}]
        })
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Allow both admin and super_admin roles
        is_admin = user.get("is_admin", False) or user.get("role") in ["admin", "super_admin"] or user.get("is_super_admin", False)
        
        if not is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        return user
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def extract_client_ip(request: Request) -> str:
    """
    Extract client IP address from request.
    Handles proxies, load balancers, and Kubernetes ingress.
    """
    # Check X-Forwarded-For header (standard for proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP (original client)
        return forwarded_for.split(",")[0].strip()
    
    # Check X-Real-IP header (nginx)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Check CF-Connecting-IP (Cloudflare)
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip
    
    # Fallback to direct client
    if request.client:
        return request.client.host
    
    return "unknown"

# ==================== LIVE BATTLES ENDPOINTS ====================

@router.get("/live")
async def get_live_battles(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Get all currently active battles (real-time).
    Admin only.
    """
    await verify_super_admin(authorization)
    
    try:
        # Get battles that are in progress or waiting from database
        battles = await db.live_battles.find(
            {"status": {"$in": ["waiting", "in_progress"]}},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        active_matches = []
        waiting_count = 0
        
        # Try to get from matchmaking active battles (in-memory)
        try:
            from matchmaking import matchmaking_manager
            
            for room_id, battle in matchmaking_manager.active_battles.items():
                active_matches.append({
                    "id": room_id,
                    "room_id": room_id,
                    "type": "1v1",
                    "status": "in_progress",
                    "players": [
                        {
                            "user_id": battle.player1.get("socketId"),
                            "username": battle.player1.get("playerName"),
                            "score": battle.player1.get("score", 0)
                        },
                        {
                            "user_id": battle.player2.get("socketId"),
                            "username": battle.player2.get("playerName"),
                            "score": battle.player2.get("score", 0)
                        }
                    ],
                    "exam": battle.exam,
                    "subject": battle.subject,
                    "created_at": datetime.fromtimestamp(battle.created_at, tz=timezone.utc).isoformat()
                })
            
            # Get waiting players
            waiting_count = matchmaking_manager.get_total_searching()
        except Exception as e:
            print(f"[LIVE_BATTLES] Could not get matchmaking data: {e}")
        
        return {
            "success": True,
            "live_battles": battles + active_matches,
            "waiting_players": waiting_count,
            "total_active": len(battles) + len(active_matches),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_battle_history(
    authorization: Optional[str] = Header(None),
    page: int = 1,
    limit: int = 50,
    status: Optional[str] = None,
    is_demo: Optional[bool] = None,
    has_reports: Optional[bool] = None
):
    """
    Get historical battle data with filters.
    Super Admin only.
    """
    await verify_super_admin(authorization)
    
    try:
        # Build filter
        query = {}
        if status:
            query["status"] = status
        if is_demo is not None:
            query["is_demo"] = is_demo
        
        # If filtering by reports
        if has_reports:
            reported_battle_ids = await db.battle_reports.distinct("battle_id")
            query["id"] = {"$in": reported_battle_ids}
        
        skip = (page - 1) * limit
        
        battles = await db.live_battles.find(query, {"_id": 0}) \
            .sort("created_at", -1) \
            .skip(skip) \
            .limit(limit) \
            .to_list(limit)
        
        total = await db.live_battles.count_documents(query)
        
        return {
            "success": True,
            "battles": battles,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/detail/{battle_id}")
async def get_battle_details(
    battle_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Get detailed information about a specific battle.
    Super Admin only.
    """
    await verify_super_admin(authorization)
    
    try:
        battle = await db.live_battles.find_one({"id": battle_id}, {"_id": 0})
        
        if not battle:
            # Try room_id
            battle = await db.live_battles.find_one({"room_id": battle_id}, {"_id": 0})
        
        if not battle:
            raise HTTPException(status_code=404, detail="Battle not found")
        
        # Get associated reports
        reports = await db.battle_reports.find(
            {"battle_id": battle_id},
            {"_id": 0}
        ).to_list(50)
        
        battle["reports"] = reports
        battle["report_count"] = len(reports)
        
        return {
            "success": True,
            "battle": battle
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detail/{battle_id}/terminate")
async def terminate_battle(
    battle_id: str,
    authorization: Optional[str] = Header(None),
    reason: Optional[str] = "Admin terminated"
):
    """
    Force terminate an active battle.
    Super Admin only.
    """
    admin = await verify_super_admin(authorization)
    
    try:
        # Update in database
        await db.live_battles.update_one(
            {"$or": [{"id": battle_id}, {"room_id": battle_id}]},
            {
                "$set": {
                    "status": "terminated",
                    "ended_at": datetime.now(timezone.utc).isoformat(),
                    "termination_reason": reason,
                    "terminated_by": admin.get("id") or admin.get("user_id"),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Also remove from matchmaking if present
        from matchmaking import matchmaking_manager
        if battle_id in matchmaking_manager.active_battles:
            matchmaking_manager.remove_battle(battle_id)
        
        # Emit WebSocket event to notify players
        # This will be handled by the socket event system
        
        return {
            "success": True,
            "message": f"Battle {battle_id} terminated",
            "reason": reason
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== BATTLE SESSION TRACKING ====================

@router.post("/session/complete")
async def record_battle_completion(
    request: Request,
    session_data: BattleSession,
    authorization: Optional[str] = Header(None)
):
    """
    Record battle completion with IP and session data.
    Called when a user finishes a battle.
    
    Captures:
    - Client IP address (masked for privacy)
    - Battle duration
    - Final outcome
    """
    try:
        # Extract client IP
        client_ip = extract_client_ip(request)
        masked_ip = mask_ip_address(client_ip)
        
        # Get user from token
        user_id = None
        if authorization:
            token = authorization.replace("Bearer ", "")
            try:
                admin_session = await db.admin_sessions.find_one({"token": token})
                if admin_session:
                    user_id = admin_session.get("user_id")
                if not user_id:
                    session = await db.user_sessions.find_one({"session_token": token})
                    user_id = session.get("user_id") if session else None
                if not user_id:
                    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                    user_id = payload.get("sub")
            except Exception:
                pass
        
        # Update or create battle record
        battle_update = {
            "$set": {
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {
                "player_sessions": {
                    "user_id": user_id or session_data.player_data.get("userId"),
                    "username": session_data.player_data.get("playerName"),
                    "ip_address": masked_ip,
                    "final_score": session_data.final_score,
                    "duration_seconds": session_data.duration_seconds,
                    "outcome": session_data.outcome,
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }
            }
        }
        
        await db.live_battles.update_one(
            {"room_id": session_data.room_id},
            battle_update,
            upsert=True
        )
        
        # Log for security audit (separate collection)
        await db.battle_session_logs.insert_one({
            "id": str(uuid.uuid4()),
            "room_id": session_data.room_id,
            "user_id": user_id,
            "ip_address_masked": masked_ip,
            "ip_address_hash": hash(client_ip),  # For duplicate detection without storing raw IP
            "duration_seconds": session_data.duration_seconds,
            "outcome": session_data.outcome,
            "user_agent": request.headers.get("User-Agent", "unknown"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "message": "Battle session recorded",
            "room_id": session_data.room_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== BATTLE REPORTS ====================

@router.post("/report")
async def create_battle_report(
    request: Request,
    report: BattleReportCreate,
    authorization: Optional[str] = Header(None)
):
    """
    Report a battle for offensive content or inappropriate behavior.
    Any authenticated user can report.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Get reporter info
        token = authorization.replace("Bearer ", "")
        reporter_id = None
        reporter_name = "Anonymous"
        
        admin_session = await db.admin_sessions.find_one({"token": token})
        if admin_session:
            reporter_id = admin_session.get("user_id")
        
        if not reporter_id:
            session = await db.user_sessions.find_one({"session_token": token})
            if session:
                reporter_id = session.get("user_id")
        
        if not reporter_id:
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                reporter_id = payload.get("sub")
            except Exception:
                pass
        
        if reporter_id:
            user = await db.users.find_one({"$or": [{"id": reporter_id}, {"user_id": reporter_id}]})
            if user:
                reporter_name = user.get("name") or user.get("username", "Anonymous")
        
        # Validate reason
        valid_reasons = ["offensive_content", "harassment", "cheating", "inappropriate_behavior", "other"]
        if report.reason not in valid_reasons:
            raise HTTPException(status_code=400, detail=f"Invalid reason. Must be one of: {valid_reasons}")
        
        report_doc = {
            "id": str(uuid.uuid4()),
            "battle_id": report.battle_id,
            "room_id": report.room_id,
            "reported_by": {
                "user_id": reporter_id,
                "username": reporter_name
            },
            "reported_user": {
                "user_id": report.reported_user_id,
                "username": report.reported_username
            },
            "reason": report.reason,
            "description": report.description,
            "evidence": {
                "chat_messages": report.chat_messages or []
            },
            "status": "pending",
            "admin_notes": "",
            "reviewed_by": None,
            "reviewed_at": None,
            "action_taken": None,
            "reporter_ip": mask_ip_address(extract_client_ip(request)),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.battle_reports.insert_one(report_doc.copy())
        
        # Update battle to flag it has reports
        await db.live_battles.update_one(
            {"$or": [{"id": report.battle_id}, {"room_id": report.room_id}]},
            {
                "$set": {"has_reports": True, "updated_at": datetime.now(timezone.utc).isoformat()},
                "$inc": {"report_count": 1}
            }
        )
        
        # Notify admins in real-time
        try:
            from battle_socketio import notify_admins_new_report
            import asyncio
            asyncio.create_task(notify_admins_new_report(report_doc))
        except Exception as notify_err:
            print(f"[REPORT] Failed to notify admins: {notify_err}")
        
        return {
            "success": True,
            "message": "Report submitted successfully",
            "report_id": report_doc["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports")
async def get_battle_reports(
    authorization: Optional[str] = Header(None),
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    """
    Get all battle reports.
    Super Admin only.
    """
    await verify_super_admin(authorization)
    
    try:
        query = {}
        if status:
            query["status"] = status
        
        skip = (page - 1) * limit
        
        reports = await db.battle_reports.find(query, {"_id": 0}) \
            .sort("created_at", -1) \
            .skip(skip) \
            .limit(limit) \
            .to_list(limit)
        
        total = await db.battle_reports.count_documents(query)
        pending = await db.battle_reports.count_documents({"status": "pending"})
        
        return {
            "success": True,
            "reports": reports,
            "pending_count": pending,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/{report_id}")
async def get_report_details(
    report_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Get detailed report information.
    Super Admin only.
    """
    await verify_super_admin(authorization)
    
    try:
        report = await db.battle_reports.find_one({"id": report_id}, {"_id": 0})
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Get battle info
        battle = await db.live_battles.find_one(
            {"$or": [{"id": report["battle_id"]}, {"room_id": report["room_id"]}]},
            {"_id": 0}
        )
        
        # Get reported user info
        reported_user = await db.users.find_one(
            {"$or": [{"id": report["reported_user"]["user_id"]}, {"user_id": report["reported_user"]["user_id"]}]},
            {"_id": 0, "password": 0, "token": 0}
        )
        
        # Get previous reports against this user
        previous_reports = await db.battle_reports.count_documents({
            "reported_user.user_id": report["reported_user"]["user_id"],
            "id": {"$ne": report_id}
        })
        
        return {
            "success": True,
            "report": report,
            "battle": battle,
            "reported_user": reported_user,
            "previous_reports_count": previous_reports
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/reports/{report_id}/review")
async def review_battle_report(
    report_id: str,
    review: BattleReportReview,
    authorization: Optional[str] = Header(None)
):
    """
    Review and take action on a battle report.
    Super Admin only.
    """
    admin = await verify_super_admin(authorization)
    
    try:
        valid_statuses = ["reviewed", "action_taken", "dismissed"]
        if review.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        valid_actions = ["warning", "temp_ban", "permanent_ban", "none", None]
        if review.action_taken not in valid_actions:
            raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")
        
        # Update report
        result = await db.battle_reports.update_one(
            {"id": report_id},
            {
                "$set": {
                    "status": review.status,
                    "admin_notes": review.admin_notes,
                    "action_taken": review.action_taken,
                    "reviewed_by": admin.get("id") or admin.get("user_id"),
                    "reviewed_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # If action taken, update the reported user
        if review.action_taken and review.action_taken != "none":
            report = await db.battle_reports.find_one({"id": report_id})
            if report:
                reported_user_id = report["reported_user"]["user_id"]
                
                user_update = {
                    "last_action_taken": review.action_taken,
                    "action_taken_at": datetime.now(timezone.utc).isoformat(),
                    "action_taken_by": admin.get("id") or admin.get("user_id")
                }
                
                if review.action_taken == "permanent_ban":
                    user_update["is_disabled"] = True
                    user_update["account_status"] = "banned"
                elif review.action_taken == "temp_ban":
                    user_update["is_disabled"] = True
                    user_update["account_status"] = "suspended"
                    user_update["suspension_until"] = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
                
                await db.users.update_one(
                    {"$or": [{"id": reported_user_id}, {"user_id": reported_user_id}]},
                    {"$set": user_update}
                )
        
        return {
            "success": True,
            "message": "Report reviewed successfully",
            "report_id": report_id,
            "action_taken": review.action_taken
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DEMO BATTLES ====================

@router.get("/demo")
async def get_demo_battles(
    authorization: Optional[str] = Header(None),
    page: int = 1,
    limit: int = 50
):
    """
    Get demo/test battles.
    Super Admin only.
    """
    await verify_super_admin(authorization)
    
    try:
        skip = (page - 1) * limit
        
        battles = await db.live_battles.find(
            {"is_demo": True},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.live_battles.count_documents({"is_demo": True})
        
        return {
            "success": True,
            "battles": battles,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SUPER ADMIN MANAGEMENT ====================

@router.post("/super-admin/grant")
async def grant_super_admin(
    user_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Grant Super Admin privileges to a user.
    Existing Super Admin only.
    """
    admin = await verify_super_admin(authorization)
    
    try:
        result = await db.users.update_one(
            {"$or": [{"id": user_id}, {"user_id": user_id}]},
            {
                "$set": {
                    "is_super_admin": True,
                    "role": "super_admin",
                    "super_admin_granted_by": admin.get("id") or admin.get("user_id"),
                    "super_admin_granted_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": f"Super Admin privileges granted to user {user_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/super-admin/revoke")
async def revoke_super_admin(
    user_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Revoke Super Admin privileges from a user.
    Existing Super Admin only.
    """
    admin = await verify_super_admin(authorization)
    
    # Prevent self-revoke
    admin_id = admin.get("id") or admin.get("user_id")
    if user_id == admin_id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own Super Admin privileges")
    
    try:
        result = await db.users.update_one(
            {"$or": [{"id": user_id}, {"user_id": user_id}]},
            {
                "$set": {
                    "is_super_admin": False,
                    "role": "admin",  # Downgrade to regular admin
                    "super_admin_revoked_by": admin_id,
                    "super_admin_revoked_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": f"Super Admin privileges revoked from user {user_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== STATISTICS ====================

@router.get("/stats")
async def get_battle_stats(
    authorization: Optional[str] = Header(None)
):
    """
    Get battle statistics overview.
    Super Admin only.
    """
    await verify_super_admin(authorization)
    
    try:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        
        # Total battles
        total_battles = await db.live_battles.count_documents({})
        
        # Active battles
        active_battles = await db.live_battles.count_documents({
            "status": {"$in": ["waiting", "in_progress"]}
        })
        
        # Battles today
        battles_today = await db.live_battles.count_documents({
            "created_at": {"$gte": today_start.isoformat()}
        })
        
        # Battles this week
        battles_week = await db.live_battles.count_documents({
            "created_at": {"$gte": week_start.isoformat()}
        })
        
        # Pending reports
        pending_reports = await db.battle_reports.count_documents({"status": "pending"})
        
        # Total reports
        total_reports = await db.battle_reports.count_documents({})
        
        # Most reported users
        pipeline = [
            {"$group": {"_id": "$reported_user.user_id", "count": {"$sum": 1}, "username": {"$first": "$reported_user.username"}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        most_reported = await db.battle_reports.aggregate(pipeline).to_list(5)
        
        return {
            "success": True,
            "stats": {
                "total_battles": total_battles,
                "active_battles": active_battles,
                "battles_today": battles_today,
                "battles_this_week": battles_week,
                "pending_reports": pending_reports,
                "total_reports": total_reports,
                "most_reported_users": most_reported
            },
            "timestamp": now.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
