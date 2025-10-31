require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors());
app.use(express.json());

// Data structures
const rooms = new Map();
const players = new Map();
const questionTimers = new Map();

// MongoDB connection
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'test_database';
let db;

MongoClient.connect(MONGO_URL)
  .then(client => {
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Helper functions
function generatePIN() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// JovVix-inspired scoring system
function calculateScore(isCorrect, timeLeft, streak, totalTime = 30) {
  if (!isCorrect) return 0;
  
  // Base points
  const basePoints = 100;
  
  // Time bonus (faster = more points, max 50 bonus)
  const timeBonus = Math.floor((timeLeft / totalTime) * 50);
  
  // Streak bonus (consecutive correct answers)
  const streakBonus = streak > 1 ? (streak - 1) * 20 : 0;
  
  return basePoints + timeBonus + streakBonus;
}

// Real-time leaderboard calculation
function calculateLeaderboard(room) {
  const leaderboard = room.players
    .map(player => ({
      id: player.id,
      name: player.name,
      score: player.score,
      correctAnswers: player.correctAnswers || 0,
      streak: player.streak || 0,
      avatar: player.avatar || '👤',
      isHost: player.isHost || false
    }))
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      ...player,
      rank: index + 1
    }));
  
  return leaderboard;
}

// Broadcast leaderboard to all players in room
function broadcastLeaderboard(pin) {
  const room = rooms.get(pin);
  if (!room) return;
  
  const leaderboard = calculateLeaderboard(room);
  io.to(pin).emit('leaderboard-update', { leaderboard });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Enhanced Battle Server Running',
    activeRooms: rooms.size,
    activePlayers: players.size
  });
});

// Create room endpoint
app.post('/api/battle/create-room', async (req, res) => {
  try {
    const { hostName, examId, subject, topic } = req.body;
    console.log(`📝 Creating room: ${examId}/${subject}/${topic} for host ${hostName}`);
    
    const pin = generatePIN();
    
    // Fetch questions from quiz API
    console.log('🎯 Fetching questions from Google Sheets...');
    const response = await axios.post('http://localhost:8001/api/quiz/start', {
      exam: examId, 
      subject, 
      topic
    });
    
    if (!response.data.questions || response.data.questions.length === 0) {
      console.error('❌ No questions available');
      return res.status(400).json({ 
        success: false, 
        message: 'Questions not available for this topic. Please upload a Google Sheet first.' 
      });
    }
    
    console.log(`✅ Got ${response.data.questions.length} questions from Google Sheets`);
    
    const roomData = {
      pin,
      hostName,
      examId,
      subject,
      topic,
      questions: response.data.questions,
      quizId: response.data.quizId,
      players: [],
      status: 'waiting', // waiting, active, paused, finished
      currentQuestion: 0,
      isPaused: false,
      questionStartTime: null,
      timePerQuestion: response.data.timePerQuestion || 30,
      createdAt: Date.now()
    };
    
    rooms.set(pin, roomData);
    
    // Save to MongoDB
    if (db) {
      await db.collection('battle_rooms').insertOne({
        ...roomData,
        createdAt: new Date()
      });
    }
    
    console.log(`✅ Room ${pin} created successfully`);
    res.json({ 
      success: true, 
      pin, 
      room: { pin, hostName, examId, subject, topic, totalQuestions: response.data.questions.length } 
    });
  } catch (error) {
    console.error('❌ Error creating room:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.detail || 'Failed to create room' 
    });
  }
});

