"""
Quiz Matchmaking System — Optimized for Scale
Handles automatic player pairing for quiz battles.
Uses dict-based queues keyed by exam for cross-topic matching within same exam.
Supports timeout for odd-player-out and queue size reporting.
"""
from typing import Dict, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
from collections import defaultdict, deque


MATCH_TIMEOUT_SECONDS = 30  # Max wait before notifying "no opponent found"
STALE_THRESHOLD_SECONDS = 300  # 5 min — auto-evict from queue


@dataclass
class WaitingPlayer:
    """Represents a player waiting for a match"""
    socket_id: str
    player_name: str
    exam: str
    subject: str  # Keep for display, but match by exam only
    user_id: Optional[str] = None  # Authenticated user_id (None for anonymous)
    username: Optional[str] = None
    joined_at: float = field(default_factory=lambda: datetime.now(timezone.utc).timestamp())


@dataclass
class MatchedBattle:
    """Represents a matched battle room"""
    room_id: str
    player1: Dict[str, Any]
    player2: Dict[str, Any]
    exam: str
    subject: str  # Combined subjects for display
    created_at: float = field(default_factory=lambda: datetime.now(timezone.utc).timestamp())


class MatchmakingManager:
    """
    Manages automatic matchmaking for quiz battles.
    Uses bucket queues keyed by normalized exam for cross-topic matching.
    Example: NDA Economics can match with NDA History (same exam, different subject)
    """

    def __init__(self):
        # Bucket queue: {exam: deque[WaitingPlayer]} — O(1) popleft
        self._queues: Dict[str, deque] = defaultdict(deque)
        # Reverse index: socket_id -> exam key (for O(1) queue removal)
        self._player_keys: Dict[str, str] = {}
        # Active battles: room_id -> MatchedBattle
        self.active_battles: Dict[str, MatchedBattle] = {}
        # Reverse index: socket_id -> room_id (for O(1) battle lookup)
        self._player_battles: Dict[str, str] = {}

    @staticmethod
    def _normalize_exam(exam: str) -> str:
        """Normalize exam name for matching — ignore subject for broader matching"""
        return exam.lower().strip()

    # ── Queue operations ──

    def add_to_queue(
        self,
        socket_id: str,
        player_name: str,
        exam: str,
        subject: str,
        user_id: Optional[str] = None,
        username: Optional[str] = None,
        blocked_user_ids: Optional[set] = None,
    ) -> Optional[WaitingPlayer]:
        """
        Add player to queue. Returns opponent if instant match found, else None.
        Matches by EXAM only, not subject — enabling cross-topic battles.
        Skips candidates that the current player has blocked OR who have
        blocked the current player (via `blocked_user_ids`).
        """
        if socket_id in self._player_keys:
            return None

        key = self._normalize_exam(exam)
        bucket = self._queues[key]
        now = datetime.now(timezone.utc).timestamp()
        blocked_user_ids = blocked_user_ids or set()

        # Candidates we skipped (blocked) — must be re-queued at the front so
        # they don't lose their place when a different player joins.
        skipped: list = []

        opponent: Optional[WaitingPlayer] = None
        while bucket:
            candidate = bucket[0]
            if now - candidate.joined_at > STALE_THRESHOLD_SECONDS:
                bucket.popleft()
                self._player_keys.pop(candidate.socket_id, None)
                continue
            if candidate.socket_id == socket_id:
                bucket.popleft()
                self._player_keys.pop(candidate.socket_id, None)
                continue
            # Skip if either side has a block relationship
            if candidate.user_id and candidate.user_id in blocked_user_ids:
                skipped.append(bucket.popleft())
                continue
            # Match found — pop and return
            opponent = bucket.popleft()
            self._player_keys.pop(opponent.socket_id, None)
            print(f"[MATCHMAKING] Match found: {player_name} ({subject}) <-> {opponent.player_name} ({opponent.subject}) on exam={key}")
            break

        # Re-queue skipped (blocked) candidates at the FRONT so they keep priority
        for sp in reversed(skipped):
            bucket.appendleft(sp)
            self._player_keys[sp.socket_id] = key

        if opponent is not None:
            return opponent

        # No match — enqueue
        player = WaitingPlayer(
            socket_id=socket_id, player_name=player_name, exam=exam, subject=subject,
            user_id=user_id, username=username,
        )
        bucket.append(player)
        self._player_keys[socket_id] = key
        print(f"[MATCHMAKING] Queued {player_name} ({subject}) in exam={key} (queue size: {len(bucket)})")
        return None

    def remove_from_queue(self, socket_id: str) -> bool:
        key = self._player_keys.pop(socket_id, None)
        if key is None:
            return False
        bucket = self._queues.get(key)
        if bucket is not None:
            self._queues[key] = deque(p for p in bucket if p.socket_id != socket_id)
            if not self._queues[key]:
                del self._queues[key]
        return True

    def get_queue_size(self, exam: str, subject: str) -> int:
        """Returns total players waiting for this exam (all subjects)"""
        key = self._normalize_exam(exam)
        return len(self._queues.get(key, []))

    def get_total_searching(self) -> int:
        return sum(len(b) for b in self._queues.values())

    def get_timed_out_players(self) -> list:
        """Return players who have been waiting longer than MATCH_TIMEOUT_SECONDS."""
        now = datetime.now(timezone.utc).timestamp()
        timed_out = []
        for key in list(self._queues.keys()):
            bucket = self._queues[key]
            remaining = deque()
            for p in bucket:
                if now - p.joined_at > MATCH_TIMEOUT_SECONDS:
                    timed_out.append(p)
                    self._player_keys.pop(p.socket_id, None)
                else:
                    remaining.append(p)
            if remaining:
                self._queues[key] = remaining
            else:
                del self._queues[key]
        return timed_out

    # ── Battle operations ──

    def create_battle(self, room_id: str, player1: Dict[str, Any], player2: Dict[str, Any], exam: str, subject: str):
        battle = MatchedBattle(room_id=room_id, player1=player1, player2=player2, exam=exam, subject=subject)
        self.active_battles[room_id] = battle
        self._player_battles[player1['socketId']] = room_id
        self._player_battles[player2['socketId']] = room_id

    def get_battle(self, room_id: str) -> Optional[MatchedBattle]:
        return self.active_battles.get(room_id)

    def remove_battle(self, room_id: str):
        battle = self.active_battles.pop(room_id, None)
        if battle:
            self._player_battles.pop(battle.player1['socketId'], None)
            self._player_battles.pop(battle.player2['socketId'], None)

    def get_player_battle(self, socket_id: str) -> Optional[MatchedBattle]:
        room_id = self._player_battles.get(socket_id)
        if room_id:
            return self.active_battles.get(room_id)
        return None

    def cleanup_player(self, socket_id: str):
        self.remove_from_queue(socket_id)
        room_id = self._player_battles.get(socket_id)
        if room_id:
            self.remove_battle(room_id)


# Global matchmaking manager
matchmaking_manager = MatchmakingManager()
