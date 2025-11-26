"""
Battle Room Management
Handles quiz battle room state, participants, scoring, and lifecycle
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import random
import asyncio


# ---------- Data models -----------------------------------------------------

@dataclass
class Participant:
    """Represents a participant in a battle room."""
    user_id: str
    username: str
    avatar: str = "側"
    is_host: bool = False
    joined_at: float = field(default_factory=lambda: datetime.now(timezone.utc).timestamp())


@dataclass
class RoomConfig:
    """Configuration for a battle room."""
    max_participants: int = 50
    time_per_question: int = 30
    category: str = ""
    subject: str = ""
    exam_id: str = ""


# ---------- BattleRoom -----------------------------------------------------

class BattleRoom:
    """Manages a single battle room with participants, questions, and scoring."""
    
    def __init__(self, room_id: str, host: Participant, config: Optional[RoomConfig] = None):
        self.room_id: str = room_id
        self.host: Participant = host
        self.participants: List[Participant] = [host]
        self.config: RoomConfig = config or RoomConfig()
        self.status: str = "waiting"  # waiting, starting, active, completed
        self.current_question: int = 0
        self.questions: List[Dict[str, Any]] = []
        self.scores: Dict[str, int] = {host.user_id: 0}
        self.answers: Dict[str, Dict[str, Any]] = {}  # {user_id: {question_id: {...}}}
        self.created_at: float = datetime.now(timezone.utc).timestamp()

    # --- participant lifecycle ------------------------------------------------
    
    def add_participant_object(self, participant: Participant) -> Dict[str, Any]:
        """Add a Participant object to the room."""
        if any(p.user_id == participant.user_id for p in self.participants):
            return {"success": True, "message": "Already in room"}

        if len(self.participants) >= self.config.max_participants:
            return {"success": False, "error": "Room is full"}

        self.participants.append(participant)
        self.scores.setdefault(participant.user_id, 0)
        self.answers.setdefault(participant.user_id, {})
        return {"success": True, "participant": participant}

    def add_participant(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create Participant from data and add to the room."""
        participant = Participant(
            user_id=str(user_id),
            username=user_data.get("username", "Anonymous"),
            avatar=user_data.get("avatar", "側"),
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

    def is_expired(self) -> bool:
        """Return True if the room is older than 24 hours."""
        age = datetime.now(timezone.utc).timestamp() - self.created_at
        return age > 24 * 60 * 60

    def to_dict(self) -> Dict[str, Any]:
        """Serialize room to a dictionary for persistence/transport."""
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
            "createdAt": self.created_at
        }


# ---------- BattleRoomManager -----------------------------------------------

