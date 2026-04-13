"""
Test Social Interaction Features for Recruitment Feed
- Like/Unlike posts
- Comment on posts
- Bookmark/Unbookmark posts
- Share posts
- Get user interactions
- Brute force protection for admin/recruiter login
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDemoLogin:
    """Test demo login to get student token"""
    
    def test_demo_login_success(self):
        """Test demo login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        assert response.status_code == 200, f"Demo login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        print(f"Demo login successful, user: {data['user'].get('name', 'Unknown')}")
        return data["access_token"]


class TestRecruitmentFeed:
    """Test recruitment feed endpoints"""
    
    @pytest.fixture
    def student_token(self):
        """Get student token via demo login"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Could not get student token")
    
    @pytest.fixture
    def first_post_id(self):
        """Get first post ID from feed"""
        response = requests.get(f"{BASE_URL}/api/recruitment/feed?page=1&limit=10")
        if response.status_code == 200:
            posts = response.json().get("posts", [])
            if posts:
                return posts[0]["id"]
        pytest.skip("No posts available in feed")
    
    def test_feed_returns_posts(self):
        """Test that feed returns posts"""
        response = requests.get(f"{BASE_URL}/api/recruitment/feed?page=1&limit=10")
        assert response.status_code == 200, f"Feed failed: {response.text}"
        data = response.json()
        assert "posts" in data, "No posts key in response"
        assert len(data["posts"]) > 0, "No posts returned"
        print(f"Feed returned {len(data['posts'])} posts")
        # Verify post structure
        post = data["posts"][0]
        assert "id" in post, "Post missing id"
        assert "title" in post, "Post missing title"
        assert "company_name" in post, "Post missing company_name"


class TestLikeFeature:
    """Test like/unlike functionality"""
    
    @pytest.fixture
    def student_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1", "password": "demo1"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Could not get student token")
    
    @pytest.fixture
    def first_post_id(self):
        response = requests.get(f"{BASE_URL}/api/recruitment/feed?page=1&limit=10")
        if response.status_code == 200:
            posts = response.json().get("posts", [])
            if posts:
                return posts[0]["id"]
        pytest.skip("No posts available")
    
    def test_like_requires_auth(self, first_post_id):
        """Test that like endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/recruitment/posts/{first_post_id}/like")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Like correctly requires authentication")
    
    def test_like_toggle(self, student_token, first_post_id):
        """Test liking and unliking a post"""
        headers = {"Authorization": f"Bearer {student_token}"}
        
        # First like
        response = requests.post(f"{BASE_URL}/api/recruitment/posts/{first_post_id}/like", headers=headers)
        assert response.status_code == 200, f"Like failed: {response.text}"
        data = response.json()
        assert "liked" in data, "No liked key in response"
        assert "likes_count" in data, "No likes_count in response"
        first_state = data["liked"]
        print(f"First toggle: liked={first_state}, count={data['likes_count']}")
        
        # Toggle again
        response = requests.post(f"{BASE_URL}/api/recruitment/posts/{first_post_id}/like", headers=headers)
        assert response.status_code == 200, f"Unlike failed: {response.text}"
        data = response.json()
        assert data["liked"] != first_state, "Like state did not toggle"
        print(f"Second toggle: liked={data['liked']}, count={data['likes_count']}")
    
    def test_like_invalid_post(self, student_token):
        """Test liking non-existent post"""
        headers = {"Authorization": f"Bearer {student_token}"}
        response = requests.post(f"{BASE_URL}/api/recruitment/posts/invalid-post-id/like", headers=headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Like correctly returns 404 for invalid post")


class TestCommentFeature:
    """Test comment functionality"""
    
    @pytest.fixture
    def student_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1", "password": "demo1"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Could not get student token")
    
    @pytest.fixture
    def first_post_id(self):
        response = requests.get(f"{BASE_URL}/api/recruitment/feed?page=1&limit=10")
        if response.status_code == 200:
            posts = response.json().get("posts", [])
            if posts:
                return posts[0]["id"]
        pytest.skip("No posts available")
    
    def test_comment_requires_auth(self, first_post_id):
        """Test that comment endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/recruitment/posts/{first_post_id}/comment", 
                                json={"text": "Test comment"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Comment correctly requires authentication")
    
    def test_add_comment(self, student_token, first_post_id):
        """Test adding a comment to a post"""
        headers = {"Authorization": f"Bearer {student_token}"}
        comment_text = f"TEST_comment_{int(time.time())}"
        
        response = requests.post(f"{BASE_URL}/api/recruitment/posts/{first_post_id}/comment",
                                json={"text": comment_text}, headers=headers)
        assert response.status_code == 200, f"Comment failed: {response.text}"
        data = response.json()
        assert "id" in data, "No id in comment response"
        assert "text" in data, "No text in comment response"
        assert data["text"] == comment_text, "Comment text mismatch"
        assert "user_name" in data, "No user_name in comment"
        print(f"Comment added: {data['id']}")
    
    def test_get_comments(self, first_post_id):
        """Test getting comments for a post"""
        response = requests.get(f"{BASE_URL}/api/recruitment/posts/{first_post_id}/comments")
        assert response.status_code == 200, f"Get comments failed: {response.text}"
        data = response.json()
        assert "comments" in data, "No comments key in response"
        print(f"Got {len(data['comments'])} comments")


class TestBookmarkFeature:
    """Test bookmark/save functionality"""
    
    @pytest.fixture
    def student_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1", "password": "demo1"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Could not get student token")
    
    @pytest.fixture
    def first_post_id(self):
        response = requests.get(f"{BASE_URL}/api/recruitment/feed?page=1&limit=10")
        if response.status_code == 200:
            posts = response.json().get("posts", [])
            if posts:
                return posts[0]["id"]
        pytest.skip("No posts available")
    
    def test_bookmark_requires_auth(self, first_post_id):
        """Test that bookmark endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/recruitment/posts/{first_post_id}/bookmark")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Bookmark correctly requires authentication")
    
    def test_bookmark_toggle(self, student_token, first_post_id):
        """Test bookmarking and unbookmarking a post"""
        headers = {"Authorization": f"Bearer {student_token}"}
        
        # First bookmark
        response = requests.post(f"{BASE_URL}/api/recruitment/posts/{first_post_id}/bookmark", headers=headers)
        assert response.status_code == 200, f"Bookmark failed: {response.text}"
        data = response.json()
        assert "bookmarked" in data, "No bookmarked key in response"
        first_state = data["bookmarked"]
        print(f"First toggle: bookmarked={first_state}")
        
        # Toggle again
        response = requests.post(f"{BASE_URL}/api/recruitment/posts/{first_post_id}/bookmark", headers=headers)
        assert response.status_code == 200, f"Unbookmark failed: {response.text}"
        data = response.json()
        assert data["bookmarked"] != first_state, "Bookmark state did not toggle"
        print(f"Second toggle: bookmarked={data['bookmarked']}")
    
    def test_get_my_bookmarks(self, student_token, first_post_id):
        """Test getting user's bookmarked posts"""
        headers = {"Authorization": f"Bearer {student_token}"}
        
        # First ensure post is bookmarked
        requests.post(f"{BASE_URL}/api/recruitment/posts/{first_post_id}/bookmark", headers=headers)
        
        # Get bookmarks
        response = requests.get(f"{BASE_URL}/api/recruitment/my-bookmarks", headers=headers)
        assert response.status_code == 200, f"Get bookmarks failed: {response.text}"
        data = response.json()
        assert "posts" in data, "No posts key in response"
        print(f"Got {len(data['posts'])} bookmarked posts")


