# Social Features - Complete User Flow Design
## Ceibaa Educational Social Platform

---

## 🎯 Overview
Instagram + Twitter inspired social layer for educational quiz platform with profile management, follow system, activity feeds, privacy controls, and notifications.

---

## 📊 ARCHITECTURE

### Routes Structure
```
/dashboard              → Private profile settings & stats (logged-in user only)
/profile/:username      → Public profile view (visible to others)
/notifications          → Notification center
/settings/privacy       → Privacy & account settings
```

### Data Models

#### User Profile Extended
```javascript
{
  user_id: "uuid",
  username: "unique_handle",
  name: "Display Name",
  email: "email@domain.com",
  bio: "User biography (max 150 chars)",
  profile_picture: "url",
  cover_photo: "url",
  location: "City, Country",
  exam_focus: ["JEE", "NEET"],
  
  // Privacy
  is_private: false,          // Public by default
  
  // Stats
  followers_count: 0,
  following_count: 0,
  posts_count: 0,
  quiz_rooms_created: 0,
  total_score: 0,
  avg_score: 0,
  
  // Engagement
  joined_at: "2025-01-14",
  last_active: "2025-01-14T10:30:00Z",
  streak_days: 5,
  badges: ["Quiz Master", "Top Scorer"]
}
```

#### Follow Relationship
```javascript
{
  id: "uuid",
  follower_id: "user_id",        // Person doing the follow
  following_id: "user_id",        // Person being followed
  status: "approved/pending",     // pending for private accounts
  created_at: "timestamp"
}
```

#### Notification
```javascript
{
  id: "uuid",
  user_id: "recipient_user_id",
  type: "follow/like/comment/quiz_created/score_beaten/daily_streak",
  actor_id: "user_who_triggered_notification",
  actor_name: "Actor Display Name",
  actor_avatar: "url",
  content: "notification message",
  reference_id: "post_id or quiz_id",
  is_read: false,
  created_at: "timestamp"
}
```

---

## 🔄 USER FLOWS

### 1. PROFILE MANAGEMENT FLOW

#### A. View Own Dashboard (`/dashboard`)
**Entry Points:**
- Click profile picture in header
- Navigate to "My Profile" from menu

**Dashboard Sections:**
```
┌─────────────────────────────────────────┐
│  HEADER: Cover Photo + Profile Picture  │
│  - Edit Profile Button (top right)      │
│  - Settings Icon                         │
├─────────────────────────────────────────┤
│  STATS ROW                               │
│  [123 Posts] [456 Followers] [789 Fol..] │
├─────────────────────────────────────────┤
│  BIO SECTION                             │
│  - Editable bio (150 chars)             │
│  - Location, Exam Focus                 │
├─────────────────────────────────────────┤
│  TABS                                    │
│  [Posts] [Liked] [Quiz Rooms] [Stats]   │
├─────────────────────────────────────────┤
│  CONTENT AREA                            │
│  - Timeline of user's activity          │
└─────────────────────────────────────────┘
```

**Actions:**
1. Edit Profile → Opens edit modal
2. Click followers → Shows followers list
3. Click following → Shows following list
4. Switch tabs → Updates content area
5. Settings → Navigate to privacy settings

#### B. Edit Profile
**Trigger:** Click "Edit Profile" button

**Edit Modal Fields:**
- Profile Picture (upload/change)
- Cover Photo (upload/change)
- Name (text input)
- Bio (textarea, 150 char limit)
- Location (text input)
- Exam Focus (multi-select: JEE, NEET, SSC, etc.)
- Website (optional URL)

**Actions:**
- Save Changes → Updates profile, shows success toast
- Cancel → Closes modal without saving
- Upload Image → Opens file picker, preview before save

---

### 2. PUBLIC PROFILE FLOW (`/profile/:username`)

#### A. Viewing Another User's Profile

**Entry Points:**
- Click username anywhere in app
- Click profile picture on posts
- From followers/following list
- From quiz leaderboard

