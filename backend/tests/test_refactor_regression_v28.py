"""
Regression tests for refactor iteration 28:
 - auth_routes.py (demo_login, signup, get_current_user)
 - admin_routes.py (get_current_user_media_permissions, create_sheet)
 - chapter_test_routes.py (secrets.SystemRandom().sample use)

No behavior changes expected vs pre-refactor. Uses public backend URL.
"""

import os
import time
import uuid

import pytest
import requests

from conftest import DEMO_USERNAME, DEMO_PASSWORD

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://profile-social-4.preview.emergentagent.com"
).rstrip("/")


# --- fixtures ----------------------------------------------------------------

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


# --- demo_login -------------------------------------------------------------

class TestDemoLogin:
    @pytest.mark.parametrize(
        "username,expected_user",
        [("demo1", "demostudent1"), ("demo2", "demostudent2"), ("demo3", "demostudent3")],
    )
    def test_demo_login_success(self, api, username, expected_user):
        r = api.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"username": username, "password": username},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data and isinstance(data["access_token"], str)
        assert "user" in data
        assert data["user"].get("username") == expected_user
        # ObjectId must not leak
        assert "_id" not in data["user"]

    def test_demo_login_wrong_password(self, api):
        r = api.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"username": "demo1", "password": "WRONG_PASS"},
            timeout=20,
        )
        assert r.status_code == 401, f"expected 401, got {r.status_code} {r.text}"


# --- signup -----------------------------------------------------------------

class TestSignup:
    def test_signup_new_email(self, api):
        unique = uuid.uuid4().hex[:10]
        email = f"test_refactor_{unique}@example.com"
        r = api.post(
            f"{BASE_URL}/api/auth/signup",
            json={"email": email, "password": "Password123", "name": "Refactor Tester"},
            timeout=20,
        )
        assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
        data = r.json()
        assert "access_token" in data
        assert "user" in data
        expected_username = email.split("@")[0]
        assert data["user"].get("username") == expected_username
        assert "_id" not in data["user"]
        assert "provider_id" not in data["user"]

    def test_signup_duplicate_email(self, api):
        unique = uuid.uuid4().hex[:10]
        email = f"test_dup_{unique}@example.com"
        payload = {"email": email, "password": "Password123", "name": "Dup Tester"}
        r1 = api.post(f"{BASE_URL}/api/auth/signup", json=payload, timeout=20)
        assert r1.status_code == 200, r1.text
        r2 = api.post(f"{BASE_URL}/api/auth/signup", json=payload, timeout=20)
        assert r2.status_code == 400, f"expected 400 on duplicate, got {r2.status_code}: {r2.text}"

    def test_signup_short_password(self, api):
        unique = uuid.uuid4().hex[:10]
        r = api.post(
            f"{BASE_URL}/api/auth/signup",
            json={"email": f"short_{unique}@example.com", "password": "abc", "name": "Short"},
            timeout=20,
        )
        assert r.status_code == 400, f"expected 400 on short pw, got {r.status_code}: {r.text}"


# --- get_current_user -------------------------------------------------------

class TestGetCurrentUser:
    def test_me_with_valid_token(self, api, demo1_token):
        r = api.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {demo1_token}"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "_id" not in data
        assert "provider_id" not in data
        assert data.get("username") == "demostudent1"

    def test_me_without_token(self, api):
        r = api.get(f"{BASE_URL}/api/auth/me", timeout=20)
        assert r.status_code == 401, f"expected 401, got {r.status_code}"

    def test_me_with_invalid_token(self, api):
        r = api.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer not.a.valid.jwt"},
            timeout=20,
        )
        assert r.status_code == 401, f"expected 401, got {r.status_code}"


# --- get_current_user_media_permissions ------------------------------------

class TestMediaPermissions:
    def test_media_permissions_anonymous(self, api):
        # No auth header at all
        s = requests.Session()
        r = s.get(f"{BASE_URL}/api/user/media-permissions", timeout=20)
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("can_post_images") is False
        assert "media_disabled_globally" in data

    def test_media_permissions_authenticated(self, api, demo1_token):
        r = api.get(
            f"{BASE_URL}/api/user/media-permissions",
            headers={"Authorization": f"Bearer {demo1_token}"},
            timeout=20,
        )
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        # Schema sanity — must not crash, keys present
        assert "can_post_images" in data
        assert "media_disabled_globally" in data


# --- chapter_test_routes: secrets.SystemRandom sample ---------------------

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
        # Must NOT crash with F821 / 500 from the old `random` undefined-name bug
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text[:500]}"
        data = r.json()
        # Light schema check
        assert isinstance(data, dict)


# --- spot check: recruitment & messaging do not regress -------------------

class TestSpotCheck:
    def test_recruitment_posts_list(self, api):
        r = api.get(f"{BASE_URL}/api/recruitment/posts", timeout=20)
        # Either 200 list or 401 depending on auth requirement — must not be 5xx
        assert r.status_code < 500, f"5xx on recruitment/posts: {r.status_code} {r.text[:300]}"

    def test_messaging_conversations_requires_auth(self, api, demo1_token):
        r = api.get(
            f"{BASE_URL}/api/messages/conversations",
            headers={"Authorization": f"Bearer {demo1_token}"},
            timeout=20,
        )
        assert r.status_code < 500, f"5xx on messages/conversations: {r.status_code} {r.text[:300]}"
