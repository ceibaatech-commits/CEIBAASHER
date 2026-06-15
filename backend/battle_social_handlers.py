"""battle_social_handlers.py — chat, reactions, gifts, matchmaking.
"""
from battle_shared import (
    sio, user_activity, _reaction_last_emit_ms, GIFT_COSTS,
    room_manager, matchmaking_manager,
    _validate_gift_request, generate_random_id, handle_user_leave,
    _matchmaking_timeout_sweep,
    notify_admins_battle_started, notify_admins_battle_ended,
)
# NOTE: do NOT `from battle_shared import db` — that binds None at import time
# (init_socketio_db rebinds battle_shared.db AFTER this module is imported),
# which silently broke every db write in this file. database.db is always live.
from database import db
from datetime import datetime, timezone
import asyncio, os, string, secrets

@sio.event
async def send_message(sid, data):
    """Send chat message"""
    try:
        # Track activity
        user_activity[sid] = datetime.now(timezone.utc).timestamp()
        
        room_id = data.get('roomId') or data.get('pin')
        message = data.get('message')

        room = await room_manager.get_room(room_id)
        if not room:
            return

        # Get user data
        session = await sio.get_session(sid)
        user_data = session.get('userData', {}) if session else {}

        chat_message = {
            'userId': sid,
            'username': user_data.get('username', 'Anonymous'),
            'message': message,
            'timestamp': datetime.now(timezone.utc).timestamp()
        }

        await sio.emit('new_message', chat_message, room=room_id)

    except Exception as e:
        print(f"[ERROR] send_message: {str(e)}")


@sio.event
async def send_reaction(sid, data):
    """Send reaction/emoji.

    Per-user throttle: each socket can emit at most one reaction every
    600ms. Excess events are silently dropped server-side so a single
    user can't spam the floating-emoji layer.
    """
    try:
        # Track activity
        user_activity[sid] = datetime.now(timezone.utc).timestamp()

        room_id = data.get('roomId') or data.get('pin')
        # Frontend sends { roomId, emoji, sender }; keep both keys for robustness
        reaction = data.get('reaction') or data.get('emoji')
        if not room_id or not reaction:
            return

        # ── Throttle (600 ms per user) ───────────────────────────
        now_ms = datetime.now(timezone.utc).timestamp() * 1000
        last_ms = _reaction_last_emit_ms.get(sid, 0)
        if now_ms - last_ms < 600:
            return
        _reaction_last_emit_ms[sid] = now_ms

        room = await room_manager.get_room(room_id)
        if not room:
            return

        # Get user data
        session = await sio.get_session(sid)
        user_data = session.get('userData', {}) if session else {}

        await sio.emit('new_reaction', {
            'userId': sid,
            'username': user_data.get('username', 'Anonymous'),
            'playerName': user_data.get('username', 'Anonymous'),  # legacy alias
            'reaction': reaction,
            'emoji': reaction,                                      # match frontend prop
            'timestamp': datetime.now(timezone.utc).timestamp(),
        }, room=room_id)

    except Exception as e:
        print(f"[ERROR] send_reaction: {str(e)}")


