import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Medal, Award, Star, Home } from 'lucide-react';

const BattleResults = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { leaderboard, playerName } = location.state || {};

  if (!leaderboard) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading results...</div>;
  }

  const myResult = leaderboard.find(p => p.name === playerName);
  const myRank = leaderboard.findIndex(p => p.name === playerName) + 1;
  const isWinner = myRank === 1;
  const isTopThree = myRank <= 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Winner Announcement */}
        <div className="text-center mb-8">
          {isWinner ? (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-2xl p-8 shadow-2xl">
              <Trophy className="w-24 h-24 mx-auto mb-4" />
              <h1 className="text-5xl font-black mb-2">🎉 YOU WON! 🎉</h1>
              <p className="text-2xl font-bold">Congratulations {playerName}!</p>
            </div>
          ) : isTopThree ? (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-8 shadow-2xl">
              <Award className="w-20 h-20 mx-auto mb-4" />
              <h1 className="text-4xl font-black mb-2">Top 3 Finish!</h1>
              <p className="text-xl">Great performance {playerName}!</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <Star className="w-20 h-20 mx-auto mb-4 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
              <p className="text-gray-600">Nice effort {playerName}!</p>
            </div>
          )}
        </div>

        {/* Your Stats */}
        {myResult && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Performance</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Rank</p>
                <p className="text-3xl font-black text-purple-600">#{myRank}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Score</p>
                <p className="text-3xl font-black text-blue-600">{myResult.score}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Correct</p>
                <p className="text-3xl font-black text-green-600">{myResult.correct}</p>
              </div>
            </div>
          </div>
        )}

        {/* Final Leaderboard */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Final Standings</h2>
          <div className="space-y-3">
            {leaderboard.map((player, index) => (
              <div
                key={index}
                className={`flex items-center space-x-4 p-4 rounded-xl transition-all ${
                  player.name === playerName
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 scale-105'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* Rank */}
                <div className="flex-shrink-0">
                  {index === 0 ? (
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                  ) : index === 1 ? (
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                      <Medal className="w-8 h-8 text-white" />
                    </div>
                  ) : index === 2 ? (
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-300 to-orange-400 rounded-full flex items-center justify-center">
                      <Medal className="w-8 h-8 text-white" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1">
                  <p className="text-xl font-bold text-gray-900">{player.name}</p>
                  <p className="text-sm text-gray-600">
                    {player.correct} correct answers
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-3xl font-black text-purple-600">{player.score}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/')}
            className="bg-white text-gray-700 py-4 rounded-lg font-bold border-2 border-gray-300 hover:border-gray-400 transition-all flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button
            onClick={() => navigate('/join-room')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold hover:shadow-xl transition-all"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleResults;