// Get room info
app.get('/api/battle/room/:pin', (req, res) => {
  const room = rooms.get(req.params.pin);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }
  
  res.json({ 
    success: true, 
    room: {
      pin: room.pin,
      hostName: room.hostName,
      examId: room.examId,
      subject: room.subject,
      topic: room.topic,
      status: room.status,
      playerCount: room.players.length,
      totalQuestions: room.questions.length,
      currentQuestion: room.currentQuestion
    }
  });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('✅ New connection:', socket.id);

  // Join room
  socket.on('join-room', ({ pin, playerName, isHost }) => {
    console.log(`🚪 ${playerName} joining room ${pin}, isHost: ${isHost}`);
    
    const room = rooms.get(pin);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (room.status === 'active') {
      socket.emit('error', { message: 'Quiz already started' });
      return;
    }
    
    // Create player data
    const playerData = {
      id: socket.id,
      name: playerName,
      score: 0,
      correctAnswers: 0,
      streak: 0,
      answers: [],
      isHost: isHost || false,
      avatar: getRandomAvatar(),
      joinedAt: Date.now()
    };
    
    room.players.push(playerData);
    players.set(socket.id, { pin, playerName, isHost: isHost || false });
    socket.join(pin);
    
    console.log(`✅ ${playerName} joined room ${pin}. Total players: ${room.players.length}`);
    
    // Notify all players
    io.to(pin).emit('player-joined', {
      player: { id: socket.id, name: playerName, isHost: isHost || false },
      players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost })),
      totalPlayers: room.players.length
    });
    
    // Send room info to joiner
    socket.emit('room-joined', {
      room: {
        pin: room.pin,
        hostName: room.hostName,
        examId: room.examId,
        subject: room.subject,
        topic: room.topic,
        totalQuestions: room.questions.length,
        timePerQuestion: room.timePerQuestion
      },
      players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost })),
      isHost: isHost || false
    });
  });

  // Start quiz (host only)
  socket.on('start-quiz', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo || !playerInfo.isHost) {
      socket.emit('error', { message: 'Only host can start quiz' });
      return;
    }
    
    const room = rooms.get(playerInfo.pin);
    if (!room) return;
    
    if (room.players.length < 1) {
      socket.emit('error', { message: 'Need at least 1 player to start' });
      return;
    }
    
    console.log(`🚀 Starting quiz in room ${playerInfo.pin}`);
    room.status = 'active';
    room.currentQuestion = 0;
    room.questionStartTime = Date.now();
    
    // Send first question
    sendQuestion(playerInfo.pin);
  });

  // Submit answer
  socket.on('submit-answer', ({ answerIndex, timeLeft }) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.pin);
    if (!room || room.status !== 'active') return;
    
    const currentQ = room.questions[room.currentQuestion];
    if (!currentQ) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    // Check answer
    const isCorrect = currentQ.correctAnswer === answerIndex;
    
    // Update streak
    if (isCorrect) {
      player.streak++;
      player.correctAnswers++;
    } else {
      player.streak = 0;
    }
    
    // Calculate score using JovVix-inspired scoring
    const points = calculateScore(isCorrect, timeLeft, player.streak, room.timePerQuestion);
    player.score += points;
    
    // Save answer
    player.answers.push({
      questionIndex: room.currentQuestion,
      answerIndex,
      isCorrect,
      points,
      timeLeft
    });
    
    console.log(`📝 ${player.name} answered Q${room.currentQuestion}: ${isCorrect ? '✅ Correct' : '❌ Wrong'} (+${points} pts)`);
    
    // Send instant feedback to player
    socket.emit('answer-result', {
      isCorrect,
      points,
      correctAnswer: currentQ.correctAnswer,
      explanation: currentQ.explanation,
      yourAnswer: answerIndex,
      newScore: player.score,
      streak: player.streak
    });
    
    // Broadcast real-time leaderboard update
    broadcastLeaderboard(playerInfo.pin);
  });

  // Next question (auto-advance after time)
  socket.on('next-question', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.pin);
    if (!room) return;
    
    room.currentQuestion++;
    
    if (room.currentQuestion >= room.questions.length) {
      endQuiz(playerInfo.pin);
    } else {
      room.questionStartTime = Date.now();
      sendQuestion(playerInfo.pin);
    }
  });

  // Host controls
  socket.on('pause-quiz', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo || !playerInfo.isHost) return;
    
    const room = rooms.get(playerInfo.pin);
    if (!room) return;
    
    room.isPaused = true;
    io.to(playerInfo.pin).emit('quiz-paused');
  });

  socket.on('resume-quiz', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo || !playerInfo.isHost) return;
    
    const room = rooms.get(playerInfo.pin);
    if (!room) return;
    
    room.isPaused = false;
    io.to(playerInfo.pin).emit('quiz-resumed');
  });

  socket.on('skip-question', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo || !playerInfo.isHost) return;
    
    socket.emit('next-question');
  });

  socket.on('end-quiz', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo || !playerInfo.isHost) return;
    
    endQuiz(playerInfo.pin);
  });

  // Chat message
  socket.on('send-message', ({ message }) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.pin);
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    io.to(playerInfo.pin).emit('new-message', {
      user: player.name,
      message,
      timestamp: Date.now()
    });
  });

  // Reactions
  socket.on('send-reaction', ({ emoji }) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.pin);
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    io.to(playerInfo.pin).emit('new-reaction', {
      user: player.name,
      emoji,
      id: Date.now()
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
    
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const room = rooms.get(playerInfo.pin);
      if (room) {
        // Remove player from room
        room.players = room.players.filter(p => p.id !== socket.id);
        
        io.to(playerInfo.pin).emit('player-left', {
          playerId: socket.id,
          playerName: playerInfo.playerName,
          totalPlayers: room.players.length
        });
        
        // If host left, end quiz
        if (playerInfo.isHost && room.status === 'active') {
          endQuiz(playerInfo.pin);
        }
        
        // Delete room if empty
        if (room.players.length === 0) {
          rooms.delete(playerInfo.pin);
          console.log(`🗑️ Room ${playerInfo.pin} deleted (empty)`);
        }
      }
      
      players.delete(socket.id);
    }
  });
});

