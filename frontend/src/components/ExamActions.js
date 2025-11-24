import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Award } from 'lucide-react';

const ExamActions = ({ examId }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-6 sm:p-8 text-white mobile-safe-bottom">
      <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
        Start Your Preparation
      </h3>
      <div className="exam-buttons-container">
        <button
          onClick={() => navigate(`/exam/${examId}`)}
          className="exam-cta-button btn-gradient-primary w-full"
          aria-label="Start Practice Quiz"
        >
          <Play className="w-5 h-5 flex-shrink-0" />
          <span>Practice Quiz</span>
        </button>
        <button
          onClick={() => navigate('/join-room')}
          className="exam-cta-button btn-gradient-secondary w-full"
          aria-label="Join Battle Room"
        >
          <Users className="w-5 h-5 flex-shrink-0" />
          <span>Join Battle Room</span>
        </button>
        <button
          onClick={() => navigate('/social-feed')}
          className="exam-cta-button btn-gradient-accent w-full"
          aria-label="View Victory Lane"
        >
          <Award className="w-5 h-5 flex-shrink-0" />
          <span>Victory Lane</span>
        </button>
      </div>
    </div>
  );
};

export default ExamActions;
