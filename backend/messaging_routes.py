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
    secret = os.getenv("JWT_SECRET", "ceibaa-secret-key")
    # auth_routes uses "ceibaa-super-secret-key-2026" by default — try the env-configured secret first,
    # then fall back to the legacy default so we don't break tokens minted before the secret unification.
    for candidate in (secret, "ceibaa-super-secret-key-2026", "ceibaa-secret-key"):
        try:
            payload = jwt.decode(token, candidate, algorithms=["HS256"])
            user_id = payload.get("sub")
            if user_id:
                return user_id
        except Exception:
            continue
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


@router.get("/conversations")
async def list_conversations(request: Request, authorization: Optional[str] = Header(None)):
    """List all conversations for the current user, most recent first."""
    user_id = await _get_user_id(authorization, request)

    convs = await db.conversations.find(
        {"participants": user_id},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(50)

    # Enrich with other user's info
    enriched = []
    for c in convs:
        other_id = [p for p in c["participants"] if p != user_id]
        other_id = other_id[0] if other_id else user_id
        other_user = await _enrich_user(other_id)
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

    # Mark read
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"unread_counts.{user_id}": 0}}
    )

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
    msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "sender_id": user_id,
        "text": text,
        "timestamp": now,
        "read": False,
    }
    await db.messages.insert_one({**msg, "_id": msg["id"]})

    # Update conversation metadata
    other_id = [p for p in conv["participants"] if p != user_id]
    other_id = other_id[0] if other_id else user_id
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {
            "last_message": user_id,
            "last_message_text": text[:100],
            "last_message_at": now,
        }, "$inc": {f"unread_counts.{other_id}": 1}}
    )

    # Emit via socket (best-effort)
    try:
        from messaging_socketio import messaging_sio
        sender_info = await _enrich_user(user_id)
        await messaging_sio.emit("new_message", {**msg, "sender": sender_info}, room=conversation_id)
    except Exception:
        pass

    return {"success": True, "message": msg}


@router.put("/conversations/{conversation_id}/read")
async def mark_read(conversation_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Mark all messages in a conversation as read for the current user."""
    user_id = await _get_user_id(authorization, request)
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"unread_counts.{user_id}": 0}}
    )
    await db.messages.update_many(
        {"conversation_id": conversation_id, "sender_id": {"$ne": user_id}, "read": False},
        {"$set": {"read": True}}
    )
    return {"success": True}


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
