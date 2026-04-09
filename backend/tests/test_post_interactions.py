"""
Test Post Interactions (Likes and Comments) Bug Fixes
======================================================
Testing the following bug fixes:
1. SinglePost.js handleLike() - Fixed: now calls DELETE for unlike instead of always POST
2. SinglePost.js handleSubmitComment() - Fixed: changed endpoint from /comments (plural) to /comment (singular)
3. Backend get_optional_user_id_async() - New async function supporting both JWT and session tokens

Test user: testbug@test.com / test1234 / username: testbug
Test post ID: c176c31e-e253-4767-a1aa-e610a70692ff
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://test-history-board.preview.emergentagent.com').rstrip('/')

# Test credentials from main agent
TEST_USER_EMAIL = "testbug@test.com"
TEST_USER_PASSWORD = "test1234"
TEST_USER_USERNAME = "testbug"
TEST_POST_ID = "c176c31e-e253-4767-a1aa-e610a70692ff"


class TestAuth:
    """Authentication tests for test user"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    def test_login_test_user(self, session):
        """Test that the test user can log in"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data or "access_token" in data, f"No token in response: {data}"


class TestLikeEndpoints:
    """Test like/unlike API endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for test user"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip(f"Authentication failed: {response.text}")
    
    def test_like_post_endpoint_exists(self, auth_token):
        """Test POST /api/social/posts/{post_id}/like endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/like",
            headers=headers,
            json={}
        )
        # Should be 200 (success or already liked)
        assert response.status_code == 200, f"Like endpoint failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Like response not successful: {data}"
    
    def test_unlike_post_endpoint_exists(self, auth_token):
        """Test DELETE /api/social/posts/{post_id}/like endpoint - THE BUG FIX"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.delete(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/like",
            headers=headers
        )
        # Should be 200 (success)
        assert response.status_code == 200, f"Unlike endpoint failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Unlike response not successful: {data}"
    
    def test_like_toggle_sequence(self, auth_token):
        """Test like -> unlike -> like sequence to verify toggle works"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Step 1: Like the post
        response1 = requests.post(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/like",
            headers=headers,
            json={}
        )
        assert response1.status_code == 200, f"Like failed: {response1.text}"
        
        # Step 2: Unlike the post (using DELETE - THE FIX)
        response2 = requests.delete(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/like",
            headers=headers
        )
        assert response2.status_code == 200, f"Unlike failed: {response2.text}"
        
        # Step 3: Like again
        response3 = requests.post(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/like",
            headers=headers,
            json={}
        )
        assert response3.status_code == 200, f"Re-like failed: {response3.text}"
        
        print("Like toggle sequence completed successfully")


class TestCommentEndpoints:
    """Test comment API endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for test user"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip(f"Authentication failed: {response.text}")
    
    def test_comment_endpoint_singular(self, auth_token):
        """Test POST /api/social/posts/{post_id}/comment endpoint (singular) - THE BUG FIX"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        comment_content = f"Test comment at {time.time()}"
        
        response = requests.post(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/comment",
            headers=headers,
            json={"content": comment_content}
        )
        
        assert response.status_code == 200, f"Comment endpoint failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Comment response not successful: {data}"
        assert "comment" in data, f"No comment in response: {data}"
        
        comment = data["comment"]
        assert comment.get("content") == comment_content, f"Comment content mismatch: {comment}"
        print(f"Comment created successfully: {comment.get('id')}")
    
    def test_comments_endpoint_plural_should_404(self, auth_token):
        """Test that POST /api/social/posts/{post_id}/comments (plural) returns 404/405 - verify old endpoint is gone"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/comments",
            headers=headers,
            json={"content": "This should fail"}
        )
        
        # Should NOT be 200 - old endpoint should not work
        assert response.status_code in [404, 405], f"Old /comments endpoint should fail but got {response.status_code}"
        print(f"Old /comments endpoint correctly returns {response.status_code}")
    
    def test_get_comments(self, auth_token):
        """Test GET /api/social/posts/{post_id}/comments endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/comments",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get comments failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Get comments not successful: {data}"
        assert "comments" in data, f"No comments in response: {data}"
        print(f"Found {len(data['comments'])} comments")


class TestPostViewWithLikeStatus:
    """Test that post view returns liked_by_user status correctly"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for test user"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip(f"Authentication failed: {response.text}")
    
    def test_get_post_with_like_status(self, auth_token):
        """Test GET /api/social/posts/{post_id} returns liked_by_user"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get post failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Get post not successful: {data}"
        assert "post" in data, f"No post in response: {data}"
        
        post = data["post"]
        # liked_by_user should be present (either True or False)
        assert "liked_by_user" in post, f"liked_by_user not in post: {post.keys()}"
        print(f"Post liked_by_user: {post['liked_by_user']}")
        print(f"Post likes_count: {post.get('likes_count', 0)}")
    
    def test_like_persists_after_refresh(self, auth_token):
        """Test that like status persists after page refresh (re-fetch)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Step 1: Like the post
        requests.post(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/like",
            headers=headers,
            json={}
        )
        
        # Step 2: Fetch post and verify liked_by_user is True
        response = requests.get(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get post failed: {response.text}"
        data = response.json()
        post = data["post"]
        
        assert post.get("liked_by_user") == True, f"Like did not persist! liked_by_user={post.get('liked_by_user')}"
        print(f"Like persisted correctly. likes_count={post.get('likes_count', 0)}")
    
    def test_unlike_persists_after_refresh(self, auth_token):
        """Test that unlike status persists after page refresh (re-fetch)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Step 1: Unlike the post
        requests.delete(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/like",
            headers=headers
        )
        
        # Step 2: Fetch post and verify liked_by_user is False
        response = requests.get(
            f"{BASE_URL}/api/social/posts/{TEST_POST_ID}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get post failed: {response.text}"
        data = response.json()
        post = data["post"]
        
        assert post.get("liked_by_user") == False, f"Unlike did not persist! liked_by_user={post.get('liked_by_user')}"
        print(f"Unlike persisted correctly. likes_count={post.get('likes_count', 0)}")


class TestForYouFeedWithLikeStatus:
    """Test that For You feed returns liked_by_user correctly"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for test user"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip(f"Authentication failed: {response.text}")
    
    def test_feed_returns_liked_status(self, auth_token):
        """Test GET /api/social/feed/for-you returns liked_by_user for posts"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/social/feed/for-you?skip=0&limit=20",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get feed failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Get feed not successful: {data}"
        assert "posts" in data, f"No posts in response: {data}"
        
        posts = data["posts"]
        assert len(posts) > 0, "No posts in feed"
        
        # Check that liked_by_user is present in all posts
        for post in posts[:5]:  # Check first 5 posts
            assert "liked_by_user" in post or post.get("liked_by_user") is not None, \
                f"liked_by_user not in post {post.get('id')}"
        
        # Find our test post and check its status
        test_post = next((p for p in posts if p.get("id") == TEST_POST_ID), None)
        if test_post:
            print(f"Test post in feed - liked_by_user: {test_post.get('liked_by_user')}, likes_count: {test_post.get('likes_count', 0)}")


class TestEndToEndLikeFlow:
    """End-to-end test of like/unlike flow"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for test user"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip(f"Authentication failed: {response.text}")
    
    def test_full_like_unlike_cycle(self, auth_token):
        """Test complete like/unlike cycle with persistence verification"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get initial state
        response = requests.get(f"{BASE_URL}/api/social/posts/{TEST_POST_ID}", headers=headers)
        assert response.status_code == 200
        initial_likes = response.json()["post"].get("likes_count", 0)
        initial_liked = response.json()["post"].get("liked_by_user", False)
        print(f"Initial state: likes_count={initial_likes}, liked_by_user={initial_liked}")
        
        # If already liked, unlike first
        if initial_liked:
            requests.delete(f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/like", headers=headers)
            time.sleep(0.5)
        
        # Step 1: Like
        response = requests.post(f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/like", headers=headers, json={})
        assert response.status_code == 200
        
        # Verify like persisted
        response = requests.get(f"{BASE_URL}/api/social/posts/{TEST_POST_ID}", headers=headers)
        post = response.json()["post"]
        assert post.get("liked_by_user") == True, f"Like not persisted! {post.get('liked_by_user')}"
        likes_after_like = post.get("likes_count", 0)
        print(f"After like: likes_count={likes_after_like}, liked_by_user={post.get('liked_by_user')}")
        
        # Step 2: Unlike (using DELETE - THE FIX)
        response = requests.delete(f"{BASE_URL}/api/social/posts/{TEST_POST_ID}/like", headers=headers)
        assert response.status_code == 200
        
        # Verify unlike persisted
        response = requests.get(f"{BASE_URL}/api/social/posts/{TEST_POST_ID}", headers=headers)
        post = response.json()["post"]
        assert post.get("liked_by_user") == False, f"Unlike not persisted! {post.get('liked_by_user')}"
        likes_after_unlike = post.get("likes_count", 0)
        print(f"After unlike: likes_count={likes_after_unlike}, liked_by_user={post.get('liked_by_user')}")
        
        # Verify count decreased
        assert likes_after_unlike < likes_after_like, \
            f"Likes count did not decrease! {likes_after_unlike} should be less than {likes_after_like}"
        
        print("Full like/unlike cycle completed successfully!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
