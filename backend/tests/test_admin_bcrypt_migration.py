"""
Regression tests for the bcrypt migration of /api/admin/auth/login
(Feb 26, 2026).

What this verifies:
1. The canonical password format (bcrypt in `password_hash`) authenticates.
2. The legacy SHA-256 format (in `password` field) STILL authenticates.
3. After a successful legacy login, the doc is auto-upgraded to bcrypt.
4. Bcrypt-stored-under-`password` accidentally also works.
"""
import os
import asyncio
import hashlib
import uuid
import bcrypt
import pytest
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import requests

# Load /app/backend/.env so MONGO_URL/DB_NAME resolve when pytest is invoked
# from outside the supervisor process.
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]


@pytest.fixture
def synth_admin_user():
    """Create a synthetic admin user and clean up after."""
    user_id = f"test-admin-{uuid.uuid4().hex[:8]}"
    email = f"{user_id}@bcrypt-test.local"
    username = user_id
    docs_created = []

    def make(plain: str, store_as: str):
        """store_as: 'bcrypt_hash' | 'legacy_sha' | 'bcrypt_in_password'"""
        password_hash = None
        password = None
        if store_as == "bcrypt_hash":
            password_hash = bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()
        elif store_as == "legacy_sha":
            password = hashlib.sha256(plain.encode()).hexdigest()
        elif store_as == "bcrypt_in_password":
            password = bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

        doc = {
            "id": user_id,
            "user_id": user_id,
            "username": username,
            "email": email,
            "name": "Test Admin",
            "role": "admin",
            "is_admin": True,
        }
        if password_hash:
            doc["password_hash"] = password_hash
        if password:
            doc["password"] = password
        docs_created.append(doc)
        return doc

    yield {"id": user_id, "email": email, "username": username, "make": make}

    # Cleanup
    async def _cleanup():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        await db.users.delete_many({"id": user_id})
        await db.admin_sessions.delete_many({"user_id": user_id})
        await db.admin_login_logs.delete_many({"user_id": user_id})
        client.close()
    asyncio.run(_cleanup())


def _insert(doc):
    async def _do():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        await db.users.insert_one(dict(doc))  # copy so _id stays out of caller
        client.close()
    asyncio.run(_do())


def _read_password_fields(user_id):
    async def _do():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        u = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 1, "password_hash": 1})
        client.close()
        return u or {}
    return asyncio.run(_do())


class TestAdminLoginPasswordFormats:

    def test_login_with_bcrypt_password_hash(self, synth_admin_user):
        plain = "BcryptCanonical@123"
        _insert(synth_admin_user["make"](plain, "bcrypt_hash"))

        r = requests.post(f"{BASE_URL}/api/admin/auth/login",
                          json={"username": synth_admin_user["email"], "password": plain})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        body = r.json()
        assert body.get("success") is True
        assert "token" in body

    def test_login_with_legacy_sha256_auto_upgrades(self, synth_admin_user):
        plain = "LegacySHA@123"
        doc = synth_admin_user["make"](plain, "legacy_sha")
        _insert(doc)

        # Verify the test doc was stored as SHA-256, not bcrypt
        before = _read_password_fields(synth_admin_user["id"])
        assert "password" in before and not before.get("password_hash"), \
            f"Setup error: expected legacy SHA, got {before}"

        # Login with the legacy doc — should succeed AND trigger auto-upgrade
        r = requests.post(f"{BASE_URL}/api/admin/auth/login",
                          json={"username": synth_admin_user["email"], "password": plain})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

        # Verify doc has been upgraded: password_hash is bcrypt, legacy password field gone
        after = _read_password_fields(synth_admin_user["id"])
        assert after.get("password_hash", "").startswith("$2"), \
            f"Doc not upgraded to bcrypt: {after}"
        assert "password" not in after or not after.get("password"), \
            f"Legacy password field not cleared: {after}"

        # Subsequent login with the SAME plaintext should still work (via the new bcrypt hash)
        r2 = requests.post(f"{BASE_URL}/api/admin/auth/login",
                           json={"username": synth_admin_user["email"], "password": plain})
        assert r2.status_code == 200, f"Re-login after upgrade failed: {r2.status_code}: {r2.text}"

    def test_login_with_wrong_password_returns_401(self, synth_admin_user):
        plain = "Correct@123"
        _insert(synth_admin_user["make"](plain, "bcrypt_hash"))
        r = requests.post(f"{BASE_URL}/api/admin/auth/login",
                          json={"username": synth_admin_user["email"], "password": "WrongPass@456"})
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"
