# Test Credentials

## Demo Student (username + password)
- Username: `demo1`
- Password: `demo1`
- API: `POST /api/auth/demo-login`

## Ceibaa Admin (JWT + cookie)
- Email: `admin@ceibaa.in`
- Password: `SuperAdmin@123`
- API: `POST /api/auth/login` (remember-me supported via `{remember: true}`)
- Note: password is stored as a bcrypt hash (re-seeded 2026-02 — previously SHA-256 hex caused a 500 bug).

## Recruitment Admin (Stage 3 migrated — cookie based)
- API: `POST /api/recruitment-admin/login`
- On success: sets httpOnly `session_token` cookie. Frontend then stores
  non-sensitive `admin_recruitment_session=1` flag in localStorage as UI gate.
- **NOT seeded** in this environment. To test, insert a record into `db.ceibaa_admins`
  with `email`, `name`, and `password_hash` (bcrypt of the password).

## Recruiter
- API: `POST /api/recruitment/recruiter/login`
- Also sets `session_token` cookie on success.
- **NOT seeded**. Insert into `db.recruiters` to test.

## Notes for testing agent
- **Auth is cookie-first, Bearer-fallback** across all helpers (`utils/auth_helpers`, `auth_routes`, `social_feed_routes`, `account_security_routes`, `recruitment_admin_routes`, `profile_routes`).
- `axios.defaults.withCredentials = true` is set globally in `/app/frontend/src/index.js`.
- No JS-readable `localStorage` entry stores a raw JWT anymore. If you see one, it's a regression.
- Login form has a "Stay signed in for 30 days" checkbox (`data-testid="stay-signed-in-checkbox"`). When checked, cookie `max_age` is 30 days instead of the default.
- Pytest suite: `/app/backend/tests/test_stage3_auth_regression.py` (16/18 pass, 2 skip for unseeded recruitment-admin/recruiter).
