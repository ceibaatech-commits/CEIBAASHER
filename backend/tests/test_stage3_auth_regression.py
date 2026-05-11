"""
Stage 3 Auth Refactor Regression Tests (Iteration 30)
Tests cookie-first, Bearer-fallback dual-mode auth across all refactored helpers.
Focus: cookies being set, cookie-only requests succeeding on refactored endpoints.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://mobile-search-fix-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_USER = {"username": "demo1", "password": "demo1"}
ADMIN_EMAIL = {"email": "admin@ceibaa.in", "password": "SuperAdmin@123"}


# ---------- fixtures ----------

@pytest.fixture(scope="module")
def demo_cookie_session():
    """Session logged in via demo-login; relies on httpOnly session_token cookie only."""
    s = requests.Session()
    r = s.post(f"{API}/auth/demo-login", json=DEMO_USER, timeout=20)
    assert r.status_code == 200, f"demo-login failed: {r.status_code} {r.text[:200]}"
    assert "session_token" in s.cookies, "session_token cookie not set by demo-login"
    # Scrub any auth header to guarantee cookie-only requests
    s.headers.pop("Authorization", None)
    return s


@pytest.fixture(scope="module")
def admin_cookie_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={**ADMIN_EMAIL, "remember": False}, timeout=20)
    if r.status_code != 200:
        pytest.skip(f"admin email login unavailable: {r.status_code}")
    assert "session_token" in s.cookies, "session_token cookie not set by /auth/login"
    s.headers.pop("Authorization", None)
    return s


# ---------- Auth flow 1: demo login ----------

class TestDemoLoginCookie:
    def test_demo_login_sets_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/demo-login", json=DEMO_USER, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data or "token" in data
        assert "session_token" in s.cookies
        # Validate cookie is httpOnly via Set-Cookie header
        set_cookie = r.headers.get("set-cookie", "")
        assert "HttpOnly" in set_cookie or "httponly" in set_cookie.lower()

    def test_me_with_cookie_only(self, demo_cookie_session):
        r = demo_cookie_session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200, f"/auth/me cookie-only failed: {r.text[:200]}"
        body = r.json()
        assert body.get("username") or body.get("email") or body.get("id")


# ---------- Auth flow 2: email login (admin) ----------

class TestEmailLogin:
    def test_email_login_valid(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={**ADMIN_EMAIL, "remember": False}, timeout=20)
        if r.status_code == 200:
            assert "session_token" in s.cookies
        else:
            pytest.skip(f"admin seed not available (got {r.status_code})")

    def test_email_login_invalid(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": "admin@ceibaa.in", "password": "WRONG_PW"}, timeout=20)
        assert r.status_code in (400, 401), f"expected 401, got {r.status_code}"


# ---------- Remember-me cookie Max-Age ----------

class TestRememberMe:
    def _max_age_from_setcookie(self, set_cookie_header: str):
        # may contain multiple cookies joined; find Max-Age
        parts = [p.strip() for p in set_cookie_header.split(",")]
        for p in parts:
            if "session_token=" in p.lower():
                for attr in p.split(";"):
                    a = attr.strip()
                    if a.lower().startswith("max-age="):
                        try:
                            return int(a.split("=", 1)[1])
                        except ValueError:
                            return None
        return None

    def test_remember_true_sets_30_day_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={**ADMIN_EMAIL, "remember": True}, timeout=20)
        if r.status_code != 200:
            pytest.skip("admin login not available")
        max_age = self._max_age_from_setcookie(r.headers.get("set-cookie", ""))
        assert max_age is not None, "Max-Age not found on Set-Cookie"
        # 30 days = 2592000s; allow tolerance
        assert max_age >= 2000000, f"remember=true max_age too small: {max_age}"

    def test_remember_false_sets_short_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={**ADMIN_EMAIL, "remember": False}, timeout=20)
        if r.status_code != 200:
            pytest.skip("admin login not available")
        max_age = self._max_age_from_setcookie(r.headers.get("set-cookie", ""))
        assert max_age is not None, "Max-Age not found"
        # Should be much less than 30 days — default 7 days or ACCESS_TOKEN_EXPIRE_MINUTES
        assert max_age < 2000000, f"remember=false unexpectedly long: {max_age}"


# ---------- Social flow: cookie-only ----------

class TestSocialCookieAuth:
    def test_bookmarks_cookie_only(self, demo_cookie_session):
        r = demo_cookie_session.get(f"{API}/social/bookmarks", timeout=15)
        assert r.status_code == 200, f"bookmarks: {r.status_code} {r.text[:200]}"


# ---------- Profile flow: cookie-only ----------

class TestProfileCookieAuth:
    def test_close_friend_ids(self, demo_cookie_session):
        r = demo_cookie_session.get(f"{API}/profile/close-friend-ids", timeout=15)
        assert r.status_code == 200, f"close-friend-ids: {r.status_code} {r.text[:200]}"

    def test_follow_requests(self, demo_cookie_session):
        r = demo_cookie_session.get(f"{API}/profile/follow-requests", timeout=15)
        assert r.status_code == 200, f"follow-requests: {r.status_code} {r.text[:200]}"

    def test_privacy_update(self, demo_cookie_session):
        r = demo_cookie_session.put(f"{API}/profile/privacy?is_private=true", timeout=15)
        assert r.status_code == 200, f"privacy update: {r.status_code} {r.text[:200]}"
        # toggle back
        demo_cookie_session.put(f"{API}/profile/privacy?is_private=false", timeout=15)


# ---------- Phone verification: cookie-only ----------

class TestPhoneStatusCookie:
    def test_phone_status_cookie(self, demo_cookie_session):
        r = demo_cookie_session.get(f"{API}/auth/phone-status", timeout=15)
        assert r.status_code == 200, f"phone-status: {r.status_code} {r.text[:200]}"
        data = r.json()
        # shape check
        assert "needs_verification" in data
        assert "phone_verified" in data or "phone" in data


# ---------- Quiz flow: cookie-only reaches handler ----------

class TestQuizCookieAuth:
    def test_quiz_start_cookie_reaches_handler(self, demo_cookie_session):
        r = demo_cookie_session.get(f"{API}/recruitment/quiz/nonexistent_test_id/start", timeout=15)
        # 404 = handler reached and quiz missing (auth passed); 401 = regression
        assert r.status_code != 401, f"Quiz start returned 401 — cookie auth regression: {r.text[:200]}"
        assert r.status_code in (200, 400, 403, 404, 410, 422), f"unexpected: {r.status_code}"


# ---------- Recruitment admin: cookie migration ----------

class TestRecruitmentAdminCookie:
    def test_recruitment_admin_login_then_cookie(self):
        s = requests.Session()
        # Unknown if seeded — try with default admin email
        r = s.post(f"{API}/recruitment-admin/login", json=ADMIN_EMAIL, timeout=20)
        if r.status_code != 200:
            pytest.skip(f"recruitment-admin not seeded (got {r.status_code}) — needs seeding")
        assert "session_token" in s.cookies, "recruitment-admin login did not set session_token cookie"
        s.headers.pop("Authorization", None)
        r2 = s.get(f"{API}/recruitment-admin/analytics", timeout=15)
        assert r2.status_code == 200, f"analytics cookie-only: {r2.status_code} {r2.text[:200]}"


# ---------- Recruiter: cookie migration ----------

class TestRecruiterCookie:
    def test_recruiter_login_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/recruitment/recruiter/login", json={"email": "recruiter@example.com", "password": "test"}, timeout=20)
        if r.status_code != 200:
            pytest.skip(f"recruiter not seeded (got {r.status_code}) — needs seeding")
        assert "session_token" in s.cookies
        s.headers.pop("Authorization", None)
        r2 = s.get(f"{API}/recruitment/recruiter/me", timeout=15)
        assert r2.status_code == 200


# ---------- Bearer fallback still works ----------

class TestBearerFallbackStillWorks:
    def test_bearer_on_me(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/demo-login", json=DEMO_USER, timeout=20)
        assert r.status_code == 200
        token = r.json().get("access_token") or r.json().get("token")
        assert token, "demo-login response missing access_token"
        # New session without cookies — Bearer only
        s2 = requests.Session()
        s2.headers["Authorization"] = f"Bearer {token}"
        r2 = s2.get(f"{API}/auth/me", timeout=15)
        assert r2.status_code == 200, "Bearer fallback broken on /auth/me"

    def test_bearer_on_bookmarks(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/demo-login", json=DEMO_USER, timeout=20)
        token = r.json().get("access_token") or r.json().get("token")
        s2 = requests.Session()
        s2.headers["Authorization"] = f"Bearer {token}"
        r2 = s2.get(f"{API}/social/bookmarks", timeout=15)
        assert r2.status_code == 200, f"Bearer on bookmarks: {r2.status_code}"


# ---------- Unauth (no cookie, no bearer) returns 401 ----------

class TestUnauthenticated:
    def test_me_unauth(self):
        s = requests.Session()
        r = s.get(f"{API}/auth/me", timeout=15)
        assert r.status_code in (401, 403)

    def test_bookmarks_unauth(self):
        s = requests.Session()
        r = s.get(f"{API}/social/bookmarks", timeout=15)
        assert r.status_code in (401, 403)
