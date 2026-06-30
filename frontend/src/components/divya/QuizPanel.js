import React from 'react';
import { Loader2, Trophy, CheckCircle2, XCircle } from 'lucide-react';

const QuizPanel = ({ tutor, totalQuestions, quizQuestion, quizPicked, quizScore, quizLoading, onPick, onNext, onExit }) => {
  if (quizLoading && !quizQuestion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50" data-testid="quiz-loading">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
        <p className="text-sm text-gray-500">Cooking up a question...</p>
      </div>
    );
  }
  if (!quizQuestion) return null;

  if (quizQuestion.complete) {
    const pct = Math.round((quizScore / totalQuestions) * 100);
    const congrats = pct >= 80 ? '🎉 Brilliant!' : pct >= 60 ? '👍 Nice work!' : pct >= 40 ? '🙂 Keep going!' : '📚 Keep practicing!';
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 px-6 text-center" data-testid="quiz-results">
        <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${tutor?.bg} flex items-center justify-center mb-4`}>
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <p className="text-3xl font-black text-gray-900 mb-1" data-testid="quiz-final-score">{quizScore} / {totalQuestions}</p>
        <p className="text-sm text-gray-500 mb-1">{pct}% — {congrats}</p>
        <p className="text-xs text-gray-400 mb-6">Saved to your progress dashboard.</p>
        <button
          onClick={onExit}
          data-testid="quiz-exit-btn"
          className={`px-6 py-2.5 rounded-full bg-gradient-to-r ${tutor?.bg} text-white text-sm font-bold shadow-lg active:scale-95 transition-all`}
        >
          Back to Chat
        </button>
      </div>
    );
  }

  const answered = quizPicked !== null;
  const correctIdx = quizQuestion.correct_index;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4" data-testid="quiz-panel">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-gray-500">
          Question {quizQuestion.question_number} of {totalQuestions}
        </div>
        <button onClick={onExit} data-testid="quiz-exit-mid" className="text-xs text-gray-400 hover:text-gray-600">
          Exit quiz
        </button>
      </div>
      <div className="w-full h-1.5 rounded-full bg-gray-200 mb-4 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${tutor?.bg} transition-all`}
          style={{ width: `${(quizQuestion.question_number / totalQuestions) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm" data-testid="quiz-question">
        <p className="text-base font-semibold text-gray-900 leading-snug">{quizQuestion.question}</p>
      </div>

      <div className="space-y-2.5">
        {quizQuestion.options.map((opt, idx) => {
          let style = 'bg-white border border-gray-200 hover:border-gray-300 text-gray-900';
          let icon = null;
          if (answered) {
            if (idx === correctIdx) {
              style = 'bg-emerald-50 border border-emerald-300 text-emerald-900';
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
            } else if (idx === quizPicked) {
              style = 'bg-rose-50 border border-rose-300 text-rose-900';
              icon = <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
            } else {
              style = 'bg-gray-50 border border-gray-200 text-gray-400';
            }
          }
          return (
            <button
              key={idx}
              onClick={() => onPick(idx)}
              disabled={answered}
              data-testid={`quiz-option-${idx}`}
              className={`w-full px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-sm font-medium text-left active:scale-[0.99] transition-all ${style}`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="min-w-0">{opt}</span>
              </span>
              {icon}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3" data-testid="quiz-explanation">
            <p className="text-xs font-bold text-amber-800 mb-1">Why?</p>
            <p className="text-xs text-amber-900 leading-relaxed">{quizQuestion.explanation}</p>
          </div>
          <button
            onClick={onNext}
            disabled={quizLoading}
            data-testid="quiz-next-btn"
            className={`w-full bg-gradient-to-r ${tutor?.bg} text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {quizLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {quizQuestion.question_number >= totalQuestions ? 'See Results' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizPanel;