"""
Divya Tutor Phase 2 (Progress) + Phase 4 (Quiz) backend tests.
"""
import base64
import os
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://mobile-search-fix-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_USER_ID = "ab3581a5-23e6-407d-a7ac-21e0f4da2b4f"


@pytest.fixture(scope="module")
def auth_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/demo-login", json={"username": "demo1", "password": "demo1"}, timeout=30)
    assert r.status_code == 200, f"demo-login failed: {r.status_code} {r.text}"
    # Ensure cookie set
    assert any(c.name == "session_token" for c in s.cookies), f"no session_token cookie: {s.cookies}"
    return s


@pytest.fixture(scope="module")
def cleanup_after():
    yield
    # Cleanup demo1 test data via Mongo
    try:
        from motor.motor_asyncio import AsyncIOMotorClient  # noqa
    except Exception:
        pass
    try:
        import pymongo
        client = pymongo.MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        dbname = os.environ.get("DB_NAME", "test_database")
        client[dbname].divya_sessions.delete_many({"user_id": DEMO_USER_ID})
        client[dbname].divya_quiz_attempts.delete_many({"user_id": DEMO_USER_ID})
    except Exception as e:
        print(f"cleanup skipped: {e}")


# ────────────────────────────────────────────────────────────────────
# Phase 4 — Quiz endpoint
# ────────────────────────────────────────────────────────────────────
class TestQuizEndpoint:
    def _validate_quiz_payload(self, data, expected_lang, qn=1, total=5):
        assert data.get("success") is True
        assert isinstance(data.get("question"), str) and data["question"].strip()
        opts = data.get("options")
        assert isinstance(opts, list) and len(opts) == 4
        assert all(isinstance(o, str) and o.strip() for o in opts)
        ci = data.get("correct_index")
        assert isinstance(ci, int) and 0 <= ci <= 3
        assert isinstance(data.get("explanation"), str) and data["explanation"].strip()
        assert data.get("question_number") == qn
        assert data.get("total_questions") == total
        assert data.get("tutor") in ("divya", "sher")
        assert data.get("language") == expected_lang

    def test_quiz_divya_en(self):
        body = {
            "tutor": "divya", "language": "en", "question_number": 1, "total_questions": 5,
            "exam": "NEET", "subject": "Physics", "topic": "Mechanics",
        }
        r = requests.post(f"{API}/divya/live/quiz", json=body, timeout=90)
        if r.status_code in (429, 503):
            pytest.skip(f"Sarvam rate-limit: {r.status_code}")
        assert r.status_code == 200, r.text
        data = r.json()
        self._validate_quiz_payload(data, "en-IN", 1, 5)
        # audio_base64 → WAV
        ab = data.get("audio_base64")
        assert isinstance(ab, str) and len(ab) > 100, "missing audio_base64"
        raw = base64.b64decode(ab)
        assert raw[:4] == b"RIFF", f"audio not WAV: {raw[:16]!r}"

    def test_quiz_sher_hi_with_prev(self):
        body = {
            "tutor": "sher", "language": "hi", "question_number": 2, "total_questions": 5,
            "previous_qa": [{"question": "What is force?", "user_answer": "Push", "correct": True}],
        }
        r = requests.post(f"{API}/divya/live/quiz", json=body, timeout=90)
        if r.status_code in (429, 503):
            pytest.skip(f"Sarvam rate-limit: {r.status_code}")
        assert r.status_code == 200, r.text
        data = r.json()
        self._validate_quiz_payload(data, "hi-IN", 2, 5)
        ab = data.get("audio_base64")
        assert isinstance(ab, str) and len(ab) > 100
        raw = base64.b64decode(ab)
        assert raw[:4] == b"RIFF"

    def test_quiz_empty_body_defaults(self):
        r = requests.post(f"{API}/divya/live/quiz", json={}, timeout=90)
        if r.status_code in (429, 503):
            pytest.skip(f"Sarvam rate-limit: {r.status_code}")
        assert r.status_code == 200, r.text
        data = r.json()
        self._validate_quiz_payload(data, "en-IN", 1, 5)


# ────────────────────────────────────────────────────────────────────
# Phase 2 — Progress endpoints
# ────────────────────────────────────────────────────────────────────
class TestProgressAuth:
    def test_no_auth_session_start_401(self):
        r = requests.post(f"{API}/divya/progress/session/start",
                          json={"tutor": "divya", "language": "en-IN"}, timeout=20)
        assert r.status_code == 401, f"expected 401, got {r.status_code} {r.text}"


