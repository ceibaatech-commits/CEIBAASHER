import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const BATTLE_SERVER_URL = window.location.origin || 'https://mobile-search-fix-1.preview.emergentagent.com';

const useLiveBattle = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
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
  const [showAllQuestions, setShowAllQuestions] = useState(isHost);
  const [loading, setLoading] = useState(autoJoin && !questions);
  const [quizStarted, setQuizStarted] = useState(false);
  
  // Social Features State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [reactions, setReactions] = useState([]);
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [selectedGiftRecipient, setSelectedGiftRecipient] = useState(null);
  const [giftNotification, setGiftNotification] = useState(null);
  const [followingStatus, setFollowingStatus] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const [quizStartTime, setQuizStartTime] = useState(null);
  
  const chatEndRef = useRef(null);

  // Confirmation modal states
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [hostActionConfirm, setHostActionConfirm] = useState(null);

  // HYBRID: Fetch room details via REST API when joining
  useEffect(() => {
    const joinViaREST = async () => {
      if (autoJoin && !questions && pin && playerName) {
        setLoading(true);
        try {
          console.log('🔄 HYBRID: Joining room via REST API (reliable method)');
          const userStr = localStorage.getItem('ceibaa_user');
          const localUser = userStr ? JSON.parse(userStr) : null;
          const userId = localUser ? localUser.id : playerName.toLowerCase().replace(/\s+/g, '_');
          
          const response = await axios.post(`${BATTLE_SERVER_URL}/api/battle/async/rooms/${pin}/join`, {
            player_id: userId,
            player_name: playerName,
            avatar: '👤'
          });
          
          if (response.data.success) {
            console.log('✅ REST JOIN SUCCESS:', response.data);
            const roomData = response.data.room;
            const questionsData = roomData.questions;
            
            setAllQuestions(questionsData);
            setCurrentQuestion(questionsData[0]);
            setTotalQuestions(questionsData.length);
            setParticipants([{ username: playerName, avatar: '👤' }]);
            
            if (response.data.leaderboard && response.data.leaderboard.length > 0) {
              const transformedLeaderboard = response.data.leaderboard.map(p => ({
                name: p.player_name,
                score: p.total_score,
                streak: 0
              }));
              setLeaderboard(transformedLeaderboard);
            }
            
            if (response.data.messages && response.data.messages.length > 0) {
              setChatMessages(response.data.messages.map(m => ({
                playerName: m.player_name,
                message: m.message,
                timestamp: m.timestamp
              })));
            }
            
            setLoading(false);
            setQuizStartTime(Date.now());
            setQuizStarted(true);
          }
        } catch (error) {
          console.error('❌ REST JOIN ERROR:', error);
          setLoading(false);
          let errorMessage = 'Failed to join room. Please try again.';
          if (error.response) {
            errorMessage = error.response.data.detail || errorMessage;
          }
          alert(errorMessage);
          navigate('/join-room');
        }
      }
    };
    
    joinViaREST();
  }, [autoJoin, questions, pin, playerName, navigate]);

  // AUTO-START: Set quiz start time and begin immediately when questions are available
  useEffect(() => {
    if (questions && questions.length > 0 && !quizStartTime) {
      setQuizStartTime(Date.now());
      setQuizStarted(true);
      console.log('🚀 AUTO-START: Quiz started for host immediately!');
    }
  }, [questions, quizStartTime]);

  useEffect(() => {
    if (!playerName || !pin) {
      navigate('/');
      return;
    }

    const newSocket = io(BATTLE_SERVER_URL, {
      path: '/api/battlews/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      timeout: 10000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_room', {
        roomId: pin,
        userData: {
          username: playerName,
          isHost: isHost || false,
          avatar: isHost ? '👑' : '👤'
        }
      });
    });
    
    newSocket.on('connect_error', (error) => {
      console.warn('⚠️ HYBRID: Socket.IO connection failed (polling fallback active):', error);
    });

    newSocket.on('leaderboard_updated', (data) => {
      const transformedLeaderboard = data.leaderboard.map(p => ({
        name: p.player_name,
        score: p.total_score,
        streak: 0
      }));
      setLeaderboard(transformedLeaderboard);
      const me = transformedLeaderboard.find(p => p.name === playerName);
      if (me) setMyScore(me.score);
    });
    
    newSocket.on('new_chat_message', (data) => {
      setChatMessages(prev => [...prev, {
        playerName: data.player_name,
        message: data.message,
        timestamp: data.timestamp
      }]);
    });

    newSocket.on('participant_joined', (data) => {
      setParticipants(data.room.participants);
      const updatedLeaderboard = data.room.participants.map(p => ({
        name: p.username,
        score: 0,
        streak: 0
      }));
      setLeaderboard(updatedLeaderboard);
    });

    newSocket.on('participant_left', (data) => {
      setParticipants(data.room.participants);
    });

    newSocket.on('leaderboard-update', (data) => {
      setLeaderboard(data.leaderboard);
      const me = data.leaderboard.find(p => p.name === playerName);
      if (me) setMyScore(me.score);
    });

    newSocket.on('leaderboard_update', (data) => {
      const transformedLeaderboard = data.leaderboard.map(p => ({
        name: p.username,
        score: p.score,
        streak: 0
      }));
      setLeaderboard(transformedLeaderboard);
      const me = transformedLeaderboard.find(p => p.name === playerName);
      if (me) {
        console.log(`✅ Updated score: ${me.score}`);
      }
    });

    newSocket.on('next_question', (data) => {
      if (data.question) {
        setCurrentQuestion(data.question);
        setQuestionNumber(data.questionNumber);
      } else if (data.questionNumber) {
        const nextIndex = data.questionNumber - 1;
        if (allQuestions[nextIndex]) {
          setCurrentQuestionIndex(nextIndex);
          setCurrentQuestion(allQuestions[nextIndex]);
          setQuestionNumber(data.questionNumber);
        }
      }
      setSelectedAnswer(null);
      setAnswerResult(null);
      setTimeLeft(30);
    });

    newSocket.on('quiz-paused', () => {
      setIsPaused(true);
    });

    newSocket.on('quiz-resumed', () => {
      setIsPaused(false);
    });

    newSocket.on('new_message', (data) => {
      setChatMessages(prev => [...prev, data]);
    });

    newSocket.on('new_reaction', (data) => {
      const reactionId = Date.now() + Math.random();
      setReactions(prev => [...prev, { ...data, id: reactionId }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== reactionId));
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

    newSocket.on('battle_completed', (data) => {
      const finalMessage = `Quiz Ended!\n\nFinal Scores:\n${data.leaderboard ? data.leaderboard.map((p, i) => `${i+1}. ${p.username}: ${p.score} points`).join('\n') : 'No scores available'}`;
      alert(finalMessage);
      setTimeout(() => navigate('/'), 1000);
    });

    newSocket.on('quiz-ended', (data) => {
      navigate(`/battle-results/${pin}`, { 
        state: { 
          leaderboard: data.leaderboard,
          playerName 
        } 
      });
    });

    return () => {
      if (newSocket) newSocket.close();
    };
  }, [pin, playerName, isHost, allQuestions, navigate]);
  
  // HYBRID: REST Polling for leaderboard (fallback)
  useEffect(() => {
    if (!pin || !allQuestions || allQuestions.length === 0) return;
    
    let lastMessageTimestamp = null;
    
    const pollUpdates = async () => {
      try {
        const leaderboardResponse = await axios.get(`${BATTLE_SERVER_URL}/api/battle/async/rooms/${pin}/leaderboard`);
        if (leaderboardResponse.data.success && leaderboardResponse.data.leaderboard.length > 0) {
          const transformedLeaderboard = leaderboardResponse.data.leaderboard.map(p => ({
            name: p.player_name,
            score: p.total_score,
            streak: 0
          }));
          setLeaderboard(transformedLeaderboard);
          const me = transformedLeaderboard.find(p => p.name === playerName);
          if (me) setMyScore(me.score);
        }
        
        const messagesUrl = lastMessageTimestamp 
          ? `${BATTLE_SERVER_URL}/api/battle/async/rooms/${pin}/messages?since=${lastMessageTimestamp}`
          : `${BATTLE_SERVER_URL}/api/battle/async/rooms/${pin}/messages`;
        
        const messagesResponse = await axios.get(messagesUrl);
        if (messagesResponse.data.success && messagesResponse.data.messages.length > 0) {
          const newMessages = messagesResponse.data.messages.map(m => ({
            playerName: m.player_name,
            message: m.message,
            timestamp: m.timestamp
          }));
          
          if (lastMessageTimestamp) {
            setChatMessages(prev => [...prev, ...newMessages]);
          } else {
            setChatMessages(newMessages);
          }
          
          const latestMessage = messagesResponse.data.messages[messagesResponse.data.messages.length - 1];
          lastMessageTimestamp = latestMessage.timestamp;
        }
      } catch (error) {
        console.log('⚠️ HYBRID: Polling failed:', error.message);
      }
    };
    
    const pollingInterval = setInterval(pollUpdates, 5000);
    pollUpdates();
    
    return () => clearInterval(pollingInterval);
  }, [pin, allQuestions, playerName]);

  // HEARTBEAT: Keep connection alive
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
    if (timeLeft > 0 && selectedAnswer === null && !isPaused && currentQuestion) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && selectedAnswer === null && currentQuestion) {
      handleAnswerSelect(-1);
    }
  }, [timeLeft, selectedAnswer, isPaused, currentQuestion]);

  // Check follow status when leaderboard or user changes
  useEffect(() => {
    const checkFollowStatus = async () => {
      const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : !!isAuthenticated;
      if (leaderboard.length > 0 && isAuth && user?.id) {
        try {
          const statusMap = {};
          for (const player of leaderboard) {
            if (player.name !== playerName) {
              const userSearchResponse = await axios.get(`${BATTLE_SERVER_URL}/api/auth/search-user?name=${encodeURIComponent(player.name)}`);
              const targetUserId = userSearchResponse.data?.user_id || player.name.toLowerCase().replace(/\s+/g, '_');
              
              const response = await axios.get(`${BATTLE_SERVER_URL}/api/ceep/is-following/${user.id}/${targetUserId}`);
              statusMap[player.name] = response.data.is_following;
            }
          }
          setFollowingStatus(statusMap);
        } catch (error) {
          console.error('Error checking follow status:', error);
        }
      }
    };

    checkFollowStatus();
  }, [leaderboard, user, playerName, isAuthenticated]);

  const postBattleResults = useCallback(async () => {
    try {
      const userId = playerName.toLowerCase().replace(/\s+/g, '_');
      const rank = leaderboard.findIndex(p => p.name === playerName) + 1;
      const opponents = leaderboard
        .filter(p => p.name !== playerName)
        .map(p => p.name);
      
      const stateExam = examId || 'Quiz';
      const stateTopic = topic || 'General';
      
      const postData = {
        user_id: userId,
        user_name: playerName,
        score: myScore,
        rank: rank || leaderboard.length,
        exam: stateExam,
        topic: stateTopic,
        opponents: opponents,
        total_participants: leaderboard.length,
        questions_correct: Math.floor(myScore / 20)
      };
      
      const response = await axios.post(`${BATTLE_SERVER_URL}/api/social/battle-post`, postData);
      return response.data.success;
    } catch (error) {
      console.error('❌ Error posting battle results:', error);
      return false;
    }
  }, [myScore, playerName, leaderboard, examId, topic]);

  const handleAnswerSelect = useCallback((index) => {
    if (selectedAnswer !== null || isPaused || !currentQuestion) return;
    
    setSelectedAnswer(index);
    
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
    const pointsEarned = isCorrect ? Math.max(10, timeLeft * 2) : 0;
    
    setAnswerResult({
      isCorrect,
      correctAnswer: correctAnswerIndex,
      points: pointsEarned
    });
    
    if (isCorrect) {
      const newScore = myScore + pointsEarned;
      setMyScore(newScore);
      
      setLeaderboard(prevLeaderboard => {
        const updated = prevLeaderboard.map(p => 
          p.name === playerName 
            ? { ...p, score: newScore }
            : p
        );
        return updated.sort((a, b) => b.score - a.score);
      });
    }
    
    const answerData = {
      question_id: currentQuestion.id || `q${currentQuestionIndex}`,
      selected_answer: index,
      is_correct: isCorrect,
      time_spent: 30 - timeLeft,
      points: pointsEarned
    };
    
    setSubmittedAnswers(prev => {
      const updated = [...prev, answerData];
      
      setTimeout(() => {
        if (currentQuestionIndex < allQuestions.length - 1) {
          const nextIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIndex);
          setCurrentQuestion(allQuestions[nextIndex]);
          setQuestionNumber(nextIndex + 1);
          setSelectedAnswer(null);
          setAnswerResult(null);
          setTimeLeft(30);
        } else {
          setTimeout(async () => {
            const totalTime = Math.floor((Date.now() - quizStartTime) / 1000);
            try {
              const userStr = localStorage.getItem('ceibaa_user');
              const localUser = userStr ? JSON.parse(userStr) : null;
              const userId = localUser ? localUser.id : playerName.toLowerCase().replace(/\s+/g, '_');
              
              const submitResponse = await axios.post(`${BATTLE_SERVER_URL}/api/battle/async/rooms/${pin}/submit`, {
                player_id: userId,
                player_name: playerName,
                answers: updated,
                total_score: myScore,
                total_time: totalTime,
                completed_at: new Date().toISOString()
              });
              
              if (submitResponse.data.success) {
                const transformedLeaderboard = submitResponse.data.leaderboard.map(p => ({
                  name: p.player_name,
                  score: p.total_score,
                  streak: 0
                }));
                setLeaderboard(transformedLeaderboard);
                await postBattleResults();
                
                navigate(`/quiz-results/${pin}`, {
                  state: {
                    playerName,
                    finalScore: myScore,
                    totalTime: totalTime,
                    rank: submitResponse.data.rank,
                    totalQuestions: allQuestions.length
                  }
                });
              }
            } catch (error) {
              console.error('❌ HYBRID: Failed to submit answers:', error);
              navigate(`/quiz-results/${pin}`, {
                state: {
                  playerName,
                  finalScore: myScore,
                  totalTime: totalTime,
                  rank: 0,
                  totalQuestions: allQuestions.length,
                  submissionFailed: true
                }
              });
            }
          }, 2000);
        }
      }, 2000);
      
      return updated;
    });
  }, [
    selectedAnswer,
    isPaused,
    currentQuestion,
    timeLeft,
    myScore,
    playerName,
    currentQuestionIndex,
    allQuestions,
    quizStartTime,
    pin,
    navigate,
    postBattleResults
  ]);

  const pauseQuiz = () => {
    if (socket?.connected) socket.emit('pause_quiz', { pin });
  };

  const resumeQuiz = () => {
    if (socket?.connected) socket.emit('resume_quiz', { pin });
  };

  const skipQuestion = () => {
    setHostActionConfirm({
      type: 'skip',
      title: 'Skip this question?',
      body: 'All players will jump to the next question. This cannot be undone.',
      confirmLabel: 'Skip',
    });
  };

  const performSkipQuestion = () => {
    if (socket?.connected) socket.emit('skip_question', { pin });
    setHostActionConfirm(null);
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
    setHostActionConfirm({
      type: 'end',
      title: 'End the quiz now?',
      body: 'All players will see the final results immediately.',
      confirmLabel: 'End Quiz',
    });
  };

  const performEndQuiz = () => {
    if (socket?.connected) socket.emit('complete_battle', { roomId: pin });
    setHostActionConfirm(null);
    setTimeout(() => navigate('/'), 1000);
  };

  const performQuit = () => {
    try {
      if (socket) {
        socket.emit('leave_room', { roomId: pin });
        socket.disconnect();
      }
    } catch (err) {
      console.warn('[quitQuiz] socket cleanup failed:', err);
    }
    setShowQuitConfirm(false);
    
    const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : !!isAuthenticated;
    if (isAuth) {
      navigate('/profile/board', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const quitQuiz = () => setShowQuitConfirm(true);

  const handleFollow = async (player) => {
    const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : !!isAuthenticated;
    if (!isAuth) {
      alert('Please log in to follow other players');
      return;
    }

    if (followingStatus[player.name]) {
      alert(`You are already following ${player.name}`);
      return;
    }

    try {
      let targetUserId;
      try {
        const userSearchResponse = await axios.get(`${BATTLE_SERVER_URL}/api/auth/search-user?name=${encodeURIComponent(player.name)}`);
        targetUserId = userSearchResponse.data?.user_id;
      } catch {
        // use fallback
      }
      
      if (!targetUserId) {
        targetUserId = player.name.toLowerCase().replace(/\s+/g, '_');
      }
      
      const response = await axios.post(`${BATTLE_SERVER_URL}/api/ceep/ceep`, {
        user_id: user.id,
        ceep_user_id: targetUserId,
        user_name: user.name,
        ceep_user_name: player.name
      });
      
      if (response.data.success) {
        setFollowingStatus(prev => ({ ...prev, [player.name]: true }));
        alert(`✅ You are now following ${player.name}!`);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error following user:', error);
      alert('Failed to follow user. Please try again.');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    const userStr = localStorage.getItem('ceibaa_user');
    const localUser = userStr ? JSON.parse(userStr) : null;
    const userId = localUser?.id || user?.id || playerName.toLowerCase().replace(/\s+/g, '_');

    try {
      // Primary path: async-room REST API (persists chat for polling + replay).
      const response = await axios.post(`${BATTLE_SERVER_URL}/api/battle/async/rooms/${pin}/messages`, {
        player_id: userId,
        player_name: playerName,
        message: text,
        avatar: '👤'
      });

      if (response.data?.success) {
        setChatInput('');
        return;
      }
      throw new Error('Async chat endpoint returned unsuccessful response');
    } catch (error) {
      console.warn('⚠️ Async chat send failed, trying socket fallback:', error?.response?.data || error.message);

      // Fallback path: realtime socket event for room-manager battles.
      if (socket && socket.connected) {
        socket.emit('send_message', {
          roomId: pin,
          message: text,
          playerName,
          player_name: playerName,
        });
        setChatInput('');
        return;
      }

      console.error('❌ Failed to send message (REST + socket):', error);
      alert('Failed to send message. Please try again.');
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

  const myRank = leaderboard.findIndex(p => p.name === playerName) + 1;

  return {
    pin,
    playerName,
    user,
    isAuthenticated,
    socket,
    allQuestions,
    currentQuestionIndex,
    currentQuestion,
    setCurrentQuestionIndex,
    setCurrentQuestion,
    questionNumber,
    setQuestionNumber,
    totalQuestions,
    timeLeft,
    setTimeLeft,
    selectedAnswer,
    setSelectedAnswer,
    leaderboard,
    myScore,
    isPaused,
    answerResult,
    participants,
    showAllQuestions,
    loading,
    quizStarted,
    chatMessages,
    chatInput,
    setChatInput,
    showChat,
    setShowChat,
    reactions,
    showGiftMenu,
    setShowGiftMenu,
    selectedGiftRecipient,
    setSelectedGiftRecipient,
    giftNotification,
    followingStatus,
    chatEndRef,
    handleAnswerSelect,
    pauseQuiz,
    resumeQuiz,
    skipQuestion,
    performSkipQuestion,
    nextQuestion,
    endQuiz,
    performEndQuiz,
    showQuitConfirm,
    setShowQuitConfirm,
    quitQuiz,
    performQuit,
    handleFollow,
    sendMessage,
    sendReaction,
    sendGift,
    hostActionConfirm,
    setHostActionConfirm,
    isHost,
    myRank,
  };
};

export default useLiveBattle;
