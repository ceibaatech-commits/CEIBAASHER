# Changelog

> Older history (pre-June 2026) lives in `/app/memory/PRD.md`. New entries are appended here.

### Feb 13, 2026 — Follow / Unfollow / Block / Share end-to-end fixes (P0 — COMPLETE)
- [x] **Backend — `profile_follow_routes.py`:**
  - `POST /block` migrated from header-only auth to hybrid `get_user_id_from_request` (cookie+bearer). Returns **400** for self-block, **404** for missing user, atomically wipes both-way follow + close_friend rows.
  - `DELETE /unfollow/{id}` adds **400** self-unfollow guard and best-effort close_friend cleanup.
  - `POST /close-friend` migrated to hybrid auth (same header-only bug).
  - `GET /{username}` now reads `current_user_id` from cookie/bearer when not in the query string, then injects an `is_blocked_between` check before returning the profile. Blocked viewers (either direction) receive `{is_blocked:true, message:"This account is not available"}`.
  - New shared helpers `get_blocked_user_ids(user_id)` (bi-directional set) and `is_blocked_between(viewer, target)`.
- [x] **Backend — `social_feed_routes.py`:** new `get_blocked_user_ids_for_feed(user_id)` helper injected into:
  - `GET /feed/for-you` — drops posts whose author is in the blocked set.
  - `GET /feed/trending` — added optional auth header so the filter applies for logged-in viewers.
  - `GET /feed/following` — block filter applied to the `following_ids` list before the posts query.
- [x] **Frontend — `FollowButton.js`:**
  - `shareProfile()` rewritten: `navigator.share({title,url})` first (mobile/Web Share API), clipboard fallback (`navigator.clipboard.writeText` + legacy `execCommand` fallback) on desktop. Replaced `alert` with **Sonner** `toast.success('Profile link copied!')` / `toast.error('Could not copy link')`. Cancellation (AbortError) handled silently.
  - `apiBlock()` / `apiUnfollow()` / `apiFollow()` — all `alert(...)` calls replaced with Sonner `toast.success/error`. Block now surfaces "Blocked @username" toast and invokes `onBlock` callback.
- [x] **Frontend — `PublicProfile.js`:**
  - New `handleBlock` callback → `navigate('/victory-lane', {replace:true})` so the user is bounced from a profile they just blocked.
  - New `isBlocked` state → renders a dedicated "This account is not available" card (`data-testid='profile-unavailable'`) with a Back-to-Feed button (`data-testid='profile-unavailable-back'`) when backend returns `is_blocked:true`.
  - **Race fix:** added `profileReqIdRef` monotonic ID so stale `fetchProfile()` responses can't overwrite newer state when AuthContext hydrates after the initial render (root cause from iteration_32 frontend FAIL).
  - `onBlock={handleBlock}` wired into both `<FollowButton>` instances (private + public profile blocks).
- [x] **Test report:** `/app/test_reports/iteration_32.json` — backend 8/8 pytest pass, frontend 7/7 after race fix.

### Feb 13, 2026 — App.js route restoration + InboxDropdown group display + Follow bottom sheet (COMPLETE)
- [x] Restored 13 routes + imports in `App.js` (`/jobs`, `/settings`, `/forgot-password`, `/reset-password`, `/verify-phone`, `/recruitment-admin`, `/recruiter*`, `/discover`, `/company/:slug`, `/apply/:jobId`, `/quiz-recruit/:quizId`, `/hackathon/:hackId`, `/my-applications`).
- [x] `InboxDropdown.js` group-chat name bug — was always "Unknown" because `conv.other_user` is `null` for groups. Fixed to mirror Messages.js: `conv.is_group ? (conv.name||'Group') : (conv.other_user?.name||'Unknown')` + group avatar (Users icon).
- [x] `FollowButton.js` rewrote as Threads/Meta-style bottom sheet (`FollowSheet` + `FollowingSheet`) — `rounded-t-3xl`, dark backdrop, `slide-in-from-bottom` animation, body scroll lock, safe-area inset. Fixed `relative inline-block` → `w-full sm:inline-block` so the pill stretches on mobile.
- [x] Backend `GET /api/profile/follow-status/{id}` was returning `following:false` whenever the Authorization header was missing — never checked the cookie. Replaced with the standard hybrid auth pattern (`get_user_id_from_request`). Same fix as the later `/block` + `/close-friend` fixes.
- [x] `PublicProfile.js` mobile redesign: posts go edge-to-edge (`-mx-4 md:mx-0` on Tabs Section + `px-0 md:p-6` on tab content), flat card style on mobile (no rounded card wrapper, `divide-y divide-gray-100` between posts), Twitter/X-style action bar.

