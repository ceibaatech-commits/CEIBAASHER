"""
CEIBAA Recruitment Portal - Backend API Tests
Tests: Recruiter auth, Admin auth, Companies, Feed, Company details
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://profile-social-4.preview.emergentagent.com')

# Test credentials from seed data
RECRUITER_EMAIL = "hr@tcs.com"
RECRUITER_PASSWORD = "tcs123"
ADMIN_EMAIL = "admin@ceibaa.in"
ADMIN_PASSWORD = "admin123"
STUDENT_USERNAME = "demo1"
STUDENT_PASSWORD = "demo1"


class TestRecruiterAuth:
    """Recruiter authentication tests"""
    
    def test_recruiter_login_success(self):
        """POST /api/recruitment/recruiter/login - valid credentials"""
        response = requests.post(f"{BASE_URL}/api/recruitment/recruiter/login", json={
            "email": RECRUITER_EMAIL,
            "password": RECRUITER_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        assert "recruiter" in data, "Missing recruiter data in response"
        assert data["recruiter"]["email"] == RECRUITER_EMAIL
        assert data["recruiter"]["company_name"] == "Tata Consultancy Services"
        assert "password_hash" not in data["recruiter"], "Password hash should not be exposed"
    
    def test_recruiter_login_invalid_credentials(self):
        """POST /api/recruitment/recruiter/login - invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/recruitment/recruiter/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_recruiter_login_wrong_password(self):
        """POST /api/recruitment/recruiter/login - correct email, wrong password"""
        response = requests.post(f"{BASE_URL}/api/recruitment/recruiter/login", json={
            "email": RECRUITER_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_recruiter_me_with_token(self):
        """GET /api/recruitment/recruiter/me - with valid token"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/recruitment/recruiter/login", json={
            "email": RECRUITER_EMAIL,
            "password": RECRUITER_PASSWORD
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        
        # Get recruiter profile
        response = requests.get(f"{BASE_URL}/api/recruitment/recruiter/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["email"] == RECRUITER_EMAIL
        assert "password_hash" not in data
    
    def test_recruiter_me_without_token(self):
        """GET /api/recruitment/recruiter/me - without token"""
        response = requests.get(f"{BASE_URL}/api/recruitment/recruiter/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """POST /api/recruitment-admin/login - valid credentials"""
        response = requests.post(f"{BASE_URL}/api/recruitment-admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        assert "admin" in data, "Missing admin data in response"
        assert data["admin"]["email"] == ADMIN_EMAIL
    
    def test_admin_login_invalid_credentials(self):
        """POST /api/recruitment-admin/login - invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/recruitment-admin/login", json={
            "email": "wrong@admin.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_me_with_token(self):
        """GET /api/recruitment-admin/me - with valid token"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/recruitment-admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        
        # Get admin profile
        response = requests.get(f"{BASE_URL}/api/recruitment-admin/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["email"] == ADMIN_EMAIL


class TestCompanies:
    """Company listing and details tests"""
    
    def test_list_companies(self):
        """GET /api/recruitment/companies - returns 5 seeded companies"""
        response = requests.get(f"{BASE_URL}/api/recruitment/companies")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "companies" in data, "Missing companies in response"
        assert "total" in data, "Missing total count"
        assert len(data["companies"]) == 5, f"Expected 5 companies, got {len(data['companies'])}"
        
        # Verify company structure
        company = data["companies"][0]
        assert "id" in company
        assert "company_name" in company
        assert "slug" in company
        assert "industry" in company
        assert "logo_url" in company
        assert "password_hash" not in company, "Password hash should not be exposed"
    
    def test_list_companies_with_search(self):
        """GET /api/recruitment/companies?search=Tata"""
        response = requests.get(f"{BASE_URL}/api/recruitment/companies?search=Tata")
        assert response.status_code == 200
        data = response.json()
        assert len(data["companies"]) >= 1, f"Expected at least 1 company, got {len(data['companies'])}"
        # Tata Consultancy Services should be in results
        company_names = [c["company_name"] for c in data["companies"]]
        assert any("Tata" in name for name in company_names), f"Tata not found in {company_names}"
    
    def test_list_companies_with_industry_filter(self):
        """GET /api/recruitment/companies?industry=IT Services"""
        response = requests.get(f"{BASE_URL}/api/recruitment/companies?industry=IT Services")
        assert response.status_code == 200
        data = response.json()
        # TCS and Infosys are IT Services
        assert len(data["companies"]) >= 2
    
    def test_get_company_by_slug(self):
        """GET /api/recruitment/company/tcs - returns TCS details"""
        response = requests.get(f"{BASE_URL}/api/recruitment/company/tcs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["company_name"] == "Tata Consultancy Services"
        assert data["slug"] == "tcs"
        assert data["industry"] == "IT Services"
        assert "followers_count" in data
        assert "posts_count" in data
        assert "open_roles" in data
        assert "password_hash" not in data
    
    def test_get_company_not_found(self):
        """GET /api/recruitment/company/nonexistent - returns 404"""
        response = requests.get(f"{BASE_URL}/api/recruitment/company/nonexistent-company-xyz")
        assert response.status_code == 404


class TestFeed:
    """Feed and posts tests"""
    
    def test_get_feed(self):
        """GET /api/recruitment/feed - returns 6 seeded posts"""
        response = requests.get(f"{BASE_URL}/api/recruitment/feed?page=1&limit=50")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "posts" in data, "Missing posts in response"
        assert "total" in data, "Missing total count"
        assert len(data["posts"]) == 6, f"Expected 6 posts, got {len(data['posts'])}"
        
        # Verify post structure
        post = data["posts"][0]
        assert "id" in post
        assert "title" in post
        assert "post_type" in post
        assert "company_name" in post
        assert "status" in post
        assert post["status"] == "approved"
    
    def test_get_feed_post_types(self):
        """GET /api/recruitment/feed - verify all post types present"""
        response = requests.get(f"{BASE_URL}/api/recruitment/feed?page=1&limit=50")
        assert response.status_code == 200
        data = response.json()
        
        post_types = set(p["post_type"] for p in data["posts"])
        # Should have job, quiz, hackathon, event
        assert "job" in post_types, "Missing job posts"
        assert "quiz" in post_types, "Missing quiz posts"
        assert "hackathon" in post_types, "Missing hackathon posts"
        assert "event" in post_types, "Missing event posts"
    
    def test_get_post_by_id(self):
        """GET /api/recruitment/posts/{post_id} - get specific post"""
        # First get feed to get a post ID
        feed_resp = requests.get(f"{BASE_URL}/api/recruitment/feed?page=1&limit=50")
        assert feed_resp.status_code == 200
        posts = feed_resp.json()["posts"]
        assert len(posts) > 0
        
        post_id = posts[0]["id"]
        response = requests.get(f"{BASE_URL}/api/recruitment/posts/{post_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == post_id
        assert "title" in data
        assert "company_name" in data
    
    def test_get_company_posts(self):
        """GET /api/recruitment/company/tcs/posts - get TCS posts"""
        response = requests.get(f"{BASE_URL}/api/recruitment/company/tcs/posts")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        # TCS has 2 posts in seed data
        assert len(data["posts"]) >= 2


class TestRecruiterDashboard:
    """Recruiter dashboard and analytics tests"""
    
    @pytest.fixture
    def recruiter_token(self):
        """Get recruiter auth token"""
        response = requests.post(f"{BASE_URL}/api/recruitment/recruiter/login", json={
            "email": RECRUITER_EMAIL,
            "password": RECRUITER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Recruiter login failed")
    
    def test_get_my_posts(self, recruiter_token):
        """GET /api/recruitment/posts/my - recruiter's posts"""
        response = requests.get(f"{BASE_URL}/api/recruitment/posts/my", headers={
            "Authorization": f"Bearer {recruiter_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        # TCS has 2 posts
        assert len(data["posts"]) >= 2
    
    def test_get_analytics(self, recruiter_token):
        """GET /api/recruitment/analytics - recruiter analytics"""
        response = requests.get(f"{BASE_URL}/api/recruitment/analytics", headers={
            "Authorization": f"Bearer {recruiter_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "total_applications" in data
        assert "shortlisted" in data
        assert "followers" in data
        assert "total_posts" in data
        assert "post_stats" in data


class TestAdminDashboard:
    """Admin dashboard tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/recruitment-admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    def test_list_recruiters(self, admin_token):
        """GET /api/recruitment-admin/recruiters - list all recruiters"""
        response = requests.get(f"{BASE_URL}/api/recruitment-admin/recruiters", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "recruiters" in data
        assert len(data["recruiters"]) == 5, f"Expected 5 recruiters, got {len(data['recruiters'])}"
    
    def test_get_pending_posts(self, admin_token):
        """GET /api/recruitment-admin/pending-posts - pending moderation"""
        response = requests.get(f"{BASE_URL}/api/recruitment-admin/pending-posts", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        # All seeded posts are approved, so pending should be 0
        assert len(data["posts"]) == 0
    
    def test_get_global_analytics(self, admin_token):
        """GET /api/recruitment-admin/analytics - global analytics"""
        response = requests.get(f"{BASE_URL}/api/recruitment-admin/analytics", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "total_recruiters" in data
        assert "active_listings" in data
        assert "total_applications" in data
        assert "pending_posts" in data
        assert data["total_recruiters"] == 5
        assert data["active_listings"] == 6


class TestStudentApplications:
    """Student application flow tests"""
    
    @pytest.fixture
    def student_token(self):
        """Get student auth token via demo login"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login", json={
            "username": STUDENT_USERNAME,
            "password": STUDENT_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token") or response.json().get("access_token")
        pytest.skip("Student login failed")
    
    def test_get_my_applications(self, student_token):
        """GET /api/recruitment/my-applications - student's applications"""
        response = requests.get(f"{BASE_URL}/api/recruitment/my-applications", headers={
            "Authorization": f"Bearer {student_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "applications" in data
    
    def test_get_student_profile(self, student_token):
        """GET /api/recruitment/student-profile - student recruitment profile"""
        response = requests.get(f"{BASE_URL}/api/recruitment/student-profile", headers={
            "Authorization": f"Bearer {student_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
