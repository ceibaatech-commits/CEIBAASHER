"""Email service using Resend"""
import os
import resend

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "onboarding@resend.dev")
SITE_URL = os.getenv("SITE_URL", "https://ceibaa.com")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


async def send_email(to: str, subject: str, html: str):
    if not RESEND_API_KEY:
        print(f"[EMAIL] Skipped (no key): {subject} -> {to}")
        return False
    try:
        resend.Emails.send({"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html})
        print(f"[EMAIL] Sent: {subject} -> {to}")
        return True
    except Exception as e:
        print(f"[EMAIL] Error: {e}")
        return False
