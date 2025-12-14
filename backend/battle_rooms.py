"""
Battle Room Management - Refactored
Handles quiz battle room state, participants, scoring, and lifecycle

KEY CHANGES:
- No host approval needed - anyone with valid PIN can join instantly
- Rooms active for 24 hours after creation
- Clear expired room handling
- Real-time state sync
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
import random
import asyncio


# Room expiry time in seconds (24 hours)
ROOM_EXPIRY_SECONDS = 24 * 60 * 60


# ---------- Data models -----------------------------------------------------

@dataclass
class Participant:
    """Represents a participant in a battle room."""
    user_id: str
    username: str
    avatar: str = "👤"
    is_host: bool = False
    joined_at: float = field(default_factory=lambda: datetime.now(timezone.utc).timestamp())


@dataclass
class RoomConfig:
    """Configuration for a battle room."""
    max_participants: int = 150
    time_per_question: int = 30
    category: str = ""
    subject: str = ""
    exam_id: str = ""


# ---------- BattleRoom -----------------------------------------------------

class BattleRoom:
    """Manages a single battle room with participants, questions, and scoring.
    
    JOIN FLOW (Refactored - No Host Approval):
    1. Room created by host with unique PIN
    2. Any user with valid PIN can join instantly
    3. Room remains active for 24 hours
    4. After 24 hours, room is expired and no new joins allowed
    """
    
    def __init__(self, room_id: str, host: Participant, config: Optional[RoomConfig] = None):
        self.room_id: str = room_id
        self.host: Participant = host
        self.participants: List[Participant] = [host]
        self.config: RoomConfig = config or RoomConfig()
        self.status: str = "waiting"  # waiting, starting, active, completed, expired
        self.current_question: int = 0
        self.questions: List[Dict[str, Any]] = []
        self.scores: Dict[str, int] = {host.user_id: 0}
        self.answers: Dict[str, Dict[str, Any]] = {}  # {user_id: {question_id: {...}}}
        self.created_at: float = datetime.now(timezone.utc).timestamp()
        self.is_active: bool = True  # Room is joinable
        self.expires_at: float = self.created_at + ROOM_EXPIRY_SECONDS

    # --- Room State Methods ------------------------------------------------
    
    def is_expired(self) -> bool:
        """Return True if the room is older than 24 hours."""
        now = datetime.now(timezone.utc).timestamp()
        return now > self.expires_at
    
    def is_joinable(self) -> bool:
        """Check if room can accept new participants.
        
        A room is joinable if:
        - Not expired (within 24 hours)
        - Not completed
        - Has capacity
        - is_active flag is True
        """
        if self.is_expired():
            self.status = "expired"
            self.is_active = False
            return False
        
        if self.status in ["completed", "expired"]:
            return False
        
        if len(self.participants) >= self.config.max_participants:
            return False
        
        return self.is_active
    
    def get_time_remaining(self) -> int:
        """Get remaining time in seconds before room expires."""
        now = datetime.now(timezone.utc).timestamp()
        remaining = self.expires_at - now
        return max(0, int(remaining))
    
    def deactivate(self):
        """Manually deactivate room (prevent new joins)."""
        self.is_active = False

    # --- participant lifecycle (NO HOST APPROVAL NEEDED) -------------------
    
    def add_participant_object(self, participant: Participant) -> Dict[str, Any]:
        """Add a Participant object to the room.
        
        NO HOST APPROVAL REQUIRED - instant join with valid PIN.
        Allows reconnection during active battles for existing participants.
        """
        # Check if already in room by user_id OR username (for reconnections)
        existing = None
        for p in self.participants:
            if p.user_id == participant.user_id or p.username == participant.username:
                existing = p
                break
        
        if existing:
            # Allow reconnection - update user_id for new socket
            existing.user_id = participant.user_id
            return {"success": True, "message": "Reconnected to room", "alreadyJoined": True, "participant": existing}

        # For NEW participants, check room is joinable
        if not self.is_joinable():
            if self.is_expired():
                return {"success": False, "error": "Room expired. Please create a new room.", "code": "ROOM_EXPIRED"}
            if self.status == "completed":
                return {"success": False, "error": "Battle already completed.", "code": "BATTLE_COMPLETED"}
            if len(self.participants) >= self.config.max_participants:
                return {"success": False, "error": "Room is full.", "code": "ROOM_FULL"}
            # Allow late joins during active battles (within 24h)
            if self.status == "active" and not self.is_expired():
                pass  # Allow joining active battles
            elif not self.is_active:
                return {"success": False, "error": "Room is not accepting participants.", "code": "ROOM_CLOSED"}

        # Add participant instantly - NO APPROVAL NEEDED
        participant.joined_at = datetime.now(timezone.utc).timestamp()
        self.participants.append(participant)
        self.scores.setdefault(participant.user_id, 0)
        self.answers.setdefault(participant.user_id, {})
        
        return {
            "success": True, 
            "participant": participant,
            "message": "Successfully joined room"
        }

    def add_participant(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create Participant from data and add to the room.
        
        NO HOST APPROVAL REQUIRED.
        """
        participant = Participant(
            user_id=str(user_id),
            username=user_data.get("username", "Anonymous"),
            avatar=user_data.get("avatar", "👤"),
            is_host=bool(user_data.get("isHost", False))
        )
        return self.add_participant_object(participant)

    def remove_participant(self, user_id: str) -> bool:
        """Remove a participant by user_id. Returns True if removed."""
        before = len(self.participants)
        self.participants = [p for p in self.participants if p.user_id != user_id]
        self.scores.pop(user_id, None)
        self.answers.pop(user_id, None)
        return len(self.participants) < before

    # --- scoring / answers ---------------------------------------------------
    
    def update_score(self, user_id: str, points: int) -> int:
        """Add points to user's score and return the new score."""
        if user_id not in self.scores:
            self.scores[user_id] = 0
        self.scores[user_id] += int(points)
        return self.scores[user_id]

    def submit_answer(self, user_id: str, question_id: str, answer_id: str, time_spent: float):
        """Record an answer submission."""
        self.answers.setdefault(user_id, {})
        self.answers[user_id][str(question_id)] = {
            "answer_id": str(answer_id),
            "time_spent": float(time_spent),
            "timestamp": datetime.now(timezone.utc).timestamp()
        }

    # --- runtime controls ----------------------------------------------------
    
    def set_questions(self, questions: List[Dict[str, Any]]):
        """Set questions list (host action) and reset current_question."""
        self.questions = questions or []
        self.current_question = 0

    def start_room(self):
        """Start the room; requires questions present."""
        if not self.questions:
            raise RuntimeError("Cannot start room without questions.")
        self.status = "active"
        self.current_question = 0

    def advance_question(self) -> Optional[int]:
        """Advance to the next question. Returns new index or None if finished."""
        if self.current_question + 1 < len(self.questions):
            self.current_question += 1
            return self.current_question
        self.status = "completed"
        self.is_active = False
        return None

    # --- utilities -----------------------------------------------------------
    
    def get_leaderboard(self) -> List[Dict[str, Any]]:
        """Return leaderboard sorted by score (desc) with ranks."""
        leaderboard: List[Dict[str, Any]] = []
        for p in self.participants:
            leaderboard.append({
                "userId": p.user_id,
                "username": p.username,
                "avatar": p.avatar,
                "score": int(self.scores.get(p.user_id, 0)),
                "answersCount": len(self.answers.get(p.user_id, {}))
            })

        leaderboard.sort(key=lambda x: x["score"], reverse=True)
        for idx, entry in enumerate(leaderboard):
            entry["rank"] = idx + 1
        return leaderboard

    def to_dict(self) -> Dict[str, Any]:
        """Serialize room to a dictionary for persistence/transport."""
        now = datetime.now(timezone.utc).timestamp()
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
                    "isHost": p.is_host,
                    "joinedAt": p.joined_at
                }
                for p in self.participants
            ],
            "status": self.status,
            "isActive": self.is_active,
            "isJoinable": self.is_joinable(),
            "isExpired": self.is_expired(),
            "currentQuestion": self.current_question,
            "questionsCount": len(self.questions),
            "questions": self.questions,
            "config": {
                "maxParticipants": self.config.max_participants,
                "timePerQuestion": self.config.time_per_question,
                "category": self.config.category,
                "subject": self.config.subject,
                "examId": self.config.exam_id
            },
            "participantCount": len(self.participants),
            "leaderboard": self.get_leaderboard(),
            "scores": self.scores,
            "answers": self.answers,
            "createdAt": self.created_at,
            "expiresAt": self.expires_at,
            "timeRemaining": self.get_time_remaining()
        }


