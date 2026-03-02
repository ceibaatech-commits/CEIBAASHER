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
- P1: Update "Follow" button icon on user profiles (person head/shoulders + plus sign)
- P0: 1v1 Battle Video Chat - Opponent video/audio not working (WebRTC)

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

## Pending Issues
- P1: Update "Follow" button icon on user profiles (person head/shoulders + plus sign)

## Upcoming Tasks
- P2: Mobile Number (SMS/OTP) login via Twilio/Firebase
- P2: Facebook Login via OAuth
- P2: Dedicated Referral Dashboard for tracking stats
- P2: Bookmarks page, API caching
- P3: "Follows you" badge, follower notifications
