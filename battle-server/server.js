// battle-server.js - Standalone Socket.io Battle Server
// Deploy this separately or alongside FastAPI

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = createServer(app);

// Configure Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:8000', 'https://quizzen-3.preview.emergentagent.com'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

// Store active battle rooms
const battleRooms = new Map();
const userRooms = new Map(); // Track which room each user is in

// Room structure
class BattleRoom {
  constructor(roomId, host, config, questions = []) {
    this.roomId = roomId;
    this.host = host;
    this.participants = [host];
    this.config = config;
    this.questions = questions; // Store questions for the room
    this.status = 'waiting'; // waiting, starting, active, completed
    this.currentQuestion = 0;
    this.scores = new Map();
    this.answers = new Map();
    this.createdAt = Date.now();
  }

  addParticipant(userId, userData) {
    if (this.participants.length >= this.config.maxParticipants) {
      return { success: false, error: 'Room is full' };
    }

    this.participants.push({
      userId,
      ...userData,
      joinedAt: Date.now()
    });

    this.scores.set(userId, 0);
    return { success: true };
  }

  removeParticipant(userId) {
    this.participants = this.participants.filter(p => p.userId !== userId);
    this.scores.delete(userId);
    this.answers.delete(userId);
  }

  submitAnswer(userId, questionId, answerId, timeSpent) {
    const key = `${userId}-${questionId}`;
    this.answers.set(key, {
      answerId,
      timeSpent,
      timestamp: Date.now()
    });
  }

  updateScore(userId, points) {
    const currentScore = this.scores.get(userId) || 0;
    this.scores.set(userId, currentScore + points);
  }

