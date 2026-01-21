"""
Quiz Matchmaking System
Handles automatic player pairing for quiz battles
"""
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
import asyncio


@dataclass
class WaitingPlayer:
    """Represents a player waiting for a match"""
    socket_id: str
    player_name: str
    exam: str
    subject: str
    joined_at: float = field(default_factory=lambda: datetime.now(timezone.utc).timestamp())


@dataclass
class MatchedBattle:
    """Represents a matched battle room"""
    room_id: str
    player1: Dict[str, Any]
    player2: Dict[str, Any]
    exam: str
    subject: str
    created_at: float = field(default_factory=lambda: datetime.now(timezone.utc).timestamp())


class MatchmakingManager:
    """
    Manages automatic matchmaking for quiz battles
    """
    
    def __init__(self):
        self.waiting_players: List[WaitingPlayer] = []
        self.active_battles: Dict[str, MatchedBattle] = {}
    
    def normalize_subject(self, subject: str) -> str:
        """Normalize subject name for matching (remove marks info, lowercase, strip)"""
        import re
        # Remove anything in parentheses like "(300 Marks)"
        normalized = re.sub(r'\s*\([^)]*\)\s*', '', subject)
        # Convert to lowercase and strip whitespace
        normalized = normalized.lower().strip()
        return normalized
    
    def add_to_queue(self, socket_id: str, player_name: str, exam: str, subject: str) -> Optional[WaitingPlayer]:
        """
        Add a player to matchmaking queue
        Returns the matched opponent if found, None if added to waiting list
        """
        # Check if player already in queue
        if any(p.socket_id == socket_id for p in self.waiting_players):
            return None
        
        # Normalize exam and subject for matching
        normalized_exam = exam.lower().strip()
        normalized_subject = self.normalize_subject(subject)
        
        # Try to find a match
        for i, waiting_player in enumerate(self.waiting_players):
            waiting_normalized_exam = waiting_player.exam.lower().strip()
            waiting_normalized_subject = self.normalize_subject(waiting_player.subject)
            
            if (waiting_normalized_exam == normalized_exam and 
                waiting_normalized_subject == normalized_subject and 
                waiting_player.socket_id != socket_id):
                # Match found! Remove from queue and return
                opponent = self.waiting_players.pop(i)
                print(f"[MATCHMAKING] Match found: '{exam}/{subject}' matches '{waiting_player.exam}/{waiting_player.subject}'")
                return opponent
        
        # No match found, add to queue
        player = WaitingPlayer(
            socket_id=socket_id,
            player_name=player_name,
            exam=exam,
            subject=subject
        )
        self.waiting_players.append(player)
        return None
    
    def remove_from_queue(self, socket_id: str) -> bool:
        """Remove a player from the queue"""
        initial_length = len(self.waiting_players)
        self.waiting_players = [p for p in self.waiting_players if p.socket_id != socket_id]
        return len(self.waiting_players) < initial_length
    
    def create_battle(self, room_id: str, player1: Dict[str, Any], player2: Dict[str, Any], exam: str, subject: str):
        """Register a matched battle"""
        battle = MatchedBattle(
            room_id=room_id,
            player1=player1,
            player2=player2,
            exam=exam,
            subject=subject
        )
        self.active_battles[room_id] = battle
    
    def get_battle(self, room_id: str) -> Optional[MatchedBattle]:
        """Get battle by room ID"""
        return self.active_battles.get(room_id)
    
    def remove_battle(self, room_id: str):
        """Remove a battle"""
        self.active_battles.pop(room_id, None)
    
    def get_player_battle(self, socket_id: str) -> Optional[MatchedBattle]:
        """Find battle that a player is in"""
        for battle in self.active_battles.values():
            if (battle.player1['socketId'] == socket_id or 
                battle.player2['socketId'] == socket_id):
                return battle
        return None
    
    def cleanup_player(self, socket_id: str):
        """Remove player from both queue and battles"""
        self.remove_from_queue(socket_id)
        
        # Remove from battles
        battles_to_remove = []
        for room_id, battle in self.active_battles.items():
            if (battle.player1['socketId'] == socket_id or 
                battle.player2['socketId'] == socket_id):
                battles_to_remove.append(room_id)
        
        for room_id in battles_to_remove:
            self.remove_battle(room_id)


# Global matchmaking manager
matchmaking_manager = MatchmakingManager()
