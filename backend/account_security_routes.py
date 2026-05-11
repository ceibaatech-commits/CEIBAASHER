"""
Password reset and post-login phone/OTP verification routes.

Public endpoints:
  POST /api/auth/forgot-password         — issues a reset email
  POST /api/auth/reset-password          — sets a new password using a token

Authenticated endpoints (require Bearer JWT):
  GET  /api/auth/phone-status            — has the user verified a phone yet?
  POST /api/auth/phone/send-otp          — saves phone, emails 6-digit OTP
  POST /api/auth/phone/verify-otp        — validates code, marks verified

Notes:
  • OTP delivery uses Resend (no SMS provider yet).  The user enters a phone
    number for contact info, but the verification code lands in their email
    so we can ship today.  Swap to Twilio later by replacing _send_otp_email
    with the SMS call — everything else stays the same.
  • All tokens / OTPs are single-use, time-limited, and stored hashed where
    feasible.  Reset tokens: 1 hour.  OTPs: 10 minutes, 5-attempt cap.
"""
import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Header, Request
from jose import jwt, JWTError
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr

# Load .env eagerly so this module works whether imported first or after auth_routes.
load_dotenv(Path(__file__).parent / ".env")

from utils.email_service import send_email

router = APIRouter()

# ---------- Config ----------
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

RESET_TOKEN_TTL_MINUTES = 60
OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
db = AsyncIOMotorClient(MONGO_URL)[DB_NAME]


