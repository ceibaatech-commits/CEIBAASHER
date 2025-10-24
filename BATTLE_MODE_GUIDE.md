# 🎮 Battle Mode Testing Guide

## How to Access Battle Mode

### Method 1: Through the UI Flow
1. Go to your app homepage
2. Click on either **NEET** or **JEE** exam card
3. On the exam page, choose any subject (e.g., Physics)
4. Click the **"Battle Mode"** button (purple/pink gradient)
5. Enter your name and click **"Find Opponent"**

### Method 2: Direct URL
Navigate directly to:
- **NEET Physics Battle:** `/battle/NEET/Physics`
- **NEET Chemistry Battle:** `/battle/NEET/Chemistry`
- **NEET Biology Battle:** `/battle/NEET/Biology`
- **JEE Physics Battle:** `/battle/JEE/Physics`
- **JEE Chemistry Battle:** `/battle/JEE/Chemistry`
- **JEE Maths Battle:** `/battle/JEE/Maths`

## Battle Mode Flow

### 1. Setup Screen
- Enter your player name
- Read the battle rules
- Click "Find Opponent"

### 2. Matchmaking
- System searches for another player
- You'll see "Finding Opponent..." message
- Can cancel anytime

### 3. Match Found
- Both players are notified
- Video/audio connection starts
- Quiz loads automatically

### 4. Battle Quiz
- **Left panel:** Your video feed with controls
- **Center:** Timer and progress
- **Right panel:** Opponent's video feed
- Answer 10 questions with 30-second timer each
- See opponent's status in real-time

### 5. Results
- Final scores displayed
- Winner announcement
- Options to battle again or go back

## Features in Battle Mode

✅ **Real-time Matchmaking** - Find opponents automatically
✅ **Live Video** - See your opponent via WebRTC
✅ **Live Audio** - Talk during the battle
✅ **Video Controls** - Toggle camera on/off
✅ **Audio Controls** - Mute/unmute microphone
✅ **Synchronized Quiz** - Both players get same questions
✅ **Live Score Updates** - See scores in real-time
✅ **Winner Declaration** - Clear winner announcement

## Testing Solo (Without Another Player)

Since battle mode needs 2 players, here's how to test:

### Option 1: Open Two Browser Windows
1. Open your app in two different browser windows/tabs
2. In Window 1: Go to Battle Mode → Enter name "Player 1"
3. In Window 2: Go to Battle Mode → Enter name "Player 2"
4. Both will match and start the battle!

### Option 2: Use Two Devices
1. Open app on your phone and computer
2. Start battle mode on both
3. They'll match automatically

### Option 3: Test Solo Practice First
If you want to test the quiz functionality without needing 2 players:
- Use **Solo Practice Mode** instead
- Same questions, same timer
- No opponent needed
- Perfect for testing the core quiz experience

## Troubleshooting

### Camera/Microphone Permission
- Browser will ask for camera/mic permissions
- Click "Allow" when prompted
- If denied, battle continues without video (quiz still works)

### Connection Issues
- Make sure both players are on the same network (or have proper port forwarding)
- Check that port 5000 is accessible
- WebRTC works best on same network or with TURN server

### No Match Found
- If you wait too long and no match is found, it means no other player is searching
- Use two browser windows to test matching

## API Endpoints Used

The battle mode uses these backend endpoints:

1. **Socket.io Connection:** `http://localhost:5000`
2. **Find Match:** Socket event `find-match`
3. **Start Quiz:** `POST /api/quiz/start`
4. **WebRTC Signaling:** Socket events for peer connection

## Current Status

✅ Battle mode is fully implemented
✅ UI is complete with video feeds
✅ Matchmaking system is working
✅ WebRTC signaling is configured
✅ Quiz questions load from demo data

The battle mode is ready to use! Just need 2 players to test the full experience.