**Public Profile Layout:**
```
┌─────────────────────────────────────────┐
│  HEADER: Cover Photo + Profile Picture  │
│  [Follow Button] or [Following ✓]       │
│  OR [Requested] (if private & pending)   │
├─────────────────────────────────────────┤
│  USER INFO                               │
│  @username                               │
│  Bio text here...                        │
│  📍 Location | 🎓 JEE, NEET            │
├─────────────────────────────────────────┤
│  STATS ROW                               │
│  [X Posts] [Y Followers] [Z Following]   │
│  (clickable if public or approved)       │
├─────────────────────────────────────────┤
│  TABS                                    │
│  [Posts] [Quiz Rooms]                    │
│  (if private & not following: locked 🔒) │
├─────────────────────────────────────────┤
│  CONTENT AREA                            │
│  - User's posts & quiz rooms             │
│  OR "This account is private"            │
└─────────────────────────────────────────┘
```

#### B. Profile Visibility Matrix

| Account Type | Not Following | Follow Requested | Following |
|--------------|---------------|------------------|-----------|
| **Public** | ✅ Full profile | N/A | ✅ Full profile |
| **Private** | 🔒 Picture + name only | ⏳ Picture + name + "Requested" | ✅ Full profile |

---

### 3. FOLLOW SYSTEM FLOW

#### A. Follow Public Account
**Steps:**
1. User clicks "Follow" button on public profile
2. Button changes to "Following ✓" (filled style)
3. Notification sent to profile owner: "[Name] started following you"
4. Following count increments for user
5. Followers count increments for profile owner

**Unfollow:**
1. Click "Following ✓" button
2. Confirmation dialog: "Unfollow @username?"
3. On confirm: Button reverts to "Follow"
4. Counts decrement

#### B. Follow Private Account
**Steps:**
1. User clicks "Follow" button on private profile
2. Button changes to "Requested" (pending state)
3. Notification sent to profile owner: "[Name] requested to follow you"
4. Profile owner sees notification with [Accept] [Decline] buttons

**Profile Owner Actions:**
- **Accept**: 
  - Follow relationship status → "approved"
  - Requester can now see full profile
  - Notification sent: "[Name] accepted your follow request"
  - Counts increment
  
- **Decline**:
  - Follow relationship deleted
  - Requester's button reverts to "Follow"
  - No notification sent

**Cancel Request:**
- Requester can click "Requested" to cancel
- Follow relationship deleted
- Button reverts to "Follow"

---

### 4. ACTIVITY FEED FLOW

#### A. Home Feed Algorithm (`/social-feed`)

**Feed Composition:**
```
┌─────────────────────────────────────────┐
│  TABS: [For You] [Following]            │
├─────────────────────────────────────────┤
│  FOR YOU TAB                             │
│  - Following posts (70%)                 │
│  - Recommended posts (30%)               │
│    * Users with same exam focus          │
│    * Popular posts in user's subjects    │
│    * Users from recent quiz rooms        │
│  - Sorted by: recency + engagement       │
├─────────────────────────────────────────┤
│  FOLLOWING TAB                           │
│  - Only posts from followed users        │
│  - Chronological order (newest first)    │
│  - Quiz rooms from followed users        │
│    (respects 24-hour TTL)                │
└─────────────────────────────────────────┘
```

#### B. Profile Timeline

**Posts Tab:**
- All posts created by user
- Reverse chronological
- Includes text posts, quiz results, achievements

**Liked Tab:**
- All posts user has liked
- Shows original poster info
- Clickable to view post detail

**Quiz Rooms Tab:**
- Rooms created by user
- Rooms participated in
- Shows room code, score, rank
- Respects 24-hour TTL (expired rooms hidden)

---

### 5. NOTIFICATIONS FLOW

#### A. Notification Center (`/notifications`)

