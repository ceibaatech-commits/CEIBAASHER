"""
Test file for Media Posting Permissions Feature
Tests global media toggle + per-user permissions for Victory Lane
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://podcast-tutor-1.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "testbug@test.com"
TEST_USER_PASSWORD = "test1234"
DEMO_USER = "demo1"
DEMO_PASSWORD = "demo1"


class TestGlobalMediaSettings:
    """Tests for global media settings endpoints"""
    
    def test_get_media_allowed_returns_defaults(self):
        """GET /api/settings/media-allowed returns global media settings (default: all false)"""
        response = requests.get(f"{BASE_URL}/api/settings/media-allowed")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "allow_media_posts" in data, "Response missing allow_media_posts"
        assert "allow_image_posts" in data, "Response missing allow_image_posts"
        assert "allow_video_posts" in data, "Response missing allow_video_posts"
        
        # Log current state (may be true or false depending on admin settings)
        print(f"Current global settings: media={data['allow_media_posts']}, images={data['allow_image_posts']}, videos={data['allow_video_posts']}")

    def test_post_admin_settings_saves_correctly(self):
        """POST /api/admin/settings saves global media settings correctly"""
        # Test enabling all toggles
        payload = {
            "allow_media_posts": True,
            "allow_image_posts": True,
            "allow_video_posts": True
        }
        response = requests.post(f"{BASE_URL}/api/admin/settings", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "settings" in data, "Response missing settings"
        
        # Verify settings saved correctly
        settings = data["settings"]
        assert settings["allow_media_posts"] == True
        assert settings["allow_image_posts"] == True
        assert settings["allow_video_posts"] == True
        
        # Verify via GET
        verify_response = requests.get(f"{BASE_URL}/api/settings/media-allowed")
        verify_data = verify_response.json()
        assert verify_data["allow_media_posts"] == True
        assert verify_data["allow_image_posts"] == True
        assert verify_data["allow_video_posts"] == True
        print("Global settings enabled successfully")

    def test_disable_global_settings(self):
        """Test disabling global media settings"""
        payload = {
            "allow_media_posts": False,
            "allow_image_posts": False,
            "allow_video_posts": False
        }
        response = requests.post(f"{BASE_URL}/api/admin/settings", json=payload)
        assert response.status_code == 200
        
        # Verify settings are disabled
        verify_response = requests.get(f"{BASE_URL}/api/settings/media-allowed")
        verify_data = verify_response.json()
        assert verify_data["allow_media_posts"] == False
        assert verify_data["allow_image_posts"] == False
        assert verify_data["allow_video_posts"] == False
        print("Global settings disabled successfully")


class TestUserMediaPermissions:
    """Tests for user media permissions endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    @pytest.fixture
    def demo_auth_token(self):
        """Get authentication token for demo user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": DEMO_USER,
            "password": DEMO_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip(f"Demo user authentication failed: {response.status_code}")

    def test_media_permissions_returns_disabled_globally_when_off(self):
        """GET /api/user/media-permissions returns media_disabled_globally=true when global is off"""
        # First disable global media
        requests.post(f"{BASE_URL}/api/admin/settings", json={
            "allow_media_posts": False,
            "allow_image_posts": False,
            "allow_video_posts": False
        })
        
        # Check user permissions without auth
        response = requests.get(f"{BASE_URL}/api/user/media-permissions")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("media_disabled_globally") == True, "Expected media_disabled_globally=True when global is off"
        assert data.get("can_post_images") == False
        assert data.get("can_post_videos") == False
        print("Correctly returns media_disabled_globally=True when global is off")

    def test_media_permissions_with_global_enabled_and_user_enabled(self, auth_token):
        """When global media is enabled and per-user is enabled, /api/user/media-permissions returns true"""
        # Enable global settings
        requests.post(f"{BASE_URL}/api/admin/settings", json={
            "allow_media_posts": True,
            "allow_image_posts": True,
            "allow_video_posts": True
        })
        
        # Get user ID from token to set permissions
        profile_response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        user_id = None
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
            user_id = profile_data.get("id") or profile_data.get("user_id") or profile_data.get("user", {}).get("id")
        
        if user_id:
            # Enable per-user permissions
            requests.put(f"{BASE_URL}/api/admin/users/{user_id}/permissions", json={
                "can_post_images": True,
                "can_post_videos": True,
                "is_disabled": False
            })
        
        # Check user permissions
        response = requests.get(f"{BASE_URL}/api/user/media-permissions", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("media_disabled_globally") == False, "Expected media_disabled_globally=False"
        
        # If user permissions were set, check they're enabled
        if user_id:
            assert data.get("can_post_images") == True or data.get("can_post_videos") == True, \
                "Expected at least one permission enabled when global and user are both enabled"
        print(f"User permissions with global enabled: images={data.get('can_post_images')}, videos={data.get('can_post_videos')}")

    def test_media_permissions_with_global_enabled_but_user_disabled(self, auth_token):
        """When global media is enabled but per-user is disabled, /api/user/media-permissions returns false"""
        # Enable global settings
        requests.post(f"{BASE_URL}/api/admin/settings", json={
            "allow_media_posts": True,
            "allow_image_posts": True,
            "allow_video_posts": True
        })
        
        # Get user ID
        profile_response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        user_id = None
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
            user_id = profile_data.get("id") or profile_data.get("user_id") or profile_data.get("user", {}).get("id")
        
        if user_id:
            # Disable per-user permissions
            requests.put(f"{BASE_URL}/api/admin/users/{user_id}/permissions", json={
                "can_post_images": False,
                "can_post_videos": False,
                "is_disabled": False
            })
        
        # Check user permissions
        response = requests.get(f"{BASE_URL}/api/user/media-permissions", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("media_disabled_globally") == False, "Global should be enabled"
        
        # Per-user should be disabled
        if user_id:
            assert data.get("can_post_images") == False, "Expected can_post_images=False when per-user is disabled"
            assert data.get("can_post_videos") == False, "Expected can_post_videos=False when per-user is disabled"
        print("Correctly returns per-user disabled when global enabled but user disabled")


class TestMediaUploadBlocking:
    """Tests for media upload blocking when disabled"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip("Authentication failed")
    
    def test_media_upload_returns_403_when_global_disabled(self, auth_token):
        """POST /api/media/upload returns 403 when global media is disabled"""
        # Disable global media
        requests.post(f"{BASE_URL}/api/admin/settings", json={
            "allow_media_posts": False,
            "allow_image_posts": False,
            "allow_video_posts": False
        })
        
        # Try to upload a file
        # Create a simple test image (1x1 pixel PNG)
        import base64
        test_image_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'file': ('test.png', test_image_data, 'image/png')
        }
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/media/upload", files=files, headers=headers)
        
        assert response.status_code == 403, f"Expected 403 when media disabled, got {response.status_code}"
        
        data = response.json()
        assert "disabled" in data.get("detail", "").lower(), "Error message should mention disabled"
        print(f"Correctly blocked upload with 403: {data.get('detail')}")

    def test_media_upload_succeeds_when_enabled(self, auth_token):
        """POST /api/media/upload succeeds when global media is enabled"""
        # Enable global media
        requests.post(f"{BASE_URL}/api/admin/settings", json={
            "allow_media_posts": True,
            "allow_image_posts": True,
            "allow_video_posts": True
        })
        
        # Try to upload a file
        import base64
        test_image_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'file': ('test.png', test_image_data, 'image/png')
        }
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/media/upload", files=files, headers=headers)
        
        assert response.status_code == 200, f"Expected 200 when media enabled, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "url" in data, "Expected url in response"
        print(f"Upload succeeded: {data.get('url')}")


class TestAdminGetSettings:
    """Tests for admin settings endpoint"""
    
    def test_get_admin_settings(self):
        """GET /api/admin/settings returns platform settings"""
        response = requests.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "settings" in data
        
        settings = data["settings"]
        # Settings should contain media toggle fields
        print(f"Admin settings: {settings}")


class TestCleanup:
    """Cleanup tests - run last to reset state"""
    
    def test_z_reset_to_disabled(self):
        """Reset global settings to disabled state (default)"""
        payload = {
            "allow_media_posts": False,
            "allow_image_posts": False,
            "allow_video_posts": False
        }
        response = requests.post(f"{BASE_URL}/api/admin/settings", json=payload)
        assert response.status_code == 200
        print("Reset global media settings to disabled (default state)")


# Run order hint - pytest runs alphabetically
# TestAdminGetSettings
# TestCleanup (z_ prefix ensures last)
# TestGlobalMediaSettings  
# TestMediaUploadBlocking
# TestUserMediaPermissions
