# Ceibaa - Educational Quiz & Social Platform

## Core Architecture
- **Frontend**: React + Shadcn UI + Framer Motion + WebRTC
- **Backend**: FastAPI + MongoDB + Socket.IO
- **Auth**: JWT + Emergent Auth (Google OAuth)
- **Real-time**: Socket.IO for battles & social feed, WebRTC for 1v1 video

## Implemented Features

### Social Feed (Victory Lane)
- Posts, likes/unlikes, comments/replies, reposts
- Badge enrichment, engagement hydration
- Media upload permission system (admin-controlled)
- **Modular architecture** (Feb 2026 refactor):
  - `VictoryLane.js` (274 lines) - slim page orchestrator
  - `useVictoryLane` hook - feed, social, comments logic
  - `usePostCreation` hook - post/question creation + media
  - Extracted components: VictoryLaneHeader, PostComposer, CommentsSection, CreatePostFAB, QuizRoomModal
  - `PostCard.js` (242 lines) - post card orchestrator
  - `PostCardMenu.js` (72 lines) - dropdown menu
  - `PostActions.js` (52 lines) - like/comment/share/views bar
  - `QuizRoomCard.js` (101 lines) - quiz room embed card
  - Shared utilities in constants.js

### Referral System
- Share & Earn button, QR code, social sharing
- 1 coin per referral, coin leaderboard

### Battle System - WebRTC Video
- 1v1 peer-to-peer video/audio during exam battles
- WhatsApp-style floating PiP layout
- Mute/unmute audio, toggle video, end call
- Auto-cleanup when battle ends or user navigates away
- Backend signaling via Socket.IO (offer/answer/ICE)

### Admin Panel
- Global media toggle (master + images + videos)
- Per-user media permissions
- User management

## Bug Fixes (Dec 2025)
- Auth misattribution, reply endpoint, like auto-revert, missing badges
- Profile ID mismatch for disabled users
- Media permission chain (global + per-user + upload endpoint)

## Bug Fixes (Feb 2026)
- "Share & Earn" button visibility
- 1v1 Battle Video Chat rendering
- Header auth state on battle pages

## Completed Tasks (Feb 2026)
- VictoryLane.js refactored from 1885→274 lines (85% reduction)
- PostCard.js refactored from 520→242 lines (54% reduction) into PostCardMenu, PostActions, QuizRoomCard
- QuizRoomModal extracted with full original API behavior
- Custom hooks: useVictoryLane (607 lines), usePostCreation (188 lines)
- Class 7 English content updated
- Mobile category icons updated
- Header added to all battle pages
- Badge visibility fixed on single post page and comments

## Pending Issues
- P1: Update "Follow" button icon on user profiles (person head/shoulders + plus sign) - VERIFICATION PENDING
- P1: Google Search Console Integration - NOT STARTED

## Completed (Mar 2026 - Latest)
- **Career Programs / Beyond Exams Feature (Mar 22, 2026):**
  - Backend: programs_routes.py with full CRUD + enquiry endpoints
  - MongoDB: `programs` and `program_enquiries` collections
  - Frontend: Redesigned /courses page with domain-filtered cards (6 domains: competition, research, internship, ai_tech, healthcare, summer)
  - Frontend: /programs/:slug detail page with overview, highlights, mentor, related exams sidebar, enquiry modal
  - Admin: Create/update/delete programs + list enquiries
  - 6 programs seeded: Innovation Challenge, Research Mentorship, Finance Internship, AI Bootcamp, Healthcare Internship, Summer Residency
  - Course landing page: Hero with pricing card, enrollment progress bar, interactive preview, countdown timer, 4-module syllabus timeline, FAQ accordion (6 questions), chatbot widget with quick replies, mentor section, "Strengthen Your Foundation" exam links
  - Footer added to Courses + ProgramDetail pages
  - Fixed "Explore Mock Tests" button 404 (was /exam-selection, now /)
  - Deleted test program (TEST_PROGRAM) created by testing agent
  - Admin Programs panel: enquiries table with filters (status/program/search), status actions (contacted/enrolled/rejected), program CRUD with edit/delete, Add Program modal
  - All 19 backend + all frontend tests passed (100%)
- **Test History DataTable (Apr 9, 2026):**
  - TanStack React Table with sorting, multi-select pill filters (Exam/Subject/Status), global search
  - Live stats bar (Avg Score, Avg Accuracy, Best Rank, Total XP) recalculates on filter change
  - Custom cells: accuracy proportional bar (green/amber/red), questions breakdown (total·correct·wrong·skipped), rank+percentile stacked, XP amber pill
  - Pagination with 8/15/20/50 per page selector
  - Backend endpoint GET /api/dashboard/test-history/:userId aggregates quiz_history, battle_submissions, user_battle_history
