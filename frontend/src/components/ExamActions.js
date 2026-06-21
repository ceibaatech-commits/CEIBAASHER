import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Trophy } from 'lucide-react';

const ExamActions = ({ examId, examName }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      <button
        onClick={() => navigate(`/chapter-tests?exam=${examId}`)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
      >
        <Play className="w-4 h-4" />
        Start Practice
      </button>
      
      <button
        onClick={() => navigate('/capazoo')}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
      >
        <Users className="w-4 h-4" />
        Join Community
      </button>
    </div>
  );
};

export default ExamActions;