> Older history (pre-June 2026) lives in `/app/memory/PRD.md`. New entries are appended here.

### Jun 12, 2026 — Real-time unread counts: Socket.IO push replaces 30s polling (P0 — COMPLETE)
- [x] **Backend — `social_socketio.py`:**
  - Cookie auto-auth on connect (`_uid_from_environ` → `utils.auth_helpers._resolve_user_id`, supports JWT + opaque Google-OAuth session tokens).
  - `_register_user` joins `user_{uid}` room and pushes initial `unread_notifications_count` on connect.
  - New `emit_unread_notifications_count(uid)` helper + `request_unread_notifications_count` client-resync event.
  - `send_notification` now strips Mongo `_id` (was silently failing serialization) and also pushes the fresh count — this covers all `social_feed_routes.py` insert sites for free.
- [x] **Backend — `notification_routes.py`:**
  - All endpoints migrated to dual-mode auth (`_resolve_uid`: httpOnly `session_token` cookie first, Bearer fallback). Previously header-only → cookie users silently got `count: 0` / 401s.
  - Emits count push after: `create_notification` helper, mark-read, mark-all-read, delete, delete-old.
- [x] **Backend — hooks:** `profile_routes.create_notification` and `referral_routes` insert both push counts (best-effort).
- [x] **Backend — `messaging_routes.py`:** `mark_read` now pushes `unread_messages_count` so badges clear across all tabs.
- [x] **Backend — `messaging_socketio.py`:**
  - **BUG FIX:** `enter_room`/`leave_room` are async in python-socketio 5.14 but were called without `await` → conversation rooms were never joined (broken room fan-out). Fixed (3 sites).
  - **BUG FIX:** `if not db` / `if not (db and uid)` raise `NotImplementedError` on Motor Database truthiness → connect handler crashed for logged-in users. Fixed to `is None` checks (3 sites across both socketio modules).
  - Connect/authenticate now also resolve opaque Google-OAuth session tokens (`_resolve_uid`).
- [x] **Frontend — `NotificationContext.js`:** `setInterval` removed. Listens to `unread_notifications_count` on the shared social socket (auth-gated via `useAuth`), one initial REST fetch, emits `authenticate` + `request_unread_notifications_count` on (re)connect.
- [x] **Frontend — `InboxDropdown.js`:** `setInterval` removed. Listens to `unread_messages_count` via new `lib/messagingSocket.js` singleton (cookie auth, `withCredentials`).
- [x] **Frontend — `useSocialSocket.js`:** exported `getSocialSocket` singleton, added `withCredentials`, removed auto-disconnect-on-zero-consumers (socket now lives for app lifetime so badges keep updating on any page).
- [x] **Tests:** `/app/backend/tests/test_realtime_unread_push.py` (4/4 pass): cookie REST auth, initial push on connect, push on create, push→0 on mark-all-read, resync event, message push on send/read.
- [x] **Test fixture repair:** `test_follow_notification.py` hardcoded a stale `TEST_USER_2_ID` UUID not present in this DB → now resolves demo3 dynamically (11/11 pass).
- [x] **E2E verified (testing agent, iteration_31.json — 100% pass):** bell badge bumps within ~0.6s of remote like-notification, clears on mark-all-read, inbox badge bumps on remote message — all without page refresh; no 30s polling pattern over 45s observation; Victory Lane + Messages page regression clean; 0 console errors.

### Jun 12, 2026 — Test History feature: MongoDB + per-attempt S3 JSON archive (COMPLETE, S3 awaits AWS keys)
- [x] **New module files:** `test_history_models.py` (Pydantic v1-style: TopicBreakdown, TestHistoryCreate, TestHistoryEntry with auto-calculated `percentage` via root_validator), `test_history_routes.py` (router + stub `get_db()`, `user_id` plain query param pending JWT auth), `test_history_s3.py` (boto3, key = `{user_id}/{test_id}_{completed_at}.json`, per-user prefix folders, best-effort upload/delete via threadpool), `indexes.py` (Motor async: user+date, user+subject, user+exam_category, test+percentage leaderboard — created on startup).
- [x] **Endpoints (mounted `/api/test-history`):** POST `/` (save + S3 archive, reports `s3_uploaded`), GET `/` (paginated, filters: subject/exam_category/is_battle, newest first), GET `/{entry_id}`, DELETE `/{entry_id}` (also best-effort S3 object delete).
- [x] **.env additions:** AWS_REGION=ap-southeast-2, AWS_ACCOUNT_ID, AWS_DEFAULT_VPC_ID, TEST_HISTORY_S3_BUCKET=ceibaa-test-history-063641675821 (placeholder bucket name — user to confirm).
- [x] **Tests:** `/app/backend/tests/test_test_history.py` — 10/10 pass (create + 75% auto-calc, pagination, all 3 filters, single get, cross-user 404, delete, 404s, 422 validation, zero-marks edge). Indexes verified in Mongo. External ingress curl OK.
- [ ] **MOCKED/PENDING:** S3 uploads gracefully skip (s3_uploaded:false) until user provides AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY + real bucket name. User intent: Board/leaderboard data backed by AWS.

### Jun 13, 2026 — S3 archive LIVE on user's AWS account
- [x] User provided bucket `ceibaa.e4` (arn:aws:s3:::ceibaa.e4) + IAM access keys for user `Ceibaa`; guided them to attach inline policy `ceibaa-test-history-s3` (Put/Get/DeleteObject on bucket).
- [x] Verified end-to-end against real AWS (ap-southeast-2): POST → `s3_uploaded:true`, file readable via get_object with correct JSON content, DELETE → object removed from bucket, 0 orphans left. 10/10 pytest pass (test updated to assert S3-status self-consistency in both creds/no-creds environments).
- [x] backend/.env now holds AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / TEST_HISTORY_S3_BUCKET=ceibaa.e4.
- [!] Advised user to rotate the access key later (it was pasted in chat).

### Jun 13, 2026 — AWS access key rotated
- [x] Swapped to new key `AKIAQ5UKW5AWQQRPBSZ2` in backend/.env; live S3 upload + delete re-verified on `ceibaa.e4`. User instructed to deactivate/delete old key `AKIAQ5UKW5AW36DWVE5Y` in IAM.

### Jun 13, 2026 — Test History wired into gameplay + "Tests" tab on profile (COMPLETE)
- [x] **New `test_history_service.py`:** `record_test_attempt()` — best-effort Mongo insert + S3 archive, never breaks gameplay. Scoring conventions: solo/quiz-room = 1 mark/question; battles = points (max 100/question → total_marks = questions×100).
- [x] **Auto-save hooks:** `quiz_routes.py` `/quiz/submit` (solo/chapter, with single-topic breakdown), `social_feed_routes.py` quiz-room/battle-room submit, `battle_shared.py` `_save_battle_history` (live room battles, per participant), `battle_social_handlers.py` `_save_user_battle_history` (1v1, with opponent_user_id).
- [x] **BUG FIX (pre-existing):** `battle_social_handlers.py` did `from battle_shared import db` at import time → bound `None` forever (init rebinds only battle_shared.db) → ALL db writes in that module silently failed, incl. 1v1 battle history. Now imports live `database.db`.
- [x] **Auth upgrade:** test-history endpoints use `resolve_user_id` dependency — explicit `?user_id=` param wins (tests/internal), else httpOnly cookie / Bearer JWT (incl. opaque Google sessions). No auth → 401.
- [x] **Frontend:** new `components/profile/TestHistoryTab.js` (All/Solo/Battles filters, expandable cards: marks, 5-stat grid, topic breakdown, delete, load-more pagination, full data-testids). Wired into `PublicProfile.js` ("Tests" tab, own profile only). NOTE: `/profile/:username` routes to `PublicProfile.js`; `pages/Profile.js` is imported in App.js but NOT routed (dead code, candidate for cleanup).
- [x] **Tested:** quiz e2e (start→submit→history entry with 60% + S3 file in user folder), both battle hooks simulated (correct pct 72/81.25/51.25, opponent id, S3), 10/10 pytest regression, UI screenshot verified (tab, filters, expanded card). Testing agent not used — flows covered by scripted self-tests.
