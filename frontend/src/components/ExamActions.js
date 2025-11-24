import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Award } from 'lucide-react';

const ExamActions = ({ examId }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 sm:p-8 text-white">
      <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center sm:text-left">
        Start Your Preparation
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <button
          onClick={() => navigate(`/exam/${examId}`)}
          className="w-full bg-white text-blue-600 px-6 py-4 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2 touch-manipulation"
        >
          <Play className="w-5 h-5 flex-shrink-0" />
          <span>Practice Quiz</span>
        </button>
        <button
          onClick={() => navigate('/join-room')}
          className="w-full bg-white/10 backdrop-blur-sm border-2 border-white hover:bg-white/20 px-6 py-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 touch-manipulation"
        >
          <Users className="w-5 h-5 flex-shrink-0" />
          <span>Join Battle Room</span>
        </button>
        <button
          onClick={() => navigate('/social-feed')}
          className="w-full bg-white/10 backdrop-blur-sm border-2 border-white hover:bg-white/20 px-6 py-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 touch-manipulation"
        >
          <Award className="w-5 h-5 flex-shrink-0" />
          <span>Leaderboard</span>
        </button>
      </div>
    </div>
  );
};

export default ExamActions;
