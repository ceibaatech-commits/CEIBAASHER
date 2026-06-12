# Changelog

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
