import React from 'react';
import { Trophy, Play, Users, Clock } from 'lucide-react';

// Utility functions
export const getGradientColor = (category) => {
  const colors = {
    'JEE': '#3B82F6',
    'NEET': '#10B981',
    'UPSC': '#F59E0B',
    'SSC': '#EF4444',
    'Banking': '#8B5CF6',
    'Defence': '#059669',
    'default': '#6366F1'
  };
  
  for (const key of Object.keys(colors)) {
    if (category?.toLowerCase().includes(key.toLowerCase())) {
      return colors[key];
    }
  }
  return colors.default;
};

export const getDifficultyColor = (difficulty) => {
  const colors = {
    'Easy': 'bg-green-100 text-green-700',
    'Medium': 'bg-yellow-100 text-yellow-700',
    'Hard': 'bg-red-100 text-red-700'
  };
  return colors[difficulty] || colors['Medium'];
};

const QuizRoomCard = ({ 
  quizDetails, 
  postUserId, 
  user, 
  followingList, 
  onJoinRoom 
}) => {
  if (!quizDetails) return null;

  const isFollowersOnly = quizDetails.access_control === 'followers';
  const isHostFollowed = followingList.has(quizDetails.host_id || postUserId);
  const isOwnRoom = user && postUserId === user.id;
  const canJoin = !isFollowersOnly || isHostFollowed || isOwnRoom;

  return (
    <div 
      className="border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition mt-3"
      style={{ borderColor: `${getGradientColor(quizDetails.category)}40` }}
    >
      <div 
        className="h-28 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${getGradientColor(quizDetails.category)} 0%, ${getGradientColor(quizDetails.category)}cc 100%)` }}
      >
        <Trophy className="w-12 h-12 text-white opacity-80" />
      </div>
      <div className="p-4 bg-white">
        <h3 className="font-bold text-lg text-gray-900 mb-1">
          {quizDetails.title || 'Quiz Room'}
        </h3>
        <p className="text-sm text-gray-600 mb-3">{quizDetails.category}</p>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Play className="w-4 h-4" />
            <span>{quizDetails.questions_count || quizDetails.question_count || 5} questions</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{quizDetails.participants || 0}/{quizDetails.max_participants || 50} players</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{quizDetails.time_limit || 15} min</span>
          </div>
        </div>
        
        {/* Access Control Badge */}
        {isFollowersOnly && (
          <div className="mb-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full w-fit">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium">Followers Only</span>
          </div>
        )}
        
        <div className="flex items-center justify-between gap-3">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${getDifficultyColor(quizDetails.difficulty || 'Medium')}`}>
            {quizDetails.difficulty || 'Medium'}
          </span>
          {!canJoin ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-4 h-4" />
              <span>Follow host to join</span>
            </div>
          ) : (
            <button 
              onClick={() => onJoinRoom(quizDetails.room_code)}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition"
            >
              Join Room
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizRoomCard;
