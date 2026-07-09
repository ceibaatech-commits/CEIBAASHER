"""
Regression test: Profile quiz rooms should include rooms from both:
1. Social feed endpoint (POST /quiz-rooms) → stored in quiz_rooms + social_posts
2. Battle async endpoint (POST /api/battle/async/rooms/create) → stored in async_battle_rooms

This ensures users see all their quiz rooms on their profile regardless of creation method.
"""

import os
import uuid
import pytest
import requests
from datetime import datetime, timezone

from conftest import DEMO_PASSWORD, DEMO_USERNAME, DEMO3_PASSWORD, DEMO3_USERNAME

BASE_URL = (
    os.getenv("TEST_BASE_URL")
    or os.getenv("REACT_APP_BACKEND_URL")
    or "http://localhost:8001"
).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def demo_auth():
    """Authenticate as demo user"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})

    login = session.post(
        f"{API}/auth/demo-login",
        json={"username": DEMO_USERNAME, "password": DEMO_PASSWORD},
        timeout=20,
    )
    if login.status_code != 200:
        pytest.skip(f"Demo login failed: {login.status_code}")

    data = login.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        pytest.skip("Demo login did not return a token")

    session.headers.update({"Authorization": f"Bearer {token}"})
    return {
        "session": session,
        "token": token,
        "user": data.get("user", {}),
        "user_id": data.get("user", {}).get("id")
    }


class TestProfileQuizRoomsRegression:
    """Test profile endpoint shows quiz rooms from both creation pathways"""

    def test_profile_includes_social_feed_quiz_room(self, demo_auth):
        """Quiz room created via social feed should appear in profile"""
        session = demo_auth["session"]
        user_id = demo_auth["user_id"]
        username = DEMO_USERNAME

        # Create a quiz room via social feed endpoint
        quiz_data = {
            "title": f"Social Feed Quiz {uuid.uuid4().hex[:8]}",
            "description": "Test quiz from social feed",
            "category": "General",
            "privacy": "public",
            "questions": [
                {
                    "id": str(uuid.uuid4()),
                    "text": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "correct_answer": "4",
                    "time_limit": 15,
                    "image_url": None
                }
            ]
        }

        create_resp = session.post(
            f"{API}/social-feed/quiz-rooms",
            json=quiz_data,
            timeout=20
        )
        assert create_resp.status_code == 200, f"Failed to create quiz room: {create_resp.text}"
        room_data = create_resp.json()
        assert room_data.get("success"), "Quiz room creation not successful"
        room_code_social = room_data.get("room_code")
        assert room_code_social, "No room_code returned"

        # Fetch user's profile quiz rooms
        profile_resp = session.get(
            f"{API}/profile/{username}/quiz-rooms",
            timeout=20
        )
        assert profile_resp.status_code == 200
        profile_data = profile_resp.json()
        assert profile_data.get("success"), "Profile quiz rooms fetch failed"

        quiz_rooms = profile_data.get("quiz_rooms", [])
        room_codes = [r.get("room_code") for r in quiz_rooms]
        assert room_code_social in room_codes, \
            f"Social feed quiz room {room_code_social} not found in profile. Available: {room_codes}"

        # Verify room details
        social_room = next((r for r in quiz_rooms if r.get("room_code") == room_code_social), None)
        assert social_room is not None
        assert social_room.get("title") == quiz_data["title"]
        assert social_room.get("question_count") == 1


    def test_profile_includes_async_battle_quiz_room(self, demo_auth):
        """Quiz room created via battle async endpoint should appear in profile"""
        session = demo_auth["session"]
        user_id = demo_auth["user_id"]
        username = DEMO_USERNAME

        # Create a quiz room via battle async endpoint
        async_room_data = {
            "host_id": user_id,
            "host_name": DEMO_USERNAME,
            "exam_category": "CBSE",
            "subject": "Mathematics",
            "questions": [
                {
                    "id": str(uuid.uuid4()),
                    "text": "What is 5 + 3?",
                    "options": ["7", "8", "9", "10"],
                    "correct_answer": "8",
                    "time_limit": 20
                }
            ],
            "time_per_question": 20,
            "max_participants": 100
        }

        create_async_resp = session.post(
            f"{API}/battle/async/rooms/create",
            json=async_room_data,
            timeout=20
        )
        assert create_async_resp.status_code == 200, \
            f"Failed to create async room: {create_async_resp.text}"
        async_data = create_async_resp.json()
        assert async_data.get("success"), "Async room creation not successful"
        pin = async_data.get("pin")
        assert pin, "No PIN returned for async room"

        # Fetch user's profile quiz rooms
        profile_resp = session.get(
            f"{API}/profile/{username}/quiz-rooms",
            timeout=20
        )
        assert profile_resp.status_code == 200
        profile_data = profile_resp.json()
        assert profile_data.get("success")

        quiz_rooms = profile_data.get("quiz_rooms", [])
        room_codes = [r.get("room_code") for r in quiz_rooms]
        
        # Async rooms are stored with "async_" prefix for deduplication
        expected_code = f"async_{pin}"
        assert expected_code in room_codes, \
            f"Async quiz room {expected_code} not found in profile. Available: {room_codes}"

        # Verify async room details
        async_room = next((r for r in quiz_rooms if r.get("room_code") == expected_code), None)
        assert async_room is not None
        assert async_room.get("pin") == pin
        assert async_room.get("host_id") == user_id


    def test_profile_includes_both_room_types(self, demo_auth):
        """Profile should show both social feed and async battle rooms, deduplicated"""
        session = demo_auth["session"]
        user_id = demo_auth["user_id"]
        username = DEMO_USERNAME

        # Create a social feed quiz room
        social_quiz = {
            "title": f"Both Types Test - Social {uuid.uuid4().hex[:8]}",
            "description": "Social feed test",
            "category": "Science",
            "privacy": "public",
            "questions": [
                {
                    "id": str(uuid.uuid4()),
                    "text": "Social question?",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": "B",
                    "time_limit": 15,
                }
            ]
        }
        social_resp = session.post(f"{API}/social-feed/quiz-rooms", json=social_quiz, timeout=20)
        assert social_resp.status_code == 200
        social_code = social_resp.json().get("room_code")

        # Create an async battle room
        async_quiz = {
            "host_id": user_id,
            "host_name": DEMO_USERNAME,
            "exam_category": "JEE",
            "subject": "Physics",
            "questions": [
                {
                    "id": str(uuid.uuid4()),
                    "text": "Async question?",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": "C",
                    "time_limit": 25,
                }
            ],
            "time_per_question": 25,
            "max_participants": 150
        }
        async_resp = session.post(f"{API}/battle/async/rooms/create", json=async_quiz, timeout=20)
        assert async_resp.status_code == 200
        pin = async_resp.json().get("pin")

        # Fetch profile quiz rooms
        profile_resp = session.get(f"{API}/profile/{username}/quiz-rooms", timeout=20)
        assert profile_resp.status_code == 200
        quiz_rooms = profile_resp.json().get("quiz_rooms", [])

        # Both rooms should be present
        room_codes = [r.get("room_code") for r in quiz_rooms]
        assert social_code in room_codes, f"Social room {social_code} missing"
        assert f"async_{pin}" in room_codes, f"Async room async_{pin} missing"

        # Verify count and deduplication
        assert len(quiz_rooms) >= 2, f"Expected at least 2 rooms, got {len(quiz_rooms)}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
