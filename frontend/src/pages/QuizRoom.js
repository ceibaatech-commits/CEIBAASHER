import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Clock, Trophy, Check, X, Award, Users, Loader2, Sun, Moon } from 'lucide-react';
import { renderMathText } from '../utils/renderMath';
import LanguageSelector, { useTranslation } from '../components/LanguageSelector';

const BACKEND_URL = window.location.origin;

// ---- Visual helpers (extracted from nested ternaries) ----
const rankColorClass = (index) => {
  if (index === 0) return 'bg-yellow-400 text-white';
  if (index === 1) return 'bg-gray-300 text-white';
  if (index === 2) return 'bg-orange-400 text-white';
  return 'bg-gray-200 text-gray-600';
};

const isCorrectOption = (optionId, q) => {
  if (!optionId || !q) return false;
  const id = optionId.toLowerCase();
  return id === q.correct_answer?.toLowerCase() || id === q.correctAnswer?.toLowerCase();
};

const optionButtonClass = (optionId, selectedAnswer, currentQuestion, dark) => {
  const correct = isCorrectOption(optionId, currentQuestion);
  if (selectedAnswer === optionId) {
    return correct
      ? 'bg-green-50 border-green-500 dark-opt-correct'
      : 'bg-red-50 border-red-500 dark-opt-wrong';
  }
  if (selectedAnswer && correct) {
    return 'bg-green-50 border-green-500';
  }
  return dark
    ? 'border-gray-600 hover:border-indigo-400 hover:bg-indigo-900/30 bg-gray-800 text-gray-100'
    : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50';
};

const optionBadgeClass = (optionId, selectedAnswer, currentQuestion) => {
  const correct = isCorrectOption(optionId, currentQuestion);
  if (selectedAnswer === optionId) {
    return correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
  }
  if (selectedAnswer && correct) {
    return 'bg-green-500 text-white';
  }
  return 'bg-gray-200 text-gray-600';
};

