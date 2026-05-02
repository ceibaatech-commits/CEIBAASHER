"""
Agora RTC Token Generation Routes
Generates temporary tokens for Agora video/audio channels.

If AGORA_APP_CERTIFICATE is not configured the App is assumed to be running in
"App ID only" / testing mode (Agora console > Project Management > Authentication =
"App ID"). In that case we return token=null and the client connects without
token authentication. This matches how the previous deployment was working.
"""
import os
import time
import secrets
from fastapi import APIRouter, HTTPException, Query
from agora_token_builder import RtcTokenBuilder

router = APIRouter()

AGORA_APP_ID = os.getenv("AGORA_APP_ID", "f512a6c76b5a4e0abd193119f3ba22fe")
AGORA_APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE")


@router.get("/agora/token")
async def generate_agora_token(
    channel: str = Query(..., min_length=1, max_length=64),
    uid: int = Query(0)
):
    if not AGORA_APP_ID:
        raise HTTPException(500, "Agora App ID not configured")

    actual_uid = uid if uid > 0 else secrets.randbelow(2**31 - 1) + 1
    expiry = int(time.time()) + 3600  # 1 hour

    # No certificate → App ID-only mode (no token required by Agora project).
    if not AGORA_APP_CERTIFICATE:
        return {
            "token": None,
            "channel": channel,
            "uid": actual_uid,
            "expires_at": expiry,
            "mode": "app_id_only",
        }

    token = RtcTokenBuilder.buildTokenWithUid(
        appId=AGORA_APP_ID,
        appCertificate=AGORA_APP_CERTIFICATE,
        channelName=channel,
        uid=actual_uid,
        role=1,
        privilegeExpiredTs=expiry,
    )
    return {"token": token, "channel": channel, "uid": actual_uid, "expires_at": expiry, "mode": "token"}
