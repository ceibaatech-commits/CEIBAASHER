require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const { v4: uuid } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors());
app.use(express.json());

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

// Game Registry (Rahoot-inspired)
class GameRegistry {
  constructor() {
    this.games = new Map(); // gameId -> Game instance
    this.inviteCodes = new Map(); // inviteCode -> gameId
  }

  addGame(game) {
    this.games.set(game.gameId, game);
    this.inviteCodes.set(game.inviteCode, game.gameId);
    console.log(`📝 Game registered: ${game.inviteCode} (${game.gameId})`);
  }

  getGameByCode(inviteCode) {
    const gameId = this.inviteCodes.get(inviteCode);
    return gameId ? this.games.get(gameId) : null;
  }

  getGameById(gameId) {
    return this.games.get(gameId);
  }

  removeGame(gameId) {
    const game = this.games.get(gameId);
    if (game) {
      this.inviteCodes.delete(game.inviteCode);
      this.games.delete(gameId);
      console.log(`🗑️ Game removed: ${game.inviteCode}`);
    }
  }

  getAllGames() {
    return Array.from(this.games.values());
  }
}

const registry = new GameRegistry();

// Game Class (Rahoot-inspired architecture)
class BattleGame {
  constructor(io, hostSocket, { examId, subject, topic, questions }) {
    this.io = io;
    this.gameId = uuid();
    this.inviteCode = this.generateInviteCode();
    
    // Host info
    this.host = {
      id: hostSocket.id,
      clientId: hostSocket.handshake.auth?.clientId || hostSocket.id,
      name: '',
      connected: true
    };
    
    // Game data
    this.examId = examId;
    this.subject = subject;
    this.topic = topic;
    this.questions = questions;
    this.totalQuestions = questions.length;
    this.timePerQuestion = 30;
    
    // Players
    this.players = [];
    
    // Game state
    this.status = 'WAITING'; // WAITING, PLAYING, FINISHED
    this.currentQuestionIndex = 0;
    this.questionStartTime = null;
    this.questionTimer = null;
    
    // Answers tracking
    this.currentAnswers = new Map(); // playerId -> {answer, timeLeft}
    
    // Leaderboard
    this.leaderboard = [];
    
    console.log(`🎮 Game created: ${this.inviteCode} for ${examId}/${subject}/${topic}`);
  }

  generateInviteCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Add player to game
  addPlayer(socket, playerName) {
    // Check if already joined
    const existing = this.players.find(p => p.clientId === socket.handshake.auth?.clientId || p.id === socket.id);
    if (existing) {
      return { success: false, error: 'Already joined' };
    }

    // Check if game started
    if (this.status !== 'WAITING') {
      return { success: false, error: 'Game already started' };
    }

    const player = {
      id: socket.id,
      clientId: socket.handshake.auth?.clientId || socket.id,
      name: playerName,
      score: 0,
      correctAnswers: 0,
      streak: 0,
      answers: [],
      connected: true,
      avatar: this.getRandomAvatar()
    };

    this.players.push(player);
    socket.join(this.gameId);

    // Notify everyone
    this.broadcast('player-joined', {
      player: { id: player.id, name: player.name, avatar: player.avatar },
      totalPlayers: this.players.length,
      players: this.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar }))
    });

    console.log(`✅ ${playerName} joined game ${this.inviteCode}. Total: ${this.players.length}`);
    
    return { success: true, player };
  }

  // Start the game
  start() {
    if (this.status !== 'WAITING') {
      return { success: false, error: 'Game already started' };
    }

    if (this.players.length === 0) {
      return { success: false, error: 'No players in game' };
    }

    this.status = 'PLAYING';
    this.currentQuestionIndex = 0;

    this.broadcast('quiz-started', {
      totalQuestions: this.totalQuestions,
      timePerQuestion: this.timePerQuestion
    });

    console.log(`🚀 Game ${this.inviteCode} started with ${this.players.length} players`);

    // Send first question
    setTimeout(() => this.sendQuestion(), 1000);

    return { success: true };
  }

  // Send current question to all players
  sendQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    this.questionStartTime = Date.now();
    this.currentAnswers.clear();

    // Broadcast question
    this.broadcast('new-question', {
      questionNumber: this.currentQuestionIndex + 1,
      totalQuestions: this.totalQuestions,
      question: {
        id: question.id,
        question: question.question,
        options: question.options
      },
      timeLimit: this.timePerQuestion
    });

    console.log(`📝 Sent Q${this.currentQuestionIndex + 1}/${this.totalQuestions} to ${this.players.length} players`);

    // Auto-advance timer
    this.questionTimer = setTimeout(() => {
      this.nextQuestion();
    }, this.timePerQuestion * 1000 + 3000); // +3s for showing results
  }

  // Handle player answer
  submitAnswer(playerId, answerIndex) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || this.status !== 'PLAYING') return;

    // Already answered?
    if (this.currentAnswers.has(playerId)) return;

    const timeElapsed = (Date.now() - this.questionStartTime) / 1000;
    const timeLeft = Math.max(0, this.timePerQuestion - timeElapsed);
    
    const question = this.questions[this.currentQuestionIndex];
    const isCorrect = question.correctAnswer === answerIndex;

    // Update streak
    if (isCorrect) {
      player.streak++;
      player.correctAnswers++;
    } else {
      player.streak = 0;
    }

    // Calculate score
    const points = this.calculateScore(isCorrect, timeLeft, player.streak);
    player.score += points;

    // Save answer
    player.answers.push({
      questionIndex: this.currentQuestionIndex,
      answerIndex,
      isCorrect,
      points,
      timeLeft
    });

    this.currentAnswers.set(playerId, { answerIndex, isCorrect, points });

    console.log(`📝 ${player.name} answered: ${isCorrect ? '✅' : '❌'} +${points}pts (streak: ${player.streak})`);

    // Send instant feedback
    this.sendToPlayer(playerId, 'answer-result', {
      isCorrect,
      points,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      yourAnswer: answerIndex,
      newScore: player.score,
      streak: player.streak,
      timeLeft: timeLeft.toFixed(1)
    });

    // Update leaderboard
    this.updateLeaderboard();

    // If everyone answered, advance early
    if (this.currentAnswers.size === this.players.length) {
      clearTimeout(this.questionTimer);
      setTimeout(() => this.nextQuestion(), 3000);
    }
  }

  // Calculate score (JovVix-inspired)
  calculateScore(isCorrect, timeLeft, streak) {
    if (!isCorrect) return 0;
    
    const basePoints = 100;
    const timeBonus = Math.floor((timeLeft / this.timePerQuestion) * 50);
    const streakBonus = streak > 1 ? (streak - 1) * 20 : 0;
    
    return basePoints + timeBonus + streakBonus;
  }

  // Update and broadcast leaderboard
  updateLeaderboard() {
    this.leaderboard = this.players
      .map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        correctAnswers: p.correctAnswers,
        streak: p.streak,
        avatar: p.avatar
      }))
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    this.broadcast('leaderboard-update', { leaderboard: this.leaderboard });
  }

  // Move to next question
  nextQuestion() {
    // Show correct answer first
    const question = this.questions[this.currentQuestionIndex];
    this.broadcast('question-results', {
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      leaderboard: this.leaderboard
    });

    // Move to next question after delay
    setTimeout(() => {
      this.currentQuestionIndex++;
      
      if (this.currentQuestionIndex >= this.questions.length) {
        this.endGame();
      } else {
        this.sendQuestion();
      }
    }, 2000);
  }

  // End the game
  endGame() {
    this.status = 'FINISHED';
    clearTimeout(this.questionTimer);

    this.updateLeaderboard();

    this.broadcast('game-ended', {
      leaderboard: this.leaderboard,
      totalQuestions: this.totalQuestions
    });

    console.log(`🏁 Game ${this.inviteCode} ended. Winner: ${this.leaderboard[0]?.name}`);

    // Save to MongoDB
    if (db) {
      db.collection('quiz_results').insertOne({
        gameId: this.gameId,
        inviteCode: this.inviteCode,
        examId: this.examId,
        subject: this.subject,
        topic: this.topic,
        leaderboard: this.leaderboard,
        totalQuestions: this.totalQuestions,
        playersCount: this.players.length,
        completedAt: new Date()
      }).catch(err => console.error('Error saving results:', err));
    }

    // Clean up game after 1 minute
    setTimeout(() => {
      registry.removeGame(this.gameId);
    }, 60000);
  }

  // Broadcast to all in game
  broadcast(event, data) {
    this.io.to(this.gameId).emit(event, data);
  }

  // Send to specific player
  sendToPlayer(playerId, event, data) {
    this.io.to(playerId).emit(event, data);
  }

  // Handle player disconnect
  handleDisconnect(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    player.connected = false;
    
    this.broadcast('player-left', {
      playerId,
      playerName: player.name,
      totalPlayers: this.players.filter(p => p.connected).length
    });

    console.log(`❌ ${player.name} disconnected from game ${this.inviteCode}`);

    // If host left and game not started, end game
    if (playerId === this.host.id && this.status === 'WAITING') {
      this.broadcast('game-cancelled', { reason: 'Host left' });
      registry.removeGame(this.gameId);
    }

    // If no players left, remove game
    const connectedPlayers = this.players.filter(p => p.connected);
    if (connectedPlayers.length === 0 && this.status !== 'FINISHED') {
      registry.removeGame(this.gameId);
    }
  }

  getRandomAvatar() {
    const avatars = ['👨‍🎓', '👩‍🎓', '🧑‍🎓', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🔬', '👩‍🔬', '🧑‍🔬', '🦊', '🐯', '🦁', '🐼'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }
}

// HTTP Endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'Fixed Battle Server Running (Rahoot-inspired)',
    activeGames: registry.getAllGames().length,
    activePlayers: registry.getAllGames().reduce((sum, game) => sum + game.players.length, 0)
  });
});

