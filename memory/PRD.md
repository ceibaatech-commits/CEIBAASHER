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

### Referral System
- Share & Earn button, QR code, social sharing
- 1 coin per referral, coin leaderboard

### Battle System - WebRTC Video (NEW)
- 1v1 peer-to-peer video/audio during exam battles
- WhatsApp-style floating PiP layout
- Mute/unmute audio, toggle video, end call
- Auto-cleanup when battle ends or user navigates away
- Backend signaling via Socket.IO (offer/answer/ICE)
- STUN servers: Google public STUN
- Files: `/app/frontend/src/components/BattleVideoChat.js`, integrated in `LiveBattle.js`

### Admin Panel
- Global media toggle (master + images + videos)
- Per-user media permissions
- User management

## Bug Fixes (Dec 2025)
- Auth misattribution, reply endpoint, like auto-revert, missing badges
- Profile ID mismatch for disabled users
- Media permission chain (global + per-user + upload endpoint)

## Bug Fixes (Feb 2026)
- ✅ "Share & Earn" button visibility - Fixed profile ID in API response + useEffect dependency
- ✅ 1v1 Battle Video Chat rendering - Fixed by wrapping all battle states with `withVideoChat()` in `LiveBattleMode.js`

## Verified Features (Feb 6, 2026)
- ✅ "Share & Earn" button - Visible on user's own profile with Edit Profile button
- ✅ 1v1 Battle Video Chat - "Video Call" button appears on all battle states (setup, searching)
- ✅ Demo users (demo1/demo1, demo2/demo2) - Working with database persistence

## Pending
- P2: Back button on solo practice (BLOCKED)
- P3: Contact form email (BLOCKED)

## Upcoming
- P1: Refactor VictoryLane.js (~1900 lines)
- P2: Mobile Number (SMS/OTP) login via Twilio/Firebase
- P2: Facebook Login via OAuth
- P2: Dedicated Referral Dashboard for tracking stats
- P2: Bookmarks page, API caching
- P3: "Follows you" badge, follower notifications
