"""
Real-time unread-count push tests (Socket.IO replaces 30s polling).

Verifies:
1. Social socket cookie auto-auth pushes `unread_notifications_count` on connect.
2. Creating a notification pushes a fresh count to the recipient.
3. mark-all-read pushes count=0.
4. Notification REST endpoints accept httpOnly cookie auth (no Authorization header).
5. Messaging socket pushes `unread_messages_count` on connect, on new message,
   and after the conversation is marked read.
"""
import asyncio
import os
import uuid

import pytest
import requests
import socketio

from conftest import (
    API_BASE,
    DEMO_USERNAME, DEMO_PASSWORD,
    DEMO3_USERNAME, DEMO3_PASSWORD,
)

BASE_URL = os.environ.get("TEST_API_BASE", API_BASE).rstrip("/")


def _login(username, password):
    res = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
        "username": username, "password": password
    })
    assert res.status_code == 200, f"login failed for {username}: {res.text}"
    data = res.json()
    return data["access_token"], data["user"]["id"]


async def _wait_for(events, predicate, timeout=8.0):
    """Poll the captured-events list until predicate matches or timeout."""
    waited = 0.0
    while waited < timeout:
        for ev in events:
            if predicate(ev):
                return ev
        await asyncio.sleep(0.2)
        waited += 0.2
    return None


# ---------------------------------------------------------------------------
# Notifications (social socket)
# ---------------------------------------------------------------------------

class TestNotificationPush:

    def setup_method(self):
        self.token1, self.uid1 = _login(DEMO_USERNAME, DEMO_PASSWORD)
        self.token3, self.uid3 = _login(DEMO3_USERNAME, DEMO3_PASSWORD)
        self.cookie1 = {"Cookie": f"session_token={self.token1}"}

    def test_rest_unread_count_cookie_auth(self):
        """Cookie-only request must resolve the user (was broken: header-only)."""
        res = requests.get(f"{BASE_URL}/api/notifications/unread-count",
                           headers=self.cookie1)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert isinstance(data["count"], int)

    def test_rest_list_notifications_cookie_auth(self):
        res = requests.get(f"{BASE_URL}/api/notifications", headers=self.cookie1)
        assert res.status_code == 200
        assert res.json()["success"] is True

    def test_socket_push_lifecycle(self):
        asyncio.run(self._socket_push_lifecycle())

    async def _socket_push_lifecycle(self):
        events = []
        client = socketio.AsyncClient()

        @client.on("unread_notifications_count")
        async def _on_count(data):
            events.append(data)

        await client.connect(
            BASE_URL,
            socketio_path="/api/socialws/socket.io",
            headers=self.cookie1,
            transports=["polling"],
        )
        try:
            # 1) Initial push on connect (cookie auto-auth)
            initial = await _wait_for(events, lambda e: "unread_count" in e)
            assert initial is not None, "no initial unread_notifications_count push on connect"

            rest = requests.get(f"{BASE_URL}/api/notifications/unread-count",
                                headers=self.cookie1).json()
            assert initial["unread_count"] == rest["count"]

            # 2) Create a notification for demo1 -> expect a pushed count bump
            events.clear()
            post_id = str(uuid.uuid4())
            res = requests.post(
                f"{BASE_URL}/api/notifications/create/like",
                params={"post_id": post_id, "post_owner_id": self.uid1},
                headers={"Authorization": f"Bearer {self.uid3}"},
            )
            assert res.status_code == 200, res.text

            pushed = await _wait_for(events, lambda e: e.get("unread_count", 0) >= 1)
            assert pushed is not None, "no push after notification creation"

            # 3) mark-all-read via cookie -> expect pushed count == 0
            events.clear()
            res = requests.put(f"{BASE_URL}/api/notifications/mark-all-read",
                               headers=self.cookie1)
            assert res.status_code == 200, res.text

            zeroed = await _wait_for(events, lambda e: e.get("unread_count") == 0)
            assert zeroed is not None, "no push (count=0) after mark-all-read"

            # 4) Explicit client-driven resync event
            events.clear()
            await client.emit("request_unread_notifications_count")
            resync = await _wait_for(events, lambda e: "unread_count" in e)
            assert resync is not None, "request_unread_notifications_count not answered"
            assert resync["unread_count"] == 0
        finally:
            await client.disconnect()


# ---------------------------------------------------------------------------
# Messages (messaging socket)
# ---------------------------------------------------------------------------

class TestMessagePush:

    def setup_method(self):
        self.token1, self.uid1 = _login(DEMO_USERNAME, DEMO_PASSWORD)
        self.token3, self.uid3 = _login(DEMO3_USERNAME, DEMO3_PASSWORD)
        self.cookie1 = {"Cookie": f"session_token={self.token1}"}
        self.auth3 = {"Authorization": f"Bearer {self.token3}"}

        # Ensure a conversation exists between demo1 and demo3
        res = requests.post(f"{BASE_URL}/api/messages/conversations",
                            json={"target_user_id": self.uid1},
                            headers=self.auth3)
        assert res.status_code == 200, res.text
        self.conv_id = res.json()["conversation"]["id"]

    def test_socket_push_lifecycle(self):
        asyncio.run(self._socket_push_lifecycle())

    async def _socket_push_lifecycle(self):
        events = []
        client = socketio.AsyncClient()

        @client.on("unread_messages_count")
        async def _on_count(data):
            events.append(data)

        await client.connect(
            BASE_URL,
            socketio_path="/api/messagews/socket.io",
            headers=self.cookie1,
            transports=["polling"],
        )
        try:
            # 1) Initial push on connect
            initial = await _wait_for(events, lambda e: "unread_count" in e)
            assert initial is not None, "no initial unread_messages_count push on connect"

            # 2) demo3 sends demo1 a message -> pushed count must increase
            events.clear()
            res = requests.post(
                f"{BASE_URL}/api/messages/conversations/{self.conv_id}/messages",
                json={"text": "realtime push test"},
                headers=self.auth3,
            )
            assert res.status_code == 200, res.text

            bumped = await _wait_for(
                events, lambda e: e.get("unread_count", 0) > initial["unread_count"])
            assert bumped is not None, "no push after new message"

            # 3) demo1 marks the conversation read -> pushed count must drop
            events.clear()
            res = requests.put(
                f"{BASE_URL}/api/messages/conversations/{self.conv_id}/read",
                headers=self.cookie1,
            )
            assert res.status_code == 200, res.text

            dropped = await _wait_for(
                events, lambda e: e.get("unread_count", 0) < bumped["unread_count"])
            assert dropped is not None, "no push after mark-read"
        finally:
            await client.disconnect()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
