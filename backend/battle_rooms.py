"""
Battle Room Management
Handles quiz battle room state, participants, scoring, and lifecycle
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import random


@dataclass
class Participant:
    """Represents a participant in a battle room"""
    user_id: str
    username: str
    avatar: str = "👤"
    is_host: bool = False
    joined_at: float = field(default_factory=lambda: datetime.now(timezone.utc).timestamp())


@dataclass
class RoomConfig:
    """Configuration for a battle room"""
    max_participants: int = 50
    time_per_question: int = 30
    category: str = ""
    subject: str = ""
    exam_id: str = ""


class BattleRoom:
    """
    Manages a single battle room with participants, questions, and scoring
    """
    
    def __init__(self, room_id: str, host: Participant, config: Optional[RoomConfig] = None):
        self.room_id = room_id
        self.host = host
        self.participants: List[Participant] = [host]
        self.config = config or RoomConfig()
        self.status = "waiting"  # waiting, starting, active, completed
        self.current_question = 0
        self.questions: List[Dict[str, Any]] = []
        self.scores: Dict[str, int] = {host.user_id: 0}
        self.answers: Dict[str, Dict] = {}  # {user_id: {question_id: {answer, time_spent}}}
        self.created_at = datetime.now(timezone.utc).timestamp()
    
    def add_participant(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a participant to the room"""
        # Check if already in room
        if any(p.user_id == user_id for p in self.participants):
            return {"success": True, "message": "Already in room"}
        
        # Check max participants
        if len(self.participants) >= self.config.max_participants:
            return {"success": False, "error": "Room is full"}
        
        # Add participant
        participant = Participant(
            user_id=user_id,
            username=user_data.get("username", "Anonymous"),
            avatar=user_data.get("avatar", "👤"),
            is_host=user_data.get("isHost", False)
        )
        
        self.participants.append(participant)
        self.scores[user_id] = 0
        self.answers[user_id] = {}
        
        return {"success": True, "participant": participant}
    
    def remove_participant(self, user_id: str) -> bool:
        """Remove a participant from the room"""
        self.participants = [p for p in self.participants if p.user_id != user_id]
        self.scores.pop(user_id, None)
        self.answers.pop(user_id, None)
        return True
    
    def update_score(self, user_id: str, points: int) -> int:
        """Update a participant's score"""
        if user_id not in self.scores:
            self.scores[user_id] = 0
        self.scores[user_id] += points
        return self.scores[user_id]
    
    def submit_answer(self, user_id: str, question_id: str, answer_id: str, time_spent: float):
        """Record an answer submission"""
        if user_id not in self.answers:
            self.answers[user_id] = {}
        
        self.answers[user_id][question_id] = {
            "answer_id": answer_id,
            "time_spent": time_spent,
            "timestamp": datetime.now(timezone.utc).timestamp()
        }
    
    def get_leaderboard(self) -> List[Dict[str, Any]]:
        """Get sorted leaderboard"""
        leaderboard = []
        for participant in self.participants:
            leaderboard.append({
                "userId": participant.user_id,
                "username": participant.username,
                "avatar": participant.avatar,
                "score": self.scores.get(participant.user_id, 0),
                "answersCount": len(self.answers.get(participant.user_id, {}))
            })
        
        # Sort by score descending
        leaderboard.sort(key=lambda x: x["score"], reverse=True)
        
        # Add rank
        for i, entry in enumerate(leaderboard):
            entry["rank"] = i + 1
        
        return leaderboard
    
    def is_expired(self) -> bool:
        """Check if room has expired (24 hours old)"""
        age = datetime.now(timezone.utc).timestamp() - self.created_at
        return age > 24 * 60 * 60  # 24 hours in seconds
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert room to dictionary for serialization"""
        return {
            "roomId": self.room_id,
            "host": {
                "userId": self.host.user_id,
                "username": self.host.username,
                "avatar": self.host.avatar,
                "isHost": self.host.is_host
            },
            "participants": [
                {
                    "userId": p.user_id,
                    "username": p.username,
                    "avatar": p.avatar,
                    "isHost": p.is_host
                }
                for p in self.participants
            ],
            "status": self.status,
            "currentQuestion": self.current_question,
            "config": {
                "maxParticipants": self.config.max_participants,
                "timePerQuestion": self.config.time_per_question,
                "category": self.config.category,
                "subject": self.config.subject,
                "examId": self.config.exam_id
            },
            "participantCount": len(self.participants),
            "leaderboard": self.get_leaderboard(),
            "createdAt": self.created_at
        }


class BattleRoomManager:
    """
    Manages all battle rooms in memory
    """
    
    def __init__(self):
        self.rooms: Dict[str, BattleRoom] = {}
        self.user_rooms: Dict[str, str] = {}  # {user_id: room_id}
    
    def generate_room_id(self) -> str:
        """Generate a unique 6-digit room code"""
        while True:
            room_id = str(random.randint(100000, 999999))
            if room_id not in self.rooms:
                return room_id
    
    def create_room(self, host_data: Dict[str, Any], config: Optional[Dict[str, Any]] = None) -> BattleRoom:
        """Create a new battle room"""
        room_id = self.generate_room_id()
        
        host = Participant(
            user_id=host_data.get("userId", ""),
            username=host_data.get("username", "Host"),
            avatar=host_data.get("avatar", "👑"),
            is_host=True
        )
        
        room_config = None
        if config:
            room_config = RoomConfig(
                max_participants=config.get("maxParticipants", 50),
                time_per_question=config.get("timePerQuestion", 30),
                category=config.get("category", ""),
                subject=config.get("subject", ""),
                exam_id=config.get("examId", "")
            )
        
        room = BattleRoom(room_id, host, room_config)
        self.rooms[room_id] = room
        self.user_rooms[host.user_id] = room_id
        
        return room
    
    def get_room(self, room_id: str) -> Optional[BattleRoom]:
        """Get a room by ID"""
        return self.rooms.get(room_id)
    
    def get_user_room(self, user_id: str) -> Optional[BattleRoom]:
        """Get the room a user is currently in"""
        room_id = self.user_rooms.get(user_id)
        if room_id:
            return self.rooms.get(room_id)
        return None
    
    def remove_room(self, room_id: str):
        """Remove a room and cleanup user mappings"""
        room = self.rooms.get(room_id)
        if room:
            # Remove user mappings
            for participant in room.participants:
                self.user_rooms.pop(participant.user_id, None)
            # Remove room
            del self.rooms[room_id]
    
    def get_active_rooms(self) -> List[Dict[str, Any]]:
        """Get list of active rooms (waiting status)"""
        active_rooms = []
        for room in self.rooms.values():
            if room.status == "waiting" and not room.is_expired():
                active_rooms.append({
                    "roomId": room.room_id,
                    "pin": room.room_id,
                    "host": room.host.username,
                    "participants": len(room.participants),
                    "maxParticipants": room.config.max_participants,
                    "category": room.config.category,
                    "subject": room.config.subject
                })
        return active_rooms
    
    def cleanup_expired_rooms(self):
        """Remove expired rooms (24+ hours old)"""
        expired = [room_id for room_id, room in self.rooms.items() if room.is_expired()]
        for room_id in expired:
            print(f"[CLEANUP] Removing expired room: {room_id}")
            self.remove_room(room_id)


# Global room manager instance
room_manager = BattleRoomManager()
