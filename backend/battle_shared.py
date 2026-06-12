"""battle_shared.py — sio instance, shared state, helper functions.
All handler modules import from here.
"""
"""
Battle Socket.IO Event Handlers
Manages real-time battle room events using python-socketio
Includes matchmaking and WebRTC signaling
"""
import socketio
import asyncio
from typing import Dict, Any, Optional
from battle_rooms import room_manager, Participant
from matchmaking import matchmaking_manager
from datetime import datetime, timezone
import secrets
import string

# Create Socket.IO server with async mode
# PRODUCTION SETTINGS: Optimized for mid-quiz connection stability
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True,
    # CRITICAL: More frequent checks with longer timeout window
    ping_interval=15,   # Send ping every 15 seconds (faster health checks)
    ping_timeout=120,   # Wait 120 seconds for pong response (2 minutes buffer)
    max_http_buffer_size=10000000,  # 10MB for large data
    allow_upgrades=True
)

# Activity tracking to prevent timeout on active players
user_activity = {}  # {sid: last_activity_timestamp}
# Per-user reaction throttle — max 1 emoji per 600ms per sid (anti-spam).
_reaction_last_emit_ms = {}  # {sid: last_emit_timestamp_ms}

# Database will be injected
db = None


def init_socketio_db(database):
    """Initialize database for Socket.IO and room manager"""
    global db
    db = database
    # Initialize room manager database
    import asyncio
    asyncio.create_task(room_manager.init_db(database))


# ==================== HELPERS: Extracted to reduce handler complexity ====================

GIFT_COSTS = {'star': 50, 'diamond': 100, 'crown': 200, 'trophy': 500}


def _validate_join_preconditions(room):
    """Return error dict if room cannot be joined, else None."""
    if not room:
        return {'error': 'Room not found. Please check the PIN.', 'code': 'ROOM_NOT_FOUND', 'statusCode': 404}
    if room.is_expired():
        return {'error': 'Room expired. Please create a new room.', 'code': 'ROOM_EXPIRED', 'statusCode': 410}
    if room.status == 'completed':
        return {'error': 'Battle already completed.', 'code': 'BATTLE_COMPLETED', 'statusCode': 410}
    return None


def _handle_host_reconnect(room, sid, user_data):
    """Reassign host socket id when the host reconnects via WS.

    The host's `room.host.user_id` is set to their original socket SID when
    they create the room. But every page navigation (or browser refresh)
    creates a NEW socket connection with a NEW sid — so subsequent host-only
    commands (pause/resume/skip/end) would silently fail because
    `room.host.user_id != sid` once the host moves between pages.

    Resolution rules (in priority order):
      1. SID already matches → no-op.
      2. There's an HTTP-placeholder host (`http-…` user_id) AND user claims
         `isHost: true` → reassign to this sid.
      3. Same username as the persisted host AND user claims `isHost: true`
         (or the persisted host's user_id is anything other than this sid) →
         reassign to this sid. This covers the page-navigation case.

    Returns True if this user is the actual host.
    """
    if room.host.user_id == sid:
        return True

    claims_host = user_data.get('isHost') is True
    if not claims_host:
        return False

    # Case 2: HTTP-placeholder cleanup
    for participant in room.participants:
        if participant.user_id.startswith('http-') and participant.is_host:
            room.participants = [p for p in room.participants if not p.user_id.startswith('http-')]
            room.host.user_id = sid
            room.host.username = user_data.get('username', room.host.username)
            room.host.avatar = user_data.get('avatar', room.host.avatar)
            return True

    # Case 3: Username-match reconnect (page navigation / refresh)
    incoming_username = user_data.get('username', '')
    if incoming_username and incoming_username == room.host.username:
        old_sid = room.host.user_id
        room.host.user_id = sid
        room.host.avatar = user_data.get('avatar', room.host.avatar)
        # Clean up stale roster entry for the old SID (it'll be re-added below).
        room.participants = [p for p in room.participants if p.user_id != old_sid]
        print(f"[HOST RECONNECT] Reassigned host '{incoming_username}' sid {old_sid} → {sid}")
        return True

    return False


def _validate_start_preconditions(room):
    """Return error dict if battle cannot be started, else None."""
    if not room:
        return {'error': 'Room not found', 'code': 'ROOM_NOT_FOUND'}
    if room.is_expired():
        return {'error': 'Room expired. Please create a new room.', 'code': 'ROOM_EXPIRED'}
    if room.status == 'active':
        return {'error': 'Battle already in progress', 'code': 'ALREADY_STARTED'}
    if room.status == 'completed':
        return {'error': 'Battle already completed', 'code': 'ALREADY_COMPLETED'}
    if not room.questions or len(room.questions) == 0:
        return {'error': 'No questions set for this room. Please add questions first.', 'code': 'NO_QUESTIONS'}
    return None