# ---------- BattleRoomManager -----------------------------------------------

class BattleRoomManager:
    """Manages battle rooms in memory and persists them to a DB.
    
    REFACTORED JOIN FLOW:
    - No host approval required
    - Anyone with valid PIN joins instantly
    - Automatic expiry after 24 hours
    """
    
    def __init__(self):
        self.rooms: Dict[str, BattleRoom] = {}
        self.user_rooms: Dict[str, str] = {}  # {user_id: room_id}
        self.db: Optional[Any] = None
        self._lock = asyncio.Lock()

    # --- DB init/load/save ---------------------------------------------------
    
    async def init_db(self, database: Any):
        """Set DB handle and load recent rooms from persistence."""
        self.db = database
        await self.load_rooms_from_db()

    async def load_rooms_from_db(self):
        """Load non-expired, non-completed rooms from DB into memory."""
        if self.db is None:
            print("[WARNING] Database not initialized, cannot load rooms")
            return

        try:
            now_ts = datetime.now(timezone.utc).timestamp()
            cutoff = now_ts - ROOM_EXPIRY_SECONDS
            
            print(f"[STARTUP] Loading rooms created after {cutoff}...")
            
            cursor = await self.db.battle_rooms.find({
                "createdAt": {"$gt": cutoff},
                "status": {"$nin": ["completed", "expired"]}
            }).to_list(length=1000)

            print(f"[STARTUP] Found {len(cursor)} rooms in database")

            async with self._lock:
                for doc in cursor:
                    try:
                        room = self._room_from_dict(doc)
                        # Skip if expired
                        if room.is_expired():
                            continue
                        self.rooms[room.room_id] = room
                        for p in room.participants:
                            self.user_rooms[p.user_id] = room.room_id
                        print(f"[STARTUP] Loaded room {room.room_id}")
                    except Exception as exc:
                        print(f"[ERROR] Failed to reconstruct room {doc.get('roomId')}: {exc}")
            
            print(f"[STARTUP] Successfully loaded {len(self.rooms)} active rooms")
            
        except Exception as exc:
            print(f"[ERROR] load_rooms_from_db failed: {exc}")
            import traceback
            traceback.print_exc()

    async def save_room_to_db(self, room: BattleRoom):
        """Upsert room document to DB."""
        if self.db is None:
            print(f"[WARNING] Cannot save room {room.room_id} - database not initialized")
            return

        try:
            doc = room.to_dict()
            doc["_persistence_timestamp"] = datetime.now(timezone.utc).timestamp()

            result = await self.db.battle_rooms.update_one(
                {"roomId": room.room_id},
                {"$set": doc},
                upsert=True
            )

            matched = getattr(result, "matched_count", "?")
            modified = getattr(result, "modified_count", "?")
            upserted = getattr(result, "upserted_id", None)
            print(f"[DB] Saved room {room.room_id} (matched={matched}, modified={modified}, upserted={upserted})")
            
        except Exception as exc:
            print(f"[ERROR] save_room_to_db failed for {room.room_id}: {exc}")
            import traceback
            traceback.print_exc()

    async def delete_room_from_db(self, room_id: str):
        """Delete a room doc from DB."""
        if self.db is None:
            return
        try:
            await self.db.battle_rooms.delete_one({"roomId": room_id})
            print(f"[DB] Deleted room {room_id} from database")
        except Exception as exc:
            print(f"[ERROR] delete_room_from_db failed for {room_id}: {exc}")

    # --- reconstruction ------------------------------------------------------
    
    def _room_from_dict(self, data: Dict[str, Any]) -> BattleRoom:
        """Reconstruct BattleRoom from a persisted dictionary."""
        host_data = data.get("host", {}) or {}
        host = Participant(
            user_id=str(host_data.get("userId", "")),
            username=host_data.get("username", "Host"),
            avatar=host_data.get("avatar", "👑"),
            is_host=bool(host_data.get("isHost", True)),
            joined_at=float(host_data.get("joinedAt", datetime.now(timezone.utc).timestamp()))
        )

        cfg = data.get("config", {}) or {}
        config = RoomConfig(
            max_participants=int(cfg.get("maxParticipants", 150)),
            time_per_question=int(cfg.get("timePerQuestion", 30)),
            category=str(cfg.get("category", "")) or "",
            subject=str(cfg.get("subject", "")) or "",
            exam_id=str(cfg.get("examId", "")) or ""
        )

        room_id = str(data.get("roomId", "")) or str(random.randint(100000, 999999))
        room = BattleRoom(room_id, host, config)

        room.status = data.get("status", "waiting")
        room.is_active = data.get("isActive", True)
        room.current_question = int(data.get("currentQuestion", 0))
        room.created_at = float(data.get("createdAt", room.created_at))
        room.expires_at = float(data.get("expiresAt", room.created_at + ROOM_EXPIRY_SECONDS))

        # Reconstruct participants
        room.participants = []
        for p in data.get("participants", []) or []:
            participant = Participant(
                user_id=str(p.get("userId", "")),
                username=p.get("username", "") or "Anonymous",
                avatar=p.get("avatar", "👤"),
                is_host=bool(p.get("isHost", False)),
                joined_at=float(p.get("joinedAt", datetime.now(timezone.utc).timestamp()))
            )
            room.participants.append(participant)

        # Restore scores and answers if present
        restored_scores = data.get("scores", {}) or {}
        room.scores = {p.user_id: int(restored_scores.get(p.user_id, 0)) for p in room.participants}

        room.answers = data.get("answers", {}) or {}
        room.questions = data.get("questions", []) or []

        return room

    # --- room lifecycle helpers ---------------------------------------------
    
    def generate_room_id(self) -> str:
        """Generate a unique 6-digit room code."""
        while True:
            code = str(random.randint(100000, 999999))
            if code not in self.rooms:
                return code

    async def create_room(self, host_data: Dict[str, Any], config: Optional[Dict[str, Any]] = None) -> BattleRoom:
        """Create, persist, and register a new room."""
        async with self._lock:
            room_id = self.generate_room_id()
            host = Participant(
                user_id=str(host_data.get("userId", "")),
                username=host_data.get("username", "Host"),
                avatar=host_data.get("avatar", "👑"),
                is_host=True
            )

            room_config = None
            if config:
                room_config = RoomConfig(
                    max_participants=int(config.get("maxParticipants", 150)),
                    time_per_question=int(config.get("timePerQuestion", 30)),
                    category=str(config.get("category", "")) or "",
                    subject=str(config.get("subject", "")) or "",
                    exam_id=str(config.get("examId", "")) or ""
                )

            room = BattleRoom(room_id, host, room_config)
            self.rooms[room_id] = room
            self.user_rooms[host.user_id] = room_id
            await self.save_room_to_db(room)
            return room

    async def get_room(self, room_id: str) -> Optional[BattleRoom]:
        """Return room by ID or None."""
        async with self._lock:
            room = self.rooms.get(room_id)
            # Auto-expire check
            if room and room.is_expired():
                room.status = "expired"
                room.is_active = False
            return room

    async def get_user_room(self, user_id: str) -> Optional[BattleRoom]:
        """Return the room object a user is currently in, or None."""
        async with self._lock:
            room_id = self.user_rooms.get(user_id)
            if room_id:
                return self.rooms.get(room_id)
            return None

    async def join_room(self, room_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Join a room - NO HOST APPROVAL REQUIRED.
        
        This is the main join entry point. Anyone with valid PIN can join instantly.
        
        Returns:
            {"success": True, "room": room_dict, "participant": {...}}
            or
            {"success": False, "error": "...", "code": "..."}
        """
        async with self._lock:
            room = self.rooms.get(room_id)
            
            if room is None:
                # Try to load from database
                if self.db is not None:
                    try:
                        db_room = await self.db.battle_rooms.find_one({"roomId": room_id})
                        if db_room:
                            room = self._room_from_dict(db_room)
                            if not room.is_expired():
                                self.rooms[room_id] = room
                            else:
                                return {
                                    "success": False,
                                    "error": "Room expired. Please create a new room.",
                                    "code": "ROOM_EXPIRED"
                                }
                        else:
                            return {
                                "success": False, 
                                "error": f"Room {room_id} not found. Please check the PIN.",
                                "code": "ROOM_NOT_FOUND"
                            }
                    except Exception as e:
                        print(f"[ERROR] Failed to load room {room_id} from DB: {e}")
                        return {
                            "success": False, 
                            "error": "Room not found. Please check the PIN.",
                            "code": "ROOM_NOT_FOUND"
                        }
                else:
                    return {
                        "success": False, 
                        "error": "Room not found. Please check the PIN.",
                        "code": "ROOM_NOT_FOUND"
                    }
            
            # Check expiry
            if room.is_expired():
                room.status = "expired"
                room.is_active = False
                await self.save_room_to_db(room)
                return {
                    "success": False,
                    "error": "Room expired. Please create a new room.",
                    "code": "ROOM_EXPIRED"
                }
            
            # Add participant (no approval needed)
            result = room.add_participant(user_data.get("userId", ""), user_data)
            
            if result.get("success"):
                participant_id = str(user_data.get("userId", ""))
                self.user_rooms[participant_id] = room_id
                await self.save_room_to_db(room)
                return {
                    "success": True,
                    "room": room.to_dict(),
                    "participant": {
                        "userId": participant_id,
                        "username": user_data.get("username", "Anonymous"),
                        "avatar": user_data.get("avatar", "👤"),
                        "isHost": False,
                        "joinedAt": datetime.now(timezone.utc).timestamp()
                    },
                    "message": result.get("message", "Successfully joined room")
                }
            
            return result

    async def add_user_to_room(self, room_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Alias for join_room for backward compatibility."""
        return await self.join_room(room_id, user_data)

    async def remove_user_from_room(self, user_id: str) -> bool:
        """Remove a user from whichever room they're in and persist changes."""
        async with self._lock:
            room_id = self.user_rooms.get(user_id)
            if not room_id:
                return False
            
            room = self.rooms.get(room_id)
            if not room:
                self.user_rooms.pop(user_id, None)
                return False
            
            removed = room.remove_participant(user_id)
            self.user_rooms.pop(user_id, None)
            
            # If the room is now empty, delete it
            if not room.participants:
                del self.rooms[room_id]
                await self.delete_room_from_db(room_id)
                return removed
            
            await self.save_room_to_db(room)
            return removed

    async def remove_room(self, room_id: str):
        """Delete a room from memory and DB."""
        async with self._lock:
            room = self.rooms.get(room_id)
            if room:
                for p in room.participants:
                    self.user_rooms.pop(p.user_id, None)
                del self.rooms[room_id]
                await self.delete_room_from_db(room_id)

    async def cleanup_expired_rooms(self):
        """Remove all expired rooms from memory and DB."""
        async with self._lock:
            expired_ids = [rid for rid, room in self.rooms.items() if room.is_expired()]
            for room_id in expired_ids:
                room = self.rooms.get(room_id)
                if room:
                    for p in room.participants:
                        self.user_rooms.pop(p.user_id, None)
                    del self.rooms[room_id]
                    await self.delete_room_from_db(room_id)
            print(f"[CLEANUP] Removed {len(expired_ids)} expired rooms")

    def get_active_rooms(self) -> List[Dict[str, Any]]:
        """Return list of joinable rooms that are not expired."""
        active: List[Dict[str, Any]] = []
        for room in self.rooms.values():
            if room.is_joinable():
                active.append({
                    "roomId": room.room_id,
                    "host": room.host.username,
                    "participantCount": len(room.participants),
                    "maxParticipants": room.config.max_participants,
                    "category": room.config.category,
                    "subject": room.config.subject,
                    "status": room.status,
                    "timeRemaining": room.get_time_remaining()
                })
        return active


# Singleton instance
room_manager = BattleRoomManager()