@sio.event
async def send_gift(sid, data):
    """Handle virtual gift sending between players.

    Frontend emits: socket.emit('send-gift', { pin, recipientId, giftType })

    Rules (from test_result.md):
    - 4 gift types: Star, Diamond, Crown, Trophy
    - Sender pays full cost, recipient gets 50% of cost as points
    - Leaderboard updates in real-time
    """
    try:
        room_id = data.get('pin') or data.get('roomId')
        recipient_id = data.get('recipientId')
        gift_type = (data.get('giftType') or '').lower()

        room = await room_manager.get_room(room_id)

        cost, err = _validate_gift_request(room, sid, recipient_id, gift_type)
        if err:
            await sio.emit('gift-error', {'message': err}, room=sid)
            return

        # Apply transfer: sender pays full cost, recipient gets 50%
        room.update_score(sid, -cost)
        recipient_reward = int(cost * 0.5)
        room.update_score(recipient_id, recipient_reward)

        leaderboard = room.get_leaderboard()

        sender_name = next((p.username for p in room.participants if p.user_id == sid), 'You')
        recipient_name = next((p.username for p in room.participants if p.user_id == recipient_id), 'Player')

        payload = {
            'roomId': room_id,
            'fromUserId': sid, 'toUserId': recipient_id,
            'fromUsername': sender_name, 'toUsername': recipient_name,
            'giftType': gift_type, 'cost': cost,
            'recipientReward': recipient_reward,
            'leaderboard': leaderboard
        }

        await sio.emit('gift-sent', payload, room=sid)
        await sio.emit('gift-received', payload, room=recipient_id)
        await sio.emit('leaderboard_update', {'leaderboard': leaderboard}, room=room_id)
        await room_manager.save_room_to_db(room)

        print(f"[GIFT] {sender_name} ({sid}) sent {gift_type} to {recipient_name} ({recipient_id}) in room {room_id}")

    except Exception as e:
        print(f"[ERROR] send_gift: {str(e)}")
        await sio.emit('gift-error', {'message': 'Failed to send gift'}, room=sid)


@sio.event
async def heartbeat(sid, data=None):
    """Handle heartbeat/keep-alive signal from client.
    
    This prevents timeout disconnections during quiz play.
    Frontend sends this every 10 seconds to keep connection alive.
    """
    try:
        # Update activity timestamp
        user_activity[sid] = datetime.now(timezone.utc).timestamp()
        
        # Optional: Send acknowledgment back
        await sio.emit('heartbeat_ack', {'timestamp': datetime.now(timezone.utc).timestamp()}, room=sid)
        
    except Exception as e:
        print(f"[ERROR] heartbeat: {str(e)}")


@sio.event
async def leave_room(sid, data):
    """Leave a room"""
    room_id = data.get('roomId') or data.get('pin')
    await handle_user_leave(sid, room_id)


# ==================== MATCHMAKING EVENTS ====================


def _build_live_battle_doc(room_id, sid, player_name, opponent, exam, subject, my_user_id=None, my_username=None):
    """Build the live_battles document. Pure function — no I/O."""
    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        "id": room_id, "room_id": room_id, "type": "1v1", "status": "in_progress",
        "players": [
            {"socket_id": sid, "user_id": my_user_id, "username": my_username or player_name, "player_name": player_name, "score": 0},
            {"socket_id": opponent.socket_id, "user_id": opponent.user_id, "username": opponent.username or opponent.player_name, "player_name": opponent.player_name, "score": 0},
        ],
        "exam": exam, "subject": subject,
        "total_questions": 10, "duration_seconds": 0,
        "started_at": now_iso, "ended_at": None,
        "winner_id": None, "is_demo": False,
        "created_at": now_iso, "updated_at": now_iso,
    }


async def _emit_match_found(sid, opponent, room_id, player_name, exam, subject, my_user_id=None, my_username=None):
    """Create the socket-io room, emit match-found event."""
    await sio.enter_room(sid, room_id)
    await sio.enter_room(opponent.socket_id, room_id)
    # Per-player payload so each side knows both their own + opponent ids
    p_self = {
        'socketId': sid, 'playerName': player_name,
        'userId': my_user_id, 'username': my_username,
    }
    p_opp = {
        'socketId': opponent.socket_id, 'playerName': opponent.player_name,
        'userId': opponent.user_id, 'username': opponent.username,
    }
    await sio.emit('match-found', {
        'roomId': room_id,
        'players': [p_self, p_opp],
        'exam': exam, 'subject': subject,
    }, room=sid)
    await sio.emit('match-found', {
        'roomId': room_id,
        'players': [p_opp, p_self],
        'exam': exam, 'subject': subject,
    }, room=opponent.socket_id)


