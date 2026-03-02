"""
Push Notification Routes - FCM integration for Android app
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
import os

router = APIRouter()

class RegisterTokenRequest(BaseModel):
    user_id: str
    fcm_token: str
    device_info: str = ""

class SendNotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    data: dict = {}

@router.post("/push/register")
async def register_push_token(request: RegisterTokenRequest):
    """Register or update a device's FCM token for a user"""
    from server import db
    
    await db.push_tokens.update_one(
        {"user_id": request.user_id, "fcm_token": request.fcm_token},
        {"$set": {
            "user_id": request.user_id,
            "fcm_token": request.fcm_token,
            "device_info": request.device_info,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "active": True
        }},
        upsert=True
    )
    
    return {"success": True, "message": "Token registered"}

@router.post("/push/unregister")
async def unregister_push_token(request: RegisterTokenRequest):
    """Deactivate a device's FCM token"""
    from server import db
    
    await db.push_tokens.update_one(
        {"user_id": request.user_id, "fcm_token": request.fcm_token},
        {"$set": {"active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Token unregistered"}

@router.post("/push/send")
async def send_push_notification(request: SendNotificationRequest):
    """Send a push notification to a specific user (admin only)"""
    from server import db
    
    FIREBASE_CREDENTIALS = os.environ.get("FIREBASE_CREDENTIALS_PATH")
    if not FIREBASE_CREDENTIALS:
        raise HTTPException(status_code=503, detail="Push notifications not configured. Set FIREBASE_CREDENTIALS_PATH in .env")
    
    try:
        import firebase_admin
        from firebase_admin import messaging
        
        if not firebase_admin._apps:
            cred = firebase_admin.credentials.Certificate(FIREBASE_CREDENTIALS)
            firebase_admin.initialize_app(cred)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Firebase not configured: {str(e)}")
    
    tokens_cursor = db.push_tokens.find(
        {"user_id": request.user_id, "active": True},
        {"_id": 0, "fcm_token": 1}
    )
    tokens = [doc["fcm_token"] async for doc in tokens_cursor]
    
    if not tokens:
        raise HTTPException(status_code=404, detail="No active devices for this user")
    
    from firebase_admin import messaging
    
    results = []
    for token in tokens:
        message = messaging.Message(
            notification=messaging.Notification(
                title=request.title,
                body=request.body,
            ),
            data=request.data,
            token=token,
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    icon="ic_launcher",
                    color="#6366f1",
                    channel_id="ceibaa_default"
                )
            )
        )
        try:
            response = messaging.send(message)
            results.append({"token": token[:20] + "...", "success": True, "message_id": response})
        except Exception as e:
            results.append({"token": token[:20] + "...", "success": False, "error": str(e)})
            if "not-registered" in str(e).lower() or "invalid" in str(e).lower():
                await db.push_tokens.update_one(
                    {"fcm_token": token},
                    {"$set": {"active": False}}
                )
    
    return {"success": True, "results": results}

@router.get("/push/tokens/{user_id}")
async def get_user_tokens(user_id: str):
    """Get active push tokens for a user (admin debug)"""
    from server import db
    
    tokens = []
    async for doc in db.push_tokens.find(
        {"user_id": user_id, "active": True},
        {"_id": 0, "fcm_token": 1, "device_info": 1, "updated_at": 1}
    ):
        tokens.append(doc)
    
    return {"success": True, "tokens": tokens, "count": len(tokens)}
