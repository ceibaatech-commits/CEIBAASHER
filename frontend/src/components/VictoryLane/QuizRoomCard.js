import React, { useState } from 'react';
import { Play, Users, Clock, BookOpen, GraduationCap, Copy, Check } from 'lucide-react';

const QuizRoomCard = ({ quizRoom, getDifficultyColor, handleJoinRoom }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    if (quizRoom?.room_code) {
      navigator.clipboard.writeText(quizRoom.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!quizRoom) return null;

  return (
    <div
      className="mt-3 rounded-2xl border border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-amber-200/50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{quizRoom.title}</h3>
            <p className="text-gray-600 text-sm mt-0.5">{quizRoom.category}</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-lg ml-3 overflow-hidden">
            <img src="/images/quiz-animated.gif" alt="Quiz" className="w-12 h-12 object-contain" />
          </div>
        </div>
      </div>

      {/* Room Code */}
      <div className="px-4 py-3 bg-white/50">
        <div className="flex items-center justify-between bg-white rounded-xl border-2 border-dashed border-amber-300 px-4 py-3">
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Room Code</span>
            <p className="text-2xl font-black text-amber-600 tracking-wider font-mono">{quizRoom.room_code}</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
          </button>
        </div>
      </div>

      {/* Metadata Tags */}
      <div className="px-4 py-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200">
          <BookOpen className="w-4 h-4 text-amber-500" />
          {quizRoom.num_questions} Questions
        </span>
        {quizRoom.subject && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200">
            <GraduationCap className="w-4 h-4 text-blue-500" />
            {quizRoom.subject}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200">
          {quizRoom.privacy === 'private' ? '🔒' : '🌐'} {quizRoom.privacy === 'private' ? 'Private' : 'Public'}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getDifficultyColor(quizRoom.difficulty)}`}>
          {quizRoom.difficulty}
        </span>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 flex items-center gap-4 text-sm text-gray-600 border-t border-amber-100">
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />{quizRoom.participants}/{quizRoom.max_participants} joined
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />{quizRoom.time_limit}s per question
        </span>
      </div>

      {/* Action */}
      <div className="p-4 pt-2">
        {quizRoom.status === 'waiting' || quizRoom.status === 'active' ? (
          <button
            onClick={() => handleJoinRoom(quizRoom.room_code)}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />View Quiz
          </button>
        ) : (
          <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-medium text-center text-base">
            ✅ Ended
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizRoomCard;
