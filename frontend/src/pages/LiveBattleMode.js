import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Video, VideoOff, Mic, MicOff, Trophy, Clock } from 'lucide-react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import axios from 'axios';
import BattleVideoChat from '../components/BattleVideoChat';
import Header from '../components/Header';
import FollowButton from '../components/FollowButton';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = window.location.origin || 'http://localhost:8001';
const API_URL = BACKEND_URL;
const QUIZ_API_URL = BACKEND_URL;
const SOCKET_URL = BACKEND_URL; // Socket.IO integrated with FastAPI on port 8001

const LiveBattleMode = () => {
  const { examId, subject, topic } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  
  const [battleState, setBattleState] = useState('setup'); // setup, searching, matched, playing, results
  const [playerName, setPlayerName] = useState('');
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  // Rematch state: 'idle' | 'pending' (I requested) | 'requested' (opponent requested)
  const [rematchState, setRematchState] = useState('idle');
  const roomIdRef = useRef(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  
  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  
  // WebRTC state
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      path: '/api/battlews/socket.io',  // Battle Socket.IO mounted at /api/battlews in server.py
      transports: ['polling', 'websocket']
    });
    setSocket(newSocket);

    // Authenticate immediately so backend knows user_id (used for block filter + match-found enrichment)
    newSocket.on('connect', () => {
      const u = userRef.current;
      if (u && u.id) {
        newSocket.emit('authenticate', { userData: { id: u.id, username: u.username, name: u.name } });
      }
    });

    newSocket.on('waiting', (data) => {
    });

    newSocket.on('match-found', async (data) => {
      // Reset per-battle state so rematches start clean
      setMyScore(0);
      setOpponentScore(0);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setTimeLeft(30);
      setRematchState('idle');

      setRoomId(data.roomId);
      // Backend now sends a per-socket payload: players[0]=self, players[1]=opponent
      // Fall back to legacy name-based filtering for safety.
      const opp = data.players[1] || data.players.find(p => p.playerName !== playerName);
      setOpponent(opp);
      setBattleState('matched');

      // Start quiz
      await startBattleQuiz();

      // Initialize WebRTC
      initializeWebRTC(data.roomId, newSocket);
    });

    newSocket.on('rematch-pending', () => setRematchState('pending'));
    newSocket.on('rematch-requested', () => setRematchState('requested'));
    newSocket.on('rematch-declined', () => setRematchState('idle'));
    newSocket.on('rematch-timeout', () => setRematchState('idle'));

    // Live opponent progress updates (score + question index)
    newSocket.on('opponent-answered', (data) => {
      if (typeof data?.score === 'number') {
        setOpponentScore(data.score);
      }
    });

    newSocket.on('opponent-score-update', (data) => {
      if (typeof data?.score === 'number') {
        setOpponentScore(data.score);
      }
    });

    newSocket.on('opponent-disconnected', () => {
      alert('Opponent disconnected!');
      navigate(`/exam/${examId}`);
    });

    return () => {
      newSocket.close();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line
  }, []);

  // HEARTBEAT: Keep connection alive during 1v1 battle (prevents timeout)
  useEffect(() => {
    if (!socket) return;

    // Send heartbeat every 10 seconds to prevent timeout
    const heartbeatInterval = setInterval(() => {
      if (socket && socket.connected) {
        socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 10000); // 10 seconds

    // Listen for heartbeat acknowledgment
    socket.on('heartbeat_ack', (data) => {
    });

    return () => {
      clearInterval(heartbeatInterval);
      socket.off('heartbeat_ack');
    };
  }, [socket]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (battleState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (battleState === 'playing' && timeLeft === 0) {
      handleNextQuestion();
    }
  // eslint-disable-next-line
  }, [timeLeft, battleState]);

  const initializeWebRTC = async (room, socketConnection) => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);

      // Create peer connection
      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream
      });

      newPeer.on('signal', (data) => {
        socketConnection.emit('webrtc_offer', { roomId: room, offer: data });
      });

      newPeer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      socketConnection.on('webrtc-answer', ({ answer }) => {
        newPeer.signal(answer);
      });

      socketConnection.on('webrtc-ice-candidate', ({ candidate }) => {
        newPeer.signal(candidate);
      });

      setPeer(newPeer);
    } catch (error) {
      console.error('WebRTC initialization error:', error);
      alert('Could not access camera/microphone. Battle will continue without video.');
      await startBattleQuiz();
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setAudioEnabled(!audioEnabled);
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
      subject: subject
    });
    
    setBattleState('searching');
  };

  const cancelMatchmaking = () => {
    socket.emit('cancel-match');
    setBattleState('setup');
  };

  const startBattleQuiz = async () => {
    try {
      const response = await axios.post(`${QUIZ_API_URL}/api/quiz/start`, {
        exam: examId,
        subject: subject,
        topic: topic
      });
      
      if (response.data.success) {
        setQuestions(response.data.questions);
        setQuizId(response.data.quizId);
        setBattleState('playing');
      }
    } catch (error) {
      console.error('Error starting battle quiz:', error);
    }
  };

  const handleAnswerSelect = (optionIndex) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(optionIndex);

      const nextScore = myScore + 100;
      
      // Emit answer to opponent
      socket.emit('battle-answer', {
        roomId,
        questionId: questions[currentQuestionIndex].id,
        questionIndex: currentQuestionIndex,
        answer: optionIndex,
        timeTaken: 30 - timeLeft,
        score: nextScore,
        isCorrect: true,
        outcome: 'correct'
      });

      // Calculate if correct (simplified - should validate on backend)
      // For demo, we'll just add points
      setMyScore(nextScore);

      setTimeout(() => {
        handleNextQuestion();
      }, 1500);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeLeft(30);
    } else {
      setBattleState('results');
    }
  };

  // Helper to wrap content with video chat and header
  const withVideoChat = (content) => (
    <>
      <Header />
      {content}
      <BattleVideoChat
        socket={socket}
        roomId={roomId}
        playerName={playerName || 'Player'}
        opponentName={opponent?.playerName || opponent?.name || 'Opponent'}
        opponentId={opponent?.socketId || opponent?.id}
      />
    </>
  );

  // Setup Screen
  if (battleState === 'setup') {
    return withVideoChat(
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 pt-20">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={() => navigate(`/exam/${examId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to {examId}
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Battle Mode</h1>
              <p className="text-gray-600">{examId} - {subject}</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  data-testid="player-name-input"
                />
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                <h3 className="font-semibold text-purple-900 mb-2">Battle Rules:</h3>
                <ul className="space-y-1 text-sm text-purple-800">
                  <li>• Face your opponent with live video & audio</li>
                  <li>• 10 random questions from {subject}</li>
                  <li>• 30 seconds per question</li>
                  <li>• Score points for correct answers</li>
                  <li>• Winner takes all!</li>
                </ul>
              </div>

              <button
                onClick={startMatchmaking}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all"
                data-testid="find-match-button"
              >
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse bg-gradient-to-r from-purple-600 to-pink-600 text-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Finding Opponent...</h2>
          <p className="text-gray-600 mb-6">Please wait while we match you with a competitor</p>
          <button
            onClick={cancelMatchmaking}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-green-500 text-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Trophy className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Match Found!</h2>
          <p className="text-gray-600 mb-4">Setting up video connection...</p>
          <p className="text-xl font-semibold text-purple-600">
            You vs {opponent?.playerName}
          </p>
        </div>
      </div>
    );
  }

  // Playing Screen
  if (battleState === 'playing' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];

    return withVideoChat(
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header with Video Feeds */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* My Video */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-2" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  You ({myScore} pts)
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleVideo}
                  className={`flex-1 py-2 rounded-lg ${videoEnabled ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}
                >
                  {videoEnabled ? <Video className="w-4 h-4 mx-auto" /> : <VideoOff className="w-4 h-4 mx-auto" />}
                </button>
                <button
                  onClick={toggleAudio}
                  className={`flex-1 py-2 rounded-lg ${audioEnabled ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}
                >
                  {audioEnabled ? <Mic className="w-4 h-4 mx-auto" /> : <MicOff className="w-4 h-4 mx-auto" />}
                </button>
              </div>
            </div>

            {/* Question Progress - Modern Design */}
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-center">
              <div className="text-center">
                <div className={`text-5xl font-bold mb-2 ${timeLeft <= 10 ? 'text-red-600' : 'text-indigo-600'}`}>
                  {timeLeft}s
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{currentQuestionIndex + 1}</span>
                  </div>
                  <span className="text-gray-600 text-sm font-medium">of {questions.length}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                      background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Opponent Video */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-2" style={{ aspectRatio: '4/3' }}>
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <Users className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  {opponent?.playerName} ({opponentScore} pts)
                </div>
              </div>
              {/* Follow opponent during/after battle. Profile link gated to non-playing states. */}
              {opponent?.userId && (
                <div className="flex items-center justify-between gap-2 mt-1" data-testid="live-opponent-actions">
                  {battleState === 'results' || battleState === 'setup' ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${opponent.username || opponent.userId}`)}
                      data-testid="live-opponent-name-link"
                      className="text-sm font-semibold text-gray-700 hover:underline truncate"
                    >
                      @{opponent.username || opponent.playerName}
                    </button>
                  ) : (
                    <span className="text-sm font-semibold text-gray-500 truncate" data-testid="live-opponent-name">
                      @{opponent.username || opponent.playerName}
                    </span>
                  )}
                  <FollowButton
                    targetUserId={opponent.userId}
                    targetUsername={opponent.username || opponent.playerName}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-2">{examId} - {subject}</div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentQuestion?.question}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === null
                      ? 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                      : selectedAnswer === index
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 opacity-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      selectedAnswer === index
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1 font-medium text-gray-900">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (battleState === 'results') {
    const winner = myScore > opponentScore ? 'You' : opponent?.playerName;
    const isWinner = myScore > opponentScore;

    return withVideoChat(
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {isWinner ? (
              <div className="w-28 h-28 mx-auto mb-2">
                <DotLottiePlayer
                  src="https://assets-v2.lottiefiles.com/a/745fc364-117b-11ee-b7ec-9f18a8a356e0/ctpFpJP75f.lottie"
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            ) : (
              <img src="/images/defeat_books.png" alt="Defeat" className="w-28 h-28 mx-auto mb-4 object-contain" />
            )}
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {isWinner ? 'You Won!' : 'You Lost'}
            </h1>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-xl">
                <div className="text-sm text-gray-600 mb-1">You</div>
                <div className="text-4xl font-bold text-blue-600">{myScore}</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl">
                {opponent?.userId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${opponent.username || opponent.userId}`)}
                    data-testid="live-results-opponent-link"
                    className="text-sm text-gray-600 mb-1 hover:underline"
                  >
                    {opponent?.playerName}
                  </button>
                ) : (
                  <div className="text-sm text-gray-600 mb-1">{opponent?.playerName}</div>
                )}
                <div className="text-4xl font-bold text-purple-600">{opponentScore}</div>
                {opponent?.userId && (
                  <div className="mt-3 flex justify-center" data-testid="live-results-opponent-follow">
                    <FollowButton
                      targetUserId={opponent.userId}
                      targetUsername={opponent.username || opponent.playerName}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {rematchState === 'requested' ? (
                <div className="rounded-xl p-3 bg-purple-50 border-2 border-purple-300" data-testid="rematch-incoming-banner">
                  <p className="text-sm font-bold text-gray-900 mb-2 text-center">{opponent?.playerName} wants a rematch!</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { socket?.emit('rematch-accept', { roomId: roomIdRef.current }); setRematchState('idle'); }}
                      data-testid="rematch-accept-btn"
                      className="py-2.5 rounded-lg bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 active:scale-95 transition-all"
                    >Accept</button>
                    <button
                      onClick={() => { socket?.emit('rematch-decline', { roomId: roomIdRef.current }); setRematchState('idle'); }}
                      data-testid="rematch-decline-btn"
                      className="py-2.5 rounded-lg bg-gray-200 text-gray-700 font-semibold text-sm active:scale-95 transition-all"
                    >Decline</button>
                  </div>
                </div>
              ) : opponent?.userId ? (
                <button
                  onClick={() => { socket?.emit('rematch-request', { roomId: roomIdRef.current }); setRematchState('pending'); }}
                  disabled={rematchState === 'pending'}
                  data-testid="rematch-btn"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {rematchState === 'pending' ? `Waiting for ${opponent?.playerName}...` : `Rematch with ${opponent?.playerName}`}
                </button>
              ) : null}
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-white text-gray-700 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:border-gray-400 transition-all"
                data-testid="battle-again-btn"
              >
                Find new opponent
              </button>
              <button
                onClick={() => navigate(`/exam/${examId}`)}
                className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
              >
                Back to {examId}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LiveBattleMode;