class TestProgressSession:
    session_id = None

    def test_login_and_start(self, auth_session):
        r = auth_session.post(
            f"{API}/divya/progress/session/start",
            json={"tutor": "divya", "language": "en-IN", "exam": "NEET",
                  "subject": "Physics", "topic": "Mechanics", "pdf_name": None},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        sid = data["session_id"]
        # UUID shape
        uuid.UUID(sid)
        TestProgressSession.session_id = sid

    def test_log_messages_tracked(self, auth_session):
        sid = TestProgressSession.session_id
        assert sid
        for _ in range(3):
            r = auth_session.post(f"{API}/divya/progress/session/log-message",
                                  json={"session_id": sid, "role": "user"}, timeout=20)
            assert r.status_code == 200, r.text
            d = r.json()
            assert d["success"] is True and d["tracked"] is True

    def test_log_message_bogus_session_silent(self, auth_session):
        r = auth_session.post(f"{API}/divya/progress/session/log-message",
                              json={"session_id": "bogus-no-exist", "role": "user"}, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["success"] is True and d["tracked"] is False

    def test_end_session_unknown_404(self, auth_session):
        r = auth_session.post(f"{API}/divya/progress/session/end",
                              json={"session_id": "does-not-exist"}, timeout=20)
        assert r.status_code == 404, r.text

    def test_end_session_real(self, auth_session):
        sid = TestProgressSession.session_id
        r = auth_session.post(f"{API}/divya/progress/session/end",
                              json={"session_id": sid}, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["success"] is True
        assert isinstance(d["duration_seconds"], int) and d["duration_seconds"] >= 0


class TestQuizAttempt:
    def test_save_quiz_attempt(self, auth_session):
        body = {
            "session_id": TestProgressSession.session_id, "tutor": "divya",
            "language": "en-IN", "exam": "NEET", "subject": "Physics",
            "topic": "Mechanics", "score": 3, "total_questions": 5,
        }
        r = auth_session.post(f"{API}/divya/progress/quiz", json=body, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["success"] is True
        uuid.UUID(d["attempt_id"])
        assert d["percentage"] == 60.0

    def test_invalid_total_zero(self, auth_session):
        r = auth_session.post(f"{API}/divya/progress/quiz",
                              json={"score": 5, "total_questions": 0,
                                    "tutor": "divya", "language": "en"}, timeout=20)
        assert r.status_code == 400, r.text

    def test_invalid_score_over(self, auth_session):
        r = auth_session.post(f"{API}/divya/progress/quiz",
                              json={"score": 6, "total_questions": 5,
                                    "tutor": "divya", "language": "en"}, timeout=20)
        assert r.status_code == 400, r.text


class TestStats:
    def test_stats_shape_and_topic(self, auth_session):
        r = auth_session.get(f"{API}/divya/progress/stats", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["success"] is True
        # messages
        m = d["messages"]
        assert set(m.keys()) >= {"today", "week", "all_time"}
        assert all(isinstance(m[k], int) for k in ("today", "week", "all_time"))
        # sessions
        s = d["sessions"]
        assert set(s.keys()) >= {"count", "total_seconds"}
        # streak
        assert isinstance(d["streak_days"], int) and d["streak_days"] >= 0
        # streak should be >=1 since we just started a session today
        assert d["streak_days"] >= 1
        # topics
        assert isinstance(d["topics"], list)
        assert any("NEET" in t and "Physics" in t and "Mechanics" in t for t in d["topics"]), d["topics"]
        # quizzes
        assert isinstance(d["quizzes"], list)
        assert any(q.get("score") == 3 and q.get("total_questions") == 5 for q in d["quizzes"])

    def test_topics_aggregation_no_duplicates(self, auth_session):
        # Start 2 more sessions with different topic combos
        combos = [
            {"tutor": "divya", "language": "en-IN", "exam": "JEE", "subject": "Math", "topic": "Algebra"},
            {"tutor": "sher", "language": "en-IN", "exam": "JEE", "subject": "Math", "topic": "Calculus"},
        ]
        for c in combos:
            r = auth_session.post(f"{API}/divya/progress/session/start", json=c, timeout=20)
            assert r.status_code == 200, r.text
        # Now also start a duplicate of NEET Physics Mechanics (to test dedupe)
        dup = {"tutor": "divya", "language": "en-IN", "exam": "NEET", "subject": "Physics", "topic": "Mechanics"}
        r = auth_session.post(f"{API}/divya/progress/session/start", json=dup, timeout=20)
        assert r.status_code == 200

        r = auth_session.get(f"{API}/divya/progress/stats", timeout=30)
        assert r.status_code == 200
        topics = r.json()["topics"]
        assert any("Algebra" in t for t in topics)
        assert any("Calculus" in t for t in topics)
        # No duplicates
        assert len(topics) == len(set(topics)), f"duplicates found: {topics}"


# Module-level autouse cleanup (runs once at module teardown)
@pytest.fixture(scope="module", autouse=True)
def _module_cleanup():
    yield
    try:
        import pymongo
        client = pymongo.MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        dbname = os.environ.get("DB_NAME", "test_database")
        client[dbname].divya_sessions.delete_many({"user_id": DEMO_USER_ID})
        client[dbname].divya_quiz_attempts.delete_many({"user_id": DEMO_USER_ID})
        print("cleanup: deleted demo1 divya_sessions + divya_quiz_attempts")
    except Exception as e:
        print(f"cleanup skipped: {e}")