async def _persist_live_battle(room_id, battle_doc):
    """Persist the doc + notify admins. Best-effort — does not break match flow."""
    try:
        await db.live_battles.insert_one(battle_doc.copy())
        await notify_admins_battle_started(room_id, battle_doc)
    except Exception as e:
        print(f"[MATCHMAKING] Failed to persist battle: {e}")


async def _emit_waiting(sid, exam, subject):
    """Inform a player they're in the queue."""
    queue_size = matchmaking_manager.get_queue_size(exam, subject)
    await sio.emit('waiting', {
        'message': 'Looking for opponent...',
        'queueSize': queue_size,
        'timeout': 30,
    }, room=sid)


@sio.on('find-match')
async def find_match(sid, data):
    """Find a match for quiz battle — optimized with bucket queues."""
    print(f"[MATCHMAKING] find-match from {sid}")
    try:
        player_name = data.get('playerName', 'Player')
        exam = data.get('exam', '')
        subject = data.get('subject', '')
        # topic is available but not used for matching (we match on exam level)
        _ = data.get('topic', '')

        # Pull authenticated user info from session (set via `authenticate` event)
        my_user_id = None
        my_username = None
        try:
            session = await sio.get_session(sid)
            user_data = (session or {}).get('userData') or {}
            my_user_id = user_data.get('id') or user_data.get('user_id') or user_data.get('userId')
            my_username = user_data.get('username') or user_data.get('name')
        except Exception:
            pass

        # Fetch blocked user ids (both directions) so matchmaking skips them
        blocked_user_ids: set = set()
        if my_user_id:
            try:
                async for b in db.blocks.find(
                    {"$or": [{"blocker_id": my_user_id}, {"blocked_id": my_user_id}]},
                    {"_id": 0, "blocker_id": 1, "blocked_id": 1},
                ):
                    blocked_user_ids.add(b["blocked_id"] if b["blocker_id"] == my_user_id else b["blocker_id"])
                blocked_user_ids.discard(my_user_id)
            except Exception as e:
                print(f"[MATCHMAKING] Failed to load blocks for {my_user_id}: {e}")

        opponent = matchmaking_manager.add_to_queue(
            sid, player_name, exam, subject,
            user_id=my_user_id, username=my_username,
            blocked_user_ids=blocked_user_ids,
        )
        if not opponent:
            await _emit_waiting(sid, exam, subject)
            return

        # Instant match — create room immediately
        room_id = f"room_{int(datetime.now(timezone.utc).timestamp())}_{generate_random_id()}"
        player1_data = {
            'socketId': sid, 'playerName': player_name, 'score': 0,
            'userId': my_user_id, 'username': my_username,
        }
        player2_data = {
            'socketId': opponent.socket_id, 'playerName': opponent.player_name, 'score': 0,
            'userId': opponent.user_id, 'username': opponent.username,
        }
        matchmaking_manager.create_battle(room_id, player1_data, player2_data, exam, subject)

        await _emit_match_found(sid, opponent, room_id, player_name, exam, subject, my_user_id, my_username)
        print(f"[MATCHMAKING] Instant match: Room {room_id}")

        battle_doc = _build_live_battle_doc(room_id, sid, player_name, opponent, exam, subject, my_user_id, my_username)
        await _persist_live_battle(room_id, battle_doc)

    except Exception as e:
        print(f"[ERROR] find_match: {str(e)}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.on('cancel-match')
async def cancel_match(sid, data=None):
    """Cancel matchmaking"""
    try:
        removed = matchmaking_manager.remove_from_queue(sid)
        if removed:
            print(f"[MATCHMAKING] Player {sid} cancelled matchmaking")
            await sio.emit('match-cancelled', {'success': True}, room=sid)
    except Exception as e:
        print(f"[ERROR] cancel_match: {str(e)}")


# ==================== REMATCH FLOW ====================
# When a 1v1 battle ends, either player can request a rematch from the results
# screen. The opponent has 30 seconds to accept; if both click rematch within
# that window we skip the matchmaking queue and create a fresh room directly.
#
# In-memory only — once both sockets disconnect, this state is dropped.
# Shape: { old_room_id: {requester_sid, opponent_sid, expires_at, timeout_task} }
pending_rematches: dict = {}
REMATCH_TIMEOUT_SECONDS = 30


async def _expire_rematch(room_id: str):
    """Auto-cleanup a pending rematch after the timeout. Notifies the requester."""
    try:
        await asyncio.sleep(REMATCH_TIMEOUT_SECONDS)
        pending = pending_rematches.pop(room_id, None)
        if pending and pending.get('requester_sid'):
            await sio.emit('rematch-timeout', {'roomId': room_id}, room=pending['requester_sid'])
            print(f"[REMATCH] Timeout for room {room_id}")
    except asyncio.CancelledError:
        pass  # Cancelled because opponent accepted/declined in time
    except Exception as e:
        print(f"[REMATCH] expire error: {e}")


def _get_battle_players(room_id: str):
    """Return (p1, p2) from active_battles (dicts with socketId/playerName/userId/username)."""
    battle = matchmaking_manager.get_battle(room_id)
    if not battle:
        return None, None
    return battle.player1, battle.player2


@sio.on('rematch-request')
async def rematch_request(sid, data):
    """Player asks their opponent for a rematch (post-battle results screen)."""
    try:
        room_id = data.get('roomId')
        if not room_id:
            return
        p1, p2 = _get_battle_players(room_id)
        if not p1 or not p2:
            await sio.emit('rematch-declined', {'roomId': room_id, 'reason': 'Battle expired'}, room=sid)
            return

        # Identify requester vs opponent by socket_id
        if p1.get('socketId') == sid:
            requester, opponent = p1, p2
        elif p2.get('socketId') == sid:
            requester, opponent = p2, p1
        else:
            return

        existing = pending_rematches.get(room_id)
        # If the OTHER side already requested, this click = mutual consent → auto-confirm
        if existing and existing.get('requester_sid') == opponent.get('socketId'):
            task = existing.get('timeout_task')
            if task:
                task.cancel()
            pending_rematches.pop(room_id, None)
            await _create_rematch_room(room_id, requester, opponent)
            return

        # Otherwise: first request — notify the opponent and start the 30s clock
        task = asyncio.create_task(_expire_rematch(room_id))
        pending_rematches[room_id] = {
            'requester_sid': sid,
            'opponent_sid': opponent.get('socketId'),
            'timeout_task': task,
        }
        await sio.emit('rematch-requested', {
            'roomId': room_id,
            'requesterName': requester.get('playerName'),
            'requesterUserId': requester.get('userId'),
            'expiresIn': REMATCH_TIMEOUT_SECONDS,
        }, room=opponent.get('socketId'))
        await sio.emit('rematch-pending', {'roomId': room_id, 'expiresIn': REMATCH_TIMEOUT_SECONDS}, room=sid)
        print(f"[REMATCH] {requester.get('playerName')} requested rematch in room {room_id}")
    except Exception as e:
        print(f"[ERROR] rematch_request: {e}")


@sio.on('rematch-accept')
async def rematch_accept(sid, data):
    """Opponent accepted the rematch — create a fresh room and notify both."""
    try:
        room_id = data.get('roomId')
        if not room_id:
            return
        pending = pending_rematches.pop(room_id, None)
        if not pending:
            await sio.emit('rematch-declined', {'roomId': room_id, 'reason': 'Request expired'}, room=sid)
            return
        task = pending.get('timeout_task')
        if task:
            task.cancel()
        if pending.get('opponent_sid') != sid:
            return  # Only the addressed opponent may accept

        p1, p2 = _get_battle_players(room_id)
        if not p1 or not p2:
            await sio.emit('rematch-declined', {'roomId': room_id, 'reason': 'Battle expired'}, room=sid)
            return

        # Map requester/opponent back to player dicts
        if p1.get('socketId') == pending['requester_sid']:
            requester, opponent = p1, p2
        else:
            requester, opponent = p2, p1
        await _create_rematch_room(room_id, requester, opponent)
    except Exception as e:
        print(f"[ERROR] rematch_accept: {e}")


@sio.on('rematch-decline')
async def rematch_decline(sid, data):
    """Opponent declined — notify requester and clean up."""
    try:
        room_id = data.get('roomId')
        if not room_id:
            return
        pending = pending_rematches.pop(room_id, None)
        if not pending:
            return
        task = pending.get('timeout_task')
        if task:
            task.cancel()
        if pending.get('requester_sid'):
            await sio.emit('rematch-declined', {'roomId': room_id, 'reason': 'Opponent declined'}, room=pending['requester_sid'])
        print(f"[REMATCH] Declined for room {room_id}")
    except Exception as e:
        print(f"[ERROR] rematch_decline: {e}")


async def _create_rematch_room(old_room_id: str, requester: dict, opponent: dict):
    """Bypass matchmaking and create a fresh battle room for the two existing players."""
    new_room_id = f"room_{int(datetime.now(timezone.utc).timestamp())}_{generate_random_id()}"

    # Pull exam/subject from the previous battle so the next quiz uses the same config
    prev = matchmaking_manager.get_battle(old_room_id)
    exam = prev.exam if prev else ''
    subject = prev.subject if prev else ''

    # Build fresh player records (reset scores)
    req_data = {
        'socketId': requester.get('socketId'), 'playerName': requester.get('playerName'), 'score': 0,
        'userId': requester.get('userId'), 'username': requester.get('username'),
    }
    opp_data = {
        'socketId': opponent.get('socketId'), 'playerName': opponent.get('playerName'), 'score': 0,
        'userId': opponent.get('userId'), 'username': opponent.get('username'),
    }
    matchmaking_manager.create_battle(new_room_id, req_data, opp_data, exam, subject)

    # Join both sockets to the new room
    await sio.enter_room(requester['socketId'], new_room_id)
    await sio.enter_room(opponent['socketId'], new_room_id)

    # Per-socket match-found payload (same shape as the initial matchmaking flow)
    await sio.emit('match-found', {
        'roomId': new_room_id,
        'players': [
            {'socketId': req_data['socketId'], 'playerName': req_data['playerName'], 'userId': req_data['userId'], 'username': req_data['username']},
            {'socketId': opp_data['socketId'], 'playerName': opp_data['playerName'], 'userId': opp_data['userId'], 'username': opp_data['username']},
        ],
        'exam': exam, 'subject': subject,
        'rematch': True,
    }, room=req_data['socketId'])
    await sio.emit('match-found', {
        'roomId': new_room_id,
        'players': [
            {'socketId': opp_data['socketId'], 'playerName': opp_data['playerName'], 'userId': opp_data['userId'], 'username': opp_data['username']},
            {'socketId': req_data['socketId'], 'playerName': req_data['playerName'], 'userId': req_data['userId'], 'username': req_data['username']},
        ],
        'exam': exam, 'subject': subject,
        'rematch': True,
    }, room=opp_data['socketId'])

    # Persist new battle doc (best-effort) and drop the previous one
    try:
        battle_doc = {
            "id": new_room_id, "room_id": new_room_id, "type": "1v1", "status": "in_progress",
            "players": [
                {"socket_id": req_data['socketId'], "user_id": req_data['userId'], "username": req_data['username'] or req_data['playerName'], "player_name": req_data['playerName'], "score": 0},
                {"socket_id": opp_data['socketId'], "user_id": opp_data['userId'], "username": opp_data['username'] or opp_data['playerName'], "player_name": opp_data['playerName'], "score": 0},
            ],
            "exam": exam, "subject": subject,
            "total_questions": 10, "duration_seconds": 0,
            "started_at": datetime.now(timezone.utc).isoformat(), "ended_at": None,
            "winner_id": None, "is_demo": False, "is_rematch": True, "parent_room_id": old_room_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await _persist_live_battle(new_room_id, battle_doc)
    except Exception as e:
        print(f"[REMATCH] persist error: {e}")

    # Drop the old battle from active state — it's done
    matchmaking_manager.remove_battle(old_room_id)
    print(f"[REMATCH] Rematch confirmed: {old_room_id} → {new_room_id}")


@sio.on('battle-answer')
async def battle_answer(sid, data):
    """Submit answer in matched battle"""
    try:
        room_id = data.get('roomId')
        question_id = data.get('questionId')
        answer = data.get('answer')
        time_taken = data.get('timeTaken', 0)

        battle = matchmaking_manager.get_battle(room_id)
        if not battle:
            return

        # Update player's last answer
        if battle.player1['socketId'] == sid:
            battle.player1['lastAnswer'] = {
                'questionId': question_id,
                'answer': answer,
                'timeTaken': time_taken
            }
            player_name = battle.player1['playerName']
        elif battle.player2['socketId'] == sid:
            battle.player2['lastAnswer'] = {
                'questionId': question_id,
                'answer': answer,
                'timeTaken': time_taken
            }
            player_name = battle.player2['playerName']
        else:
            return

        # Notify opponent
        await sio.emit('opponent-answered', {
            'playerName': player_name
        }, room=room_id, skip_sid=sid)

    except Exception as e:
        print(f"[ERROR] battle_answer: {str(e)}")


@sio.on('battle-chat')
async def battle_chat(sid, data):
    """Handle chat messages in 1v1 battles"""
    try:
        room_id = data.get('roomId')
        player_name = data.get('playerName', 'Player')
        message = data.get('message', '')
        
        if not room_id or not message:
            return
            
        # Broadcast message to opponent in the room
        await sio.emit('chat-message', {
            'playerName': player_name,
            'message': message,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }, room=room_id, skip_sid=sid)
        
        print(f"[BATTLE_CHAT] {player_name} in {room_id}: {message[:50]}...")
        
    except Exception as e:
        print(f"[ERROR] battle_chat: {str(e)}")


@sio.on('battle-chat-typing')
async def battle_chat_typing(sid, data):
    """Relay typing indicator to the opponent in the room. Chat-only, never gates game state."""
    try:
        room_id = data.get('roomId')
        is_typing = bool(data.get('isTyping', False))
        if not room_id:
            return
        await sio.emit('chat-typing', {'isTyping': is_typing}, room=room_id, skip_sid=sid)
    except Exception as e:
        print(f"[ERROR] battle_chat_typing: {str(e)}")



# ─── battle_complete() helpers ─────────────────────────────────────────────
# Split out from battle_complete() to reduce CC from 20 → ~5 and length from
# 96 → ~25 LOC. Each helper has a single responsibility and absorbs its own
# exceptions so the orchestrator stays linear.

def _validate_and_clamp_score(raw_final_score, total_questions):
    """Server-side score validation — clamp into [0, total_questions × 100].
    Prevents tampered clients from posting impossible scores.
    """
    try:
        tq = int(total_questions) if total_questions else 10
    except (TypeError, ValueError):
        tq = 10
    tq = max(1, min(100, tq))  # sanity bounds
    max_score = tq * 100
    try:
        score = int(raw_final_score)
    except (TypeError, ValueError):
        score = 0
    return max(0, min(max_score, score)), tq


def _apply_score_to_battle(battle, sid, final_score, user_id):
    """Mutate battle in-place with the player's final score. Returns resolved user_id."""
    if battle.player1['socketId'] == sid:
        battle.player1['finalScore'] = final_score
        return user_id or battle.player1.get('userId')
    if battle.player2['socketId'] == sid:
        battle.player2['finalScore'] = final_score
        return user_id or battle.player2.get('userId')
    return user_id


def _resolve_opponent_name(battle, sid):
    return battle.player2['playerName'] if battle.player1['socketId'] == sid else battle.player1['playerName']


async def _save_user_battle_history(user_id, room_id, battle, sid, final_score, total_questions,
                                    exam, subject, player_name):
    """Persist user_battle_history record. Swallow errors — battle UX must continue."""
    if not user_id:
        return
    try:
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
        u_name = user_doc.get("name", player_name) if user_doc else player_name
        await db.user_battle_history.insert_one({
            "user_id": user_id,
            "user_name": u_name,
            "battle_type": "1v1",
            "room_id": room_id,
            "score": final_score,
            "total_questions": total_questions or 10,
            "exam": exam or getattr(battle, 'exam', '') or "",
            "subject": subject or getattr(battle, 'subject', '') or "",
            "opponent_name": _resolve_opponent_name(battle, sid),
            "completed_at": datetime.now(timezone.utc).isoformat(),
        })
        # Canonical test-history record (1v1 points: max 100/question)
        from test_history_service import record_test_attempt
        total_q = total_questions or 10
        opponent_uid = (battle.player2.get('userId')
                        if battle.player1['socketId'] == sid
                        else battle.player1.get('userId'))
        await record_test_attempt(
            db,
            user_id=user_id,
            test_id=room_id,
            test_name=f"1v1 Duel — {exam or getattr(battle, 'exam', '') or 'Quiz'}",
            subject=subject or getattr(battle, 'subject', '') or "Mixed",
            exam_category=exam or getattr(battle, 'exam', '') or "Battle",
            total_marks=total_q * 100,
            marks_obtained=final_score,
            questions_total=total_q,
            is_battle=True,
            opponent_user_id=opponent_uid,
        )
        print(f"[BATTLE_COMPLETE] Saved history for {user_id}")
    except Exception as e:
        print(f"[BATTLE_COMPLETE] Failed to save history: {str(e)}")


async def _mark_live_battle_completed(room_id, user_id, player_name, final_score):
    """Update live_battles doc and notify admins. Swallow errors — best-effort."""
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        await db.live_battles.update_one(
            {"room_id": room_id},
            {
                "$set": {"status": "completed", "ended_at": now_iso, "updated_at": now_iso},
                "$push": {"player_sessions": {
                    "user_id": user_id,
                    "username": player_name,
                    "final_score": final_score,
                    "completed_at": now_iso,
                }},
            },
        )
        await notify_admins_battle_ended(room_id, {"player_name": player_name, "final_score": final_score})
    except Exception as e:
        print(f"[BATTLE_COMPLETE] Failed to update live_battles: {e}")


@sio.on('battle-complete')
async def battle_complete(sid, data):
    """Handle battle completion for 1v1 matchmaking — orchestrator only."""
    try:
        room_id = data.get('roomId')
        player_name = data.get('playerName', 'Player')
        user_id = data.get('userId')
        final_score, total_questions = _validate_and_clamp_score(
            data.get('finalScore', 0), data.get('totalQuestions', 10)
        )

        battle = matchmaking_manager.get_battle(room_id)
        if not battle:
            return

        user_id = _apply_score_to_battle(battle, sid, final_score, user_id)

        await _save_user_battle_history(
            user_id, room_id, battle, sid, final_score, total_questions,
            data.get('exam', ''), data.get('subject', ''), player_name,
        )

        # Notify opponent
        await sio.emit('opponent-score-update',
                       {'playerName': player_name, 'score': final_score},
                       room=room_id, skip_sid=sid)

        print(f"[BATTLE_COMPLETE] {player_name} finished with {final_score} pts in {room_id}")

        await _mark_live_battle_completed(room_id, user_id, player_name, final_score)

    except Exception as e:
        print(f"[ERROR] battle_complete: {str(e)}")


# ==================== WEBRTC SIGNALING EVENTS ====================

