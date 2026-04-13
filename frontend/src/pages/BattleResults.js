import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Medal, Award, Star, Home } from 'lucide-react';
import { DotLottiePlayer } from '@dotlottie/react-player';

const C = { cream: '#F5F0EB', pink: '#F9D5C8', red: '#E8503A', blue: '#5B8FD4', redLight: '#FDE8E4', blueLight: '#E4EEF9' };

const BattleResults = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { leaderboard, playerName } = location.state || {};

  if (!leaderboard) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: C.cream }}>Loading results...</div>;
  }

  const myResult = leaderboard.find(p => p.name === playerName);
  const myRank = leaderboard.findIndex(p => p.name === playerName) + 1;
  const isWinner = myRank === 1;
  const isTie = leaderboard.length >= 2 && leaderboard[0].score === leaderboard[1]?.score;
  const isTopThree = myRank <= 3;

  return (
    <div className="min-h-screen py-8" style={{ background: C.cream }}>
      <div className="max-w-lg mx-auto px-4">
        {/* Result Banner */}
        <div className={`rounded-3xl p-8 text-center shadow-2xl mb-6 ${
          isWinner ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
          isTie ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
          isTopThree ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
          'bg-gradient-to-br from-gray-400 to-gray-600'
        }`}>
          {isWinner ? (
            <div className="w-28 h-28 mx-auto mb-2">
              <DotLottiePlayer src="https://assets-v2.lottiefiles.com/a/745fc364-117b-11ee-b7ec-9f18a8a356e0/ctpFpJP75f.lottie" loop autoplay style={{ width: '100%', height: '100%' }} />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          )}
          <h1 className="text-4xl font-black text-white mb-1">
            {isWinner ? 'Victory!' : isTie ? 'Draw!' : isTopThree ? 'Top 3!' : 'Defeat'}
          </h1>
          <p className="text-white/80 text-lg">
            {isWinner ? `Congratulations ${playerName}!` :
             isTie ? 'A worthy match!' :
             isTopThree ? `Great effort ${playerName}!` :
             `Better luck next time ${playerName}!`}
          </p>
        </div>

        {/* Stats */}
        {myResult && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Performance</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-4 rounded-xl" style={{ background: C.redLight }}>
                <p className="text-xs text-gray-600 mb-1">Rank</p>
                <p className="text-3xl font-black" style={{ color: C.red }}>#{myRank}</p>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ background: C.blueLight }}>
                <p className="text-xs text-gray-600 mb-1">Score</p>
                <p className="text-3xl font-black" style={{ color: C.blue }}>{myResult.score}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-green-50">
                <p className="text-xs text-gray-600 mb-1">Correct</p>
                <p className="text-3xl font-black text-green-600">{myResult.correct}</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Final Standings</h2>
          <div className="space-y-3">
            {leaderboard.map((player, index) => (
              <div key={index} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                player.name === playerName ? 'ring-2 scale-[1.02]' : 'bg-gray-50'
              }`} style={player.name === playerName ? { background: C.redLight, ringColor: C.red } : {}}>
                <div className="flex-shrink-0">
                  {index === 0 ? (
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center"><Trophy className="w-6 h-6 text-white" /></div>
                  ) : index === 1 ? (
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center"><Medal className="w-6 h-6 text-white" /></div>
                  ) : index === 2 ? (
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-300 to-orange-400 rounded-full flex items-center justify-center"><Medal className="w-6 h-6 text-white" /></div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center"><span className="text-lg font-bold text-gray-600">#{index + 1}</span></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-gray-900">{player.name}</p>
                  <p className="text-sm text-gray-500">{player.correct} correct</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black" style={{ color: index === 0 ? C.red : C.blue }}>{player.score}</p>
                  <p className="text-xs text-gray-400">pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/')} className="bg-white text-gray-700 py-4 rounded-xl font-bold border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2">
            <Home className="w-5 h-5" /> Home
          </button>
          <button onClick={() => navigate('/join-room')} className="text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all" style={{ background: C.red }}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleResults;
