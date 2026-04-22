"""
Agora RTC Token Generation Routes
Generates temporary tokens for Agora video/audio channels
"""
import os
import time
import random
from fastapi import APIRouter, HTTPException, Query
from agora_token_builder import RtcTokenBuilder

router = APIRouter()

AGORA_APP_ID = os.getenv("AGORA_APP_ID")
AGORA_APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE")

@router.get("/agora/token")
async def generate_agora_token(
    channel: str = Query(..., min_length=1, max_length=64),
    uid: int = Query(0)
):
    if not AGORA_APP_ID or not AGORA_APP_CERTIFICATE:
        raise HTTPException(500, "Agora credentials not configured")

    # If uid=0, generate a random unique one to avoid conflicts
    actual_uid = uid if uid > 0 else random.randint(1, 2**31 - 1)
    expiry = int(time.time()) + 3600  # 1 hour

    token = RtcTokenBuilder.buildTokenWithUid(
        appId=AGORA_APP_ID,
        appCertificate=AGORA_APP_CERTIFICATE,
        channelName=channel,
        uid=actual_uid,
        role=1,
        privilegeExpiredTs=expiry
    )

    return {"token": token, "channel": channel, "uid": actual_uid, "expires_at": expiry}
