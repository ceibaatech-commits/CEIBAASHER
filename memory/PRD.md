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
- 4 Post Card Types:
  - Close friend indicator (teal badge)
  - Quiz trending badge with stats (Attempts/Avg score/Rank)
  - Image exam tags from hashtags (color-coded EXAM_COLORS map)
  - Repost indicator ("X reposted")
- Like, share, bookmark, comment actions
- Bookmark persistence to backend API (fixed)
- Profile "Saved" tab fetches and displays bookmarks

### Messaging System (NEW - Apr 2026)
- **Backend**: REST API at `/api/messages/*` + Socket.IO at `/api/messagews`
- **Collections**: `conversations`, `messages`
- **Features**: 
  - 1-on-1 conversations (create/get idempotent)
  - Send text messages, message history
  - Unread counts, mark-as-read
  - Real-time delivery via Socket.IO
  - Typing indicators
- **Frontend**: 
  - `/messages` page with dark theme (bg-gray-950)
  - Sidebar with conversation list + search
  - Chat view with cyan-to-purple gradient bubbles (own) / gray (other)
  - Back button, auto-scroll, read receipts
  - InboxDropdown in header with unread badge
  - Profile "Message" button creates conversation and navigates
  - Messages link in profile dropdown menu

### 1v1 Battles & WebRTC
- WebRTC video chat with ICE restarts
- Minimize/maximize without black screen (remoteStreamRef)
- Battle history saved to MongoDB

### Test History & Board
- TanStack React Table on Board.js
- Quiz results with real user_name persistence

### Career Programs/Courses
- Course listing and detail pages
- Admin program manager

## Key API Endpoints
- `/api/auth/demo-login` — Demo login (returns access_token)
- `/api/auth/login` — Email login
- `/api/social/feed/*` — Victory Lane feeds
- `/api/social/posts/{id}/bookmark` — Bookmark toggle (POST/DELETE)
- `/api/social/bookmarks` — Get user bookmarks
- `/api/profile/{username}` — User profile
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
- `/app/frontend/src/pages/Profile.js` — User profile with Saved tab

## Prioritized Backlog

### P0 (Complete)
- [x] Victory Lane 4 card types
- [x] Saved posts tab fix
- [x] Bookmark API persistence fix
- [x] Messaging system (MongoDB + Socket.IO)
- [x] Message button on profiles
- [x] Inbox dropdown in header
- [x] Messages page back button + search icon fix

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
