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

## Pending
- P2: Back button on solo practice (BLOCKED)
- P3: Contact form email (BLOCKED)

## Upcoming
- P1: Refactor VictoryLane.js (~1900 lines)
- P2: Bookmarks page, API caching
- P3: "Follows you" badge, follower notifications
