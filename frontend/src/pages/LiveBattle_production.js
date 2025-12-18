import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Zap, Star, Pause, Play, SkipForward, X, AlertCircle, MessageCircle, Send, Gift, Smile, ArrowLeft } from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';
import MathText from '../components/MathText';
import { useAuth } from '../context/AuthContext';

// Production-grade Socket.IO configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://quiz-app-updates.preview.emergentagent.com';

const LiveBattle = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { playerName, isHost, questions, roomInfo, examId, subject, topic, autoJoin } = location.state || {};
  
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [allQuestions, setAllQuestions] = useState(questions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(questions?.[0] || null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(questions?.length || 10);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showAllQuestions, setShowAllQuestions] = useState(isHost);
  const [loading, setLoading] = useState(autoJoin && !questions);
  
  // Social Features State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState(''); 
  const [showChat, setShowChat] = useState(true);
  const [reactions, setReactions] = useState([]);
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [selectedGiftRecipient, setSelectedGiftRecipient] = useState(null);
  const [giftNotification, setGiftNotification] = useState(null);
  const [followingStatus, setFollowingStatus] = useState({});
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const joinTimeoutRef = useRef(null);

  // Production-grade Socket.IO initialization
  useEffect(() => {
    if (!playerName || !pin) {
      navigate('/');
      return;
    }

    console.log('🚀 [SOCKET] Initializing production-grade Socket.IO connection');
    console.log('🌐 [SOCKET] Backend URL:', BACKEND_URL);
    
    // Get auth token if available
    const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
    console.log('🔐 [SOCKET] Auth token:', token ? 'Available' : 'Not available (guest mode)');

    // PRODUCTION-GRADE SOCKET CONFIGURATION
    const socketConfig = {
      path: '/api/battlews/socket.io',
      transports: ['websocket', 'polling'], // WebSocket first, polling fallback
      timeout: 20000, // 20 second connection timeout
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      // Authentication
      auth: token ? { token } : {},
      // Query parameters for additional context
      query: {
        playerName: playerName,
        isHost: isHost ? 'true' : 'false',
        roomId: pin
      }
    };

    console.log('⚙️ [SOCKET] Configuration:', socketConfig);
    setConnectionStatus('connecting');

    // Create socket instance
    const newSocket = io(BACKEND_URL, socketConfig);
    socketRef.current = newSocket;
    setSocket(newSocket);

    // Set up connection timeout (30 seconds for join process)
    let hasJoined = false;
    joinTimeoutRef.current = setTimeout(() => {
      if (!hasJoined) {
        console.error('❌ [SOCKET] Join timeout: No room_joined response after 30 seconds');
        setConnectionStatus('error');
        setLoading(false);
        alert('Connection timeout. The server did not respond in time. Please try again.');
        navigate('/join-room');
      }
    }, 30000);

    // ============ CRITICAL: Set up ALL event listeners BEFORE connection ============
    
    // Connection lifecycle events
    newSocket.on('connect', () => {
      console.log('✅ [SOCKET] Connected! Socket ID:', newSocket.id);
      console.log('🔌 [SOCKET] Transport:', newSocket.io.engine.transport.name);
      setConnectionStatus('connected');
      
      // NOW emit join_room after connection is established
      console.log('📤 [SOCKET] Emitting join_room event');
      console.log('📋 [SOCKET] Room ID:', pin);
      console.log('👤 [SOCKET] Player:', playerName, 'Host:', isHost);
      
      newSocket.emit('join_room', {
        roomId: pin,
        userData: {
          username: playerName,
          isHost: isHost || false,
          avatar: isHost ? '👑' : '👤'
        }
      });
      
      // If host has questions, send them after joining
      if (isHost && questions && questions.length > 0) {
        console.log(`📤 [SOCKET] HOST: Will send ${questions.length} questions after joining`);
        setTimeout(() => {
          newSocket.emit('set_room_questions', {
            roomId: pin,
            questions: questions
          });
          console.log('✅ [SOCKET] set_room_questions emitted');
        }, 1000);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ [SOCKET] Connection error:', error);
      console.error('📊 [SOCKET] Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });
      setConnectionStatus('error');
      setLoading(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('⚠️ [SOCKET] Disconnected. Reason:', reason);
      setConnectionStatus('disconnected');
      
      // Log detailed disconnect reasons
      if (reason === 'io server disconnect') {
        console.error('❌ [SOCKET] Server forcefully disconnected the client');
      } else if (reason === 'io client disconnect') {
        console.info('ℹ️ [SOCKET] Client intentionally disconnected');
      } else if (reason === 'ping timeout') {
        console.error('❌ [SOCKET] Ping timeout - server did not respond to ping');
      } else if (reason === 'transport close') {
        console.warn('⚠️ [SOCKET] Transport closed');
      } else if (reason === 'transport error') {
        console.error('❌ [SOCKET] Transport error');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 [SOCKET] Reconnected after ${attemptNumber} attempts`);
      setConnectionStatus('connected');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 [SOCKET] Reconnection attempt ${attemptNumber}`);
      setConnectionStatus('connecting');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ [SOCKET] Reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ [SOCKET] Reconnection failed after all attempts');
      setConnectionStatus('error');
      alert('Failed to reconnect to the server. Please refresh the page.');
    });

    // Room-specific events
    newSocket.on('join_error', (data) => {
      console.error('❌ [SOCKET] Join error:', data);
      hasJoined = true;
      clearTimeout(joinTimeoutRef.current);
      setLoading(false);
      setConnectionStatus('error');
      
      let errorMessage = data.error || 'Failed to join room';
      
      if (data.code === 'ROOM_NOT_FOUND') {
        errorMessage = `Room ${pin} not found. Please check the PIN.`;
      } else if (data.code === 'ROOM_EXPIRED') {
        errorMessage = 'This room has expired (24 hours elapsed). Please create a new room.';
      } else if (data.code === 'BATTLE_COMPLETED') {
        errorMessage = 'This battle has already completed. You cannot join.';
      } else if (data.code === 'ROOM_FULL') {
        errorMessage = 'This room is full. Cannot join.';
      }
      
      alert(errorMessage);
      navigate('/join-room');
    });

    newSocket.on('room_joined', (data) => {
      console.log('✅ [SOCKET] Room joined successfully:', data);
      hasJoined = true;
      clearTimeout(joinTimeoutRef.current);
      setConnectionStatus('connected');
      
      const actualIsHost = data.isHost || false;
      const hostInfo = data.hostInfo || {};
      
      console.log('🔍 [SOCKET] Host Info:', {
        'frontend_isHost': isHost,
        'backend_isHost': actualIsHost,
        'hostUsername': hostInfo.username,
        'myUsername': playerName
      });
      
      if (data.room && data.room.participants) {
        setParticipants(data.room.participants);
      }
      
      if (!actualIsHost && data.questions && data.questions.length > 0) {
        console.log(`📝 [SOCKET] Received ${data.questions.length} questions from host`);
        setAllQuestions(data.questions);
        setCurrentQuestion(data.questions[0]);
        setTotalQuestions(data.questions.length);
        setLoading(false);
      } else if (!actualIsHost) {
        console.log('⏳ [SOCKET] Waiting for host to set questions...');
        setLoading(false);
      } else {
        console.log('👑 [SOCKET] You are the host of this room');
        setLoading(false);
      }
    });

    // Additional room events would go here...
    // (participant_joined, questions_updated, quiz_started, etc.)

    // Cleanup on unmount
    return () => {
      console.log('🧹 [SOCKET] Cleaning up socket connection');
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [playerName, pin, isHost, questions, navigate]);

  // Rest of component code...
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4">
      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        {connectionStatus === 'connecting' && (
          <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
            <span>Connecting...</span>
          </div>
        )}
        {connectionStatus === 'connected' && (
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-white animate-pulse"></div>
            <span>Connected</span>
          </div>
        )}
        {connectionStatus === 'error' && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Connection Error</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-xl">Loading battle room...</p>
          </div>
        </div>
      )}

      {/* Main content would go here */}
    </div>
  );
};

export default LiveBattle;
