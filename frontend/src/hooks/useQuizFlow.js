import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { POINTS_PER_CORRECT } from '../pages/quiz/constants';

const DEFAULT_BACKEND = process.env.REACT_APP_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');

/**
 * Reusable quiz state machine for the SponsoredQuiz experience.
 *
 * Owns: quiz loading, phase transitions (loading → intro → quiz → results),
 * per-question timer, answer selection, scoring, attempt submission, and
 * leaderboard fetch. UI is fully decoupled — this hook returns state +
 * action callbacks that any screen composition can consume (SponsoredQuizPage
 * today, hypothetical rapid-fire / practice variants tomorrow).
 *
 * `answers` is an array aligned by question index (answers[i] belongs to
 * questions[i]), written via upsert rather than push. This makes revisiting
 * a question via `prev`/`next` idempotent — re-answering or just reviewing
 * never double-counts score or drops data, since each slot is simply
 * overwritten rather than appended.
 *
 * @param {object} opts
 * @param {string} opts.quizId — path/URL identifier for GET /api/sponsored-quizzes/:quizId
 * @param {object|null} opts.user — logged-in user (or null / undefined for anonymous)
 * @param {() => void} [opts.onNotFound] — invoked when the quiz fails to load
 * @param {string} [opts.backendUrl] — override the API base URL (defaults to REACT_APP_BACKEND_URL)
 * @param {number} [opts.defaultTimePerQuestion=30] — fallback when a question has no `time_limit`
 * @param {(letter: string) => void} [opts.onSelectSideEffect] — optional hook for haptics/audio
 * @returns {object} { phase, quiz, questions, idx, selected, timeLeft, score, answers,
 *                     leaderboard, loadingLB, serverResult,
 *                     displayScore, displayCorrect, displayTotal,
 *                     start, select, next, prev, back, reset }
 */
export default function useQuizFlow({
  quizId,
  user,
  onNotFound,
  backendUrl = DEFAULT_BACKEND,
  defaultTimePerQuestion = 30,
  onSelectSideEffect,
} = {}) {
  const [quiz, setQuiz] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading | intro | quiz | results
  const [questions, setQuestions] = useState([]);

  // Per-question state
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null); // null = not answered; '' = timed out; 'A'..'D' = picked
  // Aligned by index: answers[i] = { question_id, selected_answer } | undefined.
  // Written via upsert (see next/prev) so revisiting a question never
  // duplicates or loses its entry.
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(defaultTimePerQuestion);

  // Results state
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLB, setLoadingLB] = useState(false);
  const [serverResult, setServerResult] = useState(null);

  // Refs — used by the timer effect so it doesn't need to depend on the
  // freshest closure of `select`. Callback refs also let the load effect
  // stay stable even when the parent passes fresh callback identities.
  const selectedRef = useRef(selected);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const onNotFoundRef = useRef(onNotFound);
  useEffect(() => { onNotFoundRef.current = onNotFound; }, [onNotFound]);

  const onSelectSideEffectRef = useRef(onSelectSideEffect);
  useEffect(() => { onSelectSideEffectRef.current = onSelectSideEffect; }, [onSelectSideEffect]);

  // ── Load quiz ──
  useEffect(() => {
    if (!quizId) return;
    let cancelled = false;
    axios
      .get(`${backendUrl}/api/sponsored-quizzes/${quizId}`)
      .then((res) => {
        if (cancelled) return;
        const q = res.data?.quiz;
        if (!q) throw new Error('Quiz payload missing');
        setQuiz(q);
        setQuestions(q.questions || []);
        setPhase('intro');
      })
      .catch(() => {
        if (cancelled) return;
        const cb = onNotFoundRef.current;
        if (cb) cb();
      });
    return () => { cancelled = true; };
  }, [quizId, backendUrl]);

  // ── Actions ──
  const select = useCallback(
    (letter, timeout = false) => {
      if (selectedRef.current !== null) return;
      setSelected(timeout ? '' : letter);
      const sfx = onSelectSideEffectRef.current;
      if (letter && sfx) {
        try { sfx(letter); } catch { /* non-fatal */ }
      }
    },
    []
  );

  const submitAttempt = useCallback(async (finalAnswers) => {
    setPhase('results');
    setLoadingLB(true);
    try {
      if (user) {
        const res = await axios.post(
          `${backendUrl}/api/sponsored-quizzes/${quizId}/attempt`,
          {
            user_id: user.id,
            user_name: user.name || user.username || 'Anonymous',
            avatar_url: user.avatar_url || user.profile_pic || '',
            answers: finalAnswers,
          }
        );
        if (res.data?.result) setServerResult(res.data.result);
      }
      const lbRes = await axios.get(
        `${backendUrl}/api/sponsored-quizzes/${quizId}/leaderboard`
      );
      setLeaderboard(lbRes.data?.leaderboard || []);
    } catch {
      /* leaderboard is best-effort */
    } finally {
      setLoadingLB(false);
    }
  }, [backendUrl, quizId, user]);

  const start = useCallback(() => {
    setIdx(0);
    setSelected(null);
    setAnswers([]);
    setServerResult(null);
    setTimeLeft(questions[0]?.time_limit || defaultTimePerQuestion);
    setPhase('quiz');
  }, [questions, defaultTimePerQuestion]);

  // Persist the current question's answer into `answers[idx]` (upsert).
  // Shared by next/prev so leaving a question — in either direction —
  // never loses what was selected there.
  const commitCurrentAnswer = useCallback(() => {
    const q = questions[idx];
    if (!q) return;
    const entry = { question_id: q.id, selected_answer: selected };
    setAnswers((prevAnswers) => {
      const copy = [...prevAnswers];
      copy[idx] = entry;
      return copy;
    });
  }, [idx, questions, selected]);

  const next = useCallback(() => {
    const q = questions[idx];
    if (!q) return;

    commitCurrentAnswer();

    if (idx + 1 < questions.length) {
      const nextIdx = idx + 1;
      // If this question was already visited before (via prev), restore
      // its stored answer so it shows as locked/reviewed instead of blank.
      const existing = answersRef.current[nextIdx];
      setIdx(nextIdx);
      setSelected(existing ? existing.selected_answer : null);
      setTimeLeft(questions[nextIdx]?.time_limit || defaultTimePerQuestion);
    } else {
      // Build the final array synchronously rather than waiting on the
      // upsert above to flush, so submission never races the state update.
      const finalAnswers = [...answersRef.current];
      finalAnswers[idx] = { question_id: q.id, selected_answer: selected };
      submitAttempt(finalAnswers);
    }
  }, [idx, questions, selected, commitCurrentAnswer, submitAttempt, defaultTimePerQuestion]);

  // Go back to review the previous question. Only ever called when
  // idx > 0 (QuizScreen already guards this, but we guard again here).
  // Restores that question's previously-selected answer so it renders in
  // its already-answered/locked state rather than blank.
  const prev = useCallback(() => {
    if (idx === 0) return;

    // Save whatever's selected on the question we're leaving, in case the
    // user is stepping back from a question they'd already answered (or,
    // in edge cases, an in-progress one) — nothing gets silently dropped.
    commitCurrentAnswer();

    const targetIdx = idx - 1;
    const existing = answersRef.current[targetIdx];
    setIdx(targetIdx);
    setSelected(existing ? existing.selected_answer : null);
    setTimeLeft(questions[targetIdx]?.time_limit || defaultTimePerQuestion);
  }, [idx, questions, commitCurrentAnswer, defaultTimePerQuestion]);

  const reset = useCallback(() => {
    setIdx(0);
    setSelected(null);
    setAnswers([]);
    setServerResult(null);
    setLeaderboard([]);
    setPhase('intro');
  }, []);

  const back = useCallback(({ confirm } = {}) => {
    // If the user is mid-quiz (past the first question or has already picked
    // an answer), ask for confirmation. Otherwise transition immediately.
    const midQuiz = idx > 0 || selected !== null;
    if (midQuiz) {
      const confirmed = typeof confirm === 'function'
        ? confirm()
        : (typeof window !== 'undefined'
            ? window.confirm('Leave the quiz? Your progress will be lost.')
            : true);
      if (!confirmed) return false;
    }
    reset();
    return true;
  }, [idx, selected, reset]);

  // ── Timer ──
  useEffect(() => {
    if (phase !== 'quiz' || selected !== null) return;
    if (timeLeft <= 0) {
      // Time expired → auto-select empty
      select(null, true);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft, selected, select]);

  // ── Derived values (prefer server result if available) ──
  // Score is derived from `answers` on every render rather than kept as
  // separate incrementing state — since answers are upserted by index,
  // this stays correct no matter how many times a question is revisited.
  const score = answers.reduce((total, a, i) => {
    const q = questions[i];
    if (!q || !a || !a.selected_answer) return total;
    const isCorrect = a.selected_answer.toUpperCase() === q.correct_answer?.toUpperCase();
    return total + (isCorrect ? POINTS_PER_CORRECT : 0);
  }, 0);

  const displayScore = serverResult?.score ?? score;
  const displayCorrect =
    serverResult?.correct ??
    answers.filter((a, i) => {
      const q = questions[i];
      return q && a?.selected_answer && a.selected_answer.toUpperCase() === q.correct_answer?.toUpperCase();
    }).length;
  const displayTotal = serverResult?.total ?? questions.length;

  return {
    // state
    phase,
    quiz,
    questions,
    idx,
    selected,
    timeLeft,
    score,
    answers,
    leaderboard,
    loadingLB,
    serverResult,
    // derived
    displayScore,
    displayCorrect,
    displayTotal,
    // actions
    start,
    select,
    next,
    prev,
    back,
    reset,
  };
}