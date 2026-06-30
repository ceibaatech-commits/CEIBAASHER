import React from 'react';
import { Clock, Smile } from 'lucide-react';
import MathText from '../MathText';

const QuestionDisplay = ({
  questionNumber,
  totalQuestions,
  timeLeft,
  currentQuestion,
  selectedAnswer,
  answerResult,
  isPaused,
  isHost,
  handleAnswerSelect,
  sendReaction,
}) => {
  if (!currentQuestion) return null;

  return (
    <div className="space-y-4">
      {/* Timer & Progress */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{questionNumber}</span>
            </div>
            <span className="text-gray-600 text-sm font-medium">of {totalQuestions}</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
            timeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="text-lg">{timeLeft}s</span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${(questionNumber / totalQuestions) * 100}%`,
              background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
            }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6" data-testid="battle-question-text">
          <MathText text={currentQuestion.question} />
        </h2>

        <div className="space-y-3" data-testid="battle-options-container">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = answerResult && answerResult.correctAnswer === index;
            const isWrong = isSelected && answerResult && !answerResult.isCorrect;
            
            // Handle both object format {id, text} and string format
            const optionText = typeof option === 'object' ? (option.text || option.label || JSON.stringify(option)) : option;
            
            return (
              <button
                key={`${currentQuestion.id || 'q'}-opt-${index}`}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null || isPaused}
                data-testid={`battle-option-${index}`}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === null && !isPaused
                    ? 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                    : isCorrect
                    ? 'border-green-600 bg-green-50'
                    : isWrong
                    ? 'border-red-600 bg-red-50'
                    : isSelected
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 opacity-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    isCorrect
                      ? 'bg-green-600 text-white'
                      : isWrong
                      ? 'bg-red-600 text-white'
                      : isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1 font-medium text-gray-900">
                    <MathText text={optionText} />
                  </span>
                  {isCorrect && <span className="text-green-600 font-bold">✓</span>}
                  {isWrong && <span className="text-red-600 font-bold">✗</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Answer Feedback */}
        {answerResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            answerResult.isCorrect ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'
          }`} data-testid="battle-feedback">
            <p className={`font-bold ${answerResult.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {answerResult.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </p>
            <div className="text-sm text-gray-700 mt-1">
              {answerResult.isCorrect ? (
                `+${answerResult.points} points earned!`
              ) : (
                <div className="flex items-center gap-1">
                  <span>Correct answer:</span>
                  <MathText text={
                    typeof currentQuestion.options[answerResult.correctAnswer] === 'object'
                      ? currentQuestion.options[answerResult.correctAnswer].text || currentQuestion.options[answerResult.correctAnswer].label
                      : currentQuestion.options[answerResult.correctAnswer]
                  } />
                </div>
              )}
            </div>
            {/* Show explanation if available */}
            {currentQuestion.explanation && (
              <div className="mt-3 pt-3 border-t border-gray-300" data-testid="battle-explanation">
                <p className="text-sm font-semibold text-gray-800 mb-1">Explanation:</p>
                <p className="text-sm text-gray-700">
                  <MathText text={currentQuestion.explanation} />
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Reactions Bar */}
        <div className="mt-4 flex items-center justify-center flex-wrap gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <div className="flex items-center gap-1.5 mr-1">
            <Smile className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600 font-semibold uppercase tracking-wide">React</span>
          </div>
          {[
            { emoji: '🔥', name: 'on fire' },
            { emoji: '⚡', name: 'lightning' },
            { emoji: '🎯', name: 'bullseye' },
            { emoji: '💯', name: 'hundred' },
            { emoji: '🧠', name: 'big brain' },
            { emoji: '👏', name: 'clap' },
            { emoji: '🤝', name: 'gg' },
            { emoji: '😂', name: 'lol' },
          ].map((reaction) => (
            <button
              key={reaction.emoji}
              onClick={() => sendReaction(reaction.emoji, reaction.name)}
              data-testid={`react-${reaction.name.replace(/\s+/g, '-')}`}
              className="text-xl hover:scale-125 active:scale-95 transition-transform bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm hover:shadow-md hover:bg-yellow-50"
              style={{
                fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji","EmojiOne Color","Android Emoji","Twemoji Mozilla",sans-serif',
                lineHeight: 1,
              }}
              aria-label={`React with ${reaction.name}`}
              title={reaction.name}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;
