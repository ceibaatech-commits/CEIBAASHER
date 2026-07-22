"""
Backend tests for iteration 34:
- Resume Builder endpoints (GET/PUT /api/recruitment/resume/me, GET /api/recruitment/resume/user/{user_id})
- CBSE Part 1: chapter-tests /chapters regex for "Class 11 (Science)" variants
- CBSE Part 2: /api/admin/class-chapters/import-default
- CBSE Part 3: /available-sources, /preview-source, /copy-from-board
- Regression: /api/programs still 200

Cleanup: test CBSE Physics chapter and copied HBSE Class 10 Science chapters are removed.
"""
import os
import uuid
import pytest
import requests
from pathlib import Path

# Load /app/frontend/.env for REACT_APP_BACKEND_URL if not set
if "REACT_APP_BACKEND_URL" not in os.environ:
    env_path = Path("/app/frontend/.env")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                os.environ["REACT_APP_BACKEND_URL"] = line.split("=", 1)[1].strip().strip('"')

if "MONGO_URL" not in os.environ or "DB_NAME" not in os.environ:
    env_path = Path("/app/backend/.env")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"'))

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

DEMO_USER = {"username": "demo1", "password": "demo1"}
RECRUITER = {"email": "hr@tcs.com", "password": "tcs123"}


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def student_session():
    """Return a requests.Session logged in as demo1 via cookie auth."""
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/demo-login", json=DEMO_USER, timeout=15)
    assert r.status_code == 200, f"demo-login failed: {r.status_code} {r.text}"
    body = r.json()
    s.headers.update({"Content-Type": "application/json"})
    s._user_id = body["user"]["id"]  # type: ignore[attr-defined]
    s._access_token = body["access_token"]  # type: ignore[attr-defined]
    return s


@pytest.fixture(scope="module")
def recruiter_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/recruitment/recruiter/login", json=RECRUITER, timeout=15)
    assert r.status_code == 200, f"recruiter login failed: {r.status_code} {r.text}"
    body = r.json()
    s._recruiter = body["recruiter"]  # type: ignore[attr-defined]
    s._access_token = body["access_token"]  # type: ignore[attr-defined]
    s.headers.update({"Content-Type": "application/json"})
    return s


