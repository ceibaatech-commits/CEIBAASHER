# Ceibaa - Educational Quiz & Social Platform

## Original Problem Statement
Full-stack educational quiz platform with social feed (Victory Lane), battle system, exam management, and user profiles.

## Core Architecture
- **Frontend**: React + Shadcn UI + Framer Motion + react-qr-code
- **Backend**: FastAPI + MongoDB
- **Auth**: JWT (email/password) + Emergent Auth (Google OAuth) with session tokens
- **Real-time**: Socket.IO for social feed updates

## What's Been Implemented

### Authentication
- JWT-based login/signup
- Emergent Google OAuth integration
- Dual auth support (JWT + session tokens) across all social endpoints

### Social Feed (Victory Lane)
- Post creation, likes/unlikes, comments/replies, repost/share
- Engagement hydration, For-you/Trending/Following feeds
- Badge enrichment from user profiles on all feed endpoints

### Referral System (NEW - Dec 2025)
- Unique referral code generation per user (8-char alphanumeric)
- Share & Earn button on own profile page
- Share modal with: Copy link, WhatsApp, Twitter/X, Facebook, LinkedIn, Email, QR code
- Custom message: "Follow me @username on Ceibaa - India's first Social Learning Platform"
- 1 coin awarded per successful referral signup
- Coin Board leaderboard (top referrers sorted by coins)
- Self-referral and duplicate referral prevention
- Referral badge shown on signup page when ?ref= param present
- Notification sent to referrer on successful referral
- Backend: /app/backend/referral_routes.py
- Frontend: /app/frontend/src/components/ShareReferralModal.js

### UI/UX
- Homepage category drawer/accordion (framer-motion)
- Slide-up post composer (X/Twitter style)
- Header on auth pages, mobile keyboard input fixes

## Bug Fixes (December 2025)
- Critical auth bug: Post misattribution after re-login
- Reply submission: endpoint URL mismatch (plural vs singular)
- Like auto-revert: SinglePost always called POST, and backend get_optional_user_id only decoded JWT
- Missing badges on feed: isProfessor not stored on posts, feed didn't enrich from users

## Pending Issues
- **P2**: Back button on solo practice page (BLOCKED - need repro steps)
- **P3**: Contact form email delivery (BLOCKED - Resend domain verification)

## Upcoming Tasks
- **P1**: Add database indexes for performance
- **P1**: Refactor VictoryLane.js (~1900 lines)
- **P2**: Facebook & Mobile Number login
- **P2**: Bookmarks page
- **P2**: API response caching

## Future/Backlog
- "Follows you" badge on profiles
- Consolidate static exam pages
- Follower notifications
- Consolidate cbse data files

## Key API Endpoints - Referral
- `GET /api/referral/my-code` - Get/generate referral code + stats (auth required)
- `GET /api/referral/leaderboard` - Top referrers by coins (public)
- `GET /api/referral/validate/{code}` - Validate referral code (public)
- `POST /api/auth/signup` - Now accepts `referral_code` field

## DB Collections - Referral
- `users.referral_code` - Unique 8-char code
- `users.referral_coins` - Integer coin count
- `referrals` - Tracks referrer_id, referred_user_id, status, coins_awarded