// Helper function to send question to all players
function sendQuestion(pin) {
  const room = rooms.get(pin);
  if (!room) return;
  
  const question = room.questions[room.currentQuestion];
  
  io.to(pin).emit('new-question', {
    questionNumber: room.currentQuestion + 1,
    totalQuestions: room.questions.length,
    question: {
      id: question.id,
      question: question.question,
      options: question.options
    },
    timeLimit: room.timePerQuestion
  });
  
  // Auto-advance after time limit
  questionTimers.set(pin, setTimeout(() => {
    const updatedRoom = rooms.get(pin);
    if (!updatedRoom || updatedRoom.status !== 'active') return;
    
    updatedRoom.currentQuestion++;
    
    if (updatedRoom.currentQuestion >= updatedRoom.questions.length) {
      endQuiz(pin);
    } else {
      sendQuestion(pin);
    }
  }, room.timePerQuestion * 1000));
}

// End quiz and show results
function endQuiz(pin) {
  const room = rooms.get(pin);
  if (!room) return;
  
  // Clear timer
  if (questionTimers.has(pin)) {
    clearTimeout(questionTimers.get(pin));
    questionTimers.delete(pin);
  }
  
  room.status = 'finished';
  
  const finalLeaderboard = calculateLeaderboard(room);
  
  io.to(pin).emit('quiz-ended', {
    leaderboard: finalLeaderboard,
    totalQuestions: room.questions.length
  });
  
  // Save results to MongoDB
  if (db) {
    db.collection('quiz_results').insertOne({
      pin: room.pin,
      examId: room.examId,
      subject: room.subject,
      topic: room.topic,
      leaderboard: finalLeaderboard,
      totalQuestions: room.questions.length,
      completedAt: new Date()
    }).catch(err => console.error('Error saving results:', err));
  }
  
  console.log(`🏁 Quiz ended in room ${pin}`);
}

// Random avatar generator
function getRandomAvatar() {
  const avatars = ['👨‍🎓', '👩‍🎓', '🧑‍🎓', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🔬', '👩‍🔬', '🧑‍🔬'];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Enhanced Battle Server running on port ${PORT}`);
  console.log(`✨ JovVix-inspired features enabled`);
});
