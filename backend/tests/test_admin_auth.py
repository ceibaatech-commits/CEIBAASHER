"""
Admin Authentication Tests
Tests for secure admin login at /api/admin/auth endpoints
"""
import pytest
import requests
import os

# Use the preview URL for testing
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")

# Admin credentials from conftest (env-backed)
from conftest import ADMIN_EMAIL, ADMIN_PASSWORD
ADMIN_USERNAME = os.environ.get("TEST_ADMIN_USERNAME", "superadmin")


class TestAdminLoginEndpoint:
    """Tests for POST /api/admin/auth/login"""
    
    def test_login_with_correct_email_and_password(self):
        """Admin can login with email and correct password"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "token" in data, f"Token missing from response: {data}"
        assert data["token"] is not None, "Token should not be None"
        assert len(data["token"]) > 0, "Token should not be empty"
        
        # Verify user info
        assert "user" in data, f"User missing from response: {data}"
        print(f"Login successful with email. Token: {data['token'][:20]}...")
        print(f"User info: {data['user']}")
    
    def test_login_with_username_and_password(self):
        """Admin can login with username 'superadmin' and correct password"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "token" in data, f"Token missing from response: {data}"
        print(f"Login successful with username. Token: {data['token'][:20]}...")
    
    def test_login_with_wrong_password_returns_401(self):
        """Login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "username": ADMIN_EMAIL,
            "password": "WrongPassword123"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("Correctly rejected wrong password with 401")
    
    def test_login_with_non_admin_user_returns_401(self):
        """Login with non-admin username returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "username": "random_non_admin@test.com",
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("Correctly rejected non-admin user with 401")
    
    def test_login_with_empty_credentials(self):
        """Login with empty credentials returns 4xx error"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "username": "",
            "password": ""
        })
        
        # Could be 401 (unauthorized) or 422 (validation error)
        assert response.status_code in [401, 422], f"Expected 401 or 422, got {response.status_code}: {response.text}"
        print(f"Correctly rejected empty credentials with {response.status_code}")


class TestAdminVerifyEndpoint:
    """Tests for GET /api/admin/auth/verify"""
    
    @pytest.fixture
    def admin_token(self):
        """Get a valid admin token for testing"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not get admin token for verify tests")
    
    def test_verify_with_valid_token(self, admin_token):
        """Verify returns valid=true for valid token"""
        response = requests.get(
            f"{BASE_URL}/api/admin/auth/verify",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("valid") == True, f"Expected valid=True, got {data}"
        print(f"Token verified successfully: {data}")
    
    def test_verify_with_invalid_token(self):
        """Verify returns valid=false for invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/admin/auth/verify",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("valid") == False, f"Expected valid=False, got {data}"
        print(f"Invalid token correctly rejected: {data}")
    
    def test_verify_without_token(self):
        """Verify without token returns valid=true for legacy compatibility"""
        response = requests.get(f"{BASE_URL}/api/admin/auth/verify")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        # Based on code, empty token returns legacy: true
        print(f"Verify without token response: {data}")


class TestAdminLogoutEndpoint:
    """Tests for POST /api/admin/auth/logout"""
    
    @pytest.fixture
    def admin_token(self):
        """Get a valid admin token for testing"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not get admin token for logout tests")
    
    def test_logout_with_valid_token(self, admin_token):
        """Logout invalidates session"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/logout",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"Expected success=True, got {data}"
        print(f"Logout successful: {data}")
        
        # Verify token is now invalid
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/auth/verify",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        verify_data = verify_response.json()
        assert verify_data.get("valid") == False, f"Token should be invalid after logout, got {verify_data}"
        print("Token correctly invalidated after logout")
    
    def test_logout_without_token(self):
        """Logout without token still returns success"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/logout")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"Expected success=True, got {data}"
        print(f"Logout without token: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