- **Admin Live Battles Panel Fix (Mar 22, 2026):**
  - Fixed admin auth: verify_super_admin now checks admin_sessions collection (was only checking user_sessions)
  - Fixed route conflict: renamed GET /{battle_id} to GET /detail/{battle_id} so /reports and /stats aren't caught
  - Added battle persistence to live_battles DB collection in battle_socketio.py
  - Admin notifications wired: notify_admins_battle_started/ended/new_report called on events
  - Reports endpoint fully functional: submit, list, filter, review
  - All 12 backend tests passed (100%)

## Completed (Mar 2026 - Latest)
- **GIF → SVG Icon Replacement (Mar 14, 2026):**
  - Replaced heavy GIFs with lightweight animated SVGs in CreatePostFAB, QuizRoomCard, SinglePost
  - `talk.gif` (424KB) → `talk_animated.svg` (8.6KB) for Quick Post
  - `requirements.gif` (679KB) → `requirements_person_checklist.svg` (5.7KB) for Academic Questions
  - `integration.gif` (493KB) → `integration_network_animated.svg` (8.9KB) for Quiz Room
  - `quiz-animated.gif` (2.7MB) → `integration_network_animated.svg` (8.9KB) for Quiz Room cards
  - `create-animated.gif` (3.1MB) → `create_animated_cycle.svg` (5.7KB) for FAB button
  - Total reduction: ~7.4MB → 38KB (99.5% smaller)
- **Expired Token Handling (Mar 14, 2026):**
  - Added global Axios interceptor in AuthContext to catch 401 "expired token" errors
  - Shows "Session expired. Please login again." toast and redirects to /login
  - Prevents confusing raw error messages from reaching users
- **Matchmaking Refactor (Mar 14, 2026):**
  - Replaced list-based queues with `deque` for O(1) popleft (was O(n))
  - Added `_player_battles` reverse index for O(1) battle lookup by socket_id (was O(n) linear scan)
  - `get_player_battle` and `cleanup_player` now O(1) instead of scanning all active battles

## Completed (Feb 2026 - Latest)
- Divya & Sher AI Tutor: PDF/image upload → Gemini dialogue generation → OpenAI TTS podcast audio
- **Cloudinary Media Upload (Feb 27, 2026):**
  - Integrated Cloudinary CDN for Victory Lane media (offloads server)
  - Signed upload flow for secure direct-to-CDN uploads
  - Supports images (10MB max) and videos (100MB max, 90s duration limit)
  - Auto image optimization with proper aspect ratios:
    - 16:9 (1600x900) for professional content
    - 4:5 (1080x1350) for engagement/vertical content
    - Face detection for avatars
  - Video transcoding (720p, 480p adaptive streaming)
  - Upload progress tracking in UI
  - Video player with 16:9 aspect ratio, controls, no download
  - Media uploads ENABLED by administrator
- **Video Upload Signature Fix (Feb 28, 2026):**
  - Fixed "Invalid Signature" error for video uploads to Cloudinary
  - Root cause: `resource_type` was incorrectly included in signed params (should be URL path only)
  - Improved MediaPreview UI with circular + linear progress indicators
  - Added Retry button instead of error overlay for failed uploads
  - Better Post button state management during uploads
- **WebRTC Video Chat Fix (Feb 27, 2026):**
  - Implemented "perfect negotiation" pattern for reliable WebRTC signaling
  - Fixed ICE candidate queuing and timing issues
  - Added TURNS (TLS) support for better firewall traversal
- **Matchmaking Improvements (Feb 26, 2026):**
  - Changed from exact topic matching to exam-based matching (cross-topic battles)
  - NDA Economics can now match with NDA History (same exam, any subject)
- **UI Fixes (Feb 26, 2026):**
  - Added "Divya Tutor" to desktop navigation menu with mic icon
  - Added "Sign Up with Google" button using Emergent Auth
  - Added pagination (100 items/page) to Admin User Management & Exam Sheet Manager
- **Divya Tutor Updates (Feb 9, 2026):**
  - Audio now returned as base64 (no server storage - reduces server burden)
  - Login required to access
  - Only Divya responds to user questions (not Sher)
  - Both feminine voices: Divya=nova (higher), Sher=shimmer (bright)
  - Improved colorful Mind Map UI design
  - NotebookLM-style "Ask Now" raise hand feature during audio playback
  - Added "Divya Tutor" link to mobile navigation menu
