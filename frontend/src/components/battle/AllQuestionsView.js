import React from 'react';

const AllQuestionsView = ({
  allQuestions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  setCurrentQuestion,
  setQuestionNumber,
  setSelectedAnswer,
  setAnswerResult,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-blue-900 flex items-center">
          📚 All Questions ({allQuestions.length})
        </h3>
        <span className="text-sm text-blue-600 bg-white px-3 py-1 rounded-full font-semibold">
          Host View Only
        </span>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto" data-testid="host-questions-list">
        {allQuestions.map((q, idx) => (
          <div
            key={q.id || q.question || `q-${idx}`}
            onClick={() => {
              setCurrentQuestionIndex(idx);
              setCurrentQuestion(q);
              setQuestionNumber(idx + 1);
              setSelectedAnswer(null);
              setAnswerResult(null);
            }}
            data-testid={`host-question-item-${idx}`}
            className={`p-4 rounded-lg cursor-pointer transition-all ${
              idx === currentQuestionIndex
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white hover:bg-blue-100 text-gray-800'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                idx === currentQuestionIndex
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  idx === currentQuestionIndex ? 'text-white' : 'text-gray-800'
                }`}>
                  {q.question}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={`${q.id || idx}-opt-${optIdx}`}
                      className={`px-2 py-1 rounded ${
                        optIdx === q.correct
                          ? idx === currentQuestionIndex
                            ? 'bg-green-500 text-white'
                            : 'bg-green-100 text-green-800'
                          : idx === currentQuestionIndex
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}. {typeof opt === 'object' ? (opt.text || opt.label || JSON.stringify(opt)).substring(0, 20) : String(opt ?? '').substring(0, 20)}...
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllQuestionsView;
