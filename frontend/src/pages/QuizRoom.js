import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Clock, Trophy, Check, X, Award, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const QuizRoom = () => {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [roomData, setRoomData] = useState(location.state?.room || null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(!questions.length);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');

  // Redirect non-logged-in users to login
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  // Check privacy: private quizzes only accessible to host
  useEffect(() => {
    if (!roomData || !user) return;
    if (roomData.privacy === 'private' && roomData.host_id && roomData.host_id !== user.id) {
      alert('This is a private quiz. Only the host can attempt it.');
      navigate('/victory-lane');
    }
  }, [roomData, user, navigate]);

  // Fetch quiz data if not provided via navigation state
  useEffect(() => {
    if (questions.length || !roomCode || !user) {
      return;
    }

    const fetchQuizData = async () => {
      setLoadingQuiz(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/social/quiz-rooms/${roomCode}`, {
          params: {
            user_id: user.id
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          const room = response.data.room;
          setQuestions(room.questions || []);
          setRoomData(room);
          setTimeLeft((room.questions && room.questions[0]?.time_limit) || 30);
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        const status = error.response?.status;
        if (status === 404) {
          alert('Quiz room not found or has been deleted');
        } else if (status === 410) {
          alert('This quiz has expired (24 hours elapsed)');
        } else if (status === 403) {
          alert(error.response?.data?.detail || 'You do not have access to this quiz');
        } else {
          alert('Failed to load quiz');
        }
        navigate('/victory-lane');
      } finally {
        setLoadingQuiz(false);
      }
    };

    fetchQuizData();
  }, [questions.length, roomCode, user, navigate]);

  // Fetch leaderboard after quiz completion
  useEffect(() => {
    if (!quizCompleted || !roomCode || !user) {
      return;
    }

    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/social/quiz-rooms/${roomCode}/leaderboard`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          setLeaderboard(response.data.leaderboard || []);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };

    fetchLeaderboard();
  }, [quizCompleted, roomCode, user]);

  // Simple countdown timer (no auto-advance)
  useEffect(() => {
    if (quizCompleted) return;
    if (timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, quizCompleted]);

  const getQuestionPoints = (question) => {
    if (!question) return 0;
    const raw = question.points;
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') {
      const n = Number(raw);
      if (!Number.isNaN(n)) return n;
    }
    // Fallback: 100 points per question if backend has no explicit points field
    return 100;
  };

  const optionKeyToLetter = (key) => {
    const map = {
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D'
    };
    return map[key] || null;
  };

  const handleAnswerSelect = (answer) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(answer);
    }
  };

  const handleNextQuestion = () => {
    if (!questions.length) return;

    const currentQuestion = questions[currentQuestionIndex];
    const selectedLetter = optionKeyToLetter(selectedAnswer);
    // Compare case-insensitively since backend uses lowercase ('a') and frontend uses uppercase ('A')
    const isCorrect = selectedLetter?.toLowerCase() === currentQuestion.correct_answer?.toLowerCase();
    const points = getQuestionPoints(currentQuestion);

    const answerEntry = {
      question_id: currentQuestionIndex,
      selected_answer: selectedLetter,
      correct_answer: currentQuestion.correct_answer,
      is_correct: isCorrect,
      time_taken: (currentQuestion.time_limit || 30) - timeLeft
    };

    const updatedAnswers = [...answers, answerEntry];
    const updatedScore = isCorrect ? score + points : score;

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextQuestion = questions[nextIndex];

      setAnswers(updatedAnswers);
      setScore(updatedScore);
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setTimeLeft(nextQuestion?.time_limit || 30);
    } else {
      // Last question – finish quiz
      handleFinishQuiz(updatedAnswers, updatedScore);
    }
  };

  const handleFinishQuiz = async (finalAnswers = answers, finalScore = score) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (quizCompleted) return;
    setQuizCompleted(true);

    try {
      await axios.post(
        `${BACKEND_URL}/api/social/quiz-rooms/${roomCode}/submit`,
        {
          user_id: user.id,
          user_name: user.name || user.username || 'User',
          score: finalScore,
          answers: finalAnswers,
          total_questions: questions.length
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
    } catch (error) {
      console.error('Error submitting quiz results:', error);
    }
  };

  const handleShareScore = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!questions.length) {
      navigate('/victory-lane');
      return;
    }

    setShareLoading(true);
    setShareError('');

    const finalScore = score;
    const correctCount = answers.filter((a) => a.is_correct).length;

    const content =
      `🎯 I just completed the quiz "${roomData?.title || 'Quiz Room'}"!` +
      `\n\nScore: ${finalScore} points` +
      `\nCorrect: ${correctCount}/${questions.length} questions` +
      `\nRoom Code: ${roomData?.room_code || roomCode}` +
      `\n\n#QuizResult #Ceibaa`;

    try {
      await axios.post(`${BACKEND_URL}/api/social/posts`, {
        user_id: user.id,
        user_name: user.name || user.username || 'User',
        post_type: 'achievement',
        content,
        quiz_details: {
          room_code: roomData?.room_code || roomCode,
          title: roomData?.title,
          category: roomData?.category,
          score: finalScore,
          total_questions: questions.length
        }
      });

      // After successful share, redirect back to victory lane as requested
      navigate('/victory-lane');
    } catch (error) {
      console.error('Error sharing score:', error);
      setShareError(error.response?.data?.detail || 'Failed to share score. Please try again.');
    } finally {
      setShareLoading(false);
    }
  };

  const getOptionLabel = (option) => {
    const labels = { option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D' };
    return labels[option] || option;
  };

  if (loading || loadingQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <X className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No questions found</h2>
          <p className="text-gray-600 mb-6">This quiz room does not have any questions configured.</p>
          <button
            onClick={() => navigate('/victory-lane')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const finalScore = score;
    const perQuestionPoints = getQuestionPoints(questions[0]) || 1;
    const percentage = (finalScore / (questions.length * perQuestionPoints)) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
              <p className="text-gray-600">{roomData?.title || 'Quiz Room'}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center border-2 border-blue-200">
                <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-600">{finalScore}</p>
                <p className="text-sm text-gray-600">Total Score</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center border-2 border-green-200">
                <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-600">{Number.isFinite(percentage) ? percentage.toFixed(0) : '0'}%</p>
                <p className="text-sm text-gray-600">Accuracy</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center border-2 border-purple-200">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-600">{answers.filter((a) => a.is_correct).length}/{questions.length}</p>
                <p className="text-sm text-gray-600">Correct</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center items-center">
              <button
                onClick={handleShareScore}
                disabled={shareLoading}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {shareLoading ? 'Sharing...' : 'Share my score'}
              </button>
              <button
                onClick={() => navigate('/victory-lane')}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Back to Feed
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all"
              >
                Retake Quiz
              </button>
            </div>

            {shareError && (
              <p className="mt-4 text-center text-sm text-red-500">{shareError}</p>
            )}
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Leaderboard
            </h2>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      entry.user_id === user?.id
                        ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? 'bg-yellow-400 text-white'
                            : index === 1
                            ? 'bg-gray-300 text-white'
                            : index === 2
                            ? 'bg-orange-400 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {entry.user_name}
                          {entry.user_id === user?.id && (
                            <span className="ml-2 text-xs text-indigo-600">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.correct_answers}/{entry.total_questions} correct
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">{entry.score}</p>
                      <p className="text-xs text-gray-500">
                        {entry.completed_at
                          ? new Date(entry.completed_at).toLocaleDateString()
                          : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Be the first to complete this quiz!</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
                navigate('/victory-lane');
              }
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Exit Quiz</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-indigo-600">{timeLeft}s</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="mb-6">
            <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
              {roomData?.category || 'General'}
            </span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentQuestion?.question_text}
            </h2>
            <p className="text-gray-600 text-sm">Select the correct answer</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['option_a', 'option_b', 'option_c', 'option_d'].map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(option)}
                disabled={selectedAnswer !== null}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  selectedAnswer === option
                    ? optionKeyToLetter(option)?.toLowerCase() === currentQuestion.correct_answer?.toLowerCase()
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                    : selectedAnswer && optionKeyToLetter(option)?.toLowerCase() === currentQuestion.correct_answer?.toLowerCase()
                    ? 'bg-green-50 border-green-500'
                    : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                } ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      selectedAnswer === option
                        ? optionKeyToLetter(option)?.toLowerCase() === currentQuestion.correct_answer?.toLowerCase()
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                        : selectedAnswer && optionKeyToLetter(option)?.toLowerCase() === currentQuestion.correct_answer?.toLowerCase()
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {getOptionLabel(option)}
                  </div>
                  <span className="font-medium text-gray-900">{currentQuestion[option]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Next / Finish Button */}
        {selectedAnswer !== null && (
          <button
            onClick={handleNextQuestion}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question →' : 'Finish Quiz 🏁'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizRoom;