class TestShareFeature:
    """Test share functionality"""
    
    @pytest.fixture
    def first_post_id(self):
        response = requests.get(f"{BASE_URL}/api/recruitment/feed?page=1&limit=10")
        if response.status_code == 200:
            posts = response.json().get("posts", [])
            if posts:
                return posts[0]["id"]
        pytest.skip("No posts available")
    
    def test_share_post(self, first_post_id):
        """Test sharing a post (no auth required)"""
        response = requests.post(f"{BASE_URL}/api/recruitment/posts/{first_post_id}/share")
        assert response.status_code == 200, f"Share failed: {response.text}"
        data = response.json()
        assert "shared" in data, "No shared key in response"
        assert data["shared"] == True, "Share should return True"
        assert "share_url" in data, "No share_url in response"
        print(f"Share successful, URL: {data['share_url']}")


class TestMyInteractions:
    """Test my-interactions endpoint"""
    
    @pytest.fixture
    def student_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1", "password": "demo1"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Could not get student token")
    
    def test_get_my_interactions(self, student_token):
        """Test getting user's liked and bookmarked post IDs"""
        headers = {"Authorization": f"Bearer {student_token}"}
        response = requests.get(f"{BASE_URL}/api/recruitment/my-interactions", headers=headers)
        assert response.status_code == 200, f"Get interactions failed: {response.text}"
        data = response.json()
        assert "liked_post_ids" in data, "No liked_post_ids in response"
        assert "bookmarked_post_ids" in data, "No bookmarked_post_ids in response"
        assert isinstance(data["liked_post_ids"], list), "liked_post_ids should be a list"
        assert isinstance(data["bookmarked_post_ids"], list), "bookmarked_post_ids should be a list"
        print(f"Interactions: {len(data['liked_post_ids'])} likes, {len(data['bookmarked_post_ids'])} bookmarks")


