import React from 'react';
import { Pause, Play, SkipForward, X, AlertCircle } from 'lucide-react';

const HostControls = ({
  isPaused,
  resumeQuiz,
  pauseQuiz,
  nextQuestion,
  skipQuestion,
  endQuiz,
  currentQuestionIndex,
  allQuestions,
}) => {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-orange-900 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Host Controls
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <button
          onClick={isPaused ? resumeQuiz : pauseQuiz}
          className="flex items-center justify-center space-x-2 bg-white hover:bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-semibold transition-all border-2 border-orange-300"
          data-testid="host-pause-resume"
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>
        <button
          onClick={nextQuestion}
          disabled={currentQuestionIndex >= allQuestions.length - 1}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="host-next-q"
        >
          <SkipForward className="w-4 h-4" />
          <span>Next Q</span>
        </button>
        <button
          onClick={skipQuestion}
          className="flex items-center justify-center space-x-2 bg-white hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold transition-all border-2 border-blue-300"
          data-testid="host-skip"
        >
          <SkipForward className="w-4 h-4" />
          <span>Skip</span>
        </button>
        <button
          onClick={endQuiz}
          className="flex items-center justify-center space-x-2 bg-white hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold transition-all border-2 border-red-300"
          data-testid="host-end-quiz"
        >
          <X className="w-4 h-4" />
          <span>End Quiz</span>
        </button>
      </div>
      {isPaused && (
        <div className="mt-3 bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded" data-testid="host-paused-status">
          <p className="text-yellow-800 text-sm font-semibold">⏸️ Quiz is paused</p>
        </div>
      )}
    </div>
  );
};

export default HostControls;
