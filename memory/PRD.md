# Ceibaa - Educational Platform PRD

## Original Problem Statement
Build and enhance the "Ceibaa" educational platform — a full-stack app (React, FastAPI, MongoDB, Socket.IO) featuring AI tutors, live 1v1 battles, career programs, social feeds (Victory Lane), WebRTC video chat, and real-time messaging.

## Core Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor) + Socket.IO
- **Auth**: JWT + Emergent Google Auth + Demo Login
- **Real-time**: Socket.IO for battles, social feed, and messaging

## What's Been Implemented

### Authentication & User Management
- JWT-based auth with demo login (demo1/demo2/demo3)
- Emergent-managed Google Auth
- Admin panel (admin@ceibaa.in / SuperAdmin@123)
- Profile system with followers, following, stats, close friends, blocking

### Victory Lane (Social Feed)
- Post creation (text, image, video, quiz rooms)
- 4 Post Card Types: Close friend indicator, Quiz trending badge, Image exam tags, Repost indicator
- Like, share, bookmark, comment actions
- Bookmark persistence to backend API

### Messaging System (Apr 2026)
- REST API at `/api/messages/*` + Socket.IO at `/api/messagews`
- 1-on-1 conversations, text messages, unread counts, real-time delivery
- Messages page with dark theme, sidebar + chat view, cyan-to-purple gradient bubbles
- InboxDropdown in header with unread badge
- Profile "Message" button creates/navigates conversations

### Profile Features
- Edit Profile modal (Name, Bio, Location, Website) → PUT /api/profile/update
- Block user available for both followed and non-followed users
- Saved posts tab fetches from /api/social/bookmarks
- Quiz Attempt button navigates to quiz room or post page

### SinglePost Page
- Updated to match new VictoryLane UI: repost indicator, close friend badge, quiz trending badge, image exam tags, bookmark button

### 1v1 Battles & WebRTC
- WebRTC video chat with ICE restarts
- Minimize/maximize without black screen
- Battle history saved to MongoDB

### Test History & Board
- TanStack React Table on Board.js
- Quiz results with real user_name persistence

## Key API Endpoints
- `/api/auth/demo-login` — Demo login (returns access_token)
- `/api/social/feed/*` — Victory Lane feeds
- `/api/social/posts/{id}/bookmark` — Bookmark toggle
- `/api/social/bookmarks` — Get user bookmarks
- `/api/profile/{username}` — User profile
- `/api/profile/update` — Update profile (PUT)
- `/api/profile/block` — Block user (POST)
- `/api/profile/close-friend-ids` — Close friend IDs
- `/api/messages/conversations` — List/create conversations
- `/api/messages/conversations/{id}/messages` — Get/send messages
- `/api/messages/unread-count` — Total unread count

## Key Files
- `/app/backend/messaging_routes.py` — Messaging REST API
- `/app/backend/messaging_socketio.py` — Messaging Socket.IO
- `/app/frontend/src/pages/Messages.js` — Messaging page
- `/app/frontend/src/components/InboxDropdown.js` — Header inbox
- `/app/frontend/src/components/VictoryLane/PostCard.js` — 4 card types
- `/app/frontend/src/pages/Profile.js` — User profile with Edit modal + Saved tab
- `/app/frontend/src/pages/SinglePost.js` — Post detail with new UI
- `/app/frontend/src/components/FollowButton.js` — Follow/block popups

## Prioritized Backlog

### P1 (Next)
- [ ] Follow Button UI visual verification
- [ ] Google Search Console integration (need user's meta tag)
- [ ] Program enrollment/payment flow (Stripe)
- [ ] Comments/reply system on posts

### P2 (Future)
- [ ] Profile badges for career program completers
- [ ] "Programs Alumni" tag on leaderboard
- [ ] Export test history to CSV/PDF
- [ ] Dashboard.js cleanup (orphaned)
