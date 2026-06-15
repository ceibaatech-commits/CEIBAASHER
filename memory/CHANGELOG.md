# Changelog

> Older history (pre-June 2026) lives in `/app/memory/PRD.md`. New entries are appended here.

### Feb 15, 2026 — Messenger Premium Redesign (Immersive Chat + Adaptive Theme) — COMPLETE
- [x] **`/app/frontend/src/pages/Messages.js` — full UI rewrite (~960 lines)** preserving all socket.io / axios state logic but replacing the JSX rendering.
  - **Immersive chat (route `/messages/:conversationId`)** — `fixed inset-0 z-[100]` container, `100dvh` height with `visualViewport` keyboard sync, hides global `<Header />` and `<MobileBottomNav>` via `body[data-chat-active="true"]` CSS rule.
  - **Light / Dark adaptive theme** — `useChatTheme` hook reads `prefers-color-scheme` + per-user override stored in `localStorage` (`ceibaa.chat.theme` = light/dark/system). In-chat theme picker (Sun/Moon icon top-right) lets user pin a preference.
  - **Single brand accent** — replaced the clashing cyan/blue/purple/pink gradient mess with a single `#5B5BF0 → #7C3AED` violet gradient used ONLY on the user's outgoing bubbles and the Send FAB.
  - **Asymmetric bubbles** — outgoing bubbles flatten bottom-right corner to 6px (only the LAST bubble of a streak), incoming bubbles flatten bottom-left. Sender name appears only on the FIRST incoming bubble of a same-sender streak (groups only). Avatar appears only on the LAST incoming bubble of a streak.
  - **Day separators** (Today / Yesterday / weekday / Mon DD) injected between message clusters via a memoized `renderableMessages` pre-pass.
  - **System messages** rendered as slim centered muted pills (no border).
  - **Sticky bottom input** — `padding-bottom: calc(10px + env(safe-area-inset-bottom))` so the Send button always clears the iOS home indicator and Safari bottom chrome. Auto-grow `<textarea>` (1 → 5 lines, then internal scroll). Send button is `44×44`, gradient when active, muted when input empty.
  - **Receipts** — `Check` / `CheckCheck` brand-violet only when read; only rendered on the LAST outgoing bubble of a streak (less visual noise).
  - **Gestures** — touchstart/touchmove on the chat header for swipe-down-to-close (threshold 80px) with live transform/opacity feedback; left-edge swipe (touchstart x<22, dx>80, |dy|<60) also closes the chat. Explicit collapse-arrow button top-right (`data-testid="chat-collapse-btn"`).
  - **Jump-to-latest pill** — sticky bottom-right `↓ N new` pill appears when new incoming msg arrives while user is scrolled up.
  - **Typing indicator** — 3-dot pulsing animation in an incoming-style bubble.
  - **Open animation** — `chat-slide-in` (220ms spring) on mount, respects `prefers-reduced-motion`.
- [x] **Messages list (route `/messages`)** redesigned light: `max-w-2xl` centered, `text-[22px] font-bricolage` title, soft purple ghost `New group` pill, neutral pill search (h-11, rounded-2xl), 72px-tall conversation rows with brand-tinted group avatar, presence dot ring against bg, unread badge in single brand violet.
- [x] **Top-gap fix** — App.js root already wraps everything with `paddingTop: 72px`; removed the redundant `paddingTop: 88` from `<main>` (was double-counting) — gap between header bottom and "Messages" title now measured at **18px** (was ~88-140px on mobile).
- [x] **Fonts** — Added `Bricolage Grotesque` + `Fraunces` to `/app/frontend/public/index.html` (Google Fonts CDN) and utility classes `.font-bricolage`, `.font-fraunces`, `.font-geist` in `/app/frontend/src/index.css`.

### Feb 15, 2026 — SoloPractice Results dynamic score themes — IMPLEMENTED (manual user verification pending)
- [x] **`/app/frontend/src/pages/SoloPractice.js` `quizState === 'results'` block fully redesigned** with three dynamic themes driven by `getResultTheme()`:
  - **HIGH (≥75%) "Forest Focus"** — deep-green `#0F2A1D` hero, sage accents `#A8C695`, headline *"You mastered this."*, eyebrow chip *Forest Focus*.
  - **AVG (45-74%) "Japandi"** — sage `#9CAE8C` hero, ink-black text `#1A1A1A`, headline *"Solid effort — refine the gaps."*, eyebrow chip *Japandi*.
  - **LOW (<45%) "Sunset Reset"** — ink-black `#1B1A18` hero with warm cream `#F2E4CC` text and amber `#E8B27A` accents, headline *"Every expert was once a beginner."*, eyebrow chip *Sunset Reset*.
  - Big score uses **Fraunces** variable font (`font-fraunces`, `opsz 144`, 88-128px); headline + buttons use **Bricolage Grotesque**.
  - Standardized button sizes: `h-12`, `rounded-2xl`, Practice Again (primary, theme-tinted) + More Topics (secondary white).
  - data-testids added: `solo-practice-results`, `results-hero-card`, `results-score-number`, `results-headline`, `results-back-btn`, `results-correct-count`, `practice-again-btn`, `more-topics-btn` (and `-bottom` variants).
  - Testing agent was unable to drive automated quiz-completion (demo1 quick-login not exposed via data-testid yet); user opted to verify manually.

