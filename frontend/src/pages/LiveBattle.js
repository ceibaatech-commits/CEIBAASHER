import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Zap, Star, Pause, Play, SkipForward, X, AlertCircle, MessageCircle, Send, Gift, Smile, ArrowLeft } from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';

// Connect to battle server through the backend domain
const BATTLE_SERVER_URL = process.env.REACT_APP_BACKEND_URL || 'https://battle-proxy-fix.preview.emergentagent.com';

const LiveBattle = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName, isHost, questions, roomInfo, examId, subject, topic, autoJoin } = location.state || {};
  
  const [socket, setSocket] = useState(null);
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
  const [showAllQuestions, setShowAllQuestions] = useState(isHost); // Host can see all questions
  const [loading, setLoading] = useState(autoJoin && !questions); // Loading state for fetching questions
  
  // Social Features State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [reactions, setReactions] = useState([]);
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [selectedGiftRecipient, setSelectedGiftRecipient] = useState(null);
  const [giftNotification, setGiftNotification] = useState(null);
  const chatEndRef = useRef(null);

  // Fetch room details and questions when auto-joining
  useEffect(() => {
    if (autoJoin && !questions && pin) {
      // Joiners will receive questions via Socket.io 'room_joined' event
      // No need to fetch separately
      setLoading(true);
    }
  }, [autoJoin, questions, pin]);

  useEffect(() => {
    if (!playerName || !pin) {
      navigate('/');
      return;
    }

    const newSocket = io(BATTLE_SERVER_URL, {
      path: '/api/battlews',  // Custom path to avoid ingress conflicts
      transports: ['polling', 'websocket'],
      reconnection: true
    });
    setSocket(newSocket);

    // Connection successful handler
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected! ID:', newSocket.id);
      console.log('🔍 Connect Debug - isHost:', isHost, 'questions:', questions ? questions.length : 'undefined', 'pin:', pin);
      
      // If host has questions, send them IMMEDIATELY upon connection
      if (isHost && questions && questions.length > 0) {
        console.log(`📤 HOST: Sending ${questions.length} questions IMMEDIATELY after connect`);
        // Send questions right away, before even joining the room
        setTimeout(() => {
          newSocket.emit('set_room_questions', {
            roomId: pin,
            questions: questions
          });
          console.log('✅ set_room_questions event emitted');
        }, 500); // Small delay to ensure connection is stable
      }
    });

    // Join room
    newSocket.emit('join_room', {
      roomId: pin,
      userData: {
        username: playerName,
        isHost: isHost || false,
        avatar: isHost ? '👑' : '👤'
      }
    });

    // Listen for room_joined event (receives questions for joiners)
    newSocket.on('room_joined', (data) => {
      console.log('✅ Room joined successfully:', data);
      console.log('🔍 Debug - isHost:', isHost, 'questions:', questions ? questions.length : 'undefined');
      
      // If this is a joiner and questions are provided, set them
      if (!isHost && data.questions && data.questions.length > 0) {
        console.log(`📝 Received ${data.questions.length} questions from host`);
        setAllQuestions(data.questions);
        setCurrentQuestion(data.questions[0]);
        setTotalQuestions(data.questions.length);
        setLoading(false);
      } else if (!isHost) {
        // Joiner but no questions yet - host hasn't set them
        console.log('⏳ Waiting for host to set questions...');
        // Set a timeout to stop loading after 10 seconds if no questions
        setTimeout(() => {
          if ((!allQuestions || allQuestions.length === 0) && !currentQuestion) {
            setLoading(false);
            console.error('❌ Timeout: No questions received after 10 seconds');
            alert('Failed to load questions. The host may not have set up the quiz properly. Please ask the host to refresh.');
          }
        }, 10000);
      }
      
      // BACKUP: If host didn't send questions on connect, send them now
      if (isHost && questions && questions.length > 0) {
        console.log(`📤 HOST (backup): Sending ${questions.length} questions via room_joined`);
        newSocket.emit('set_room_questions', {
          roomId: pin,
          questions: questions
        });
      } else if (isHost && (!questions || questions.length === 0)) {
        console.error('❌ HOST ERROR: No questions available!', { 
          isHost, 
          questionsExist: !!questions, 
          questionsLength: questions?.length 
        });
      }
    });

    // Listen for questions being set (in case joiner joins before host sets them)
    newSocket.on('questions_updated', (data) => {
      console.log('📥 Questions updated by host:', data);
      if (!isHost && data.questions && data.questions.length > 0) {
        console.log(`📝 Received ${data.questions.length} questions after host update`);
        setAllQuestions(data.questions);
        setCurrentQuestion(data.questions[0]);
        setTotalQuestions(data.questions.length);
        setLoading(false);
      }
    });

    // Listen for participants joining
    newSocket.on('participant_joined', (data) => {
      setParticipants(data.room.participants);
      console.log('Participant joined:', data.participant.username);
    });

    newSocket.on('participant_left', (data) => {
      setParticipants(data.room.participants);
    });

    newSocket.on('leaderboard-update', (data) => {
      setLeaderboard(data.leaderboard);
      const me = data.leaderboard.find(p => p.name === playerName);
      if (me) setMyScore(me.score);
    });

    newSocket.on('next_question', (data) => {
      console.log('➡️ Moving to next question:', data);
      if (data.question) {
        setCurrentQuestion(data.question);
        setQuestionNumber(data.questionNumber);
      }
      setSelectedAnswer(null);
      setAnswerResult(null);
      setTimeLeft(30);
    });

    newSocket.on('quiz-paused', (data) => {
      setIsPaused(true);
    });

    newSocket.on('quiz-resumed', (data) => {
      setIsPaused(false);
    });

    newSocket.on('answer-result', (data) => {
      setAnswerResult(data);
    });

    // Social Features Listeners
    newSocket.on('new_message', (data) => {
      setChatMessages(prev => [...prev, data]);
      console.log('💬 New chat message received:', data);
    });

    newSocket.on('new_reaction', (data) => {
      setReactions(prev => [...prev, { ...data, id: Date.now() }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== data.id));
      }, 3000);
    });

    newSocket.on('gift-received', (data) => {
      setGiftNotification({ type: 'received', ...data });
      setTimeout(() => setGiftNotification(null), 5000);
    });

    newSocket.on('gift-sent', (data) => {
      setGiftNotification({ type: 'sent', ...data });
      setTimeout(() => setGiftNotification(null), 3000);
    });

    newSocket.on('gift-error', (data) => {
      alert(data.message);
    });

    newSocket.on('quiz-ended', (data) => {
      navigate(`/battle-results/${pin}`, { 
        state: { 
          leaderboard: data.leaderboard,
          playerName 
        } 
      });
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && selectedAnswer === null && !isPaused && currentQuestion) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && selectedAnswer === null && currentQuestion) {
      handleAnswerSelect(-1);
    }
  }, [timeLeft, selectedAnswer, isPaused, currentQuestion]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAnswerSelect = (index) => {
    if (selectedAnswer !== null || isPaused || !currentQuestion) return;
    
    setSelectedAnswer(index);
    socket.emit('submit-answer', {
      pin,
      questionId: currentQuestion.id,
      answerIndex: index,
      timeLeft
    });
  };

  const pauseQuiz = () => {
    socket.emit('pause-quiz', { pin });
  };

  const resumeQuiz = () => {
    socket.emit('resume-quiz', { pin });
  };

  const skipQuestion = () => {
    if (window.confirm('Skip to next question?')) {
      socket.emit('skip-question', { pin });
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(allQuestions[nextIndex]);
      setQuestionNumber(nextIndex + 1);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setTimeLeft(30);
      
      // Emit to all participants
      if (socket) {
        socket.emit('next_question', {
          roomId: pin,
          question: allQuestions[nextIndex],
          questionNumber: nextIndex + 1
        });
      }
    }
  };

  const endQuiz = () => {
    if (window.confirm('End quiz now? All players will see results.')) {
      socket.emit('complete_battle', { roomId: pin });
      // Navigate to home page after ending
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  };

  const quitQuiz = () => {
    if (window.confirm('Are you sure you want to quit? Your progress will be lost.')) {
      // Leave the room
      if (socket) {
        socket.emit('leave_room', { roomId: pin });
        socket.disconnect();
      }
      // Navigate to home page
      navigate('/');
    }
  };

  // Social Feature Functions
  const sendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim() && socket) {
      socket.emit('send_message', { 
        roomId: pin, 
        message: chatInput,
        sender: playerName
      });
      setChatInput('');
    }
  };

  const sendReaction = (emoji) => {
    if (socket) {
      socket.emit('send_reaction', { 
        roomId: pin, 
        emoji,
        sender: playerName
      });
    }
  };

  const sendGift = (recipientId, giftType) => {
    if (socket) {
      socket.emit('send-gift', { pin, recipientId, giftType });
      setShowGiftMenu(false);
      setSelectedGiftRecipient(null);
    }
  };

  if (!currentQuestion) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  const myRank = leaderboard.findIndex(p => p.name === playerName) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Loading State for Auto-Join */}
        {loading && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading quiz questions...</p>
            </div>
          </div>
        )}

        {/* Quiz Content - Only show when not loading */}
        {!loading && (
          <>
        {/* Back/Quit Button */}
        <div className="mb-4">
          <button
            onClick={quitQuiz}
            className="flex items-center text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-semibold">Quit & Back to Home</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Timer & Progress */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  Question {questionNumber} / {totalQuestions}
                </div>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  timeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <Clock className="w-5 h-5" />
                  <span className="font-bold text-lg">{timeLeft}s</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Host Controls */}
            {isHost && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-orange-900 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Host Controls
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <button
                    onClick={isPaused ? resumeQuiz : pauseQuiz}
                    className="flex items-center justify-center space-x-2 bg-white hover:bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-semibold transition-all border-2 border-orange-300"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={nextQuestion}
                    disabled={currentQuestionIndex >= allQuestions.length - 1}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Next Q</span>
                  </button>
                  <button
                    onClick={skipQuestion}
                    className="flex items-center justify-center space-x-2 bg-white hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold transition-all border-2 border-blue-300"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Skip</span>
                  </button>
                  <button
                    onClick={endQuiz}
                    className="flex items-center justify-center space-x-2 bg-white hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold transition-all border-2 border-red-300"
                  >
                    <X className="w-4 h-4" />
                    <span>End Quiz</span>
                  </button>
                </div>
                {isPaused && (
                  <div className="mt-3 bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded">
                    <p className="text-yellow-800 text-sm font-semibold">⏸️ Quiz is paused</p>
                  </div>
                )}
              </div>
            )}

            {/* Pause Overlay for Players */}
            {!isHost && isPaused && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl shadow-md p-6 text-center">
                <Pause className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-yellow-900">Quiz Paused</h3>
                <p className="text-yellow-700">Waiting for host to resume...</p>
              </div>
            )}

            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = answerResult && answerResult.correctAnswer === index;
                  const isWrong = isSelected && answerResult && !answerResult.isCorrect;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={selectedAnswer !== null || isPaused}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedAnswer === null && !isPaused
                          ? 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                          : isCorrect
                          ? 'border-green-600 bg-green-50'
                          : isWrong
                          ? 'border-red-600 bg-red-50'
                          : isSelected
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 opacity-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isCorrect
                            ? 'bg-green-600 text-white'
                            : isWrong
                            ? 'bg-red-600 text-white'
                            : isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1 font-medium text-gray-900">{option}</span>
                        {isCorrect && <span className="text-green-600 font-bold">✓</span>}
                        {isWrong && <span className="text-red-600 font-bold">✗</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Answer Feedback */}
              {answerResult && (
                <div className={`mt-4 p-4 rounded-lg ${
                  answerResult.isCorrect ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'
                }`}>
                  <p className={`font-bold ${answerResult.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {answerResult.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {answerResult.isCorrect 
                      ? `+${answerResult.points} points earned!` 
                      : `Correct answer: ${String.fromCharCode(65 + answerResult.correctAnswer)}`
                    }
                  </p>
                </div>
              )}

              {/* Quick Reactions Bar */}
              <div className="mt-4 flex items-center justify-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Smile className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600 font-medium mr-2">Quick React:</span>
                {['👍', '🔥', '😮', '💪', '🎯', '🎉'].map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => sendReaction(emoji)}
                    className="text-2xl hover:scale-125 transition-transform bg-white rounded-lg p-2 shadow-sm hover:shadow-md"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Floating Reactions */}
            <div className="fixed inset-0 pointer-events-none z-50">
              {reactions.map((reaction) => (
                <div
                  key={reaction.id}
                  className="absolute animate-bounce"
                  style={{
                    left: `${Math.random() * 80 + 10}%`,
                    top: `${Math.random() * 60 + 20}%`,
                    animation: 'float 3s ease-out forwards'
                  }}
                >
                  <div className="bg-white rounded-full shadow-lg p-3">
                    <div className="text-3xl">{reaction.emoji}</div>
                    <div className="text-xs text-gray-600 text-center mt-1">{reaction.playerName}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* All Questions View (Host Only) */}
            {isHost && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-blue-900 flex items-center">
                    📚 All Questions ({allQuestions.length})
                  </h3>
                  <span className="text-sm text-blue-600 bg-white px-3 py-1 rounded-full font-semibold">
                    Host View Only
                  </span>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setCurrentQuestion(q);
                        setQuestionNumber(idx + 1);
                        setSelectedAnswer(null);
                        setAnswerResult(null);
                      }}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        idx === currentQuestionIndex
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-white hover:bg-blue-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === currentQuestionIndex
                            ? 'bg-white text-blue-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${
                            idx === currentQuestionIndex ? 'text-white' : 'text-gray-800'
                          }`}>
                            {q.question}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={`px-2 py-1 rounded ${
                                  optIdx === q.correct
                                    ? idx === currentQuestionIndex
                                      ? 'bg-green-500 text-white'
                                      : 'bg-green-100 text-green-800'
                                    : idx === currentQuestionIndex
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}. {opt.substring(0, 20)}...
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gift Notification */}
            {giftNotification && (
              <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-xl animate-slide-in ${
                giftNotification.type === 'received' ? 'bg-green-100 border-2 border-green-500' : 'bg-blue-100 border-2 border-blue-500'
              }`}>
                <div className="flex items-center space-x-3">
                  <Gift className={`w-8 h-8 ${giftNotification.type === 'received' ? 'text-green-600' : 'text-blue-600'}`} />
                  <div>
                    <p className={`font-bold ${giftNotification.type === 'received' ? 'text-green-800' : 'text-blue-800'}`}>
                      {giftNotification.type === 'received' ? '🎁 Gift Received!' : '✨ Gift Sent!'}
                    </p>
                    <p className="text-sm text-gray-700">
                      {giftNotification.type === 'received' 
                        ? `${giftNotification.from} sent you a ${giftNotification.giftType}! +${giftNotification.points} points`
                        : `You sent a ${giftNotification.giftType} to ${giftNotification.to}! -${giftNotification.cost} points`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Section */}
          <div className="space-y-4">
            {/* My Score */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80">Your Score</span>
                <Trophy className="w-6 h-6" />
              </div>
              <div className="text-4xl font-black mb-1">{myScore}</div>
              <div className="text-white/80 text-sm">
                Rank: #{myRank || '-'}
              </div>
            </div>

            {/* Live Leaderboard */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                Live Leaderboard
              </h3>
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((player, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      player.name === playerName 
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-400 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-400 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{player.name}</p>
                      {player.streak > 1 && (
                        <div className="flex items-center space-x-1 text-xs text-orange-600">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{player.streak} streak</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      <p className="font-bold text-purple-600">{player.score}</p>
                      {player.name !== playerName && (
                        <button
                          onClick={() => {
                            setSelectedGiftRecipient(player);
                            setShowGiftMenu(true);
                          }}
                          className="p-1.5 bg-pink-100 hover:bg-pink-200 rounded-lg transition-colors"
                          title="Send Gift"
                        >
                          <Gift className="w-4 h-4 text-pink-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Code & Share */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-4 border-2 border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center">
                🔑 Room Code
              </h3>
              <div className="bg-white rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Share this code with friends:</p>
                    <p className="text-3xl font-black text-green-600 tracking-wider font-mono">
                      {pin}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pin);
                      alert('Room code copied to clipboard! 📋');
                    }}
                    className="p-3 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                    title="Copy Room Code"
                  >
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Share Button */}
              <button
                onClick={() => {
                  const shareText = `Join my Ceibaa quiz battle! 🎮\nRoom Code: ${pin}\n\nJoin now at: ${window.location.origin}/join-room`;
                  
                  if (navigator.share) {
                    navigator.share({
                      title: 'Join Ceibaa Battle',
                      text: shareText,
                      url: `${window.location.origin}/join-room`
                    }).catch(err => console.log('Share failed:', err));
                  } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(shareText);
                    alert('Share text copied to clipboard! 📋\nPaste it anywhere to invite friends.');
                  }
                }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share Room</span>
              </button>
              
              {/* Participants Count */}
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600">
                  👥 <span className="font-bold text-green-700">{participants.length || 1}</span> / 50 players
                </p>
              </div>
            </div>

            {/* Battle Chat */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
                  Battle Chat
                </h3>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {showChat ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showChat && (
                <>
                  <div className="h-48 overflow-y-auto mb-3 space-y-2 bg-gray-50 rounded-lg p-2">
                    {chatMessages.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8">No messages yet. Start the conversation!</p>
                    ) : (
                      chatMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded-lg ${
                            msg.playerName === playerName
                              ? 'bg-purple-100 ml-4'
                              : 'bg-white mr-4'
                          }`}
                        >
                          <p className="font-semibold text-xs text-gray-600">{msg.playerName}</p>
                          <p className="text-sm text-gray-900">{msg.message}</p>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <form onSubmit={sendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      maxLength={100}
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Scoring Info */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">Scoring System:</h4>
              <div className="space-y-1 text-xs text-blue-800">
                <p>✓ Base: 100 points</p>
                <p>⚡ Time bonus: 2 pts/sec</p>
                <p>🔥 Streak: +10 pts each</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gift Menu Modal */}
        {showGiftMenu && selectedGiftRecipient && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Send Gift to {selectedGiftRecipient.name}</h3>
                <button
                  onClick={() => {
                    setShowGiftMenu(false);
                    setSelectedGiftRecipient(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">Your Score: {myScore} points</p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: 'star', emoji: '⭐', name: 'Star', cost: 10, value: 5 },
                  { type: 'diamond', emoji: '💎', name: 'Diamond', cost: 50, value: 25 },
                  { type: 'crown', emoji: '👑', name: 'Crown', cost: 100, value: 50 },
                  { type: 'trophy', emoji: '🏆', name: 'Trophy', cost: 200, value: 100 }
                ].map((gift) => (
                  <button
                    key={gift.type}
                    onClick={() => sendGift(selectedGiftRecipient.id, gift.type)}
                    disabled={myScore < gift.cost}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      myScore >= gift.cost
                        ? 'border-purple-300 hover:border-purple-500 hover:bg-purple-50 cursor-pointer'
                        : 'border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-4xl mb-2">{gift.emoji}</div>
                    <p className="font-bold text-gray-900">{gift.name}</p>
                    <p className="text-xs text-gray-600">Cost: {gift.cost} pts</p>
                    <p className="text-xs text-green-600">They get: {gift.value} pts</p>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <p className="text-xs text-yellow-800">
                  💡 Sending gifts shows appreciation and gives them bonus points!
                </p>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default LiveBattle;
