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
- **Matchmaking Improvements (Feb 26, 2026):**
  - Changed from exact topic matching to exam-based matching (cross-topic battles)
  - NDA Economics can now match with NDA History (same exam, any subject)
  - Faster matchmaking due to larger player pools per exam
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

## Pending Issues
- P1: Update "Follow" button icon on user profiles (person head/shoulders + plus sign)

## Upcoming Tasks
- P2: Mobile Number (SMS/OTP) login via Twilio/Firebase
- P2: Facebook Login via OAuth
- P2: Dedicated Referral Dashboard for tracking stats
- P2: Bookmarks page, API caching
- P3: "Follows you" badge, follower notifications
