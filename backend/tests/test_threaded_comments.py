"""
Test Threaded Comments System for Recruitment Posts
Features tested:
- POST /api/recruitment/posts/{postId}/comment - Create comment (requires auth)
- POST /api/recruitment/posts/{postId}/comment with parent_id - Create reply
- GET /api/recruitment/posts/{postId}/comments - Get threaded comments with nested replies
- POST /api/recruitment/comments/{commentId}/like - Toggle like on comment
- is_liked field for authenticated user
- replies_count increment on parent comment
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestThreadedComments:
    """Test threaded comment system on recruitment posts"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for demo user"""
        # Login as demo1 user
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        if response.status_code == 200:
            self.token = response.json().get("access_token")
            self.user = response.json().get("user", {})
        else:
            pytest.skip("Demo login failed - skipping authenticated tests")
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.post_id = "post-tcs-intern-001"  # Seeded test post
        
    def test_01_create_comment_requires_auth(self):
        """Test that creating comment requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/recruitment/posts/{self.post_id}/comment",
            json={"text": "Test comment without auth"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Create comment requires auth - 401 returned for unauthenticated request")
    
    def test_02_create_comment_success(self):
        """Test creating a top-level comment"""
        comment_text = "TEST_This is a test comment from pytest"
        response = requests.post(
            f"{BASE_URL}/api/recruitment/posts/{self.post_id}/comment",
            json={"text": comment_text},
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Comment should have an id"
        assert data["text"] == comment_text, "Comment text should match"
        assert data["post_id"] == self.post_id, "Post ID should match"
        assert data["user_id"] == self.user.get("id"), "User ID should match"
        assert data.get("parent_id") is None, "Top-level comment should have no parent_id"
        assert data.get("likes_count", 0) == 0, "New comment should have 0 likes"
        assert data.get("replies_count", 0) == 0, "New comment should have 0 replies"
        
        # Store for later tests
        self.__class__.created_comment_id = data["id"]
        print(f"✓ Created top-level comment: {data['id']}")
    
    def test_03_create_reply_to_comment(self):
        """Test creating a reply to an existing comment"""
        parent_id = getattr(self.__class__, 'created_comment_id', None)
        if not parent_id:
            pytest.skip("No parent comment created")
        
        reply_text = "TEST_This is a reply to the test comment"
        response = requests.post(
            f"{BASE_URL}/api/recruitment/posts/{self.post_id}/comment",
            json={"text": reply_text, "parent_id": parent_id},
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Reply should have an id"
        assert data["text"] == reply_text, "Reply text should match"
        assert data["parent_id"] == parent_id, "Reply should have correct parent_id"
        
        self.__class__.created_reply_id = data["id"]
        print(f"✓ Created reply comment: {data['id']} with parent_id: {parent_id}")
    
    def test_04_reply_increments_parent_replies_count(self):
        """Test that creating a reply increments parent's replies_count"""
        parent_id = getattr(self.__class__, 'created_comment_id', None)
        if not parent_id:
            pytest.skip("No parent comment created")
        
        # Get comments and check parent's replies_count
        response = requests.get(
            f"{BASE_URL}/api/recruitment/posts/{self.post_id}/comments",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        comments = data.get("comments", [])
        
        # Find the parent comment
        parent_comment = next((c for c in comments if c["id"] == parent_id), None)
        if parent_comment:
            assert parent_comment.get("replies_count", 0) >= 1, "Parent should have at least 1 reply"
            print(f"✓ Parent comment has replies_count: {parent_comment.get('replies_count')}")
        else:
            print("⚠ Parent comment not found in top-level comments (may have been deleted)")
    
    def test_05_get_comments_returns_threaded_structure(self):
        """Test GET comments returns threaded structure with nested replies"""
        response = requests.get(
            f"{BASE_URL}/api/recruitment/posts/{self.post_id}/comments",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "comments" in data, "Response should have 'comments' key"
        
        comments = data["comments"]
        assert isinstance(comments, list), "Comments should be a list"
        
        # Check structure of comments
        if len(comments) > 0:
            comment = comments[0]
            assert "id" in comment, "Comment should have id"
            assert "text" in comment, "Comment should have text"
            assert "user_name" in comment, "Comment should have user_name"
            assert "created_at" in comment, "Comment should have created_at"
            assert "replies" in comment, "Comment should have 'replies' array"
            assert isinstance(comment["replies"], list), "Replies should be a list"
            print(f"✓ GET comments returns threaded structure with {len(comments)} top-level comments")
            
            # Check if any comment has replies
            for c in comments:
                if len(c.get("replies", [])) > 0:
                    print(f"  - Comment {c['id'][:8]}... has {len(c['replies'])} replies")
    
    def test_06_get_comments_includes_is_liked_field(self):
        """Test that comments include is_liked field for authenticated user"""
        response = requests.get(
            f"{BASE_URL}/api/recruitment/posts/{self.post_id}/comments",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        comments = data.get("comments", [])
        
        if len(comments) > 0:
            comment = comments[0]
            assert "is_liked" in comment, "Comment should have 'is_liked' field"
            assert isinstance(comment["is_liked"], bool), "is_liked should be boolean"
            print(f"✓ Comments include is_liked field (value: {comment['is_liked']})")
            
            # Check replies also have is_liked
            for c in comments:
                for reply in c.get("replies", []):
                    assert "is_liked" in reply, "Reply should have 'is_liked' field"
    
    def test_07_like_comment_requires_auth(self):
        """Test that liking a comment requires authentication"""
        comment_id = getattr(self.__class__, 'created_comment_id', None)
        if not comment_id:
            pytest.skip("No comment created")
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/comments/{comment_id}/like"
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Like comment requires auth - 401 returned for unauthenticated request")
    
    def test_08_like_comment_toggle(self):
        """Test toggling like on a comment"""
        comment_id = getattr(self.__class__, 'created_comment_id', None)
        if not comment_id:
            pytest.skip("No comment created")
        
        # First like
        response = requests.post(
            f"{BASE_URL}/api/recruitment/comments/{comment_id}/like",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "liked" in data, "Response should have 'liked' field"
        assert "likes_count" in data, "Response should have 'likes_count' field"
        
        first_liked = data["liked"]
        first_count = data["likes_count"]
        print(f"✓ First toggle - liked: {first_liked}, count: {first_count}")
        
        # Second toggle (unlike)
        response = requests.post(
            f"{BASE_URL}/api/recruitment/comments/{comment_id}/like",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        second_liked = data["liked"]
        second_count = data["likes_count"]
        
        # Verify toggle behavior
        assert first_liked != second_liked, "Like status should toggle"
        print(f"✓ Second toggle - liked: {second_liked}, count: {second_count}")
    
    def test_09_like_reply_comment(self):
        """Test liking a reply comment"""
        reply_id = getattr(self.__class__, 'created_reply_id', None)
        if not reply_id:
            pytest.skip("No reply created")
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/comments/{reply_id}/like",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "liked" in data
        assert "likes_count" in data
        print(f"✓ Liked reply comment - liked: {data['liked']}, count: {data['likes_count']}")
    
    def test_10_like_nonexistent_comment_returns_404(self):
        """Test liking a non-existent comment returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/recruitment/comments/nonexistent-comment-id/like",
            headers=self.headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Like non-existent comment returns 404")
    
    def test_11_create_comment_on_nonexistent_post_returns_404(self):
        """Test creating comment on non-existent post returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/recruitment/posts/nonexistent-post-id/comment",
            json={"text": "Test comment"},
            headers=self.headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Create comment on non-existent post returns 404")
    
    def test_12_create_reply_to_nonexistent_parent_returns_404(self):
        """Test creating reply to non-existent parent returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/recruitment/posts/{self.post_id}/comment",
            json={"text": "Test reply", "parent_id": "nonexistent-parent-id"},
            headers=self.headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Create reply to non-existent parent returns 404")
    
    def test_13_comment_text_is_required(self):
        """Test that comment text is required"""
        response = requests.post(
            f"{BASE_URL}/api/recruitment/posts/{self.post_id}/comment",
            json={},
            headers=self.headers
        )
        # Should return 422 (validation error) or 400
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("✓ Comment text is required - validation error returned")
    
    def test_14_get_comments_without_auth_works(self):
        """Test that getting comments works without authentication"""
        response = requests.get(
            f"{BASE_URL}/api/recruitment/posts/{self.post_id}/comments"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "comments" in data
        print(f"✓ GET comments works without auth - returned {len(data['comments'])} comments")
    
    def test_15_comments_sorted_by_created_at_desc(self):
        """Test that top-level comments are sorted by created_at descending (newest first)"""
        response = requests.get(
            f"{BASE_URL}/api/recruitment/posts/{self.post_id}/comments",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        comments = data.get("comments", [])
        
        if len(comments) >= 2:
            # Check that comments are sorted newest first
            for i in range(len(comments) - 1):
                current_time = comments[i].get("created_at", "")
                next_time = comments[i + 1].get("created_at", "")
                assert current_time >= next_time, "Comments should be sorted newest first"
            print("✓ Comments are sorted by created_at descending (newest first)")
        else:
            print("⚠ Not enough comments to verify sorting")


class TestCommentIntegration:
    """Integration tests for comment system with post interactions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for demo user"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": "demo1",
            "password": "demo1"
        })
        if response.status_code == 200:
            self.token = response.json().get("access_token")
        else:
            pytest.skip("Demo login failed")
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.post_id = "post-tcs-intern-001"
    
    def test_post_comments_count_increments(self):
        """Test that post's comments_count increments when comment is added"""
        # Get initial post state
        response = requests.get(f"{BASE_URL}/api/recruitment/posts/{self.post_id}")
        assert response.status_code == 200
        initial_count = response.json().get("comments_count", 0)
        
        # Add a comment
        response = requests.post(
            f"{BASE_URL}/api/recruitment/posts/{self.post_id}/comment",
            json={"text": "TEST_Integration test comment"},
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Check post's comments_count increased
        response = requests.get(f"{BASE_URL}/api/recruitment/posts/{self.post_id}")
        assert response.status_code == 200
        new_count = response.json().get("comments_count", 0)
        
        assert new_count > initial_count, f"Comments count should increase: {initial_count} -> {new_count}"
        print(f"✓ Post comments_count incremented: {initial_count} -> {new_count}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
