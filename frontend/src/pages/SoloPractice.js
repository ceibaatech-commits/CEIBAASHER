import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Trophy, HelpCircle, CheckCircle2, RotateCcw, Lock } from 'lucide-react';
import axios from 'axios';
import MathText from '../components/MathText';
import PassageQuizLayout from '../components/PassageQuizLayout';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const API_URL = window.location.origin;
const QUIZ_API_URL = window.location.origin; // Use main backend

// ---- Visual helpers (extracted from nested ternaries) ----
const reviewOptionBorder = (isCorrect, isWrong) => {
  if (isCorrect) return 'border-green-500 bg-green-50';
  if (isWrong) return 'border-red-500 bg-red-50';
  return 'border-gray-100 bg-gray-50';
};

const reviewOptionBadge = (isCorrect, isWrong) => {
  if (isCorrect) return 'bg-green-500 text-white';
  if (isWrong) return 'bg-red-500 text-white';
  return 'bg-gray-200 text-gray-600';
};

const reviewOptionText = (isCorrect, isWrong) => {
  if (isCorrect) return 'text-green-800 font-medium';
  if (isWrong) return 'text-red-800';
  return 'text-gray-600';
};

const quizOptionBorder = (isAnswered, isCorrect, isWrong) => {
  if (!isAnswered) return 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98]';
  if (isCorrect) return 'bg-green-50 border-green-500 shadow-sm';
  if (isWrong) return 'bg-red-50 border-red-500 shadow-sm';
  return 'bg-slate-50/50 border-slate-100 opacity-60';
};

