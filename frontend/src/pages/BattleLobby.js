import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Users, Trophy, Play, Copy, Check, Crown, Clock, AlertCircle, Loader2 } from 'lucide-react';
import io from 'socket.io-client';

// Connect to Socket.IO on main backend - Battle endpoint
const BATTLE_SERVER_URL = process.env.REACT_APP_BACKEND_URL || 'https://studyhub-137.preview.emergentagent.com';
const SOCKET_PATH = '/api/battlews/socket.io'; // Battle Socket.IO path

const BattleLobby = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isHost, playerName, hostName } = location.state || {};
  
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [hasQuestions, setHasQuestions] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    console.log('🚀 BattleLobby useEffect RUNNING');
    console.log('🔗 Room info:', { pin, isHost, playerName, hostName });
    
    if (!pin) {
      console.log('⚠️ No PIN yet, waiting...');
      return;
    }
    
    console.log('📡 Creating Socket.io connection');
    const newSocket = io(BATTLE_SERVER_URL, {
      path: SOCKET_PATH,
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket CONNECTED! Socket ID:', newSocket.id);
      const username = isHost ? hostName : playerName;
      newSocket.emit('join_room', { 
        roomId: pin,
        userData: {
          username: username,
          isHost: isHost || false
        }
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
    });

    // Listen for room_joined confirmation
    newSocket.on('room_joined', (data) => {
      console.log('📬 Room joined successfully:', data);
      if (data.room) {
        setRoomInfo(data.room);
        if (data.room.participants) {
          setPlayers(data.room.participants);
        }
        if (data.room.timeRemaining) {
          setTimeRemaining(data.room.timeRemaining);
        }
        // Check if room has questions
        if (data.questions && data.questions.length > 0) {
          setHasQuestions(true);
        } else if (data.room.questionsCount > 0) {
          setHasQuestions(true);
        }
      }
    });

    // Listen for new participants joining
    newSocket.on('participant_joined', (data) => {
      console.log('📬 Participant joined:', data);
      if (data.room && data.room.participants) {
        setPlayers(data.room.participants);
      }
    });

    // Listen for participants leaving
    newSocket.on('participant_left', (data) => {
      console.log('📤 Participant left:', data);
      if (data.room && data.room.participants) {
        setPlayers(data.room.participants);
      }
    });

    // Listen for battle started event - ANY PLAYER CAN START
    newSocket.on('battle_started', (data) => {
      console.log('🚀 Battle started:', data);
      navigate(`/live-battle/${pin}`, { 
        state: { 
          playerName: isHost ? hostName : playerName,
          isHost,
          room: data.room
        } 
      });
    });

    // Listen for start errors
    newSocket.on('start_error', (data) => {
      console.error('❌ Start error:', data);
      setIsStarting(false);
      setErrorMessage(data.error || 'Failed to start quiz');
      setTimeout(() => setErrorMessage(''), 5000);
    });

    // Listen for questions update
    newSocket.on('questions_updated', (data) => {
      console.log('📝 Questions updated:', data);
      if (data.questions && data.questions.length > 0) {
        setHasQuestions(true);
      }
    });

    // Listen for join errors
    newSocket.on('join_error', (data) => {
      console.error('❌ Join error:', data);
      
      let msg = data.error || 'Failed to join room';
      
      switch(data.code) {
        case 'ROOM_NOT_FOUND':
          msg = '🔍 Room not found - The room code may be invalid or the room may have been deleted.';
          break;
        case 'ROOM_EXPIRED':
          msg = '⏰ This quiz expired (24 hours elapsed). Please create a new quiz room.';
          break;
        case 'BATTLE_COMPLETED':
          msg = '✅ This battle has already been completed. You can no longer join.';
          break;
        case 'JOIN_FAILED':
          msg = data.error;
          break;
        default:
          break;
      }
      
      alert(msg);
      navigate('/victory-lane');
    });

    newSocket.on('error', (data) => {
      console.error('❌ Error:', data);
      setErrorMessage(data.message || 'An error occurred');
    });

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [pin, isHost, playerName, hostName, navigate]);

  // ANY PLAYER CAN START THE QUIZ - No host restriction
  const startQuiz = () => {
    if (!hasQuestions) {
      setErrorMessage('No questions available. Please wait for questions to be added.');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }
    setIsStarting(true);
    console.log('🚀 Starting battle for room:', pin);
    socket.emit('start_battle', { roomId: pin });
  };

  const kickPlayer = (playerId) => {
    if (window.confirm('Are you sure you want to kick this player?')) {
      socket.emit('kick-player', { pin, playerId });
    }
  };

  const copyPIN = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes} minutes remaining`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Battle Lobby</h1>
            <p className="text-gray-600">Ready to start? Click the button below!</p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}

          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Room PIN</p>
                <div className="text-4xl font-black text-purple-600 tracking-widest">{pin}</div>
                {timeRemaining && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500 mt-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeRemaining(timeRemaining)}</span>
                  </div>
                )}
              </div>
              <button
                onClick={copyPIN}
                className="p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6 text-gray-600" />}
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Players</h2>
              <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold">
                {players.length} {players.length === 1 ? 'Player' : 'Players'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {players.map((player, index) => {
                const displayName = player.username || player.name || 'Player';
                return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{displayName}</p>
                        {player.isHost && (
                          <div className="flex items-center space-x-1 text-xs text-yellow-600">
                            <Crown className="w-3 h-3" />
                            <span>Host</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isHost && !player.isHost && (
                      <button
                        onClick={() => kickPlayer(player.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Kick
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* START QUIZ BUTTON - Available to ALL players */}
          <button
            onClick={startQuiz}
            disabled={isStarting || !hasQuestions}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Starting...</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                <span>Start Quiz</span>
              </>
            )}
          </button>

          {/* Info message */}
          {!hasQuestions && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-4">
              <p className="text-yellow-800 font-semibold">⏳ Waiting for questions to be added to this room...</p>
            </div>
          )}

          {hasQuestions && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mt-4">
              <p className="text-green-800 font-semibold">✅ Quiz is ready! Any player can start the quiz.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleLobby;
