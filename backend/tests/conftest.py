"""
Shared test configuration — credentials loaded from environment with fallbacks.
All test files should import from here instead of hardcoding secrets.
"""
import os

API_BASE = os.environ.get("TEST_API_BASE", "http://localhost:8001")

# Admin credentials
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "admin@ceibaa.in")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "SuperAdmin@123")

# Recruitment admin credentials (legacy admin portal)
RECRUITMENT_ADMIN_EMAIL = os.environ.get("TEST_RECRUITMENT_ADMIN_EMAIL", "admin@ceibaa.in")
RECRUITMENT_ADMIN_PASSWORD = os.environ.get("TEST_RECRUITMENT_ADMIN_PASSWORD", "admin123")

# Primary demo student
DEMO_USERNAME = os.environ.get("TEST_DEMO_USERNAME", "demo1")
DEMO_PASSWORD = os.environ.get("TEST_DEMO_PASSWORD", "demo1")

# Secondary demo student (for messaging / 2-user scenarios)
DEMO3_USERNAME = os.environ.get("TEST_DEMO3_USERNAME", "demo3")
DEMO3_PASSWORD = os.environ.get("TEST_DEMO3_PASSWORD", "demo3")

# Bug-test user (used across referral / post interaction tests)
TEST_USER_USERNAME = os.environ.get("TEST_USER_USERNAME", "testbug")
TEST_USER_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "test1234")

# Recruiter credentials
RECRUITER_EMAIL = os.environ.get("TEST_RECRUITER_EMAIL", "tcs@example.com")
RECRUITER_PASSWORD = os.environ.get("TEST_RECRUITER_PASSWORD", "tcs123")
