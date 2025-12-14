"""
Asynchronous Battle Room Routes - REST API
No Socket.IO required - Players take quiz locally and submit results

Flow:
1. Host creates room → gets PIN
2. Players join with PIN → download quiz data
3. Players complete quiz locally (client-side timing)
4. Players submit answers → stored in DB
5. Leaderboard/messages update via polling

Room Lifecycle:
- Active for 24 hours from creation
- Host can manually delete anytime
- One attempt per player
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import random
from database import get_database

router = APIRouter(prefix="/api/battle/async", tags=["Async Battle Rooms"])

# Room expires after 24 hours
ROOM_EXPIRY_HOURS = 24


# ==================== REQUEST/RESPONSE MODELS ====================

class CreateRoomRequest(BaseModel):
    host_id: str
    host_name: str
    exam_category: Optional[str] = ""
    subject: Optional[str] = ""
    questions: List[Dict[str, Any]]
    time_per_question: int = 30
    max_participants: int = 150


class JoinRoomRequest(BaseModel):
    player_id: str
    player_name: str
    avatar: Optional[str] = "👤"


class SubmitAnswersRequest(BaseModel):
    player_id: str
    player_name: str
    answers: List[Dict[str, Any]]  # [{question_id, selected_answer, is_correct, time_spent, points}]
    total_score: int
    total_time: int
    completed_at: str


class SendMessageRequest(BaseModel):
    player_id: str
    player_name: str
    message: str
    avatar: Optional[str] = "👤"


# ==================== UTILITY FUNCTIONS ====================

def generate_room_pin() -> str:
    """Generate 6-digit room PIN"""
    return str(random.randint(100000, 999999))


async def get_room_from_db(db, pin: str) -> Optional[Dict]:
    """Get room from database"""
    room = await db.async_battle_rooms.find_one({"pin": pin}, {"_id": 0})
    return room


async def check_room_expired(room: Dict) -> bool:
    """Check if room is expired (24 hours)"""
    if not room:
        return True
    
    created_at = datetime.fromisoformat(room["created_at"])
    now = datetime.now(timezone.utc)
    expiry_time = created_at + timedelta(hours=ROOM_EXPIRY_HOURS)
    
    return now > expiry_time


async def has_player_submitted(db, pin: str, player_id: str) -> bool:
    """Check if player already submitted answers"""
    submission = await db.async_battle_submissions.find_one({
        "pin": pin,
        "player_id": player_id
    })
    return submission is not None


# ==================== ROOM MANAGEMENT ====================

@router.post("/rooms/create")
async def create_async_room(request: CreateRoomRequest, db=Depends(get_database)):
    """
    Create asynchronous quiz room
    Host creates room with questions, gets PIN to share
    """
    try:
        # Generate unique PIN
        pin = generate_room_pin()
        
        # Check if PIN already exists (very rare)
        existing = await db.async_battle_rooms.find_one({"pin": pin})
        while existing:
            pin = generate_room_pin()
            existing = await db.async_battle_rooms.find_one({"pin": pin})
        
        # Create room document
        room = {
            "pin": pin,
            "host_id": request.host_id,
            "host_name": request.host_name,
            "exam_category": request.exam_category,
            "subject": request.subject,
            "questions": request.questions,
            "time_per_question": request.time_per_question,
            "max_participants": request.max_participants,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=ROOM_EXPIRY_HOURS)).isoformat(),
            "is_active": True,
            "participant_count": 0,
            "submission_count": 0
        }
        
        await db.async_battle_rooms.insert_one(room)
        
        print(f"[ASYNC ROOM] Created room {pin} by {request.host_name}")
        
        return {
            "success": True,
            "pin": pin,
            "room": room,
            "message": "Room created successfully"
        }
        
    except Exception as e:
        print(f"[ERROR] create_async_room: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rooms/{pin}/join")
async def join_async_room(pin: str, request: JoinRoomRequest, db=Depends(get_database)):
    """
    Join room and download quiz data
    Returns: Full quiz questions, room config, existing leaderboard, chat history
    """
    try:
        # Get room
        room = await get_room_from_db(db, pin)
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Check if expired
        if await check_room_expired(room):
            raise HTTPException(status_code=410, detail="Room expired")
        
        if not room.get("is_active"):
            raise HTTPException(status_code=403, detail="Room is no longer active")
        
        # Check if player already submitted
        if await has_player_submitted(db, pin, request.player_id):
            raise HTTPException(status_code=409, detail="You have already submitted answers for this room")
        
        # Check room capacity
        if room.get("participant_count", 0) >= room.get("max_participants", 150):
            raise HTTPException(status_code=403, detail="Room is full")
        
        # Increment participant count
        await db.async_battle_rooms.update_one(
            {"pin": pin},
            {"$inc": {"participant_count": 1}}
        )
        
        # Get leaderboard
        submissions = await db.async_battle_submissions.find(
            {"pin": pin},
            {"_id": 0}
        ).sort("total_score", -1).to_list(100)
        
        # Get chat messages
        messages = await db.async_battle_messages.find(
            {"pin": pin},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(500)
        
        print(f"[ASYNC ROOM] Player {request.player_name} joined room {pin}")
        
        return {
            "success": True,
            "room": {
                "pin": pin,
                "host_name": room["host_name"],
                "exam_category": room.get("exam_category", ""),
                "subject": room.get("subject", ""),
                "questions": room["questions"],
                "time_per_question": room.get("time_per_question", 30),
                "max_participants": room.get("max_participants", 50),
                "participant_count": room.get("participant_count", 0),
                "created_at": room["created_at"],
                "expires_at": room["expires_at"]
            },
            "leaderboard": submissions,
            "messages": messages,
            "message": "Joined room successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] join_async_room: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/rooms/{pin}")
async def delete_room(pin: str, host_id: str, db=Depends(get_database)):
    """
    Delete room (host only)
    Also deletes all submissions and messages
    """
    try:
        # Get room
        room = await get_room_from_db(db, pin)
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Verify host
        if room["host_id"] != host_id:
            raise HTTPException(status_code=403, detail="Only host can delete room")
        
        # Delete room and related data
        await db.async_battle_rooms.delete_one({"pin": pin})
        await db.async_battle_submissions.delete_many({"pin": pin})
        await db.async_battle_messages.delete_many({"pin": pin})
        
        print(f"[ASYNC ROOM] Deleted room {pin}")
        
        return {
            "success": True,
            "message": "Room deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] delete_room: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== QUIZ SUBMISSION ====================

@router.post("/rooms/{pin}/submit")
async def submit_answers(pin: str, request: SubmitAnswersRequest, db=Depends(get_database)):
    """
    Submit quiz answers (one-time only per player)
    Calculates score and updates leaderboard
    """
    try:
        # Get room
        room = await get_room_from_db(db, pin)
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Check if expired
        if await check_room_expired(room):
            raise HTTPException(status_code=410, detail="Room expired")
        
        # Check if already submitted
        if await has_player_submitted(db, pin, request.player_id):
            raise HTTPException(status_code=409, detail="You have already submitted answers")
        
        # Create submission
        submission = {
            "pin": pin,
            "player_id": request.player_id,
            "player_name": request.player_name,
            "answers": request.answers,
            "total_score": request.total_score,
            "total_time": request.total_time,
            "completed_at": request.completed_at,
            "submitted_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.async_battle_submissions.insert_one(submission)
        
        # Increment submission count
        await db.async_battle_rooms.update_one(
            {"pin": pin},
            {"$inc": {"submission_count": 1}}
        )
        
        # Get updated leaderboard
        submissions = await db.async_battle_submissions.find(
            {"pin": pin},
            {"_id": 0}
        ).sort("total_score", -1).to_list(100)
        
        # Calculate rank
        rank = next((i + 1 for i, s in enumerate(submissions) if s["player_id"] == request.player_id), 0)
        
        print(f"[ASYNC ROOM] Player {request.player_name} submitted answers for room {pin} - Score: {request.total_score}")
        
        return {
            "success": True,
            "submission": submission,
            "rank": rank,
            "leaderboard": submissions,
            "message": "Answers submitted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] submit_answers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== LEADERBOARD (POLLING) ====================

@router.get("/rooms/{pin}/leaderboard")
async def get_leaderboard(pin: str, db=Depends(get_database)):
    """
    Get live leaderboard
    Frontend polls this every 5 seconds during quiz
    """
    try:
        # Get room
        room = await get_room_from_db(db, pin)
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Get all submissions sorted by score
        submissions = await db.async_battle_submissions.find(
            {"pin": pin},
            {"_id": 0, "player_id": 1, "player_name": 1, "total_score": 1, "total_time": 1, "completed_at": 1}
        ).sort([("total_score", -1), ("total_time", 1)]).to_list(100)
        
        # Add ranks
        for i, submission in enumerate(submissions):
            submission["rank"] = i + 1
        
        return {
            "success": True,
            "leaderboard": submissions,
            "total_submissions": len(submissions),
            "room_info": {
                "participant_count": room.get("participant_count", 0),
                "submission_count": room.get("submission_count", 0)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] get_leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MESSAGES (POLLING) ====================

@router.get("/rooms/{pin}/messages")
async def get_messages(pin: str, since: Optional[str] = None, db=Depends(get_database)):
    """
    Get chat messages
    Frontend polls this every 5 seconds
    
    Args:
        since: ISO timestamp - only return messages after this time
    """
    try:
        # Get room
        room = await get_room_from_db(db, pin)
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Build query
        query = {"pin": pin}
        if since:
            query["timestamp"] = {"$gt": since}
        
        # Get messages
        messages = await db.async_battle_messages.find(
            query,
            {"_id": 0}
        ).sort("timestamp", 1).to_list(500)
        
        return {
            "success": True,
            "messages": messages,
            "count": len(messages)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] get_messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rooms/{pin}/messages")
async def send_message(pin: str, request: SendMessageRequest, db=Depends(get_database)):
    """
    Send chat message
    Stored in DB, visible to all current and future participants
    """
    try:
        # Get room
        room = await get_room_from_db(db, pin)
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Create message
        message = {
            "pin": pin,
            "player_id": request.player_id,
            "player_name": request.player_name,
            "avatar": request.avatar,
            "message": request.message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await db.async_battle_messages.insert_one(message)
        
        return {
            "success": True,
            "message": message
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] send_message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ROOM INFO ====================

@router.get("/rooms/{pin}")
async def get_room_info(pin: str, db=Depends(get_database)):
    """
    Get room information (without questions)
    Useful for checking if room exists and is active
    """
    try:
        room = await get_room_from_db(db, pin)
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Check if expired
        is_expired = await check_room_expired(room)
        
        return {
            "success": True,
            "room": {
                "pin": pin,
                "host_name": room["host_name"],
                "exam_category": room.get("exam_category", ""),
                "subject": room.get("subject", ""),
                "time_per_question": room.get("time_per_question", 30),
                "max_participants": room.get("max_participants", 150),
                "participant_count": room.get("participant_count", 0),
                "submission_count": room.get("submission_count", 0),
                "question_count": len(room.get("questions", [])),
                "created_at": room["created_at"],
                "expires_at": room["expires_at"],
                "is_active": room.get("is_active", True) and not is_expired,
                "is_expired": is_expired
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] get_room_info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
