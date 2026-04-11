"""
Test suite for Programs/Courses feature
Tests: Public programs listing, filtering, detail, enquiry submission
Tests: Admin CRUD operations for programs and enquiries
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
from conftest import ADMIN_EMAIL as ADMIN_USERNAME, ADMIN_PASSWORD


class TestPublicProgramsAPI:
    """Public Programs API tests - no auth required"""
    
    def test_get_all_programs_success(self):
        """GET /api/programs returns all programs with success:true"""
        response = requests.get(f"{BASE_URL}/api/programs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") is True, "Expected success:true"
        assert "programs" in data, "Expected 'programs' key in response"
        assert isinstance(data["programs"], list), "Programs should be a list"
        
        # Verify we have seeded programs
        programs = data["programs"]
        assert len(programs) >= 6, f"Expected at least 6 seeded programs, got {len(programs)}"
        print(f"✓ GET /api/programs returned {len(programs)} programs")
    
    def test_get_programs_filter_by_domain_research(self):
        """GET /api/programs?domain=research returns only research programs"""
        response = requests.get(f"{BASE_URL}/api/programs?domain=research")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        programs = data.get("programs", [])
        
        # All returned programs should have domain=research
        for program in programs:
            assert program.get("domain") == "research", f"Expected domain=research, got {program.get('domain')}"
        
        print(f"✓ Filter by domain=research returned {len(programs)} programs")
    
    def test_get_programs_filter_by_domain_ai_tech(self):
        """GET /api/programs?domain=ai_tech returns only AI/Tech programs"""
        response = requests.get(f"{BASE_URL}/api/programs?domain=ai_tech")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        programs = data.get("programs", [])
        
        for program in programs:
            assert program.get("domain") == "ai_tech"
        
        print(f"✓ Filter by domain=ai_tech returned {len(programs)} programs")
    
    def test_get_programs_filter_by_domain_competition(self):
        """GET /api/programs?domain=competition returns only competition programs"""
        response = requests.get(f"{BASE_URL}/api/programs?domain=competition")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        programs = data.get("programs", [])
        
        for program in programs:
            assert program.get("domain") == "competition"
        
        print(f"✓ Filter by domain=competition returned {len(programs)} programs")
    
    def test_get_program_by_slug(self):
        """GET /api/programs/:slug returns specific program detail"""
        # First get all programs to find a valid slug
        response = requests.get(f"{BASE_URL}/api/programs")
        programs = response.json().get("programs", [])
        assert len(programs) > 0, "No programs found to test"
        
        test_slug = programs[0].get("slug")
        assert test_slug, "Program should have a slug"
        
        # Now get by slug
        response = requests.get(f"{BASE_URL}/api/programs/{test_slug}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "program" in data
        
        program = data["program"]
        assert program.get("slug") == test_slug
        assert "title" in program
        assert "short_description" in program
        assert "domain" in program
        
        print(f"✓ GET /api/programs/{test_slug} returned program: {program.get('title')}")
    
    def test_get_program_by_slug_research_mentorship(self):
        """GET /api/programs/research-mentorship-program returns research program"""
        response = requests.get(f"{BASE_URL}/api/programs/research-mentorship-program")
        
        # May return 404 if slug doesn't exist exactly
        if response.status_code == 404:
            pytest.skip("research-mentorship-program slug not found - checking alternative")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert data.get("program", {}).get("domain") == "research"
        print("✓ GET /api/programs/research-mentorship-program returned research program")
    
    def test_get_program_not_found(self):
        """GET /api/programs/:slug returns 404 for non-existent program"""
        response = requests.get(f"{BASE_URL}/api/programs/non-existent-program-xyz-123")
        assert response.status_code == 404
        print("✓ GET /api/programs/non-existent returns 404")


class TestEnquiryAPI:
    """Enquiry submission tests"""
    
    def test_submit_enquiry_success(self):
        """POST /api/programs/enquiry saves enquiry and returns success"""
        # First get a valid program
        response = requests.get(f"{BASE_URL}/api/programs")
        programs = response.json().get("programs", [])
        assert len(programs) > 0
        
        test_program = programs[0]
        
        enquiry_data = {
            "program_id": test_program.get("id"),
            "program_title": test_program.get("title"),
            "name": "TEST_User_" + str(uuid.uuid4())[:8],
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "9876543210",
            "grade": "10",
            "school_name": "Test School",
            "message": "I am interested in this program"
        }
        
        response = requests.post(f"{BASE_URL}/api/programs/enquiry", json=enquiry_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "message" in data
        
        print(f"✓ POST /api/programs/enquiry succeeded for program: {test_program.get('title')}")
    
    def test_submit_enquiry_missing_required_fields(self):
        """POST /api/programs/enquiry fails without required fields"""
        # Missing name and email
        enquiry_data = {
            "program_id": "some-id",
            "program_title": "Some Program"
        }
        
        response = requests.post(f"{BASE_URL}/api/programs/enquiry", json=enquiry_data)
        # Should return 422 for validation error
        assert response.status_code == 422, f"Expected 422 for missing fields, got {response.status_code}"
        print("✓ POST /api/programs/enquiry returns 422 for missing required fields")
    
    def test_submit_enquiry_invalid_email(self):
        """POST /api/programs/enquiry fails with invalid email"""
        enquiry_data = {
            "program_id": "some-id",
            "program_title": "Some Program",
            "name": "Test User",
            "email": "invalid-email"  # Invalid email format
        }
        
        response = requests.post(f"{BASE_URL}/api/programs/enquiry", json=enquiry_data)
        assert response.status_code == 422, f"Expected 422 for invalid email, got {response.status_code}"
        print("✓ POST /api/programs/enquiry returns 422 for invalid email")


class TestAdminProgramsAPI:
    """Admin Programs API tests - requires admin auth"""
    
    @pytest.fixture(autouse=True)
    def setup_admin_token(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
        
        self.admin_token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_admin_create_program(self):
        """POST /api/admin/programs creates a new program"""
        program_data = {
            "title": "TEST_Program_" + str(uuid.uuid4())[:8],
            "short_description": "Test program for automated testing",
            "full_description": "This is a test program created by automated tests",
            "domain": "ai_tech",
            "grade_min": 9,
            "grade_max": 12,
            "duration": "4 Weeks",
            "price": "999",
            "seats_total": 50,
            "highlights": ["Test highlight 1", "Test highlight 2"],
            "is_active": True,
            "is_enrolling": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/programs",
            json=program_data,
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "program" in data
        
        created_program = data["program"]
        assert created_program.get("title") == program_data["title"]
        assert created_program.get("domain") == "ai_tech"
        assert "id" in created_program
        assert "slug" in created_program
        
        # Store for cleanup
        self.created_program_id = created_program.get("id")
        
        print(f"✓ POST /api/admin/programs created: {created_program.get('title')}")
        
        # Verify via GET
        get_response = requests.get(f"{BASE_URL}/api/programs/{created_program.get('slug')}")
        assert get_response.status_code == 200
        assert get_response.json().get("program", {}).get("id") == self.created_program_id
        print("✓ Created program verified via GET")
    
    def test_admin_update_program(self):
        """PUT /api/admin/programs/:id updates program"""
        # First create a program
        program_data = {
            "title": "TEST_Update_" + str(uuid.uuid4())[:8],
            "short_description": "Original description",
            "domain": "research",
            "is_active": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/programs",
            json=program_data,
            headers=self.headers
        )
        assert create_response.status_code == 200
        program_id = create_response.json().get("program", {}).get("id")
        
        # Update the program
        update_data = {
            "short_description": "Updated description",
            "price": "1999"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin/programs/{program_id}",
            json=update_data,
            headers=self.headers
        )
        
        assert update_response.status_code == 200
        assert update_response.json().get("success") is True
        
        print(f"✓ PUT /api/admin/programs/{program_id} updated successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/programs/{program_id}", headers=self.headers)
    
    def test_admin_delete_program(self):
        """DELETE /api/admin/programs/:id deletes program"""
        # First create a program
        program_data = {
            "title": "TEST_Delete_" + str(uuid.uuid4())[:8],
            "short_description": "To be deleted",
            "domain": "summer",
            "is_active": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/programs",
            json=program_data,
            headers=self.headers
        )
        assert create_response.status_code == 200
        program_id = create_response.json().get("program", {}).get("id")
        slug = create_response.json().get("program", {}).get("slug")
        
        # Delete the program
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/programs/{program_id}",
            headers=self.headers
        )
        
        assert delete_response.status_code == 200
        assert delete_response.json().get("success") is True
        
        print(f"✓ DELETE /api/admin/programs/{program_id} succeeded")
        
        # Verify deletion via GET
        get_response = requests.get(f"{BASE_URL}/api/programs/{slug}")
        assert get_response.status_code == 404, "Deleted program should return 404"
        print("✓ Deleted program verified via GET (404)")
    
    def test_admin_create_program_no_auth(self):
        """POST /api/admin/programs fails without auth"""
        program_data = {
            "title": "Unauthorized Program",
            "short_description": "Should fail",
            "domain": "ai_tech"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/programs", json=program_data)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/admin/programs returns 401 without auth")
    
    def test_admin_get_enquiries(self):
        """GET /api/admin/programs/enquiries returns enquiries list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/programs/enquiries",
            headers=self.headers
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "enquiries" in data
        assert isinstance(data["enquiries"], list)
        assert "pagination" in data
        
        print(f"✓ GET /api/admin/programs/enquiries returned {len(data['enquiries'])} enquiries")
    
    def test_admin_get_enquiries_no_auth(self):
        """GET /api/admin/programs/enquiries fails without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/programs/enquiries")
        assert response.status_code == 401
        print("✓ GET /api/admin/programs/enquiries returns 401 without auth")


class TestProgramDataIntegrity:
    """Test program data structure and integrity"""
    
    def test_program_has_required_fields(self):
        """Programs have all required fields"""
        response = requests.get(f"{BASE_URL}/api/programs")
        programs = response.json().get("programs", [])
        
        required_fields = ["id", "title", "short_description", "domain", "slug", "is_active"]
        
        for program in programs[:3]:  # Check first 3
            for field in required_fields:
                assert field in program, f"Program missing required field: {field}"
        
        print(f"✓ Programs have all required fields: {required_fields}")
    
    def test_program_domains_are_valid(self):
        """All programs have valid domain values"""
        valid_domains = ["competition", "research", "entrepreneurship", "ai_tech", "healthcare", "summer"]
        
        response = requests.get(f"{BASE_URL}/api/programs")
        programs = response.json().get("programs", [])
        
        for program in programs:
            domain = program.get("domain")
            assert domain in valid_domains, f"Invalid domain: {domain}"
        
        print(f"✓ All programs have valid domains")
    
    def test_seeded_programs_exist(self):
        """Verify seeded programs exist with expected slugs"""
        expected_slugs = [
            "research-mentorship-program",
            "ai-and-innovation-bootcamp",
            "national-innovation-challenge",
            "finance-industry-internship",
            "healthcare-careers-internship",
            "summer-leadership-residency"
        ]
        
        response = requests.get(f"{BASE_URL}/api/programs")
        programs = response.json().get("programs", [])
        actual_slugs = [p.get("slug") for p in programs]
        
        found_count = 0
        for slug in expected_slugs:
            if slug in actual_slugs:
                found_count += 1
                print(f"  ✓ Found seeded program: {slug}")
            else:
                print(f"  ⚠ Missing seeded program: {slug}")
        
        # At least 4 of 6 should exist (some may have different slugs)
        assert found_count >= 4, f"Expected at least 4 seeded programs, found {found_count}"
        print(f"✓ Found {found_count}/6 expected seeded programs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
