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

AGORA_APP_ID = os.getenv("AGORA_APP_ID", "").strip()
AGORA_APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE")
AGORA_AUTH_MODE = os.getenv("AGORA_AUTH_MODE", "auto").strip().lower()


@router.get("/agora/token")
async def generate_agora_token(
    channel: str = Query(..., min_length=1, max_length=64),
    uid: int = Query(0)
):
    if not AGORA_APP_ID:
        raise HTTPException(500, "Agora App ID not configured")

    actual_uid = uid if uid > 0 else secrets.randbelow(2**31 - 1) + 1
    expiry = int(time.time()) + 3600  # 1 hour

    # Auth mode behavior:
    # - Explicit app_id_only => never sign tokens
    # - Explicit token      => require certificate
    # - Otherwise           => auto-use token mode if certificate exists
    mode = AGORA_AUTH_MODE
    should_use_token = bool(AGORA_APP_CERTIFICATE) if mode not in {"app_id_only", "token"} else (mode == "token")

    if not should_use_token:
        return {
            "token": None,
            "appId": AGORA_APP_ID,
            "channel": channel,
            "uid": actual_uid,
            "expires_at": expiry,
            "mode": "app_id_only",
        }

    if not AGORA_APP_CERTIFICATE:
        raise HTTPException(500, "Agora certificate not configured for token mode")

    token = RtcTokenBuilder.buildTokenWithUid(
        appId=AGORA_APP_ID,
        appCertificate=AGORA_APP_CERTIFICATE,
        channelName=channel,
        uid=actual_uid,
        role=1,
        privilegeExpiredTs=expiry,
    )
    return {
        "token": token,
        "appId": AGORA_APP_ID,
        "channel": channel,
        "uid": actual_uid,
        "expires_at": expiry,
        "mode": "token",
    }
