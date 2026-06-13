"""Backend tests for follow/unfollow/block/share-profile fixes (iteration 32).

Covers:
- /api/profile/follow + /api/profile/follow-status/{id} + /api/profile/unfollow/{id}
- /api/profile/block (cookie-auth fix, 400 self-block, 404 missing user)
- /api/profile/{username} returning is_blocked=True payload
- /api/social/feed/(for-you|trending|following) filtering blocked authors
- /api/profile/close-friend cookie-auth fix
"""
import os
import uuid
from datetime import datetime, timezone
import pytest
import requests

def _load_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v:
        return v.rstrip("/")
    # Fallback: read /app/frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass
    raise RuntimeError("REACT_APP_BACKEND_URL not configured")

BASE_URL = _load_url()
CEIBAATECH_ID = "608f1a3d-3891-444b-ac23-7dfe815e817e"
CEIBAATECH_USERNAME = "ceibaatech"


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def cookie_session():
    """Login demo1 via cookie auth and DROP the Authorization header.
    The fixes hinge on cookie-only paths working.
    """
    # Drop any pre-existing block doc so the follow/unfollow test path is clean
    try:
        import asyncio
        from motor.motor_asyncio import AsyncIOMotorClient
        from dotenv import load_dotenv
        load_dotenv("/app/backend/.env")
        mongo = AsyncIOMotorClient(os.environ["MONGO_URL"])
        dbname = os.environ.get("DB_NAME", "test_database")
        asyncio.get_event_loop().run_until_complete(
            mongo[dbname].blocks.delete_many({})
        )
    except Exception as e:
        print(f"pre-cleanup blocks failed: {e}")

    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/demo-login",
               json={"username": "demo1", "password": "demo1"}, timeout=15)
    assert r.status_code == 200, f"demo-login failed: {r.status_code} {r.text}"
    data = r.json()
    user_id = data["user"]["id"]
    # Verify cookie present
    assert "session_token" in s.cookies, "session_token cookie not set"
    return {"session": s, "user_id": user_id, "access_token": data["access_token"]}


@pytest.fixture(scope="module")
def cleanup(cookie_session):
    """After all tests, remove any block rows + re-insert follow row."""
    yield
    s = cookie_session["session"]
    me = cookie_session["user_id"]
    # Best-effort: drop block, drop follow, then re-create follow.
    # Use a special admin route? None — but we can call follow API to restore state.
    try:
        # Try following again so demo1 ends up "Following" ceibaatech.
        s.post(f"{BASE_URL}/api/profile/follow",
               json={"following_id": CEIBAATECH_ID}, timeout=10)
    except Exception:
        pass


# ---------- Health ----------
def test_health(cookie_session):
    """Quick sanity check on cookie + /api routing."""
    s = cookie_session["session"]
    r = s.get(f"{BASE_URL}/api/profile/follow-status/{CEIBAATECH_ID}", timeout=10)
    assert r.status_code == 200, r.text


# ---------- Follow / unfollow / status ----------
def test_unfollow_self_returns_400(cookie_session):
    s = cookie_session["session"]
    me = cookie_session["user_id"]
    r = s.delete(f"{BASE_URL}/api/profile/unfollow/{me}", timeout=10)
    assert r.status_code == 400
    assert "yourself" in r.text.lower()


def test_unfollow_stranger_returns_404(cookie_session):
    s = cookie_session["session"]
    stranger = str(uuid.uuid4())
    r = s.delete(f"{BASE_URL}/api/profile/unfollow/{stranger}", timeout=10)
    assert r.status_code == 404


def test_follow_then_status_then_unfollow(cookie_session):
    """Cookie-only: follow -> status=approved -> unfollow -> following=False."""
    s = cookie_session["session"]
    # Ensure we're not already following (idempotent unfollow attempt)
    s.delete(f"{BASE_URL}/api/profile/unfollow/{CEIBAATECH_ID}", timeout=10)

    # Follow (no Authorization header — strip just in case)
    r = s.post(f"{BASE_URL}/api/profile/follow",
               json={"target_user_id": CEIBAATECH_ID}, timeout=10,
               headers={"Authorization": ""})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("success") is True

    # Status -> approved
    r2 = s.get(f"{BASE_URL}/api/profile/follow-status/{CEIBAATECH_ID}", timeout=10,
               headers={"Authorization": ""})
    assert r2.status_code == 200, r2.text
    status_body = r2.json()
    # field name could be 'status' or 'follow_status'
    assert (status_body.get("status") == "approved"
            or status_body.get("follow_status") == "approved"
            or status_body.get("is_following") is True), status_body

    # Unfollow
    r3 = s.delete(f"{BASE_URL}/api/profile/unfollow/{CEIBAATECH_ID}", timeout=10,
                  headers={"Authorization": ""})
    assert r3.status_code == 200, r3.text

    # Status -> not following
    r4 = s.get(f"{BASE_URL}/api/profile/follow-status/{CEIBAATECH_ID}", timeout=10)
    assert r4.status_code == 200
    sb = r4.json()
    assert sb.get("is_following") in (False, None) or sb.get("status") in (None, "none", "")


