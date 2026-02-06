# Ceibaa - Educational Quiz & Social Platform

## Original Problem Statement
Full-stack educational quiz platform with social feed (Victory Lane), battle system, exam management, and user profiles.

## Core Architecture
- **Frontend**: React + Shadcn UI + Framer Motion
- **Backend**: FastAPI + MongoDB
- **Auth**: JWT (email/password) + Emergent Auth (Google OAuth) with session tokens
- **Real-time**: Socket.IO for social feed updates

## What's Been Implemented

### Authentication
- JWT-based login/signup
- Emergent Google OAuth integration
- Dual auth support (JWT + session tokens) across all social endpoints

### Social Feed (Victory Lane)
- Post creation (general, quiz, academic, battle victory, etc.)
- Like/unlike with real-time updates
- Comments/replies system
- Repost/share functionality
- Engagement hydration (X-algorithm inspired)
- For-you, Trending, Following feeds

### UI/UX
- Homepage category drawer/accordion (framer-motion)
- Slide-up post composer (X/Twitter style)
- Header on auth pages
- Mobile keyboard input fixes

## Bug Fixes (December 2025)
- **Critical auth bug**: Post misattribution after re-login (fixed token handling)
- **Reply submission failing**: SinglePost.js called `/comments` (plural) but backend expected `/comment` (singular) - 405 error
- **Like auto-revert**: SinglePost.js `handleLike()` always called POST even for unlike - fixed to use DELETE
- **Like state not persisting**: `get_optional_user_id()` only decoded JWT, not session tokens - created async version supporting both

## Pending Issues
- **P2**: Back button on solo practice page (BLOCKED - need repro steps)
- **P3**: Contact form email delivery (BLOCKED - Resend domain verification)
- **P3**: Pre-existing lint errors in Login.js, Signup.js, Home.js

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

## Key Files
- `/app/backend/social_feed_routes.py` - Social feed API endpoints
- `/app/frontend/src/pages/SinglePost.js` - Single post view
- `/app/frontend/src/pages/VictoryLane.js` - Social feed page
- `/app/frontend/src/context/AuthContext.js` - Auth state management
- `/app/backend/tests/test_post_interactions.py` - Post interaction tests
