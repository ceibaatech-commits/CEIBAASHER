import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Clock, CheckCircle2, ArrowLeft, AlertCircle, Trophy } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function QuizAttempt() {
  const { quizId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    startQuiz();
  }, [quizId]);

  const startQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/quiz/${quizId}/start`, { headers: { Authorization: `Bearer ${token}` } });
      setQuiz(data.quiz);
      setTimeLeft((data.quiz.time_limit || 15) * 60);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load quiz');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!quiz || submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz, submitted]);

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${BACKEND_URL}/api/recruitment/quiz/${quizId}/submit`, { answers }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(data);
      const lb = await axios.get(`${BACKEND_URL}/api/recruitment/quiz/${quizId}/leaderboard`);
      setLeaderboard(lb.data.leaderboard || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Submit failed');
    }
  }, [answers, quizId, submitted]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <div className="min-h-screen bg-slate-50"><Header isLoggedIn={isAuthenticated?.()} user={user} /><div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div><Footer /></div>;

  if (error) return (
    <div className="min-h-screen bg-slate-50">
      <Header isLoggedIn={isAuthenticated?.()} user={user} />
      <div className="flex items-center justify-center py-32">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md shadow-sm">
          <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
          <p className="text-slate-800 font-semibold text-lg">{error}</p>
          <button onClick={() => navigate('/jobs')} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Back to Feed</button>
        </div>
      </div>
      <Footer />
    </div>
  );

  if (submitted && result) return (
    <div className="min-h-screen bg-slate-50" data-testid="quiz-results">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <Trophy size={48} className="mx-auto text-amber-500 mb-4" />
          <h2 className="text-slate-800 text-2xl font-bold">Quiz Complete!</h2>
          <div className="mt-4 flex justify-center gap-8">
            <div><span className="text-3xl font-bold text-blue-600">{result.score}</span><p className="text-slate-500 text-sm">Correct</p></div>
            <div><span className="text-3xl font-bold text-slate-800">{result.total}</span><p className="text-slate-500 text-sm">Total</p></div>
            <div><span className="text-3xl font-bold text-emerald-500">{result.percentage}%</span><p className="text-slate-500 text-sm">Score</p></div>
          </div>
        </div>
        {leaderboard.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mt-4">
            <h3 className="text-slate-800 font-semibold mb-4">Leaderboard</h3>
            {leaderboard.slice(0, 10).map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-slate-200 last:border-0">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-[#f59e0b]/20 text-amber-500' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                <span className="flex-1 text-slate-800 text-sm">{entry.user_name}</span>
                <span className="text-blue-600 font-semibold text-sm">{entry.score}/{entry.total}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => navigate('/jobs')} className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl font-medium">Back to Feed</button>
      </div>
    </div>
  );

  if (!quiz) return null;
  const q = quiz.questions[currentQ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="quiz-attempt-page">
      <div className="bg-slate-100 border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h2 className="text-slate-800 font-semibold truncate">{quiz.title}</h2>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-mono font-bold ${timeLeft < 60 ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-white text-slate-800'}`}>
            <Clock size={14} /> {formatTime(timeLeft)}
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-2">
          <div className="flex gap-1">
            {quiz.questions.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${answers[String(i)] !== undefined ? 'bg-blue-600' : i === currentQ ? 'bg-[#252a3d]' : 'bg-slate-100'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-slate-500 text-sm mb-2">Question {currentQ + 1} of {quiz.questions.length}</p>
        <h3 className="text-slate-800 text-xl font-semibold mb-6">{q.question}</h3>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setAnswers(prev => ({ ...prev, [String(currentQ)]: i }))}
              data-testid={`option-${i}`}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                answers[String(currentQ)] === i
                  ? 'border-blue-500 bg-blue-600/10 text-slate-800'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-blue-500/30'
              }`}
            >
              <span className="inline-flex w-6 h-6 rounded-full border mr-3 items-center justify-center text-xs font-medium flex-shrink-0" style={{ borderColor: answers[String(currentQ)] === i ? '#4f7cff' : '#252a3d' }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          {currentQ > 0 && <button onClick={() => setCurrentQ(currentQ - 1)} className="px-6 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl" data-testid="prev-btn">Previous</button>}
          {currentQ < quiz.questions.length - 1 ? (
            <button onClick={() => setCurrentQ(currentQ + 1)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium" data-testid="next-btn">Next</button>
          ) : (
            <button onClick={handleSubmit} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium" data-testid="submit-quiz-btn">Submit Quiz</button>
          )}
        </div>
      </div>
    </div>
  );
}
