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

## Recruitment Admin (Stage 3 migrated — cookie based) — SEEDED & VERIFIED Feb 26, 2026
- Email: `admin@ceibaa.in`
- Password: `admin123`
- API: `POST /api/recruitment-admin/login`
- On success: sets httpOnly `session_token` cookie (7-day TTL). Frontend then stores
  non-sensitive `admin_recruitment_session=1` flag in localStorage as UI gate.
- Seed file: `/app/backend/recruitment_seed.py` (auto-runs on startup if `db.recruiters` is empty).
- DB record: `db.ceibaa_admins.findOne({email: "admin@ceibaa.in"})` — bcrypt hash in `password_hash`.

## Recruiter (seeded — verified Feb 26, 2026)
- Email: `hr@tcs.com` / Password: `tcs123` (TCS)
- Other recruiters: `hr@infosys.com / infosys123`, `hr@google.com / google123`, `hr@flipkart.com / flipkart123`, `hr@razorpay.com / razorpay123`
- API: `POST /api/recruitment/recruiter/login`
- Sets `session_token` cookie on success.
- DB: `db.recruiters` (5 seeded companies, all bcrypt).

## Recruitment Sample Student
- Email: `arjun@ceibaa.in` / Password: `student123`
- 8 sample students seeded with AIR ranks (`db.users` with `air_rank` field).

## Notes for testing agent
- **Auth is cookie-first, Bearer-fallback** across all helpers (`utils/auth_helpers`, `auth_routes`, `social_feed_routes`, `account_security_routes`, `recruitment_admin_routes`, `profile_routes`).
- `axios.defaults.withCredentials = true` is set globally in `/app/frontend/src/index.js`.
- No JS-readable `localStorage` entry stores a raw JWT anymore. If you see one, it's a regression.
- Login form has a "Stay signed in for 30 days" checkbox (`data-testid="stay-signed-in-checkbox"`). When checked, cookie `max_age` is 30 days instead of the default.
- Pytest suite: `/app/backend/tests/test_stage3_auth_regression.py` (16/18 pass, 2 skip for unseeded recruitment-admin/recruiter).