# ---------- Helpers ----------

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _hash_password(plain: str) -> str:
    """Match the bcrypt scheme used by auth_routes.hash_password."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _user_id_from_bearer(authorization: Optional[str], request: Optional[Request] = None) -> str:
    # Prefer httpOnly session_token cookie (Stage 3 dual-mode). Falls back
    # to Authorization: Bearer <token> header for backward compatibility.
    token = None
    if request is not None:
        token = request.cookies.get("session_token")
    if not token:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Authentication required")
        token = authorization[len("Bearer "):]
    # Try Emergent session first
    session = await db.user_sessions.find_one({"session_token": token})
    if session and session.get("user_id"):
        return session["user_id"]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id


# ---------- Request models ----------

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class SendOTPRequest(BaseModel):
    phone: str


class VerifyOTPRequest(BaseModel):
    code: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ---------- Email templates ----------

def _reset_email_html(reset_link: str) -> str:
    return f"""
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0f172a;">Reset your Ceibaa password</h2>
      <p style="color: #475569; line-height: 1.6;">
        We received a request to reset your password.  Click the button below to choose a new one.
        This link expires in {RESET_TOKEN_TTL_MINUTES} minutes.
      </p>
      <p style="margin: 28px 0;">
        <a href="{reset_link}"
           style="background: #4f46e5; color: white; padding: 12px 22px; border-radius: 8px;
                  text-decoration: none; font-weight: 600; display: inline-block;">
          Reset password
        </a>
      </p>
      <p style="color: #64748b; font-size: 13px;">
        Or copy this link into your browser:<br>
        <a href="{reset_link}" style="color: #4f46e5; word-break: break-all;">{reset_link}</a>
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
        Didn't request this? You can safely ignore this email — your password won't change.
      </p>
    </div>
    """


def _otp_email_html(code: str) -> str:
    return f"""
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0f172a;">Your Ceibaa verification code</h2>
      <p style="color: #475569; line-height: 1.6;">
        Enter this code in the app to verify your contact details.
        It expires in {OTP_TTL_MINUTES} minutes.
      </p>
      <p style="font-size: 36px; letter-spacing: 6px; font-weight: 700; color: #4f46e5;
                background: #f1f5f9; padding: 18px 0; text-align: center; border-radius: 12px;
                margin: 24px 0;">
        {code}
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
        Didn't request this? You can safely ignore this email.
      </p>
    </div>
    """


def _password_changed_email_html(name: str) -> str:
    return f"""
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0f172a;">Your Ceibaa password was changed</h2>
      <p style="color: #475569; line-height: 1.6;">
        Hi {name or 'there'}, we're letting you know that your Ceibaa account password was
        just changed. For security, you've been logged out of all other devices.
      </p>
      <p style="color: #475569; line-height: 1.6;">
        If <strong>you made this change</strong>, no further action is needed.
      </p>
      <p style="color: #b91c1c; line-height: 1.6;">
        If <strong>you didn't make this change</strong>, your account may be compromised.
        Please reset your password immediately and contact support.
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
        — The Ceibaa team
      </p>
    </div>
    """


# ===================================================================
# 1) FORGOT / RESET PASSWORD
# ===================================================================

@router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    """
    Trigger a password-reset email.  Always returns success so attackers can't
    enumerate registered emails.
    """
    email_lower = req.email.strip().lower()
    user = await db.users.find_one({"email": email_lower})

    # Always behave the same regardless of whether the user exists
    if user:
        raw_token = secrets.token_urlsafe(48)
        await db.password_reset_tokens.insert_one({
            "token_hash": _hash_token(raw_token),
            "user_id": user["id"],
            "email": email_lower,
            "expires_at": _utcnow() + timedelta(minutes=RESET_TOKEN_TTL_MINUTES),
            "used": False,
            "created_at": _utcnow(),
        })
        reset_link = f"{FRONTEND_URL}/reset-password?token={raw_token}"
        await send_email(email_lower, "Reset your Ceibaa password", _reset_email_html(reset_link))

    return {"success": True, "message": "If that email is registered, you'll receive reset instructions shortly."}


@router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    """
    Set a new password using a one-time reset token.
    """
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    token_doc = await db.password_reset_tokens.find_one({"token_hash": _hash_token(req.token)})
    if not token_doc or token_doc.get("used"):
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    expires_at = token_doc["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < _utcnow():
        raise HTTPException(status_code=400, detail="Reset link has expired")

    await db.users.update_one(
        {"id": token_doc["user_id"]},
        {"$set": {"password": _hash_password(req.new_password),
                  "password_updated_at": _utcnow().isoformat()}},
    )
    await db.password_reset_tokens.update_one(
        {"_id": token_doc["_id"]},
        {"$set": {"used": True, "used_at": _utcnow()}},
    )
    # Invalidate any other outstanding reset tokens for this user
    await db.password_reset_tokens.update_many(
        {"user_id": token_doc["user_id"], "used": False},
        {"$set": {"used": True, "used_at": _utcnow(), "invalidated": True}},
    )
    return {"success": True, "message": "Password updated successfully. Please log in with your new password."}


# ===================================================================
# 2) PHONE + OTP VERIFICATION (post-login gate)
# ===================================================================

@router.get("/auth/phone-status")
async def phone_status(request: Request, authorization: Optional[str] = Header(None)):
    """Returns whether the logged-in user has a verified phone yet."""
    user_id = await _user_id_from_bearer(authorization, request)
    user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "phone": 1, "phone_verified": 1},
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "success": True,
        "phone": user.get("phone"),
        "phone_verified": bool(user.get("phone_verified")),
        "needs_verification": not bool(user.get("phone_verified")),
    }


@router.post("/auth/phone/send-otp")
async def send_phone_otp(req: SendOTPRequest, request: Request, authorization: Optional[str] = Header(None)):
    """
    Save the phone number on the user profile and email a 6-digit OTP.
    """
    user_id = await _user_id_from_bearer(authorization, request)
    phone = req.phone.strip()
    if len(phone) < 7 or not any(c.isdigit() for c in phone):
        raise HTTPException(status_code=400, detail="Please enter a valid phone number")

    user = await db.users.find_one({"id": user_id}, {"_id": 0, "email": 1, "name": 1})
    if not user or not user.get("email"):
        raise HTTPException(status_code=400, detail="Cannot send OTP: account has no email on file")

    # Generate a cryptographically-strong 6-digit OTP
    code = f"{secrets.randbelow(1_000_000):06d}"

    await db.users.update_one(
        {"id": user_id},
        {"$set": {"phone": phone, "phone_verified": False, "phone_added_at": _utcnow().isoformat()}},
    )

    # Replace any outstanding OTP for this user
    await db.phone_otps.delete_many({"user_id": user_id})
    await db.phone_otps.insert_one({
        "user_id": user_id,
        "phone": phone,
        "code_hash": _hash_token(code),
        "expires_at": _utcnow() + timedelta(minutes=OTP_TTL_MINUTES),
        "attempts": 0,
        "created_at": _utcnow(),
    })

    await send_email(user["email"], f"{code} is your Ceibaa verification code", _otp_email_html(code))

    return {
        "success": True,
        "message": f"We've sent a 6-digit code to {user['email']}. Please enter it below to verify your phone.",
        "delivery": "email",
    }


@router.post("/auth/phone/verify-otp")
async def verify_phone_otp(req: VerifyOTPRequest, request: Request, authorization: Optional[str] = Header(None)):
    """Confirm the 6-digit code and mark phone_verified = True."""
    user_id = await _user_id_from_bearer(authorization, request)
    code = req.code.strip()
    if not code.isdigit() or len(code) != 6:
        raise HTTPException(status_code=400, detail="Please enter the 6-digit code")

    otp_doc = await db.phone_otps.find_one({"user_id": user_id})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="No active code. Please request a new one.")

    expires_at = otp_doc["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < _utcnow():
        await db.phone_otps.delete_one({"_id": otp_doc["_id"]})
        raise HTTPException(status_code=400, detail="Code has expired. Please request a new one.")

    if otp_doc.get("attempts", 0) >= OTP_MAX_ATTEMPTS:
        await db.phone_otps.delete_one({"_id": otp_doc["_id"]})
        raise HTTPException(status_code=429, detail="Too many failed attempts. Please request a new code.")

    if _hash_token(code) != otp_doc["code_hash"]:
        await db.phone_otps.update_one({"_id": otp_doc["_id"]}, {"$inc": {"attempts": 1}})
        raise HTTPException(status_code=400, detail="Incorrect code. Please try again.")

    # Success
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"phone_verified": True, "phone_verified_at": _utcnow().isoformat()}},
    )
    await db.phone_otps.delete_one({"_id": otp_doc["_id"]})

    return {"success": True, "message": "Phone verified successfully", "phone_verified": True}


# ===================================================================
# 3) CHANGE PASSWORD (authenticated — logged-in user)
# ===================================================================

def _verify_bcrypt(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def _validate_new_password(current: str, new: str) -> None:
    if len(new) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    if new == current:
        raise HTTPException(status_code=400, detail="New password must be different from the current one")


async def _verify_user_current_password(user_id: str, current_password: str) -> dict:
    """Load user, ensure they have a password, and verify it. Returns the user."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    stored = user.get("password")
    if not stored:
        raise HTTPException(
            status_code=400,
            detail="This account uses social login and doesn't have a password to change.",
        )
    if not _verify_bcrypt(current_password, stored):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    return user