- **Live Battles Admin System (Feb 28, 2026):**
  - Super Admin role with elevated access for battle management
  - Real-time battle monitoring dashboard via WebSocket
  - Battle reporting system for offensive content (harassment, cheating, etc.)
  - IP address tracking with privacy masking (GDPR compliant)
  - Battle session logging with duration, outcome, and user tracking
  - Admin actions: view details, terminate battles, review reports
  - Report handling: dismiss, warn user, 7-day ban, permanent ban
  - New collections: `live_battles`, `battle_reports`, `battle_session_logs`
  - API endpoints: `/api/admin/battles/*` (Super Admin only)
- **User Report Feature in 1v1 Battle (Feb 28, 2026):**
  - Added "Report User" button in video chat controls (orange flag icon)
  - Report modal with predefined reasons:
    - Nudity / Sexual Content
    - Harassment / Bullying  
    - Offensive Content
    - Cheating
    - Other Inappropriate Behavior
  - Optional description field for additional context
  - Reports automatically appear in Admin Panel under "Battle Reports"
  - False report warning to prevent abuse
- **Parents Mode Feature (Feb 28, 2026):**
  - Located in My Board (`/profile/board`)
  - Blocks 1v1 Battle Mode when enabled
  - Cannot be manually disabled by the user
  - Auto-disables after 12 hours with countdown timer
  - Blocked users see a friendly screen explaining the restriction
  - Solo practice and study materials remain accessible
  - API: `/api/user/parents-mode/status`, `/enable`, `/check-battle-access`
- **Fixed Dashboard Stats (Feb 28, 2026):**
  - Tests now count: quiz_history + battle_submissions + 1v1 matchmaking battles
  - Average score calculated across all test types (percentage-based)
  - Streak tracks consecutive days with ANY activity (quizzes, battles, rooms)
  - New `user_battle_history` collection stores battle results for stats
  - API response includes breakdown: `{ quizzes, battle_rooms, matchmaking_battles }`
  - Study hours estimated at 2 min per question (more realistic)
  - Subject mastery aggregates all test sources
- **Added BCA Exam (Feb 28, 2026):**
  - Full 3-year BCA program under "University & Degree Exams" category
  - 6 semesters with 27 subjects total
  - Includes: Programming (C, C++, Java), Data Structures, DBMS, Computer Networks, OS, etc.
  - Each subject has 4-6 units with specific topics
- **Fixed Class 7 English - Poorvi Data (Feb 28, 2026):**
  - Synced cbse_master_data.py with cbse_chapter_data.py
  - Now shows correct 15 chapters matching frontend URL
- **Fixed Admin Exam API (Feb 28, 2026):**
  - Fixed EXAM_DATA iteration bug (was treating dict as list)
- **Fixed Live Battles Admin Panel (Feb 28, 2026):**
  - Changed admin verification from "super_admin only" to "admin or super_admin"
  - Fixed matchmaking_manager import to handle missing module gracefully
  - Live Battles, Reports, and History tabs now work for all admins
- **Improved Report User Confirmation (Feb 28, 2026):**
  - After submitting report, shows confirmation screen with:
    - Green checkmark animation
    - "Complaint Raised Successfully" message
    - Reference ID for tracking
    - "What happens next?" info box explaining 24-48 hour review timeline
  - User knows their complaint was received and will be reviewed

- **Fixed Secure Admin Login (Mar 2, 2026):**
  - Created super_admin user in MongoDB (admin@ceibaa.in / SuperAdmin@123)
  - Fixed AdminDashboard.js hardcoded token check (`token !== 'admin_authenticated'`)
  - Now accepts real API tokens from /api/admin/auth/login endpoint
  - Login works with both email (admin@ceibaa.in) and username (superadmin)
  - 24-hour session expiry with token verification via /api/admin/auth/verify

- **Verified Admin Panel Pagination (Mar 2, 2026):**
  - User Management: 81 users displayed, stats cards, search, filters, badge toggles all working
  - Exam Sheet Manager: 670 sheets with 7-page pagination (100/page), First/Prev/Next/Last/Go-to buttons working
  - Both sections render correctly after admin login fix

- **Android App Setup with Capacitor 6 (Mar 2, 2026):**
  - Configured Capacitor 6 with package ID `in.ceibaa.app`, pointing to `https://ceibaa.in`
  - Generated Android app icons (all densities) and splash screens from uploaded Ceibaa logo
  - Set up push notification support via FCM (backend API + frontend service)
  - Created comprehensive build & publish guide at `frontend/ANDROID_BUILD_GUIDE.md`
  - Backend push notification APIs: register, unregister, send, list tokens

- **Notifications Pagination (Mar 2, 2026):**
  - Changed from loading all notifications to paginated fetch (20 per page)
  - Added "Load More" button with loading spinner
  - Shows "You've seen all notifications" when fully loaded
  - Faster initial page load
  - Added Header to Notifications page and JoinRoom page (both authenticated & login-required states)
  - Created custom 404 NotFound page with dark theme, animated gradient, compass icon, "Back to Home" / "Go Back" buttons, and quick navigation links
  - Added catch-all `*` route in App.js for undefined URLs

- **Follow Button Bug Fix (Mar 2, 2026):**
  - Fixed: Button reverting from "Following" back to "Follow" after tap — caused by `fetchProfile()` re-mounting the button with stale cached data. Now updates follower count locally instead of re-fetching.
  - Fixed: Notification query field mismatch (`notification_type` → `type`) preventing follow notifications from displaying
  - Added `withCredentials: true` to all follow API calls for proper cookie-based auth
  - FollowButton rewritten: click-based confirm toggle (mobile-friendly), `justFollowed` guard, outside-click dismiss
  - VictoryLane PostCardMenu: Updated icons (UserPlus/UserMinus) and kept correct API routes (`/api/social/user/follow/`)

## Bug Fixes (Mar 2026)
- **Desktop Navigation Icons Fix:** Added `shrink-0` to all nav SVGs in `Header.js` (were collapsing to 0px width)
- **AI Tutor Back Button Fix:** Conversation container now uses `fixed inset-x-0 top-16 bottom-14` positioning so back button is always visible above messages
- **Victory Lane Video Player:**
  - Custom `VideoPost` component replacing default `<video controls>`
  - Cloudinary URLs transformed: `.mov` -> `f_mp4` (MP4 format), poster from `so_0` thumbnail API
  - Auto-play on scroll into view (IntersectionObserver, 50% threshold)
  - Only one video plays at a time (global tracker pauses previous video)
  - Shows thumbnail poster instead of black screen
  - Shows duration badge (bottom-right) + mute button (top-right) + thin progress bar
  - No browser default controls
  - Loops automatically when ended
  - Error fallback: shows poster image if video can't load

## AI Voice Tutor Rebuild (Mar 14, 2026)
- **Complete rebuild of Divya Tutor** as audio-first interactive AI tutor
- **Two Tutors:** Divya (warm, `nova` voice) & Sher (exam-focused, `shimmer` voice)
- **Audio-First:** Text/voice input -> Gemini AI -> OpenAI TTS -> auto-plays audio response
- **Audio Fix:** Uses AudioContext + createMediaElementSource to bypass browser autoplay policy. Fallback "Play audio" button on each tutor message.
- **Barge-in:** Tap mic to stop tutor and ask next question
- **Multilingual:** 7 languages (en, hi, ta, mr, te, kn, bn)
- **File Upload:** PDF + JPG/PNG/WEBP image support in both modes
- **Two Modes (Tab Switcher):**
  - **Live Tutor:** Real-time audio conversation with Divya or Sher
  - **Podcast:** Upload files -> generate Divya-Sher conversation podcast with transcript + audio player
- **Backend:** `/api/divya/live/ask`, `/api/divya/live/upload-context`, `/api/divya/live/transcribe`, `/api/divya/generate-podcast`
- **Testing:** 8/9 backend pass (1 timeout), 100% frontend pass

## Pending Issues
- **Google Search Console (P1):** Add verification meta tag, submit sitemap
- **Follow Button UI Update (P2):** Replace text with icon-based button

## Upcoming Tasks
- P2: Program enrollment/payment flow (Stripe integration)
- P2: Profile badges for career program completers
- P2: "Programs Alumni" tag on leaderboard
- P2: Export test history to CSV/PDF
- P2: Mobile Number (SMS/OTP) login via Twilio/Firebase
- P2: Facebook Login via OAuth
- P2: Dedicated Referral Dashboard for tracking stats
- P2: Bookmarks page, API caching
- P3: "Follows you" badge, follower notifications

## Completed (Apr 9, 2026)
- **Test History Table migrated to Board.js** from Dashboard.js (user's explicit request)
  - TestHistoryTable with TanStack DataTable (sorting, filters, pagination, stats bar) now on /board
  - Dashboard.js cleaned up: only Posts, Quiz Rooms, Reposts tabs remain
- **CORS_ORIGINS deployment fix:** Set to `*` in backend/.env to unblock production deployment