// Create room - Host creates a game
app.post('/api/battle/create-room', async (req, res) => {
  try {
    const { hostName, examId, subject, topic } = req.body;
    
    if (!hostName || !examId || !subject || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    console.log(`📝 Creating room: ${examId}/${subject}/${topic} for host ${hostName}`);
    
    // Fetch questions from Google Sheets
    const response = await axios.post('http://localhost:8001/api/quiz/start', {
      exam: examId,
      subject,
      topic
    });
    
    if (!response.data.questions || response.data.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions available. Please upload a Google Sheet for this topic.'
      });
    }

    // Store temporary game data (will be completed when host connects via socket)
    const tempGameData = {
      hostName,
      examId,
      subject,
      topic,
      questions: response.data.questions,
      createdAt: Date.now()
    };

    // Generate invite code now
    const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store temporarily in memory
    if (!global.pendingGames) global.pendingGames = new Map();
    global.pendingGames.set(inviteCode, tempGameData);

    console.log(`✅ Room created with PIN: ${inviteCode}`);
    
    res.json({
      success: true,
      pin: inviteCode,
      room: {
        pin: inviteCode,
        hostName,
        examId,
        subject,
        topic,
        totalQuestions: response.data.questions.length
      }
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
  const game = registry.getGameByCode(req.params.pin);
  
  if (!game) {
    // Check if it's a pending game
    if (global.pendingGames && global.pendingGames.has(req.params.pin)) {
      const pending = global.pendingGames.get(req.params.pin);
      return res.json({
        success: true,
        room: {
          pin: req.params.pin,
          hostName: pending.hostName,
          examId: pending.examId,
          subject: pending.subject,
          topic: pending.topic,
          status: 'WAITING',
          playerCount: 0,
          totalQuestions: pending.questions.length
        }
      });
    }
    
    return res.status(404).json({
      success: false,
      message: 'Room not found'
    });
  }
  
  res.json({
    success: true,
    room: {
      pin: game.inviteCode,
      hostName: game.host.name,
      examId: game.examId,
      subject: game.subject,
      topic: game.topic,
      status: game.status,
      playerCount: game.players.length,
      totalQuestions: game.totalQuestions,
      currentQuestion: game.currentQuestionIndex
    }
  });
});

// Socket.io Events (Compatible with existing frontend)
io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  // FRONTEND EVENT: join-room (handles both host and player join)
  socket.on('join-room', ({ pin, playerName, isHost }) => {
    console.log(`🚪 ${playerName} ${isHost ? '(HOST)' : '(PLAYER)'} joining room ${pin}`);
    
    const game = registry.getGameByCode(pin);
    
    // If game doesn't exist and this is the host, initialize it
    if (!game && isHost) {
      console.log(`👑 Host ${playerName} initializing game ${pin}`);
      
      // Check pending game
      if (!global.pendingGames || !global.pendingGames.has(pin)) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const gameData = global.pendingGames.get(pin);
      global.pendingGames.delete(pin);

      // Create actual game instance
      const newGame = new BattleGame(io, socket, gameData);
      newGame.inviteCode = pin; // Use the same PIN
      newGame.host.name = playerName;
      
      registry.addGame(newGame);
      socket.join(newGame.gameId);

      // Notify host
      socket.emit('player-joined', {
        players: [],
        totalPlayers: 0
      });

      console.log(`✅ Game ${pin} initialized by host`);
      return;
    }
    
    // If game exists, player is joining
    if (game) {
      if (isHost) {
        // Host reconnecting
        socket.join(game.gameId);
        socket.emit('player-joined', {
          players: game.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar })),
          totalPlayers: game.players.length
        });
        return;
      }
      
      // Regular player joining
      const result = game.addPlayer(socket, playerName);
      
      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      // Success - game will broadcast player-joined to all
      console.log(`✅ ${playerName} joined game ${pin}`);
      return;
    }
    
    // Game not found
    socket.emit('error', { message: 'Room not found' });
  });

  // FRONTEND EVENT: start-quiz (host starts the game)
  socket.on('start-quiz', ({ pin }) => {
    const game = registry.getGameByCode(pin);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (socket.id !== game.host.id) {
      socket.emit('error', { message: 'Only host can start game' });
      return;
    }

    const result = game.start();
    if (!result.success) {
      socket.emit('error', { message: result.error });
    }
  });

  // FRONTEND EVENT: submit-answer
  socket.on('submit-answer', ({ pin, answerIndex, timeLeft }) => {
    const game = registry.getGameByCode(pin);
    if (!game) return;

    game.submitAnswer(socket.id, answerIndex);
  });

  // FRONTEND EVENT: kick-player
  socket.on('kick-player', ({ pin, playerId }) => {
    const game = registry.getGameByCode(pin);
    if (!game) return;

    if (socket.id !== game.host.id) {
      socket.emit('error', { message: 'Only host can kick players' });
      return;
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    // Remove player
    game.players = game.players.filter(p => p.id !== playerId);
    
    // Notify kicked player
    io.to(playerId).emit('kicked', { message: 'You were kicked from the game' });
    
    // Notify everyone else
    game.broadcast('player-left', {
      playerId,
      playerName: player.name,
      totalPlayers: game.players.length
    });
    
    // Update players list
    game.broadcast('player-joined', {
      players: game.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar })),
      totalPlayers: game.players.length
    });
  });

  // FRONTEND EVENT: pause-quiz, resume-quiz, skip-question, end-quiz
  socket.on('pause-quiz', ({ pin }) => {
    const game = registry.getGameByCode(pin);
    if (!game || socket.id !== game.host.id) return;
    
    game.status = 'PAUSED';
    game.broadcast('quiz-paused', {});
  });

  socket.on('resume-quiz', ({ pin }) => {
    const game = registry.getGameByCode(pin);
    if (!game || socket.id !== game.host.id) return;
    
    game.status = 'PLAYING';
    game.broadcast('quiz-resumed', {});
  });

  socket.on('skip-question', ({ pin }) => {
    const game = registry.getGameByCode(pin);
    if (!game || socket.id !== game.host.id) return;
    
    clearTimeout(game.questionTimer);
    game.nextQuestion();
  });

  socket.on('end-quiz', ({ pin }) => {
    const game = registry.getGameByCode(pin);
    if (!game || socket.id !== game.host.id) return;
    
    game.endGame();
  });

  // FRONTEND EVENT: send-message, send-reaction
  socket.on('send-message', ({ pin, message }) => {
    const game = registry.getGameByCode(pin);
    if (!game) return;

    const player = game.players.find(p => p.id === socket.id) || 
                   (socket.id === game.host.id ? { name: game.host.name } : null);
    if (!player) return;

    game.broadcast('new-message', {
      user: player.name,
      message,
      timestamp: Date.now()
    });
  });

  socket.on('send-reaction', ({ pin, emoji }) => {
    const game = registry.getGameByCode(pin);
    if (!game) return;

    const player = game.players.find(p => p.id === socket.id) ||
                   (socket.id === game.host.id ? { name: game.host.name } : null);
    if (!player) return;

    game.broadcast('new-reaction', {
      user: player.name,
      emoji,
      id: Date.now()
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
    
    // Find game this socket was in
    const game = registry.getAllGames().find(g => 
      g.host.id === socket.id || g.players.some(p => p.id === socket.id)
    );

    if (game) {
      game.handleDisconnect(socket.id);
    }
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Fixed Battle Server (Rahoot-inspired) running on port ${PORT}`);
  console.log(`✨ Features: Real-time battles, PIN-based rooms, instant feedback, leaderboards`);
});
