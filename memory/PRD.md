# Ceibaa - Educational Platform PRD

## Original Problem Statement
Build and enhance the "Ceibaa" educational platform — a full-stack app (React, FastAPI, MongoDB, Socket.IO) featuring AI tutors, live 1v1 battles, career programs, social feeds (Victory Lane), WebRTC video chat, real-time messaging, and a Recruitment & Internship Portal.

## Code Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor) + Socket.IO
- **Auth**: JWT + Emergent Google Auth + Demo Login
- **Media**: Cloudinary for image/document uploads
- **Real-time**: Socket.IO for battles, social feed, and messaging
- **Video**: Agora RTC for 1v1 battle video calls

### Backend Structure (Refactored Feb 2026)
```
backend/
├── server.py                    # FastAPI app + route registration
├── database.py                  # Centralized MongoDB connection
├── recruitment_routes.py        # Thin aggregator (imports sub-routers)
├── recruitment/
│   ├── core_routes.py           # Auth, companies, feed, applications, posts CRUD (319 lines)
│   ├── social_routes.py         # Likes, comments, bookmarks, shares (134 lines)
│   ├── quiz_routes.py           # Quiz engine, leaderboard, auto-shortlist (91 lines)
│   └── bulk_routes.py           # Resume upload, CSV export, bulk actions, email (117 lines)
├── recruitment_admin_routes.py  # Admin panel, company verification, document management
├── models/
│   └── recruitment_models.py    # Shared Pydantic models (100 lines)
├── utils/
│   ├── auth_helpers.py          # JWT auth helpers (54 lines)
│   └── email_service.py         # Resend email utility (23 lines)
├── auth_routes.py               # Main auth (JWT, demo, Google)
├── battle_socketio.py           # Battle socket events + VC events
├── matchmaking.py               # Exam-level matchmaking
└── tests/
```

### Frontend Extracted Components
```
components/
├── FeedCard.js                  # Reusable post card with social actions (96 lines)
├── CommentModal.js              # Threaded comment modal with reply/like (120 lines)
└── BattleVideoChat.js           # Agora video overlay
```

## What's Been Implemented

### Authentication & User Management
- JWT-based auth with demo login (demo1/demo2/demo3)
- Emergent-managed Google Auth
- Admin panel (admin@ceibaa.in / SuperAdmin@123)
- Profile system with followers, following, stats, close friends, blocking

### Profile Features
- Edit Profile modal (Name, Bio, Location, Website + Photo uploads)
- Profile picture upload via Cloudinary (400x400 face crop)
- Cover photo upload via Cloudinary (1500x500 fill)
- Inline click-to-upload on avatar and cover photo (own profile only)
- Block user for both followed and non-followed users
- Saved posts tab fetches from /api/social/bookmarks

### Victory Lane (Social Feed)
- Post creation (text, image, video, quiz rooms)
- Like, share, bookmark, comment actions
- Bookmark persistence to backend API
- Reposts preserve full media/metadata from original post

### Messaging System
- REST API at `/api/messages/*` + Socket.IO at `/api/messagews`
- 1-on-1 conversations, text messages, unread counts, real-time delivery

### 1v1 Battles & WebRTC
- ZegoCloud Prebuilt SDK for 1v1 video calls
- Battle quiz with live chat, matchmaking via Socket.io

### Recruitment & Internship Portal (Feb 2026)
- **3 Roles**: Student (uses existing Ceibaa auth), Recruiter (separate login), Admin (separate login)
- **4 Post Types**: Job/Internship, MCQ Quiz, Hackathon, Event
- **13 Frontend Pages**: JobsFeed, DiscoverCompanies, CompanyChannel, RecruiterLogin, RecruiterDashboard, RecruiterAnalytics, CreatePost, ManageApplicants, ApplyJob, QuizAttempt, HackathonDetail, MyApplications, RecruitmentCell (Admin)
- **Backend**: recruitment_routes.py (23 endpoints), recruitment_admin_routes.py (8 endpoints)
- **Seed Data**: 5 companies, 8 students with AIR ranks, 6 sample posts, 1 admin
- **Key Features**: Company follow, post moderation queue, AIR rank filtering, quiz engine integration, hackathon registration, event RSVP, recruiter analytics