# ---------- Block ----------
def test_block_self_returns_400(cookie_session):
    s = cookie_session["session"]
    me = cookie_session["user_id"]
    r = s.post(f"{BASE_URL}/api/profile/block",
               json={"target_user_id": me}, timeout=10,
               headers={"Authorization": ""})
    assert r.status_code == 400


def test_block_missing_user_returns_404(cookie_session):
    s = cookie_session["session"]
    r = s.post(f"{BASE_URL}/api/profile/block",
               json={"target_user_id": str(uuid.uuid4())}, timeout=10,
               headers={"Authorization": ""})
    assert r.status_code == 404


def test_block_with_cookie_auth_succeeds_and_blocks_profile_and_feeds(cookie_session):
    s = cookie_session["session"]
    # Pre-step: ensure follow exists so we can verify it gets wiped
    s.post(f"{BASE_URL}/api/profile/follow",
           json={"target_user_id": CEIBAATECH_ID}, timeout=10)

    # Block — explicitly strip Authorization header
    r = s.post(f"{BASE_URL}/api/profile/block",
               json={"target_user_id": CEIBAATECH_ID}, timeout=10,
               headers={"Authorization": ""})
    assert r.status_code == 200, r.text
    assert r.json().get("success") is True

    # Profile view should now show is_blocked=True
    me = cookie_session["user_id"]
    r2 = s.get(f"{BASE_URL}/api/profile/{CEIBAATECH_USERNAME}",
               params={"current_user_id": me}, timeout=10)
    assert r2.status_code == 200, r2.text
    body = r2.json()
    assert body.get("is_blocked") is True, body
    assert body.get("message") == "This account is not available"

    # Follow record should have been wiped
    fs = s.get(f"{BASE_URL}/api/profile/follow-status/{CEIBAATECH_ID}", timeout=10).json()
    assert fs.get("is_following") in (False, None)

    # Feeds: blocked author posts must NOT appear
    for feed in ("for-you", "trending", "following"):
        rf = s.get(f"{BASE_URL}/api/social/feed/{feed}", params={"limit": 50}, timeout=15)
        assert rf.status_code == 200, f"{feed}: {rf.status_code} {rf.text}"
        posts = rf.json().get("posts", [])
        bad = [p for p in posts if p.get("user_id") == CEIBAATECH_ID
               or p.get("author_id") == CEIBAATECH_ID]
        assert not bad, f"{feed} feed contained blocked user posts: {len(bad)}"

    # Cleanup the block via direct API: there's no unblock endpoint, so use mongo via
    # a tiny helper endpoint? None exists — we'll clean in conftest below.


# ---------- Close-friend cookie auth fix ----------
def test_close_friend_cookie_auth(cookie_session):
    """Previously returned 401 with cookie auth — now must succeed."""
    s = cookie_session["session"]
    # Need an unblocked target — clean up the block from prior test first by direct mongo
    # (we'll handle the cleanup separately). For this test, pick a different demo user.
    # Easiest: demo3.
    r_login = requests.post(f"{BASE_URL}/api/auth/demo-login",
                            json={"username": "demo3", "password": "demo3"}, timeout=10)
    if r_login.status_code != 200:
        pytest.skip("demo3 login unavailable")
    demo3_id = r_login.json()["user"]["id"]

    r = s.post(f"{BASE_URL}/api/profile/close-friend",
               json={"target_user_id": demo3_id, "action": "add"},
               timeout=10, headers={"Authorization": ""})
    assert r.status_code == 200, r.text
    assert r.json().get("success") is True

    # Remove again to clean
    s.post(f"{BASE_URL}/api/profile/close-friend",
           json={"target_user_id": demo3_id, "action": "remove"}, timeout=10)
