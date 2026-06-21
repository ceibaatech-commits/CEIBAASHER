import { useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { toast } from 'sonner';

export default function useMatchmakingWS({
  BACKEND_URL,
  examId,
  subject,
  topic,
  userRef,
  playerNameRef,
  roomIdRef,
  battleStateRef,
  opponentFinishedRef,
  quitNotifiedRef,
  socketRef,
  typingEmitRef,
  typingResetRef,
  typingActiveRef,
  handleBattleScoreUpdate,
  initAgora,
  setSocket,
  setIsReconnecting,
  setSearchCountdown,
  setSearchTimedOut,
  setResultNotice,
  setLiveNotice,
  setOpponentFinishedQuiz,
  setMyScore,
  setOpponentScore,
  setCurrentQuestionIndex,
  setSelectedAnswer,
  setOpponentAnswer,
  setAnswerResult,
  setTimeLeft,
  setTally,
  setChatMessages,
  setRematchState,
  setRoomId,
  setOpponent,
  setOpponentOnline,
  setBattleState,
  setOpponentQuestionIndex,
  setOpponentTyping,
  setRematchRequesterName,
  setRematchCountdown,
  setVcRequester,
  setVcState,
  setVcReady,
  setAgoraToken,
  setQuestions,
}) {
  useEffect(() => {
    const s = io(BACKEND_URL, {
      path: '/api/battlews/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    setSocket(s);
    socketRef.current = s;

    s.on('connect', () => {
      setIsReconnecting(false);
      const u = userRef.current;
      if (u && u.id) {
        s.emit('authenticate', { userData: { id: u.id, username: u.username, name: u.name } });
      }
    });

    s.on('connect_error', () => setIsReconnecting(true));
    s.on('reconnect_attempt', () => setIsReconnecting(true));
    s.on('reconnect', () => setIsReconnecting(false));
    s.on('disconnect', () => setIsReconnecting(true));

    s.on('waiting', (d) => {
      if (d.timeout) setSearchCountdown(d.timeout);
    });

    s.on('match-found', async (d) => {
      setSearchTimedOut(false);
      quitNotifiedRef.current = false;
      opponentFinishedRef.current = false;
      setResultNotice(null);
      setLiveNotice(null);
      setOpponentFinishedQuiz(false);

      setMyScore(0);
      setOpponentScore(0);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setOpponentAnswer(null);
      setAnswerResult(null);
      setTimeLeft(30);
      setTally({ correct: 0, wrong: 0, skipped: 0, timeBonus: 0 });
      setChatMessages([]);
      setRematchState('idle');

      setRoomId(d.roomId);
      roomIdRef.current = d.roomId;
      const opp = d.players[1] || d.players.find((p) => p.playerName !== playerNameRef.current);
      setOpponent(opp);
      setOpponentOnline(true);
      setBattleState('matched');
      if (d.rematch) toast.success('Rematch starting!');

      const fetchQ = async () => {
        const decodedExam = decodeURIComponent(examId);
        const decodedSubject = decodeURIComponent(subject);
        const decodedTopic = topic ? decodeURIComponent(topic) : undefined;
        const attempts = [
          { exam: decodedExam, subject: decodedSubject, topic: decodedTopic, num_questions: 10 },
          { exam: decodedExam, subject: decodedSubject, num_questions: 10 },
        ];

        for (const body of attempts) {
          try {
            const r = await axios.post(`${BACKEND_URL}/api/quiz/start`, body);
            if (r.data.success && r.data.questions?.length > 0) return r.data.questions;
            if (r.data.questions?.length > 0) return r.data.questions;
          } catch {
            // Try fallback query payload
          }
        }
        return null;
      };

      const qs = await fetchQ();
      if (qs) {
        setQuestions(qs);
        setTimeout(() => setBattleState('playing'), 2500);
      } else {
        toast.error('No questions available for this exam. Returning to setup.');
        setTimeout(() => setBattleState('setup'), 2000);
      }
    });

    s.on('match-timeout', () => {
      setSearchTimedOut(true);
      setBattleState('setup');
    });

    s.on('battle-start', (d) => {
      if (d.questions) setQuestions(d.questions);
      setBattleState('playing');
    });

    s.on('battle:score_update', handleBattleScoreUpdate);

    s.on('battle:question_advance', (d) => {
      const nextQuestion = typeof d.newQuestion === 'number'
        ? d.newQuestion
        : (typeof d.questionIndex === 'number' ? d.questionIndex + 1 : undefined);

      const meId = userRef.current?.id || userRef.current?.user_id || playerNameRef.current;
      const isMe = d.playerId === meId || d.playerId === playerNameRef.current;

      if (typeof nextQuestion === 'number') {
        if (isMe) setCurrentQuestionIndex(Math.max(0, nextQuestion - 1));
        else setOpponentQuestionIndex(nextQuestion);
      }
    });

    s.on('opponent-answered', (d) => {
      setOpponentOnline((prev) => (prev ? prev : true));
      if (d.score !== undefined) setOpponentScore(d.score);
      if (typeof d.questionIndex === 'number') setOpponentQuestionIndex(d.questionIndex + 1);
      setOpponentAnswer(d.answer);
    });

    s.on('opponent-score-update', (d) => {
      if (typeof d?.score === 'number') setOpponentScore(d.score);
      if (d?.completed) {
        opponentFinishedRef.current = true;
        setOpponentFinishedQuiz(true);
        setOpponentTyping(false);
        setOpponentOnline(false);
        const totalQs = Number.isFinite(d?.totalQuestions) ? Number(d.totalQuestions) : 10;
        setOpponentQuestionIndex(totalQs + 1);
        if (battleStateRef.current === 'playing') {
          setLiveNotice(`${d?.playerName || 'Opponent'} finished all questions. Keep going — you can still complete your MCQs.`);
        }
      }
    });

    s.on('chat-message', (d) => {
      setOpponentOnline((prev) => (prev ? prev : true));
      setChatMessages((prev) => [...prev, { playerName: d.playerName, message: d.message, ts: Date.now() }]);
    });

    s.on('chat-typing', (d) => {
      setOpponentOnline((prev) => (prev ? prev : true));
      setOpponentTyping(!!d?.isTyping);
      clearTimeout(typingResetRef.current);
      if (d?.isTyping) {
        typingResetRef.current = setTimeout(() => setOpponentTyping(false), 4000);
      }
    });

    s.on('opponent-disconnected', () => {
      if (opponentFinishedRef.current) {
        setOpponentOnline(false);
        return;
      }
      setOpponentOnline(false);
      const msg = 'Opponent disconnected. You can keep answering MCQs and finish your battle.';
      setResultNotice('Opponent disconnected. You win by default.');
      if (battleStateRef.current === 'playing') {
        setLiveNotice(msg);
        toast.error('Opponent disconnected. Continue your MCQs.');
      } else {
        toast.error('Opponent disconnected! You win.');
        setBattleState('results');
      }
    });

    s.on('opponent-left', (d) => {
      if (opponentFinishedRef.current) {
        setOpponentOnline(false);
        setOpponentTyping(false);
        return;
      }
      setOpponentOnline(false);
      setOpponentTyping(false);
      const quitter = d?.playerName || 'Opponent';
      setResultNotice(`${quitter} left the battle. You win by default.`);
      setChatMessages((prev) => [...prev, {
        playerName: 'System',
        message: `${quitter} left the battle.`,
        ts: Date.now(),
      }]);

      if (battleStateRef.current === 'playing') {
        setLiveNotice(`${quitter} left. Keep attempting MCQs; your battle will finish after your last question.`);
        toast.error(`${quitter} left. Continue your MCQs.`);
      } else {
        toast.error(`${quitter} left the battle.`);
        setBattleState('results');
      }
    });

    s.on('battle-ended', () => {
      if (battleStateRef.current !== 'playing') setBattleState('results');
    });

    s.on('rematch-pending', () => {
      toast('Waiting for opponent to accept...');
      setRematchState('pending');
    });

    s.on('rematch-requested', (d) => {
      const requester = d?.requesterName || 'Your opponent';
      const expiresIn = Number.isFinite(d?.expiresIn) ? d.expiresIn : 15;
      toast(`${requester} wants a rematch!`);
      setRematchRequesterName(requester);
      setRematchCountdown(Math.max(1, expiresIn));
      setRematchState('requested');
    });

    s.on('rematch-declined', (d) => {
      toast.error(d?.reason || 'Opponent declined the rematch.');
      setRematchState('idle');
    });

    s.on('rematch-timeout', (d) => {
      toast.error(d?.reason || 'Opponent declined the rematch.');
      setRematchState('idle');
    });

    s.on('rematch-expired', () => {
      setRematchState('idle');
    });

    s.on('vc_request', (d) => {
      setVcRequester(d.playerName);
      setVcState('incoming');
    });

    s.on('vc_accepted', async () => {
      const ok = await initAgora();
      if (!ok) {
        setVcState('idle');
        return;
      }
      setVcState('active');
      toast.success('Video call connected!');
    });

    s.on('vc_declined', () => {
      setVcState('idle');
      toast('Video call declined');
    });

    s.on('vc_ended', () => {
      setVcState('idle');
      setVcReady(false);
      setAgoraToken(null);
      toast('Video call ended');
    });

    return () => {
      clearTimeout(typingEmitRef.current);
      if (typingActiveRef.current && roomIdRef.current) {
        s.emit('battle-chat-typing', { roomId: roomIdRef.current, isTyping: false });
        typingActiveRef.current = false;
      }
      s.close();
    };
  }, []);
}
