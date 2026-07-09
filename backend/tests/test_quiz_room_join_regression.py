"""Regression tests for the /join-room social fallback flow."""

import os
import uuid

import pytest
import requests

from conftest import DEMO3_PASSWORD, DEMO3_USERNAME, DEMO_PASSWORD, DEMO_USERNAME


BASE_URL = (
    os.getenv("TEST_BASE_URL")
    or os.getenv("REACT_APP_BACKEND_URL")
    or "http://localhost:8001"
).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def demo_auth():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})

    login = session.post(
        f"{API}/auth/demo-login",
        json={"username": DEMO_USERNAME, "password": DEMO_PASSWORD},
        timeout=20,
    )
    if login.status_code != 200:
        pytest.skip(f"Demo login failed: {login.status_code} {login.text[:200]}")

    data = login.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        pytest.skip("Demo login did not return a bearer token")

    session.headers.update({"Authorization": f"Bearer {token}"})
    return {"session": session, "token": token, "user": data.get("user", {})}


@pytest.fixture(scope="module")
def demo_cookie_auth():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})

    login = session.post(
        f"{API}/auth/demo-login",
        json={"username": DEMO_USERNAME, "password": DEMO_PASSWORD},
        timeout=20,
    )
    if login.status_code != 200:
        pytest.skip(f"Demo cookie login failed: {login.status_code} {login.text[:200]}")
    if "session_token" not in session.cookies:
        pytest.skip("Demo login did not set session_token cookie")

    # Ensure cookie-only auth path (no bearer)
    session.headers.pop("Authorization", None)
    cookie = next((c for c in session.cookies if c.name == "session_token"), None)
    return {"session": session, "secure_cookie": bool(cookie.secure) if cookie else False}


@pytest.fixture(scope="module")
def demo3_auth():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})

    login = session.post(
        f"{API}/auth/demo-login",
        json={"username": DEMO3_USERNAME, "password": DEMO3_PASSWORD},
        timeout=20,
    )
    if login.status_code != 200:
        pytest.skip(f"Demo3 login failed: {login.status_code} {login.text[:200]}")

    data = login.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        pytest.skip("Demo3 login did not return a bearer token")

    session.headers.update({"Authorization": f"Bearer {token}"})
    return {"session": session, "token": token, "user": data.get("user", {})}


def _sample_questions():
    questions = []
    for index in range(5):
        answer = index + 4
        questions.append(
            {
                "question_text": f"What is 2 + {index + 2}?",
                "option_a": str(answer - 1),
                "option_b": str(answer),
                "option_c": str(answer + 1),
                "option_d": str(answer + 2),
                "correct_answer": "B",
                "explanation": f"2 + {index + 2} equals {answer}.",
                "time_limit": 15,
            }
        )
    return questions


