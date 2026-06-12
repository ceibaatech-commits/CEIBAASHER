"""
Test History feature — full CRUD + pagination/filter + percentage auto-calc.

S3 uploads degrade gracefully in this environment (no AWS credentials yet),
so `s3_uploaded` is expected to be False and `s3_key` None until keys are
added to backend/.env.
"""
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests

from conftest import API_BASE

BASE_URL = os.environ.get("TEST_API_BASE", API_BASE).rstrip("/")
USER_ID = f"th-test-user-{uuid.uuid4().hex[:8]}"


def _payload(**overrides):
    completed = datetime.now(timezone.utc)
    base = {
        "test_id": f"test-{uuid.uuid4().hex[:6]}",
        "test_name": "NEET Mock Test 1",
        "subject": "Physics",
        "exam_category": "Medical",
        "started_at": (completed - timedelta(minutes=30)).isoformat(),
        "completed_at": completed.isoformat(),
        "time_spent_seconds": 1800,
        "total_marks": 200,
        "marks_obtained": 150,
        "questions_total": 50,
        "questions_attempted": 45,
        "questions_correct": 38,
        "questions_wrong": 7,
        "questions_skipped": 5,
        "topic_breakdown": [
            {"topic": "Kinematics", "chapter": "Motion in a Straight Line",
             "questions_total": 10, "questions_attempted": 9,
             "questions_correct": 8, "score": 30.0},
            {"topic": "Optics", "chapter": "Ray Optics",
             "questions_total": 10, "questions_attempted": 8,
             "questions_correct": 6, "score": 22.0},
        ],
        "is_battle": False,
        "opponent_user_id": None,
    }
    base.update(overrides)
    return base


class TestTestHistoryCRUD:

    def test_01_create_calculates_percentage(self):
        res = requests.post(f"{BASE_URL}/api/test-history/",
                            params={"user_id": USER_ID}, json=_payload())
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["success"] is True
        entry = data["entry"]
        assert entry["user_id"] == USER_ID
        assert entry["percentage"] == 75.0  # 150/200 auto-calculated
        assert len(entry["topic_breakdown"]) == 2
        assert entry["topic_breakdown"][0]["topic"] == "Kinematics"
        # No AWS creds in this env -> graceful degradation
        assert data["s3_uploaded"] is False
        TestTestHistoryCRUD.entry_id = entry["id"]

    def test_02_create_battle_and_chemistry_entries(self):
        battle = _payload(is_battle=True, opponent_user_id="opponent-123",
                          subject="Physics", marks_obtained=100)
        chem = _payload(subject="Chemistry", exam_category="Medical",
                        marks_obtained=180)
        for p in (battle, chem):
            res = requests.post(f"{BASE_URL}/api/test-history/",
                                params={"user_id": USER_ID}, json=p)
            assert res.status_code == 200, res.text

    def test_03_list_paginated(self):
        res = requests.get(f"{BASE_URL}/api/test-history/",
                           params={"user_id": USER_ID, "page": 1, "page_size": 2})
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["total"] == 3
        assert len(data["items"]) == 2
        assert data["total_pages"] == 2
        # newest first
        dates = [i["completed_at"] for i in data["items"]]
        assert dates == sorted(dates, reverse=True)

    def test_04_filters(self):
        # subject filter
        res = requests.get(f"{BASE_URL}/api/test-history/",
                           params={"user_id": USER_ID, "subject": "Chemistry"})
        assert res.json()["total"] == 1
        # is_battle filter
        res = requests.get(f"{BASE_URL}/api/test-history/",
                           params={"user_id": USER_ID, "is_battle": "true"})
        data = res.json()
        assert data["total"] == 1
        assert data["items"][0]["opponent_user_id"] == "opponent-123"
        # exam_category filter
        res = requests.get(f"{BASE_URL}/api/test-history/",
                           params={"user_id": USER_ID, "exam_category": "Medical"})
        assert res.json()["total"] == 3

    def test_05_get_single(self):
        res = requests.get(f"{BASE_URL}/api/test-history/{self.entry_id}",
                           params={"user_id": USER_ID})
        assert res.status_code == 200, res.text
        assert res.json()["entry"]["id"] == self.entry_id

    def test_06_get_single_wrong_user_404(self):
        res = requests.get(f"{BASE_URL}/api/test-history/{self.entry_id}",
                           params={"user_id": "someone-else"})
        assert res.status_code == 404

    def test_07_delete(self):
        res = requests.delete(f"{BASE_URL}/api/test-history/{self.entry_id}",
                              params={"user_id": USER_ID})
        assert res.status_code == 200, res.text
        assert res.json()["deleted_id"] == self.entry_id
        # really gone
        res = requests.get(f"{BASE_URL}/api/test-history/{self.entry_id}",
                           params={"user_id": USER_ID})
        assert res.status_code == 404

    def test_08_delete_missing_404(self):
        res = requests.delete(f"{BASE_URL}/api/test-history/{uuid.uuid4()}",
                              params={"user_id": USER_ID})
        assert res.status_code == 404

    def test_09_validation_rejects_negative_marks(self):
        res = requests.post(f"{BASE_URL}/api/test-history/",
                            params={"user_id": USER_ID},
                            json=_payload(marks_obtained=-5))
        assert res.status_code == 422

    def test_10_zero_total_marks_percentage_zero(self):
        res = requests.post(f"{BASE_URL}/api/test-history/",
                            params={"user_id": USER_ID},
                            json=_payload(total_marks=0, marks_obtained=0))
        assert res.status_code == 200, res.text
        assert res.json()["entry"]["percentage"] == 0.0

    @classmethod
    def teardown_class(cls):
        """Clean up all docs created by this run."""
        res = requests.get(f"{BASE_URL}/api/test-history/",
                           params={"user_id": USER_ID, "page_size": 100})
        for item in res.json().get("items", []):
            requests.delete(f"{BASE_URL}/api/test-history/{item['id']}",
                            params={"user_id": USER_ID})


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
