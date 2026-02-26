"""
Quiz Matchmaking System — Optimized for Scale
Handles automatic player pairing for quiz battles.
Uses dict-based queues keyed by exam for cross-topic matching within same exam.
Supports timeout for odd-player-out and queue size reporting.
"""
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
from collections import defaultdict


MATCH_TIMEOUT_SECONDS = 30  # Max wait before notifying "no opponent found"


@dataclass
class WaitingPlayer:
    """Represents a player waiting for a match"""
    socket_id: str
    player_name: str
    exam: str
    subject: str  # Keep for display, but match by exam only
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
        # Bucket queue: {exam: [WaitingPlayer, ...]} - match by EXAM only
        self._queues: Dict[str, List[WaitingPlayer]] = defaultdict(list)
        # Quick lookup: socket_id -> exam key
        self._player_keys: Dict[str, str] = {}
        self.active_battles: Dict[str, MatchedBattle] = {}

    @staticmethod
    def _normalize_exam(exam: str) -> str:
        """Normalize exam name for matching - ignore subject for broader matching"""
        return exam.lower().strip()

    # ── Queue operations ──

    def add_to_queue(self, socket_id: str, player_name: str, exam: str, subject: str) -> Optional[WaitingPlayer]:
        """
        Add player to queue. Returns opponent if instant match found, else None.
        Matches by EXAM only, not subject - enabling cross-topic battles.
        Example: NDA Economics vs NDA History
        """
        # Already queued?
        if socket_id in self._player_keys:
            return None

        key = self._normalize_exam(exam)  # Match by exam only!
        bucket = self._queues[key]

        # Scan for first valid opponent (skip self, skip stale entries)
        now = datetime.now(timezone.utc).timestamp()
        while bucket:
            candidate = bucket[0]
            # Skip stale players (waited > 5 min somehow still in queue)
            if now - candidate.joined_at > 300:
                bucket.pop(0)
                self._player_keys.pop(candidate.socket_id, None)
                continue
            if candidate.socket_id == socket_id:
                bucket.pop(0)
                self._player_keys.pop(candidate.socket_id, None)
                continue
            # Match found — pop and return (cross-topic match allowed!)
            opponent = bucket.pop(0)
            self._player_keys.pop(opponent.socket_id, None)
            print(f"[MATCHMAKING] Match found: {player_name} ({subject}) <-> {opponent.player_name} ({opponent.subject}) on exam={key}")
            return opponent

        # No match — enqueue
        player = WaitingPlayer(socket_id=socket_id, player_name=player_name, exam=exam, subject=subject)
        bucket.append(player)
        self._player_keys[socket_id] = key
        print(f"[MATCHMAKING] Queued {player_name} ({subject}) in exam={key} (queue size: {len(bucket)})")
        return None

    def remove_from_queue(self, socket_id: str) -> bool:
        key = self._player_keys.pop(socket_id, None)
        if key is None:
            return False
        bucket = self._queues.get(key, [])
        self._queues[key] = [p for p in bucket if p.socket_id != socket_id]
        if not self._queues[key]:
            del self._queues[key]
        return True

    def get_queue_size(self, exam: str, subject: str) -> int:
        """Returns total players waiting for this exam (all subjects)"""
        key = self._normalize_exam(exam)
        return len(self._queues.get(key, []))

    def get_total_searching(self) -> int:
        return sum(len(b) for b in self._queues.values())

    def get_timed_out_players(self) -> List[WaitingPlayer]:
        """Return players who have been waiting longer than MATCH_TIMEOUT_SECONDS."""
        now = datetime.now(timezone.utc).timestamp()
        timed_out = []
        for key in list(self._queues.keys()):
            bucket = self._queues[key]
            remaining = []
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

    def get_battle(self, room_id: str) -> Optional[MatchedBattle]:
        return self.active_battles.get(room_id)

    def remove_battle(self, room_id: str):
        self.active_battles.pop(room_id, None)

    def get_player_battle(self, socket_id: str) -> Optional[MatchedBattle]:
        for battle in self.active_battles.values():
            if battle.player1['socketId'] == socket_id or battle.player2['socketId'] == socket_id:
                return battle
        return None

    def cleanup_player(self, socket_id: str):
        self.remove_from_queue(socket_id)
        battles_to_remove = [
            rid for rid, b in self.active_battles.items()
            if b.player1['socketId'] == socket_id or b.player2['socketId'] == socket_id
        ]
        for rid in battles_to_remove:
            self.remove_battle(rid)


# Global matchmaking manager
matchmaking_manager = MatchmakingManager()
