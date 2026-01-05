import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Trophy, HelpCircle, CheckCircle2, RotateCcw, Lock } from 'lucide-react';
import axios from 'axios';
import MathText from '../components/MathText';
import PassageQuizLayout from '../components/PassageQuizLayout';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const QUIZ_API_URL = process.env.REACT_APP_BACKEND_URL; // Use main backend

const SoloPractice = () => {
  const { examName, subjectName, examId, topicName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Check authentication status (isAuthenticated is a function)
  const isUserAuthenticated = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;
  
  // Detect class-based quiz from URL pattern (Class-6, Class-10, etc.)
  const urlExamName = examId || examName;
  const isClassBasedFromUrl = urlExamName?.startsWith('Class-') || urlExamName?.toLowerCase().startsWith('class-');
  
  // Check if this is a class-based quiz (from state OR from URL pattern)
  const isClassBased = location.state?.isClassBased || isClassBasedFromUrl;
  
  // Extract class-based data
  let classBasedData = null;
  if (isClassBased) {
    if (location.state?.class_name) {
      // Use state if available
      classBasedData = {
        class_name: location.state.class_name,
        subject: location.state.subject,
        chapter: location.state.chapter
      };
    } else if (isClassBasedFromUrl) {
      // Extract from URL if state not available
      // URL format: /topic-quiz/Class-6/hindi---malhar/mathru-bhumi-(poem)
      const urlClassName = urlExamName; // "Class-6"
      const urlSubject = subjectName; // "hindi---malhar" or "science"
      const urlChapter = topicName; // "mathru-bhumi-(poem)" or "components-of-food"
      
      // Process subject: handle "hindi---malhar" -> "Hindi - Malhar"
      // Triple dashes (---) become " - " (space-dash-space)
      // Then capitalize each word (except common lowercase words)
      const lowercaseWords = ['and', 'of', 'the', 'in', 'on', 'at', 'to', 'for', 'with', 'or'];
      const processedSubject = urlSubject
        .replace(/---/g, '|||')  // Temporarily replace triple dashes
        .replace(/-/g, ' ')      // Replace single dashes with spaces
        .replace(/\|\|\|/g, ' - ') // Restore triple dashes as " - "
        .split(' ')
        .map((w, i) => {
          const capitalized = w.charAt(0).toUpperCase() + w.slice(1);
          // Keep lowercase words lowercase (except first word)
          if (i > 0 && lowercaseWords.includes(w.toLowerCase())) {
            return w.toLowerCase();
          }
          return capitalized;
        })
        .join(' ');
      
      // Process chapter: handle "mathru-bhumi-(poem)" -> "Mathru Bhumi (Poem)"
      // Title case each word including words in parentheses
      const processedChapter = urlChapter
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .replace(/\((\w)/g, (match, letter) => `(${letter.toUpperCase()}`); // Capitalize first letter after (
      
      classBasedData = {
        class_name: urlClassName.replace('Class-', 'Class ').replace(/-/g, ' '),
        subject: processedSubject,
        chapter: processedChapter
      };
    }
  }
  
  const subTopic = location.state?.subTopic; // Get sub-topic from navigation state
  
  // Use examId if available (from topic-quiz route), otherwise use examName (from solo-practice route)
  const exam = examId || examName;
  const subject = subjectName;
  const topic = topicName;
  
  console.log('🔍 SoloPractice Debug:', { isClassBased, isClassBasedFromUrl, classBasedData, exam, subject, topic });
  
  const [numberOfQuestions, setNumberOfQuestions] = useState(10); // NEW: Question count selector
  const [quizState, setQuizState] = useState('setup'); // NEW: Changed from 'loading' to 'setup'
  const [questions, setQuestions] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    // Reset state when URL params change
    setQuizState('setup'); // Changed: Start with setup instead of loading
    setQuestions([]);
    setQuizId(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setTimeLeft(30);
    setScore(null);
    setResults(null);
  }, [exam, subject, topic, subTopic]);

  const submitQuiz = useCallback(async (answersToSubmit) => {
    // Use provided answers or fall back to state
    const finalAnswers = answersToSubmit || answers;
    
    try {
      const response = await axios.post(`${QUIZ_API_URL}/api/quiz/submit`, {
        quizId,
        answers: finalAnswers
      });
      
      if (response.data.success) {
        setScore(response.data.score);
        setResults(response.data.results);
        setQuizState('results');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  }, [quizId, answers]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeLeft(30);
    } else {
      // Last question - submit with current answers
      // This handles the timer timeout case
      submitQuiz(answers);
    }
  }, [currentQuestionIndex, questions.length, answers, submitQuiz]);

  useEffect(() => {
    let timer;
    if (quizState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (quizState === 'playing' && timeLeft === 0) {
      // Use setTimeout to avoid calling setState in effect body
      timer = setTimeout(() => handleNextQuestion(), 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeLeft, quizState, handleNextQuestion]);

  const startQuiz = async () => {
    setQuizState('loading'); // Show loading while fetching
    try {
      let requestData;
      
      if (isClassBased && classBasedData) {
        // Class-based quiz (CBSE chapters)
        requestData = {
          isClassBased: true,
          class_name: classBasedData.class_name,
          subject: classBasedData.subject,
          chapter: classBasedData.chapter,
          exam: exam, // For compatibility
          numberOfQuestions: numberOfQuestions
        };
      } else {
        // Exam-based quiz (NEET, JEE, etc.)
        requestData = {
          exam: exam,
          subject: subject,
          topic: topic,
          numberOfQuestions: numberOfQuestions
        };
        
        // Include sub_topic if available
        if (subTopic) {
          requestData.sub_topic = subTopic;
        }
      }
      
      const response = await axios.post(`${QUIZ_API_URL}/api/quiz/start`, requestData);
      
      if (response.data.success) {
        setQuestions(response.data.questions);
        setQuizId(response.data.quizId);
        setQuizState('playing');
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      setQuizState('error');
      alert('Failed to load questions. Please try again.');
    }
  };

  const handleAnswerSelect = (optionIndex) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(optionIndex);
      const newAnswers = [
        ...answers,
        {
          questionId: questions[currentQuestionIndex].id,
          selectedOption: optionIndex
        }
      ];
      setAnswers(newAnswers);

      // Auto-advance after 1.5 seconds
      setTimeout(() => {
        // IMPORTANT: Pass the newAnswers directly for the last question
        // because React state updates are async and won't be ready yet
        if (currentQuestionIndex >= questions.length - 1) {
          submitQuiz(newAnswers);
        } else {
          handleNextQuestion();
        }
      }, 1500);
    }
  };

  // Authentication check - show login prompt if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isUserAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 text-sm mb-5">
            Please login or create an account to start practicing quizzes.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/login', { state: { from: location.pathname } })}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
            >
              Login to Continue
            </button>
            <button
              onClick={() => navigate('/signup', { state: { from: location.pathname } })}
              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-all"
            >
              Create Account
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full text-gray-500 py-1.5 text-xs hover:text-gray-700"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
          <p className="text-sm text-gray-500 mt-2">Exam: {exam || 'N/A'} | Subject: {subject || 'N/A'}</p>
        </div>
      </div>
    );
  }

  if (quizState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Questions</h2>
          <p className="text-gray-600 mb-4">
            Could not load questions for {isClassBased ? `${classBasedData.class_name} - ${classBasedData.subject} - ${classBasedData.chapter}` : `${exam} - ${subject} ${topic ? `- ${topic}` : ''}`}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (quizState === 'results') {
    // Helper function to convert letter to index
    const letterToIndex = (letter) => {
      if (typeof letter === 'number') return letter;
      if (typeof letter === 'string' && /^[A-Da-d]$/.test(letter)) {
        return letter.toUpperCase().charCodeAt(0) - 65;
      }
      return parseInt(letter) || -1;
    };

    const correctCount = results?.filter(r => r.isCorrect).length || 0;
    const totalCount = results?.length || 0;
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    
    // Determine performance level for styling
    const getPerformanceColor = () => {
      if (percentage >= 80) return 'from-green-500 to-emerald-600';
      if (percentage >= 60) return 'from-blue-500 to-indigo-600';
      if (percentage >= 40) return 'from-yellow-500 to-orange-500';
      return 'from-red-500 to-pink-600';
    };

    const getPerformanceMessage = () => {
      if (percentage >= 80) return '🎉 Excellent Work!';
      if (percentage >= 60) return '👍 Good Job!';
      if (percentage >= 40) return '💪 Keep Practicing!';
      return '📚 Need More Practice';
    };

    return (
      <div className="min-h-screen bg-gray-50 py-4 md:py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => {
              if (isClassBased && classBasedData) {
                navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}`);
              } else {
                navigate(`/exam/${exam}`);
              }
            }}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {isClassBased ? `${classBasedData?.class_name} Topics` : `${exam} Topics`}
          </button>

          {/* Score Card - Modern Design */}
          <div className={`bg-gradient-to-br ${getPerformanceColor()} rounded-2xl shadow-lg p-6 mb-6 text-white`}>
            <div className="text-center">
              <div className="text-lg font-medium opacity-90 mb-1">{getPerformanceMessage()}</div>
              <div className="text-6xl font-bold mb-2">{score || percentage}%</div>
              <div className="flex items-center justify-center gap-2 text-white/90">
                <CheckCircle className="w-5 h-5" />
                <span className="text-lg">{correctCount} of {totalCount} correct</span>
              </div>
              <div className="mt-3 text-sm opacity-80">
                {isClassBased 
                  ? `${classBasedData?.class_name} • ${classBasedData?.subject} • ${classBasedData?.chapter}`
                  : `${exam} • ${subject}${topic ? ` • ${topic}` : ''}`
                }
              </div>
            </div>
          </div>

          {/* Review Answers Section */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Review Your Answers</h2>
            <p className="text-sm text-gray-500">Tap on each question to see the explanation</p>
          </div>

          {/* Results Details - Redesigned */}
          <div className="space-y-4">
            {results?.map((result, index) => {
              const correctIndex = letterToIndex(result.correctAnswer);
              const userIndex = letterToIndex(result.userAnswer || result.selectedOption);
              
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Question Header */}
                  <div className={`px-4 py-3 flex items-start gap-3 ${
                    result.isCorrect ? 'bg-green-50 border-b border-green-100' : 'bg-red-50 border-b border-red-100'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      result.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {result.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <XCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-500 mb-1">Question {index + 1}</div>
                      <h3 className="font-medium text-gray-900 text-sm leading-relaxed">
                        <MathText text={result.question} />
                      </h3>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="p-4 space-y-2">
                    {result.options?.map((option, optIndex) => {
                      const optionText = typeof option === 'object' ? (option.text || option.value || option) : option;
                      const isCorrectOption = optIndex === correctIndex;
                      const isUserSelection = optIndex === userIndex;
                      const isWrongSelection = isUserSelection && !result.isCorrect;
                      
                      return (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            isCorrectOption
                              ? 'border-green-500 bg-green-50'
                              : isWrongSelection
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-100 bg-gray-50'
                          }`}
                        >
                          {/* Option Badge */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            isCorrectOption
                              ? 'bg-green-500 text-white'
                              : isWrongSelection
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          
                          {/* Option Text */}
                          <span className={`flex-1 text-sm ${
                            isCorrectOption ? 'text-green-800 font-medium' : 
                            isWrongSelection ? 'text-red-800' : 'text-gray-600'
                          }`}>
                            <MathText text={optionText} />
                          </span>
                          
                          {/* Status Icons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isCorrectOption && (
                              <span className="text-green-600 text-xs font-semibold flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Correct
                              </span>
                            )}
                            {isWrongSelection && (
                              <span className="text-red-600 text-xs font-semibold flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                Your answer
                              </span>
                            )}
                            {isUserSelection && result.isCorrect && (
                              <span className="text-green-600 text-xs font-semibold flex items-center gap-1">
                                ✓ You got it!
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {result.explanation && (
                    <div className="px-4 pb-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs">💡</span>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-blue-800 mb-1">Explanation</div>
                            <p className="text-sm text-blue-900 leading-relaxed">
                              <MathText text={result.explanation} />
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 sticky bottom-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Practice Again
            </button>
            <button
              onClick={() => {
                if (isClassBased && classBasedData) {
                  navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}`);
                } else {
                  navigate(`/exam/${exam}`);
                }
              }}
              className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              More Topics
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup screen - select number of questions
  if (quizState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Animated Header Card */}
          <div className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-3xl shadow-2xl p-6 mb-6 overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full -mr-20 -mt-20 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full -ml-16 -mb-16 animate-pulse delay-300"></div>
            
            <button
              onClick={() => {
                if (isClassBased && classBasedData) {
                  navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}`);
                } else {
                  navigate(`/exam/${exam}`);
                }
              }}
              className="relative flex items-center text-white/90 hover:text-white mb-4 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl transition-all hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-semibold">Back to Chapters</span>
            </button>

            <div className="relative text-center mb-2">
              <div className="inline-block bg-white/20 backdrop-blur-md rounded-full px-6 py-2 mb-4">
                <p className="text-white/90 text-sm font-medium">
                  {isClassBased ? `${classBasedData.class_name} • ${classBasedData.subject}` : `${exam} • ${subject}`}
                </p>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-lg">
                🎯 Setup Your Quiz
              </h1>
              <p className="text-white/90 text-base font-medium">
                {isClassBased ? classBasedData.chapter : `${topic || ''} ${subTopic || ''}`}
              </p>
            </div>
          </div>

          {/* Questions Selection Card */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-slate-800 rounded-2xl p-3 shadow-lg">
                <HelpCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Number of Questions</h2>
                <p className="text-sm text-gray-500">Choose how many questions you want</p>
              </div>
            </div>

            {/* Question count buttons with emojis */}
            <div className="grid grid-cols-5 gap-2 mb-5">
              {[
                { num: 10, emoji: '🔥', color: 'from-rose-600 to-orange-600' },
                { num: 20, emoji: '⚡', color: 'from-amber-500 to-yellow-600' },
                { num: 30, emoji: '💪', color: 'from-emerald-600 to-teal-600' },
                { num: 50, emoji: '🚀', color: 'from-cyan-600 to-blue-600' },
                { num: 100, emoji: '🏆', color: 'from-indigo-600 to-violet-600' }
              ].map(({ num, emoji, color }) => (
                <button
                  key={num}
                  onClick={() => setNumberOfQuestions(num)}
                  className={`relative py-4 rounded-2xl font-bold text-lg transition-all transform active:scale-95 ${
                    numberOfQuestions === num
                      ? `bg-gradient-to-br ${color} text-white shadow-xl scale-110`
                      : 'bg-white text-gray-700 hover:shadow-lg hover:scale-105 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{emoji}</div>
                  <div className="text-sm font-black">{num}</div>
                </button>
              ))}
            </div>

            {/* Animated slider */}
            <div className="relative mb-4">
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, rgb(15 23 42) 0%, rgb(15 23 42) ${((numberOfQuestions - 10) / 90) * 100}%, rgb(229 231 235) ${((numberOfQuestions - 10) / 90) * 100}%, rgb(229 231 235) 100%)`
                }}
              />
            </div>

            {/* Current selection display */}
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-6 py-3">
                <CheckCircle2 className="w-6 h-6 text-amber-600" />
                <span className="text-2xl font-black text-slate-800">
                  {numberOfQuestions} Questions Selected
                </span>
              </div>
            </div>
          </div>

          {/* Start Quiz Button */}
          <button
            onClick={startQuiz}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3 mb-6"
          >
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>Start Quiz Now 🚀</span>
          </button>

          {/* Info Card */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="bg-slate-800 rounded-xl p-2 flex-shrink-0">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900 mb-1">⏱️ Quick Info</p>
              <p className="text-sm text-slate-700">
                Each question has <strong>30 seconds</strong>. Review all answers at the end before submitting!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen
  if (quizState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading questions...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Check if current question has a passage (reading comprehension)
  const hasPassage = currentQuestion?.passage && currentQuestion.passage.trim().length > 0;

  // If question has passage, render the PassageQuizLayout component
  if (hasPassage) {
    return (
      <PassageQuizLayout
        passage={currentQuestion.passage}
        currentQuestion={currentQuestion}
        questionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        selectedAnswer={selectedAnswer}
        timeLeft={timeLeft}
        onAnswerSelect={handleAnswerSelect}
        onNext={handleNextQuestion}
        onPrevious={() => {
          if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setSelectedAnswer(answers[currentQuestionIndex - 1]?.selectedOption ?? null);
            setTimeLeft(30);
          }
        }}
        showExplanation={false}
      />
    );
  }

  // Default quiz layout (for non-passage questions)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb for class-based */}
        {isClassBased && classBasedData && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <button 
              onClick={() => navigate('/chapter-tests')} 
              className="hover:text-cyan-600 font-semibold"
            >
              Home
            </button>
            <span>/</span>
            <button 
              onClick={() => navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}`)} 
              className="hover:text-cyan-600 font-semibold"
            >
              {classBasedData.class_name}
            </button>
            <span>/</span>
            <button 
              onClick={() => {
                const subjectSlug = classBasedData.subject
                  .toLowerCase()
                  .replace(/ - /g, '---')
                  .replace(/\s+/g, '-');
                navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}/${subjectSlug}`);
              }} 
              className="hover:text-cyan-600 font-semibold"
            >
              {classBasedData.subject}
            </button>
            <span>/</span>
            <span className="text-gray-900 font-semibold">{classBasedData.chapter}</span>
          </div>
        )}
        
        {/* Header - Improved Mobile UI */}
        <div className="bg-white rounded-xl md:rounded-xl shadow-md mb-4 md:mb-6 overflow-hidden">
          {/* Top Navigation Bar - Clean aligned row */}
          <div className="flex items-center justify-between px-3 py-3 md:px-6 md:py-4 border-b border-gray-100">
            {/* Left: Back button with subject */}
            <button
              onClick={() => {
                const hasProgress = selectedAnswer !== null || currentQuestionIndex > 0;
                if (!hasProgress || window.confirm('Are you sure you want to quit this quiz? Your progress will be lost.')) {
                  if (isClassBased && classBasedData) {
                    // Convert subject to URL slug: "Hindi - Malhar" -> "hindi---malhar"
                    const subjectSlug = classBasedData.subject
                      .toLowerCase()
                      .replace(/ - /g, '---')  // " - " becomes "---"
                      .replace(/\s+/g, '-');   // spaces become "-"
                    navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}/${subjectSlug}`);
                  } else {
                    navigate(`/exam/${exam}`);
                  }
                }
              }}
              className="flex items-center text-gray-700 hover:text-gray-900 min-w-0"
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" />
              <span className="ml-2 text-sm md:text-base font-medium truncate max-w-[100px] md:max-w-none">
                {classBasedData?.subject || subjectName || 'Quiz'}
              </span>
            </button>
            
            {/* Center: Question count */}
            <div className="flex items-center justify-center px-3 py-1 bg-gray-100 rounded-full">
              <span className="text-sm font-semibold text-gray-700">
                {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>
            
            {/* Right: Timer pill */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm ${
              timeLeft <= 10 
                ? 'bg-red-100 text-red-600' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Progress Bar - Modern sleek style */}
          <div className="w-full bg-gray-100 h-1.5 overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{ 
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)'
              }}
            ></div>
          </div>
        </div>

        {/* Question Card - Modern Mobile Design */}
        <div className="bg-white rounded-2xl md:rounded-xl shadow-lg p-4 md:p-8">
          <div className="mb-5 md:mb-6">
            <div className="text-xs md:text-sm text-gray-500 mb-2 font-medium">
              {classBasedData?.subject || subjectName}
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 leading-relaxed">
              <MathText text={currentQuestion?.question} />
            </h2>
            
            {/* Question Image (if present) */}
            {currentQuestion?.question_image && (
              <div className="mt-4">
                <img 
                  src={currentQuestion.question_image.startsWith('/api') 
                    ? `${process.env.REACT_APP_BACKEND_URL}${currentQuestion.question_image}`
                    : currentQuestion.question_image
                  }
                  alt="Question diagram"
                  className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>

          {/* Answer Options - Pill-shaped, Modern styling with correct/incorrect feedback */}
          <div className="space-y-3">
            {currentQuestion?.options.map((option, index) => {
              const optionText = typeof option === 'object' ? (option.text || option.value || option) : option;
              const optionImage = typeof option === 'object' ? option.image : null;
              const isSelected = selectedAnswer === index;
              const isAnswered = selectedAnswer !== null;
              
              // Get correct answer - handle both letter (A,B,C,D) and index (0,1,2,3) formats
              const correctAnswerRaw = currentQuestion?.correctAnswer || currentQuestion?.correct_answer;
              let correctAnswerIndex;
              if (typeof correctAnswerRaw === 'string' && /^[A-Da-d]$/.test(correctAnswerRaw)) {
                correctAnswerIndex = correctAnswerRaw.toUpperCase().charCodeAt(0) - 65;
              } else if (typeof correctAnswerRaw === 'number') {
                correctAnswerIndex = correctAnswerRaw;
              } else {
                correctAnswerIndex = parseInt(correctAnswerRaw) || 0;
              }
              
              const isCorrectOption = index === correctAnswerIndex;
              const isWrongSelected = isSelected && !isCorrectOption;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={`w-full text-left p-3.5 md:p-4 rounded-2xl border-2 transition-all duration-200 ${
                    !isAnswered
                      ? 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98]'
                      : isCorrectOption
                        ? 'bg-green-50 border-green-500 shadow-sm'
                        : isWrongSelected
                          ? 'bg-red-50 border-red-500 shadow-sm'
                          : 'bg-slate-50/50 border-slate-100 opacity-60'
                  }`}
                  data-testid={`option-${index}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Option Letter Badge - Pill style */}
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0 transition-colors ${
                      !isAnswered
                        ? 'bg-slate-200 text-slate-600'
                        : isCorrectOption
                          ? 'bg-green-600 text-white'
                          : isWrongSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    {/* Option Content (Text and/or Image) */}
                    <div className="flex-1">
                      {optionImage && (
                        <img 
                          src={optionImage.startsWith('/api') 
                            ? `${process.env.REACT_APP_BACKEND_URL}${optionImage}`
                            : optionImage
                          }
                          alt={`Option ${String.fromCharCode(65 + index)}`}
                          className="max-w-full h-auto rounded-md mb-1"
                          style={{ maxHeight: '100px', objectFit: 'contain' }}
                        />
                      )}
                      <span className="font-medium text-gray-800 text-sm md:text-base">
                        <MathText text={optionText} />
                      </span>
                    </div>
                    {/* Correct/Incorrect indicators */}
                    {isAnswered && isCorrectOption && (
                      <span className="text-green-600 font-bold text-lg">✓</span>
                    )}
                    {isAnswered && isWrongSelected && (
                      <span className="text-red-600 font-bold text-lg">✗</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoloPractice;