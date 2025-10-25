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
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

const rooms = new Map();
const players = new Map();
const matchmakingQueue = new Map(); // topic -> array of waiting players

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

function generatePIN() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function calculateScore(isCorrect, timeLeft, streak) {
  if (!isCorrect) return 0;
  return 100 + (timeLeft * 2) + ((streak > 1 ? (streak - 1) * 10 : 0));
}

app.get('/health', (req, res) => {
  res.json({ status: 'Battle server running' });
});

app.post('/api/battle/create-room', async (req, res) => {
  try {
    const { hostName, examId, subject, topic } = req.body;
    const pin = generatePIN();
    
    const response = await axios.post('http://localhost:8001/api/quiz/start', {
      exam: examId, subject, topic
    });
    
    const roomData = {
      pin, hostName, examId, subject, topic,
      questions: response.data.questions,
      quizId: response.data.quizId,
      players: [],
      status: 'waiting',
      currentQuestion: 0,
      isPaused: false,
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
    
    res.json({ success: true, pin, room: { pin, hostName, examId, subject, topic } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/battle/room/:pin', (req, res) => {
  const room = rooms.get(req.params.pin);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  
  res.json({ 
    success: true, 
    room: {
      pin: room.pin, hostName: room.hostName, examId: room.examId,
      subject: room.subject, topic: room.topic, status: room.status,
      players: room.players.map(p => ({ name: p.name, score: p.score }))
    }
  });
});

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('join-room', ({ pin, playerName, isHost }) => {
    const room = rooms.get(pin);
    if (!room || room.status !== 'waiting') {
      socket.emit('error', { message: room ? 'Quiz started' : 'Room not found' });
      return;
    }
    
    const playerData = { 
      id: socket.id, 
      name: playerName, 
      score: 0, 
      streak: 0, 
      answers: [],
      isHost: isHost || false
    };
    
    room.players.push(playerData);
    players.set(socket.id, { pin, playerName, isHost: isHost || false });
    socket.join(pin);
    
    io.to(pin).emit('player-joined', {
      players: room.players.map(p => ({ name: p.name, score: p.score, isHost: p.isHost }))
    });
  });

  socket.on('start-quiz', ({ pin }) => {
    const room = rooms.get(pin);
    const playerData = players.get(socket.id);
    
    if (!room || !playerData?.isHost) return;
    
    room.status = 'active';
    io.to(pin).emit('quiz-started', {
      question: room.questions[0],
      questionNumber: 1,
      totalQuestions: room.questions.length
    });
  });

  // Host control: Pause quiz
  socket.on('pause-quiz', ({ pin }) => {
    const room = rooms.get(pin);
    const playerData = players.get(socket.id);
    
    if (!room || !playerData?.isHost) return;
    
    room.isPaused = true;
    io.to(pin).emit('quiz-paused', { message: 'Quiz paused by host' });
  });

  // Host control: Resume quiz
  socket.on('resume-quiz', ({ pin }) => {
    const room = rooms.get(pin);
    const playerData = players.get(socket.id);
    
    if (!room || !playerData?.isHost) return;
    
    room.isPaused = false;
    io.to(pin).emit('quiz-resumed', { message: 'Quiz resumed' });
  });

  // Host control: Kick player
  socket.on('kick-player', ({ pin, playerId }) => {
    const room = rooms.get(pin);
    const playerData = players.get(socket.id);
    
    if (!room || !playerData?.isHost) return;
    
    const kickedPlayer = room.players.find(p => p.id === playerId);
    if (kickedPlayer && !kickedPlayer.isHost) {
      room.players = room.players.filter(p => p.id !== playerId);
      io.to(playerId).emit('kicked', { message: 'You were removed by the host' });
      io.to(playerId).disconnectSockets();
      io.to(pin).emit('player-kicked', { 
        playerName: kickedPlayer.name,
        players: room.players.map(p => ({ name: p.name, score: p.score, isHost: p.isHost }))
      });
    }
  });

  // Host control: Skip question
  socket.on('skip-question', ({ pin }) => {
    const room = rooms.get(pin);
    const playerData = players.get(socket.id);
    
    if (!room || !playerData?.isHost) return;
    
    room.currentQuestion++;
    if (room.currentQuestion < room.questions.length) {
      io.to(pin).emit('next-question', {
        question: room.questions[room.currentQuestion],
        questionNumber: room.currentQuestion + 1,
        totalQuestions: room.questions.length
      });
    } else {
      endQuiz(room, pin);
    }
  });

  // Host control: End quiz
  socket.on('end-quiz', ({ pin }) => {
    const room = rooms.get(pin);
    const playerData = players.get(socket.id);
    
    if (!room || !playerData?.isHost) return;
    
    endQuiz(room, pin);
  });

  socket.on('submit-answer', ({ pin, questionId, answerIndex, timeLeft }) => {
    const room = rooms.get(pin);
    if (!room || room.isPaused) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    // Proper answer validation
    const currentQ = room.questions[room.currentQuestion];
    const isCorrect = currentQ && currentQ.correctAnswer === answerIndex;
    
    player.streak = isCorrect ? player.streak + 1 : 0;
    const points = calculateScore(isCorrect, timeLeft, player.streak);
    player.score += points;
    player.answers.push({ questionId, answerIndex, isCorrect, points });
    
    // Send feedback to the player
    socket.emit('answer-result', { isCorrect, points, correctAnswer: currentQ.correctAnswer });
    
    const leaderboard = room.players
      .map(p => ({ name: p.name, score: p.score, streak: p.streak, id: p.id }))
      .sort((a, b) => b.score - a.score);
    
    io.to(pin).emit('leaderboard-update', { leaderboard });
    
    if (room.players.every(p => p.answers.length === room.currentQuestion + 1)) {
      setTimeout(() => {
        room.currentQuestion++;
        if (room.currentQuestion < room.questions.length) {
          io.to(pin).emit('next-question', {
            question: room.questions[room.currentQuestion],
            questionNumber: room.currentQuestion + 1,
            totalQuestions: room.questions.length
          });
        } else {
          endQuiz(room, pin);
        }
      }, 2000);
    }
  });

  // Social Feature: Chat message
  socket.on('send-message', ({ pin, message }) => {
    const room = rooms.get(pin);
    const playerData = players.get(socket.id);
    
    if (!room || !playerData) return;
    
    const chatMessage = {
      playerName: playerData.playerName,
      message: message.trim(),
      timestamp: Date.now()
    };
    
    io.to(pin).emit('new-message', chatMessage);
  });

  // Social Feature: Emoji reaction
  socket.on('send-reaction', ({ pin, emoji }) => {
    const room = rooms.get(pin);
    const playerData = players.get(socket.id);
    
    if (!room || !playerData) return;
    
    io.to(pin).emit('new-reaction', {
      playerName: playerData.playerName,
      emoji,
      timestamp: Date.now()
    });
  });

  // Social Feature: Virtual gift
  socket.on('send-gift', ({ pin, recipientId, giftType }) => {
    const room = rooms.get(pin);
    const senderData = players.get(socket.id);
    
    if (!room || !senderData) return;
    
    const sender = room.players.find(p => p.id === socket.id);
    const recipient = room.players.find(p => p.id === recipientId);
    
    if (!sender || !recipient) return;
    
    // Gift values
    const giftValues = {
      star: 10,
      diamond: 50,
      crown: 100,
      trophy: 200
    };
    
    const giftValue = giftValues[giftType] || 10;
    
    // Simple economy: sender needs enough score to send gift
    if (sender.score >= giftValue) {
      sender.score -= giftValue;
      recipient.score += Math.floor(giftValue / 2); // Recipient gets 50% of gift value
      
      // Notify both parties and update leaderboard
      io.to(recipientId).emit('gift-received', {
        from: senderData.playerName,
        giftType,
        points: Math.floor(giftValue / 2)
      });
      
      socket.emit('gift-sent', {
        to: recipient.name,
        giftType,
        cost: giftValue
      });
      
      // Update leaderboard
      const leaderboard = room.players
        .map(p => ({ name: p.name, score: p.score, streak: p.streak, id: p.id }))
        .sort((a, b) => b.score - a.score);
      
      io.to(pin).emit('leaderboard-update', { leaderboard });
    } else {
      socket.emit('gift-error', { message: 'Not enough points to send gift' });
    }
  });

  socket.on('disconnect', () => {
    const data = players.get(socket.id);
    if (data) {
      const room = rooms.get(data.pin);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        io.to(data.pin).emit('player-left', { playerName: data.playerName });
        if (room.players.length === 0) rooms.delete(data.pin);
      }
      players.delete(socket.id);
    }
  });
});

async function endQuiz(room, pin) {
  room.status = 'completed';
  const finalLeaderboard = room.players
    .map(p => ({ 
      name: p.name, 
      score: p.score, 
      correct: p.answers.filter(a => a.isCorrect).length,
      totalQuestions: room.questions.length
    }))
    .sort((a, b) => b.score - a.score);
  
  io.to(pin).emit('quiz-ended', { leaderboard: finalLeaderboard });
  
  // Save results to MongoDB
  if (db) {
    try {
      await db.collection('quiz_results').insertOne({
        pin,
        examId: room.examId,
        subject: room.subject,
        topic: room.topic,
        hostName: room.hostName,
        leaderboard: finalLeaderboard,
        completedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving quiz results:', error);
    }
  }
}

server.listen(5001, () => console.log('✅ Battle server on :5001'));