// ---- Slim Quiz-Mode Header ----
const QuizHeader = ({ roomTitle, timeLeft, currentIndex, total, onExit, dark, onToggleTheme }) => (
  <div
    className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 shadow-md transition-colors ${
      dark ? 'bg-gray-900 border-b border-gray-700' : 'bg-white border-b border-gray-200'
    }`}
  >
    {/* Left: Logo + Title */}
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent shrink-0">
        ceibaa
      </span>
      {roomTitle && (
        <span className={`hidden sm:block text-sm font-medium truncate ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
          · {roomTitle}
        </span>
      )}
    </div>

    {/* Centre: Progress dots */}
    <div className="flex items-center gap-1">
      {Array.from({ length: Math.min(total, 12) }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            i < currentIndex
              ? 'w-2 h-2 bg-green-400'
              : i === currentIndex
              ? 'w-3 h-3 bg-indigo-500'
              : dark ? 'w-2 h-2 bg-gray-600' : 'w-2 h-2 bg-gray-300'
          }`}
        />
      ))}
      {total > 12 && (
        <span className={`text-xs ml-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          {currentIndex + 1}/{total}
        </span>
      )}
    </div>

    {/* Right: Timer + Theme toggle + Exit */}
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold transition-colors ${
          timeLeft <= 5
            ? 'bg-red-100 text-red-600 animate-pulse'
            : dark
            ? 'bg-gray-700 text-indigo-300'
            : 'bg-indigo-50 text-indigo-600'
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        {timeLeft}s
      </div>

      <button
        onClick={onToggleTheme}
        aria-label="Toggle theme"
        className={`p-1.5 rounded-full transition-colors ${
          dark ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
        }`}
      >
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <button
        onClick={onExit}
        className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
          dark
            ? 'text-red-400 hover:bg-red-900/30'
            : 'text-red-500 hover:bg-red-50'
        }`}
      >
        Exit
      </button>
    </div>
  </div>
);

const QuizRoom = () => {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();
  const { language, setLanguage, translateQuestionObject, isTranslating } = useTranslation();

  // ---- Theme (C + D): read from localStorage, scoped to this page ----
  const [dark, setDark] = useState(() => localStorage.getItem('ceibaa_theme') === 'dark');
  const toggleTheme = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem('ceibaa_theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [roomData, setRoomData] = useState(location.state?.room || null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [displayQuestion, setDisplayQuestion] = useState(null);
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
      navigate('/capazoo');
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
          params: { user_id: user.id }
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
        navigate('/capazoo');
      } finally {
        setLoadingQuiz(false);
      }
    };

    fetchQuizData();
    // eslint-disable-next-line
  }, [questions.length, roomCode, user, navigate]);

  // Fetch leaderboard after quiz completion
  useEffect(() => {
    if (!quizCompleted || !roomCode || !user) {
      return;
    }

    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/social/quiz-rooms/${roomCode}/leaderboard`
        );

        if (response.data.success) {
          setLeaderboard(response.data.leaderboard || []);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };

    fetchLeaderboard();
  }, [quizCompleted, roomCode, user]);

  // Handle translation
  useEffect(() => {
    const q = questions[currentQuestionIndex];
    if (!q) {
      setDisplayQuestion(null);
      return;
    }

    if (language === 'en') {
      setDisplayQuestion(q);
    } else {
      translateQuestionObject(q, language).then((translated) => {
        if (questions[currentQuestionIndex] === q) {
          setDisplayQuestion(translated);
        }
      });
    }
  }, [currentQuestionIndex, language, questions, translateQuestionObject]);

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
    return 100;
  };

  const handleAnswerSelect = (answer) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(answer);
    }
  };

  const handleNextQuestion = () => {
    if (!questions.length) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect =
      selectedAnswer?.toLowerCase() === currentQuestion.correct_answer?.toLowerCase() ||
      selectedAnswer?.toLowerCase() === currentQuestion.correctAnswer?.toLowerCase();
    const points = getQuestionPoints(currentQuestion);

    const answerEntry = {
      question_id: currentQuestionIndex,
      selected_answer: selectedAnswer,
      correct_answer: currentQuestion.correct_answer || currentQuestion.correctAnswer,
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
      await axios.post(`${BACKEND_URL}/api/social/quiz-rooms/${roomCode}/submit`, {
        user_id: user.id,
        user_name: user.name || user.username || 'User',
        score: finalScore,
        answers: finalAnswers,
        total_questions: questions.length
      });
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
      navigate('/capazoo');
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

      navigate('/capazoo');
    } catch (error) {
      console.error('Error sharing score:', error);
      setShareError(error.response?.data?.detail || 'Failed to share score. Please try again.');
    } finally {
      setShareLoading(false);
    }
  };

  // ---- Shared theme classes ----
  const bg = dark
    ? 'bg-gray-950 text-gray-100'
    : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-900';
  const card = dark ? 'bg-gray-800 border border-gray-700' : 'bg-white';
  const cardText = dark ? 'text-gray-100' : 'text-gray-900';
  const mutedText = dark ? 'text-gray-400' : 'text-gray-500';

  // ---- Loading state ----
  if (loading || loadingQuiz) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto" />
          <p className={`mt-4 ${mutedText}`}>Loading quiz...</p>
        </div>
      </div>
    );
  }

  // ---- No questions state ----
  if (!questions.length) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <div className={`rounded-2xl shadow-2xl p-8 max-w-md text-center ${card}`}>
          <X className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${cardText}`}>No questions found</h2>
          <p className={`mb-6 ${mutedText}`}>This quiz room does not have any questions configured.</p>
          <button
            onClick={() => navigate('/capazoo')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  // ---- Results screen (quiz completed) ----
  if (quizCompleted) {
    const finalScore = score;
    const perQuestionPoints = getQuestionPoints(questions[0]) || 1;
    const percentage = (finalScore / (questions.length * perQuestionPoints)) * 100;

    return (
      <div className={`min-h-screen py-8 px-4 pt-6 transition-colors ${bg}`}>
        {/* Slim result-mode header */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 shadow-md ${
            dark ? 'bg-gray-900 border-b border-gray-700' : 'bg-white border-b border-gray-200'
          }`}
        >
          <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            ceibaa
          </span>
          <span className={`text-sm font-semibold ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
            Quiz Results
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`p-1.5 rounded-full transition-colors ${
                dark ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => navigate('/capazoo')}
              className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
                dark ? 'text-indigo-400 hover:bg-gray-700' : 'text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Feed
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-16">
          {/* Score card */}
          <div className={`rounded-2xl shadow-2xl p-8 mb-6 ${card}`}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className={`text-3xl font-bold mb-2 ${cardText}`}>Quiz Completed!</h1>
              <p className={mutedText}>{roomData?.title || 'Quiz Room'}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className={`rounded-xl p-6 text-center border-2 ${dark ? 'bg-blue-900/30 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'}`}>
                <Award className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-500">{finalScore}</p>
                <p className={`text-sm ${mutedText}`}>Total Score</p>
              </div>
              <div className={`rounded-xl p-6 text-center border-2 ${dark ? 'bg-green-900/30 border-green-700' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'}`}>
                <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-500">
                  {Number.isFinite(percentage) ? percentage.toFixed(0) : '0'}%
                </p>
                <p className={`text-sm ${mutedText}`}>Accuracy</p>
              </div>
              <div className={`rounded-xl p-6 text-center border-2 ${dark ? 'bg-purple-900/30 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
                <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-500">
                  {answers.filter((a) => a.is_correct).length}/{questions.length}
                </p>
                <p className={`text-sm ${mutedText}`}>Correct</p>
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
                onClick={() => navigate('/capazoo')}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Back to Feed
              </button>
              <button
                onClick={() => window.location.reload()}
                className={`px-8 py-3 border-2 rounded-xl font-semibold transition-all ${
                  dark
                    ? 'border-indigo-500 text-indigo-400 hover:bg-indigo-900/30'
                    : 'bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50'
                }`}
              >
                Retake Quiz
              </button>
            </div>

            {shareError && (
              <p className="mt-4 text-center text-sm text-red-500">{shareError}</p>
            )}
          </div>

          {/* Leaderboard — (F): player names are clickable links to PublicProfile */}
          <div className={`rounded-2xl shadow-xl p-6 ${card}`}>
            <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${cardText}`}>
              <Trophy className="w-6 h-6 text-yellow-500" />
              Leaderboard
            </h2>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id || `lb-${index}`}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                      entry.user_id === user?.id
                        ? dark
                          ? 'bg-indigo-900/40 border-2 border-indigo-500'
                          : 'bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300'
                        : dark
                        ? 'bg-gray-700/50 hover:bg-gray-700'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${rankColorClass(index)}`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        {/* (F) Clickable profile link */}
                        <button
                          onClick={() => navigate(`/profile/${entry.user_id}`)}
                          className={`font-semibold hover:underline text-left transition-colors ${
                            dark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-700 hover:text-indigo-900'
                          }`}
                        >
                          {entry.user_name}
                          {entry.user_id === user?.id && (
                            <span className="ml-2 text-xs text-indigo-500 no-underline">(You)</span>
                          )}
                        </button>
                        <p className={`text-sm ${mutedText}`}>
                          {entry.correct_answers}/{entry.total_questions} correct
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-500">{entry.score}</p>
                      <p className={`text-xs ${mutedText}`}>
                        {entry.completed_at ? new Date(entry.completed_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center py-8 ${mutedText}`}>Be the first to complete this quiz!</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- Active quiz screen ----
  const currentQuestion = displayQuestion || questions[currentQuestionIndex];

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors ${bg}`}>
      {/* (E) Slim quiz-mode header */}
      <QuizHeader
        roomTitle={roomData?.title}
        timeLeft={timeLeft}
        currentIndex={currentQuestionIndex}
        total={questions.length}
        dark={dark}
        onToggleTheme={toggleTheme}
        onExit={() => {
          if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
            navigate('/capazoo');
          }
        }}
      />

      <div className="max-w-4xl mx-auto mt-14">
        {/* Sub-header: language + progress */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LanguageSelector
              selectedLanguage={language}
              onLanguageChange={setLanguage}
              size="sm"
            />
            {isTranslating && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
          </div>
          <span className={`text-sm font-medium ${mutedText}`}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className={`w-full rounded-full h-1.5 overflow-hidden ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className={`rounded-2xl shadow-2xl p-8 mb-6 ${card}`}>
          <div className="mb-6">
            <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium mb-4 ${dark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
              {roomData?.category || 'General'}
            </span>
            <h2 className={`text-2xl font-bold mb-2 ${cardText}`}>
              {renderMathText(currentQuestion?.question_text || currentQuestion?.question)}
            </h2>
            <p className={`text-sm ${mutedText}`}>Select the correct answer</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Array.isArray(currentQuestion?.options)
              ? currentQuestion.options
              : ['option_a', 'option_b', 'option_c', 'option_d'].map((opt) => ({
                  id: opt.replace('option_', '').toUpperCase(),
                  text: currentQuestion[opt]
                }))
            ).map((option, idx) => {
              const optionId =
                typeof option === 'object'
                  ? option.id || String.fromCharCode(65 + idx)
                  : option;
              const optionText =
                typeof option === 'object'
                  ? option.text || option.value || JSON.stringify(option)
                  : currentQuestion[option] || option;
              return (
                <button
                  key={optionId}
                  onClick={() => handleAnswerSelect(optionId)}
                  disabled={selectedAnswer !== null}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${optionButtonClass(
                    optionId,
                    selectedAnswer,
                    currentQuestion,
                    dark
                  )} ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${optionBadgeClass(
                        optionId,
                        selectedAnswer,
                        currentQuestion
                      )}`}
                    >
                      {optionId}
                    </div>
                    <span className={`font-medium ${dark && !selectedAnswer ? 'text-gray-100' : 'text-gray-900'}`}>
                      {renderMathText(optionText)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Next / Finish button */}
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
