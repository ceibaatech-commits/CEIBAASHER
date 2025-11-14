# Visual User Flow Diagrams
## Ceibaa Social Features

---

## 1. PROFILE MANAGEMENT FLOW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER LANDS ON APP                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Click Profile Icon    │
              │  in Header             │
              └────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │                                      │
        ▼                                      ▼
┌───────────────────┐              ┌─────────────────────┐
│   /dashboard      │              │  /profile/:username │
│   (Own Profile)   │              │  (Others' Profile)  │
└────────┬──────────┘              └──────────┬──────────┘
         │                                    │
         ▼                                    ▼
┌────────────────────┐            ┌──────────────────────┐
│ Can Edit Profile   │            │ Can Follow/Unfollow  │
│ View Private Stats │            │ View Public Content  │
│ Manage Settings    │            │ Send Messages        │
└────────┬───────────┘            └──────────┬───────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────────────┐  ┌───────────────────────────────┐
│ Edit Profile Modal          │  │ Public Profile Tabs           │
│ ┌─────────────────────────┐│  │ ┌───────────────────────────┐ │
│ │ - Upload Photo          ││  │ │ [Posts] [Quiz Rooms]      │ │
│ │ - Edit Bio (150 chars) ││  │ │                           │ │
│ │ - Edit Location        ││  │ │ Shows:                    │ │
│ │ - Select Exam Focus    ││  │ │ - User's posts            │ │
│ │ - Save / Cancel        ││  │ │ - Quiz rooms created      │ │
│ └─────────────────────────┘│  │ │ - Participation history   │ │
└─────────────────────────────┘  │ └───────────────────────────┘ │
                                 └───────────────────────────────┘
```

---

## 2. FOLLOW SYSTEM FLOW

```
                    ┌──────────────────────────────┐
                    │ User A views User B Profile  │
                    └────────────┬─────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │ Check: Is B's account      │
                    │ Public or Private?         │
                    └────────┬──────────┬────────┘
                            │          │
                  PUBLIC ───┘          └─── PRIVATE
                            │                │
                            ▼                ▼
              ┌─────────────────────┐  ┌──────────────────────┐
              │ Click "Follow"      │  │ Click "Follow"       │
              │ Button              │  │ Button               │
              └──────────┬──────────┘  └──────────┬───────────┘
                         │                        │
                         ▼                        ▼
        ┌────────────────────────────┐  ┌────────────────────────────┐
        │ Instant Follow             │  │ Send Follow Request        │
        │ Button → "Following ✓"     │  │ Button → "Requested"       │
        └────────┬───────────────────┘  └──────────┬─────────────────┘
                 │                                  │
                 ▼                                  ▼
   ┌──────────────────────────┐      ┌─────────────────────────────────┐
   │ Notification to User B:  │      │ Notification to User B:         │
   │ "A started following you"│      │ "A requested to follow you"     │
   └──────────────────────────┘      └───────────┬─────────────────────┘
                                                  │
                                                  ▼
                                     ┌─────────────────────────────┐
                                     │ User B Reviews Request      │
                                     │ [Accept] or [Decline]       │
                                     └────────┬──────────┬─────────┘
                                              │          │
                                    ACCEPT ───┘          └─── DECLINE
                                              │                │
                                              ▼                ▼
                        ┌──────────────────────────┐   ┌─────────────────┐
                        │ Follow Approved          │   │ Request Deleted │
                        │ A can see B's profile    │   │ No notification │
                        │ Notification to A:       │   │ Button → "Follow"│
                        │ "B accepted your request"│   └─────────────────┘
                        └──────────────────────────┘


UNFOLLOW FLOW:
───────────────
        ┌────────────────────────┐
        │ Click "Following ✓"    │
        └──────────┬─────────────┘
                   │
                   ▼
        ┌────────────────────────────────┐
        │ Confirmation Dialog:           │
        │ "Unfollow @username?"          │
        │ [Cancel] [Unfollow]            │
        └──────────┬─────────────────────┘
                   │
         UNFOLLOW ─┘
                   │
                   ▼
        ┌────────────────────────┐
        │ Unfollow Complete      │
        │ Button → "Follow"      │
        │ Counts updated         │
        │ No notification sent   │
        └────────────────────────┘
```

---

## 3. ACTIVITY FEED FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                     /social-feed (Home Page)                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────────┐
              │   Feed Tabs:               │
              │   [For You] [Following]    │
              └────────┬──────────┬────────┘
                       │          │
          FOR YOU TAB ─┘          └─ FOLLOWING TAB
                       │                    │
                       ▼                    ▼
        ┌──────────────────────────┐  ┌────────────────────────┐
        │ Mixed Algorithm Feed:    │  │ Following-Only Feed:   │
        │ ┌──────────────────────┐│  │ ┌────────────────────┐ │
        │ │ 70% Following Posts  ││  │ │ Posts from users   │ │
        │ │ - Recent posts       ││  │ │ you follow         │ │
        │ │ - Quiz rooms         ││  │ │                    │ │
        │ │ - Achievements       ││  │ │ Chronological      │ │
        │ │                      ││  │ │ (newest first)     │ │
        │ │ 30% Recommended:     ││  │ │                    │ │
        │ │ - Same exam focus    ││  │ │ Quiz rooms respect │ │
        │ │ - Similar subjects   ││  │ │ 24-hour TTL        │ │
        │ │ - Quiz room partners ││  │ └────────────────────┘ │
        │ └──────────────────────┘│  └────────────────────────┘
        │                          │
        │ Sorted by:               │
        │ Recency + Engagement     │
        └──────────────────────────┘


FEED POST INTERACTIONS:
───────────────────────
        ┌────────────────────────┐
        │ Post Card              │
        │ ┌────────────────────┐│
        │ │ @username          ││
        │ │ Post content...    ││
        │ │                    ││
        │ │ [♡ Like]  [💬 Comment] [🔗 Share] ││
        │ └────────────────────┘│
        └──────────┬─────────────┘
                   │
      ┌────────────┼────────────┬─────────────┐
      │            │            │             │
      ▼            ▼            ▼             ▼
┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐
│ Like     │ │ Comment │ │ Share    │ │ View       │
│ Post     │ │ on Post │ │ Post     │ │ Profile    │
└────┬─────┘ └────┬────┘ └────┬─────┘ └──────┬─────┘
     │            │            │              │
     ▼            ▼            ▼              ▼
┌─────────────────────────────────────────────────┐
│ Triggers Notification to Post Owner             │
│ Updates engagement counts                       │
│ Appears in user's activity timeline             │
└─────────────────────────────────────────────────┘
```

---

## 4. NOTIFICATION SYSTEM FLOW

```
┌──────────────────────────────────────────────────────────────┐
│                    NOTIFICATION TRIGGERS                      │
└───────┬──────────────────────────────────────────────────────┘
        │
        ├─────► Someone Follows You
        ├─────► Someone Likes Your Post
        ├─────► Someone Comments on Your Post
        ├─────► Followed User Creates Quiz Room
        ├─────► Someone Beats Your Score
        └─────► Daily Streak Reminder (8 PM)
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│              NOTIFICATION DELIVERY SYSTEM                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  1. Create Notification in Database                     ││
│  │     - user_id, type, actor_id, content, reference_id    ││
│  │     - is_read: false                                    ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                    │
│                          ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  2. Real-Time Delivery                                  ││
│  │     - WebSocket push (if connected)                     ││
│  │     - Fallback: Polling every 30s                       ││
│  │     - Browser push notification (if allowed)            ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                    │
│                          ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  3. Update UI                                           ││
│  │     - Red badge on bell icon                            ││
│  │     - Show unread count                                 ││
│  │     - Toast notification (optional)                     ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────────┐
│               USER VIEWS NOTIFICATIONS                         │
│                                                               │
│  Click Bell Icon → Opens Notification Center                 │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  NOTIFICATION CENTER (/notifications)                   ││
│  │                                                          ││
│  │  Tabs: [All] [Follows] [Likes] [Comments] [Quizzes]    ││
│  │                                                          ││
│  │  ┌────────────────────────────────────────────────────┐││
│  │  │ 📸 @user1 started following you → 2 hours ago     │││
│  │  │     [Click] → Navigate to user1's profile          │││
│  │  └────────────────────────────────────────────────────┘││
│  │  ┌────────────────────────────────────────────────────┐││
│  │  │ ❤️ @user2 liked your post → 5 hours ago          │││
│  │  │     [Click] → Navigate to post detail             │││
│  │  └────────────────────────────────────────────────────┘││
│  │  ┌────────────────────────────────────────────────────┐││
│  │  │ 🎯 @user3 beat your score! → 1 day ago           │││
│  │  │     [Click] → Navigate to quiz leaderboard        │││
│  │  └────────────────────────────────────────────────────┘││
│  │                                                          ││
│  │  Actions:                                                ││
│  │  - Click notification → Mark as read + Navigate         ││
│  │  - [Mark all as read]                                   ││
│  │  - Swipe left → Delete                                  ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

---

## 5. PRIVACY CONTROLS FLOW

```
┌──────────────────────────────────────────────────────────────┐
│                  USER ACCESSES SETTINGS                       │
│            Dashboard → Settings Icon → Privacy                │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               /settings/privacy                               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │  ACCOUNT PRIVACY                                        ││
│  │                                                          ││
│  │  ◯ Public Account                                       ││
│  │     - Anyone can see your profile                       ││
│  │     - Posts appear in discovery                         ││
│  │     - Anyone can follow instantly                       ││
│  │                                                          ││
│  │  ◉ Private Account  ← SELECTED                          ││
│  │     - Only followers see full profile                   ││
│  │     - Follow requests must be approved                  ││
│  │     - Posts only visible to followers                   ││
│  └────────────────────────────────────────────────────────┘│
│                          │                                    │
│                          ▼                                    │
│  ┌────────────────────────────────────────────────────────┐│
│  │  ACTIVITY STATUS                                        ││
│  │  ☑ Show when I'm online                                ││
│  │  ☐ Show last active time                               ││
│  └────────────────────────────────────────────────────────┘│
│                          │                                    │
│                          ▼                                    │
│  ┌────────────────────────────────────────────────────────┐│
│  │  FOLLOWER REQUESTS                                      ││
│  │  (3 pending requests) → [View Requests]                ││
│  │                                                          ││
│  │  Click to view:                                         ││
│  │  ┌──────────────────────────────────────────────────┐ ││
│  │  │ @user1 - [Accept] [Decline]                      │ ││
│  │  │ @user2 - [Accept] [Decline]                      │ ││
│  │  │ @user3 - [Accept] [Decline]                      │ ││
│  │  │                                                    │ ││
│  │  │ [Accept All] [Decline All]                        │ ││
│  │  └──────────────────────────────────────────────────┘ ││
│  └────────────────────────────────────────────────────────┘│
│                          │                                    │
│                          ▼                                    │
│  ┌────────────────────────────────────────────────────────┐│
│  │  BLOCKED USERS                                          ││
│  │  → Manage blocked accounts (0)                         ││
│  │                                                          ││
│  │  Blocked users:                                         ││
│  │  - Cannot follow you                                    ││
│  │  - Cannot see your profile                              ││
│  │  - Cannot send notifications                            ││
│  └────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘


PRIVACY IMPACT ON PROFILE VISIBILITY:
──────────────────────────────────────

┌──────────────┬─────────────────────────┬────────────────────────┐
│ Viewer Type  │ Public Account          │ Private Account        │
├──────────────┼─────────────────────────┼────────────────────────┤
│ Not          │ ✅ Full profile visible │ 🔒 Only name +        │
│ Following    │ ✅ All posts & rooms    │    profile picture     │
│              │ ✅ Can follow instantly │    visible             │
│              │                         │ ⏳ Must request follow│
├──────────────┼─────────────────────────┼────────────────────────┤
│ Request      │ N/A                     │ ⏳ "Requested" button │
│ Pending      │                         │ 🔒 Can't see content  │
├──────────────┼─────────────────────────┼────────────────────────┤
│ Following    │ ✅ Full profile visible │ ✅ Full profile       │
│ (Approved)   │ ✅ All posts & rooms    │ ✅ All posts & rooms  │
│              │ ✅ Can unfollow         │ ✅ Can unfollow       │
└──────────────┴─────────────────────────┴────────────────────────┘
```

---

## 6. PROFILE TIMELINE TABS FLOW

```
┌──────────────────────────────────────────────────────────────┐
│              USER'S PROFILE (/profile/:username)              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │  [Posts] [Liked] [Quiz Rooms] [Stats]                  ││
│  └────────────────────────────────────────────────────────┘│
└────────┬─────────────┬──────────────┬───────────────────────┘
         │             │              │
    POSTS TAB      LIKED TAB     QUIZ ROOMS TAB
         │             │              │
         ▼             ▼              ▼
┌──────────────┐ ┌────────────┐ ┌──────────────────────┐
│ All posts    │ │ Posts user │ │ Quiz rooms created   │
│ created by   │ │ has liked  │ │ by user              │
│ user         │ │            │ │                      │
│              │ │ Shows:     │ │ Shows:               │
│ Includes:    │ │ - Original │ │ - Room code          │
│ - Text posts │ │   poster   │ │ - Title              │
│ - Quiz       │ │ - Post     │ │ - Category           │
│   results    │ │   content  │ │ - Created date       │
│ - Achieve-   │ │ - Like     │ │ - Plays count        │
│   ments      │ │   timestamp│ │ - Privacy status     │
│              │ │            │ │                      │
│ Sorted:      │ │ Sorted:    │ │ Respects 24h TTL:    │
│ Reverse      │ │ Recent     │ │ - Expired rooms      │
│ chrono       │ │ likes first│ │   hidden             │
└──────────────┘ └────────────┘ │                      │
                                │ Participation tab:   │
                                │ - Rooms joined       │
                                │ - Score achieved     │
                                │ - Rank in room       │
                                │ - Completion date    │
                                └──────────────────────┘


POST CARD LAYOUT IN TIMELINE:
──────────────────────────────

┌─────────────────────────────────────────┐
│  [@user_avatar] @username · 2 hours ago │
│                                         │
│  Post content text here...              │
│  #hashtags #ceibaa                      │
│                                         │
│  ┌─ Quiz Result (if applicable) ──────┐│
│  │  🎯 Scored 450/500 in JEE Physics  ││
│  │  Room: ABC123                       ││
│  └─────────────────────────────────────┘│
│                                         │
│  [♡ 23] [💬 5] [🔗 Share]              │
└─────────────────────────────────────────┘
```

---

## 7. COMPLETE USER JOURNEY MAP

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          NEW USER JOURNEY                                   │
└────────────────────────────────────────────────────────────────────────────┘

Day 1: Discovery & Setup
────────────────────────
  [Sign Up] → [Complete Profile] → [Set Privacy: Public] → [Explore Feed]
      │             │                      │                      │
      │             ▼                      │                      │
      │    Add profile picture             │                      │
      │    Write bio                       │                      │
      │    Select exam focus: JEE          │                      │
      └─────────────────────────────────────┘                      │
                                                                   │
                                                                   ▼
                                                    ┌──────────────────────┐
                                                    │ Discover users       │
                                                    │ - Same exam: JEE     │
                                                    │ - Follow 5 users     │
                                                    └──────────────────────┘

Day 2-7: Active Engagement
───────────────────────────
  [Take Quizzes] → [Post Results] → [Engage with Posts] → [Build Following]
         │              │                    │                      │
         ▼              ▼                    ▼                      ▼
    Complete quiz   Share score      Like others'          Followers grow
    Score 420/500   to feed          posts                 From 5 → 25
    Rank #3         Room: XYZ123     Comment               notifications
                                     encouragement         increase

Week 2+: Community Member
──────────────────────────
  [Create Rooms] → [Engage Daily] → [Maintain Streak] → [Build Reputation]
         │              │                    │                      │
         ▼              ▼                    ▼                      ▼
    Host quiz      Post study        🔥 10 day streak      Followers: 100+
    20 participants tips daily       Daily reminder        Quiz Master badge
    Notifications  Active comments   notification          Top leaderboards
    to followers   Good engagement   Don't break it!       Profile views ↑


┌────────────────────────────────────────────────────────────────────────────┐
│                        TYPICAL USER INTERACTION                             │
└────────────────────────────────────────────────────────────────────────────┘

  Opens App → Sees notification badge (3) → Clicks bell icon
                                                    │
                                                    ▼
                                    ┌───────────────────────────┐
                                    │ Notification Center Opens │
                                    │ - @user1 followed you     │
                                    │ - @user2 liked your post  │
                                    │ - @user3 beat your score  │
                                    └─────────────┬─────────────┘
                                                  │
            Click "@user3 beat your score" ──────┘
                                                  │
                                                  ▼
                                    ┌───────────────────────────┐
                                    │ Navigate to Quiz          │
                                    │ Leaderboard               │
                                    │                           │
                                    │ 1. @user3 - 480 pts  ← New│
                                    │ 2. @me    - 450 pts       │
                                    │ 3. @user5 - 420 pts       │
                                    └─────────────┬─────────────┘
                                                  │
                            Decides to retake quiz──┘
                                                  │
                                                  ▼
                                    ┌───────────────────────────┐
                                    │ Take Quiz → Score 490 pts │
                                    │ New Rank: #1! 🏆         │
                                    └─────────────┬─────────────┘
                                                  │
                                    Share result to feed
                                                  │
                                                  ▼
                                    ┌───────────────────────────┐
                                    │ Post: "Just reclaimed #1!  │
                                    │ 🎯 490/500 in JEE Physics"│
                                    │                           │
                                    │ → Followers see post      │
                                    │ → @user3 gets notification│
                                    │    "You were beaten!"     │
                                    └───────────────────────────┘
```

---

## 8. MOBILE APP FLOW (Responsive Design)

```
┌────────────────────────────────────────────────────────────────┐
│                     MOBILE NAVIGATION                           │
└────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌─────────────────┐
│  📱 Home        │         │  📱 Profile     │
│                 │         │                 │
│  ┌───────────┐ │         │  ┌───────────┐ │
│  │ 🏠 Feed   │ │         │  │ [@avatar] │ │
│  │ 🔔 Notif  │ │         │  │           │ │
│  │ 👤 Profile│ │         │  │ @username │ │
│  │ ⚙️ Settings│ │         │  │           │ │
│  └───────────┘ │         │  │ 123 Posts │ │
│                 │         │  │ 456 Follow│ │
│                 │         │  │ 789 Follow│ │
│  Hamburger Menu │         │  └───────────┘ │
│  (☰) Top-left   │         │                 │
│                 │         │  [Edit Profile] │
│  Bottom Nav:    │         │                 │
│  🏠 Feed        │         │  ───────────── │
│  🔍 Discover    │         │  [Posts] [Liked]│
│  ➕ Create      │         │                 │
│  🔔 Notif       │         │  Swipe left/   │
│  👤 Profile     │         │  right for tabs │
└─────────────────┘         └─────────────────┘


MOBILE INTERACTIONS:
────────────────────
▶ Swipe down → Refresh feed
▶ Swipe left on notification → Delete
▶ Long press on post → Quick actions (Like/Share/Save)
▶ Pull up from bottom → Create post modal
▶ Tap profile picture anywhere → View profile
▶ Double tap post → Quick like (Instagram style)
```

---

## 9. NOTIFICATION SETTINGS FLOW

```
┌──────────────────────────────────────────────────────────────┐
│            Settings → Notifications → Preferences             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  NOTIFICATION PREFERENCES                                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │  🔔 Push Notifications                                  ││
│  │  ☑ New follower                                        ││
│  │  ☑ Post likes                                          ││
│  │  ☑ Comments on my posts                                ││
│  │  ☑ Quiz room created (by followed users)               ││
│  │  ☑ Score beaten                                        ││
│  │  ☑ Daily streak reminder                               ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │  📧 Email Notifications                                 ││
│  │  ☑ Weekly summary                                      ││
│  │  ☐ Daily digest                                        ││
│  │  ☐ Marketing emails                                    ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │  ⏰ Quiet Hours                                         ││
│  │  ☑ Enable quiet hours                                  ││
│  │  From: [10:00 PM] To: [8:00 AM]                        ││
│  │  (No notifications during this time)                   ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  [Save Preferences]                                          │
└──────────────────────────────────────────────────────────────┘
```

---

END OF VISUAL FLOW DIAGRAMS