### Feb 13, 2026 — Divya Tutor Phase 2 (progress storage) + Phase 4 (Quiz Mode) — COMPLETE
- [x] **New backend file `/app/backend/divya_progress_routes.py`** — prefix `/divya/progress`, hybrid cookie+bearer auth via `get_user_id_from_request` from `profile_routes`. Endpoints:
  - `POST /session/start` — create `divya_sessions` row, returns `{session_id}`
  - `POST /session/end` — set `ended_at` + `duration_seconds`
  - `POST /session/log-message` — `$inc` `message_count` (silent no-op for unknown ids)
  - `POST /quiz` — persist `divya_quiz_attempts` row with computed `percentage`. **Validates that the supplied `session_id` (if any) belongs to the caller — 400 otherwise** (defence-in-depth per testing-agent review).
  - `GET /stats` — aggregate response: `messages.{today,week,all_time}`, `sessions.{count,total_seconds}`, `streak_days`, deduped `topics` list (`exam · subject · topic`), latest 50 `quizzes`
- [x] **New backend endpoint `POST /api/divya/live/quiz`** in `divya_routes.py` — Gemini generates one MCQ JSON (4 options + correct_index 0..3 + explanation in target language), Sarvam TTS speaks the question. Accepts `tutor`, `language`, `context` (PDF), `exam/subject/topic` for context-aware questions, `question_number`, `total_questions`, `previous_qa` (so the LLM doesn't repeat).
- [x] **Frontend `DivyaTutor.js`:**
  - New `QuizPanel` component with progress bar, MCQ UI (A/B/C/D pills), correct/wrong colour feedback, "Why?" explanation block, Next button, final score screen
  - `LiveTutor` now: calls `/session/start` on tutor pick, `/session/log-message` on every user+tutor exchange, `/session/end` on close, `/quiz` on final attempt
  - "Quiz" pill button (`data-testid="start-quiz-btn"`) in the chat header
- [x] **Mounted in `server.py`** at `/api/divya/progress/*`
- [x] **Test report `/app/test_reports/iteration_33.json`** — 14/14 backend pytest cases pass, Sarvam-WAV header verified for both English + Hindi quiz audio, demo1 cookie auth validated, streak/topics aggregation verified, test data cleaned up. Pytest file at `/app/backend/tests/test_divya_progress_quiz.py`.

### Feb 13, 2026 — Divya Tutor Phase 1: Sarvam TTS migration (COMPLETE & verified)
- [x] **Removed `divya_live_routes.py`** (dead duplicate after consolidation into `divya_routes.py`).
- [x] **Fixed `divya_routes.py` per the new Sarvam spec:**
  - Removed the **hardcoded fallback Sarvam key** on the env read (security fix — was a leaked-looking string)
  - Voice map: **Divya → `anushka`, Sher → `manisha`**. Note: the user originally specified `neha` for Sher but the live Sarvam API rejected it — only 7 speakers are compatible with `bulbul:v2`: `anushka, abhilash, manisha, vidya, arya, karun, hitesh`. Picked `manisha` as the next-best female voice for Sher.
  - Model bumped to **`bulbul:v2`** (was `bulbul:v1`)
  - Default-speaker fallback unified via `SARVAM_DEFAULT_SPEAKER = "anushka"`
  - Added `SHORT_TO_FULL_LANG` map + `_normalize_lang(lang)` helper so the backend accepts both short codes (`"en"`, `"hi"`) AND full Sarvam codes (`"en-IN"`, `"hi-IN"`). Applied to `/divya/live/ask`, `/divya/live/transcribe`, `/divya/generate-podcast`.
- [x] **Frontend `DivyaTutor.js`:**
  - `audio/mpeg` → `audio/wav` (Blob constructor + base64 data-URI for podcast playback)
  - `transcribeAndSend` now appends `selectedLang` to the form so Whisper transcribes in the right language
- [x] **`backend/.env`:** `SARVAM_API_KEY` added.
- [x] **End-to-end verified live:**
  - `POST /api/divya/live/ask` with `tutor=divya, language=en` → 200, 384 KB valid WAV, Gemini English reply
  - `POST /api/divya/live/ask` with `tutor=sher, language=hi` → 200, 380 KB valid WAV, Hinglish reply from Sher in `manisha` voice
  - `POST /api/divya/ask` (non-TTS endpoint) → 200, proper Gemini response

### Feb 13, 2026 — 1v1 Rematch flow (COMPLETE)
- [x] **Backend `battle_social_handlers.py`:** new socket events `rematch-request`, `rematch-accept`, `rematch-decline` plus broadcast events `rematch-pending`, `rematch-requested`, `rematch-declined`, `rematch-timeout`. Module-level `pending_rematches` map with 30s timeout via `asyncio.create_task`. Auto-confirms on mutual consent (if both players click rematch within the window). Helper `_create_rematch_room` bypasses the queue: generates a fresh `room_id`, re-uses the two existing socket players (zeroes scores), emits per-socket `match-found` with `rematch: true`, persists a new `live_battles` doc with `is_rematch: true` and `parent_room_id`.
- [x] **Backend `battle_socketio.py`:** disconnect handler cleans up any pending rematch involving the leaving socket and notifies the surviving party with `rematch-declined: 'Opponent disconnected'`.
- [x] **Frontend `Matchmaking1v1.js`:** new `rematchState` ('idle' | 'pending' | 'requested'). `match-found` listener now resets all per-battle state (scores, tally, chat, current question, etc.) so rematches start clean. Results screen swaps the "Battle Again" button for a `Rematch with {opponent}` CTA when `opponent.userId` exists; while pending, shows `Waiting for {opponent}...` spinner; when opponent requests, shows accept/decline banner. Toast feedback for all 4 outcomes. Data-testids: `rematch-btn`, `rematch-incoming-banner`, `rematch-accept-btn`, `rematch-decline-btn`.
- [x] **Frontend `LiveBattleMode.js`:** same rematch UI on its results screen (`rematchState` + listeners + accept/decline banner) plus a fresh-state reset on every `match-found`.
- [x] **Smoke-tested:** backend startup clean; both 1v1 setup pages render with no compile/runtime errors. Full two-player rematch dance can only be e2e-verified with two concurrent sessions — defer to live QA.

### Feb 13, 2026 — Battle 1v1: block-aware matchmaking + follow-on-chat + gated opponent profile + LiveBattleMode parity (COMPLETE)
- [x] **Backend `matchmaking.py`:** `WaitingPlayer` now carries `user_id` + `username`. `add_to_queue(...)` accepts a `blocked_user_ids: set` argument and **skips** any waiting candidate whose `user_id` is in that set; skipped candidates are re-queued at the front so they don't lose priority for other players.
- [x] **Backend `battle_social_handlers.py`:** `find-match` handler now reads the authenticated `user_id`/`username` from `sio.get_session(sid)` (set via the `authenticate` event), queries `db.blocks` for bi-directional blocks, and passes both into matchmaking. `_emit_match_found` now sends a **per-socket** payload with `socketId`, `playerName`, `userId`, `username` for both self and opponent. `_build_live_battle_doc` also persists user_ids on each player record.
- [x] **Frontend `Matchmaking1v1.js`:**
  - Imports `FollowButton`; tracks `userRef` so the socket's `connect` handler can `emit('authenticate', {userData})` with the live user
  - Mobile chat header + desktop sidebar opponent card + results screen all render a `<FollowButton targetUserId={opponent.userId} targetUsername={opponent.username||opponent.playerName} />` whenever the opponent is authenticated
  - Opponent's name becomes a clickable link to `/profile/{username}` **only** when `battleState ∈ {results, setup}` — during `searching`/`matched`/`playing` the name is plain text (prevents distraction during live battle). New data-testids: `chat-opponent-name-link`, `chat-opponent-name`, `chat-opponent-follow`, `desktop-opponent-name-link`, `desktop-opponent-follow`, `results-opponent-name-link`, `results-opponent-follow`.
- [x] **Regression tests:** `/app/backend/tests/test_matchmaking_block_filter.py` — 4 cases (basic match / blocked skip / unrelated still matches / anonymous players still work) all passing.

### Feb 13, 2026 — Blocked accounts in Settings (COMPLETE)
- [x] Backend: `GET /api/profile/blocked-users` (enriched list with name/username/avatar/blocked_at) and `DELETE /api/profile/block/{target_user_id}` (unblock, 400 for self, 404 if no block)
- [x] Frontend: `/app/frontend/src/components/settings/BlockedAccountsCard.js` mounted on the `/settings` page with loading + empty states, confirm dialog, Sonner toast feedback

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
