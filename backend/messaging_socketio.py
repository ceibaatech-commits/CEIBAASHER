"""
Messaging Socket.IO — real-time chat delivery
Mounted at /api/messagews
"""
import socketio
from typing import Dict, Set

messaging_sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False,
    ping_interval=25,
    ping_timeout=60,
)

messaging_socket_app = socketio.ASGIApp(messaging_sio, socketio_path='')

db = None
# user_id -> set of sids
online_users: Dict[str, Set[str]] = {}
# sid -> user_id
sid_user: Dict[str, str] = {}


def init_messaging_socketio_db(database):
    global db
    db = database


@messaging_sio.event
async def connect(sid, environ):
    return True


@messaging_sio.event
async def disconnect(sid):
    uid = sid_user.pop(sid, None)
    if uid and uid in online_users:
        online_users[uid].discard(sid)
        if not online_users[uid]:
            del online_users[uid]


@messaging_sio.event
async def authenticate(sid, data):
    """Client sends {token} after connecting."""
    import jwt
    import os
    token = data.get("token", "")
    try:
        payload = jwt.decode(token, os.getenv("JWT_SECRET", "ceibaa-secret-key"), algorithms=["HS256"])
        uid = payload.get("sub")
        if not uid:
            return
        sid_user[sid] = uid
        online_users.setdefault(uid, set()).add(sid)

        # Auto-join all active conversation rooms
        if db:
            convs = await db.conversations.find({"participants": uid}, {"_id": 0, "id": 1}).to_list(100)
            for c in convs:
                messaging_sio.enter_room(sid, c["id"])
    except Exception:
        pass


@messaging_sio.event
async def join_conversation(sid, data):
    """Explicitly join a conversation room."""
    conv_id = data.get("conversation_id")
    if conv_id:
        messaging_sio.enter_room(sid, conv_id)


@messaging_sio.event
async def leave_conversation(sid, data):
    conv_id = data.get("conversation_id")
    if conv_id:
        messaging_sio.leave_room(sid, conv_id)


@messaging_sio.event
async def typing(sid, data):
    """Broadcast typing indicator to the conversation room."""
    conv_id = data.get("conversation_id")
    uid = sid_user.get(sid)
    if conv_id and uid:
        await messaging_sio.emit("user_typing", {"user_id": uid, "conversation_id": conv_id}, room=conv_id, skip_sid=sid)


@messaging_sio.event
async def stop_typing(sid, data):
    conv_id = data.get("conversation_id")
    uid = sid_user.get(sid)
    if conv_id and uid:
        await messaging_sio.emit("user_stop_typing", {"user_id": uid, "conversation_id": conv_id}, room=conv_id, skip_sid=sid)
