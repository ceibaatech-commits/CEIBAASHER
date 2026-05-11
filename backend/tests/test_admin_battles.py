"""
Admin Battles API Tests
Tests for admin authentication and live battles admin panel endpoints.
Covers: Admin login, live battles, history, reports, stats, and report review.
"""
import pytest
import requests
import os
import hashlib
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mobile-search-fix-1.preview.emergentagent.com').rstrip('/')

# Admin credentials from requirements
from conftest import ADMIN_EMAIL as ADMIN_USERNAME, ADMIN_PASSWORD


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        print(f"Admin login response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Login should return success=True"
        assert "token" in data, "Login should return a token"
        assert len(data["token"]) > 0, "Token should not be empty"
        assert "user" in data, "Login should return user info"
        
        # Store token for other tests
        TestAdminAuth.admin_token = data["token"]
        print(f"Admin token obtained: {data['token'][:30]}...")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"username": "wrong@email.com", "password": "wrongpassword"}
        )
        print(f"Invalid login response: {response.status_code}")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAdminBattlesLive:
    """Live battles endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        if not hasattr(TestAdminAuth, 'admin_token'):
            response = requests.post(
                f"{BASE_URL}/api/admin/auth/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
            )
            if response.status_code == 200:
                TestAdminAuth.admin_token = response.json().get("token")
            else:
                pytest.skip("Admin login failed - skipping authenticated tests")
    
    def test_get_live_battles_success(self):
        """Test GET /api/admin/battles/live returns success with admin token"""
        response = requests.get(
            f"{BASE_URL}/api/admin/battles/live",
            headers={"Authorization": f"Bearer {TestAdminAuth.admin_token}"}
        )
        print(f"Live battles response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should return success=True"
        assert "live_battles" in data, "Should return live_battles array"
        assert isinstance(data["live_battles"], list), "live_battles should be a list"
        assert "waiting_players" in data, "Should return waiting_players count"
        assert "total_active" in data, "Should return total_active count"
    
    def test_get_live_battles_no_auth(self):
        """Test GET /api/admin/battles/live without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/admin/battles/live")
        print(f"No auth response: {response.status_code}")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAdminBattlesHistory:
    """Battle history endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        if not hasattr(TestAdminAuth, 'admin_token'):
            response = requests.post(
                f"{BASE_URL}/api/admin/auth/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
            )
            if response.status_code == 200:
                TestAdminAuth.admin_token = response.json().get("token")
            else:
                pytest.skip("Admin login failed - skipping authenticated tests")
    
    def test_get_battle_history_success(self):
        """Test GET /api/admin/battles/history returns success with pagination"""
        response = requests.get(
            f"{BASE_URL}/api/admin/battles/history",
            headers={"Authorization": f"Bearer {TestAdminAuth.admin_token}"},
            params={"page": 1, "limit": 10}
        )
        print(f"History response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should return success=True"
        assert "battles" in data, "Should return battles array"
        assert isinstance(data["battles"], list), "battles should be a list"
        assert "pagination" in data, "Should return pagination info"
        assert "page" in data["pagination"], "Pagination should have page"
        assert "limit" in data["pagination"], "Pagination should have limit"
        assert "total" in data["pagination"], "Pagination should have total"


class TestAdminBattlesReports:
    """Battle reports endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        if not hasattr(TestAdminAuth, 'admin_token'):
            response = requests.post(
                f"{BASE_URL}/api/admin/auth/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
            )
            if response.status_code == 200:
                TestAdminAuth.admin_token = response.json().get("token")
            else:
                pytest.skip("Admin login failed - skipping authenticated tests")
    
    def test_get_reports_success(self):
        """Test GET /api/admin/battles/reports returns success with reports array and pending_count"""
        response = requests.get(
            f"{BASE_URL}/api/admin/battles/reports",
            headers={"Authorization": f"Bearer {TestAdminAuth.admin_token}"}
        )
        print(f"Reports response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should return success=True"
        assert "reports" in data, "Should return reports array"
        assert isinstance(data["reports"], list), "reports should be a list"
        assert "pending_count" in data, "Should return pending_count"
        assert isinstance(data["pending_count"], int), "pending_count should be an integer"
    
    def test_create_report_success(self):
        """Test POST /api/admin/battles/report creates a report"""
        report_data = {
            "battle_id": f"test_battle_{uuid.uuid4().hex[:8]}",
            "room_id": f"test_room_{uuid.uuid4().hex[:8]}",
            "reported_user_id": "test_user_123",
            "reported_username": "TestOffender",
            "reason": "cheating",
            "description": "Test report created by automated testing"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/battles/report",
            headers={"Authorization": f"Bearer {TestAdminAuth.admin_token}"},
            json=report_data
        )
        print(f"Create report response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should return success=True"
        assert "report_id" in data, "Should return report_id"
        
        # Store report_id for review test
        TestAdminBattlesReports.created_report_id = data["report_id"]
        print(f"Created report ID: {data['report_id']}")
    
    def test_verify_report_appears_in_list(self):
        """Test that created report appears in GET /api/admin/battles/reports"""
        if not hasattr(TestAdminBattlesReports, 'created_report_id'):
            pytest.skip("No report created to verify")
        
        response = requests.get(
            f"{BASE_URL}/api/admin/battles/reports",
            headers={"Authorization": f"Bearer {TestAdminAuth.admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        report_ids = [r.get("id") for r in data.get("reports", [])]
        assert TestAdminBattlesReports.created_report_id in report_ids, \
            f"Created report {TestAdminBattlesReports.created_report_id} should appear in reports list"
        print(f"Verified report {TestAdminBattlesReports.created_report_id} appears in list")
    
    def test_review_report_success(self):
        """Test PUT /api/admin/battles/reports/{report_id}/review updates report status"""
        if not hasattr(TestAdminBattlesReports, 'created_report_id'):
            pytest.skip("No report created to review")
        
        review_data = {
            "status": "reviewed",
            "admin_notes": "Reviewed by automated test",
            "action_taken": "warning"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/battles/reports/{TestAdminBattlesReports.created_report_id}/review",
            headers={"Authorization": f"Bearer {TestAdminAuth.admin_token}"},
            json=review_data
        )
        print(f"Review report response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should return success=True"
        assert data.get("report_id") == TestAdminBattlesReports.created_report_id
        print(f"Report {TestAdminBattlesReports.created_report_id} reviewed successfully")


class TestAdminBattlesStats:
    """Battle stats endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        if not hasattr(TestAdminAuth, 'admin_token'):
            response = requests.post(
                f"{BASE_URL}/api/admin/auth/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
            )
            if response.status_code == 200:
                TestAdminAuth.admin_token = response.json().get("token")
            else:
                pytest.skip("Admin login failed - skipping authenticated tests")
    
    def test_get_stats_success(self):
        """Test GET /api/admin/battles/stats returns success with stats object"""
        response = requests.get(
            f"{BASE_URL}/api/admin/battles/stats",
            headers={"Authorization": f"Bearer {TestAdminAuth.admin_token}"}
        )
        print(f"Stats response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should return success=True"
        assert "stats" in data, "Should return stats object"
        
        stats = data["stats"]
        assert "total_battles" in stats, "Stats should have total_battles"
        assert "active_battles" in stats, "Stats should have active_battles"
        assert "battles_today" in stats, "Stats should have battles_today"
        assert "battles_this_week" in stats, "Stats should have battles_this_week"
        assert "pending_reports" in stats, "Stats should have pending_reports"
        assert "total_reports" in stats, "Stats should have total_reports"
        
        print(f"Stats: total_battles={stats['total_battles']}, active={stats['active_battles']}, pending_reports={stats['pending_reports']}")


class TestRouteConflictFix:
    """Test that route conflict between /detail/{battle_id} and /reports is fixed"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        if not hasattr(TestAdminAuth, 'admin_token'):
            response = requests.post(
                f"{BASE_URL}/api/admin/auth/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
            )
            if response.status_code == 200:
                TestAdminAuth.admin_token = response.json().get("token")
            else:
                pytest.skip("Admin login failed - skipping authenticated tests")
    
    def test_reports_endpoint_not_caught_by_battle_id(self):
        """Verify GET /reports is not caught by GET /{battle_id} route"""
        # This was the bug: GET /reports was being caught by GET /{battle_id}
        # Fix: renamed to GET /detail/{battle_id}
        
        response = requests.get(
            f"{BASE_URL}/api/admin/battles/reports",
            headers={"Authorization": f"Bearer {TestAdminAuth.admin_token}"}
        )
        
        # Should return 200 with reports array, not 404 "Battle not found"
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should return success=True"
        assert "reports" in data, "Should return reports array, not battle details"
        print("Route conflict fix verified: /reports returns reports, not battle details")
    
    def test_detail_endpoint_works(self):
        """Verify GET /detail/{battle_id} works for battle details"""
        # Use a fake battle_id - should return 404 "Battle not found" (not route error)
        response = requests.get(
            f"{BASE_URL}/api/admin/battles/detail/fake_battle_123",
            headers={"Authorization": f"Bearer {TestAdminAuth.admin_token}"}
        )
        
        # Should return 404 with "Battle not found" message
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        data = response.json()
        assert "not found" in data.get("detail", "").lower(), "Should return 'Battle not found'"
        print("Detail endpoint works correctly: returns 404 for non-existent battle")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