async def _persist_battle_start(room_id, room):
    """Persist battle start record to live_battles and notify admins."""
    try:
        players_data = [{"user_id": p.user_id, "username": p.username, "score": p.score} for p in room.participants]
        now_iso = datetime.now(timezone.utc).isoformat()
        battle_doc = {
            "id": room_id, "room_id": room_id, "type": "room", "status": "in_progress",
            "players": players_data, "exam": room.exam or "", "subject": room.subject or "",
            "total_questions": len(room.questions), "started_at": now_iso, "ended_at": None,
            "is_demo": False, "created_at": now_iso, "updated_at": now_iso
        }
        await db.live_battles.update_one({"room_id": room_id}, {"$set": battle_doc}, upsert=True)
        await notify_admins_battle_started(room_id, battle_doc)
    except Exception as e:
        print(f"[START] Failed to persist battle: {e}")


async def _persist_battle_completion(room_id, room, leaderboard):
    """Update live_battles record on completion and notify admins."""
    try:
        winner = leaderboard[0] if leaderboard else None
        now_iso = datetime.now(timezone.utc).isoformat()
        await db.live_battles.update_one(
            {"room_id": room_id},
            {"$set": {
                "status": "completed", "ended_at": now_iso, "updated_at": now_iso,
                "winner_id": winner.get("user_id") if winner else None,
                "winner_name": winner.get("username") if winner else None,
                "final_leaderboard": leaderboard
            }},
            upsert=True
        )
        await notify_admins_battle_ended(room_id, {"leaderboard": leaderboard})
    except Exception as e:
        print(f"[COMPLETE] Failed to update live_battles: {e}")


async def _save_battle_history(room_id, room, leaderboard):
    """Persist per-participant battle history rows for stats tracking."""
    try:
        from test_history_service import record_test_attempt
        total_q = room.current_question or 0
        for idx, participant in enumerate(leaderboard, 1):
            user_id = participant.get('user_id') or participant.get('userId')
            if not user_id:
                continue
            await db.user_battle_history.insert_one({
                "user_id": user_id,
                "user_name": participant.get('username', participant.get('playerName', 'Unknown')),
                "battle_type": "room", "room_id": room_id,
                "score": participant.get('score', 0),
                "total_questions": room.current_question,
                "rank": idx, "total_participants": len(room.participants),
                "exam": room.exam or "", "subject": room.subject or "",
                "completed_at": datetime.now(timezone.utc).isoformat()
            })
            # Canonical test-history record (battle points: max 100/question)
            await record_test_attempt(
                db,
                user_id=user_id,
                test_id=room_id,
                test_name=f"Live Battle — {room.exam or 'Quiz'}",
                subject=room.subject or "Mixed",
                exam_category=room.exam or "Battle",
                total_marks=total_q * 100,
                marks_obtained=participant.get('score', 0),
                questions_total=total_q,
                is_battle=True,
            )
    except Exception as e:
        print(f"[COMPLETE] Failed to save battle history: {str(e)}")


async def _auto_post_battle_results(room_id, room, leaderboard):
    """Auto-post top-5 battle results to social feed."""
    try:
        from social_auto_post import auto_post_battle_result
        for idx, participant in enumerate(leaderboard[:5], 1):
            user_id = participant.get('user_id') or participant.get('userId')
            if not user_id:
                continue
            battle_data = {
                "room_code": room_id,
                "score": participant.get('score', 0),
                "rank": idx,
                "total_participants": len(room.participants),
                "subject": room.subject or "",
                "exam_category": room.exam or "",
                "questions_answered": participant.get('score', 0),
                "total_questions": room.current_question
            }
            await auto_post_battle_result(user_id, battle_data)
    except Exception as e:
        print(f"[COMPLETE] Failed to auto-post battle results: {str(e)}")


def _validate_gift_request(room, sid, recipient_id, gift_type):
    """Validate a gift send. Returns (cost, error_message_or_None)."""
    if not room:
        return None, 'Room not found'
    if not recipient_id or recipient_id == sid:
        return None, 'Invalid recipient'
    if gift_type not in GIFT_COSTS:
        return None, 'Invalid gift type'
    cost = GIFT_COSTS[gift_type]
    room.scores.setdefault(sid, 0)
    room.scores.setdefault(recipient_id, 0)
    if room.scores.get(sid, 0) < cost:
        return None, 'Not enough points to send this gift'
    return cost, None




def generate_random_id(length: int = 9) -> str:
    """Generate random alphanumeric ID"""
    return ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(length))


async def handle_user_leave(sid, room_id):
    """Handle user leaving a room with host reassignment"""
    try:
        room = await room_manager.get_room(room_id)
        if not room:
            return

        is_host_leaving = room.host.user_id == sid
        
        removed = room.remove_participant(sid)
        room_manager.user_rooms.pop(sid, None)
        await sio.leave_room(sid, room_id)
        
        if not removed:
            return

        print(f"[LEAVE] User {sid} left room {room_id}")

        # If host left, assign new host or close room
        if is_host_leaving:
            if len(room.participants) > 0:
                # Assign first remaining participant as new host
                new_host = room.participants[0]
                room.host = new_host
                room.host.is_host = True
                
                await sio.emit('host_changed', {
                    'newHost': {
                        'userId': room.host.user_id,
                        'username': room.host.username,
                        'avatar': room.host.avatar,
                        'isHost': True
                    }
                }, room=room_id)
                print(f"[HOST] New host assigned in {room_id}: {room.host.username}")
                await room_manager.save_room_to_db(room)
            else:
                # No participants left, close room
                await room_manager.remove_room(room_id)
                print(f"[CLOSE] Room {room_id} closed - no participants")
                return
        else:
            # Save room state if a non-host leaves
            await room_manager.save_room_to_db(room)

        # Notify remaining participants
        await sio.emit('participant_left', {
            'userId': sid,
            'room': room.to_dict()
        }, room=room_id)

        # Update room list
        await sio.emit('room_list_updated', room_manager.get_active_rooms())

    except Exception as e:
        print(f"[ERROR] handle_user_leave: {str(e)}")


