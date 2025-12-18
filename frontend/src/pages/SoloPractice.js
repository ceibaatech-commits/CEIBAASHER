import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Trophy, HelpCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import MathText from '../components/MathText';
import PassageQuizLayout from '../components/PassageQuizLayout';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const QUIZ_API_URL = process.env.REACT_APP_BACKEND_URL; // Use main backend

const SoloPractice = () => {
  const { examName, subjectName, examId, topicName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
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
      // URL format: /topic-quiz/Class-6/science/components-of-food
      const urlClassName = urlExamName; // "Class-6"
      const urlSubject = subjectName; // "science"  
      const urlChapter = topicName; // "components-of-food"
      
      classBasedData = {
        class_name: urlClassName.replace('Class-', 'Class ').replace(/-/g, ' '),
        subject: urlSubject.charAt(0).toUpperCase() + urlSubject.slice(1),
        chapter: urlChapter.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
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

  useEffect(() => {
    if (quizState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (quizState === 'playing' && timeLeft === 0) {
      handleNextQuestion();
    }
  }, [timeLeft, quizState]);

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
        handleNextQuestion();
      }, 1500);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeLeft(30);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    try {
      const response = await axios.post(`${QUIZ_API_URL}/api/quiz/submit`, {
        quizId,
        answers
      });
      
      if (response.data.success) {
        setScore(response.data.score);
        setResults(response.data.results);
        setQuizState('results');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <button
              onClick={() => {
                if (isClassBased && classBasedData) {
                  navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}`);
                } else {
                  navigate(`/exam/${exam}`);
                }
              }}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to {isClassBased ? `${classBasedData?.class_name} Topics` : `${exam} Topics`}
            </button>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
              <div className="text-5xl font-bold text-blue-600 mb-2">{score}%</div>
              <p className="text-gray-600">
                You got {results?.filter(r => r.isCorrect).length} out of {results?.length} correct
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {isClassBased ? `${classBasedData.class_name} - ${classBasedData.subject} - ${classBasedData.chapter}` : `${exam} - ${subject} ${topic ? `- ${topic}` : ''}`}
              </p>
            </div>
          </div>

          {/* Results Details */}
          <div className="space-y-4">
            {results?.map((result, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex-1">
                    Q{index + 1}. {result.question}
                  </h3>
                  {result.isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 ml-2" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 ml-2" />
                  )}
                </div>

                <div className="space-y-2 mb-3">
                  {result.options.map((option, optIndex) => {
                    // Handle both string options and object options {id, text}
                    const optionText = typeof option === 'object' ? (option.text || option.value || option) : option;
                    return (
                    <div
                      key={optIndex}
                      className={`p-3 rounded-lg border-2 ${
                        optIndex === result.correctAnswer
                          ? 'border-green-500 bg-green-50'
                          : optIndex === result.userAnswer && !result.isCorrect
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                        <span><MathText text={optionText} /></span>
                        {optIndex === result.correctAnswer && (
                          <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                        )}
                        {optIndex === result.userAnswer && !result.isCorrect && (
                          <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                        )}
                      </div>
                    </div>
                  )})}
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Explanation:</strong> <MathText text={result.explanation} />
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Practice Again
            </button>
            <button
              onClick={() => {
                if (isClassBased && classBasedData) {
                  // Navigate back to subject selection for class-based
                  navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}`);
                } else {
                  // Navigate to exam page for exam-based
                  navigate(`/exam/${exam}`);
                }
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-semibold transition-all shadow-md"
            >
              {isClassBased ? 'Choose Another Chapter' : 'Choose Another Subject'}
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
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <button
                onClick={() => {
                  if (isClassBased && classBasedData) {
                    navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}/${classBasedData.subject.toLowerCase()}`);
                  } else {
                    navigate(`/exam/${exam}`);
                  }
                }}
                className="bg-white text-gray-700 hover:text-gray-900 flex items-center border-2 border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg transition-all font-semibold"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to {isClassBased ? 'Chapters' : 'Exam Topics'}
              </button>
            </div>

            {/* Breadcrumb for class-based */}
            {isClassBased && classBasedData && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
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
                  onClick={() => navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}/${classBasedData.subject.toLowerCase()}`)} 
                  className="hover:text-cyan-600 font-semibold"
                >
                  {classBasedData.subject}
                </button>
                <span>/</span>
                <span className="text-gray-900 font-semibold">{classBasedData.chapter}</span>
              </div>
            )}

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Your Quiz</h1>
              <p className="text-gray-600">
                {isClassBased ? `${classBasedData.class_name} - ${classBasedData.subject} - ${classBasedData.chapter}` : `${exam} - ${subject} ${topic ? `- ${topic}` : ''} ${subTopic ? `- ${subTopic}` : ''}`}
              </p>
            </div>

            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Number of Questions
              </label>
              <div className="grid grid-cols-5 gap-3 mb-4">
                {[10, 20, 30, 50, 100].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumberOfQuestions(num)}
                    className={`py-4 px-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                      numberOfQuestions === num
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg border-2 border-transparent'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 shadow-sm'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>10 questions</span>
                <span className="font-bold text-lg text-purple-600">{numberOfQuestions} questions</span>
                <span>100 questions</span>
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold text-base hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
            >
              <Trophy className="w-5 h-5" />
              <span>Start Quiz</span>
            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Each question will have 30 seconds. You can review all answers at the end.
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
              onClick={() => navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}/${classBasedData.subject.toLowerCase()}`)} 
              className="hover:text-cyan-600 font-semibold"
            >
              {classBasedData.subject}
            </button>
            <span>/</span>
            <span className="text-gray-900 font-semibold">{classBasedData.chapter}</span>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                // Only show confirmation if user has answered at least one question
                const hasProgress = selectedAnswer !== null || currentQuestionIndex > 0;
                if (!hasProgress || window.confirm('Are you sure you want to quit this quiz? Your progress will be lost.')) {
                  if (isClassBased && classBasedData) {
                    navigate(`/chapter-tests/class-${classBasedData.class_name.toLowerCase().replace('class ', '')}/${classBasedData.subject.toLowerCase()}`);
                  } else {
                    navigate(`/exam/${exam}`);
                  }
                }
              }}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {isClassBased ? 'Back to Chapters' : 'Back to Exam Topics'}
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} / {questions.length}
              </div>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                <Clock className="w-5 h-5" />
                <span className="font-bold text-lg">{timeLeft}s</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">{examName} - {subjectName}</div>
            <h2 className="text-2xl font-bold text-gray-900">
              <MathText text={currentQuestion?.question} />
            </h2>
          </div>

          <div className="space-y-3">
            {currentQuestion?.options.map((option, index) => {
              // Handle both string options and object options {id, text}
              const optionText = typeof option === 'object' ? (option.text || option.value || option) : option;
              return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === null
                    ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    : selectedAnswer === index
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 opacity-50'
                }`}
                data-testid={`option-${index}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    selectedAnswer === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1 font-medium text-gray-900">
                    <MathText text={optionText} />
                  </span>
                </div>
              </button>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoloPractice;