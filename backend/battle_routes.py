"""
Battle Room REST API Routes
HTTP endpoints for battle room management
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from battle_rooms import room_manager

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


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "activeRooms": len(room_manager.rooms),
        "timestamp": "now"
    }


@router.get("/rooms")
async def get_active_rooms():
    """Get list of active battle rooms"""
    return {
        "rooms": room_manager.get_active_rooms(),
        "total": len(room_manager.rooms)
    }


@router.post("/create-room")
async def create_room_http(request: CreateRoomRequest):
    """
    Create a battle room via HTTP (for backward compatibility)
    This creates a room that can be joined via Socket.IO
    """
    try:
        # Create host data
        host_data = {
            "userId": f"http-{request.hostName}",  # Temporary ID until Socket.IO connection
            "username": request.hostName,
            "avatar": "👑",
            "isHost": True
        }
        
        # Create room config
        config = {
            "maxParticipants": request.maxParticipants,
            "timePerQuestion": request.timePerQuestion,
            "category": request.category or request.subject or "",
            "subject": request.subject or "",
            "examId": request.examId or ""
        }
        
        # Use custom room ID if provided
        if request.customRoomId:
            # Check if room already exists
            if room_manager.get_room(request.customRoomId):
                raise HTTPException(status_code=400, detail="Room ID already exists")
            room_id = request.customRoomId
        else:
            room_id = None
        
        # Create room
        if room_id:
            # Manual room creation with custom ID
            from battle_rooms import BattleRoom, Participant, RoomConfig
            
            host = Participant(
                user_id=host_data["userId"],
                username=host_data["username"],
                avatar=host_data["avatar"],
                is_host=True
            )
            
            room_config = RoomConfig(
                max_participants=config["maxParticipants"],
                time_per_question=config["timePerQuestion"],
                category=config["category"],
                subject=config["subject"],
                exam_id=config["examId"]
            )
            
            room = BattleRoom(room_id, host, room_config)
            room_manager.rooms[room_id] = room
            room_manager.user_rooms[host.user_id] = room_id
            # Save to database
            await room_manager.save_room_to_db(room)
        else:
            room = await room_manager.create_room(host_data, config)
        
        # Set questions if provided
        if request.questions:
            room.questions = request.questions
        
        return {
            "success": True,
            "roomId": room.room_id,
            "pin": room.room_id,
            "room": room.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] create_room_http: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/room/{room_id}")
async def get_room_details(room_id: str):
    """Get details of a specific room"""
    room = room_manager.get_room(room_id)
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room.is_expired():
        room_manager.remove_room(room_id)
        raise HTTPException(status_code=410, detail="Room expired")
    
    return {
        "success": True,
        "room": room.to_dict()
    }


@router.delete("/room/{room_id}")
async def delete_room(room_id: str):
    """Delete a room (cleanup)"""
    room = room_manager.get_room(room_id)
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room_manager.remove_room(room_id)
    
    return {
        "success": True,
        "message": "Room deleted"
    }


@router.post("/cleanup-expired")
async def cleanup_expired_rooms():
    """Clean up expired rooms (24+ hours old)"""
    room_manager.cleanup_expired_rooms()
    
    return {
        "success": True,
        "activeRooms": len(room_manager.rooms)
    }
