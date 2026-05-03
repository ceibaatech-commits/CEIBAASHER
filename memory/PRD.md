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




### Feb 24, 2026 — Mobile Home Page Redesign (editorial / human palette, per reference mock)
- [x] **File:** `/app/frontend/src/pages/Home.js`
  - New hero headline: **"Dominate the Arena."** + subheading **"Your Journey to India's Best Begins Here."** + italic tagline **"Don't just pass the exam. Get hired by India's best."**
  - Two side-by-side CTA cards (warm, non-AI palette):
    - Purple (`#4c1d95`) **"Career Pathway: Get Hired →"** with `Briefcase` icon → navigates to `/jobs`
    - Gold (`#efc868`) **"Skill Forge: Train"** with `Sparkles` icon → smooth-scrolls to `#skill-drill-section` (fallback `/chapter-tests`)
  - Pill search bar: placeholder `Search Exams, Skills, Mentors...`
  - Stats strip: `Exams 38+`, `Questions 50K+`, `Active Battles: 7 Live` (red pulsing dot)
  - Category grid **restyled only** — white rounded cards + purple Lucide icon tiles (`GraduationCap`/`Stethoscope`/`Shield`/`Landmark`/`School`/`Briefcase`/`Building2`/`Building`/`ShieldAlert`/`Map`/`Languages`). All existing functionality preserved: drawer open/close, exam cards render inside drawer, sticky scroll, Teaching hidden on mobile.
  - Skill Drill section kept intact; only header + background restyled to match new cream palette. `id="skill-drill-section"` added for CTA scroll target.
  - Cream base background `#fdf9ee` with subtle dotted pattern accent. No animated gradients.
- [x] **Verified live:** Get Hired → `/jobs` ✅, Medical category drawer opens with exam cards ✅, all 11 categories + 11 skill-drill classes still render ✅, no console errors.