class TestJoinRoomSocialFallback:
    def test_social_quiz_room_endpoint_rejects_invalid_code(self):
        fetch = requests.get(f"{API}/social/quiz-rooms/ABC12", timeout=20)
        assert fetch.status_code == 400, fetch.text
        detail = fetch.json().get("detail")
        assert detail == "Invalid room code format"

    def test_social_quiz_room_endpoint_returns_not_found_for_unknown_code(self):
        fetch = requests.get(f"{API}/social/quiz-rooms/ZZZZZZ", timeout=20)
        assert fetch.status_code == 404, fetch.text
        detail = fetch.json().get("detail")
        assert detail == "Quiz room not found"

    def test_social_quiz_room_endpoint_returns_quiz_room_source(self, demo_auth):
        session = demo_auth["session"]
        unique = uuid.uuid4().hex[:8]
        payload = {
            "title": f"Regression Quiz {unique}",
            "description": "Validates the social quiz-room lookup used by /join-room.",
            "category": "Regression",
            "privacy": "public",
            "questions": _sample_questions(),
        }

        create = session.post(f"{API}/social/quiz-rooms", json=payload, timeout=20)
        assert create.status_code == 200, create.text
        create_data = create.json()
        assert create_data.get("success") is True
        room_code = create_data.get("room_code")
        assert room_code and len(room_code) == 6

        fetch = requests.get(f"{API}/social/quiz-rooms/{room_code.lower()}", timeout=20)
        assert fetch.status_code == 200, fetch.text
        data = fetch.json()
        assert data.get("success") is True
        assert data.get("source") == "quiz_rooms"
        assert data["room"].get("room_code") == room_code
        assert data["room"].get("title") == payload["title"]
        assert data["room"].get("privacy") == "public"

        cleanup = session.delete(f"{API}/social/quiz-rooms/{room_code}", timeout=20)
        assert cleanup.status_code == 200, cleanup.text
        assert cleanup.json().get("success") is True

    def test_private_social_quiz_room_requires_owner(self, demo_auth, demo3_auth, demo_cookie_auth):
        session = demo_auth["session"]
        unique = uuid.uuid4().hex[:8]
        payload = {
            "title": f"Private Regression Quiz {unique}",
            "description": "Checks privacy enforcement for social room lookup.",
            "category": "Regression",
            "privacy": "private",
            "questions": _sample_questions(),
        }

        create = session.post(f"{API}/social/quiz-rooms", json=payload, timeout=20)
        assert create.status_code == 200, create.text
        create_data = create.json()
        room_code = create_data.get("room_code")
        assert room_code and len(room_code) == 6

        anonymous_fetch = requests.get(f"{API}/social/quiz-rooms/{room_code}", timeout=20)
        assert anonymous_fetch.status_code == 403, anonymous_fetch.text

        non_host_fetch = requests.get(
            f"{API}/social/quiz-rooms/{room_code}",
            headers={"Authorization": demo3_auth["session"].headers["Authorization"]},
            timeout=20,
        )
        assert non_host_fetch.status_code == 403, non_host_fetch.text

        host_fetch = requests.get(
            f"{API}/social/quiz-rooms/{room_code}",
            headers={"Authorization": session.headers["Authorization"]},
            timeout=20,
        )
        assert host_fetch.status_code == 200, host_fetch.text
        host_data = host_fetch.json()
        assert host_data.get("success") is True
        assert host_data["room"].get("privacy") == "private"

        host_cookie_fetch = demo_cookie_auth["session"].get(
            f"{API}/social/quiz-rooms/{room_code}",
            timeout=20,
        )
        # On local HTTP, secure cookies are not sent by clients, so cookie-only
        # auth may appear anonymous. In HTTPS environments this should be 200.
        if demo_cookie_auth["secure_cookie"] and API.startswith("http://"):
            assert host_cookie_fetch.status_code == 403, host_cookie_fetch.text
        else:
            assert host_cookie_fetch.status_code == 200, host_cookie_fetch.text

        cleanup = session.delete(f"{API}/social/quiz-rooms/{room_code}", timeout=20)
        assert cleanup.status_code == 200, cleanup.text
        assert cleanup.json().get("success") is True

    def test_social_quiz_room_endpoint_resolves_battle_room_source(self, demo_auth):
        session = demo_auth["session"]
        payload = {
            "examId": "JEE",
            "subject": "Physics",
            "topic": "Mechanics",
            "hostName": "Join Flow Regression",
        }

        create = session.post(f"{API}/battle/create-room", json=payload, timeout=20)
        assert create.status_code == 200, create.text
        create_data = create.json()
        assert create_data.get("success") is True
        room_code = create_data.get("roomId") or create_data.get("pin")
        assert room_code and len(room_code) == 6

        fetch = requests.get(f"{API}/social/quiz-rooms/{room_code}", timeout=20)
        assert fetch.status_code == 200, fetch.text
        data = fetch.json()
        assert data.get("success") is True
        assert data.get("source") == "battle_rooms"
        assert data["room"].get("room_code") == room_code
        assert data["room"].get("title")
        assert data["room"].get("status") in {"waiting", "active", "completed"}
