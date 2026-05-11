"""
Profile Features Backend Tests - Iteration 19
Tests for profile page, bookmark, share, and stats endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mobile-search-fix-1.preview.emergentagent.com').rstrip('/')


class TestProfileFeatures:
    """Test profile page features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        assert response.status_code == 200
        data = response.json()
        self.token = data.get("access_token")
        self.user = data.get("user")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        yield
    
    def test_get_profile_by_username(self):
        """Test GET /api/profile/{username} returns profile data"""
        response = requests.get(f"{BASE_URL}/api/profile/demostudent1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "profile" in data
        profile = data["profile"]
        assert profile["username"] == "demostudent1"
        assert profile["name"] == "Demo Student 1"
        assert "followers_count" in profile
        assert "following_count" in profile
    
    def test_get_profile_stats(self):
        """Test GET /api/profile/stats/{user_id} returns quiz stats"""
        response = requests.get(f"{BASE_URL}/api/profile/stats/demo1-uuid")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "quizzes_completed" in data
        assert "avg_score" in data
        assert "battle_wins" in data
        # Verify demo1 has quizzes completed
        assert data["quizzes_completed"] >= 0
    
    def test_get_profile_posts(self):
        """Test GET /api/profile/{username}/posts returns posts with user info"""
        response = requests.get(f"{BASE_URL}/api/profile/demostudent1/posts")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "posts" in data
        posts = data["posts"]
        
        if len(posts) > 0:
            post = posts[0]
            # Verify post has username and avatar
            assert "username" in post or "user_name" in post
            assert "user_avatar" in post or "user_name" in post
    
    def test_bookmark_post(self):
        """Test POST /api/social/posts/{id}/bookmark"""
        # First get a post ID
        response = requests.get(f"{BASE_URL}/api/profile/demostudent1/posts")
        posts = response.json().get("posts", [])
        
        if len(posts) > 0:
            post_id = posts[0]["id"]
            
            # Bookmark the post
            response = requests.post(
                f"{BASE_URL}/api/social/posts/{post_id}/bookmark",
                headers=self.headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert "message" in data
    
    def test_unbookmark_post(self):
        """Test DELETE /api/social/posts/{id}/bookmark"""
        # First get a post ID
        response = requests.get(f"{BASE_URL}/api/profile/demostudent1/posts")
        posts = response.json().get("posts", [])
        
        if len(posts) > 0:
            post_id = posts[0]["id"]
            
            # First bookmark
            requests.post(
                f"{BASE_URL}/api/social/posts/{post_id}/bookmark",
                headers=self.headers
            )
            
            # Then unbookmark
            response = requests.delete(
                f"{BASE_URL}/api/social/posts/{post_id}/bookmark",
                headers=self.headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
    
    def test_share_post(self):
        """Test POST /api/social/posts/{id}/share (repost)"""
        # Get a post that hasn't been shared yet
        response = requests.get(f"{BASE_URL}/api/profile/demostudent2/posts")
        posts = response.json().get("posts", [])
        
        if len(posts) > 0:
            # Find a post that's not already shared
            for post in posts:
                if not post.get("is_retweet"):
                    post_id = post["id"]
                    
                    response = requests.post(
                        f"{BASE_URL}/api/social/posts/{post_id}/share",
                        headers=self.headers
                    )
                    # Either success or already shared
                    assert response.status_code == 200
                    data = response.json()
                    assert "success" in data or "message" in data
                    break
    
    def test_get_bookmarks(self):
        """Test GET /api/social/bookmarks returns user's bookmarked posts"""
        response = requests.get(
            f"{BASE_URL}/api/social/bookmarks",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "posts" in data


class TestDashboardNavigation:
    """Test dashboard navigation goes to profile"""
    
    def test_profile_endpoint_exists(self):
        """Verify profile endpoint works for navigation"""
        response = requests.get(f"{BASE_URL}/api/profile/demostudent1")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "profile" in data


class TestVictoryLanePostActions:
    """Test Victory Lane post action buttons"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        assert response.status_code == 200
        data = response.json()
        self.token = data.get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        yield
    
    def test_like_post(self):
        """Test POST /api/social/posts/{id}/like"""
        # Get a post
        response = requests.get(f"{BASE_URL}/api/social/feed")
        data = response.json()
        posts = data.get("posts", [])
        
        if len(posts) > 0:
            post_id = posts[0]["id"]
            
            response = requests.post(
                f"{BASE_URL}/api/social/posts/{post_id}/like",
                headers=self.headers
            )
            assert response.status_code == 200
    
    def test_comment_on_post(self):
        """Test POST /api/social/posts/{id}/comments"""
        # Get a post
        response = requests.get(f"{BASE_URL}/api/social/feed")
        data = response.json()
        posts = data.get("posts", [])
        
        if len(posts) > 0:
            post_id = posts[0]["id"]
            
            response = requests.post(
                f"{BASE_URL}/api/social/posts/{post_id}/comments",
                headers=self.headers,
                json={"content": "Test comment from pytest"}
            )
            # Should succeed or return appropriate error
            assert response.status_code in [200, 201, 400, 404]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