### Deferred (unchanged)
- [ ] Twitter login button (needs user's TWITTER_API_KEY + TWITTER_API_SECRET)
- [ ] Facebook login UI button (backend already wired)
- [ ] Decompose `ExamSheetManager.js` (1720), `ExamCategoryManager.js` (997), `Board.js` (872)
- [ ] Migrate OTP from email to SMS (Twilio)


### Feb 24, 2026 — 1v1 Video Call: Agora-only controls + ringing vibration
- [x] **File:** `/app/frontend/src/pages/Matchmaking1v1.js`
  - Reverted previous `display:none` hack on `localBtnContainer` & `BtnTemplateStyles` so AgoraUIKit's built-in **mute / camera-off / end-call** buttons are now visible — these are the only call controls.
  - Layout per user spec: **REMOTE opponent = full background (max view)**, **LOCAL user = small rounded PIP at top-right** (90×120, 12px radius, white border, shadow).
  - Enlarged the floating overlay from 220×300 → **320×440** so the Agora controls are usable.
  - Removed the duplicate Ceibaa "End Call" buttons from both mobile and desktop quiz toolbars; replaced with a passive "● Live" indicator (the only way to end the call now is via Agora's built-in red end-call button or when the battle finishes).
  - Cleaned up unused `PhoneOff` lucide-react import.
  - **Vibration on ringing:** new `useEffect` that fires `navigator.vibrate([400,200,400,200,400])` every 1.6s while `vcState === 'incoming' || 'requesting'`. Stops when the call is accepted, declined, or ended. Gracefully no-ops on browsers without `navigator.vibrate`.
  - The Ceibaa "Report" flag button stays in the toolbar for abuse reporting (separate from call controls — kept per user request).
- [x] **Lint:** `Matchmaking1v1.js` — no issues.
- [x] **Smoke test:** `/matchmaking/SSC%20CGL/General%20Awareness/History` renders cleanly post-login (Find Opponent screen). The actual PIP overlay only mounts during an active call — requires two browsers on real devices with mic/cam permission to fully verify the video stream + Agora-controls layout.

### Feb 24, 2026 — Agora App Certificate wired (token-based auth, prod-ready)
- [x] Added `AGORA_APP_CERTIFICATE=18b3fa58e6f74590a0d011a95f18fb93` to `/app/backend/.env`.
- [x] Existing token-builder code in `agora_routes.py` automatically switched modes — `GET /api/agora/token?channel=test123&uid=12345` now returns `mode: token` with a real 139-char signed token (1-hour expiry).
- [x] No frontend changes needed; the client already passes whatever the backend returns to AgoraUIKit. App-ID-only fallback removed naturally — every call now uses signed tokens.
- [x] **Smoke:** curl confirmed `mode: token | token_len: 139`. Backend restarted cleanly.

### Feb 24, 2026 — Fix `CAN_NOT_GET_GATEWAY_SERVER: dynamic use static key`
- [x] **Root cause:** Frontend was hard-coded to App ID `f512a6c76b5a4e0abd193119f3ba22fe` — this is a different Agora project (one that has Primary Certificate enabled, requiring tokens). User's actual Ceibaa project (per the App Builder export) is `77616f0f11d244aab4070def2bcb5f2e` and runs in **App-ID-only mode** (no certificate). Connecting to the wrong project caused Agora's gateway to reject with `dynamic use static key`.
- [x] **Fix:**
  - Added `AGORA_APP_ID=77616f0f11d244aab4070def2bcb5f2e` to `/app/backend/.env`
  - Added `REACT_APP_AGORA_APP_ID=77616f0f11d244aab4070def2bcb5f2e` to `/app/frontend/.env`
  - `agora_routes.py` default + frontend constant updated to read from env (with the new value as fallback)
  - Backend `/api/agora/token?channel=test` now responds with `{"mode": "app_id_only", "token": null, ...}` — matches the project's auth mode.
- [x] **Resilience:** wrapped `<StableAgoraVideo>` in a new `<VideoErrorBoundary>` (React class boundary). Any uncaught Agora SDK error (gateway, getUserMedia denied, network drop) now silently swallows the crash, calls `endVC()`, and shows a `toast.error('Video call dropped — quiz continues.')`. The quiz UI never gets the red runtime-error overlay again.
- [x] **Lint:** clean. **Smoke:** `/api/agora/token` returns app_id_only mode; setup page renders without errors after demo1 login.

### Feb 24, 2026 — Call-duration timer (WhatsApp-style "MM:SS")
- [x] **`StableAgoraVideo`** now displays a small live-call duration pill at the **top-center** of the overlay. Format: `MM:SS` with a pulsing red dot. Uses tabular-nums for stable digit width.
- [x] **Counter starts when the remote opponent actually joins** (not earlier) — `useEffect` keyed on `remoteJoined` schedules a `setInterval` that increments every 1s and is cleaned up on unmount / call-end.
- [x] Auto-shrinks in `compact` (mini bubble) mode: 10px font + 5px dot + tighter padding so it stays readable inside the small bubble.
- [x] `pointer-events: none` so the pill doesn't intercept drag gestures on the overlay. zIndex 22 (above remote, below toggle buttons).
- [x] **TestID:** `vc-call-duration`.
- [x] **Lint:** clean. **Smoke:** setup page renders cleanly.

### Feb 24, 2026 — Self-preview eye-toggle on video call
- [x] **`StableAgoraVideo`** now has a third state `selfPreview` (default OFF). When toggled ON, the local stream renders as a 90×120 (or 50×70 in compact) rounded PIP at top-right. When OFF, local view is `display:none` — nothing rendered locally; stream still publishes to opponent.
- [x] **Eye toggle button:** `Eye` / `EyeOff` icon at **bottom-LEFT** of the overlay (top-left has size/mini toggles, top-right is reserved for the self-preview PIP itself, bottom-center has Agora controls). Active state highlights the button in blue (`rgba(91,143,212,0.85)`). Auto-shrinks to 24×24 in compact / mini mode.
- [x] **CSS surgery:** removed the broad `> div, > div > div, > div > div > div { display:block !important }` selector that was overriding the `display:none` on minViewContainer via `!important`. Now only `<video>` elements get the `object-fit: cover; width:100%; height:100%` override; container positioning is left to inline styleProps so toggling `selfPreview` cleanly switches between hidden ↔ small PIP.
- [x] **TestID:** `vc-toggle-self-preview` (with proper `aria-label` switching between "Show self preview" / "Hide self preview").
- [x] **Lint:** clean. **Smoke:** setup page renders cleanly.

### Feb 24, 2026 — Video Call: Hide self-view (each user sees only opponent) + Android Chrome layout fix
- [x] **Bug:** On Android Chrome the AgoraUIKit pinned layout was rendering local + remote videos stacked vertically (50/50 split) instead of one full background. Users could see only themselves (local stream stuck in `maxView` when remote subscription was slow), creating a confusing "I see myself" experience.
- [x] **Fix — Hide local self-view entirely** (`/app/frontend/src/pages/Matchmaking1v1.js → StableAgoraVideo`):
  - `minViewContainer` now uses `display: 'none'; visibility: 'hidden'; width:0; height:0; opacity:0; pointerEvents:'none'` — local stream is published over the wire but never rendered. Each user sees ONLY the opponent.
- [x] **Android Chrome layout override:** stricter scoped CSS targets `[data-vc-stage] > div`, `> div > div`, `> div > div > div` and forces every nested container to `position:absolute; inset:0; display:block; flex:none; width/height:100%`. Every `<video>` element gets `object-fit:cover; position:absolute; inset:0` so the visible frame is always the single remote stream filling the entire overlay — no stacking, no split.
- [x] **"Connecting to opponent…" placeholder:** absolute-positioned overlay with a CSS spinner shown until the AgoraUIKit `user-joined` / `user-published` callback fires. Hides the brief moment where AgoraUIKit's max view is the local user (because no remote has connected yet). Auto-disappears when `user-left` fires too. Compact spinner in `mini` mode (28px) vs full (56px).
- [x] **TestIDs:** new `vc-connecting-placeholder`. Existing `vc-pip`, `vc-toggle-size`, `vc-toggle-mini` preserved.
- [x] **Lint:** clean. **Smoke:** setup page renders cleanly post `demo1` login.

### Feb 24, 2026 — Mobile UI: Sarvam logo replaces Gemini-style sparkle icons
- [x] **Assets:** uploaded `sarvam-logo-white.svg` (16KB, 500×500 viewBox) saved to `/app/frontend/public/sarvam-logo-white.svg`. Auto-generated dark-tinted variant `/sarvam-logo-dark.svg` (replaces `#FCFCFC` / `#fff` fills with `#6b4e0d`) so the logo reads cleanly on the gold mobile cards.
- [x] **`/app/frontend/src/pages/Home.js`:**
  - Replaced the Lucide `Sparkles` icon on the **mobile "Recruiters: Hire With Us"** card (top-right corner) with `<img src="/sarvam-logo-dark.svg" />` at proper aspect ratio (`w-5 h-5 object-contain`).
  - Replaced the Lucide `Sparkles` icon on the **mobile "Skill Drill — CBSE Classes"** header (gold circle on the left) with the same Sarvam logo.
  - Removed unused `Sparkles` import from lucide-react.
  - Both logos preserve original 1:1 proportion via `object-contain`. New `data-testid` hooks: `hire-with-us-logo`, `skill-drill-logo`.
- [x] **Verification:** Both elements present in rendered DOM. Both SVG files served with HTTP 200 + `image/svg+xml` content-type. Lint clean. Visual confirmation requires real mobile device since the mobile branch is `md:hidden`.

### Feb 24, 2026 — 1v1 Battle Scoring: Unified equation + avg-score fix
- [x] **Bug:** `dashboard_routes.py` line ~290 was computing `percentage = (score / total) * 100` for 1v1 battles where `score` is RAW POINTS (max ~900) and `total` is question count (10), producing percentages up to **9000%** that corrupted the user's `avg_score`.
- [x] **Bug:** Frontend equation was `Math.max(10, timeLeft * 3)` — no penalty for wrong answers, no clear contract, max 900 pts.
- [x] **Bug:** Backend `battle_complete` blindly trusted client's `finalScore` — a tampered/buggy client could persist any number.
- [x] **Fix — Unified scoring equation (mirrored frontend + backend):**
  - **Correct:** `50 + round(50 × timeLeft / 30)` → 50–100 pts (instant=100, last sec=51)
  - **Wrong:** `-10` pts (light penalty discourages random guessing)
  - **Skipped/timeout:** `0` pts (neutral)
  - Final score clamped to `[0, total_questions × 100]` (max 1000 pts for 10 questions)
- [x] **Frontend** (`Matchmaking1v1.js`):
  - New `SCORE` constants block + `calcQuestionScore(outcome, timeLeft)` helper at top of file.
  - `handleAnswerSelect` rewritten with the unified equation; tracks `tally` state (correct / wrong / skipped / timeBonus).
  - Per-question feedback shows ✓ correct / ✗ wrong / ⊘ skipped colours + exact pts (positive for correct, negative for wrong).
  - **Score Breakdown card** added to the results screen (`data-testid="score-breakdown"`) with tally tiles, total time-bonus earned, and accuracy %.
  - `battle-answer` and `battle-complete` socket emits now use `newScore` (already clamped) so the backend can never receive a stale-closure stale value.
- [x] **Backend `battle_socketio.py` — server-side validation:**
  - Coerces `total_questions` (1..100) and `final_score` (int) safely, then clamps to `[0, total_questions × 100]` before persisting to `user_battle_history` and broadcasting `opponent-score-update`.
- [x] **Backend `dashboard_routes.py`:**
  - 1v1 percentage calc fixed: `(score / (total × 100)) × 100`, clamped 0–100. Old corrupt records are clamped at 100% so they don't pollute averages.
- [x] **Tests:** `tests/test_battle_scoring.py` — 21 unit tests covering per-question scoring, clamp logic, dashboard percentage, and 3 full-battle simulations. **All 21 pass.**
- [x] **Lint:** clean (frontend + backend). **Smoke:** dashboard endpoint returns valid `avg_score:0` for fresh demo1; setup page renders without errors.

### Feb 24, 2026 — Draggable WhatsApp/Instagram-style PIP video overlay
- [x] **File:** `/app/frontend/src/pages/Matchmaking1v1.js`
  - Three video-call layout modes:
    - **`mini`** — 120×190 floating bubble (DEFAULT after call connects), shows compact Agora controls (28×28 buttons) at the bottom so users can mute/turn off camera/end call without expanding. Pulsing green "live" dot at top-left. Draggable. Single-tap empty area to expand to pip.
    - **`pip`** — 300×420 floating card with full-size Agora controls (40×40), draggable, snaps to nearest horizontal edge on release.
    - **`full`** — fullscreen takeover, full-size Agora controls visible, drag disabled.
  - **Default mode = `mini`** so the quiz remains fully usable from the moment the call connects. Bubble starts top-right at y=100 (below the toolbar) so it never overlaps answer options.
  - **Compact prop** on `StableAgoraVideo` shrinks button sizes + local PIP from 90×120 → 50×70 in mini bubble — controls fit cleanly without crowding the video.
  - **Drag/tap separation:** 5px movement threshold distinguishes a quick tap from a drag. Tapping the mini bubble expands to pip; dragging it just relocates without expanding. Implemented via `wasDragRef` consumed on the next click.
  - **Drag implementation:** mouse + touch (`touchAction: 'none'` for scroll suppression — no `preventDefault` so synthetic clicks still fire), bounded to viewport, snap-to-edge on release, smooth 0.25s CSS transitions when not dragging.
  - **Toggle controls (top-left of overlay, hidden in mini):** Maximize/Minimize button (toggles full ↔ pip), and a separate "X" button to collapse to `mini` bubble. Buttons flagged `data-vc-control` so dragging ignores them.
  - Mini-bubble pulse animation (`@keyframes vcPulse`) for the live indicator.
  - All testIDs preserved: `vc-pip`, `vc-toggle-size`, `vc-toggle-mini`.
- [x] **Agora 50/50 split fix:**
  - Removed `display: flex; flex: 1` from outer floating overlay AND inner Agora wrapper — Agora's pinned layout no longer collapses to a vertical/horizontal split.
  - Z-index hierarchy: remote `maxViewContainer`=1, local `minViewContainer`=15, controls=20.
  - Scoped `<style>` injects `object-fit: cover; width:100%; height:100%` on every `<video>` under `[data-vc-stage]`, plus `position: absolute; inset: 0` on Agora's top-level children to prevent stretch/split.
- [x] **Lint:** clean. **Smoke:** setup page renders without errors after `demo1` login.