# Create ASGI application
# Empty socketio_path because the path is defined in the mount point (/api/battlews)
socket_app = socketio.ASGIApp(sio, socketio_path='')


# ── Background: sweep timed-out players every 5s ──
_sweep_started = False

async def _matchmaking_timeout_sweep():
    """Notify players who waited too long and remove them from queue."""
    while True:
        try:
            timed_out = matchmaking_manager.get_timed_out_players()
            for player in timed_out:
                await sio.emit('match-timeout', {
                    'message': 'No opponent found. Please try again.',
                    'playerName': player.player_name
                }, room=player.socket_id)
                print(f"[MATCHMAKING] Timeout: {player.player_name} ({player.socket_id})")
        except Exception as e:
            print(f"[ERROR] timeout_sweep: {e}")
        await asyncio.sleep(5)


def start_matchmaking_sweep():
    """Call once from server startup to begin the background sweep."""
    global _sweep_started
    if not _sweep_started:
        _sweep_started = True
        asyncio.create_task(_matchmaking_timeout_sweep())
        print("[MATCHMAKING] Timeout sweep task started")



# ==================== ADMIN REAL-TIME EVENTS ====================

# Admin room for real-time battle updates
ADMIN_ROOM = "admin_battle_monitor"

@sio.event
async def admin_join_monitor(sid, data):
    """
    Admin joins the battle monitoring room for real-time updates.
    Requires super admin verification.
    """
    try:
        token = data.get('token')
        if not token:
            await sio.emit('admin_error', {'error': 'Authentication required'}, room=sid)
            return
        
        # Verify super admin
        from jose import jwt
        import os
        JWT_SECRET = os.environ["JWT_SECRET"]
        JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
        
        user_id = None
        
        # Try session first
        session = await db.user_sessions.find_one({"session_token": token})
        if session:
            user_id = session.get("user_id")
        
        if not user_id:
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                user_id = payload.get("sub")
            except Exception:
                pass
        
        if not user_id:
            await sio.emit('admin_error', {'error': 'Invalid token'}, room=sid)
            return
        
        # Check super admin status
        user = await db.users.find_one({
            "$or": [{"id": user_id}, {"user_id": user_id}]
        })
        
        if not user or (not user.get("is_super_admin") and user.get("role") != "super_admin"):
            await sio.emit('admin_error', {'error': 'Super Admin access required'}, room=sid)
            return
        
        # Join admin monitoring room
        await sio.enter_room(sid, ADMIN_ROOM)
        print(f"[ADMIN] Super Admin {user.get('name', user_id)} joined battle monitor")
        
        await sio.emit('admin_joined', {
            'success': True,
            'message': 'Connected to battle monitor'
        }, room=sid)
        
    except Exception as e:
        print(f"[ERROR] admin_join_monitor: {e}")
        await sio.emit('admin_error', {'error': str(e)}, room=sid)


@sio.event
async def admin_leave_monitor(sid, data=None):
    """Admin leaves the battle monitoring room."""
    await sio.leave_room(sid, ADMIN_ROOM)
    print(f"[ADMIN] Admin {sid} left battle monitor")


async def notify_admins_battle_started(room_id: str, battle_data: dict):
    """Notify admins when a new battle starts."""
    try:
        await sio.emit('admin_battle_started', {
            'room_id': room_id,
            'battle': battle_data,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }, room=ADMIN_ROOM)
    except Exception as e:
        print(f"[ERROR] notify_admins_battle_started: {e}")


async def notify_admins_battle_ended(room_id: str, result_data: dict):
    """Notify admins when a battle ends."""
    try:
        await sio.emit('admin_battle_ended', {
            'room_id': room_id,
            'result': result_data,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }, room=ADMIN_ROOM)
    except Exception as e:
        print(f"[ERROR] notify_admins_battle_ended: {e}")


async def notify_admins_new_report(report_data: dict):
    """Notify admins of a new battle report."""
    try:
        await sio.emit('admin_new_report', {
            'report': report_data,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }, room=ADMIN_ROOM)
    except Exception as e:
        print(f"[ERROR] notify_admins_new_report: {e}")


# Export notification functions for use in routes
__all__ = ['sio', 'socket_app', 'start_matchmaking_sweep', 'init_socketio_db',
           'notify_admins_battle_started', 'notify_admins_battle_ended', 'notify_admins_new_report']