## Key API Endpoints
- `/api/auth/demo-login` — Demo login
- `/api/social/feed/*` — Victory Lane feeds
- `/api/profile/update` — Update profile
- `/api/messages/conversations` — Messaging
- `/api/recruitment/recruiter/login` — Recruiter login
- `/api/recruitment-admin/login` — Recruitment admin login
- `/api/recruitment/companies` — List companies
- `/api/recruitment/feed` — Recruitment feed
- `/api/recruitment/posts` — Create post (recruiter)
- `/api/recruitment/apply/{post_id}` — Apply to job (student)
- `/api/recruitment/quiz/{quiz_id}/start` — Start quiz
- `/api/recruitment/hackathon/{id}/register` — Register hackathon
- `/api/recruitment/analytics` — Recruiter analytics
- `/api/recruitment-admin/recruiters` — Manage recruiters
- `/api/recruitment-admin/pending-posts` — Moderation queue

## Prioritized Backlog

### P0 (Next)
- [x] Email service for credential delivery & event reminders (Resend — sandbox mode, needs domain verification for production)

### P1
- [x] Resume upload feature (Cloudinary, PDF/DOC/DOCX, 5MB limit)
- [x] Bulk applicant actions (shortlist by AIR rank, bulk status change)
- [x] CSV export of applicants
- [x] Quiz leaderboard auto-shortlist feature
- [ ] Program enrollment/payment flow (Stripe)
- [x] Comments/reply system on posts (threaded, with likes)
- [x] Admin company verification panel (GST/PAN/CIN edit, document upload to Cloudinary, email verification)

### P2
- [ ] Real-time notifications on application status change
- [ ] Follow Button UI visual verification
- [ ] Google Search Console integration
- [ ] Profile badges, Alumni tags
- [ ] Export test history to CSV/PDF
- [ ] ExamSheetManager.js further decomposition (1733 lines)

### Recently Completed (Feb 2026)
- [x] Recruitment & Internship Portal — Full integration (16 files, all tested 100%)
- [x] Student auth integration with recruitment module (uses existing Ceibaa JWT)
- [x] Recruitment seed data on backend startup
- [x] Header nav: "Canopy" renamed to "The Headhunt" → links to /jobs
- [x] /jobs and /discover pages redesigned with Header, Footer, light theme matching Courses page
- [x] All recruitment student pages (/my-applications, /company/:slug, /apply/:jobId, /hackathon/:hackId, /quiz-recruit/:quizId) updated with Header, Footer, and light theme
- [x] Social actions on recruitment feed (Like, Comment, Share, Bookmark) with backend APIs
- [x] Saved posts tab in /my-applications
- [x] Brute force protection on admin/recruiter login (5 attempts → 15min lockout)
- [x] Google OAuth fix — useRef guard for StrictMode, hash+query param session_id extraction
- [x] Emergent Auth JWT issuance alongside session_token
- [x] Agora RTC token generation endpoint (GET /api/agora/token)
- [x] 1v1 Battle page complete redesign — cream/pink/red/blue color scheme, mobile+desktop layouts
- [x] Video call flow: manual start via socket vc_request/vc_accepted/vc_declined/vc_ended
- [x] Answer cards: red highlight for self, blue for opponent
- [x] Battle results redesign: Victory/Lost/Draw with color-coded score cards
- [x] Matchmaking already matches by exam only (cross-topic within same exam)

### Earlier Completed
- [x] 1v1 Battle Setup Page layout fix
- [x] ZegoCloud SDK integration for video battles
- [x] Chapter Tests page redesign with Neo-Brutalist UI
- [x] Backend Code Quality fixes (socket_proxy, secrets, circular deps)
- [x] Component decomposition (Board.js, ExamSheetManager.js)
- [x] Messaging system

