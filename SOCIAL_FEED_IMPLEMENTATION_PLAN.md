# Ceibaa Social Feed - Complete Implementation Plan

## Phase 1: Database Schema & Models ✓
- Extended user profiles with social features
- Posts collection (6 types)
- Comments (nested)
- Likes, Shares, Gifts
- Followers/Following
- Study Groups
- Notifications
- Badges/Achievements

## Phase 2: Backend APIs (25+ endpoints)
### User APIs
- GET /api/social/user/:userId - Get user profile with stats
- PUT /api/social/user/profile - Update profile
- POST /api/social/user/follow/:userId - Follow user
- DELETE /api/social/user/follow/:userId - Unfollow user
- GET /api/social/user/:userId/followers - Get followers
- GET /api/social/user/:userId/following - Get following
- GET /api/social/user/:userId/stats - Get user stats

### Post APIs
- POST /api/social/posts - Create post
- GET /api/social/feed/for-you - Personalized feed
- GET /api/social/feed/trending - Trending posts
- GET /api/social/feed/following - Following feed
- GET /api/social/feed/leaderboard - Leaderboard posts
- GET /api/social/feed/my-circle - Circle feed
- GET /api/social/posts/:postId - Get single post
- DELETE /api/social/posts/:postId - Delete post

### Engagement APIs
- POST /api/social/posts/:postId/like - Like post
- DELETE /api/social/posts/:postId/like - Unlike post
- POST /api/social/posts/:postId/comment - Add comment
- POST /api/social/comments/:commentId/reply - Reply to comment
- POST /api/social/posts/:postId/share - Share post
- POST /api/social/posts/:postId/gift - Send gift
- POST /api/social/posts/:postId/challenge - Challenge user

### Study Group APIs
- POST /api/social/groups - Create study group
- GET /api/social/groups - Get user's groups
- POST /api/social/groups/:groupId/join - Join group
- GET /api/social/groups/:groupId/posts - Get group posts

### Notification APIs
- GET /api/social/notifications - Get notifications
- PUT /api/social/notifications/:id/read - Mark as read

## Phase 3: Authentication & SSO
- React Context for auth state
- Persistent login with localStorage
- Auto-login on page refresh
- Protected routes
- User session management

## Phase 4: Frontend Components
### Core Components
- SocialFeed.js (main container)
- FeedTabs.js (For You, Trending, etc.)
- PostCard.js (universal post component)
- PostTypes:
  - BattleVictoryPost.js
  - LiveQuizAnnouncement.js
  - StudyTipPost.js
  - AchievementPost.js
  - GovernmentPost.js
  - VideoPost.js
- CreatePostModal.js
- CommentSection.js (with nested replies)
- EngagementButtons.js
- UserProfileCard.js
- StudyGroupCard.js

### Pages
- SocialFeed.js (rebuilt)
- UserProfile.js (detailed profile)
- StudyGroups.js
- Notifications.js

## Phase 5: Advanced Features
- Real-time updates (Socket.io)
- Image/video upload
- Gift system with coins
- Battle challenge system
- Content moderation tools
- Analytics tracking

## Implementation Order:
1. Backend database models & schemas
2. Backend API routes
3. Auth context & SSO
4. Frontend core components
5. Feed algorithm implementation
6. Advanced features integration
7. Testing & optimization
