"""
Shared test configuration — credentials loaded from environment with fallbacks.
All test files should import from here instead of hardcoding secrets.
"""
import os

API_BASE = os.environ.get("TEST_API_BASE", "http://localhost:8001")
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "admin@ceibaa.in")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "SuperAdmin@123")
DEMO_USERNAME = os.environ.get("TEST_DEMO_USERNAME", "demo1")
DEMO_PASSWORD = os.environ.get("TEST_DEMO_PASSWORD", "demo1")