# ============================================================
# RESUME BACKEND TESTS
# ============================================================
class TestResumeMe:
    def test_get_resume_me_unauth_401(self):
        r = requests.get(f"{BASE_URL}/api/recruitment/resume/me", timeout=10)
        assert r.status_code == 401, f"expected 401, got {r.status_code}"

    def test_get_resume_me_authed_returns_structure(self, student_session):
        r = student_session.get(f"{BASE_URL}/api/recruitment/resume/me", timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        # Required top-level keys
        for key in ["basics", "education", "experience", "projects", "skills",
                    "certifications", "publications", "awards", "meta"]:
            assert key in data, f"missing key: {key}"
        assert isinstance(data["basics"], dict)
        assert isinstance(data["education"], list)
        assert isinstance(data["experience"], list)
        assert data["meta"]["user_id"] == student_session._user_id

    def test_put_and_get_resume_persistence(self, student_session):
        payload = {
            "basics": {
                "name": "TEST Resume User",
                "headline": "TEST Aspiring SDE",
                "bio": "TEST bio",
                "location": "TEST City",
                "email": "test.resume@example.com",
                "phone": "+91-9999999999",
                "avatar_url": "",
                "website": "https://example.com",
                "linkedin": "",
                "github": "",
            },
            "education": [{
                "institution": "TEST University",
                "degree": "B.Tech",
                "field": "CSE",
                "start_year": "2020",
                "end_year": "2024",
                "grade": "9.1",
                "description": "TEST notes",
            }],
            "experience": [{
                "company": "TEST Company",
                "role": "Intern",
                "location": "Remote",
                "start": "Jun 2023",
                "end": "Aug 2023",
                "current": False,
                "description": "TEST exp",
            }],
            "projects": [],
            "skills": [{"category": "Programming", "items": ["Python", "React"]}],
            "certifications": [],
            "publications": [],
            "awards": [],
        }
        put_resp = student_session.put(
            f"{BASE_URL}/api/recruitment/resume/me", json=payload, timeout=10
        )
        assert put_resp.status_code == 200, put_resp.text
        put_body = put_resp.json()
        assert put_body["basics"]["headline"] == "TEST Aspiring SDE"
        assert len(put_body["education"]) == 1
        assert put_body["education"][0]["institution"] == "TEST University"
        assert put_body["skills"][0]["items"] == ["Python", "React"]

        # GET again to verify persistence
        get_resp = student_session.get(f"{BASE_URL}/api/recruitment/resume/me", timeout=10)
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["basics"]["headline"] == "TEST Aspiring SDE"
        assert data["basics"]["name"] == "TEST Resume User"
        assert len(data["experience"]) == 1
        assert data["experience"][0]["company"] == "TEST Company"


class TestResumeRecruiterAccess:
    def test_recruiter_forbidden_for_non_applicant(self, recruiter_session, student_session):
        """Student who hasn't applied to this recruiter's post -> 403."""
        # Clean up any existing application to be safe
        from pymongo import MongoClient
        mongo = MongoClient(os.environ["MONGO_URL"])
        db = mongo[os.environ["DB_NAME"]]
        db.recruitment_applications.delete_many({
            "user_id": student_session._user_id,
            "company_id": recruiter_session._recruiter["id"],
        })
        mongo.close()

        r = recruiter_session.get(
            f"{BASE_URL}/api/recruitment/resume/user/{student_session._user_id}",
            timeout=10,
        )
        assert r.status_code == 403, f"expected 403, got {r.status_code} - {r.text}"

    def test_recruiter_gets_resume_after_application(self, recruiter_session, student_session):
        """Insert a fake application; recruiter should now see the candidate's resume."""
        from pymongo import MongoClient
        from datetime import datetime, timezone
        mongo = MongoClient(os.environ["MONGO_URL"])
        db = mongo[os.environ["DB_NAME"]]
        app_id = f"TEST_APP_{uuid.uuid4()}"
        app_doc = {
            "id": app_id,
            "post_id": f"TEST_POST_{uuid.uuid4()}",
            "user_id": student_session._user_id,
            "company_id": recruiter_session._recruiter["id"],
            "status": "applied",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        db.recruitment_applications.insert_one(app_doc)
        try:
            r = recruiter_session.get(
                f"{BASE_URL}/api/recruitment/resume/user/{student_session._user_id}",
                timeout=10,
            )
            assert r.status_code == 200, f"expected 200, got {r.status_code} - {r.text}"
            data = r.json()
            assert "basics" in data and "experience" in data
            # meta.user_id should refer to the candidate
            assert data["meta"]["user_id"] == student_session._user_id
        finally:
            db.recruitment_applications.delete_one({"id": app_id})
            mongo.close()


# ============================================================
# CBSE PART 1: chapters regex for "Class 11 (Science)"
# ============================================================
class TestCBSEPart1ChaptersRegex:
    def test_chapters_matches_class_variant(self):
        """Insert admin-style doc class_name='Class 11 (Science)' and verify
        /chapter-tests/chapters?class_param=class-11 picks it up."""
        from pymongo import MongoClient
        from datetime import datetime
        mongo = MongoClient(os.environ["MONGO_URL"])
        db = mongo[os.environ["DB_NAME"]]
        doc = {
            "id": f"TEST_CH_{uuid.uuid4()}",
            "board": "cbse",
            "class_name": "Class 11 (Science)",
            "subject": "Physics",
            "chapter_number": 999,
            "chapter_name": "TEST CBSE Ch 1 Regex",
            "total_questions": 50,
            "difficulty": "Medium",
            "duration": 35,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        db.class_chapters.insert_one(doc)
        try:
            r = requests.get(
                f"{BASE_URL}/api/chapter-tests/chapters",
                params={"class_param": "class-11", "subject": "Physics", "board": "cbse"},
                timeout=10,
            )
            assert r.status_code == 200, r.text
            body = r.json()
            assert body.get("success") is True
            names = [c["chapter_name"] for c in body.get("chapters", [])]
            assert "TEST CBSE Ch 1 Regex" in names, f"regex didn't match; got {names[:5]}"
        finally:
            db.class_chapters.delete_one({"id": doc["id"]})
            mongo.close()


# ============================================================
# CBSE PART 2: /import-default
# ============================================================
class TestCBSEPart2ImportDefault:
    def test_import_default_success(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/class-chapters/import-default", timeout=60
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        assert body.get("imported_count", 0) > 0, body


# ============================================================
# CBSE PART 3: Copy from Board
# ============================================================
class TestCBSEPart3CopyFromBoard:
    def test_available_sources(self):
        r = requests.get(
            f"{BASE_URL}/api/admin/class-chapters/available-sources",
            params={"class_name": "Class 10", "subject": "Science"},
            timeout=10,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        boards = body.get("boards", [])
        counts = body.get("chapters_count", {})
        assert "cbse" in boards, f"cbse missing from boards={boards}"
        assert "rbse" in boards, f"rbse missing from boards={boards}"
        assert counts.get("cbse", 0) > 0
        assert counts.get("rbse", 0) > 0

    def test_preview_source_cbse(self):
        r = requests.get(
            f"{BASE_URL}/api/admin/class-chapters/preview-source",
            params={"board": "cbse", "class_name": "Class 10", "subject": "Science"},
            timeout=10,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        assert body.get("count", 0) >= 10, f"expected >=10 chapters, got {body.get('count')}"
        assert isinstance(body.get("chapters"), list)

    def test_copy_from_board_and_verify(self):
        from pymongo import MongoClient
        mongo = MongoClient(os.environ["MONGO_URL"])
        db = mongo[os.environ["DB_NAME"]]
        # Pre-clean
        db.class_chapters.delete_many({
            "board": "hbse", "class_name": "Class 10", "subject": "Science"
        })
        try:
            r = requests.post(
                f"{BASE_URL}/api/admin/class-chapters/copy-from-board",
                json={
                    "source_board": "cbse",
                    "target_board": "hbse",
                    "class_name": "Class 10",
                    "subject": "Science",
                },
                timeout=15,
            )
            assert r.status_code == 200, r.text
            body = r.json()
            assert body.get("success") is True
            assert body.get("count", 0) > 0

            # Verify DB has hbse chapters
            found = db.class_chapters.count_documents({
                "board": "hbse", "class_name": "Class 10", "subject": "Science"
            })
            assert found == body["count"], f"db {found} != response {body['count']}"

            # Same source/target -> 400
            r2 = requests.post(
                f"{BASE_URL}/api/admin/class-chapters/copy-from-board",
                json={
                    "source_board": "cbse",
                    "target_board": "cbse",
                    "class_name": "Class 10",
                    "subject": "Science",
                },
                timeout=10,
            )
            assert r2.status_code == 400, f"expected 400, got {r2.status_code} - {r2.text}"
        finally:
            db.class_chapters.delete_many({
                "board": "hbse", "class_name": "Class 10", "subject": "Science"
            })
            mongo.close()


# ============================================================
# REGRESSION: /api/programs still 200
# ============================================================
class TestProgramsRegression:
    def test_programs_list(self):
        r = requests.get(f"{BASE_URL}/api/programs", timeout=10)
        assert r.status_code == 200, r.text
        body = r.json()
        # Accept either list or dict with programs
        if isinstance(body, dict):
            assert "programs" in body or "items" in body or "data" in body or body
        else:
            assert isinstance(body, list)
