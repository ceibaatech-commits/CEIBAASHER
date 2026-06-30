import React from 'react';
import { Trophy, Zap, Star, Gift } from 'lucide-react';

const LeaderboardPanel = ({
  myScore,
  myRank,
  leaderboard,
  playerName,
  isAuthenticated,
  followingStatus,
  handleFollow,
  setSelectedGiftRecipient,
  setShowGiftMenu,
}) => {
  return (
    <div className="space-y-4">
      {/* My Score Badge */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg p-6" data-testid="battle-my-score-panel">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/80">Your Score</span>
          <Trophy className="w-6 h-6" />
        </div>
        <div className="text-4xl font-black mb-1" data-testid="battle-my-score-value">{myScore}</div>
        <div className="text-white/80 text-sm" data-testid="battle-my-rank">
          Rank: #{myRank || '-'}
        </div>
      </div>

      {/* Live Rankings list */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 text-yellow-500 mr-2" />
          Live Rankings
        </h3>
        {leaderboard.length === 0 ? (
          <div className="text-center text-gray-500 py-4" data-testid="leaderboard-empty">
            <p className="text-sm">Waiting for players...</p>
          </div>
        ) : (
          <div className="space-y-3" data-testid="leaderboard-list">
            {leaderboard.map((player, index) => {
              const isMe = player.name === playerName;
              const isUserAuthenticated = typeof isAuthenticated === 'function' ? isAuthenticated() : !!isAuthenticated;
              
              return (
                <div
                  key={player.name}
                  data-testid={`leaderboard-item-${index}`}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                    isMe 
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-400 shadow-md transform scale-105' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${
                      isMe ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      {player.name}
                      {isMe && (
                        <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">You</span>
                      )}
                    </p>
                    {player.streak > 1 && (
                      <div className="flex items-center space-x-1 text-xs text-orange-600 mt-0.5">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{player.streak} streak</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        isMe ? 'text-purple-600' : 'text-gray-900'
                      }`}>
                        {player.score}
                      </p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                    {!isMe && isUserAuthenticated && (
                      <>
                        <button
                          onClick={() => handleFollow(player)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            followingStatus[player.name]
                              ? 'bg-green-100 hover:bg-green-200'
                              : 'bg-blue-100 hover:bg-blue-200'
                          }`}
                          data-testid={`follow-btn-${player.name.replace(/\s+/g, '-')}`}
                          title={followingStatus[player.name] ? "Already following" : "Follow this player"}
                        >
                          <span className={`text-sm font-bold ${
                            followingStatus[player.name] ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {followingStatus[player.name] ? 'Following' : 'Follow'}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGiftRecipient(player);
                            setShowGiftMenu(true);
                          }}
                          className="p-1.5 bg-pink-100 hover:bg-pink-200 rounded-lg transition-colors"
                          data-testid={`gift-btn-${player.name.replace(/\s+/g, '-')}`}
                          title="Send Gift"
                        >
                          <Gift className="w-4 h-4 text-pink-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPanel;