class TestAdminBruteForceProtection:
    """Test brute force protection for admin login"""
    
    def test_admin_login_rate_limiting(self):
        """Test that admin login has rate limiting after 5 failed attempts"""
        email = "test_brute_force@ceibaa.in"
        
        # Make 5 failed attempts
        for i in range(5):
            response = requests.post(f"{BASE_URL}/api/recruitment-admin/login", json={
                "email": email,
                "password": "wrongpassword"
            })
            # Should be 401 for invalid credentials
            if response.status_code == 429:
                print(f"Rate limited after {i+1} attempts")
                return  # Test passed early
            assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # 6th attempt should be rate limited
        response = requests.post(f"{BASE_URL}/api/recruitment-admin/login", json={
            "email": email,
            "password": "wrongpassword"
        })
        assert response.status_code == 429, f"Expected 429 rate limit, got {response.status_code}: {response.text}"
        print("Admin login rate limiting working correctly")
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/recruitment-admin/login", json={
            "email": "admin@ceibaa.in",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        print("Admin login successful")


class TestRecruiterBruteForceProtection:
    """Test brute force protection for recruiter login"""
    
    def test_recruiter_login_rate_limiting(self):
        """Test that recruiter login has rate limiting after 5 failed attempts"""
        email = "test_brute_force_recruiter@test.com"
        
        # Make 5 failed attempts
        for i in range(5):
            response = requests.post(f"{BASE_URL}/api/recruitment/recruiter/login", json={
                "email": email,
                "password": "wrongpassword"
            })
            if response.status_code == 429:
                print(f"Rate limited after {i+1} attempts")
                return  # Test passed early
            assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # 6th attempt should be rate limited
        response = requests.post(f"{BASE_URL}/api/recruitment/recruiter/login", json={
            "email": email,
            "password": "wrongpassword"
        })
        assert response.status_code == 429, f"Expected 429 rate limit, got {response.status_code}: {response.text}"
        print("Recruiter login rate limiting working correctly")
    
    def test_recruiter_login_success(self):
        """Test recruiter login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/recruitment/recruiter/login", json={
            "email": "hr@tcs.com",
            "password": "tcs123"
        })
        assert response.status_code == 200, f"Recruiter login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        print("Recruiter login successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
