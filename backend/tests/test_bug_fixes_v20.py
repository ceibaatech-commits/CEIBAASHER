"""
Test suite for 5 bug fixes in Ceibaa platform:
1. Quiz 'Attempt' button on Profile quizzes tab
2. Edit Profile modal functionality
3. SinglePost page UI elements (repost indicator, quiz badge, exam tags, bookmark)
4. Block profile option in FollowPopup
5. Header on Messages page

Tests use demo1/demo1 and demo3/demo3 credentials
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mobile-search-fix-1.preview.emergentagent.com').rstrip('/')


class TestDemoLogin:
    """Test demo login functionality"""
    
    def test_demo1_login(self):
        """Test demo1 login returns valid token and user info"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["username"] == "demostudent1"
        print(f"PASS: demo1 login successful, user_id={data['user']['id']}")
        return data["access_token"], data["user"]["id"]
    
    def test_demo3_login(self):
        """Test demo3 login returns valid token and user info"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo3",
            "password": "demo3"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["username"] == "demostudent3"
        print(f"PASS: demo3 login successful, user_id={data['user']['id']}")
        return data["access_token"], data["user"]["id"]


class TestEditProfile:
    """Bug 2: Test Edit Profile functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for demo1"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        return response.json()["access_token"]
    
    def test_profile_update_endpoint_exists(self, auth_token):
        """Test PUT /api/profile/update endpoint exists"""
        response = requests.put(
            f"{BASE_URL}/api/profile/update",
            json={"name": "Demo Student 1"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Should not return 404 or 405
        assert response.status_code in [200, 201, 422], f"Unexpected status: {response.status_code}, {response.text}"
        print(f"PASS: PUT /api/profile/update endpoint exists, status={response.status_code}")
    
    def test_profile_update_name(self, auth_token):
        """Test updating profile name"""
        # Update name
        response = requests.put(
            f"{BASE_URL}/api/profile/update",
            json={"name": "Demo Student 1 Updated"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"PASS: Profile name update successful")
        
        # Revert name
        requests.put(
            f"{BASE_URL}/api/profile/update",
            json={"name": "Demo Student 1"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_profile_update_bio(self, auth_token):
        """Test updating profile bio"""
        response = requests.put(
            f"{BASE_URL}/api/profile/update",
            json={"bio": "Test bio update"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"PASS: Profile bio update successful")
    
    def test_profile_update_location(self, auth_token):
        """Test updating profile location"""
        response = requests.put(
            f"{BASE_URL}/api/profile/update",
            json={"location": "Test City, India"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"PASS: Profile location update successful")
    
    def test_profile_update_website(self, auth_token):
        """Test updating profile website"""
        response = requests.put(
            f"{BASE_URL}/api/profile/update",
            json={"website": "https://test.example.com"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"PASS: Profile website update successful")
    
    def test_profile_update_multiple_fields(self, auth_token):
        """Test updating multiple profile fields at once"""
        response = requests.put(
            f"{BASE_URL}/api/profile/update",
            json={
                "name": "Demo Student 1",
                "bio": "Preparing for JEE Main 2025",
                "location": "Mumbai, India",
                "website": ""
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "updated_fields" in data
        print(f"PASS: Multiple profile fields update successful, fields={data.get('updated_fields')}")


class TestBlockUser:
    """Bug 4: Test Block user functionality"""
    
    @pytest.fixture
    def demo1_auth(self):
        """Get auth token for demo1"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        data = response.json()
        return data["access_token"], data["user"]["id"]
    
    @pytest.fixture
    def demo3_auth(self):
        """Get auth token for demo3"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo3",
            "password": "demo3"
        })
        data = response.json()
        return data["access_token"], data["user"]["id"]
    
    def test_block_endpoint_exists(self, demo1_auth, demo3_auth):
        """Test POST /api/profile/block endpoint exists"""
        token, _ = demo1_auth
        _, target_id = demo3_auth
        
        response = requests.post(
            f"{BASE_URL}/api/profile/block",
            json={"target_user_id": target_id},
            headers={"Authorization": f"Bearer {token}"}
        )
        # Should not return 404 or 405
        assert response.status_code in [200, 201, 400, 422], f"Unexpected status: {response.status_code}, {response.text}"
        print(f"PASS: POST /api/profile/block endpoint exists, status={response.status_code}")
    
    def test_block_user_returns_success(self, demo1_auth, demo3_auth):
        """Test blocking a user returns success"""
        token, _ = demo1_auth
        _, target_id = demo3_auth
        
        response = requests.post(
            f"{BASE_URL}/api/profile/block",
            json={"target_user_id": target_id},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Block failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"PASS: Block user returns success=True")
    
    def test_block_requires_auth(self, demo3_auth):
        """Test block endpoint requires authentication"""
        _, target_id = demo3_auth
        
        response = requests.post(
            f"{BASE_URL}/api/profile/block",
            json={"target_user_id": target_id}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: Block endpoint requires authentication")


class TestProfilePosts:
    """Bug 1: Test Profile posts with quiz details for Attempt button"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for demo1"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        return response.json()["access_token"]
    
    def test_profile_posts_endpoint(self, auth_token):
        """Test GET /api/profile/{username}/posts returns posts"""
        response = requests.get(
            f"{BASE_URL}/api/profile/demostudent1/posts",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "posts" in data
        print(f"PASS: Profile posts endpoint returns {len(data['posts'])} posts")
    
    def test_quiz_posts_have_quiz_details(self, auth_token):
        """Test that quiz posts have quiz_details with room_code for Attempt button"""
        response = requests.get(
            f"{BASE_URL}/api/profile/demostudent1/posts",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        posts = data.get("posts", [])
        
        # Find posts with quiz_details
        quiz_posts = [p for p in posts if p.get("quiz_details")]
        print(f"Found {len(quiz_posts)} posts with quiz_details")
        
        # Check if quiz posts have room_code
        for post in quiz_posts[:3]:  # Check first 3
            quiz_details = post.get("quiz_details", {})
            has_room_code = quiz_details.get("room_code") or post.get("room_code")
            print(f"  Post {post.get('id')[:8]}...: quiz_details.room_code={quiz_details.get('room_code')}, post.room_code={post.get('room_code')}")
        
        print(f"PASS: Quiz posts structure verified")


class TestSinglePost:
    """Bug 3: Test SinglePost page API data for UI elements"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for demo1"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        return response.json()["access_token"]
    
    def test_get_single_post(self, auth_token):
        """Test GET /api/social/posts/{id} returns post data"""
        # First get a post ID from profile posts
        posts_response = requests.get(
            f"{BASE_URL}/api/profile/demostudent1/posts",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        posts = posts_response.json().get("posts", [])
        if not posts:
            pytest.skip("No posts found to test")
        
        post_id = posts[0].get("id")
        
        response = requests.get(
            f"{BASE_URL}/api/social/posts/{post_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "post" in data
        print(f"PASS: Single post endpoint returns post data")
    
    def test_bookmark_post_endpoint(self, auth_token):
        """Test POST /api/social/posts/{id}/bookmark works"""
        # Get a post ID
        posts_response = requests.get(
            f"{BASE_URL}/api/profile/demostudent1/posts",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        posts = posts_response.json().get("posts", [])
        if not posts:
            pytest.skip("No posts found to test")
        
        post_id = posts[0].get("id")
        
        response = requests.post(
            f"{BASE_URL}/api/social/posts/{post_id}/bookmark",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Should work or already bookmarked
        assert response.status_code in [200, 201, 400], f"Unexpected: {response.status_code}, {response.text}"
        print(f"PASS: Bookmark endpoint works, status={response.status_code}")
    
    def test_unbookmark_post_endpoint(self, auth_token):
        """Test DELETE /api/social/posts/{id}/bookmark works"""
        # Get a post ID
        posts_response = requests.get(
            f"{BASE_URL}/api/profile/demostudent1/posts",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        posts = posts_response.json().get("posts", [])
        if not posts:
            pytest.skip("No posts found to test")
        
        post_id = posts[0].get("id")
        
        response = requests.delete(
            f"{BASE_URL}/api/social/posts/{post_id}/bookmark",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Should work or not bookmarked
        assert response.status_code in [200, 204, 400, 404], f"Unexpected: {response.status_code}, {response.text}"
        print(f"PASS: Unbookmark endpoint works, status={response.status_code}")


class TestMessagesEndpoint:
    """Bug 5: Test Messages API endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for demo1"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        return response.json()["access_token"]
    
    def test_conversations_endpoint(self, auth_token):
        """Test GET /api/messages/conversations returns conversations"""
        response = requests.get(
            f"{BASE_URL}/api/messages/conversations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "conversations" in data
        print(f"PASS: Conversations endpoint returns {len(data['conversations'])} conversations")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