### Feb 20, 2026 — Code Quality P0 Cleanup
- [x] Fixed `chapter_test_routes.py` F821 crash (restored `random.sample` as `secrets.SystemRandom().sample()`)
- [x] Extended `tests/conftest.py` with env-backed constants: `RECRUITMENT_ADMIN_*`, `DEMO3_*`, `TEST_USER_*`, `RECRUITER_*`
- [x] Removed all hardcoded credentials from 6 test files: `test_referral_system.py`, `test_recruitment.py`, `test_post_interactions.py`, `test_new_recruitment_features.py`, `test_messaging.py`, `test_media_permissions.py`
- [x] All 99 tests in the refactored files collect cleanly; 60/63 sanity-run tests still pass (3 pre-existing seed-count failures unrelated to refactor)



### Feb 20, 2026 — Code Review Round A + B Fixes
- [x] **Round A — Hygiene fixes:**
  - Final hardcoded-secret cleanup in `test_follow_notification.py` (now imports from conftest)
  - Fixed array-index React keys in `RRB_NTPC.js` (3), `QuizRoom.js` (1), `PublicProfile.js` (2), `ProgramDetail.js` (4)
  - Removed stale `// eslint-disable-next-line` in `VictoryLane.js` (false-positive dep list)
  - Extracted nested ternaries into named helpers in `QuizRoom.js` (rank/option class helpers), `SoloPractice.js` (reviewOptionBorder/Badge/Text, quizOptionBorder/Badge), `PublicProfile.js` (privacy IIFE)
- [x] **Round B — Backend complexity refactor (auth_routes.py + admin_routes.py):**
  - `get_current_user` (was 97 lines / CC 16) → split into `_extract_token`, `_session_expired`, `_user_by_id`, `_resolve_emergent_session`, `_resolve_jwt` helpers
  - `demo_login` (was 132 lines / CC 11) → extracted `_build_demo_user`, `_demo_users`, `_upsert_demo_user`, `_issue_jwt`
  - `signup` (was 86 lines / CC 12) → extracted `_validate_signup_payload`, `_new_user_doc`, `_process_referral_safe`, `_public_user_response`
  - `get_current_user_media_permissions` (was 91 lines / CC 18) → extracted `_media_disabled_response`, `_resolve_user_id_from_auth`, `_user_media_permissions`
  - `create_sheet` (was 129 lines) → extracted `_build_sheet_data`, `_build_question_doc`, `_import_sheet_questions`, `_exam_fields`, `_class_fields`
- [x] All 15 regression tests pass (iteration_28.json) — demo_login, signup, /auth/me, /user/media-permissions, /api/chapter-tests/start-test, recruitment & messaging smoke — no regressions

### Deferred (explicit user decision required)
- [ ] **Round C — localStorage → httpOnly cookies auth migration** (breaks all sessions, needs CSRF plumbing, CORS credentials changes)
- [ ] **Oversized component decomposition**: ExamSheetManager.js (1720), ExamCategoryManager.js (997), LiveBattlesManager.js (736), UserManagement.js (684), Board.js (872)

### Feb 20, 2026 — Round C (dual-mode cookie auth) + UserManagement decomposition
- [x] **Round C — Dual-mode auth (backwards compatible, no sessions invalidated):**
  - Added `_set_auth_cookie(response, token)` helper in `auth_routes.py` (httpOnly, Secure, SameSite=Lax, 7d max-age)
  - `/api/auth/demo-login`, `/api/auth/signup`, `/api/auth/login` now set the session_token cookie AND still return `access_token` in JSON (legacy Bearer still works everywhere)
  - `/api/auth/logout` already clears cookie; updated samesite to `lax` for consistency
  - Frontend `src/index.js` enables `axios.defaults.withCredentials = true` so the cookie travels on every request
  - Verified: login sets `Set-Cookie: session_token=...; HttpOnly; Secure; SameSite=Lax`; `/auth/me` works with cookie-only AND Bearer-only requests; localStorage token still populated for backwards-compat
