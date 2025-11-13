import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Users, Trophy, Play, Copy, Check, Crown } from 'lucide-react';
import io from 'socket.io-client';

// Connect to battle server through the backend domain
// Browser cannot access localhost:5001 (container internal)
// So we use the external backend URL
const BATTLE_SERVER_URL = process.env.REACT_APP_BACKEND_URL || 'https://examprep-cbse.preview.emergentagent.com';
const SOCKET_PATH = '/socket.io'; // Default Socket.io path

const BattleLobby = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isHost, playerName, hostName } = location.state || {};
  
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.log('🚀 BattleLobby useEffect RUNNING');
    console.log('🔗 BATTLE_SERVER_URL:', BATTLE_SERVER_URL);
    console.log('🔗 Room info:', { pin, isHost, playerName, hostName });
    
    // Guard clause - don't connect if we don't have the PIN
    if (!pin) {
      console.log('⚠️ No PIN yet, waiting...');
      return;
    }
    
    console.log('📡 Creating Socket.io connection to battle server:', BATTLE_SERVER_URL);
    const newSocket = io(BATTLE_SERVER_URL, {
      path: '/api/battlews',  // Custom path to avoid ingress conflicts
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket CONNECTED! Socket ID:', newSocket.id);
      console.log('📤 Emitting join-room with:', {
        pin,
        playerName: isHost ? hostName : playerName,
        isHost: isHost || false
      });
      newSocket.emit('join-room', { 
        pin, 
        playerName: isHost ? hostName : playerName,
        isHost: isHost || false
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    newSocket.on('player-joined', (data) => {
      console.log('📬 Received player-joined:', data);
      setPlayers(data.players || []);
    });

    newSocket.on('player-left', (data) => {
      console.log('Player left:', data.playerName);
    });

    newSocket.on('player-kicked', (data) => {
      setPlayers(data.players);
    });

    newSocket.on('kicked', (data) => {
      alert(data.message);
      navigate('/');
    });

    newSocket.on('quiz-started', (data) => {
      navigate(`/live-battle/${pin}`, { 
        state: { 
          playerName: isHost ? hostName : playerName,
          isHost,
          firstQuestion: data
        } 
      });
    });

    newSocket.on('error', (data) => {
      alert(data.message);
      navigate('/');
    });

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [pin, isHost, playerName, hostName]); // Re-run when these values change

  const startQuiz = () => {
    if (players.length < 1) {
      alert('Wait for at least 1 player to join!');
      return;
    }
    socket.emit('start-quiz', { pin });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Battle Lobby</h1>
            <p className="text-gray-600">Waiting for players to join</p>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Room PIN</p>
                <div className="text-4xl font-black text-purple-600 tracking-widest">{pin}</div>
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
              {players.map((player, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{player.name}</p>
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
              ))}
            </div>
          </div>

          {isHost && (
            <button
              onClick={startQuiz}
              disabled={players.length < 1}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Play className="w-6 h-6" />
              <span>Start Quiz</span>
            </button>
          )}

          {!isHost && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-yellow-800 font-semibold">Waiting for host to start the quiz...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleLobby;