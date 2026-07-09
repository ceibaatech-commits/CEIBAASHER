import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

import Header from '../components/Header';
import PageBackdrop from './quiz/PageBackdrop';
import IntroScreen from './quiz/IntroScreen';
import QuizScreen from './quiz/QuizScreen';
import ResultsScreen from './quiz/ResultsScreen';
import useQuizFlow from '../hooks/useQuizFlow';

/**
 * Thin container for the SponsoredQuiz experience. All quiz state / logic
 * lives in `useQuizFlow`; this file only wires the hook up to routing, auth,
 * and the three screen components.
 */
export default function SponsoredQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const flow = useQuizFlow({
    quizId,
    user,
    onNotFound: () => {
      alert('Quiz not found or no longer available');
      navigate('/');
    },
  });

  const {
    phase, quiz, questions, idx, selected, timeLeft,
    leaderboard, loadingLB, answers,
    displayScore, displayCorrect, displayTotal,
    start, select, next, prev, back,
  } = flow;

  // Loading — single centered spinner, still under Header
  if (phase === 'loading') {
    return (
      <>
        <PageBackdrop />
        <Header isLoggedIn={isAuthenticated()} user={user} onLogout={logout} />
        <div
          data-testid="quiz-loading"
          className="min-h-screen flex items-center justify-center"
        >
          <Loader2 className="w-6 h-6 text-teal-300 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Dark backdrop only for the intro screen — QuizScreen and
          ResultsScreen own their full-bleed purple backgrounds. */}
      {phase === 'intro' && <PageBackdrop />}
      {/* App Header is shown on ALL phases. It's transparent on the intro
          screen (so the hero banner flows underneath) and solid on quiz +
          results (so it sits cleanly on top of the purple bg). */}
      <Header
        isLoggedIn={isAuthenticated()}
        user={user}
        onLogout={logout}
        transparent={phase === 'intro'}
      />
      <main data-testid="quiz-page-shell">
        {phase === 'intro' && (
          <IntroScreen quiz={quiz} onStart={start} user={user} />
        )}
        {phase === 'quiz' && (
          <QuizScreen
            quiz={quiz}
            questions={questions}
            currentIdx={idx}
            selected={selected}
            timeLeft={timeLeft}
            onSelect={select}
            onNext={next}
            onPrev={prev}
            totalQuestions={questions.length}
            onBack={back}
          />
        )}
        {phase === 'results' && (
          <ResultsScreen
            quiz={quiz}
            score={displayScore}
            correct={displayCorrect}
            total={displayTotal}
            leaderboard={leaderboard}
            loadingLB={loadingLB}
            onHome={() => navigate('/')}
            questions={questions}
            answers={answers}
            user={user}
          />
        )}
      </main>
    </>
  );
}