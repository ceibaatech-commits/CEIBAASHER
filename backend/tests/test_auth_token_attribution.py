"""
Test Suite: Authentication Token Attribution Bug Fix
Tests the critical bug where posts were attributed to wrong users after logout/re-login

Key scenarios tested:
1. Login flow clears old tokens before setting new ones
2. Logout properly removes all tokens
3. Post creation uses token from request correctly
4. Token validation prevents posting with invalid/undefined tokens
5. Multiple login/logout cycles maintain correct user attribution
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://test-history-board.preview.emergentagent.com"


class TestDemoLogin:
    """Test demo login endpoint returns valid tokens"""
    
    def test_demo1_login_returns_token(self):
        """Demo1 login should return valid access_token"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert data["access_token"] is not None, "access_token should not be None"
        assert data["access_token"] != "undefined", "access_token should not be 'undefined'"
        assert len(data["access_token"]) > 20, "access_token should be a valid JWT"
        
        # Verify user data
        assert "user" in data, "Response should contain user data"
        assert data["user"]["id"] == "demo1-uuid", f"User ID should be demo1-uuid, got {data['user']['id']}"
        assert data["user"]["name"] == "Demo Student 1"
    
    def test_demo2_login_returns_different_token(self):
        """Demo2 login should return different token than demo1"""
        # Login as demo1
        response1 = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        assert response1.status_code == 200
        token1 = response1.json()["access_token"]
        user1_id = response1.json()["user"]["id"]
        
        # Login as demo2
        response2 = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo2",
            "password": "demo2"
        })
        assert response2.status_code == 200
        token2 = response2.json()["access_token"]
        user2_id = response2.json()["user"]["id"]
        
        # Tokens should be different
        assert token1 != token2, "Different users should get different tokens"
        assert user1_id != user2_id, "Different users should have different IDs"
        assert user1_id == "demo1-uuid"
        assert user2_id == "demo2-uuid"
    
    def test_invalid_credentials_rejected(self):
        """Invalid credentials should be rejected"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_nonexistent_user_rejected(self):
        """Non-existent user should be rejected"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "nonexistent",
            "password": "password"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestPostCreationWithCorrectUser:
    """Test that posts are attributed to the correct user based on token"""
    
    def test_post_created_with_demo1_token_has_demo1_user_id(self):
        """Post created with demo1 token should have demo1's user_id"""
        # Login as demo1
        login_response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        expected_user_id = login_response.json()["user"]["id"]
        
        # Create post with demo1's token
        post_response = requests.post(
            f"{BASE_URL}/api/social/posts",
            json={
                "post_type": "general",
                "content": f"Test post from demo1 - {time.time()}"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert post_response.status_code == 200, f"Post creation failed: {post_response.text}"
        post_data = post_response.json()
        
        assert post_data["success"] == True
        assert post_data["post"]["user_id"] == expected_user_id, \
            f"Post user_id should be {expected_user_id}, got {post_data['post']['user_id']}"
        assert post_data["post"]["user_name"] == "Demo Student 1"
    
    def test_post_created_with_demo2_token_has_demo2_user_id(self):
        """Post created with demo2 token should have demo2's user_id"""
        # Login as demo2
        login_response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo2",
            "password": "demo2"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        expected_user_id = login_response.json()["user"]["id"]
        
        # Create post with demo2's token
        post_response = requests.post(
            f"{BASE_URL}/api/social/posts",
            json={
                "post_type": "general",
                "content": f"Test post from demo2 - {time.time()}"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert post_response.status_code == 200, f"Post creation failed: {post_response.text}"
        post_data = post_response.json()
        
        assert post_data["success"] == True
        assert post_data["post"]["user_id"] == expected_user_id, \
            f"Post user_id should be {expected_user_id}, got {post_data['post']['user_id']}"
        assert post_data["post"]["user_name"] == "Demo Student 2"


class TestTokenValidation:
    """Test that invalid/missing tokens are properly rejected"""
    
    def test_post_without_token_rejected(self):
        """Post creation without token should be rejected"""
        response = requests.post(
            f"{BASE_URL}/api/social/posts",
            json={
                "post_type": "general",
                "content": "Test post without token"
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_post_with_invalid_token_rejected(self):
        """Post creation with invalid token should be rejected"""
        response = requests.post(
            f"{BASE_URL}/api/social/posts",
            json={
                "post_type": "general",
                "content": "Test post with invalid token"
            },
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_post_with_undefined_token_rejected(self):
        """Post creation with 'undefined' token should be rejected"""
        response = requests.post(
            f"{BASE_URL}/api/social/posts",
            json={
                "post_type": "general",
                "content": "Test post with undefined token"
            },
            headers={"Authorization": "Bearer undefined"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_post_with_null_token_rejected(self):
        """Post creation with 'null' token should be rejected"""
        response = requests.post(
            f"{BASE_URL}/api/social/posts",
            json={
                "post_type": "general",
                "content": "Test post with null token"
            },
            headers={"Authorization": "Bearer null"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestMultipleLoginLogoutCycles:
    """Test that multiple login/logout cycles maintain correct user attribution"""
    
    def test_sequential_logins_different_users(self):
        """Sequential logins with different users should return correct tokens"""
        # First login as demo1
        response1 = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        assert response1.status_code == 200
        token1 = response1.json()["access_token"]
        
        # Then login as demo2 (simulating logout + re-login)
        response2 = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo2",
            "password": "demo2"
        })
        assert response2.status_code == 200
        token2 = response2.json()["access_token"]
        
        # Create post with demo2's token - should be attributed to demo2
        post_response = requests.post(
            f"{BASE_URL}/api/social/posts",
            json={
                "post_type": "general",
                "content": f"Post after re-login as demo2 - {time.time()}"
            },
            headers={"Authorization": f"Bearer {token2}"}
        )
        
        assert post_response.status_code == 200
        post_data = post_response.json()
        assert post_data["post"]["user_id"] == "demo2-uuid", \
            f"Post should be attributed to demo2, got {post_data['post']['user_id']}"
        assert post_data["post"]["user_name"] == "Demo Student 2"
    
    def test_old_token_still_works_after_new_login(self):
        """Old token should still work (backend doesn't invalidate on new login)"""
        # Login as demo1
        response1 = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        token1 = response1.json()["access_token"]
        
        # Login as demo2
        response2 = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo2",
            "password": "demo2"
        })
        token2 = response2.json()["access_token"]
        
        # Old token (demo1) should still work and attribute to demo1
        post_response = requests.post(
            f"{BASE_URL}/api/social/posts",
            json={
                "post_type": "general",
                "content": f"Post with old demo1 token - {time.time()}"
            },
            headers={"Authorization": f"Bearer {token1}"}
        )
        
        assert post_response.status_code == 200
        post_data = post_response.json()
        # This is the critical test - using demo1's token should attribute to demo1
        assert post_data["post"]["user_id"] == "demo1-uuid", \
            f"Post with demo1 token should be attributed to demo1, got {post_data['post']['user_id']}"
    
    def test_three_user_cycle(self):
        """Test login cycle with three different users"""
        users = [
            {"username": "demo1", "password": "demo1", "expected_id": "demo1-uuid", "expected_name": "Demo Student 1"},
            {"username": "demo2", "password": "demo2", "expected_id": "demo2-uuid", "expected_name": "Demo Student 2"},
            {"username": "demo3", "password": "demo3", "expected_id": "demo3-uuid", "expected_name": "Demo Student 3"},
        ]
        
        for user in users:
            # Login
            login_response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
                "username": user["username"],
                "password": user["password"]
            })
            assert login_response.status_code == 200
            token = login_response.json()["access_token"]
            
            # Create post
            post_response = requests.post(
                f"{BASE_URL}/api/social/posts",
                json={
                    "post_type": "general",
                    "content": f"Test post from {user['username']} - {time.time()}"
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            
            assert post_response.status_code == 200
            post_data = post_response.json()
            assert post_data["post"]["user_id"] == user["expected_id"], \
                f"Post should be attributed to {user['expected_id']}, got {post_data['post']['user_id']}"
            assert post_data["post"]["user_name"] == user["expected_name"]


class TestQuestionPostCreation:
    """Test question post creation with correct user attribution"""
    
    def test_question_post_attributed_correctly(self):
        """Question posts should be attributed to correct user"""
        # Login as demo1
        login_response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Create question post
        post_response = requests.post(
            f"{BASE_URL}/api/social/posts",
            json={
                "post_type": "question",
                "content": f"Test question from demo1 - {time.time()}"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert post_response.status_code == 200
        post_data = post_response.json()
        assert post_data["post"]["user_id"] == "demo1-uuid"
        assert post_data["post"]["post_type"] == "question"


class TestFeedEndpoints:
    """Test feed endpoints work correctly"""
    
    def test_for_you_feed_loads(self):
        """For-you feed should load without authentication"""
        response = requests.get(f"{BASE_URL}/api/social/feed/for-you")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "posts" in data
    
    def test_authenticated_feed_loads(self):
        """Feed should load with authentication"""
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        token = login_response.json()["access_token"]
        
        # Get feed with auth
        response = requests.get(
            f"{BASE_URL}/api/social/feed/for-you",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
