import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Medal, Award, Clock, Target, TrendingUp, Home, Share2, Download, Users } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const QuizResults = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { playerName, finalScore, totalTime, rank, totalQuestions } = location.state || {};
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchResults();
    if (rank <= 3) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [pin]);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/battle/async/rooms/${pin}/leaderboard`);
      if (response.data.success) {
        setLeaderboard(response.data.leaderboard);
        setRoomInfo(response.data.room_info);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      setLoading(false);
    }
  };

  const getRankIcon = (position) => {
    if (position === 1) return <Trophy className="w-8 h-8 text-yellow-500" />;
    if (position === 2) return <Medal className="w-8 h-8 text-gray-400" />;
    if (position === 3) return <Award className="w-8 h-8 text-orange-600" />;
    return <span className="text-2xl font-bold text-gray-600">#{position}</span>;
  };

  const getRankColor = (position) => {
    if (position === 1) return 'from-yellow-400 to-yellow-600';
    if (position === 2) return 'from-gray-300 to-gray-500';
    if (position === 3) return 'from-orange-400 to-orange-600';
    return 'from-blue-400 to-blue-600';
  };

  const shareResults = async () => {
    const text = `🎯 I scored ${finalScore} points and ranked #${rank} in the quiz battle! PIN: ${pin}`;
    
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Quiz Results', text });
        return;
      } catch (error) {
        console.log('Share failed, will try clipboard');
      }
    }
    
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    } catch (error) {
      // Fallback for clipboard permission denied
      console.error('Clipboard error:', error);
      // Create temporary textarea for manual copy
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert('Results copied to clipboard!');
      } catch (err) {
        alert('Please manually copy: ' + text);
      }
      document.body.removeChild(textarea);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              🎉
            </div>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6">
          <div className={`bg-gradient-to-r ${getRankColor(rank)} p-8 text-white text-center`}>
            <div className="flex justify-center mb-4 animate-bounce">
              {getRankIcon(rank)}
            </div>
            <h1 className="text-4xl font-bold mb-2">Quiz Complete!</h1>
            <p className="text-xl opacity-90">You ranked #{rank}</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-blue-900 mb-1">{finalScore}</div>
                <div className="text-sm text-blue-700">Points Scored</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
                <Clock className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-purple-900 mb-1">{Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}</div>
                <div className="text-sm text-purple-700">Time Taken</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-green-900 mb-1">{totalQuestions}</div>
                <div className="text-sm text-green-700">Questions</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </button>
              <button
                onClick={() => navigate('/profile/board')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Users className="w-5 h-5" />
                View Board
              </button>
              <button
                onClick={shareResults}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all"
              >
                <Share2 className="w-5 h-5" />
                Share Results
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Final Leaderboard
          </h2>
          <div className="space-y-3">
            {leaderboard.map((player, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  player.player_name === playerName
                    ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-400 scale-105'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex-shrink-0 w-12 text-center">
                  {index < 3 ? (
                    getRankIcon(index + 1)
                  ) : (
                    <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    {player.player_name}
                    {player.player_name === playerName && (
                      <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">You</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">{player.total_score}</div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {roomInfo && (
          <div className="mt-6 text-center text-gray-600 text-sm">
            Room PIN: <span className="font-mono font-bold text-purple-600">{pin}</span>
            {' • '}
            {roomInfo.participant_count} players participated
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        .animate-fall {
          animation: fall 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default QuizResults;
