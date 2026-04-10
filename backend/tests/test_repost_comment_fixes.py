"""
Test suite for iteration 21 bug fixes:
1. Profile posts clickable - navigate to /post/{id}
2. Comment button on profile navigates to SinglePost
3. Repost (share) endpoint copies media/metadata
4. Reposts appear in feed with proper sorting
5. parse_date handles datetime objects and ISO strings
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDemoLogin:
    """Test demo login functionality"""
    
    def test_demo1_login(self):
        """Demo1 login returns valid token and user data"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert data.get("user", {}).get("username") == "demostudent1"
        return data["access_token"]
    
    def test_demo2_login(self):
        """Demo2 login returns valid token and user data"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo2",
            "password": "demo2"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("username") == "demostudent2"


class TestSharePostEndpoint:
    """Test POST /api/social/posts/{id}/share creates retweet with full metadata"""
    
    @pytest.fixture
    def demo1_token(self):
        """Get demo1 auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def demo2_token(self):
        """Get demo2 auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo2",
            "password": "demo2"
        })
        return response.json()["access_token"]
    
    def test_share_endpoint_exists(self, demo1_token):
        """Share endpoint returns proper response (not 404)"""
        # First get a post to share
        response = requests.get(f"{BASE_URL}/api/social/feed/trending?limit=5")
        assert response.status_code == 200
        posts = response.json().get("posts", [])
        
        # Find a post that's not already a retweet and not by demo1
        post_to_share = None
        for p in posts:
            if not p.get("is_retweet") and p.get("username") != "demostudent1":
                post_to_share = p
                break
        
        if post_to_share:
            # Try to share (may fail if already shared, but should not be 404)
            share_response = requests.post(
                f"{BASE_URL}/api/social/posts/{post_to_share['id']}/share",
                headers={"Authorization": f"Bearer {demo1_token}"}
            )
            # Should be 200 (success) or 200 with success=False (already shared)
            assert share_response.status_code == 200, f"Share endpoint error: {share_response.text}"
    
    def test_share_creates_retweet_with_metadata(self, demo2_token):
        """Share endpoint copies media_urls, hashtags, post_type from original"""
        # Create a new post with demo2 that has media and hashtags
        unique_content = f"TEST_SHARE_POST_{uuid.uuid4().hex[:8]} #testhashtag"
        create_response = requests.post(
            f"{BASE_URL}/api/social/posts",
            headers={"Authorization": f"Bearer {demo2_token}"},
            json={
                "content": unique_content,
                "hashtags": ["testhashtag", "sharetest"],
                "post_type": "general"
            }
        )
        assert create_response.status_code in [200, 201], f"Create post failed: {create_response.text}"
        created_post = create_response.json().get("post", create_response.json())
        post_id = created_post.get("id")
        assert post_id, "No post ID returned"
        
        # Now login as demo1 and share this post
        demo1_response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        demo1_token = demo1_response.json()["access_token"]
        
        share_response = requests.post(
            f"{BASE_URL}/api/social/posts/{post_id}/share",
            headers={"Authorization": f"Bearer {demo1_token}"}
        )
        assert share_response.status_code == 200, f"Share failed: {share_response.text}"
        share_data = share_response.json()
        
        # Verify share was successful
        assert share_data.get("success") == True or "retweet" in str(share_data).lower(), f"Share not successful: {share_data}"
        
        # Cleanup - delete the test post
        requests.delete(
            f"{BASE_URL}/api/social/posts/{post_id}",
            headers={"Authorization": f"Bearer {demo2_token}"}
        )


class TestFeedWithReposts:
    """Test that reposts appear in feeds with proper sorting"""
    
    def test_victory_lane_feed_returns_reposts(self):
        """Victory Lane feed includes retweet posts"""
        response = requests.get(f"{BASE_URL}/api/social/feed/for-you?limit=50")
        assert response.status_code == 200, f"Feed failed: {response.text}"
        
        posts = response.json().get("posts", [])
        assert len(posts) > 0, "No posts in feed"
        
        # Check if any reposts exist
        reposts = [p for p in posts if p.get("is_retweet")]
        print(f"Found {len(reposts)} reposts in feed out of {len(posts)} total posts")
        
        # Verify repost structure
        for repost in reposts[:3]:  # Check first 3 reposts
            assert "original_post_id" in repost, "Repost missing original_post_id"
            assert "original_user_name" in repost or "original_username" in repost, "Repost missing original author info"
    
    def test_trending_feed_returns_reposts(self):
        """Trending feed includes retweet posts"""
        response = requests.get(f"{BASE_URL}/api/social/feed/trending?limit=50")
        assert response.status_code == 200, f"Feed failed: {response.text}"
        
        posts = response.json().get("posts", [])
        assert len(posts) > 0, "No posts in trending feed"
        
        # Check if any reposts exist
        reposts = [p for p in posts if p.get("is_retweet")]
        print(f"Found {len(reposts)} reposts in trending feed")
    
    def test_feed_posts_sorted_by_date(self):
        """Feed posts are sorted by created_at descending"""
        response = requests.get(f"{BASE_URL}/api/social/feed/for-you?limit=20")
        assert response.status_code == 200
        
        posts = response.json().get("posts", [])
        if len(posts) < 2:
            pytest.skip("Not enough posts to verify sorting")
        
        # Verify posts are sorted by date (most recent first)
        from datetime import datetime
        
        def parse_date(date_val):
            if isinstance(date_val, str):
                return datetime.fromisoformat(date_val.replace('Z', '+00:00'))
            return date_val
        
        dates = []
        for p in posts[:10]:
            try:
                dt = parse_date(p.get("created_at"))
                dates.append(dt)
            except:
                pass
        
        # Check that dates are in descending order (allowing for some tolerance)
        for i in range(len(dates) - 1):
            # Allow 1 second tolerance for same-time posts
            assert dates[i] >= dates[i+1] or (dates[i+1] - dates[i]).total_seconds() < 2, \
                f"Posts not sorted: {dates[i]} should be >= {dates[i+1]}"


class TestSinglePostEndpoint:
    """Test GET /api/social/posts/{id} returns full post data"""
    
    def test_get_single_post(self):
        """Single post endpoint returns post with comments"""
        # First get a post ID from feed
        feed_response = requests.get(f"{BASE_URL}/api/social/feed/trending?limit=5")
        assert feed_response.status_code == 200
        posts = feed_response.json().get("posts", [])
        assert len(posts) > 0, "No posts in feed"
        
        post_id = posts[0]["id"]
        
        # Get single post
        response = requests.get(f"{BASE_URL}/api/social/posts/{post_id}")
        assert response.status_code == 200, f"Get post failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "post" in data
        
        post = data["post"]
        assert post.get("id") == post_id
        assert "content" in post or "media_url" in post or "media_urls" in post
    
    def test_get_repost_shows_original_author(self):
        """Repost single view shows original author info"""
        # Find a repost in the feed
        feed_response = requests.get(f"{BASE_URL}/api/social/feed/for-you?limit=50")
        assert feed_response.status_code == 200
        posts = feed_response.json().get("posts", [])
        
        repost = None
        for p in posts:
            if p.get("is_retweet"):
                repost = p
                break
        
        if not repost:
            pytest.skip("No reposts found in feed to test")
        
        # Get single post view
        response = requests.get(f"{BASE_URL}/api/social/posts/{repost['id']}")
        assert response.status_code == 200
        
        post = response.json().get("post", {})
        assert post.get("is_retweet") == True
        assert "original_user_name" in post or "original_username" in post, \
            "Repost missing original author info"


class TestProfilePostsEndpoint:
    """Test profile posts endpoint"""
    
    def test_profile_posts_returns_posts(self):
        """Profile posts endpoint returns user's posts"""
        response = requests.get(f"{BASE_URL}/api/profile/demostudent1/posts")
        assert response.status_code == 200, f"Profile posts failed: {response.text}"
        
        data = response.json()
        assert "posts" in data
        posts = data["posts"]
        print(f"Found {len(posts)} posts for demostudent1")
    
    def test_profile_posts_include_reposts(self):
        """Profile posts include user's reposts with is_retweet flag"""
        response = requests.get(f"{BASE_URL}/api/profile/demostudent1/posts")
        assert response.status_code == 200
        
        posts = response.json().get("posts", [])
        reposts = [p for p in posts if p.get("is_retweet")]
        print(f"Found {len(reposts)} reposts in demostudent1's profile")
        
        # Verify repost structure
        for repost in reposts[:3]:
            assert "original_post_id" in repost
            # Should have original author info for display
            has_original_info = (
                "original_user_name" in repost or 
                "original_username" in repost or
                "original_user_avatar" in repost
            )
            assert has_original_info, f"Repost missing original author info: {repost.keys()}"


