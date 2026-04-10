"""
Messaging API Tests - Real-time messaging system for Ceibaa platform
Tests: conversations CRUD, messages CRUD, unread counts
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://profile-social-4.preview.emergentagent.com').rstrip('/')

# Test credentials from test_credentials.md
DEMO1_USERNAME = "demo1"
DEMO1_PASSWORD = "demo1"
DEMO3_USERNAME = "demo3"
DEMO3_PASSWORD = "demo3"

# Known IDs from agent context
DEMO1_USER_ID = "ab3581a5-23e6-407d-a7ac-21e0f4da2b4f"
DEMO3_USER_ID = "demo3-uuid"
EXISTING_CONVERSATION_ID = "3671b9df-ac8f-4e3a-b7e1-b10b949a2d78"


class TestMessagingAPI:
    """Messaging endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth tokens"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as demo1
        login_res = self.session.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": DEMO1_USERNAME,
            "password": DEMO1_PASSWORD
        })
        assert login_res.status_code == 200, f"Demo1 login failed: {login_res.text}"
        data = login_res.json()
        self.demo1_token = data.get("access_token")
        self.demo1_user = data.get("user", {})
        self.demo1_id = self.demo1_user.get("id")
        assert self.demo1_token, "No access_token returned for demo1"
        
        # Login as demo3
        login_res3 = self.session.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": DEMO3_USERNAME,
            "password": DEMO3_PASSWORD
        })
        assert login_res3.status_code == 200, f"Demo3 login failed: {login_res3.text}"
        data3 = login_res3.json()
        self.demo3_token = data3.get("access_token")
        self.demo3_user = data3.get("user", {})
        self.demo3_id = self.demo3_user.get("id")
        assert self.demo3_token, "No access_token returned for demo3"
        
        print(f"Demo1 ID: {self.demo1_id}, Demo3 ID: {self.demo3_id}")
    
    # ============ CONVERSATION TESTS ============
    
    def test_create_conversation_returns_existing(self):
        """POST /api/messages/conversations - returns existing conversation if already exists (idempotent)"""
        headers = {"Authorization": f"Bearer {self.demo1_token}"}
        
        # Create/get conversation with demo3
        res = self.session.post(
            f"{BASE_URL}/api/messages/conversations",
            json={"target_user_id": self.demo3_id},
            headers=headers
        )
        
        assert res.status_code == 200, f"Create conversation failed: {res.text}"
        data = res.json()
        assert data.get("success") == True
        assert "conversation" in data
        conv = data["conversation"]
        assert "id" in conv
        assert "participants" in conv
        assert len(conv["participants"]) == 2
        
        # Store conversation ID for later tests
        self.conversation_id = conv["id"]
        print(f"Conversation ID: {self.conversation_id}")
        
        # Call again - should return same conversation (idempotent)
        res2 = self.session.post(
            f"{BASE_URL}/api/messages/conversations",
            json={"target_user_id": self.demo3_id},
            headers=headers
        )
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["conversation"]["id"] == conv["id"], "Should return same conversation"
    
    def test_create_conversation_cannot_message_self(self):
        """POST /api/messages/conversations - cannot create conversation with self"""
        headers = {"Authorization": f"Bearer {self.demo1_token}"}
        
        res = self.session.post(
            f"{BASE_URL}/api/messages/conversations",
            json={"target_user_id": self.demo1_id},
            headers=headers
        )
        
        assert res.status_code == 400, f"Should fail when messaging self: {res.text}"
        data = res.json()
        assert "Cannot message yourself" in str(data.get("detail", ""))
    
    def test_create_conversation_invalid_user(self):
        """POST /api/messages/conversations - returns 404 for non-existent user"""
        headers = {"Authorization": f"Bearer {self.demo1_token}"}
        
        res = self.session.post(
            f"{BASE_URL}/api/messages/conversations",
            json={"target_user_id": "non-existent-user-id-12345"},
            headers=headers
        )
        
        assert res.status_code == 404, f"Should return 404 for non-existent user: {res.text}"
    
    def test_list_conversations(self):
        """GET /api/messages/conversations - lists all conversations for current user"""
        headers = {"Authorization": f"Bearer {self.demo1_token}"}
        
        res = self.session.get(f"{BASE_URL}/api/messages/conversations", headers=headers)
        
        assert res.status_code == 200, f"List conversations failed: {res.text}"
        data = res.json()
        assert data.get("success") == True
        assert "conversations" in data
        assert isinstance(data["conversations"], list)
        
        # Should have at least one conversation (the one we created/got)
        if len(data["conversations"]) > 0:
            conv = data["conversations"][0]
            assert "id" in conv
            assert "participants" in conv
            assert "other_user" in conv, "Should have other_user enrichment"
            assert "unread" in conv, "Should have unread count"
            
            # Verify other_user enrichment
            other_user = conv["other_user"]
            assert "id" in other_user
            assert "name" in other_user
            assert "username" in other_user
            print(f"Found {len(data['conversations'])} conversations")
    
    def test_list_conversations_unauthorized(self):
        """GET /api/messages/conversations - returns 401 without auth"""
        res = self.session.get(f"{BASE_URL}/api/messages/conversations")
        assert res.status_code == 401, f"Should return 401 without auth: {res.text}"
    
    # ============ MESSAGE TESTS ============
    
    def test_send_message(self):
        """POST /api/messages/conversations/{id}/messages - sends a text message"""
        headers = {"Authorization": f"Bearer {self.demo1_token}"}
        
        # First get/create conversation
        conv_res = self.session.post(
            f"{BASE_URL}/api/messages/conversations",
            json={"target_user_id": self.demo3_id},
            headers=headers
        )
        conv_id = conv_res.json()["conversation"]["id"]
        
        # Send message
        test_message = f"Test message from pytest at {os.urandom(4).hex()}"
        res = self.session.post(
            f"{BASE_URL}/api/messages/conversations/{conv_id}/messages",
            json={"text": test_message},
            headers=headers
        )
        
        assert res.status_code == 200, f"Send message failed: {res.text}"
        data = res.json()
        assert data.get("success") == True
        assert "message" in data
        msg = data["message"]
        assert msg["text"] == test_message
        assert msg["sender_id"] == self.demo1_id
        assert "id" in msg
        assert "timestamp" in msg
        assert msg["read"] == False
        print(f"Sent message ID: {msg['id']}")
    
    def test_send_empty_message_fails(self):
        """POST /api/messages/conversations/{id}/messages - empty message fails"""
        headers = {"Authorization": f"Bearer {self.demo1_token}"}
        
        # Get conversation
        conv_res = self.session.post(
            f"{BASE_URL}/api/messages/conversations",
            json={"target_user_id": self.demo3_id},
            headers=headers
        )
        conv_id = conv_res.json()["conversation"]["id"]
        
        # Try to send empty message
        res = self.session.post(
            f"{BASE_URL}/api/messages/conversations/{conv_id}/messages",
            json={"text": "   "},  # whitespace only
            headers=headers
        )
        
        assert res.status_code == 400, f"Should fail for empty message: {res.text}"
    
    def test_get_messages(self):
        """GET /api/messages/conversations/{id}/messages - retrieves message history"""
        headers = {"Authorization": f"Bearer {self.demo1_token}"}
        
        # Get conversation
        conv_res = self.session.post(
            f"{BASE_URL}/api/messages/conversations",
            json={"target_user_id": self.demo3_id},
            headers=headers
        )
        conv_id = conv_res.json()["conversation"]["id"]
        
        # Get messages
        res = self.session.get(
            f"{BASE_URL}/api/messages/conversations/{conv_id}/messages",
            headers=headers
        )
        
        assert res.status_code == 200, f"Get messages failed: {res.text}"
        data = res.json()
        assert data.get("success") == True
        assert "messages" in data
        assert "conversation" in data
        assert isinstance(data["messages"], list)
        
        # Verify message structure if any exist
        if len(data["messages"]) > 0:
            msg = data["messages"][0]
            assert "id" in msg
            assert "text" in msg
            assert "sender_id" in msg
            assert "timestamp" in msg
            print(f"Found {len(data['messages'])} messages in conversation")
    
    def test_get_messages_access_denied(self):
        """GET /api/messages/conversations/{id}/messages - access denied for non-participant"""
        # Create a fake conversation ID
        fake_conv_id = "fake-conversation-id-12345"
        headers = {"Authorization": f"Bearer {self.demo1_token}"}
        
        res = self.session.get(
            f"{BASE_URL}/api/messages/conversations/{fake_conv_id}/messages",
            headers=headers
        )
        
        assert res.status_code == 403, f"Should return 403 for non-participant: {res.text}"
    
    # ============ READ RECEIPTS TESTS ============
    
    def test_mark_messages_read(self):
        """PUT /api/messages/conversations/{id}/read - marks messages as read"""
        headers = {"Authorization": f"Bearer {self.demo1_token}"}
        
        # Get conversation
        conv_res = self.session.post(
            f"{BASE_URL}/api/messages/conversations",
            json={"target_user_id": self.demo3_id},
            headers=headers
        )
        conv_id = conv_res.json()["conversation"]["id"]
        
        # Mark as read
        res = self.session.put(
            f"{BASE_URL}/api/messages/conversations/{conv_id}/read",
            headers=headers
        )
        
        assert res.status_code == 200, f"Mark read failed: {res.text}"
        data = res.json()
        assert data.get("success") == True
    
    # ============ UNREAD COUNT TESTS ============
    
    def test_get_unread_count(self):
        """GET /api/messages/unread-count - returns total unread count"""
        headers = {"Authorization": f"Bearer {self.demo1_token}"}
        
        res = self.session.get(f"{BASE_URL}/api/messages/unread-count", headers=headers)
        
        assert res.status_code == 200, f"Get unread count failed: {res.text}"
        data = res.json()
        assert data.get("success") == True
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
        assert data["unread_count"] >= 0
        print(f"Unread count: {data['unread_count']}")
    
    def test_unread_count_unauthorized(self):
        """GET /api/messages/unread-count - returns 401 without auth"""
        res = self.session.get(f"{BASE_URL}/api/messages/unread-count")
        assert res.status_code == 401, f"Should return 401 without auth: {res.text}"
    
    # ============ INTEGRATION TESTS ============
    
    def test_full_messaging_flow(self):
        """Full flow: create conversation -> send message -> verify in list -> mark read"""
        # Demo1 creates conversation with Demo3
        headers1 = {"Authorization": f"Bearer {self.demo1_token}"}
        headers3 = {"Authorization": f"Bearer {self.demo3_token}"}
        
        # 1. Create conversation
        conv_res = self.session.post(
            f"{BASE_URL}/api/messages/conversations",
            json={"target_user_id": self.demo3_id},
            headers=headers1
        )
        assert conv_res.status_code == 200
        conv_id = conv_res.json()["conversation"]["id"]
        
        # 2. Demo1 sends message
        unique_text = f"Integration test message {os.urandom(4).hex()}"
        msg_res = self.session.post(
            f"{BASE_URL}/api/messages/conversations/{conv_id}/messages",
            json={"text": unique_text},
            headers=headers1
        )
        assert msg_res.status_code == 200
        
        # 3. Demo3 should see conversation in their list
        list_res = self.session.get(f"{BASE_URL}/api/messages/conversations", headers=headers3)
        assert list_res.status_code == 200
        convs = list_res.json()["conversations"]
        found = any(c["id"] == conv_id for c in convs)
        assert found, "Demo3 should see the conversation"
        
        # 4. Demo3 gets messages
        msgs_res = self.session.get(
            f"{BASE_URL}/api/messages/conversations/{conv_id}/messages",
            headers=headers3
        )
        assert msgs_res.status_code == 200
        messages = msgs_res.json()["messages"]
        found_msg = any(m["text"] == unique_text for m in messages)
        assert found_msg, "Demo3 should see the message"
        
        # 5. Demo3 marks as read
        read_res = self.session.put(
            f"{BASE_URL}/api/messages/conversations/{conv_id}/read",
            headers=headers3
        )
        assert read_res.status_code == 200
        
        print("Full messaging flow completed successfully!")
    
    def test_conversation_updates_after_message(self):
        """Verify conversation list updates preview text after sending message"""
        headers = {"Authorization": f"Bearer {self.demo1_token}"}
        
        # Get/create conversation
        conv_res = self.session.post(
            f"{BASE_URL}/api/messages/conversations",
            json={"target_user_id": self.demo3_id},
            headers=headers
        )
        conv_id = conv_res.json()["conversation"]["id"]
        
        # Send a unique message
        unique_text = f"Preview update test {os.urandom(4).hex()}"
        self.session.post(
            f"{BASE_URL}/api/messages/conversations/{conv_id}/messages",
            json={"text": unique_text},
            headers=headers
        )
        
        # Get conversation list and verify preview updated
        list_res = self.session.get(f"{BASE_URL}/api/messages/conversations", headers=headers)
        convs = list_res.json()["conversations"]
        
        target_conv = next((c for c in convs if c["id"] == conv_id), None)
        assert target_conv is not None
        assert target_conv.get("last_message_text") == unique_text[:100], "Preview text should update"
        assert target_conv.get("last_message") == self.demo1_id, "last_message should be sender ID"
        print("Conversation preview updated correctly!")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
