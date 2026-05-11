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

## Ceibaa Admin Portal (`/admin/auth/login` — bcrypt as of Feb 26, 2026)
- Email/Username: `admin@ceibaa.in` (or `superadmin`)
- Password: `SuperAdmin@123`
- **Fixed Feb 26, 2026:** the endpoint was previously broken (SHA-256 / bcrypt mismatch). It now uses bcrypt aligned with `/api/auth/login`. Legacy SHA-256 docs are auto-upgraded to bcrypt on first successful login (silent, best-effort).
- On success: sets httpOnly `ceibaa_admin_token` cookie (24h) + returns token in JSON.
- Cookie auth verified end-to-end. Frontend `localStorage.ceibaa_admin_user` stores only the non-sensitive user blob for instant UI hydration.

## Employee Portal (`/api/employee/login` — cookie-based)
- Cookie: `ceibaa_employee_token` (httpOnly+secure+lax, 24h).
- Frontend `localStorage.employee_data` stores only the non-sensitive employee profile blob.
- No seeded employee in this environment — insert via `db.employees`.

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
