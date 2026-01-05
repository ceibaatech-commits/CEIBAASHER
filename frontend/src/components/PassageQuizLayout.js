import React from 'react';
import { BookOpen, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * PassageQuizLayout - Special layout for reading comprehension questions
 * Shows passage on the left/top and questions on the right/bottom
 */
const PassageQuizLayout = ({
  passage,
  currentQuestion,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  timeLeft,
  onAnswerSelect,
  onNext,
  onPrevious,
  showExplanation
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Reading Comprehension</h2>
                <p className="text-sm text-gray-600">Question {questionIndex + 1} of {totalQuestions}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-600">{timeLeft}s</span>
            </div>
          </div>
          
          {/* Progress bar - Modern sleek style */}
          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
                  background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Main Content - Side by Side on Desktop, Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Passage */}
          <div className="bg-white rounded-xl shadow-md p-6 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center space-x-2 mb-4 pb-3 border-b">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Reading Passage</h3>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {passage}
              </div>
            </div>
          </div>

          {/* Right Side: Question and Options */}
          <div className="space-y-6">
            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-semibold text-purple-600 mb-2">
                  QUESTION {questionIndex + 1}
                </h3>
              </div>
              
              <p className="text-lg text-gray-900 mb-6 leading-relaxed">
                {currentQuestion.question}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = currentQuestion.correctAnswer === index;
                  const showResult = showExplanation;
                  
                  let optionClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ";
                  
                  if (showResult) {
                    if (isCorrect) {
                      optionClass += "border-green-500 bg-green-50 ";
                    } else if (isSelected && !isCorrect) {
                      optionClass += "border-red-500 bg-red-50 ";
                    } else {
                      optionClass += "border-gray-200 bg-gray-50 ";
                    }
                  } else {
                    if (isSelected) {
                      optionClass += "border-blue-500 bg-blue-50 ";
                    } else {
                      optionClass += "border-gray-200 hover:border-blue-300 hover:bg-blue-50 ";
                    }
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => !showExplanation && onAnswerSelect(index)}
                      disabled={showExplanation}
                      className={optionClass}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          showResult && isCorrect ? 'bg-green-500 text-white' :
                          showResult && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                          isSelected ? 'bg-blue-500 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1 text-gray-800">{option}</span>
                        {showResult && isCorrect && (
                          <span className="text-green-600 font-bold">✓</span>
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <span className="text-red-600 font-bold">✗</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showExplanation && currentQuestion.explanation && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm font-semibold text-blue-900 mb-2">💡 Explanation:</p>
                  <p className="text-sm text-blue-800">{currentQuestion.explanation}</p>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex space-x-3">
              {questionIndex > 0 && (
                <button
                  onClick={onPrevious}
                  className="flex-1 flex items-center justify-center space-x-2 bg-white text-gray-700 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:border-gray-400 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>
              )}
              
              <button
                onClick={onNext}
                disabled={selectedAnswer === null && !showExplanation}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold transition-all ${
                  selectedAnswer === null && !showExplanation
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                }`}
              >
                <span>{questionIndex === totalQuestions - 1 ? 'Finish' : 'Next Question'}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassageQuizLayout;
