import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, Clock, Send, MessageCircle, Swords, Loader2, Shield } from 'lucide-react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import io from 'socket.io-client';
import axios from 'axios';
import MathText from '../components/MathText';
import { useAuth } from '../context/AuthContext';
import BattleVideoChat from '../components/BattleVideoChat';
import Header from '../components/Header';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const Matchmaking1v1 = () => {
  const { examId, subject, topic } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [battleState, setBattleState] = useState('setup'); // setup, searching, matched, playing, results, blocked
  const [playerName, setPlayerName] = useState('');
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [searchCountdown, setSearchCountdown] = useState(30);
  const [searchTimedOut, setSearchTimedOut] = useState(false);
  
  // Parents Mode state
  const [parentsModeBlocked, setParentsModeBlocked] = useState(false);
  const [parentsModeTimeRemaining, setParentsModeTimeRemaining] = useState(0);
  
  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [answerResult, setAnswerResult] = useState(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const chatEndRef = useRef(null);

  // Check Parents Mode on mount
  useEffect(() => {
    const checkParentsMode = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('ceibaa_token');
        if (!token) return;
        
        const response = await axios.get(`${BACKEND_URL}/api/user/parents-mode/check-battle-access`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && !response.data.can_access_battle) {
          setParentsModeBlocked(true);
          setParentsModeTimeRemaining(response.data.time_remaining_seconds || 0);
          setBattleState('blocked');
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error('Error checking parents mode:', error);
      }
    };
    
    checkParentsMode();
  }, []);

  // Pre-fill player name from user
  useEffect(() => {
    if (user && user.name) {
      setPlayerName(user.name);
    }
  }, [user]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      path: '/api/battlews/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 20000
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to matchmaking server');
    });

    newSocket.on('waiting', (data) => {
      console.log('Waiting for opponent:', data);
      if (data.timeout) setSearchCountdown(data.timeout);
    });

    newSocket.on('match-found', async (data) => {
      console.log('Match found!', data);
      setSearchTimedOut(false);
      setRoomId(data.roomId);
      const opp = data.players.find(p => p.playerName !== playerName);
      setOpponent(opp);
      setBattleState('matched');
      await fetchBattleQuestions();
    });

    newSocket.on('match-timeout', (data) => {
      console.log('Match timeout:', data);
      setSearchTimedOut(true);
      setBattleState('setup');
    });

    newSocket.on('battle-start', (data) => {
      if (data.questions) setQuestions(data.questions);
      setBattleState('playing');
    });

    newSocket.on('opponent-answered', (data) => {
      if (data.score !== undefined) setOpponentScore(data.score);
    });

    newSocket.on('opponent-score-update', (data) => {
      setOpponentScore(data.score);
    });

    newSocket.on('chat-message', (data) => {
      setChatMessages(prev => [...prev, {
        playerName: data.playerName,
        message: data.message,
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('opponent-disconnected', () => {
      alert('Opponent disconnected! You win by default.');
      setBattleState('results');
    });

    newSocket.on('battle-ended', (data) => {
      setBattleState('results');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => { if (newSocket) newSocket.close(); };
  }, [playerName]);

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!socket) return;
    
    const heartbeatInterval = setInterval(() => {
      if (socket && socket.connected) {
        socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 10000);
    
    return () => clearInterval(heartbeatInterval);
  }, [socket]);

  // Search countdown timer
  useEffect(() => {
    if (battleState !== 'searching') return;
    setSearchCountdown(30);
    setSearchTimedOut(false);
    const interval = setInterval(() => {
      setSearchCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [battleState]);

  // Timer countdown
  useEffect(() => {
    if (battleState === 'playing' && timeLeft > 0 && selectedAnswer === null) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (battleState === 'playing' && timeLeft === 0 && selectedAnswer === null) {
      handleAnswerSelect(-1); // Time's up, no answer
    }
  }, [timeLeft, battleState, selectedAnswer]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchBattleQuestions = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/quiz/start`, {
        exam: examId,
        subject: subject,
        topic: topic,
        num_questions: 10
      });
      
      if (response.data.success && response.data.questions) {
        setQuestions(response.data.questions);
        setBattleState('playing');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Fallback: Try to get questions from server via socket
      if (socket) {
        socket.emit('request-questions', { roomId, exam: examId, subject, topic });
      }
    }
  };

  const startMatchmaking = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    socket.emit('find-match', {
      playerName,
      exam: examId,
      subject: subject,
      topic: topic
    });
    
    setBattleState('searching');
  };

  const cancelMatchmaking = () => {
    socket.emit('cancel-match');
    setBattleState('setup');
  };

  const handleAnswerSelect = (index) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswerRaw = currentQuestion.correctAnswer || currentQuestion.correct_answer;
    let correctAnswerIndex;
    
    if (typeof correctAnswerRaw === 'string' && /^[A-Da-d]$/.test(correctAnswerRaw)) {
      correctAnswerIndex = correctAnswerRaw.toUpperCase().charCodeAt(0) - 65;
    } else if (typeof correctAnswerRaw === 'number') {
      correctAnswerIndex = correctAnswerRaw;
    } else {
      correctAnswerIndex = parseInt(correctAnswerRaw) || 0;
    }
    
    const isCorrect = index === correctAnswerIndex;
    const pointsEarned = isCorrect ? Math.max(10, timeLeft * 3) : 0;
    
    setAnswerResult({
      isCorrect,
      correctAnswer: correctAnswerIndex,
      points: pointsEarned
    });
    
    if (isCorrect) {
      setMyScore(prev => prev + pointsEarned);
    }
    
    // Emit answer to opponent
    if (socket && roomId) {
      socket.emit('battle-answer', {
        roomId,
        questionIndex: currentQuestionIndex,
        answer: index,
        isCorrect,
        score: myScore + pointsEarned,
        timeTaken: 30 - timeLeft
      });
    }
    
    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setAnswerResult(null);
        setTimeLeft(30);
      } else {
        // Battle complete
        if (socket && roomId) {
          socket.emit('battle-complete', {
            roomId,
            playerName,
            finalScore: myScore + pointsEarned,
            userId: user?.id || user?.user_id,
            totalQuestions: questions.length,
            exam: examId,
            subject: subject
          });
        }
        setBattleState('results');
      }
    }, 2000);
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim() && socket && roomId) {
      socket.emit('battle-chat', {
        roomId,
        playerName,
        message: chatInput
      });
      setChatMessages(prev => [...prev, {
        playerName,
        message: chatInput,
        timestamp: new Date().toISOString()
      }]);
      setChatInput('');
    }
  };

  // Check if user is authenticated
  const isUserAuthenticated = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;

  // Helper to wrap content with video chat component and header
  const withVideoChat = (content) => (
    <>
      <Header />
      {content}
      <BattleVideoChat
        socket={socket}
        roomId={roomId}
        playerName={playerName || 'Player'}
        opponentName={opponent?.playerName || opponent?.name || 'Opponent'}
        opponentId={opponent?.socketId || opponent?.userId || opponent?.id}
      />
    </>
  );

  if (!isUserAuthenticated) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4 pt-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Swords className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Please login to access 1v1 matchmaking battles.
            </p>
            <button
              onClick={() => navigate('/login', { state: { from: location.pathname } })}
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Login to Battle
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full mt-3 text-gray-500 py-2 text-sm hover:text-gray-700"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  // Parents Mode Blocked Screen
  if (battleState === 'blocked' || parentsModeBlocked) {
    const formatTime = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    };

    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900 to-orange-900 flex items-center justify-center p-4 pt-20">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Parents Mode Active</h2>
            <p className="text-gray-500 mb-6">
              1v1 Battle Mode has been temporarily disabled by Parents Mode.
            </p>
            
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6">
              <p className="text-amber-600 text-sm mb-2">Time remaining until access is restored:</p>
              <p className="text-4xl font-bold text-amber-600 font-mono">
                {formatTime(parentsModeTimeRemaining)}
              </p>
            </div>
            
            <div className="space-y-3 text-left text-sm text-gray-600 mb-6">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Solo practice quizzes are still available
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Study materials and Divya Tutor work normally
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                This mode cannot be manually disabled
              </p>
            </div>
            
            <button
              onClick={() => navigate('/profile/board')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all mb-3"
            >
              Go to My Board
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  // Setup Screen
  if (battleState === 'setup') {
    return withVideoChat(
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 pt-20">
        <div className="px-4 sm:px-12 pt-6 sm:pt-10">
          {/* Back button — flush left, above the card */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-300 hover:text-white mb-5 transition-colors"
            data-testid="battle-back-btn"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          {/* Card — constrained on desktop, full-width on mobile */}
          <div className="w-full sm:max-w-[460px] sm:mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8 mb-10">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Swords className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">1v1 Battle</h1>
              <div className="text-gray-600">
                <p className="font-semibold text-lg text-red-600">{decodeURIComponent(examId)}</p>
                <p>{decodeURIComponent(subject)} {topic ? `• ${decodeURIComponent(topic)}` : ''}</p>
              </div>
            </div>

            {/* Timeout message */}
            {searchTimedOut && (
              <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-center" data-testid="timeout-message">
                <p className="font-bold mb-1">No opponent found</p>
                <p className="text-sm">No one is searching for this topic right now. Try again or pick a different subject!</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Battle Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none font-medium"
                  data-testid="player-name-input"
                />
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  <Swords className="w-5 h-5" />
                  Battle Rules
                </h3>
                <ul className="space-y-1 text-sm text-red-800">
                  <li>Real-time 1v1 quiz duel</li>
                  <li>10 questions, 30 seconds each</li>
                  <li>Faster answers = More points</li>
                  <li>Live chat with opponent</li>
                </ul>
              </div>

              <button
                onClick={startMatchmaking}
                disabled={!playerName.trim()}
                className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="find-opponent-btn"
              >
                <Swords className="w-5 h-5" />
                {searchTimedOut ? 'Try Again' : 'Find Opponent'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Searching Screen
  if (battleState === 'searching') {
    return withVideoChat(
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          {/* Animated search indicator */}
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto">
              <Swords className="w-14 h-14 text-white" />
            </div>
            <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full border-4 border-red-400 animate-ping opacity-20"></div>

            {/* Countdown ring */}
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-sm font-black text-red-600" data-testid="search-countdown">{searchCountdown}</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Finding Opponent</h2>
          <p className="text-gray-400 text-sm mb-1">
            {decodeURIComponent(examId)} {topic ? `• ${decodeURIComponent(topic)}` : ''}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-slate-700 rounded-full h-1.5 mb-6 mt-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-500 to-rose-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(searchCountdown / 30) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
            <span className="text-gray-400 text-sm">
              {searchCountdown > 20 ? 'Searching for opponents...' :
               searchCountdown > 10 ? 'Still looking...' :
               'Expanding search...'}
            </span>
          </div>
          
          <button
            onClick={cancelMatchmaking}
            className="px-6 py-2.5 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition-all font-semibold text-sm"
            data-testid="cancel-search-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Matched Screen
  if (battleState === 'matched') {
    return withVideoChat(
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-2xl">
            <Trophy className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Match Found!</h2>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-2xl mb-2">
                  {playerName.charAt(0).toUpperCase()}
                </div>
                <p className="text-white font-semibold">{playerName}</p>
              </div>
              <div className="text-4xl font-black text-red-400">VS</div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-2xl mb-2">
                  {opponent?.playerName?.charAt(0).toUpperCase() || '?'}
                </div>
                <p className="text-white font-semibold">{opponent?.playerName || 'Opponent'}</p>
              </div>
            </div>
          </div>
          <p className="text-gray-300 animate-pulse">Starting battle...</p>
        </div>
      </div>
    );
  }

  // Playing Screen
  if (battleState === 'playing' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];

    return withVideoChat(
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-4">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              {/* My Score */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                  {playerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{playerName}</p>
                  <p className="text-2xl font-black text-blue-400">{myScore} pts</p>
                </div>
              </div>
              
              {/* Timer & Progress */}
              <div className="text-center">
                <div className={`text-4xl font-black ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                  {timeLeft}s
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span>Q{currentQuestionIndex + 1}</span>
                  <span>/</span>
                  <span>{questions.length}</span>
                </div>
              </div>
              
              {/* Opponent Score */}
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-white font-semibold text-right">{opponent?.playerName || 'Opponent'}</p>
                  <p className="text-2xl font-black text-rose-400 text-right">{opponentScore} pts</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-xl">
                  {opponent?.playerName?.charAt(0).toUpperCase() || '?'}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-rose-500 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Question Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="mb-6">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {decodeURIComponent(subject)} • {decodeURIComponent(topic)}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-2">
                    <MathText text={currentQuestion.question} />
                  </h2>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = answerResult && answerResult.correctAnswer === index;
                    const isWrong = isSelected && answerResult && !answerResult.isCorrect;
                    const optionText = typeof option === 'object' ? (option.text || option.label) : option;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={selectedAnswer !== null}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedAnswer === null
                            ? 'border-gray-200 hover:border-red-400 hover:bg-red-50'
                            : isCorrect
                            ? 'border-green-500 bg-green-50'
                            : isWrong
                            ? 'border-red-500 bg-red-50'
                            : isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            isCorrect ? 'bg-green-500 text-white' :
                            isWrong ? 'bg-red-500 text-white' :
                            isSelected ? 'bg-blue-500 text-white' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="flex-1 font-medium text-gray-900">
                            <MathText text={optionText} />
                          </span>
                          {isCorrect && <span className="text-green-500 font-bold text-xl">✓</span>}
                          {isWrong && <span className="text-red-500 font-bold text-xl">✗</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Answer Feedback */}
                {answerResult && (
                  <div className={`mt-4 p-4 rounded-xl ${
                    answerResult.isCorrect ? 'bg-green-100 border-2 border-green-400' : 'bg-red-100 border-2 border-red-400'
                  }`}>
                    <p className={`font-bold ${answerResult.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                      {answerResult.isCorrect ? `✓ Correct! +${answerResult.points} pts` : '✗ Incorrect!'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Section */}
            <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-4 flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-400" />
                  Battle Chat
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 bg-slate-900/50 rounded-xl p-3">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-4">Say hello to your opponent!</p>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg ${
                        msg.playerName === playerName
                          ? 'bg-blue-600 ml-6 text-white'
                          : 'bg-slate-700 mr-6 text-white'
                      }`}
                    >
                      <p className="text-xs opacity-70 mb-1">{msg.playerName}</p>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              
              <form onSubmit={sendChatMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={100}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (battleState === 'results') {
    const isWinner = myScore > opponentScore;
    const isTie = myScore === opponentScore;

    return withVideoChat(
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 py-8 pt-20">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            {isWinner ? (
              <div className="w-28 h-28 mx-auto mb-2">
                <DotLottiePlayer
                  src="https://assets-v2.lottiefiles.com/a/745fc364-117b-11ee-b7ec-9f18a8a356e0/ctpFpJP75f.lottie"
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            ) : isTie ? (
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-blue-400 to-blue-500">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            ) : (
              <img src="/images/defeat_books.png" alt="Defeat" className="w-28 h-28 mx-auto mb-4 object-contain" />
            )}
            
            <h1 className="text-4xl font-black text-gray-900 mb-2">
              {isWinner ? 'Victory!' : isTie ? 'Tie Game!' : 'Defeat'}
            </h1>
            <p className="text-gray-600 mb-8">
              {isWinner ? 'You dominated the battlefield!' : 
               isTie ? 'A worthy opponent!' : 
               'Better luck next time!'}
            </p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className={`p-6 rounded-xl ${isWinner ? 'bg-green-50 ring-2 ring-green-400' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-600 mb-1">You</div>
                <div className={`text-4xl font-black ${isWinner ? 'text-green-600' : 'text-gray-600'}`}>
                  {myScore}
                </div>
              </div>
              <div className={`p-6 rounded-xl ${!isWinner && !isTie ? 'bg-green-50 ring-2 ring-green-400' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-600 mb-1">{opponent?.playerName || 'Opponent'}</div>
                <div className={`text-4xl font-black ${!isWinner && !isTie ? 'text-green-600' : 'text-gray-600'}`}>
                  {opponentScore}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all"
              >
                Battle Again
              </button>
              <button
                onClick={() => navigate('/victory-lane')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Victory Lane
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
    </div>
  );
};

export default Matchmaking1v1;
