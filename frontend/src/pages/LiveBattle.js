import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Zap, Star, Pause, Play, SkipForward, X, AlertCircle } from 'lucide-react';
import io from 'socket.io-client';

const BATTLE_URL = 'http://localhost:5001';

const LiveBattle = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName, firstQuestion, isHost } = location.state || {};
  
  const [socket, setSocket] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion?.question || null);
  const [questionNumber, setQuestionNumber] = useState(firstQuestion?.questionNumber || 1);
  const [totalQuestions, setTotalQuestions] = useState(firstQuestion?.totalQuestions || 10);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);

  useEffect(() => {
    const newSocket = io(BATTLE_URL);
    setSocket(newSocket);

    newSocket.on('leaderboard-update', (data) => {
      setLeaderboard(data.leaderboard);
      const me = data.leaderboard.find(p => p.name === playerName);
      if (me) setMyScore(me.score);
    });

    newSocket.on('next-question', (data) => {
      setCurrentQuestion(data.question);
      setQuestionNumber(data.questionNumber);
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
    if (timeLeft > 0 && selectedAnswer === null && !isPaused) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && selectedAnswer === null) {
      handleAnswerSelect(-1);
    }
  }, [timeLeft, selectedAnswer, isPaused]);

  const handleAnswerSelect = (index) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    socket.emit('submit-answer', {
      pin,
      questionId: currentQuestion.id,
      answerIndex: index,
      timeLeft
    });
  };

  if (!currentQuestion) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  const myRank = leaderboard.findIndex(p => p.name === playerName) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4">
      <div className="max-w-7xl mx-auto px-4">
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

            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
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
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{player.score}</p>
                    </div>
                  </div>
                ))}
              </div>
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
      </div>
    </div>
  );
};

export default LiveBattle;
