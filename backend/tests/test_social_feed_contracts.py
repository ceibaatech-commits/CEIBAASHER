"""Contract tests for social feed endpoints response shape consistency."""

import os
import requests
import pytest


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


@pytest.mark.skipif(not BASE_URL, reason="REACT_APP_BACKEND_URL is not set")
class TestSocialFeedContracts:
    def _assert_feed_shape(self, data: dict):
        assert isinstance(data, dict)
        assert "success" in data
        assert "posts" in data
        assert "count" in data
        assert "has_more" in data
        assert "total" in data
        assert isinstance(data["posts"], list)
        assert isinstance(data["count"], int)
        assert isinstance(data["has_more"], bool)
        assert isinstance(data["total"], int)

    def test_trending_contract_shape(self):
        response = requests.get(f"{BASE_URL}/api/social/feed/trending?skip=0&limit=10", timeout=20)
        assert response.status_code == 200, response.text
        data = response.json()
        self._assert_feed_shape(data)

    def test_for_you_contract_shape_anonymous(self):
        response = requests.get(f"{BASE_URL}/api/social/feed/for-you?skip=0&limit=10", timeout=20)
        assert response.status_code == 200, response.text
        data = response.json()
        self._assert_feed_shape(data)

    def test_following_contract_shape_anonymous(self):
        response = requests.get(f"{BASE_URL}/api/social/feed/following?skip=0&limit=10", timeout=20)
        assert response.status_code == 200, response.text
        data = response.json()
        self._assert_feed_shape(data)

    def test_following_contract_shape_authenticated(self):
        login = requests.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"username": "demo1", "password": "demo1"},
            timeout=20,
        )
        assert login.status_code == 200, login.text
        token = login.json().get("access_token")
        assert token, "No access_token returned from demo login"

        response = requests.get(
            f"{BASE_URL}/api/social/feed/following?skip=0&limit=10",
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        self._assert_feed_shape(data)