**Layout:**
```
┌─────────────────────────────────────────┐
│  NOTIFICATIONS                           │
│  [All] [Follows] [Likes] [Comments]     │
├─────────────────────────────────────────┤
│  📸 [Avatar] @user1 started following you│
│     → 2 hours ago                        │
├─────────────────────────────────────────┤
│  ❤️ [Avatar] @user2 liked your post     │
│     "I just scored 450 in..."            │
│     → 5 hours ago                        │
├─────────────────────────────────────────┤
│  💬 [Avatar] @user3 commented: "Great!"  │
│     → 1 day ago                          │
├─────────────────────────────────────────┤
│  🎯 [Avatar] @user4 beat your score!     │
│     Quiz: JEE Physics (Room: ABC123)     │
│     → 2 days ago                         │
└─────────────────────────────────────────┘
```

#### B. Notification Types & Triggers

**1. Follow Notification**
- **Trigger**: User A follows User B (approved)
- **Recipient**: User B
- **Content**: "[User A name] started following you"
- **Action**: Click → Navigate to User A's profile

**2. Like Notification**
- **Trigger**: User A likes User B's post
- **Recipient**: User B
- **Content**: "[User A name] liked your post"
- **Action**: Click → Navigate to post detail

**3. Comment Notification**
- **Trigger**: User A comments on User B's post
- **Recipient**: User B
- **Content**: "[User A name] commented: [comment text preview]"
- **Action**: Click → Navigate to post with comment highlighted

**4. Quiz Created Notification**
- **Trigger**: Followed user creates a quiz room
- **Recipients**: All followers
- **Content**: "[User name] created a new quiz room: [title]"
- **Action**: Click → Navigate to quiz room

**5. Score Beaten Notification**
- **Trigger**: User A scores higher than User B in same quiz
- **Recipient**: User B
- **Content**: "[User A name] beat your score in [Quiz Title]!"
- **Action**: Click → Navigate to quiz leaderboard

