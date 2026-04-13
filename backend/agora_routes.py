"""
Agora RTC Token Generation Routes
Generates temporary tokens for Agora video/audio channels
"""
import os
import time
from fastapi import APIRouter, HTTPException, Query
from agora_token_builder import RtcTokenBuilder

router = APIRouter()

AGORA_APP_ID = os.getenv("AGORA_APP_ID")
AGORA_APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE")

@router.get("/agora/token")
async def generate_agora_token(channel: str = Query(..., min_length=1, max_length=64)):
    if not AGORA_APP_ID or not AGORA_APP_CERTIFICATE:
        raise HTTPException(500, "Agora credentials not configured")

    expiry = int(time.time()) + 3600  # 1 hour

    token = RtcTokenBuilder.buildTokenWithUid(
        appId=AGORA_APP_ID,
        appCertificate=AGORA_APP_CERTIFICATE,
        channelName=channel,
        uid=0,
        role=1,
        privilegeExpiredTs=expiry
    )

    return {"token": token, "channel": channel, "uid": "0", "expires_at": expiry}
