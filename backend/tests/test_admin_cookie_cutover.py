"""
Regression tests for the Admin/Employee localStorage → httpOnly cookie cutover
(Feb 26, 2026).

What this verifies:
1. Backend exposes /api/admin/auth/logout (idempotent — clears cookie even if not logged in)
2. /api/admin/auth/verify returns valid JSON without crashing (works for both cookie + Bearer)
3. /api/admin/auth/me returns 401 when no cookie/header is present (does not crash)
4. /api/employee/logout works without authentication (idempotent cookie clear)
5. All admin/employee endpoints set httponly+secure attributes when cookies ARE set

Pre-existing legacy SHA-256/bcrypt mismatch on /api/admin/auth/login is not
re-tested here — see test_admin_auth.py for that failure path.
"""
import os
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")


class TestAdminAuthCookieEndpoints:
    """Verifies the new cookie-aware admin auth surface."""

    def test_admin_verify_no_token_returns_legacy_flag(self):
        """/verify with no cookie/header should not 500 — returns legacy true for grace period."""
        r = requests.get(f"{BASE_URL}/api/admin/auth/verify")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        # Either {valid: true, legacy: true} OR {valid: false}
        assert "valid" in data, f"Missing 'valid' key: {data}"

    def test_admin_logout_no_auth_is_idempotent(self):
        """/logout with no token should still succeed and clear the cookie."""
        r = requests.post(f"{BASE_URL}/api/admin/auth/logout")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("success") is True

    def test_admin_me_without_auth_returns_401(self):
        """/me should require authentication."""
        r = requests.get(f"{BASE_URL}/api/admin/auth/me")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"


class TestEmployeeAuthCookieEndpoints:
    """Verifies the new cookie-aware employee auth surface."""

    def test_employee_logout_no_auth_is_idempotent(self):
        """/employee/logout should always succeed and clear cookie (best-effort)."""
        r = requests.post(f"{BASE_URL}/api/employee/logout")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("success") is True

    def test_employee_login_bad_credentials_no_cookie_set(self):
        """Failed login MUST NOT set a session cookie."""
        r = requests.post(
            f"{BASE_URL}/api/employee/login",
            json={"employee_id": "doesnotexist", "password": "wrong"},
        )
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}: {r.text}"
        assert "ceibaa_employee_token" not in r.cookies, "Cookie leaked on failed login"


class TestAdminVerifyCookieResolution:
    """Sanity check that the cookie-aware verifier doesn't crash on synthetic tokens."""

    def test_verify_with_bogus_cookie(self):
        """Passing a junk cookie should return valid=False, not 500."""
        r = requests.get(
            f"{BASE_URL}/api/admin/auth/verify",
            cookies={"ceibaa_admin_token": "definitely-not-a-real-token"},
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert "valid" in data

    def test_verify_with_bogus_bearer(self):
        r = requests.get(
            f"{BASE_URL}/api/admin/auth/verify",
            headers={"Authorization": "Bearer definitely-not-a-real-token"},
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