**6. Daily Streak Reminder**
- **Trigger**: Cron job (daily at 8 PM user's timezone)
- **Recipient**: Users with active streak
- **Content**: "🔥 Don't break your [X] day streak! Take a quiz today"
- **Action**: Click → Navigate to quiz selection

#### C. Notification Interactions

**Mark as Read:**
- Auto-mark when user clicks notification
- Manual "Mark all as read" button
- Read notifications: grey color, lower opacity

**Delete:**
- Swipe left → Delete button
- Bulk delete old notifications (>30 days)

**Badge Count:**
- Red dot on notification icon in header
- Shows unread count (max: 99+)
- Clears when notification center opened

---

### 6. PRIVACY CONTROLS FLOW

#### A. Account Privacy Settings (`/settings/privacy`)

**Settings Options:**
```
┌─────────────────────────────────────────┐
│  PRIVACY SETTINGS                        │
├─────────────────────────────────────────┤
│  Account Privacy                         │
│  ◯ Public (anyone can see your profile) │
│  ◉ Private (only followers can see)     │
├─────────────────────────────────────────┤
│  Activity Status                         │
│  ☑ Show when I'm online                 │
│  ☐ Show last active time                │
├─────────────────────────────────────────┤
│  Follower Requests                       │
│  (X pending requests)                    │
│  → View Requests                         │
├─────────────────────────────────────────┤
│  Blocked Users                           │
│  → Manage blocked accounts (0)          │
└─────────────────────────────────────────┘
```

#### B. Follower Requests Management

**Pending Requests List:**
- Shows all pending follow requests
- Each request displays:
  - Profile picture
  - Name & username
  - Mutual followers (if any)
  - [Accept] [Decline] buttons

**Actions:**
- Accept → Approve follow, send notification
- Decline → Reject request, no notification
- Accept All / Decline All (if >5 requests)

---

### 7. SUGGESTED USERS FLOW

#### A. Discovery Algorithm

**User Suggestions Based On:**
1. **Same Exam Focus** (40% weight)
   - Users preparing for same exams (JEE/NEET/SSC)

2. **Quiz Room Interactions** (30% weight)
   - Users participated in same quiz rooms
   - Users with similar quiz performance

3. **Subject Overlap** (20% weight)
   - Users studying same subjects

4. **Mutual Connections** (10% weight)
   - Friends of friends (2nd degree connections)

#### B. Suggested Users UI

**Location:** 
- Right sidebar on `/social-feed`
- Dedicated section in `/discover`

**Card Layout:**
```
┌─────────────────────────────────┐
│  Suggested for you              │
├─────────────────────────────────┤
│  [Avatar] @username             │
│  Display Name                   │
│  "Based on: JEE focus"          │
│  [Follow] button                │
├─────────────────────────────────┤
│  [Avatar] @username2            │
│  Display Name                   │
│  "Played in same quiz"          │
│  [Follow] button                │
└─────────────────────────────────┘
```

---

## 🎨 UI/UX SPECIFICATIONS

### Design System

#### Profile Page Design (Instagram + Twitter Mix)

**Visual Style:**
- Clean, minimal design
- Large hero images (cover photo)
- Circular profile pictures
- Card-based content layout
- Smooth animations & transitions

**Color Palette:**
- Primary: Indigo gradient (#4F46E5 → #7C3AED)
- Secondary: Purple/Pink accents
- Neutral: Grey scale for text
- Success: Green (#10B981)
- Error: Red (#EF4444)

**Typography:**
- Headers: Bold, 24-32px
- Body: Regular, 14-16px
- Meta info: Light, 12-14px

#### Interactive Elements

**Follow Button States:**
```css
Default (Not Following):
- Background: White
- Border: 2px solid #E5E7EB
- Text: "Follow"
- Hover: Background #F3F4F6

Following:
- Background: #EFF6FF (light blue)
- Border: 2px solid #3B82F6
- Text: "Following ✓"
- Hover: Background #DC2626 (red), Text "Unfollow"

Requested:
- Background: #FEF3C7 (light yellow)
- Border: 2px solid #F59E0B
- Text: "Requested"
- Hover: Background #FEE2E2, Text "Cancel Request"
```

**Notification Badge:**
- Position: Absolute top-right of bell icon
- Size: 18px circle
- Background: Red (#EF4444)
- Text: White, bold, 11px
- Animation: Pulse on new notification

---

## 🔔 NOTIFICATION SYSTEM SPECS

### Real-Time Delivery
- WebSocket connection for instant notifications
- Fallback: Polling every 30s when socket unavailable
- Push notifications (browser permission required)

### Notification Grouping
- Group similar notifications: "[User1], [User2], and 5 others liked your post"
- Time-based grouping: Show latest 3, collapse older

### Notification Settings
```
┌─────────────────────────────────────────┐
│  NOTIFICATION PREFERENCES                │
├─────────────────────────────────────────┤
│  Push Notifications                      │
│  ☑ New follower                          │
│  ☑ Post likes                            │
│  ☑ Comments on my posts                  │
│  ☑ Quiz room created                     │
│  ☑ Score beaten                          │
│  ☑ Daily streak reminder                 │
├─────────────────────────────────────────┤
│  Email Notifications                     │
│  ☑ Weekly summary                        │
│  ☐ Daily digest                          │
└─────────────────────────────────────────┘
```

---

## 📱 RESPONSIVE BEHAVIOR

### Mobile Adaptations

**Profile Page:**
- Single column layout
- Sticky header with cover photo
- Bottom navigation for tabs
- Simplified stats row (icons only)

**Notification Center:**
- Full-screen overlay
- Swipe to dismiss
- Pull to refresh

**Follow Buttons:**
- Larger touch targets (min 44x44px)
- Confirmation dialogs for unfollow

---

## ⚡ PERFORMANCE CONSIDERATIONS

### Optimization Strategies

1. **Lazy Loading**
   - Load profile images on scroll
   - Infinite scroll for timelines
   - Paginate follower/following lists

2. **Caching**
   - Cache user profiles (5 min TTL)
   - Cache follow status (1 min TTL)
   - Cache notification count (30s TTL)

3. **Database Indexing**
   - Index: `follower_id`, `following_id`, `status`
   - Index: `user_id`, `created_at` for notifications
   - Composite index: `user_id + is_read` for unread count

---

## 🧪 USER TESTING SCENARIOS

### Test Case 1: Complete Follow Flow
1. User A views User B's public profile
2. User A clicks "Follow"
3. User B receives notification
4. User A appears in User B's followers list
5. User B's posts appear in User A's Following feed

### Test Case 2: Private Account Follow Request
1. User A views User C's private profile
2. User A clicks "Follow" → Status: "Requested"
3. User C receives notification with Accept/Decline
4. User C accepts request
5. User A receives acceptance notification
6. User A can now see User C's full profile

### Test Case 3: Notification Flow
1. User B likes User A's post
2. User A receives like notification
3. Notification badge shows "1"
4. User A clicks notification
5. Navigates to post detail
6. Notification marked as read
7. Badge count updates

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Backend Foundation (Priority 1)
- [ ] Extended user profile model with bio, privacy
- [ ] Follow/unfollow API endpoints
- [ ] Follow request system (approve/decline)
- [ ] Notification model & API
- [ ] Activity tracking system
- [ ] Profile visibility rules

### Phase 2: Frontend Core (Priority 1)
- [ ] Dashboard redesign (`/dashboard`)
- [ ] Public profile page (`/profile/:username`)
- [ ] Edit profile modal
- [ ] Follow button component
- [ ] Followers/Following lists

### Phase 3: Notifications (Priority 2)
- [ ] Notification center UI
- [ ] Real-time notification delivery
- [ ] Notification badge & counter
- [ ] Notification preferences

### Phase 4: Feed Enhancements (Priority 2)
- [ ] Following feed tab
- [ ] Suggested users sidebar
- [ ] Profile timeline (posts/liked/rooms)
- [ ] Activity feed algorithm

### Phase 5: Privacy & Polish (Priority 3)
- [ ] Privacy settings page
- [ ] Follow request management
- [ ] Block user functionality
- [ ] Mobile responsive optimizations

---

## 📊 SUCCESS METRICS

### Key Performance Indicators (KPIs)

**Engagement Metrics:**
- Daily Active Users (DAU)
- Follow-to-unfollow ratio
- Average time on profile pages
- Notification interaction rate
- Post engagement rate

**Social Graph Metrics:**
- Average followers per user
- Average following per user
- Follow request acceptance rate
- Private vs public account ratio

**Content Metrics:**
- Posts per user per week
- Quiz room creation rate
- Comment/like ratio
- Share rate

---

## 🎯 USER STORIES

### As a Student User:
1. "I want to follow other students preparing for the same exam so I can see their study progress"
2. "I want to keep my profile private so only approved followers can see my quiz scores"
3. "I want to get notified when someone beats my score so I can retake the quiz"
4. "I want to showcase my quiz achievements on my profile"

### As a Quiz Creator:
1. "I want my followers to be notified when I create a new quiz room"
2. "I want to see who participated in my quiz rooms on my profile"
3. "I want to follow top performers to learn from their strategies"

### As a Casual User:
1. "I want to discover users studying similar subjects"
2. "I want to see what quizzes are trending among people I follow"
3. "I want to maintain a study streak and get reminders"

---

## 🔐 SECURITY & PRIVACY

### Data Protection
- User consent for profile visibility
- Encrypted follow relationships
- Rate limiting on follow/unfollow actions (max 100/hour)
- Privacy-first notification system (no external tracking)

### Content Moderation
- Report user functionality
- Block user (prevents following/notifications)
- Admin review for reported accounts

---

END OF DOCUMENT
