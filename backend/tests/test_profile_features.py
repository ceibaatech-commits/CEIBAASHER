"""
Test Profile Features - New endpoints for Profile page
Tests: stats, mutual-followers, close-friend, block endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mobile-search-fix-1.preview.emergentagent.com')

class TestProfileEndpoints:
    """Test new profile endpoints for Profile.js and FollowButton.js"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login with demo1 to get token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"username": "demo1", "password": "demo1"}
        )
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("access_token") or data.get("token")
            self.user_id = data.get("user", {}).get("id")
            self.username = data.get("user", {}).get("username")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Demo login failed - skipping authenticated tests")
    
    def test_demo_login_returns_user_info(self):
        """Test demo login returns correct user info"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"username": "demo1", "password": "demo1"}
        )
        assert response.status_code == 200
        data = response.json()
        # Demo login returns access_token and user, not success flag
        assert "access_token" in data or "token" in data
        assert "user" in data
        user = data["user"]
        assert user.get("username") == "demostudent1"
        assert user.get("name") == "Demo Student 1"
        assert "id" in user
        print(f"Demo login successful: user_id={user.get('id')}, username={user.get('username')}")
    
    def test_get_profile_by_username(self):
        """Test GET /api/profile/{username} returns profile data"""
        response = self.session.get(f"{BASE_URL}/api/profile/demostudent1")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "profile" in data
        profile = data["profile"]
        assert profile.get("username") == "demostudent1"
        assert profile.get("name") == "Demo Student 1"
        assert "id" in profile
        assert "followers_count" in profile
        assert "following_count" in profile
        print(f"Profile fetched: name={profile.get('name')}, followers={profile.get('followers_count')}, following={profile.get('following_count')}")
    
    def test_get_profile_stats(self):
        """Test GET /api/profile/stats/{user_id} returns quiz stats"""
        # First get the user_id from profile
        profile_response = self.session.get(f"{BASE_URL}/api/profile/demostudent1")
        assert profile_response.status_code == 200
        user_id = profile_response.json()["profile"]["id"]
        
        # Now get stats
        response = self.session.get(f"{BASE_URL}/api/profile/stats/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "quizzes_completed" in data
        assert "avg_score" in data
        assert "battle_wins" in data
        # rank can be None if no XP
        print(f"Stats: quizzes={data.get('quizzes_completed')}, avg_score={data.get('avg_score')}, battle_wins={data.get('battle_wins')}, rank={data.get('rank')}")
    
    def test_get_mutual_followers(self):
        """Test GET /api/profile/mutual-followers/{target_user_id} returns mutual followers"""
        # Get demostudent3's user_id
        profile_response = self.session.get(f"{BASE_URL}/api/profile/demostudent3")
        if profile_response.status_code != 200:
            pytest.skip("demostudent3 profile not found")
        target_user_id = profile_response.json()["profile"]["id"]
        
        # Get mutual followers
        response = self.session.get(f"{BASE_URL}/api/profile/mutual-followers/{target_user_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "mutual" in data
        assert isinstance(data["mutual"], list)
        print(f"Mutual followers count: {len(data['mutual'])}")
    
    def test_close_friend_add(self):
        """Test POST /api/profile/close-friend adds close friend"""
        # Get demostudent3's user_id
        profile_response = self.session.get(f"{BASE_URL}/api/profile/demostudent3")
        if profile_response.status_code != 200:
            pytest.skip("demostudent3 profile not found")
        target_user_id = profile_response.json()["profile"]["id"]
        
        # Add as close friend
        response = self.session.post(
            f"{BASE_URL}/api/profile/close-friend",
            json={"target_user_id": target_user_id, "action": "add"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("action") == "add"
        print(f"Close friend added: target_user_id={target_user_id}")
    
    def test_close_friend_remove(self):
        """Test POST /api/profile/close-friend removes close friend"""
        # Get demostudent3's user_id
        profile_response = self.session.get(f"{BASE_URL}/api/profile/demostudent3")
        if profile_response.status_code != 200:
            pytest.skip("demostudent3 profile not found")
        target_user_id = profile_response.json()["profile"]["id"]
        
        # Remove from close friends
        response = self.session.post(
            f"{BASE_URL}/api/profile/close-friend",
            json={"target_user_id": target_user_id, "action": "remove"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("action") == "remove"
        print(f"Close friend removed: target_user_id={target_user_id}")
    
    def test_block_user(self):
        """Test POST /api/profile/block blocks a user"""
        # Get demostudent3's user_id
        profile_response = self.session.get(f"{BASE_URL}/api/profile/demostudent3")
        if profile_response.status_code != 200:
            pytest.skip("demostudent3 profile not found")
        target_user_id = profile_response.json()["profile"]["id"]
        
        # Block user
        response = self.session.post(
            f"{BASE_URL}/api/profile/block",
            json={"target_user_id": target_user_id}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"User blocked: target_user_id={target_user_id}")
    
    def test_get_followers(self):
        """Test GET /api/profile/followers/{user_id} returns followers list"""
        # Get user_id from profile
        profile_response = self.session.get(f"{BASE_URL}/api/profile/demostudent1")
        assert profile_response.status_code == 200
        user_id = profile_response.json()["profile"]["id"]
        
        response = self.session.get(f"{BASE_URL}/api/profile/followers/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "followers" in data
        assert isinstance(data["followers"], list)
        print(f"Followers count: {len(data['followers'])}")
    
    def test_get_following(self):
        """Test GET /api/profile/following/{user_id} returns following list"""
        # Get user_id from profile
        profile_response = self.session.get(f"{BASE_URL}/api/profile/demostudent1")
        assert profile_response.status_code == 200
        user_id = profile_response.json()["profile"]["id"]
        
        response = self.session.get(f"{BASE_URL}/api/profile/following/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "following" in data
        assert isinstance(data["following"], list)
        print(f"Following count: {len(data['following'])}")
    
    def test_get_user_posts(self):
        """Test GET /api/profile/{username}/posts returns user posts"""
        response = self.session.get(f"{BASE_URL}/api/profile/demostudent1/posts")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "posts" in data
        assert isinstance(data["posts"], list)
        print(f"Posts count: {len(data['posts'])}")
    
    def test_follow_status(self):
        """Test GET /api/profile/follow-status/{target_user_id} returns follow status"""
        # Get demostudent3's user_id
        profile_response = self.session.get(f"{BASE_URL}/api/profile/demostudent3")
        if profile_response.status_code != 200:
            pytest.skip("demostudent3 profile not found")
        target_user_id = profile_response.json()["profile"]["id"]
        
        response = self.session.get(f"{BASE_URL}/api/profile/follow-status/{target_user_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "following" in data
        assert "status" in data
        print(f"Follow status: following={data.get('following')}, status={data.get('status')}")


class TestVictoryLaneEndpoints:
    """Test Victory Lane endpoints for quiz room creation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login with demo1 to get token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"username": "demo1", "password": "demo1"}
        )
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("access_token") or data.get("token")
            self.user_id = data.get("user", {}).get("id")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Demo login failed - skipping authenticated tests")
    
    def test_get_social_posts(self):
        """Test GET /api/social/feed/for-you returns posts"""
        response = self.session.get(f"{BASE_URL}/api/social/feed/for-you?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "posts" in data
        print(f"Social posts count: {len(data['posts'])}")
    
    def test_get_quiz_rooms(self):
        """Test GET /api/quiz-rooms returns quiz rooms"""
        response = self.session.get(f"{BASE_URL}/api/quiz-rooms")
        # Could be 200 or 404 if no rooms
        if response.status_code == 200:
            data = response.json()
            print(f"Quiz rooms: {data}")
        else:
            print(f"Quiz rooms endpoint returned: {response.status_code}")
        assert response.status_code in [200, 404]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