- [x] **UserManagement.js decomposition** (698 lines → 79-line orchestrator + 6 focused files in `/components/admin/user-management/`):
  - `useUserManagement.js` (128 lines) — custom hook: fetch, stats, filter/sort/pagination state, `toggleBadge` with mutual-exclusion (Teacher⇄Professor)
  - `UserStatsCards.js` (33 lines) — 4 stat cards with shared `StatCard` subcomponent
  - `UserFiltersBar.js` (77 lines) — search + status filter + sort + export + refresh
  - `UserRow.js` (117 lines) — single user row with `StatusPill` and `BadgeButton` subcomponents
  - `UserTable.js` (38 lines) — table header + empty state + row iteration
  - `UserPagination.js` (124 lines) — First/Prev/numbers/Next/Last + Go-to input
  - Live smoke test: admin login → /admin/dashboard → User Management → all testids present, 94 users render, stats/filters/badges visible identical to pre-refactor
- [x] 33/33 backend regression tests pass (follow_notification, post_interactions, media_permissions)

### Deferred (explicit future work)
- [ ] Full localStorage→httpOnly cookie cutover (remove all `localStorage.getItem('token')` reads, add CSRF — Round C-hard)
- [ ] Decompose remaining oversized components: `ExamSheetManager.js` (1720), `ExamCategoryManager.js` (997), `LiveBattlesManager.js` (736), `Board.js` (872)


### Feb 20, 2026 — 2nd Code-Review Sweep (Round A + B + C — option c)
- [x] **Round A — Mechanical fixes:**
  - Removed orphaned dead code in `social_feed_routes.py:2305-2328` (resolved 4×F821 `topic`/`limit` undefined-name errors)
  - `test_admin_auth.py` — fixed `ADMIN_USERNAME` undefined; now imports from conftest
  - Array-index keys removed in 10 files: `SheetManager.js`, `RoomDetail.js` (×2), `QuizResults.js`, `QuizAttempt.js` (×2), `ProgramDetail.js` (×3), `utils/renderMath.js`
  - Empty catch blocks fixed in `Profile.js`, `MyApplications.js`, `Messages.js` — now log errors (with `AbortError` ignore for native share dismiss)
  - useMemo optimizations: `CommentsSection.js` (precomputed top-level + replies-by-parent map — fixes O(n²) filter), `ExamCategoryManager.js` (filteredCbseChapters, categoriesForSelectedExam), `LiveBattlesManager.js` (filteredReports)
- [x] **Round B — Backend complexity refactor (7 functions):**
  - `submit_answers` (battle_async_routes.py) → `_build_submission_doc`, `_build_dashboard_doc`, `_save_dashboard_record`, `_ranked_leaderboard`, `_broadcast_leaderboard`
  - `join_async_room` → `_validate_join_request`, `_register_participant`, `_broadcast_player_joined`, `_public_room`
  - `admin_login` (admin_auth_routes.py) → `_client_ip`, `_find_admin_user`, `_log_admin_login_attempt`, `_create_admin_session`, `_admin_user_response`
  - `create_demo_users` (auth_routes.py) — declarative spec list + `_make` builder (88 → 35 LOC)
  - `import_sheet_questions` (admin_routes.py) → `_question_doc_from_sheet_dict` helper
  - `join_room` (battle_rooms.py) → `_load_room_from_db`, `_mark_room_expired`
  - `add_indexes.py` — declarative `INDEX_SPECS` dict + single iteration loop (130 LOC, much lower complexity per function)
