"""
Quiz Matchmaking System — Optimized for Scale
Handles automatic player pairing for quiz battles.
Uses dict-based queues keyed by exam for cross-topic matching within same exam.
Supports timeout for odd-player-out and queue size reporting.
"""
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Deque, Dict, List, Optional, Set


MATCH_TIMEOUT_SECONDS = 30  # Max wait before notifying "no opponent found"
STALE_THRESHOLD_SECONDS = 300  # 5 min — auto-evict from queue


BattleParticipant = Dict[str, Any]


@dataclass
class WaitingPlayer:
    """Represents a player waiting for a match."""
    socket_id: str
    player_name: str
    exam: str
    subject: str  # Keep for display, but match by exam only
    user_id: Optional[str] = None
    username: Optional[str] = None
    joined_at: float = field(default_factory=lambda: datetime.now(timezone.utc).timestamp())


@dataclass
class MatchedBattle:
    """Represents a matched battle room."""
    room_id: str
    player1: BattleParticipant
    player2: BattleParticipant
    exam: str
    subject: str  # Combined subjects for display
    created_at: float = field(default_factory=lambda: datetime.now(timezone.utc).timestamp())


class MatchmakingManager:
    """Manages automatic matchmaking for quiz battles."""

    def __init__(self) -> None:
        self._queues: Dict[str, Deque[WaitingPlayer]] = defaultdict(deque)
        self._player_keys: Dict[str, str] = {}
        self.active_battles: Dict[str, MatchedBattle] = {}
        self._player_battles: Dict[str, str] = {}

    @staticmethod
    def _normalize_exam(exam: str) -> str:
        """Normalize exam name for matching."""
        return exam.strip().lower()

    @staticmethod
    def _normalize_identity(value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = str(value).strip().lower()
        return normalized or None

    def _restore_skipped_players(self, key: str, skipped: Deque[WaitingPlayer]) -> None:
        while skipped:
            candidate = skipped.pop()
            self._queues[key].appendleft(candidate)
            self._player_keys[candidate.socket_id] = key

    # ── Queue operations ──

    def add_to_queue(
        self,
        socket_id: str,
        player_name: str,
        exam: str,
        subject: str,
        user_id: Optional[str] = None,
        username: Optional[str] = None,
        blocked_user_ids: Optional[Set[str]] = None,
    ) -> Optional[WaitingPlayer]:
        """Add a player to the queue or return an instant match."""
        if socket_id in self._player_keys:
            return None

        key = self._normalize_exam(exam)
        bucket = self._queues[key]
        now = datetime.now(timezone.utc).timestamp()
        blocked_user_ids = blocked_user_ids or set()
        my_user_id = self._normalize_identity(user_id)
        my_username = self._normalize_identity(username)

        skipped: Deque[WaitingPlayer] = deque()
        opponent: Optional[WaitingPlayer] = None

        while bucket:
            candidate = bucket.popleft()
            wait_time = now - candidate.joined_at
            if wait_time > STALE_THRESHOLD_SECONDS:
                self._player_keys.pop(candidate.socket_id, None)
                continue
            if candidate.socket_id == socket_id:
                self._player_keys.pop(candidate.socket_id, None)
                continue
            # Hard stop: do not ever match the same account/session identity
            # against itself across multiple browsers/tabs.
            candidate_user_id = self._normalize_identity(candidate.user_id)
            candidate_username = self._normalize_identity(candidate.username)
            if my_user_id and candidate_user_id and my_user_id == candidate_user_id:
                skipped.append(candidate)
                continue
            if my_username and candidate_username and my_username == candidate_username:
                skipped.append(candidate)
                continue
            if candidate.user_id and candidate.user_id in blocked_user_ids:
                skipped.append(candidate)
                continue

            opponent = candidate
            self._player_keys.pop(opponent.socket_id, None)
            print(
                f"[MATCHMAKING] Match found: {player_name} ({subject}) <-> "
                f"{opponent.player_name} ({opponent.subject}) on exam={key}"
            )
            break

        self._restore_skipped_players(key, skipped)

        if opponent:
            return opponent

        player = WaitingPlayer(
            socket_id=socket_id,
            player_name=player_name,
            exam=exam,
            subject=subject,
            user_id=my_user_id,
            username=my_username,
        )
        bucket.append(player)
        self._player_keys[socket_id] = key
        print(
            f"[MATCHMAKING] Queued {player_name} ({subject}) in exam={key} "
            f"(queue size: {len(bucket)})"
        )
        return None

    def remove_from_queue(self, socket_id: str) -> bool:
        key = self._player_keys.pop(socket_id, None)
        if key is None:
            return False

        bucket = self._queues.get(key)
        if not bucket:
            return False

        self._queues[key] = deque(player for player in bucket if player.socket_id != socket_id)
        if not self._queues[key]:
            del self._queues[key]
        return True

    def get_queue_size(self, exam: str, subject: str) -> int:
        """Returns total players waiting for this exam (all subjects)."""
        key = self._normalize_exam(exam)
        return len(self._queues.get(key, []))

    def get_total_searching(self) -> int:
        return sum(len(bucket) for bucket in self._queues.values())

    def get_timed_out_players(self) -> List[WaitingPlayer]:
        """Return players who have been waiting longer than MATCH_TIMEOUT_SECONDS."""
        now = datetime.now(timezone.utc).timestamp()
        timed_out: List[WaitingPlayer] = []

        for key in list(self._queues.keys()):
            bucket = self._queues[key]
            remaining: Deque[WaitingPlayer] = deque()
            while bucket:
                player = bucket.popleft()
                if now - player.joined_at > MATCH_TIMEOUT_SECONDS:
                    timed_out.append(player)
                    self._player_keys.pop(player.socket_id, None)
                else:
                    remaining.append(player)

            if remaining:
                self._queues[key] = remaining
            else:
                del self._queues[key]

        return timed_out

    # ── Battle operations ──

    def create_battle(
        self,
        room_id: str,
        player1: BattleParticipant,
        player2: BattleParticipant,
        exam: str,
        subject: str,
    ) -> None:
        battle = MatchedBattle(
            room_id=room_id,
            player1=player1,
            player2=player2,
            exam=exam,
            subject=subject,
        )
        self.active_battles[room_id] = battle
        self._player_battles[player1['socketId']] = room_id
        self._player_battles[player2['socketId']] = room_id

    def get_battle(self, room_id: str) -> Optional[MatchedBattle]:
        return self.active_battles.get(room_id)

    def remove_battle(self, room_id: str) -> None:
        battle = self.active_battles.pop(room_id, None)
        if not battle:
            return

        self._player_battles.pop(battle.player1['socketId'], None)
        self._player_battles.pop(battle.player2['socketId'], None)

    def get_player_battle(self, socket_id: str) -> Optional[MatchedBattle]:
        room_id = self._player_battles.get(socket_id)
        if not room_id:
            return None
        return self.active_battles.get(room_id)

    def cleanup_player(self, socket_id: str) -> None:
        self.remove_from_queue(socket_id)
        room_id = self._player_battles.get(socket_id)
        if room_id:
            self.remove_battle(room_id)


matchmaking_manager = MatchmakingManager()
