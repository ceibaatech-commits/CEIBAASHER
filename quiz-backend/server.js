require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const quizRoutes = require('./routes/quiz.routes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Quiz server is running', timestamp: new Date().toISOString() });
});

app.use('/api/quiz', quizRoutes);

// Battle Mode - Socket.io handlers
const waitingPlayers = [];
const battleRooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Find match for battle mode
  socket.on('find-match', ({ playerName, exam, subject }) => {
    console.log(`${playerName} looking for match in ${exam} - ${subject}`);

    // Check if there's a waiting player
    const waitingIndex = waitingPlayers.findIndex(
      p => p.exam === exam && p.subject === subject && p.socketId !== socket.id
    );

    if (waitingIndex !== -1) {
      // Match found!
      const opponent = waitingPlayers[waitingIndex];
      waitingPlayers.splice(waitingIndex, 1);

      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      battleRooms[roomId] = {
        players: [
          { socketId: socket.id, playerName, score: 0 },
          { socketId: opponent.socketId, playerName: opponent.playerName, score: 0 }
        ],
        exam,
        subject,
        currentQuestion: 0
      };

      // Join both players to room
      socket.join(roomId);
      io.sockets.sockets.get(opponent.socketId)?.join(roomId);

      // Notify both players
      io.to(roomId).emit('match-found', {
        roomId,
        players: battleRooms[roomId].players.map(p => ({ playerName: p.playerName })),
        exam,
        subject
      });

      console.log(`Match created: Room ${roomId}`);
    } else {
      // Add to waiting list
      waitingPlayers.push({ socketId: socket.id, playerName, exam, subject });
      socket.emit('waiting', { message: 'Looking for opponent...' });
      console.log(`${playerName} added to waiting list`);
    }
  });

  // Cancel matchmaking
  socket.on('cancel-match', () => {
    const index = waitingPlayers.findIndex(p => p.socketId === socket.id);
    if (index !== -1) {
      waitingPlayers.splice(index, 1);
      console.log('Player cancelled matchmaking:', socket.id);
    }
  });

  // Answer submitted in battle
  socket.on('battle-answer', ({ roomId, questionId, answer, timeTaken }) => {
    const room = battleRooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (player) {
      // Update score (implement proper scoring logic)
      player.lastAnswer = { questionId, answer, timeTaken };
      
      io.to(roomId).emit('opponent-answered', {
        playerName: player.playerName
      });
    }
  });

  // WebRTC signaling
  socket.on('webrtc-offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('webrtc-offer', { offer, from: socket.id });
  });

  socket.on('webrtc-answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('webrtc-answer', { answer, from: socket.id });
  });

  socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('webrtc-ice-candidate', { candidate, from: socket.id });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from waiting list
    const waitingIndex = waitingPlayers.findIndex(p => p.socketId === socket.id);
    if (waitingIndex !== -1) {
      waitingPlayers.splice(waitingIndex, 1);
    }

    // Handle battle room cleanup
    Object.keys(battleRooms).forEach(roomId => {
      const room = battleRooms[roomId];
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      
      if (playerIndex !== -1) {
        // Notify opponent
        socket.to(roomId).emit('opponent-disconnected');
        delete battleRooms[roomId];
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Quiz server running on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`🎮 WebSocket ready for battle mode`);
});

module.exports = { app, server, io };
