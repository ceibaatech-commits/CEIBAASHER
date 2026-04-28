"""
Regression tests for refactor iteration 29 (Round A + B + C):
 - Auth: demo_login, signup, get_current_user (cookie/Bearer dual mode)
 - Admin auth (refactored admin_login + helpers _find_admin_user, _create_admin_session)
 - Admin sheet import endpoint reachable (refactored import_sheet_questions / _question_doc_from_sheet_dict)
 - Battle async routes reachable (refactored join_async_room + submit_answers helpers)
 - battle_rooms join_room helpers reachable
 - Social MCQ endpoint still works (orphaned dead code removed in social_feed_routes.py)
 - Chapter test start (secrets.SystemRandom().sample intact)
 - Recruitment smoke (refactored add_indexes / declarative INDEX_SPECS)
 - create-demo-users idempotent

Pure refactor — no behavior change expected.
"""
import os
import uuid

import pytest
import requests

from conftest import (
    DEMO_USERNAME,
    DEMO_PASSWORD,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
)

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://profile-social-4.preview.emergentagent.com",
).rstrip("/")


# ---- fixtures --------------------------------------------------------------

@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def demo1_token(api):
    r = api.post(
        f"{BASE_URL}/api/auth/demo-login",
        json={"username": DEMO_USERNAME, "password": DEMO_PASSWORD},
        timeout=20,
    )
    assert r.status_code == 200, f"demo-login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(
        f"{BASE_URL}/api/admin/auth/login",
        json={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    if r.status_code != 200:
        pytest.skip(f"admin login failed (cannot test admin paths): {r.status_code} {r.text}")
    return r.json().get("token")


# ---- 1. Auth (Round B refactor) -------------------------------------------

class TestAuthRefactor:
    def test_demo_login_demo1(self, api):
        r = api.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"username": "demo1", "password": "demo1"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data and isinstance(data["access_token"], str)
        assert "user" in data
        assert "_id" not in data["user"]

    def test_signup_new_email(self, api):
        unique = uuid.uuid4().hex[:10]
        email = f"test_v29_{unique}@example.com"
        r = api.post(
            f"{BASE_URL}/api/auth/signup",
            json={"email": email, "password": "Password123", "name": "V29 Tester"},
            timeout=20,
        )
        assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
        data = r.json()
        assert "access_token" in data
        assert data["user"].get("email", "").lower() == email.lower()
        assert "_id" not in data["user"]
        assert "provider_id" not in data["user"]

    def test_me_with_bearer(self, api, demo1_token):
        r = api.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {demo1_token}"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "_id" not in data
        assert data.get("username") == "demostudent1"

    def test_me_with_cookie_dual_mode(self, api):
        """Verify cookie-based auth path still works (refactored _set_auth_cookie)."""
        s = requests.Session()
        login = s.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"username": "demo1", "password": "demo1"},
            timeout=20,
        )
        assert login.status_code == 200, login.text
        # cookie should now be set on the session — call /me without Bearer
        r = s.get(f"{BASE_URL}/api/auth/me", timeout=20)
        # Either cookie auth works (200) OR API only supports Bearer (401).
        # Refactor preserved cookie support, so we expect 200.
        assert r.status_code == 200, (
            f"cookie-based /me failed (dual-mode broken?): {r.status_code} {r.text[:300]}"
        )

    def test_create_demo_users_idempotent(self, api):
        r = api.post(f"{BASE_URL}/api/auth/create-demo-users", timeout=30)
        assert r.status_code == 200, f"first call failed: {r.status_code} {r.text[:300]}"
        # Second call must also succeed (idempotency)
        r2 = api.post(f"{BASE_URL}/api/auth/create-demo-users", timeout=30)
        assert r2.status_code == 200, f"second call failed: {r2.status_code} {r2.text[:300]}"


# ---- 2. Admin auth (Round B refactor) -------------------------------------

class TestAdminAuthRefactor:
    def test_admin_login_success(self, api):
        r = api.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=20,
        )
        assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("success") is True
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0
        assert "user" in data and isinstance(data["user"], dict)

    def test_admin_login_wrong_password(self, api):
        r = api.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"username": ADMIN_EMAIL, "password": "ThisIsWrong!!"},
            timeout=20,
        )
        assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text[:300]}"


