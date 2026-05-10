"""
Messaging Socket.IO — real-time chat delivery
Mounted at /api/messagews
"""
import os
import socketio
from http.cookies import SimpleCookie
from typing import Dict, Set, Optional

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


def _decode_token(token: str) -> Optional[str]:
    """Return user_id from a JWT token, or None on failure."""
    if not token:
        return None
    import jwt
    secret = os.getenv("JWT_SECRET", "ceibaa-secret-key")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload.get("sub")
    except Exception:
        return None


def _cookie_token_from_environ(environ) -> Optional[str]:
    """Pull session_token cookie from the websocket handshake headers."""
    raw = environ.get("HTTP_COOKIE", "") if environ else ""
    if not raw:
        return None
    try:
        jar = SimpleCookie()
        jar.load(raw)
        m = jar.get("session_token")
        return m.value if m else None
    except Exception:
        return None


async def _bind_user_to_sid(sid: str, uid: str) -> None:
    sid_user[sid] = uid
    online_users.setdefault(uid, set()).add(sid)
    # Auto-join all active conversation rooms
    if db:
        convs = await db.conversations.find({"participants": uid}, {"_id": 0, "id": 1}).to_list(100)
        for c in convs:
            messaging_sio.enter_room(sid, c["id"])


@messaging_sio.event
async def connect(sid, environ):
    # Cookie-based auto-auth: if the user is already signed in via httpOnly
    # session_token cookie, bind them immediately so they don't need to
    # explicitly call `authenticate` (which required a localStorage JWT that
    # no longer exists post Stage-3 migration).
    token = _cookie_token_from_environ(environ)
    uid = _decode_token(token)
    if uid:
        await _bind_user_to_sid(sid, uid)
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
    """Legacy explicit-auth fallback. Client sends {token} after connecting.
    No-op when cookie-auth already bound the sid in `connect`.
    """
    if sid in sid_user:
        return
    uid = _decode_token((data or {}).get("token", ""))
    if uid:
        await _bind_user_to_sid(sid, uid)


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