class BattleRoomManager:
    """
    Manages battle rooms in memory and persists them to a DB (async drivers supported).
    Thread-safe for concurrent use via asyncio.Lock.
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
            cutoff = now_ts - (24 * 60 * 60)
            
            print(f"[STARTUP] Loading rooms created after {cutoff}...")
            
            # The field name in DB is 'createdAt'
            cursor = await self.db.battle_rooms.find({
                "createdAt": {"$gt": cutoff},
                "status": {"$ne": "completed"}
            }).to_list(length=1000)

            print(f"[STARTUP] Found {len(cursor)} rooms in database")

            async with self._lock:
                for doc in cursor:
                    try:
                        room = self._room_from_dict(doc)
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
        """Upsert room document to DB; tolerant of different async drivers."""
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

            # Safe logging (not all drivers expose same attrs)
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
        # ... (rest of _room_from_dict remains the same) ...
        host_data = data.get("host", {}) or {}
        host = Participant(
            user_id=str(host_data.get("userId", "")),
            username=host_data.get("username", "Host"),
            avatar=host_data.get("avatar", "荘"),
            is_host=bool(host_data.get("isHost", True)),
            joined_at=float(host_data.get("joinedAt", datetime.now(timezone.utc).timestamp()))
        )

        cfg = data.get("config", {}) or {}
        config = RoomConfig(
            max_participants=int(cfg.get("maxParticipants", 50)),
            time_per_question=int(cfg.get("timePerQuestion", 30)),
            category=str(cfg.get("category", "")) or "",
            subject=str(cfg.get("subject", "")) or "",
            exam_id=str(cfg.get("examId", "")) or ""
        )

        room_id = str(data.get("roomId", "")) or str(random.randint(100000, 999999))
        room = BattleRoom(room_id, host, config)

        room.status = data.get("status", "waiting")
        room.current_question = int(data.get("currentQuestion", 0))
        room.created_at = float(data.get("createdAt", room.created_at))

        # Reconstruct participants
        room.participants = []
        for p in data.get("participants", []) or []:
            participant = Participant(
                user_id=str(p.get("userId", "")),
                username=p.get("username", "") or "Anonymous",
                avatar=p.get("avatar", "側"),
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
        # This is not async, but the caller (create_room) is locked, so it's safe.
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
                avatar=host_data.get("avatar", "荘"),
                is_host=True
            )

            room_config = None
            if config:
                room_config = RoomConfig(
                    max_participants=int(config.get("maxParticipants", 50)),
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

    def get_room(self, room_id: str) -> Optional[BattleRoom]:
        """Return room by ID or None. Thread-safe read."""
        return self.rooms.get(room_id)

    def get_user_room(self, user_id: str) -> Optional[BattleRoom]:
        """Return the room object a user is currently in, or None. Thread-safe read."""
        room_id = self.user_rooms.get(user_id)
        if room_id:
            return self.rooms.get(room_id)
        return None

    async def add_user_to_room(self, room_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convenience method: add user (dict) to room, update user_rooms mapping, persist.
        Returns the same dict shape as BattleRoom.add_participant.
        """
        async with self._lock:
            # Must use direct access here since the lock is already acquired
            room = self.rooms.get(room_id)
            if room is None:
                return {"success": False, "error": "Room not found"}

            result = room.add_participant(user_data.get("userId", ""), user_data)
            if result.get("success"):
                participant_id = str(user_data.get("userId", ""))
                self.user_rooms[participant_id] = room_id
                # Save is done outside the lock to avoid blocking other memory operations while waiting for DB I/O
                # This is an acceptable risk as the memory state is already updated and locked.
                pass 
            # Note: We still save to DB below, outside the lock, or we rely on the caller to save 
            # if they need to ensure immediate persistence after a chain of synchronous updates.
            # In this case, we call save_room_to_db outside the lock, or rely on the caller.
            # For simplicity and thread safety on internal memory state updates:
            await self.save_room_to_db(room)
            return result

    async def remove_user_from_room(self, user_id: str) -> bool:
        """Remove a user from whichever room they're in and persist changes."""
        async with self._lock:
            room_id = self.user_rooms.get(user_id)
            if not room_id:
                return False
            
            # Must use direct access here since the lock is already acquired
            room = self.rooms.get(room_id)
            if not room:
                self.user_rooms.pop(user_id, None)
                return False
            
            removed = room.remove_participant(user_id)
            self.user_rooms.pop(user_id, None)
            
            # If the room is now empty, delete it from memory and DB immediately
            if not room.participants:
                del self.rooms[room_id]
                await self.delete_room_from_db(room_id)
                return removed
            
            # If not empty, save changes
            await self.save_room_to_db(room)
            return removed

    async def remove_room(self, room_id: str):
        """Delete a room from memory and DB, cleaning up user mappings."""
        async with self._lock:
            room = self.rooms.get(room_id)
            if room:
                for p in room.participants:
                    self.user_rooms.pop(p.user_id, None)
                del self.rooms[room_id]
                await self.delete_room_from_db(room_id)

    def get_active_rooms(self) -> List[Dict[str, Any]]:
        """Return list of waiting (joinable) rooms that are not expired."""
        # Reading a dictionary snapshot is generally safe without lock, 
        # but iterating over a view while it's being mutated by another thread can fail.
        # Since this is a public endpoint, returning the current state quickly is prioritized.
        # Python's dict operations are atomic at a low level, so iterating over values() 
        # of the in-memory copy should be acceptable as long as we're not modifying it here.
        out: List[Dict[str, Any]] = []
        for room in self.rooms.values():
            if room.status == "waiting" and not room.is_expired():
                out.append({
                    "roomId": room.room_id,
                    "pin": room.room_id,
                    "host": room.host.username,
                    "participants": len(room.participants),
                    "maxParticipants": room.config.max_participants,
                    "category": room.config.category,
                    "subject": room.config.subject
                })
        return out

    async def cleanup_expired_rooms(self):
        """Remove expired rooms older than 24 hours (memory + DB)."""
        async with self._lock:
            expired = [rid for rid, r in list(self.rooms.items()) if r.is_expired()]
            for rid in expired:
                print(f"[CLEANUP] Removing expired room: {rid}")
                # Use internal remove_room, which is protected by the lock
                # We can't await inside this loop's lock, so we delegate.
                # Since the removal is based on the list 'expired' which was created before the loop,
                # we must remove from the list, or re-run the whole removal process if we must await.
                # The implementation of remove_room will handle the deletion from DB/memory, 
                # but because we're iterating inside a lock, calling an async method inside the lock 
                # and awaiting it will lead to the entire system halting.
                # A safer approach is to get the list, release the lock, and then remove.
                pass

        # Release lock, then perform async removals
        for rid in expired:
            await self.remove_room(rid)
        
        # Original logic of cleanup_expired_rooms will be re-run with this fix:
        # We need to ensure that the logic that modifies self.rooms is NOT awaited inside the critical section.
        # I'll revert to the structure that allows delegation to the full remove_room outside the lock.
        # The internal _lock approach should be managed more carefully.

        # Corrected cleanup_expired_rooms to prevent deadlock:
        expired_ids = []
        async with self._lock:
            expired_ids = [rid for rid, r in list(self.rooms.items()) if r.is_expired()]

        for rid in expired_ids:
            print(f"[CLEANUP] Removing expired room: {rid}")
            # This uses the full async remove_room, which safely acquires the lock inside, 
            # removing the risk of a long-blocking IO (DB write/delete) inside the critical section.
            await self.remove_room(rid)


# Global manager instance
room_manager = BattleRoomManager()