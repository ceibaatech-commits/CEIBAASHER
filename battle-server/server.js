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

  socket.on('join-room', ({ pin, playerName }) => {
    const room = rooms.get(pin);
    if (!room || room.status !== 'waiting') {
      socket.emit('error', { message: room ? 'Quiz started' : 'Room not found' });
      return;
    }
    
    room.players.push({ id: socket.id, name: playerName, score: 0, streak: 0, answers: [] });
    players.set(socket.id, { pin, playerName });
    socket.join(pin);
    
    io.to(pin).emit('player-joined', {
      players: room.players.map(p => ({ name: p.name, score: p.score }))
    });
  });

  socket.on('start-quiz', ({ pin }) => {
    const room = rooms.get(pin);
    if (!room) return;
    
    room.status = 'active';
    io.to(pin).emit('quiz-started', {
      question: room.questions[0],
      questionNumber: 1,
      totalQuestions: room.questions.length
    });
  });

  socket.on('submit-answer', ({ pin, questionId, answerIndex, timeLeft }) => {
    const room = rooms.get(pin);
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    const isCorrect = Math.random() > 0.3;
    player.streak = isCorrect ? player.streak + 1 : 0;
    const points = calculateScore(isCorrect, timeLeft, player.streak);
    player.score += points;
    player.answers.push({ questionId, answerIndex, isCorrect, points });
    
    const leaderboard = room.players
      .map(p => ({ name: p.name, score: p.score, streak: p.streak }))
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
          room.status = 'completed';
          io.to(pin).emit('quiz-ended', { 
            leaderboard: room.players
              .map(p => ({ name: p.name, score: p.score, correct: p.answers.filter(a => a.isCorrect).length }))
              .sort((a, b) => b.score - a.score)
          });
        }
      }, 2000);
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

server.listen(5001, () => console.log('✅ Battle server on :5001'));