async def _revoke_other_sessions(user_id: str, current_token: Optional[str]) -> int:
    sessions_filter = {"user_id": user_id}
    if current_token:
        sessions_filter["session_token"] = {"$ne": current_token}
    revoked = await db.user_sessions.delete_many(sessions_filter)
    # Also invalidate outstanding password-reset tokens
    await db.password_reset_tokens.update_many(
        {"user_id": user_id, "used": False},
        {"$set": {"used": True, "used_at": _utcnow(), "invalidated": True}},
    )
    return revoked.deleted_count


async def _notify_password_changed(user: dict) -> None:
    """Best-effort security-breadcrumb email; never fatal."""
    try:
        if user.get("email"):
            await send_email(
                user["email"],
                "Your Ceibaa password was changed",
                _password_changed_email_html(user.get("name", "")),
            )
    except Exception as e:
        print(f"[change-password] notification email failed: {e}")


@router.post("/auth/change-password")
async def change_password(req: ChangePasswordRequest, request: Request, authorization: Optional[str] = Header(None)):
    """
    Logged-in password change. Requires the current password.

    On success:
      - writes the new bcrypt hash
      - invalidates every *other* active session (current token stays valid)
      - emails a "password was changed" notification
    """
    user_id = await _user_id_from_bearer(authorization, request)

    _validate_new_password(req.current_password, req.new_password)
    user = await _verify_user_current_password(user_id, req.current_password)

    # Update password
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "password": _hash_password(req.new_password),
            "password_updated_at": _utcnow().isoformat(),
        }},
    )

    current_token = authorization[len("Bearer "):] if authorization and authorization.startswith("Bearer ") else None
    revoked_count = await _revoke_other_sessions(user_id, current_token)
    await _notify_password_changed(user)

    return {
        "success": True,
        "message": "Password updated. You've been logged out of all other devices for security.",
        "other_sessions_revoked": revoked_count,
    }

