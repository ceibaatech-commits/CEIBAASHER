"""
Ceibaa Messaging Engine — MongoDB + Socket.IO real-time chat
Collections: conversations, messages
"""
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import os
import uuid
import jwt

router = APIRouter()
db = None


def init_db(database):
    global db
    db = database


# --------------- helpers ---------------
def _extract_token(request: Optional[Request], authorization: Optional[str]) -> Optional[str]:
    """Cookie-first, Bearer-fallback (matches utils.auth_helpers pattern)."""
    if request is not None:
        cookie_token = request.cookies.get("session_token")
        if cookie_token:
            return cookie_token
    if authorization and authorization.startswith("Bearer "):
        return authorization[len("Bearer "):]
    return None


async def _get_user_id(authorization: Optional[str] = None, request: Optional[Request] = None):
    token = _extract_token(request, authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    secret = os.environ["JWT_SECRET"]
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id:
            return user_id
    except Exception:
        pass
    # Opaque Emergent-OAuth session tokens (Google login)
    try:
        from utils.auth_helpers import _user_id_from_session
        uid = await _user_id_from_session(token)
        if uid:
            return uid
    except Exception:
        pass
    raise HTTPException(status_code=401, detail="Invalid token")


async def _enrich_user(user_id: str):
    """Return slim user info dict."""
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "name": 1, "username": 1, "profile_picture": 1, "avatar": 1})
    if not u:
        return {"id": user_id, "name": "Unknown", "username": "unknown", "avatar": None}
    return {
        "id": u["id"],
        "name": u.get("name", "Unknown"),
        "username": u.get("username", "unknown"),
        "avatar": u.get("profile_picture") or u.get("avatar"),
    }


# --------------- models ---------------
class CreateConversationReq(BaseModel):
    target_user_id: str


class SendMessageReq(BaseModel):
    text: str


class CreateGroupReq(BaseModel):
    name: str
    member_ids: List[str]


class AddMemberReq(BaseModel):
    user_id: str


# --------------- group helpers ---------------
async def _connection_ids(user_id: str) -> set:
    """Users connected to `user_id` via an approved follow (either direction)."""
    ids = set()
    async for f in db.follows.find(
        {"status": "approved", "$or": [{"follower_id": user_id}, {"following_id": user_id}]},
        {"_id": 0, "follower_id": 1, "following_id": 1},
    ):
        ids.add(f["follower_id"] if f["follower_id"] != user_id else f["following_id"])
    ids.discard(user_id)
    return ids


async def _system_message(conversation_id: str, text: str):
    """Insert + broadcast a centered system line (e.g. 'X added Y')."""
    now = datetime.now(timezone.utc).isoformat()
    msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "sender_id": None,
        "system": True,
        "text": text,
        "timestamp": now,
        "delivered": True,
        "read": True,
    }
    await db.messages.insert_one({**msg, "_id": msg["id"]})
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"last_message": None, "last_message_text": text[:100], "last_message_at": now}},
    )
    try:
        from messaging_socketio import messaging_sio
        await messaging_sio.emit("new_message", msg, room=conversation_id)
    except Exception:
        pass
    return msg


# --------------- endpoints ---------------

@router.post("/conversations")
async def create_or_get_conversation(body: CreateConversationReq, request: Request, authorization: Optional[str] = Header(None)):
    """Create a 1-on-1 conversation or return existing one."""
    user_id = await _get_user_id(authorization, request)
    target_id = body.target_user_id

    if user_id == target_id:
        raise HTTPException(400, "Cannot message yourself")

    # Check target exists
    target = await db.users.find_one({"id": target_id}, {"_id": 0, "id": 1})
    if not target:
        raise HTTPException(404, "User not found")

    participants = sorted([user_id, target_id])

    existing = await db.conversations.find_one(
        {"participants": participants},
        {"_id": 0}
    )
    if existing:
        return {"success": True, "conversation": existing}

    conv = {
        "id": str(uuid.uuid4()),
        "participants": participants,
        "last_message": None,
        "last_message_text": None,
        "last_message_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "unread_counts": {user_id: 0, target_id: 0},
    }
    await db.conversations.insert_one({**conv, "_id": conv["id"]})
    return {"success": True, "conversation": conv}


# --------------- group endpoints ---------------

@router.get("/connections")
async def list_connections(request: Request, authorization: Optional[str] = Header(None)):
    """People you can start groups with: approved follows, either direction."""
    user_id = await _get_user_id(authorization, request)
    ids = await _connection_ids(user_id)
    users = [await _enrich_user(uid) for uid in ids]
    users.sort(key=lambda u: (u.get("name") or "").lower())
    return {"success": True, "connections": users}


