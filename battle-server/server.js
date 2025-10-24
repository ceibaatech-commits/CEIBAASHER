const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage (use Redis in production)
const rooms = new Map();
const players = new Map();

// Generate 6-digit PIN
function generatePIN() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Calculate score with bonuses
function calculateScore(isCorrect, timeLeft, streak) {
  if (!isCorrect) return 0;
  const basePoints = 100;
  const timeBonus = timeLeft * 2;
  const streakBonus = streak > 1 ? (streak - 1) * 10 : 0;
  return basePoints + timeBonus + streakBonus;
}

// API Routes
app.post('/api/battle/create-room', async (req, res) => {
  try {
    const { hostName, examId, subject, topic, questionsCount = 10 } = req.body;
    
    const pin = generatePIN();
    
    // Fetch questions from main backend
    const questionsResponse = await axios.post('http://localhost:8001/api/quiz/start', {
      exam: examId,
      subject: subject,
      topic: topic
    });
    
    const room = {
      pin,
      hostName,
      examId,
      subject,
      topic,
      questionsCount,
      questions: questionsResponse.data.questions,
      fullQuestions: [], // Store with answers for validation
      players: [],
      status: 'waiting', // waiting, active, completed
      currentQuestion: 0,
      startTime: null,
      createdAt: Date.now()
    };
    
    rooms.set(pin, room);
    
    res.json({ 
      success: true, 
      pin,
      room: {
        pin,
        hostName,
        examId,
        subject,
        topic,
        questionsCount,
        status: room.status
      }
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/battle/join-room', (req, res) => {
  const { pin, playerName } = req.body;
  
  const room = rooms.get(pin);
  
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }
  
  if (room.status !== 'waiting') {
    return res.status(400).json({ success: false, message: 'Quiz already started' });
  }
  
  res.json({ 
    success: true, 
    room: {
      pin: room.pin,
      hostName: room.hostName,
      examId: room.examId,
      subject: room.subject,
      topic: room.topic,
      questionsCount: room.questionsCount,
      players: room.players.map(p => ({ name: p.name, score: p.score }))
    }
  });
});

app.get('/api/battle/room/:pin', (req, res) => {
  const { pin } = req.params;
  const room = rooms.get(pin);
  
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
      questionsCount: room.questionsCount,
      status: room.status,
      currentQuestion: room.currentQuestion,
      players: room.players.map(p => ({ name: p.name, score: p.score, streak: p.streak }))
    }
  });
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Join room
  socket.on('join-room', ({ pin, playerName }) => {
    const room = rooms.get(pin);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (room.status !== 'waiting') {
      socket.emit('error', { message: 'Quiz already started' });
      return;
    }
    
    // Add player to room
    const player = {
      id: socket.id,
      name: playerName,
      score: 0,
      streak: 0,
      answers: []
    };
    
    room.players.push(player);
    players.set(socket.id, { pin, playerName });
    
    socket.join(pin);
    
    // Notify all players in room
    io.to(pin).emit('player-joined', {
      player: { name: player.name, score: player.score },
      players: room.players.map(p => ({ name: p.name, score: p.score }))
    });
    
    console.log(`${playerName} joined room ${pin}`);
  });

  // Start quiz (host only)
  socket.on('start-quiz', ({ pin }) => {
    const room = rooms.get(pin);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    room.status = 'active';
    room.startTime = Date.now();
    room.currentQuestion = 0;
    
    // Send first question
    io.to(pin).emit('quiz-started', {
      question: room.questions[0],
      questionNumber: 1,
      totalQuestions: room.questions.length,
      timePerQuestion: 30
    });
    
    console.log(`Quiz started in room ${pin}`);
  });

  // Submit answer
  socket.on('submit-answer', ({ pin, questionId, answerIndex, timeLeft }) => {
    const room = rooms.get(pin);
    const playerData = players.get(socket.id);
    
    if (!room || !playerData) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    // Validate answer (in real implementation, check against stored correct answers)
    const isCorrect = Math.random() > 0.5; // Mock validation
    
    // Update streak
    if (isCorrect) {
      player.streak++;
    } else {
      player.streak = 0;
    }
    
    // Calculate and add score
    const points = calculateScore(isCorrect, timeLeft, player.streak);
    player.score += points;
    
    // Record answer
    player.answers.push({
      questionId,
      answerIndex,
      timeLeft,
      isCorrect,
      points
    });
    
    // Broadcast updated leaderboard
    const leaderboard = room.players
      .map(p => ({ name: p.name, score: p.score, streak: p.streak }))
      .sort((a, b) => b.score - a.score);
    
    io.to(pin).emit('leaderboard-update', { leaderboard });
    
    // Check if all players answered
    const allAnswered = room.players.every(p => 
      p.answers.length === room.currentQuestion + 1
    );
    
    if (allAnswered) {
      // Move to next question or end quiz
      setTimeout(() => {
        room.currentQuestion++;
        
        if (room.currentQuestion < room.questions.length) {
          // Next question
          io.to(pin).emit('next-question', {
            question: room.questions[room.currentQuestion],
            questionNumber: room.currentQuestion + 1,
            totalQuestions: room.questions.length,
            timePerQuestion: 30
          });
        } else {
          // Quiz completed
          room.status = 'completed';
          const finalLeaderboard = room.players
            .map(p => ({ 
              name: p.name, 
              score: p.score, 
              streak: p.streak,
              correctAnswers: p.answers.filter(a => a.isCorrect).length
            }))
            .sort((a, b) => b.score - a.score);
          
          io.to(pin).emit('quiz-ended', { 
            leaderboard: finalLeaderboard,
            winner: finalLeaderboard[0]
          });
        }
      }, 2000); // 2 second delay before next question
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const playerData = players.get(socket.id);
    
    if (playerData) {
      const { pin, playerName } = playerData;
      const room = rooms.get(pin);
      
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        
        io.to(pin).emit('player-left', {
          playerName,
          players: room.players.map(p => ({ name: p.name, score: p.score }))
        });
        
        // Clean up empty rooms
        if (room.players.length === 0 && room.status === 'waiting') {
          rooms.delete(pin);
          console.log(`Room ${pin} deleted (empty)`);
        }
      }
      
      players.delete(socket.id);
      console.log(`${playerName} disconnected from room ${pin}`);
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`✅ Battle server running on port ${PORT}`);
  console.log(`🎮 WebSocket ready for live battles`);
});

module.exports = { app, server, io };
