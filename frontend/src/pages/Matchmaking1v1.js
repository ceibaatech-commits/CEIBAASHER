import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, Clock, Send, MessageCircle, Swords, Loader2 } from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';
import MathText from '../components/MathText';
import { useAuth } from '../context/AuthContext';
import BattleVideoChat from '../components/BattleVideoChat';
import Header from '../components/Header';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const Matchmaking1v1 = () => {
  const { examId, subject, topic } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [battleState, setBattleState] = useState('setup'); // setup, searching, matched, playing, results
  const [playerName, setPlayerName] = useState('');
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  
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

  // Pre-fill player name from user
  useEffect(() => {
    if (user && user.name) {
      setPlayerName(user.name);
    }
  }, [user]);

  // Initialize socket connection
  useEffect(() => {
    console.log('🔗 Connecting to matchmaking server:', BACKEND_URL);
    const newSocket = io(BACKEND_URL, {
      path: '/api/battlews/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      timeout: 10000
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connected to matchmaking server');
    });

    newSocket.on('waiting', (data) => {
      console.log('⏳ Waiting for opponent:', data.message);
    });

    newSocket.on('match-found', async (data) => {
      console.log('🎯 Match found!', data);
      setRoomId(data.roomId);
      const opp = data.players.find(p => p.playerName !== playerName);
      setOpponent(opp);
      setBattleState('matched');
      
      // Fetch questions for the battle
      await fetchBattleQuestions();
    });

    newSocket.on('battle-start', (data) => {
      console.log('🚀 Battle starting!', data);
      if (data.questions) {
        setQuestions(data.questions);
      }
      setBattleState('playing');
    });

    newSocket.on('opponent-answered', (data) => {
      console.log('👤 Opponent answered:', data);
      if (data.score !== undefined) {
        setOpponentScore(data.score);
      }
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
      console.log('🏁 Battle ended:', data);
      setBattleState('results');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
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
            finalScore: myScore + pointsEarned
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

  // Setup Screen
  if (battleState === 'setup') {
    return withVideoChat(
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 py-8 pt-20">
        <div className="max-w-lg mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Swords className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">1v1 Battle</h1>
              <div className="text-gray-600">
                <p className="font-semibold text-lg text-red-600">{decodeURIComponent(examId)}</p>
                <p>{decodeURIComponent(subject)} • {decodeURIComponent(topic)}</p>
              </div>
            </div>

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
                />
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  <Swords className="w-5 h-5" />
                  Battle Rules
                </h3>
                <ul className="space-y-1 text-sm text-red-800">
                  <li>• Real-time 1v1 quiz duel</li>
                  <li>• 10 questions, 30 seconds each</li>
                  <li>• Faster answers = More points</li>
                  <li>• Live chat with opponent</li>
                  <li>• Winner takes the glory! 🏆</li>
                </ul>
              </div>

              <button
                onClick={startMatchmaking}
                disabled={!playerName.trim()}
                className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Swords className="w-5 h-5" />
                Find Opponent
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
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto animate-pulse">
              <Swords className="w-16 h-16 text-white" />
            </div>
            <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-4 border-red-400 animate-ping opacity-30"></div>
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Finding Opponent...</h2>
          <p className="text-gray-300 mb-2">
            {decodeURIComponent(examId)} • {decodeURIComponent(topic)}
          </p>
          <p className="text-gray-400 text-sm mb-8">Matching you with a worthy challenger</p>
          
          <div className="flex items-center justify-center gap-2 mb-8">
            <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
            <span className="text-gray-400">Searching...</span>
          </div>
          
          <button
            onClick={cancelMatchmaking}
            className="px-8 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all font-semibold"
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
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isWinner ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : 
              isTie ? 'bg-gradient-to-br from-blue-400 to-blue-500' :
              'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              <Trophy className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-4xl font-black text-gray-900 mb-2">
              {isWinner ? '🎉 Victory!' : isTie ? '🤝 Tie Game!' : '😔 Defeat'}
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