@router.post("/groups")
async def create_group(body: CreateGroupReq, request: Request, authorization: Optional[str] = Header(None)):
    """Create a group conversation with members from your followers/following."""
    user_id = await _get_user_id(authorization, request)
    name = body.name.strip()
    if not name or len(name) > 50:
        raise HTTPException(400, "Group name must be 1-50 characters")
    member_ids = [m for m in dict.fromkeys(body.member_ids) if m and m != user_id]
    if not member_ids:
        raise HTTPException(400, "Pick at least one member")

    allowed = await _connection_ids(user_id)
    if any(m not in allowed for m in member_ids):
        raise HTTPException(400, "You can only add your followers/following to a group")

    participants = [user_id] + member_ids
    now = datetime.now(timezone.utc).isoformat()
    conv = {
        "id": str(uuid.uuid4()),
        "is_group": True,
        "name": name,
        "participants": participants,
        "created_by": user_id,
        "last_message": None,
        "last_message_text": None,
        "last_message_at": now,
        "created_at": now,
        "unread_counts": {p: 0 for p in participants},
    }
    await db.conversations.insert_one({**conv, "_id": conv["id"]})

    creator = await _enrich_user(user_id)
    await _system_message(conv["id"], f"{creator['name']} created the group \"{name}\"")

    # Join online members' sockets to the new room + refresh their sidebars
    try:
        from messaging_socketio import join_users_to_conversation
        await join_users_to_conversation(conv["id"], participants)
    except Exception:
        pass
    return {"success": True, "conversation": conv}


@router.post("/groups/{conversation_id}/members")
async def add_group_member(conversation_id: str, body: AddMemberReq, request: Request, authorization: Optional[str] = Header(None)):
    """Any group member can add people from their own followers/following."""
    user_id = await _get_user_id(authorization, request)
    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv or not conv.get("is_group"):
        raise HTTPException(404, "Group not found")
    if user_id not in conv.get("participants", []):
        raise HTTPException(403, "Access denied")

    new_id = body.user_id
    if new_id in conv["participants"]:
        raise HTTPException(400, "Already a member")
    allowed = await _connection_ids(user_id)
    if new_id not in allowed:
        raise HTTPException(400, "You can only invite your followers/following")
    target = await db.users.find_one({"id": new_id}, {"_id": 0, "id": 1})
    if not target:
        raise HTTPException(404, "User not found")

    await db.conversations.update_one(
        {"id": conversation_id},
        {"$push": {"participants": new_id}, "$set": {f"unread_counts.{new_id}": 0}},
    )
    inviter = await _enrich_user(user_id)
    added = await _enrich_user(new_id)
    await _system_message(conversation_id, f"{inviter['name']} added {added['name']}")
    try:
        from messaging_socketio import join_users_to_conversation
        await join_users_to_conversation(conversation_id, [new_id])
    except Exception:
        pass
    return {"success": True, "member": added}


@router.get("/groups/{conversation_id}/members")
async def list_group_members(conversation_id: str, request: Request, authorization: Optional[str] = Header(None)):
    user_id = await _get_user_id(authorization, request)
    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv or not conv.get("is_group"):
        raise HTTPException(404, "Group not found")
    if user_id not in conv.get("participants", []):
        raise HTTPException(403, "Access denied")
    members = [await _enrich_user(uid) for uid in conv["participants"]]
    return {"success": True, "members": members, "created_by": conv.get("created_by")}


@router.get("/conversations")
async def list_conversations(request: Request, authorization: Optional[str] = Header(None)):
    """List all conversations for the current user, most recent first."""
    user_id = await _get_user_id(authorization, request)

    convs = await db.conversations.find(
        {"participants": user_id},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(50)

    # Lazy import keeps the route module decoupled from socketio bootstrap order
    try:
        from messaging_socketio import is_user_online
    except Exception:
        is_user_online = lambda _uid: False  # noqa: E731

    # Enrich with other user's info + online status (groups: name + member count)
    enriched = []
    for c in convs:
        if c.get("is_group"):
            c["other_user"] = None
            c["member_count"] = len(c.get("participants", []))
        else:
            other_id = [p for p in c["participants"] if p != user_id]
            other_id = other_id[0] if other_id else user_id
            other_user = await _enrich_user(other_id)
            other_user["online"] = is_user_online(other_id)
            c["other_user"] = other_user
        c["unread"] = c.get("unread_counts", {}).get(user_id, 0)
        enriched.append(c)

    return {"success": True, "conversations": enriched}


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, request: Request, limit: int = 50, before: Optional[str] = None, authorization: Optional[str] = Header(None)):
    """Get messages for a conversation (newest last)."""
    user_id = await _get_user_id(authorization, request)

    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv or user_id not in conv.get("participants", []):
        raise HTTPException(403, "Access denied")

    query = {"conversation_id": conversation_id}
    if before:
        query["timestamp"] = {"$lt": before}

    msgs = await db.messages.find(query, {"_id": 0}).sort("timestamp", 1).to_list(limit)

    # Groups: attach sender info so the UI can label bubbles by author
    if conv.get("is_group"):
        cache = {}
        for m in msgs:
            sid_ = m.get("sender_id")
            if sid_ and not m.get("system"):
                if sid_ not in cache:
                    cache[sid_] = await _enrich_user(sid_)
                m["sender"] = cache[sid_]

    # Mark conversation read for this user + flip messages to read=True.
    # Broadcasts `messages_read` so the sender sees double-cyan checks live.
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"unread_counts.{user_id}": 0}}
    )
    just_read = await db.messages.find(
        {"conversation_id": conversation_id, "sender_id": {"$ne": user_id}, "read": False},
        {"_id": 0, "id": 1}
    ).to_list(500)
    read_ids = [m["id"] for m in just_read]
    if read_ids:
        await db.messages.update_many(
            {"id": {"$in": read_ids}},
            {"$set": {"read": True, "delivered": True}}
        )
        try:
            from messaging_socketio import messaging_sio
            await messaging_sio.emit("messages_read", {
                "conversation_id": conversation_id,
                "reader_id": user_id,
                "message_ids": read_ids,
            }, room=conversation_id)
        except Exception:
            pass
        # Patch the in-flight response so the caller sees the new state
        read_set = set(read_ids)
        for m in msgs:
            if m.get("id") in read_set:
                m["read"] = True
                m["delivered"] = True

    return {"success": True, "messages": msgs, "conversation": conv}


@router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, body: SendMessageReq, request: Request, authorization: Optional[str] = Header(None)):
    """Send a text message."""
    user_id = await _get_user_id(authorization, request)
    text = body.text.strip()
    if not text:
        raise HTTPException(400, "Message cannot be empty")

    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv or user_id not in conv.get("participants", []):
        raise HTTPException(403, "Access denied")

    now = datetime.now(timezone.utc).isoformat()
    # All other participants (1 for direct chats, N for groups). Delivered iff
    # ANY of them has an active socket — they receive `new_message` instantly.
    others = [p for p in conv["participants"] if p != user_id]
    try:
        from messaging_socketio import is_user_online
        delivered_now = any(is_user_online(o) for o in others)
    except Exception:
        delivered_now = False

    msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "sender_id": user_id,
        "text": text,
        "timestamp": now,
        "delivered": delivered_now,
        "read": False,
    }
    await db.messages.insert_one({**msg, "_id": msg["id"]})

    # Update conversation metadata
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {
            "last_message": user_id,
            "last_message_text": text[:100],
            "last_message_at": now,
        }, "$inc": {f"unread_counts.{o}": 1 for o in others}}
    )

    # Emit via socket (best-effort)
    try:
        from messaging_socketio import messaging_sio, emit_unread_messages_count
        sender_info = await _enrich_user(user_id)
        await messaging_sio.emit("new_message", {**msg, "sender": sender_info}, room=conversation_id)
        # Also notify the sender (their other tabs / the just-emitted message)
        # if the recipient was online so the bubble flips to "delivered" instantly.
        if delivered_now:
            await messaging_sio.emit("message_delivered", {
                "conversation_id": conversation_id,
                "message_ids": [msg["id"]],
            }, room=conversation_id)
        # Push fresh unread-counts to recipients — replaces the 30s poll.
        for o in others:
            await emit_unread_messages_count(o)
    except Exception:
        pass

    return {"success": True, "message": msg}


@router.put("/conversations/{conversation_id}/read")
async def mark_read(conversation_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Mark all messages in a conversation as read for the current user.
    Emits `messages_read` to the room so the SENDER's UI updates the
    bubble checkmarks to read (cyan, double-check) in real time.
    """
    user_id = await _get_user_id(authorization, request)
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"unread_counts.{user_id}": 0}}
    )

    # Snapshot which messages just transitioned to read so we can broadcast
    # only those IDs (lighter payload, safer client-side merge).
    just_read = await db.messages.find(
        {"conversation_id": conversation_id, "sender_id": {"$ne": user_id}, "read": False},
        {"_id": 0, "id": 1}
    ).to_list(500)
    read_ids = [m["id"] for m in just_read]

    if read_ids:
        await db.messages.update_many(
            {"id": {"$in": read_ids}},
            {"$set": {"read": True, "delivered": True}}
        )
        # Best-effort socket fan-out
        try:
            from messaging_socketio import messaging_sio
            await messaging_sio.emit("messages_read", {
                "conversation_id": conversation_id,
                "reader_id": user_id,
                "message_ids": read_ids,
            }, room=conversation_id)
        except Exception:
            pass

    # Push refreshed unread total so header badges clear across all tabs.
    try:
        from messaging_socketio import emit_unread_messages_count
        await emit_unread_messages_count(user_id)
    except Exception:
        pass

    return {"success": True, "read_count": len(read_ids)}


@router.get("/unread-count")
async def unread_count(request: Request, authorization: Optional[str] = Header(None)):
    """Get total unread message count across all conversations."""
    user_id = await _get_user_id(authorization, request)
    pipeline = [
        {"$match": {"participants": user_id}},
        {"$group": {"_id": None, "total": {"$sum": f"$unread_counts.{user_id}"}}}
    ]
    result = await db.conversations.aggregate(pipeline).to_list(1)
    total = result[0]["total"] if result else 0
    return {"success": True, "unread_count": total}