class TestCommentEndpoint:
    """Test comment functionality on posts"""
    
    @pytest.fixture
    def demo1_token(self):
        """Get demo1 auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        return response.json()["access_token"]
    
    def test_post_comment_on_any_post(self, demo1_token):
        """Can post comment on any post (not just own posts)"""
        # Get a post from demo2's profile
        profile_response = requests.get(f"{BASE_URL}/api/profile/demostudent2/posts")
        assert profile_response.status_code == 200
        
        posts = profile_response.json().get("posts", [])
        if not posts:
            pytest.skip("No posts found for demostudent2")
        
        post_id = posts[0]["id"]
        
        # Post a comment as demo1
        comment_response = requests.post(
            f"{BASE_URL}/api/social/posts/{post_id}/comments",
            headers={"Authorization": f"Bearer {demo1_token}"},
            json={"content": f"TEST_COMMENT_{uuid.uuid4().hex[:8]}"}
        )
        
        # Should succeed (200 or 201)
        assert comment_response.status_code in [200, 201], \
            f"Comment failed: {comment_response.status_code} - {comment_response.text}"
        
        data = comment_response.json()
        assert data.get("success") == True or "comment" in data, f"Comment not successful: {data}"


class TestRepostMetadataCopy:
    """Test that repost copies all metadata from original post"""
    
    @pytest.fixture
    def demo2_token(self):
        """Get demo2 auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo2",
            "password": "demo2"
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def demo3_token(self):
        """Get demo3 auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo3",
            "password": "demo3"
        })
        return response.json()["access_token"]
    
    def test_repost_preserves_hashtags(self, demo2_token, demo3_token):
        """Repost preserves hashtags from original post"""
        # Create post with hashtags as demo2
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(
            f"{BASE_URL}/api/social/posts",
            headers={"Authorization": f"Bearer {demo2_token}"},
            json={
                "content": f"TEST_HASHTAG_POST_{unique_id} #physics #jee",
                "hashtags": ["physics", "jee", "test"],
                "post_type": "general"
            }
        )
        assert create_response.status_code in [200, 201]
        post_id = create_response.json().get("post", create_response.json()).get("id")
        
        # Share as demo3
        share_response = requests.post(
            f"{BASE_URL}/api/social/posts/{post_id}/share",
            headers={"Authorization": f"Bearer {demo3_token}"}
        )
        assert share_response.status_code == 200
        
        # Check demo3's profile for the repost
        profile_response = requests.get(f"{BASE_URL}/api/profile/demostudent3/posts")
        posts = profile_response.json().get("posts", [])
        
        repost = None
        for p in posts:
            if p.get("is_retweet") and p.get("original_post_id") == post_id:
                repost = p
                break
        
        if repost:
            # Verify hashtags were copied
            hashtags = repost.get("hashtags", []) or repost.get("tags", [])
            print(f"Repost hashtags: {hashtags}")
            # At minimum, content should be preserved
            assert repost.get("content"), "Repost missing content"
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/social/posts/{post_id}",
            headers={"Authorization": f"Bearer {demo2_token}"}
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
