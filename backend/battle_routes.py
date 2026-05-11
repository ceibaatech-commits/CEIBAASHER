"""
Battle Room REST API Routes - Refactored
HTTP endpoints for battle room management

KEY CHANGES:
- Added POST /join endpoint for instant join (no host approval)
- Added validation endpoint for checking room status
- Clear error messages for expired rooms
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from battle_rooms import room_manager
from datetime import datetime, timezone

router = APIRouter(prefix="/api/battle", tags=["battle"])


class CreateRoomRequest(BaseModel):
    """Request model for creating a battle room"""
    examId: Optional[str] = ""
    subject: Optional[str] = ""
    topic: Optional[str] = ""
    hostName: str
    customRoomId: Optional[str] = None
    questions: Optional[List[Dict[str, Any]]] = []
    maxParticipants: Optional[int] = 50
    timePerQuestion: Optional[int] = 30
    category: Optional[str] = ""


class JoinRoomRequest(BaseModel):
    """Request model for joining a battle room"""
    roomId: str
    playerName: str
    userId: Optional[str] = None
    avatar: Optional[str] = "👤"


class ValidateRoomRequest(BaseModel):
    """Request model for validating a room PIN"""
    roomId: str


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "activeRooms": len(room_manager.rooms),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/rooms")
async def get_active_rooms():
    """Get list of active battle rooms"""
    return {
        "rooms": room_manager.get_active_rooms(),
        "total": len(room_manager.rooms)
    }


def _build_host_data(host_name: str) -> dict:
    """Construct host participant payload for an HTTP-created room."""
    return {
        "userId": f"http-{host_name}-{datetime.now().timestamp()}",
        "username": host_name,
        "avatar": "👑",
        "isHost": True,
    }


def _build_room_config(request: 'CreateRoomRequest') -> dict:
    return {
        "maxParticipants": request.maxParticipants,
        "timePerQuestion": request.timePerQuestion,
        "category": request.category or request.subject or "",
        "subject": request.subject or "",
        "examId": request.examId or "",
    }


async def _reserve_custom_room_id(custom_room_id: str) -> str:
    """Validate and reserve a custom room id. Raises 400 if already taken & live."""
    existing = await room_manager.get_room(custom_room_id)
    if existing:
        if existing.is_expired():
            await room_manager.remove_room(custom_room_id)
        else:
            raise HTTPException(status_code=400, detail="Room ID already exists")
    return custom_room_id


async def _create_room_with_custom_id(room_id: str, host_data: dict, config: dict):
    """Build a BattleRoom with an explicit room_id and register it with the manager."""
    from battle_rooms import BattleRoom, Participant, RoomConfig
    host = Participant(
        user_id=host_data["userId"],
        username=host_data["username"],
        avatar=host_data["avatar"],
        is_host=True,
    )
    room_config = RoomConfig(
        max_participants=config["maxParticipants"],
        time_per_question=config["timePerQuestion"],
        category=config["category"],
        subject=config["subject"],
        exam_id=config["examId"],
    )
    room = BattleRoom(room_id, host, room_config)
    room_manager.rooms[room_id] = room
    room_manager.user_rooms[host.user_id] = room_id
    await room_manager.save_room_to_db(room)
    return room


@router.post("/create-room")
async def create_room_http(request: CreateRoomRequest):
    """Create a battle room via HTTP (24h TTL)."""
    try:
        host_data = _build_host_data(request.hostName)
        config = _build_room_config(request)

        if request.customRoomId:
            room_id = await _reserve_custom_room_id(request.customRoomId)
            room = await _create_room_with_custom_id(room_id, host_data, config)
        else:
            room = await room_manager.create_room(host_data, config)

        if request.questions:
            room.questions = request.questions
            await room_manager.save_room_to_db(room)

        return {
            "success": True,
            "roomId": room.room_id,
            "pin": room.room_id,
            "room": room.to_dict(),
            "expiresAt": room.expires_at,
            "timeRemaining": room.get_time_remaining(),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] create_room_http: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/join")
async def join_room_http(request: JoinRoomRequest):
    """
    Join a battle room via HTTP - NO HOST APPROVAL REQUIRED.
    
    Anyone with a valid room PIN can join instantly.
    Room must not be expired (24 hour limit from creation).
    """
    try:
        room_id = request.roomId.strip()
        
        # Validate room ID format
        if not room_id or len(room_id) != 6:
            raise HTTPException(
                status_code=400, 
                detail="Invalid room PIN. Must be 6 digits."
            )
        
        # Generate user ID if not provided
        user_id = request.userId or f"player-{request.playerName}-{datetime.now().timestamp()}"
        
        user_data = {
            "userId": user_id,
            "username": request.playerName,
            "avatar": request.avatar,
            "isHost": False
        }
        
        # Use the refactored join_room method (no approval needed)
        result = await room_manager.join_room(room_id, user_data)
        
        if result.get("success"):
            return {
                "success": True,
                "room": result["room"],
                "participant": result["participant"],
                "message": "Successfully joined room"
            }
        else:
            # Map error codes to HTTP status codes
            error_code = result.get("code", "UNKNOWN")
            status_map = {
                "ROOM_NOT_FOUND": 404,
                "ROOM_EXPIRED": 410,
                "ROOM_FULL": 403,
                "ROOM_CLOSED": 403,
                "BATTLE_COMPLETED": 410
            }
            status_code = status_map.get(error_code, 400)
            raise HTTPException(status_code=status_code, detail=result.get("error", "Failed to join room"))
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] join_room_http: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
async def validate_room(request: ValidateRoomRequest):
    """
    Validate a room PIN without joining.
    Returns room status, expiry info, and whether it's joinable.
    """
    try:
        room_id = request.roomId.strip()
        
        room = await room_manager.get_room(room_id)
        
        if not room:
            return {
                "valid": False,
                "error": "Room not found",
                "code": "ROOM_NOT_FOUND"
            }
        
        if room.is_expired():
            return {
                "valid": False,
                "error": "Room expired. Please create a new room.",
                "code": "ROOM_EXPIRED",
                "expiredAt": room.expires_at
            }
        
        if room.status == "completed":
            return {
                "valid": False,
                "error": "Battle already completed",
                "code": "BATTLE_COMPLETED"
            }
        
        return {
            "valid": True,
            "joinable": room.is_joinable(),
            "room": {
                "roomId": room.room_id,
                "host": room.host.username,
                "participantCount": len(room.participants),
                "maxParticipants": room.config.max_participants,
                "status": room.status,
                "category": room.config.category,
                "subject": room.config.subject,
                "timeRemaining": room.get_time_remaining(),
                "expiresAt": room.expires_at
            }
        }
        
    except Exception as e:
        print(f"[ERROR] validate_room: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/room/{room_id}")
async def get_room_details(room_id: str):
    """Get details of a specific room"""
    room = await room_manager.get_room(room_id)
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room.is_expired():
        raise HTTPException(
            status_code=410, 
            detail="Room expired. Please create a new room."
        )
    
    return {
        "success": True,
        "room": room.to_dict()
    }


@router.delete("/room/{room_id}")
async def delete_room(room_id: str):
    """Delete a room (cleanup)"""
    room = await room_manager.get_room(room_id)
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    await room_manager.remove_room(room_id)
    
    return {
        "success": True,
        "message": "Room deleted"
    }


@router.post("/cleanup-expired")
async def cleanup_expired_rooms():
    """Clean up expired rooms (24+ hours old)"""
    await room_manager.cleanup_expired_rooms()
    
    return {
        "success": True,
        "activeRooms": len(room_manager.rooms)
    }