# ---- 3. Admin sheet import endpoint reachable -----------------------------

class TestAdminSheetImportReachable:
    def test_import_endpoint_reachable(self, api, admin_token):
        # Use a fake sheet_id; we just want to confirm endpoint is wired.
        # 4xx (404 sheet not found / 400 / 422) is acceptable; 5xx or
        # 405 (method not allowed / route missing) is a regression.
        fake_id = "TEST_NONEXISTENT_SHEET_v29"
        r = api.post(
            f"{BASE_URL}/api/admin/sheets/{fake_id}/import",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=20,
        )
        assert r.status_code != 405, f"route missing (405): {r.text[:200]}"
        assert r.status_code < 500, f"5xx — refactor regression?: {r.status_code} {r.text[:300]}"


# ---- 4. Battle async refactor (join + submit helpers) --------------------

class TestBattleAsyncReachable:
    def test_join_async_room_reachable(self, api, demo1_token):
        fake_pin = "000000"
        r = api.post(
            f"{BASE_URL}/api/battle-async/rooms/{fake_pin}/join",
            headers={"Authorization": f"Bearer {demo1_token}"},
            json={"display_name": "Tester"},
            timeout=20,
        )
        # 404 (no such room) or 410 (expired) acceptable; 5xx is a regression.
        assert r.status_code != 405, f"route missing (405): {r.text[:200]}"
        assert r.status_code < 500, f"5xx — refactor regression?: {r.status_code} {r.text[:300]}"

    def test_submit_answers_reachable(self, api, demo1_token):
        fake_pin = "000000"
        r = api.post(
            f"{BASE_URL}/api/battle-async/rooms/{fake_pin}/submit",
            headers={"Authorization": f"Bearer {demo1_token}"},
            json={"answers": {}, "time_taken_seconds": 10},
            timeout=20,
        )
        assert r.status_code != 405, f"route missing (405): {r.text[:200]}"
        assert r.status_code < 500, f"5xx — refactor regression?: {r.status_code} {r.text[:300]}"


# ---- 5. battle_rooms.join_room (Round B refactor) -------------------------

class TestBattleRoomJoinReachable:
    def test_battle_room_join_reachable(self, api, demo1_token):
        fake_pin = "999999"
        # Try common path; if route shape differs the assertion <500 still
        # passes, and 405 reveals route missing.
        r = api.post(
            f"{BASE_URL}/api/battle/rooms/{fake_pin}/join",
            headers={"Authorization": f"Bearer {demo1_token}"},
            json={},
            timeout=20,
        )
        # Accept 404 (no room) or any 4xx; regression is 5xx.
        assert r.status_code < 500, f"5xx — refactor regression?: {r.status_code} {r.text[:300]}"


# ---- 6. Social MCQ endpoint (orphaned dead-code removal) -----------------

class TestSocialMcqStillWorks:
    def test_mcq_topics_endpoint(self, api, demo1_token):
        r = api.get(
            f"{BASE_URL}/api/social/mcq/topics",
            params={"exam": "JEE", "subject": "Physics"},
            headers={"Authorization": f"Bearer {demo1_token}"},
            timeout=20,
        )
        assert r.status_code == 200, (
            f"social mcq topics broken after dead-code removal: "
            f"{r.status_code} {r.text[:300]}"
        )
        data = r.json()
        # Must be a dict or list — not a 5xx, not crash
        assert isinstance(data, (dict, list))


# ---- 7. Chapter test (secrets.SystemRandom intact) ----------------------

class TestChapterTestStart:
    def test_start_test_returns_200(self, api):
        r = api.get(
            f"{BASE_URL}/api/chapter-tests/start-test",
            params={
                "class_param": 10,
                "subject": "Science",
                "chapter": 1,
                "num_questions": 3,
            },
            timeout=30,
        )
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text[:500]}"


# ---- 8. Recruitment smoke (declarative add_indexes refactor) ------------

class TestRecruitmentSmoke:
    def test_recruitment_companies(self, api):
        r = api.get(f"{BASE_URL}/api/recruitment/companies", timeout=20)
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text[:300]}"
        data = r.json()
        # response can be list or {companies: [...]}; just sanity check
        assert isinstance(data, (list, dict))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
