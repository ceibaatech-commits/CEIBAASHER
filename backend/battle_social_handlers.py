"""battle_social_handlers.py — chat, reactions, gifts, matchmaking.
"""
from battle_shared import (
    sio, db, user_activity, _reaction_last_emit_ms, GIFT_COSTS,
    room_manager, matchmaking_manager,
    _validate_gift_request, generate_random_id, handle_user_leave,
    _matchmaking_timeout_sweep,
)
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

@sio.on('find-match')
async def find_match(sid, data):
    """Find a match for quiz battle — optimized with bucket queues"""
    print(f"[MATCHMAKING] find-match from {sid}")
    try:
        player_name = data.get('playerName', 'Player')
        exam = data.get('exam', '')
        subject = data.get('subject', '')
        # topic is available but not used for matching (we match on exam level)
        _ = data.get('topic', '')

        # O(1) match lookup via bucket queue
        opponent = matchmaking_manager.add_to_queue(sid, player_name, exam, subject)

        if opponent:
            # Instant match — create room immediately
            room_id = f"room_{int(datetime.now(timezone.utc).timestamp())}_{generate_random_id()}"

            player1_data = {'socketId': sid, 'playerName': player_name, 'score': 0}
            player2_data = {'socketId': opponent.socket_id, 'playerName': opponent.player_name, 'score': 0}

            matchmaking_manager.create_battle(room_id, player1_data, player2_data, exam, subject)

            await sio.enter_room(sid, room_id)
            await sio.enter_room(opponent.socket_id, room_id)

            await sio.emit('match-found', {
                'roomId': room_id,
                'players': [
                    {'playerName': player_name},
                    {'playerName': opponent.player_name}
                ],
                'exam': exam,
                'subject': subject
            }, room=room_id)

            print(f"[MATCHMAKING] Instant match: Room {room_id}")

            # Persist to live_battles collection for admin panel
            battle_doc = {
                "id": room_id,
                "room_id": room_id,
                "type": "1v1",
                "status": "in_progress",
                "players": [
                    {"user_id": sid, "username": player_name, "score": 0},
                    {"user_id": opponent.socket_id, "username": opponent.player_name, "score": 0}
                ],
                "exam": exam,
                "subject": subject,
                "total_questions": 10,
                "duration_seconds": 0,
                "started_at": datetime.now(timezone.utc).isoformat(),
                "ended_at": None,
                "winner_id": None,
                "is_demo": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            try:
                await db.live_battles.insert_one(battle_doc.copy())
                await notify_admins_battle_started(room_id, battle_doc)
            except Exception as e:
                print(f"[MATCHMAKING] Failed to persist battle: {e}")
        else:
            # Send queue info so frontend can show position
            queue_size = matchmaking_manager.get_queue_size(exam, subject)
            await sio.emit('waiting', {
                'message': 'Looking for opponent...',
                'queueSize': queue_size,
                'timeout': 30
            }, room=sid)

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


@sio.on('battle-complete')
async def battle_complete(sid, data):
    """Handle battle completion for 1v1 matchmaking"""
    try:
        room_id = data.get('roomId')
        player_name = data.get('playerName', 'Player')
        raw_final_score = data.get('finalScore', 0)
        user_id = data.get('userId')
        total_questions = data.get('totalQuestions', 10)
        exam = data.get('exam', '')
        subject = data.get('subject', '')

        # ── Server-side score validation (Feb 2026) ──
        # Mirrors the frontend scoring equation: max 100 pts/question.
        # Anything outside [0, total_questions × 100] is clamped — prevents
        # tampered or buggy clients from posting impossible scores.
        try:
            total_questions = int(total_questions) if total_questions else 10
        except (TypeError, ValueError):
            total_questions = 10
        total_questions = max(1, min(100, total_questions))   # sanity bounds
        max_battle_score = total_questions * 100              # MAX_PER_QUESTION
        try:
            final_score = int(raw_final_score)
        except (TypeError, ValueError):
            final_score = 0
        final_score = max(0, min(max_battle_score, final_score))
        
        battle = matchmaking_manager.get_battle(room_id)
        if not battle:
            return
            
        # Update final score
        if battle.player1['socketId'] == sid:
            battle.player1['finalScore'] = final_score
            user_id = user_id or battle.player1.get('userId')
        elif battle.player2['socketId'] == sid:
            battle.player2['finalScore'] = final_score
            user_id = user_id or battle.player2.get('userId')
        
        # Save to user_battle_history for stats tracking
        if user_id:
            try:
                # Fetch user name
                user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
                u_name = user_doc.get("name", player_name) if user_doc else player_name
                
                await db.user_battle_history.insert_one({
                    "user_id": user_id,
                    "user_name": u_name,
                    "battle_type": "1v1",
                    "room_id": room_id,
                    "score": final_score,
                    "total_questions": total_questions or 10,
                    "exam": exam or battle.exam or "",
                    "subject": subject or battle.subject or "",
                    "opponent_name": battle.player2['playerName'] if battle.player1['socketId'] == sid else battle.player1['playerName'],
                    "completed_at": datetime.now(timezone.utc).isoformat()
                })
                print(f"[BATTLE_COMPLETE] Saved history for {user_id}")
            except Exception as e:
                print(f"[BATTLE_COMPLETE] Failed to save history: {str(e)}")
            
        # Notify opponent
        await sio.emit('opponent-score-update', {
            'playerName': player_name,
            'score': final_score
        }, room=room_id, skip_sid=sid)
        
        print(f"[BATTLE_COMPLETE] {player_name} finished with {final_score} pts in {room_id}")

        # Update live_battles in DB for admin panel
        try:
            await db.live_battles.update_one(
                {"room_id": room_id},
                {"$set": {
                    "status": "completed",
                    "ended_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                },
                "$push": {
                    "player_sessions": {
                        "user_id": user_id,
                        "username": player_name,
                        "final_score": final_score,
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }
                }}
            )
            await notify_admins_battle_ended(room_id, {
                "player_name": player_name,
                "final_score": final_score
            })
        except Exception as e:
            print(f"[BATTLE_COMPLETE] Failed to update live_battles: {e}")
        
    except Exception as e:
        print(f"[ERROR] battle_complete: {str(e)}")


# ==================== WEBRTC SIGNALING EVENTS ====================

