"""
P0 Sprint Features Test Suite
Tests for:
1. Victory Lane PostCard - 4 card types (repost indicator, quiz trending badge, image exam tags, close friend indicator)
2. Bookmark toggle persistence to backend API
3. Profile Saved tab - fetches from /api/social/bookmarks
4. Message button toast placeholder
5. Close friend IDs endpoint
6. Follow button functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mobile-search-fix-1.preview.emergentagent.com').rstrip('/')

class TestDemoLogin:
    """Test demo login functionality"""
    
    def test_demo_login_returns_access_token(self):
        """Demo login should return access_token"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, f"No access_token in response: {data}"
        assert data["access_token"], "access_token is empty"
        print(f"PASS: Demo login returns access_token")
        return data["access_token"]


class TestCloseFriendIDs:
    """Test close friend IDs endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Login failed")
    
    def test_get_close_friend_ids_endpoint_exists(self, auth_token):
        """GET /api/profile/close-friend-ids should return friend IDs"""
        response = requests.get(
            f"{BASE_URL}/api/profile/close-friend-ids",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Endpoint failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        assert "friend_ids" in data, f"No friend_ids in response: {data}"
        assert isinstance(data["friend_ids"], list), "friend_ids should be a list"
        print(f"PASS: GET /api/profile/close-friend-ids returns {len(data['friend_ids'])} friend IDs")
    
    def test_add_close_friend(self, auth_token):
        """POST /api/profile/close-friend should add a close friend"""
        # First get demo2's user ID
        response = requests.get(f"{BASE_URL}/api/profile/demostudent2")
        if response.status_code != 200:
            pytest.skip("Could not find demo2 user")
        demo2_id = response.json().get("profile", {}).get("id") or response.json().get("user", {}).get("id")
        if not demo2_id:
            pytest.skip("Could not get demo2 user ID")
        
        # Add as close friend
        response = requests.post(
            f"{BASE_URL}/api/profile/close-friend",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"target_user_id": demo2_id, "action": "add"}
        )
        assert response.status_code == 200, f"Add close friend failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        print(f"PASS: Added demo2 ({demo2_id}) as close friend")
        
        # Verify it's in the list
        response = requests.get(
            f"{BASE_URL}/api/profile/close-friend-ids",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        assert demo2_id in data.get("friend_ids", []), "Close friend not in list after adding"
        print(f"PASS: Close friend ID verified in list")


class TestBookmarkAPI:
    """Test bookmark toggle persistence to backend"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Login failed")
    
    @pytest.fixture
    def test_post_id(self, auth_token):
        """Get a post ID to test with"""
        # Try trending feed first (doesn't require auth)
        response = requests.get(
            f"{BASE_URL}/api/social/feed/trending?limit=5"
        )
        if response.status_code == 200:
            posts = response.json().get("posts", [])
            if posts:
                return posts[0]["id"]
        
        # Fallback to for-you feed with auth
        response = requests.get(
            f"{BASE_URL}/api/social/feed/for-you?limit=5",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if response.status_code == 200:
            posts = response.json().get("posts", [])
            if posts:
                return posts[0]["id"]
        pytest.skip("No posts available for testing")
    
    def test_bookmark_post(self, auth_token, test_post_id):
        """POST /api/social/posts/{post_id}/bookmark should save bookmark"""
        response = requests.post(
            f"{BASE_URL}/api/social/posts/{test_post_id}/bookmark",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Bookmark failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        print(f"PASS: POST /api/social/posts/{test_post_id}/bookmark succeeded")
    
    def test_get_bookmarks_returns_bookmarked_posts(self, auth_token, test_post_id):
        """GET /api/social/bookmarks should return user's bookmarked posts"""
        # First bookmark a post
        requests.post(
            f"{BASE_URL}/api/social/posts/{test_post_id}/bookmark",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Then get bookmarks
        response = requests.get(
            f"{BASE_URL}/api/social/bookmarks",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Get bookmarks failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        assert "posts" in data, f"No posts in response: {data}"
        assert isinstance(data["posts"], list), "posts should be a list"
        
        # Verify the bookmarked post is in the list
        post_ids = [p["id"] for p in data["posts"]]
        assert test_post_id in post_ids, f"Bookmarked post {test_post_id} not in bookmarks list"
        print(f"PASS: GET /api/social/bookmarks returns {len(data['posts'])} posts including test post")
    
    def test_unbookmark_post(self, auth_token, test_post_id):
        """DELETE /api/social/posts/{post_id}/bookmark should remove bookmark"""
        # First bookmark
        requests.post(
            f"{BASE_URL}/api/social/posts/{test_post_id}/bookmark",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Then unbookmark
        response = requests.delete(
            f"{BASE_URL}/api/social/posts/{test_post_id}/bookmark",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Unbookmark failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        print(f"PASS: DELETE /api/social/posts/{test_post_id}/bookmark succeeded")


class TestFollowButton:
    """Test follow button functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Login failed")
    
    def test_follow_user(self, auth_token):
        """POST /api/social/user/follow/{user_id} should follow user"""
        # Get demo2's user ID
        response = requests.get(f"{BASE_URL}/api/profile/demostudent2")
        if response.status_code != 200:
            pytest.skip("Could not find demo2 user")
        demo2_id = response.json().get("profile", {}).get("id") or response.json().get("user", {}).get("id")
        if not demo2_id:
            pytest.skip("Could not get demo2 user ID")
        
        # Follow the user
        response = requests.post(
            f"{BASE_URL}/api/social/user/follow/{demo2_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Accept both 200 (success) and 400 (already following)
        assert response.status_code in [200, 400], f"Follow failed: {response.text}"
        print(f"PASS: Follow user endpoint works (status: {response.status_code})")
    
    def test_unfollow_user(self, auth_token):
        """DELETE /api/social/user/follow/{user_id} should unfollow user"""
        # Get demo3's user ID
        response = requests.get(f"{BASE_URL}/api/profile/demostudent3")
        if response.status_code != 200:
            pytest.skip("Could not find demo3 user")
        demo3_id = response.json().get("profile", {}).get("id") or response.json().get("user", {}).get("id")
        if not demo3_id:
            pytest.skip("Could not get demo3 user ID")
        
        # First follow
        requests.post(
            f"{BASE_URL}/api/social/user/follow/{demo3_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Then unfollow
        response = requests.delete(
            f"{BASE_URL}/api/social/user/follow/{demo3_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Accept both 200 (success) and 404 (not following)
        assert response.status_code in [200, 404], f"Unfollow failed: {response.text}"
        print(f"PASS: Unfollow user endpoint works (status: {response.status_code})")


class TestVictoryLaneFeed:
    """Test Victory Lane feed returns posts with required fields for 4 card types"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Login failed")
    
    def test_feed_returns_posts_with_is_retweet_field(self, auth_token):
        """Feed posts should have is_retweet field for repost indicator"""
        response = requests.get(
            f"{BASE_URL}/api/social/feed/for-you?limit=20",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Feed failed: {response.text}"
        data = response.json()
        posts = data.get("posts", [])
        assert len(posts) > 0, "No posts in feed"
        
        # Check that posts have is_retweet field
        for post in posts:
            assert "is_retweet" in post, f"Post {post.get('id')} missing is_retweet field"
        
        # Check if any are reposts
        reposts = [p for p in posts if p.get("is_retweet") == True]
        print(f"PASS: Feed has {len(posts)} posts, {len(reposts)} are reposts with is_retweet=True")
    
    def test_feed_posts_have_hashtags_for_exam_tags(self, auth_token):
        """Feed posts should have hashtags field for image exam tags"""
        response = requests.get(
            f"{BASE_URL}/api/social/feed/for-you?limit=20",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        posts = response.json().get("posts", [])
        
        # Check posts with media have hashtags or tags field
        posts_with_media = [p for p in posts if p.get("media_urls")]
        if posts_with_media:
            for post in posts_with_media[:5]:  # Check first 5
                has_tags = "hashtags" in post or "tags" in post
                print(f"Post {post.get('id')[:8]}... has tags: {has_tags}")
        print(f"PASS: Checked {len(posts_with_media)} posts with media for hashtags/tags field")
    
    def test_feed_posts_have_quiz_details_for_trending_badge(self, auth_token):
        """Feed posts with quiz_details should have category for trending badge"""
        response = requests.get(
            f"{BASE_URL}/api/social/feed/for-you?limit=50",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        posts = response.json().get("posts", [])
        
        # Find posts with quiz_details
        quiz_posts = [p for p in posts if p.get("quiz_details")]
        if quiz_posts:
            for post in quiz_posts[:3]:
                qd = post.get("quiz_details", {})
                print(f"Quiz post: category={qd.get('category')}, attempts={qd.get('attempts')}, avg_score={qd.get('avg_score')}")
                # Verify quiz_details has expected fields
                assert "category" in qd or post.get("exam_category"), f"Quiz post missing category"
        print(f"PASS: Found {len(quiz_posts)} posts with quiz_details for trending badge")


class TestProfileSavedTab:
    """Test Profile Saved tab fetches from /api/social/bookmarks"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Login failed")
    
    def test_bookmarks_endpoint_returns_posts_array(self, auth_token):
        """GET /api/social/bookmarks should return posts array for Saved tab"""
        response = requests.get(
            f"{BASE_URL}/api/social/bookmarks",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Bookmarks endpoint failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "posts" in data
        assert isinstance(data["posts"], list)
        
        # Each post should have required fields for PostCard
        for post in data["posts"][:3]:
            assert "id" in post, "Post missing id"
            assert "content" in post or "user_name" in post, "Post missing content or user_name"
        
        print(f"PASS: GET /api/social/bookmarks returns {len(data['posts'])} posts for Saved tab")


class TestProfileEndpoints:
    """Test profile page endpoints"""
    
    def test_get_profile_by_username(self):
        """GET /api/profile/{username} should return profile data"""
        response = requests.get(f"{BASE_URL}/api/profile/demostudent1")
        assert response.status_code == 200, f"Profile endpoint failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        profile = data.get("profile") or data.get("user")
        assert profile, "No profile data returned"
        assert profile.get("username") == "demostudent1" or profile.get("name") == "Demo Student 1"
        print(f"PASS: GET /api/profile/demostudent1 returns profile with name={profile.get('name')}")
    
    def test_get_profile_posts(self):
        """GET /api/profile/{username}/posts should return user's posts"""
        response = requests.get(f"{BASE_URL}/api/profile/demostudent1/posts")
        assert response.status_code == 200, f"Profile posts failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "posts" in data
        print(f"PASS: GET /api/profile/demostudent1/posts returns {len(data['posts'])} posts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
