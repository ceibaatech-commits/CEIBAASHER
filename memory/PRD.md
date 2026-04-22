# Ceibaa - Educational Platform PRD

## Original Problem Statement
Build and enhance the "Ceibaa" educational platform — a full-stack app (React, FastAPI, MongoDB, Socket.IO) featuring AI tutors, live 1v1 battles, career programs, social feeds (Victory Lane), WebRTC video chat, real-time messaging, and a Recruitment & Internship Portal.

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
- Edit Profile modal (Name, Bio, Location, Website + Photo uploads)
- Profile picture upload via Cloudinary (400x400 face crop)
- Cover photo upload via Cloudinary (1500x500 fill)
- Inline click-to-upload on avatar and cover photo (own profile only)
- Block user for both followed and non-followed users
- Saved posts tab fetches from /api/social/bookmarks

### Victory Lane (Social Feed)
- Post creation (text, image, video, quiz rooms)
- Like, share, bookmark, comment actions
- Bookmark persistence to backend API
- Reposts preserve full media/metadata from original post

### Messaging System
- REST API at `/api/messages/*` + Socket.IO at `/api/messagews`
- 1-on-1 conversations, text messages, unread counts, real-time delivery

### 1v1 Battles & WebRTC
- ZegoCloud Prebuilt SDK for 1v1 video calls
- Battle quiz with live chat, matchmaking via Socket.io

### Recruitment & Internship Portal (Feb 2026)
- **3 Roles**: Student (uses existing Ceibaa auth), Recruiter (separate login), Admin (separate login)
- **4 Post Types**: Job/Internship, MCQ Quiz, Hackathon, Event
- **13 Frontend Pages**: JobsFeed, DiscoverCompanies, CompanyChannel, RecruiterLogin, RecruiterDashboard, RecruiterAnalytics, CreatePost, ManageApplicants, ApplyJob, QuizAttempt, HackathonDetail, MyApplications, RecruitmentCell (Admin)
- **Backend**: recruitment_routes.py (23 endpoints), recruitment_admin_routes.py (8 endpoints)
- **Seed Data**: 5 companies, 8 students with AIR ranks, 6 sample posts, 1 admin
- **Key Features**: Company follow, post moderation queue, AIR rank filtering, quiz engine integration, hackathon registration, event RSVP, recruiter analytics

## Key API Endpoints
- `/api/auth/demo-login` — Demo login
- `/api/social/feed/*` — Victory Lane feeds
- `/api/profile/update` — Update profile
- `/api/messages/conversations` — Messaging
- `/api/recruitment/recruiter/login` — Recruiter login
- `/api/recruitment-admin/login` — Recruitment admin login
- `/api/recruitment/companies` — List companies
- `/api/recruitment/feed` — Recruitment feed
- `/api/recruitment/posts` — Create post (recruiter)
- `/api/recruitment/apply/{post_id}` — Apply to job (student)
- `/api/recruitment/quiz/{quiz_id}/start` — Start quiz
- `/api/recruitment/hackathon/{id}/register` — Register hackathon
- `/api/recruitment/analytics` — Recruiter analytics
- `/api/recruitment-admin/recruiters` — Manage recruiters
- `/api/recruitment-admin/pending-posts` — Moderation queue

## Prioritized Backlog

### P0 (Next)
- [x] Email service for credential delivery & event reminders (Resend — sandbox mode, needs domain verification for production)

### P1
- [x] Resume upload feature (Cloudinary, PDF/DOC/DOCX, 5MB limit)
- [x] Bulk applicant actions (shortlist by AIR rank, bulk status change)
- [x] CSV export of applicants
- [x] Quiz leaderboard auto-shortlist feature
- [ ] Program enrollment/payment flow (Stripe)
- [x] Comments/reply system on posts (threaded, with likes)
- [x] Admin company verification panel (GST/PAN/CIN edit, document upload to Cloudinary, email verification)

### P2
- [ ] Real-time notifications on application status change
- [ ] Follow Button UI visual verification
- [ ] Google Search Console integration
- [ ] Profile badges, Alumni tags
- [ ] Export test history to CSV/PDF
- [ ] ExamSheetManager.js further decomposition (1733 lines)

### Recently Completed (Feb 2026)
- [x] Recruitment & Internship Portal — Full integration (16 files, all tested 100%)
- [x] Student auth integration with recruitment module (uses existing Ceibaa JWT)
- [x] Recruitment seed data on backend startup
- [x] Header nav: "Canopy" renamed to "The Headhunt" → links to /jobs
- [x] /jobs and /discover pages redesigned with Header, Footer, light theme matching Courses page
- [x] All recruitment student pages (/my-applications, /company/:slug, /apply/:jobId, /hackathon/:hackId, /quiz-recruit/:quizId) updated with Header, Footer, and light theme
- [x] Social actions on recruitment feed (Like, Comment, Share, Bookmark) with backend APIs
- [x] Saved posts tab in /my-applications
- [x] Brute force protection on admin/recruiter login (5 attempts → 15min lockout)
- [x] Google OAuth fix — useRef guard for StrictMode, hash+query param session_id extraction
- [x] Emergent Auth JWT issuance alongside session_token
- [x] Agora RTC token generation endpoint (GET /api/agora/token)
- [x] 1v1 Battle page complete redesign — cream/pink/red/blue color scheme, mobile+desktop layouts
- [x] Video call flow: manual start via socket vc_request/vc_accepted/vc_declined/vc_ended
- [x] Answer cards: red highlight for self, blue for opponent
- [x] Battle results redesign: Victory/Lost/Draw with color-coded score cards
- [x] Matchmaking already matches by exam only (cross-topic within same exam)

### Earlier Completed
- [x] 1v1 Battle Setup Page layout fix
- [x] ZegoCloud SDK integration for video battles
- [x] Chapter Tests page redesign with Neo-Brutalist UI
- [x] Backend Code Quality fixes (socket_proxy, secrets, circular deps)
- [x] Component decomposition (Board.js, ExamSheetManager.js)
- [x] Messaging system