  getLeaderboard() {
    return Array.from(this.scores.entries())
      .map(([userId, score]) => {
        const participant = this.participants.find(p => p.userId === userId);
        return {
          userId,
          username: participant?.username || 'Unknown',
          avatar: participant?.avatar || '👤',
          score
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`[SOCKET] User connected: ${socket.id}`);

  // User authentication
  socket.on('authenticate', (userData) => {
    socket.userData = userData;
    socket.emit('authenticated', { success: true, socketId: socket.id });
    console.log(`[AUTH] User authenticated: ${userData.username} (${socket.id})`);
  });

  // Create battle room
  socket.on('create_room', (config) => {
    const roomId = generateRoomId();
    const room = new BattleRoom(roomId, {
      userId: socket.id,
      username: socket.userData?.username || 'Host',
      avatar: socket.userData?.avatar || '👑',
      isHost: true
    }, config);

    battleRooms.set(roomId, room);
    userRooms.set(socket.id, roomId);
    socket.join(roomId);

    console.log(`[ROOM] Created: ${roomId} by ${socket.userData?.username}`);

    socket.emit('room_created', {
      success: true,
      roomId,
      pin: roomId,  // Already numeric
      room: getRoomData(room)
    });

    // Broadcast to lobby
    io.emit('room_list_updated', getActiveRooms());
  });

  // Join battle room
  socket.on('join_room', ({ roomId, userData }) => {
    console.log(`[JOIN ATTEMPT] ${userData?.username || 'Unknown'} trying to join room ${roomId} (isHost: ${userData?.isHost})`);
    
    const room = battleRooms.get(roomId);

    if (!room) {
      console.log(`[JOIN ERROR] Room ${roomId} not found`);
      socket.emit('join_error', { 
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND',
        statusCode: 404
      });
      return;
    }

    // Check if room expired (24 hours)
    const roomAge = Date.now() - room.createdAt;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    
    if (roomAge > TWENTY_FOUR_HOURS) {
      console.log(`[JOIN ERROR] Room ${roomId} expired (age: ${Math.floor(roomAge / 1000 / 60 / 60)} hours)`);
      socket.emit('join_error', { 
        error: 'This quiz expired (24 hours elapsed)',
        code: 'ROOM_EXPIRED',
        statusCode: 410
      });
      battleRooms.delete(roomId);
      return;
    }

    // Allow joining even if battle is active (users can join anytime within 24h)
    if (room.status === 'completed') {
      console.log(`[JOIN ERROR] Room ${roomId} already completed`);
      socket.emit('join_error', { 
        error: 'Battle already completed',
        code: 'BATTLE_COMPLETED',
        statusCode: 410
      });
      return;
    }

    // Store userData on socket for later use (chat, reactions, etc.)
    socket.userData = userData;

    // CRITICAL FIX: If this is the host joining, replace the temporary HTTP host
    if (userData.isHost === true) {
      console.log(`[HOST UPDATE] Host ${userData.username} connecting to room ${roomId}`);
      
      // Remove the temporary HTTP host from participants
      room.participants = room.participants.filter(p => !p.userId.startsWith('http-'));
      
      // Update host info
      room.host.userId = socket.id;
      room.host.username = userData.username || room.host.username;
      room.host.avatar = userData.avatar || room.host.avatar;
      room.host.isHost = true;
    }

    const result = room.addParticipant(socket.id, userData);

    if (!result.success) {
      console.log(`[JOIN ERROR] ${result.error} for room ${roomId}`);
      socket.emit('join_error', { 
        error: result.error,
        code: 'JOIN_FAILED',
        statusCode: 403
      });
      return;
    }

    userRooms.set(socket.id, roomId);
    socket.join(roomId);

    console.log(`[JOIN SUCCESS] ${userData.username} joined room ${roomId} (${room.participants.length} participants, isHost: ${userData.isHost})`);

    // Notify all participants
    io.to(roomId).emit('participant_joined', {
      participant: {
        userId: socket.id,
        ...userData
      },
      room: getRoomData(room)
    });

    // Send room data including questions to the joiner
    socket.emit('room_joined', {
      success: true,
      room: getRoomData(room),
      questions: room.questions // Send the same questions as host
    });
  });

  // Set questions for a room (called by host after fetching questions)
  socket.on('set_room_questions', ({ roomId, questions }) => {
    const room = battleRooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Only host can set questions
    if (room.host.userId !== socket.id) {
      socket.emit('error', { message: 'Only host can set questions' });
      return;
    }
    
    room.questions = questions;
    console.log(`[QUESTIONS] Host set ${questions.length} questions for room ${roomId}`);
    
    // Notify host
    socket.emit('questions_set', { success: true });
    
    // Broadcast to all participants in the room (especially joiners waiting for questions)
    io.to(roomId).emit('questions_updated', { questions });
    console.log(`[BROADCAST] Questions sent to all participants in room ${roomId}`);
  });

  // Start battle
  socket.on('start_battle', ({ roomId }) => {
    const room = battleRooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.host.userId !== socket.id) {
      socket.emit('error', { message: 'Only host can start battle' });
      return;
    }

    if (room.participants.length < 2) {
      socket.emit('error', { message: 'Need at least 2 participants' });
      return;
    }

    room.status = 'starting';
    console.log(`[START] Battle starting in room ${roomId}`);

    // Countdown
    let countdown = 3;
    const countdownInterval = setInterval(() => {
      io.to(roomId).emit('countdown', { count: countdown });
      countdown--;

      if (countdown < 0) {
        clearInterval(countdownInterval);
        room.status = 'active';
        io.to(roomId).emit('battle_started', {
          room: getRoomData(room),
          currentQuestion: 0
        });
        console.log(`[ACTIVE] Battle active in room ${roomId}`);
      }
    }, 1000);
  });

  // Submit answer
  socket.on('submit_answer', ({ roomId, questionId, answerId, timeSpent, isCorrect, points }) => {
    const room = battleRooms.get(roomId);

    if (!room) return;

    room.submitAnswer(socket.id, questionId, answerId, timeSpent);

    if (isCorrect) {
      room.updateScore(socket.id, points);
    }

    // Broadcast answer submission (without revealing correctness to others)
    socket.to(roomId).emit('participant_answered', {
      userId: socket.id,
      questionId
    });

    // Send feedback to submitter
    socket.emit('answer_result', {
      correct: isCorrect,
      points: isCorrect ? points : 0,
      currentScore: room.scores.get(socket.id)
    });

    // Broadcast updated leaderboard to ALL participants in real-time
    const leaderboard = room.getLeaderboard();
    io.to(roomId).emit('leaderboard_update', {
      leaderboard: leaderboard
    });

    console.log(`[ANSWER] ${socket.userData?.username} answered Q${questionId}: ${isCorrect ? 'Correct' : 'Wrong'} - Broadcasting leaderboard update`);
  });

  // Next question
  socket.on('next_question', ({ roomId }) => {
    const room = battleRooms.get(roomId);

    if (!room || room.host.userId !== socket.id) return;

    room.currentQuestion++;

    io.to(roomId).emit('next_question', {
      questionNumber: room.currentQuestion,
      leaderboard: room.getLeaderboard()
    });

    console.log(`[NEXT] Room ${roomId} - Question ${room.currentQuestion}`);
  });

  // Complete battle
  socket.on('complete_battle', ({ roomId }) => {
    const room = battleRooms.get(roomId);

    if (!room || room.host.userId !== socket.id) return;

    room.status = 'completed';

    const finalResults = {
      leaderboard: room.getLeaderboard(),
      totalQuestions: room.currentQuestion,
      participants: room.participants.length
    };

    io.to(roomId).emit('battle_completed', finalResults);

    console.log(`[COMPLETE] Battle completed in room ${roomId}`);

    // Clean up after 5 minutes
    setTimeout(() => {
      battleRooms.delete(roomId);
      console.log(`[CLEANUP] Room ${roomId} deleted`);
    }, 5 * 60 * 1000);
  });

  // Chat messages
  socket.on('send_message', ({ roomId, message }) => {
    const room = battleRooms.get(roomId);
    if (!room) return;

    const chatMessage = {
      userId: socket.id,
      username: socket.userData?.username || 'Anonymous',
      message,
      timestamp: Date.now()
    };

    io.to(roomId).emit('new_message', chatMessage);
  });

  // Reactions
  socket.on('send_reaction', ({ roomId, reaction }) => {
    const room = battleRooms.get(roomId);
    if (!room) return;

    io.to(roomId).emit('new_reaction', {
      userId: socket.id,
      username: socket.userData?.username || 'Anonymous',
      reaction,
      timestamp: Date.now()
    });
  });

  // Leave room
  socket.on('leave_room', ({ roomId }) => {
    handleUserLeave(socket, roomId);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] User disconnected: ${socket.id}`);

    const roomId = userRooms.get(socket.id);
    if (roomId) {
      handleUserLeave(socket, roomId);
    }
  });
});

// Helper functions
function handleUserLeave(socket, roomId) {
  const room = battleRooms.get(roomId);
  if (!room) return;

  room.removeParticipant(socket.id);
  userRooms.delete(socket.id);
  socket.leave(roomId);

  console.log(`[LEAVE] User ${socket.id} left room ${roomId}`);

  // If host left, assign new host or close room
  if (room.host.userId === socket.id) {
    if (room.participants.length > 0) {
      room.host = room.participants[0];
      room.host.isHost = true;
      io.to(roomId).emit('host_changed', { newHost: room.host });
      console.log(`[HOST] New host assigned in ${roomId}`);
    } else {
      battleRooms.delete(roomId);
      console.log(`[CLOSE] Room ${roomId} closed - no participants`);
    }
  }

  // Notify remaining participants
  io.to(roomId).emit('participant_left', {
    userId: socket.id,
    room: getRoomData(room)
  });

  // Update room list
  io.emit('room_list_updated', getActiveRooms());
}

function generateRoomId() {
  // Generate 6-digit numeric code (100000 to 999999)
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getRoomData(room) {
  return {
    roomId: room.roomId,
    host: room.host,
    participants: room.participants,
    status: room.status,
    currentQuestion: room.currentQuestion,
    config: room.config,
    participantCount: room.participants.length,
    leaderboard: room.getLeaderboard()
  };
}

function getActiveRooms() {
  return Array.from(battleRooms.values())
    .filter(room => room.status === 'waiting')
    .map(room => ({
      roomId: room.roomId,
      pin: room.roomId,  // Already numeric
      host: room.host.username,
      participants: room.participants.length,
      maxParticipants: room.config.maxParticipants,
      category: room.config.category,
      subject: room.config.subject
    }));
}

// Health check endpoint
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeRooms: battleRooms.size,
    connectedUsers: io.sockets.sockets.size,
    timestamp: new Date().toISOString()
  });
});

// Get active rooms (REST API)
app.get('/api/rooms', (req, res) => {
  res.json({
    rooms: getActiveRooms(),
    total: battleRooms.size
  });
});

// Create room via HTTP (for backward compatibility with FastAPI + Social Feed Quiz Rooms)
app.post('/api/battle/create-room', (req, res) => {
  const { examId, subject, topic, hostName, customRoomId, questions, maxParticipants } = req.body;
  
  if (!hostName) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: hostName'
    });
  }

  try {
    // Use custom room ID if provided (for social feed quiz rooms), otherwise generate numeric
    const roomId = customRoomId || generateRoomId();
    
    // Check if room already exists
    if (battleRooms.has(roomId)) {
      return res.status(409).json({
        success: false,
        error: 'Room with this ID already exists'
      });
    }
    
    const config = {
      examId: examId || 'social-quiz',
      subject: subject || 'General',
      topic: topic || 'Quiz Room',
      maxParticipants: maxParticipants || 50
    };

    const room = new BattleRoom(roomId, {
      userId: 'http-' + Math.random().toString(36).substring(7),
      username: hostName,
      avatar: '👑',
      isHost: true
    }, config);
    
    // Set questions if provided (for social feed quiz rooms)
    if (questions && Array.isArray(questions) && questions.length > 0) {
      room.questions = questions;
      console.log(`[HTTP] Room ${roomId} initialized with ${questions.length} questions`);
    }

    battleRooms.set(roomId, room);

    console.log(`[HTTP] Room created: ${roomId} by ${hostName} (type: ${customRoomId ? 'custom' : 'numeric'})`);

    res.json({
      success: true,
      pin: roomId,
      roomId,
      room: getRoomData(room)
    });

    // Broadcast to lobby
    io.emit('room_list_updated', getActiveRooms());
  } catch (error) {
    console.error('[HTTP] Error creating room:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get room by PIN/ID via HTTP
app.get('/api/battle/room/:pin', (req, res) => {
  const pin = req.params.pin.toUpperCase();
  const room = battleRooms.get(pin) || battleRooms.get(pin.toLowerCase());

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Room not found'
    });
  }

  res.json({
    success: true,
    room: getRoomData(room)
  });
});

// Start server
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Battle Server running on port ${PORT}`);
  console.log(`📡 Socket.io endpoint: http://localhost:${PORT}/socket.io/`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});