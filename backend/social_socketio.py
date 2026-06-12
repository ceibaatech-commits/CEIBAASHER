"""
Social Feed Socket.IO - Real-time updates for social feed
Handles live likes, comments, posts, and notifications
"""
import socketio
from http.cookies import SimpleCookie
from typing import Dict, Set, Optional
from datetime import datetime, timezone

# Create Socket.IO server
social_sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False,
    ping_interval=25,
    ping_timeout=60
)

# Create ASGI app
social_socket_app = socketio.ASGIApp(social_sio, socketio_path='')

# Database reference
db = None

# Track connected users: {user_id: set(sid)}
connected_users: Dict[str, Set[str]] = {}
# Track which feed tab each connection is viewing
user_feeds: Dict[str, str] = {}  # {sid: feed_tab}


def init_social_socketio_db(database):
    """Initialize database for social Socket.IO"""
    global db
    db = database


async def _uid_from_environ(environ) -> Optional[str]:
    """Resolve the user from the httpOnly session_token cookie sent with the
    websocket handshake. Supports both JWTs (custom login) and opaque
    Emergent-OAuth session tokens (Google login)."""
    raw = environ.get("HTTP_COOKIE", "") if environ else ""
    if not raw:
        return None
    try:
        jar = SimpleCookie()
        jar.load(raw)
        m = jar.get("session_token")
        token = m.value if m else None
    except Exception:
        return None
    if not token:
        return None
    try:
        from utils.auth_helpers import _resolve_user_id
        return await _resolve_user_id(token)
    except Exception:
        return None


async def _register_user(sid: str, uid: str):
    """Track the connection, join the user's private room, then push the
    current unread-notification count so the bell badge is correct
    immediately — replaces the 30-second polling loop."""
    connected_users.setdefault(uid, set()).add(sid)
    await social_sio.enter_room(sid, f"user_{uid}")
    try:
        count = await _compute_unread_notifications_count(uid)
        await social_sio.emit('unread_notifications_count', {'unread_count': count}, room=sid)
    except Exception:
        pass


@social_sio.event
async def connect(sid, environ):
    """Handle client connection — cookie-based auto-auth when available."""
    uid = await _uid_from_environ(environ)
    if uid:
        await _register_user(sid, uid)
    return True


@social_sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"[SOCIAL] Client disconnected: {sid}")
    # Remove from connected users
    for user_id, sids in list(connected_users.items()):
        if sid in sids:
            sids.discard(sid)
            if not sids:
                del connected_users[user_id]
            break
    # Remove feed tracking
    user_feeds.pop(sid, None)


@social_sio.event
async def authenticate(sid, data):
    """Legacy explicit-auth fallback. Harmless re-registration when
    cookie-auth already bound this sid in `connect`."""
    user_id = (data or {}).get('user_id')
    if user_id:
        await _register_user(sid, user_id)
        await social_sio.emit('authenticated', {'status': 'ok'}, room=sid)


@social_sio.event
async def join_feed(sid, data):
    """Join a specific feed room for real-time updates"""
    feed_tab = data.get('tab', 'for_you')
    # Leave previous feed room
    if sid in user_feeds:
        await social_sio.leave_room(sid, f"feed_{user_feeds[sid]}")
    # Join new feed room
    user_feeds[sid] = feed_tab
    await social_sio.enter_room(sid, f"feed_{feed_tab}")
    print(f"[SOCIAL] {sid} joined feed: {feed_tab}")


@social_sio.event
async def leave_feed(sid, data):
    """Leave feed room"""
    if sid in user_feeds:
        await social_sio.leave_room(sid, f"feed_{user_feeds[sid]}")
        del user_feeds[sid]


# ============ BROADCAST FUNCTIONS (called from routes) ============

async def broadcast_new_post(post_data: dict):
    """Broadcast new post to all feed rooms"""
    await social_sio.emit('new_post', post_data, room='feed_for_you')
    await social_sio.emit('new_post', post_data, room='feed_trending')
    print(f"[SOCIAL] Broadcast new post: {post_data.get('id')}")


async def broadcast_post_liked(post_id: str, user_id: str, likes_count: int):
    """Broadcast like update to all clients"""
    await social_sio.emit('post_liked', {
        'post_id': post_id,
        'user_id': user_id,
        'likes_count': likes_count
    })
    print(f"[SOCIAL] Broadcast like: post {post_id}, count {likes_count}")


async def broadcast_post_unliked(post_id: str, user_id: str, likes_count: int):
    """Broadcast unlike update"""
    await social_sio.emit('post_unliked', {
        'post_id': post_id,
        'user_id': user_id,
        'likes_count': likes_count
    })


async def broadcast_new_comment(post_id: str, comment_data: dict, comments_count: int):
    """Broadcast new comment"""
    await social_sio.emit('new_comment', {
        'post_id': post_id,
        'comment': comment_data,
        'comments_count': comments_count
    })
    print(f"[SOCIAL] Broadcast comment on post: {post_id}")


async def broadcast_post_shared(post_id: str, shares_count: int):
    """Broadcast share count update"""
    await social_sio.emit('post_shared', {
        'post_id': post_id,
        'shares_count': shares_count
    })


async def send_notification(user_id: str, notification: dict):
    """Send real-time notification to specific user"""
    if user_id in connected_users:
        # Strip Mongo's ObjectId — it isn't JSON serializable over Socket.IO
        payload = {k: v for k, v in notification.items() if k != '_id'}
        await social_sio.emit('notification', payload, room=f"user_{user_id}")
        print(f"[SOCIAL] Sent notification to user: {user_id}")
    # Badge count changed regardless of whether the doc payload was delivered
    await emit_unread_notifications_count(user_id)


async def _compute_unread_notifications_count(uid: str) -> int:
    if db is None or not uid:
        return 0
    return await db.notifications.count_documents({"user_id": uid, "is_read": False})


async def emit_unread_notifications_count(uid: str) -> None:
    """Push the user's current unread-notification count to all their open
    sockets. Best-effort no-op when the user is offline — replaces the
    30-second `/api/notifications/unread-count` polling loop."""
    if not uid or uid not in connected_users or not connected_users[uid]:
        return
    try:
        count = await _compute_unread_notifications_count(uid)
        await social_sio.emit('unread_notifications_count', {'unread_count': count}, room=f"user_{uid}")
    except Exception:
        pass


@social_sio.event
async def request_unread_notifications_count(sid, data=None):
    """Client-driven sync after (re)connect."""
    for uid, sids in connected_users.items():
        if sid in sids:
            count = await _compute_unread_notifications_count(uid)
            await social_sio.emit('unread_notifications_count', {'unread_count': count}, room=sid)
            return


async def broadcast_user_followed(follower_id: str, following_id: str, follower_name: str):
    """Notify user when someone follows them"""
    notification = {
        'type': 'new_follower',
        'follower_id': follower_id,
        'follower_name': follower_name,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    await send_notification(following_id, notification)


async def broadcast_post_deleted(post_id: str):
    """Broadcast post deletion"""
    await social_sio.emit('post_deleted', {'post_id': post_id})
