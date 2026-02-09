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
  - Extracted components: PostCard, VictoryLaneHeader, PostComposer, CommentsSection, CreatePostFAB, QuizRoomModal
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
- QuizRoomModal extracted with full original API behavior
- Custom hooks: useVictoryLane (607 lines), usePostCreation (188 lines)
- Class 7 English content updated
- Mobile category icons updated
- Header added to all battle pages

## Pending Issues
- P0: 1v1 Battle Video Chat - Opponent video/audio not working (WebRTC)
- P1: Mobile category filter visual verification

## Upcoming Tasks
- P1: PostCard.js refactoring (~520 lines)
- P2: Mobile Number (SMS/OTP) login via Twilio/Firebase
- P2: Facebook Login via OAuth
- P2: Dedicated Referral Dashboard for tracking stats
- P2: Bookmarks page, API caching
- P3: "Follows you" badge, follower notifications
