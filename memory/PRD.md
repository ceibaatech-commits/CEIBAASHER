# Ceibaa - Educational Platform PRD

## Original Problem Statement
Build and enhance the "Ceibaa" educational platform — a full-stack app (React, FastAPI, MongoDB, Socket.IO) featuring AI tutors, live 1v1 battles, career programs, social feeds (Victory Lane), WebRTC video chat, and real-time messaging.

## Core Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor) + Socket.IO
- **Auth**: JWT + Emergent Google Auth + Demo Login
- **Media**: Cloudinary for image uploads
- **Real-time**: Socket.IO for battles, social feed, and messaging

## What's Been Implemented

### Authentication & User Management
- JWT-based auth with demo login (demo1/demo2/demo3)
- Emergent-managed Google Auth
- Admin panel (admin@ceibaa.in / SuperAdmin@123)
- Profile system with followers, following, stats, close friends, blocking

### Profile Features
- **Edit Profile modal** (Name, Bio, Location, Website + Photo uploads)
- **Profile picture upload** via Cloudinary (400x400 face crop)
- **Cover photo upload** via Cloudinary (1500x500 fill)
- **Inline click-to-upload** on avatar and cover photo (own profile only)
- Block user for both followed and non-followed users
- Saved posts tab fetches from /api/social/bookmarks
- Quiz Attempt button navigates to quiz room or post page
- Posts on profile are clickable → opens SinglePost view
- Comment button navigates to SinglePost (with comment section)

### Victory Lane (Social Feed)
- Post creation (text, image, video, quiz rooms)
- 4 Post Card Types: Close friend indicator, Quiz trending badge, Image exam tags, Repost indicator
- Like, share, bookmark, comment actions
- Bookmark persistence to backend API
- **Reposts preserve full media/metadata** from original post (media_urls, hashtags, tags, post_type, quiz_details)
- Reposts show in feed with "X reposted" indicator

### SinglePost Page
- Matches new VictoryLane UI: repost indicator, close friend badge, quiz trending badge, image exam tags, bookmark button
- Full comment section with reply input

### Messaging System (Apr 2026)
- REST API at `/api/messages/*` + Socket.IO at `/api/messagews`
- 1-on-1 conversations, text messages, unread counts, real-time delivery
- Messages page with dark theme, sidebar + chat view, cyan-to-purple gradient bubbles
- InboxDropdown in header with unread badge
- Header visible on Messages page

### 1v1 Battles & WebRTC
- ZegoCloud Prebuilt SDK for 1v1 video calls (replaced custom WebRTC)
- AppID/ServerSecret in frontend/.env
- Minimize/maximize PiP widget, report modal
- Battle quiz with live chat, matchmaking via Socket.io

## Key API Endpoints
- `/api/auth/demo-login` — Demo login (returns access_token)
- `/api/social/feed/*` — Victory Lane feeds
- `/api/social/posts/{id}/bookmark` — Bookmark toggle
- `/api/social/posts/{id}/share` — Repost (copies full media/metadata)
- `/api/profile/update` — Update profile (PUT) incl. profile_picture, cover_photo
- `/api/profile/block` — Block user
- `/api/media/profile-upload` — Upload profile pic or cover to Cloudinary
- `/api/messages/conversations` — List/create conversations
- `/api/messages/conversations/{id}/messages` — Get/send messages

## Prioritized Backlog

### P1 (Next)
- [ ] Follow Button UI visual verification
- [ ] Google Search Console integration (need user's meta tag)
- [ ] Program enrollment/payment flow (Stripe)
- [ ] Comments/reply system on posts

### Recently Completed (Apr 2026)
- [x] 1v1 Battle Setup Page layout fix (reduced header-to-card gap, responsive padding)

### P2 (Future)
- [ ] Profile badges for career program completers
- [ ] "Programs Alumni" tag on leaderboard
- [ ] Export test history to CSV/PDF
- [ ] Dashboard.js cleanup (orphaned)