- [x] **Round C — Component decomposition (#2): `LiveBattlesManager.js` (755 → 84-line orchestrator + 9 sub-files) in `/components/admin/live-battles/`:**
  - `useLiveBattles.js` (165) — fetches, socket, actions, filters
  - `StatusBadge.js` (26) — shared status pill with config map
  - `LiveBattlesStats.js` (26), `LiveBattlesTabs.js` (35)
  - `LiveBattlesList.js` (75), `ReportsList.js` (61), `BattleHistoryTable.js` (50)
  - `ReportDetailModal.js` (69), `BattleDetailModal.js` (60)
  - Smoke-tested live: 91 active battles, 5 reports rendering, all tabs working, zero console errors
- [x] **Testing:** 39/39 backend regression tests pass (iteration_29.json) — auth + admin + battle flows + recruitment all intact

### Deferred (still open)
- [ ] Hard cutover of localStorage → cookie (remove all `localStorage.getItem('token')` reads, add CSRF)
- [ ] Decompose remaining oversized components: `ExamSheetManager.js` (1720), `ExamCategoryManager.js` (997), `Board.js` (872), `AFCAT.js` (672), `EmployeeManager.js` (518), `QuizRoomModal.js` (569)
- [ ] Remove the bulk of 293 production console.log statements
- [ ] "5 high-severity security issues" — need user to share specifics


### Feb 20, 2026 — Password Reset + Phone OTP (post-login gate)
- [x] **Backend: `/app/backend/account_security_routes.py`** (new module, ~260 LOC)
  - `POST /api/auth/forgot-password` — generates cryptographically-secure 64-char token, stores SHA-256 hash in `password_reset_tokens` collection with 1h expiry, sends reset email via Resend. Always returns success (email-enumeration safe).
  - `POST /api/auth/reset-password` — validates token hash, expiry, and unused status; writes bcrypt-hashed new password (matches auth_routes scheme); marks token `used`; invalidates all other pending reset tokens for that user.
  - `GET /api/auth/phone-status` — returns `{phone, phone_verified, needs_verification}` for the authenticated user (accepts both session cookie and Bearer JWT).
  - `POST /api/auth/phone/send-otp` — saves phone number to user doc, generates 6-digit OTP, stores SHA-256 hash in `phone_otps` with 10-min expiry and 5-attempt cap; emails code via Resend (SMS-ready — swap `send_email` → Twilio call).
  - `POST /api/auth/phone/verify-otp` — hash-compare, increments attempts on failure, on success sets `phone_verified=True` and clears OTP.
- [x] **Frontend — 3 new pages:**
  - `/forgot-password` (`ForgotPassword.js`) — email input → "Check your email" confirmation
  - `/reset-password?token=xxx` (`ResetPassword.js`) — new + confirm password, error handling, success state
  - `/verify-phone` (`VerifyPhone.js`) — 2-step wizard (phone entry → 6-digit OTP), auto-redirects verified users, auto-redirects unauthenticated to `/login`
- [x] **Login gate:** `Login.js` now checks `/auth/phone-status` after email login; if `needs_verification`, redirects to `/verify-phone` (one-time gate)
- [x] **"Forgot password?"** link added to Login.js password field
- [x] **Resend config:** new API key, `SENDER_EMAIL="Ceibaa <noreply@ceibaa.in>"` (verified domain), `SITE_URL="https://ceibaa.in"`
- [x] **E2E verified:** 9-step live smoke test passed (signup → forgot-password → reset-password → login with new pw → send OTP → verify OTP → phone-verified). Resend logs confirm delivery to verified domain.

### Deferred
- [ ] Twitter login button (needs user's TWITTER_API_KEY + TWITTER_API_SECRET)
- [ ] Facebook login button (keys already in .env — just need UI wire-up; simple addition)
- [ ] Migrate OTP from email to SMS (add Twilio when user provides creds — swap is ~5 LOC in `send_phone_otp`)


### Feb 20, 2026 — Logged-in "Change Password" + Settings page + Session revocation + Security email
- [x] **Backend:** `POST /api/auth/change-password` added to `account_security_routes.py`
  - Verifies current password via bcrypt, rejects if wrong (401)
  - Rejects same old/new password (400) and <6-char new password (400)
  - Writes bcrypt hash of new password
  - Revokes all **other** user sessions (current session kept alive — user stays logged in)
  - Invalidates any pending password-reset tokens
  - Sends "Your password was changed" security-breadcrumb email via Resend (best-effort, non-fatal)
- [x] **Frontend:** `ChangePasswordForm.js` reusable component + `/settings` page (`Settings.js`)
- [x] **Header dropdown:** added "Settings" + "Change Password" items with Lucide icons (`SettingsIcon`, `KeyRound`)
- [x] **Route wired:** `/settings` in App.js
- [x] **Testing:** 8-step E2E smoke passed (wrong-current-rejected, same-old/new-rejected, success + session revoke, current token survives, old password no longer works, new password works); live UI smoke confirmed dropdown items + settings page render; Resend delivers notification email