const quizOptionBadge = (isAnswered, isCorrect, isWrong) => {
  if (!isAnswered) return 'bg-slate-200 text-slate-600';
  if (isCorrect) return 'bg-green-600 text-white';
  if (isWrong) return 'bg-red-600 text-white';
  return 'bg-slate-200 text-slate-600';
};

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
  const board = location.state?.board || new URLSearchParams(location.search).get('board') || 'cbse';
  
  // Extract class-based data
  let classBasedData = null;
  if (isClassBased) {
    if (location.state?.class_name) {
      // Use state if available
      classBasedData = {
        class_name: location.state.class_name,
        subject: location.state.subject,
        chapter: location.state.chapter,
        stream: location.state.stream,  // Include stream if available
        board: location.state.board || board
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
      
      // Infer stream from subject for Class 11/12
      const classNum = urlClassName.replace('Class-', '').replace('class-', '');
      let inferredStream = null;
      if (classNum === '11' || classNum === '12') {
        const subjectLower = processedSubject.toLowerCase();
        // Science stream subjects
        if (['physics', 'chemistry', 'biology', 'mathematics', 'computer science'].some(s => subjectLower.includes(s))) {
          inferredStream = 'science';
        }
        // Commerce stream subjects
        else if (['accountancy', 'business studies', 'economics'].some(s => subjectLower.includes(s))) {
          inferredStream = 'commerce';
        }
        // Humanities stream subjects
        else if (['history', 'geography', 'political science', 'psychology', 'sociology'].some(s => subjectLower.includes(s))) {
          inferredStream = 'humanities';
        }
      }
      
      classBasedData = {
        class_name: urlClassName.replace('Class-', 'Class ').replace(/-/g, ' '),
        subject: processedSubject,
        chapter: processedChapter,
        stream: inferredStream,
        board
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
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Compute the destination URL for back/quit navigation (kept in sync with classBasedData/exam)
  const computeBackUrl = () => {
    if (isClassBased && classBasedData) {
      const classNum = classBasedData.class_name.toLowerCase().replace('class ', '').replace('class-', '');
      const subjectSlug = classBasedData.subject
        .toLowerCase()
        .replace(/ - /g, '---')
        .replace(/\s+/g, '-');
      const boardQuery = `?board=${classBasedData.board || 'cbse'}`;
      if ((classNum === '11' || classNum === '12') && classBasedData.stream) {
        return `/chapter-tests/class-${classNum}/${classBasedData.stream.toLowerCase()}/${subjectSlug}${boardQuery}`;
      }
      if (classNum === '11' || classNum === '12') {
        return `/chapter-tests/class-${classNum}/select-stream${boardQuery}`;
      }
      return `/chapter-tests/class-${classNum}/${subjectSlug}${boardQuery}`;
    }
    if (exam) return `/exam/${exam}`;
    return '/';
  };

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
          board: classBasedData.board,
          exam: exam, // For compatibility
          numberOfQuestions: numberOfQuestions,
          userId: user?.id || undefined,
        };
      } else {
        // Exam-based quiz (NEET, JEE, etc.)
        requestData = {
          exam: exam,
          subject: subject,
          topic: topic,
          numberOfQuestions: numberOfQuestions,
          userId: user?.id || undefined,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header 
          isLoggedIn={false}
          user={null}
          onLogout={() => {}}
        />
        <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
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
              className="w-full h-11 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all"
            >
              Login to Continue
            </button>
            <button
              onClick={() => navigate('/signup', { state: { from: location.pathname } })}
              className="w-full h-11 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-all"
            >
              Create Account
            </button>
            <button
              onClick={() => {
                // Navigate to appropriate page based on quiz type
                if (isClassBased && classBasedData) {
                  const classNum = classBasedData.class_name.toLowerCase().replace('class ', '').replace('class-', '');
                  const boardQuery = `?board=${classBasedData.board || 'cbse'}`;
                  if (classNum === '11' || classNum === '12') {
                    // If we have stream info, go to that stream's subjects
                    if (classBasedData.stream) {
                      navigate(`/chapter-tests/class-${classNum}/${classBasedData.stream.toLowerCase()}${boardQuery}`);
                    } else {
                      navigate(`/chapter-tests/class-${classNum}/select-stream${boardQuery}`);
                    }
                  } else {
                    navigate(`/chapter-tests/class-${classNum}${boardQuery}`);
                  }
                } else if (exam) {
                  navigate(`/exam/${exam}`);
                } else {
                  navigate('/');
                }
              }}
              className="w-full text-gray-500 py-1.5 text-xs hover:text-gray-700"
            >
              ← Go Back
            </button>
          </div>
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

    // ---- Dynamic Score-Based Themes ----
    // High (≥75%) → "Forest Focus" Deep Green
    // Average (45-74%) → "Japandi" Sage
    // Low (<45%) → "Sunset Academic" Ink Black
    const getResultTheme = () => {
      if (percentage >= 75) {
        return {
          tier: 'high',
          // Page
          pageBg: 'bg-[#F5F3EC]',
          // Hero card
          heroBg: 'bg-[#0F2A1D]',
          heroAccent: 'bg-[#1A3D2A]',
          heroRing: 'ring-[#C9D9B4]/30',
          scoreText: 'text-[#E9F0DC]',
          scoreAccent: 'text-[#A8C695]',
          eyebrowChip: 'bg-[#1A3D2A] text-[#C9D9B4] ring-1 ring-[#A8C695]/30',
          headline: 'You mastered this.',
          subhead: 'Forest focus — your accuracy is on point.',
          headlineColor: 'text-[#E9F0DC]',
          subheadColor: 'text-[#A8C695]',
          metaColor: 'text-[#A8C695]/80',
          // Action buttons
          primaryBtn: 'bg-[#0F2A1D] text-[#E9F0DC] hover:bg-[#1A3D2A] active:scale-[0.98] ring-1 ring-[#A8C695]/40',
          secondaryBtn: 'bg-white text-[#0F2A1D] hover:bg-[#EFEEE7] ring-1 ring-[#0F2A1D]/15 active:scale-[0.98]',
          // Review header chip + accents
          reviewChip: 'bg-[#0F2A1D] text-[#C9D9B4]',
          sectionHeading: 'text-[#0F2A1D]',
          sectionSub: 'text-[#5B6F4F]',
          // Decorative
          glow1: 'bg-[#A8C695]/15',
          glow2: 'bg-[#C9D9B4]/10',
        };
      }
      if (percentage >= 45) {
        return {
          tier: 'avg',
          pageBg: 'bg-[#F2EFE8]',
          heroBg: 'bg-[#9CAE8C]',
          heroAccent: 'bg-[#85997A]',
          heroRing: 'ring-[#1A1A1A]/10',
          scoreText: 'text-[#1A1A1A]',
          scoreAccent: 'text-[#F5F1E6]',
          eyebrowChip: 'bg-[#1A1A1A]/10 text-[#1A1A1A] ring-1 ring-[#1A1A1A]/15',
          headline: 'Solid effort — refine the gaps.',
          subhead: 'Japandi rhythm — quiet progress, steady wins.',
          headlineColor: 'text-[#1A1A1A]',
          subheadColor: 'text-[#3D3D3D]',
          metaColor: 'text-[#1A1A1A]/70',
          primaryBtn: 'bg-[#1A1A1A] text-[#F5F1E6] hover:bg-[#2A2A2A] active:scale-[0.98] ring-1 ring-[#1A1A1A]/40',
          secondaryBtn: 'bg-white text-[#1A1A1A] hover:bg-[#EFEDE5] ring-1 ring-[#1A1A1A]/15 active:scale-[0.98]',
          reviewChip: 'bg-[#9CAE8C] text-[#1A1A1A]',
          sectionHeading: 'text-[#1A1A1A]',
          sectionSub: 'text-[#5B5B55]',
          glow1: 'bg-[#F5F1E6]/30',
          glow2: 'bg-[#1A1A1A]/5',
        };
      }
      return {
        tier: 'low',
        pageBg: 'bg-[#F7F1E8]',
        heroBg: 'bg-[#1B1A18]',
        heroAccent: 'bg-[#2A2925]',
        heroRing: 'ring-[#E8B27A]/25',
        scoreText: 'text-[#F2E4CC]',
        scoreAccent: 'text-[#E8B27A]',
        eyebrowChip: 'bg-[#2A2925] text-[#E8B27A] ring-1 ring-[#E8B27A]/30',
        headline: 'Every expert was once a beginner.',
        subhead: 'Sunset reset — show up, run it again.',
        headlineColor: 'text-[#F2E4CC]',
        subheadColor: 'text-[#E8B27A]',
        metaColor: 'text-[#F2E4CC]/70',
        primaryBtn: 'bg-[#1B1A18] text-[#F2E4CC] hover:bg-[#2A2925] active:scale-[0.98] ring-1 ring-[#E8B27A]/40',
        secondaryBtn: 'bg-white text-[#1B1A18] hover:bg-[#EFE9DC] ring-1 ring-[#1B1A18]/15 active:scale-[0.98]',
        reviewChip: 'bg-[#1B1A18] text-[#E8B27A]',
        sectionHeading: 'text-[#1B1A18]',
        sectionSub: 'text-[#5F5648]',
        glow1: 'bg-[#E8B27A]/15',
        glow2: 'bg-[#F2E4CC]/10',
      };
    };
    const theme = getResultTheme();

    const handleMoreTopics = () => {
      if (isClassBased && classBasedData) {
        const classNum = classBasedData.class_name.toLowerCase().replace('class ', '').replace('class-', '');
        const boardQuery = `?board=${classBasedData.board || 'cbse'}`;
        if (classNum === '11' || classNum === '12') {
          if (classBasedData.stream) {
              navigate(`/chapter-tests/class-${classNum}/${classBasedData.stream.toLowerCase()}${boardQuery}`);
          } else {
              navigate(`/chapter-tests/class-${classNum}/select-stream${boardQuery}`);
          }
        } else {
            navigate(`/chapter-tests/class-${classNum}${boardQuery}`);
        }
      } else {
        navigate(`/exam/${exam}`);
      }
    };

    return (
      <div className={`min-h-screen ${theme.pageBg}`} data-testid="solo-practice-results">
        <Header 
          isLoggedIn={isUserAuthenticated}
          user={user}
          onLogout={() => {}}
        />
        <div className="py-4 md:py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Back Button */}
          <button
            data-testid="results-back-btn"
            onClick={handleMoreTopics}
            className={`inline-flex items-center gap-1.5 mb-4 text-sm font-medium font-geist ${theme.sectionSub} hover:${theme.sectionHeading} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {isClassBased ? `${classBasedData?.class_name} Topics` : `${exam} Topics`}
          </button>

          {/* HERO — Score Card with dynamic theme */}
          <div
            data-testid="results-hero-card"
            className={`relative ${theme.heroBg} rounded-3xl shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)] p-7 md:p-10 mb-6 overflow-hidden ring-1 ${theme.heroRing}`}
          >
            {/* Decorative blobs */}
            <div className={`pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl ${theme.glow1}`} />
            <div className={`pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl ${theme.glow2}`} />

            <div className="relative">
              {/* Eyebrow chip */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.14em] font-geist font-semibold ${theme.eyebrowChip}`}>
                <Trophy className="w-3.5 h-3.5" />
                {theme.tier === 'high' && 'Forest Focus'}
                {theme.tier === 'avg' && 'Japandi'}
                {theme.tier === 'low' && 'Sunset Reset'}
              </div>

              {/* Big Score (Bricolage / Fraunces) */}
              <div className="mt-5 flex items-end gap-3 leading-none">
                <span
                  data-testid="results-score-number"
                  className={`font-fraunces font-medium tracking-[-0.04em] text-[88px] sm:text-[112px] md:text-[128px] ${theme.scoreText}`}
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  {score ?? percentage}
                </span>
                <span className={`pb-3 sm:pb-4 md:pb-5 font-bricolage font-semibold text-3xl md:text-4xl ${theme.scoreAccent}`}>
                  %
                </span>
              </div>

              {/* Headline + subhead */}
              <div className="mt-4 max-w-xl">
                <h1
                  data-testid="results-headline"
                  className={`font-bricolage font-semibold tracking-[-0.02em] text-2xl sm:text-3xl md:text-[34px] leading-[1.15] ${theme.headlineColor}`}
                >
                  {theme.headline}
                </h1>
                <p className={`mt-2 font-geist text-sm md:text-base ${theme.subheadColor}`}>
                  {theme.subhead}
                </p>
              </div>

              {/* Meta row */}
              <div className={`mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-geist text-sm ${theme.metaColor}`}>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span data-testid="results-correct-count" className="tabular-nums">
                    {correctCount} / {totalCount}
                  </span>
                  <span className="opacity-80">correct</span>
                </span>
                <span className="opacity-50">·</span>
                <span className="truncate">
                  {isClassBased 
                    ? `${classBasedData?.class_name} • ${classBasedData?.subject} • ${classBasedData?.chapter}`
                    : `${exam} • ${subject}${topic ? ` • ${topic}` : ''}`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons — fixed standardized sizes, top placement for thumb reach */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            <button
              data-testid="practice-again-btn"
              onClick={() => window.location.reload()}
              className={`h-12 rounded-2xl font-bricolage font-semibold text-[15px] tracking-tight inline-flex items-center justify-center gap-2 transition-all shadow-sm ${theme.primaryBtn}`}
            >
              <RotateCcw className="w-4 h-4" />
              Practice Again
            </button>
            <button
              data-testid="more-topics-btn"
              onClick={handleMoreTopics}
              className={`h-12 rounded-2xl font-bricolage font-semibold text-[15px] tracking-tight inline-flex items-center justify-center gap-2 transition-all shadow-sm ${theme.secondaryBtn}`}
            >
              More Topics
            </button>
          </div>

          {/* Review Answers Section */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className={`font-bricolage font-semibold tracking-tight text-lg md:text-xl ${theme.sectionHeading}`}>
                Review your answers
              </h2>
              <p className={`text-sm font-geist mt-0.5 ${theme.sectionSub}`}>
                Tap on each question to see the explanation
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-geist font-semibold uppercase tracking-wider ${theme.reviewChip}`}>
              {totalCount} Q
            </span>
          </div>

          {/* Results Details */}
          <div className="space-y-4">
            {results?.map((result, index) => {
              const correctIndex = letterToIndex(result.correctAnswer);
              const userIndex = letterToIndex(result.userAnswer || result.selectedOption);
              
              return (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                      <div className="text-xs font-geist font-medium text-gray-500 mb-1 uppercase tracking-wider">Question {index + 1}</div>
                      <h3 className="font-bricolage font-medium text-gray-900 text-sm md:text-base leading-relaxed">
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
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${reviewOptionBorder(isCorrectOption, isWrongSelection)}`}
                        >
                          {/* Option Badge */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${reviewOptionBadge(isCorrectOption, isWrongSelection)}`}>
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          
                          {/* Option Text */}
                          <span className={`flex-1 text-sm ${reviewOptionText(isCorrectOption, isWrongSelection)}`}>
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
                            <div className="text-xs font-geist font-semibold text-blue-800 mb-1 uppercase tracking-wider">Explanation</div>
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

          {/* Sticky Bottom Action Buttons (mobile thumb zone) */}
          <div className="mt-7 grid grid-cols-2 gap-3">
            <button
              data-testid="practice-again-btn-bottom"
              onClick={() => window.location.reload()}
              className={`h-12 rounded-2xl font-bricolage font-semibold text-[15px] tracking-tight inline-flex items-center justify-center gap-2 transition-all shadow-sm ${theme.primaryBtn}`}
            >
              <RotateCcw className="w-4 h-4" />
              Practice Again
            </button>
            <button
              data-testid="more-topics-btn-bottom"
              onClick={handleMoreTopics}
              className={`h-12 rounded-2xl font-bricolage font-semibold text-[15px] tracking-tight inline-flex items-center justify-center gap-2 transition-all shadow-sm ${theme.secondaryBtn}`}
            >
              More Topics
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Setup screen - select number of questions
  if (quizState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Header 
          isLoggedIn={isUserAuthenticated}
          user={user}
          onLogout={() => {
            // Handle logout if needed
          }}
        />
        <div className="py-4 md:py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Animated Header Card */}
          <div className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 mb-4 md:mb-6 overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full -mr-20 -mt-20 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full -ml-16 -mb-16 animate-pulse delay-300"></div>
            
            <button
              onClick={() => {
                if (isClassBased && classBasedData) {
                  const classNum = classBasedData.class_name.toLowerCase().replace('class ', '').replace('class-', '');
                  const boardQuery = `?board=${classBasedData.board || 'cbse'}`;
                  // For Class 11 and 12, navigate to stream selection
                  if (classNum === '11' || classNum === '12') {
                    if (classBasedData.stream) {
                      navigate(`/chapter-tests/class-${classNum}/${classBasedData.stream.toLowerCase()}${boardQuery}`);
                    } else {
                      navigate(`/chapter-tests/class-${classNum}/select-stream${boardQuery}`);
                    }
                  } else {
                    navigate(`/chapter-tests/class-${classNum}${boardQuery}`);
                  }
                } else {
                  navigate(`/exam/${exam}`);
                }
              }}
              className="relative flex items-center text-white/90 hover:text-white mb-3 md:mb-4 bg-white/10 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-all hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="font-semibold text-sm md:text-base">Back to Chapters</span>
            </button>

            <div className="relative text-center mb-1 md:mb-2">
              <div className="inline-block bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 md:px-6 md:py-2 mb-2 md:mb-4">
                <p className="text-white/90 text-xs md:text-sm font-medium">
                  {isClassBased ? `${classBasedData.class_name} • ${classBasedData.subject}` : `${exam} • ${subject}`}
                </p>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white mb-1 md:mb-2 drop-shadow-lg">
                🎯 Setup Your Quiz
              </h1>
              <p className="text-white/90 text-sm md:text-base font-medium">
                {isClassBased ? classBasedData.chapter : `${topic || ''} ${subTopic || ''}`}
              </p>
            </div>
          </div>

          {/* Questions Selection Card */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
              <div className="bg-slate-800 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-lg">
                <HelpCircle className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Number of Questions</h2>
                <p className="text-xs md:text-sm text-gray-500">Choose how many questions you want</p>
              </div>
            </div>

            {/* Question count buttons with emojis */}
            <div className="grid grid-cols-5 gap-1.5 md:gap-2 mb-4 md:mb-5">
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
                  className={`relative py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg transition-all transform active:scale-95 ${
                    numberOfQuestions === num
                      ? `bg-gradient-to-br ${color} text-white shadow-xl scale-105 md:scale-110`
                      : 'bg-white text-gray-700 hover:shadow-lg hover:scale-105 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl md:text-2xl mb-0.5 md:mb-1">{emoji}</div>
                  <div className="text-xs md:text-sm font-black">{num}</div>
                </button>
              ))}
            </div>

            {/* Animated slider */}
            <div className="relative mb-3 md:mb-4">
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                className="w-full h-2 md:h-3 rounded-full appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, rgb(15 23 42) 0%, rgb(15 23 42) ${((numberOfQuestions - 10) / 90) * 100}%, rgb(229 231 235) ${((numberOfQuestions - 10) / 90) * 100}%, rgb(229 231 235) 100%)`
                }}
              />
            </div>

            {/* Current selection display */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 md:gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl md:rounded-2xl px-4 py-2 md:px-6 md:py-3">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                <span className="text-lg md:text-2xl font-black text-slate-800">
                  {numberOfQuestions} Questions Selected
                </span>
              </div>
            </div>
          </div>

          {/* Start Quiz Button */}
          <button
            onClick={startQuiz}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3 mb-4 md:mb-6"
          >
            <Trophy className="w-6 h-6 md:w-7 md:h-7 text-amber-400" />
            <span>Start Quiz Now 🚀</span>
          </button>

          {/* Info Card */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-5 flex items-start gap-3 md:gap-4">
            <div className="bg-slate-800 rounded-lg md:rounded-xl p-1.5 md:p-2 flex-shrink-0">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900 mb-0.5 md:mb-1 text-sm md:text-base">⏱️ Quick Info</p>
              <p className="text-xs md:text-sm text-slate-700">
                Each question has <strong>30 seconds</strong>. Review all answers at the end before submitting!
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Loading screen
  if (quizState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading questions...</p>
          </div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
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
      </div>
    );
  }

  // Default quiz layout (for non-passage questions)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-8">
      <Header />

      {/* Quit-Confirm Modal (replaces unreliable window.confirm on mobile) */}
      {showQuitConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="solo-quit-confirm-modal"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quit this quiz?</h3>
            <p className="text-gray-600 mb-6">Your progress will be lost. Are you sure you want to leave?</p>
            <div className="flex gap-3">
              <button
                data-testid="solo-quit-stay"
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Stay
              </button>
              <button
                data-testid="solo-quit-confirm"
                onClick={() => {
                  setShowQuitConfirm(false);
                  navigate(computeBackUrl());
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 pt-6">
        {/* Breadcrumb for class-based */}
        {isClassBased && classBasedData && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <button 
              onClick={() => navigate(`/chapter-tests?board=${classBasedData.board || 'cbse'}`)} 
              className="hover:text-cyan-600 font-semibold"
            >
              Home
            </button>
            <span>/</span>
            <button 
              onClick={() => navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}?board=${classBasedData.board || 'cbse'}`)} 
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
                navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}/${subjectSlug}?board=${classBasedData.board || 'cbse'}`);
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
              data-testid="solo-quiz-back-btn"
              onClick={() => {
                const hasProgress = selectedAnswer !== null || currentQuestionIndex > 0;
                if (!hasProgress) {
                  navigate(computeBackUrl());
                } else {
                  setShowQuitConfirm(true);
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
                    ? `${window.location.origin}${currentQuestion.question_image}`
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
                  className={`w-full text-left p-3.5 md:p-4 rounded-2xl border-2 transition-all duration-200 ${quizOptionBorder(isAnswered, isCorrectOption, isWrongSelected)}`}
                  data-testid={`option-${index}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Option Letter Badge - Pill style */}
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0 transition-colors ${quizOptionBadge(isAnswered, isCorrectOption, isWrongSelected)}`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    {/* Option Content (Text and/or Image) */}
                    <div className="flex-1">
                      {optionImage && (
                        <img 
                          src={optionImage.startsWith('/api') 
                            ? `${window.location.origin}${optionImage}`
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