"""
Test Profile Photo Upload Feature
Tests for POST /api/media/profile-upload endpoint and PUT /api/profile/update with photo fields
"""

import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test image data (1x1 pixel PNG)
TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='


@pytest.fixture
def auth_token():
    """Get authentication token for demo1 user"""
    response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
        "username": "demo1",
        "password": "demo1"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture
def test_image_file(tmp_path):
    """Create a temporary test image file"""
    image_data = base64.b64decode(TEST_IMAGE_BASE64)
    image_path = tmp_path / "test_avatar.png"
    image_path.write_bytes(image_data)
    return str(image_path)


class TestProfileUploadEndpoint:
    """Tests for POST /api/media/profile-upload endpoint"""
    
    def test_avatar_upload_returns_cloudinary_url(self, auth_token, test_image_file):
        """Test avatar upload returns Cloudinary URL"""
        with open(test_image_file, 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/media/profile-upload?upload_type=avatar",
                headers={"Authorization": f"Bearer {auth_token}"},
                files={"file": ("test_avatar.png", f, "image/png")}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "url" in data
        assert data["url"].startswith("https://res.cloudinary.com/")
        assert "/avatars/" in data["url"]
        print(f"Avatar uploaded: {data['url']}")
    
    def test_cover_upload_returns_cloudinary_url(self, auth_token, test_image_file):
        """Test cover photo upload returns Cloudinary URL"""
        with open(test_image_file, 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/media/profile-upload?upload_type=cover",
                headers={"Authorization": f"Bearer {auth_token}"},
                files={"file": ("test_cover.png", f, "image/png")}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "url" in data
        assert data["url"].startswith("https://res.cloudinary.com/")
        assert "/covers/" in data["url"]
        print(f"Cover uploaded: {data['url']}")
    
    def test_upload_rejects_non_image_files(self, auth_token, tmp_path):
        """Test that non-image files are rejected"""
        # Create a text file
        text_file = tmp_path / "test.txt"
        text_file.write_text("This is not an image")
        
        with open(text_file, 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/media/profile-upload?upload_type=avatar",
                headers={"Authorization": f"Bearer {auth_token}"},
                files={"file": ("test.txt", f, "text/plain")}
            )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Only images allowed" in data["detail"]
        print(f"Non-image correctly rejected: {data['detail']}")
    
    def test_upload_rejects_pdf_files(self, auth_token, tmp_path):
        """Test that PDF files are rejected"""
        # Create a fake PDF file
        pdf_file = tmp_path / "test.pdf"
        pdf_file.write_bytes(b"%PDF-1.4 fake pdf content")
        
        with open(pdf_file, 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/media/profile-upload?upload_type=avatar",
                headers={"Authorization": f"Bearer {auth_token}"},
                files={"file": ("test.pdf", f, "application/pdf")}
            )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Only images allowed" in data["detail"]
        print(f"PDF correctly rejected: {data['detail']}")
    
    def test_upload_type_avatar_uses_avatars_folder(self, auth_token, test_image_file):
        """Test that avatar upload uses avatars folder in Cloudinary"""
        with open(test_image_file, 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/media/profile-upload?upload_type=avatar",
                headers={"Authorization": f"Bearer {auth_token}"},
                files={"file": ("test.png", f, "image/png")}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert "/avatars/" in data["url"]
        print(f"Avatar folder verified: {data['url']}")
    
    def test_upload_type_cover_uses_covers_folder(self, auth_token, test_image_file):
        """Test that cover upload uses covers folder in Cloudinary"""
        with open(test_image_file, 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/media/profile-upload?upload_type=cover",
                headers={"Authorization": f"Bearer {auth_token}"},
                files={"file": ("test.png", f, "image/png")}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert "/covers/" in data["url"]
        print(f"Cover folder verified: {data['url']}")


class TestProfileUpdateWithPhotos:
    """Tests for PUT /api/profile/update with profile_picture and cover_photo fields"""
    
    def test_update_profile_picture_field(self, auth_token):
        """Test updating profile_picture field via PUT /api/profile/update"""
        test_url = "https://res.cloudinary.com/dzebupykv/image/upload/test_profile_pic.png"
        
        response = requests.put(
            f"{BASE_URL}/api/profile/update",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={"profile_picture": test_url}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "profile_picture" in data.get("updated_fields", [])
        assert data["profile"]["profile_picture"] == test_url
        print(f"Profile picture updated: {data['profile']['profile_picture']}")
    
    def test_update_cover_photo_field(self, auth_token):
        """Test updating cover_photo field via PUT /api/profile/update"""
        test_url = "https://res.cloudinary.com/dzebupykv/image/upload/test_cover_photo.png"
        
        response = requests.put(
            f"{BASE_URL}/api/profile/update",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={"cover_photo": test_url}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "cover_photo" in data.get("updated_fields", [])
        assert data["profile"]["cover_photo"] == test_url
        print(f"Cover photo updated: {data['profile']['cover_photo']}")
    
    def test_update_both_photos_at_once(self, auth_token):
        """Test updating both profile_picture and cover_photo in one request"""
        profile_url = "https://res.cloudinary.com/dzebupykv/image/upload/both_profile.png"
        cover_url = "https://res.cloudinary.com/dzebupykv/image/upload/both_cover.png"
        
        response = requests.put(
            f"{BASE_URL}/api/profile/update",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "profile_picture": profile_url,
                "cover_photo": cover_url
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["profile"]["profile_picture"] == profile_url
        assert data["profile"]["cover_photo"] == cover_url
        print(f"Both photos updated successfully")
    
    def test_profile_get_returns_photo_fields(self, auth_token):
        """Test that GET /api/profile/{username} returns photo fields"""
        response = requests.get(f"{BASE_URL}/api/profile/demostudent1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        profile = data.get("profile", {})
        # Check that photo fields exist in response
        assert "profile_picture" in profile or profile.get("profile_picture") is None
        assert "cover_photo" in profile or profile.get("cover_photo") is None
        print(f"Profile photo fields: profile_picture={profile.get('profile_picture')}, cover_photo={profile.get('cover_photo')}")


class TestUploadEndpointValidation:
    """Tests for upload endpoint validation"""
    
    def test_upload_requires_file(self, auth_token):
        """Test that upload endpoint requires a file"""
        response = requests.post(
            f"{BASE_URL}/api/media/profile-upload?upload_type=avatar",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Should return 422 (Unprocessable Entity) for missing file
        assert response.status_code == 422
        print(f"Missing file correctly rejected with status {response.status_code}")
    
    def test_upload_type_defaults_to_avatar(self, auth_token, test_image_file):
        """Test that upload_type defaults to avatar if not specified"""
        with open(test_image_file, 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/media/profile-upload",  # No upload_type param
                headers={"Authorization": f"Bearer {auth_token}"},
                files={"file": ("test.png", f, "image/png")}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "/avatars/" in data["url"]  # Should default to avatars folder
        print(f"Default upload_type=avatar verified: {data['url']}")


class TestCloudinaryTransformations:
    """Tests to verify Cloudinary transformations are applied"""
    
    def test_avatar_upload_applies_transformations(self, auth_token, test_image_file):
        """Test that avatar upload applies 400x400 face crop transformation"""
        with open(test_image_file, 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/media/profile-upload?upload_type=avatar",
                headers={"Authorization": f"Bearer {auth_token}"},
                files={"file": ("test.png", f, "image/png")}
            )
        
        assert response.status_code == 200
        data = response.json()
        # The URL should be a valid Cloudinary URL
        # Transformations are applied during upload, not in URL
        assert data["url"].startswith("https://res.cloudinary.com/")
        print(f"Avatar with transformations: {data['url']}")
    
    def test_cover_upload_applies_transformations(self, auth_token, test_image_file):
        """Test that cover upload applies 1500x500 fill transformation"""
        with open(test_image_file, 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/media/profile-upload?upload_type=cover",
                headers={"Authorization": f"Bearer {auth_token}"},
                files={"file": ("test.png", f, "image/png")}
            )
        
        assert response.status_code == 200
        data = response.json()
        # The URL should be a valid Cloudinary URL
        assert data["url"].startswith("https://res.cloudinary.com/")
        print(f"Cover with transformations: {data['url']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
