import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, Clock, Send, MessageCircle, Swords, Loader2, Shield, Mic, MicOff, Video, VideoOff, Phone, PhoneOff, EyeOff, Eye, Flag, X, AlertTriangle } from 'lucide-react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import io from 'socket.io-client';
import axios from 'axios';
import MathText from '../components/MathText';
import { useAuth } from '../context/AuthContext';
import AgoraUIKit from 'agora-react-uikit';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
const AGORA_APP_ID = 'f512a6c76b5a4e0abd193119f3ba22fe';

/* ── Color Tokens ── */
const C = {
  cream: '#F5F0EB', pink: '#F9D5C8', red: '#E8503A', blue: '#5B8FD4',
  redLight: '#FDE8E4', blueLight: '#E4EEF9', white: '#FFFFFF',
};

/* ── Report Reasons ── */
const REPORT_REASONS = [
  { id: 'nudity', label: 'Nudity / Sexual Content' },
  { id: 'harassment', label: 'Harassment / Bullying' },
  { id: 'offensive_content', label: 'Offensive Content' },
  { id: 'cheating', label: 'Cheating' },
  { id: 'inappropriate_behavior', label: 'Other Inappropriate Behaviour' },
];

const Matchmaking1v1 = () => {
  const { examId, subject, topic } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [battleState, setBattleState] = useState('setup');
  const [playerName, setPlayerName] = useState('');
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [searchCountdown, setSearchCountdown] = useState(30);
  const [searchTimedOut, setSearchTimedOut] = useState(false);
  const [parentsModeBlocked, setParentsModeBlocked] = useState(false);
  const [parentsModeTimeRemaining, setParentsModeTimeRemaining] = useState(0);

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [answerResult, setAnswerResult] = useState(null);
  const [opponentAnswer, setOpponentAnswer] = useState(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Video Call state
  const [vcState, setVcState] = useState('idle'); // idle, requesting, incoming, active
  const [agoraToken, setAgoraToken] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [vcHidden, setVcHidden] = useState(false);
  const [vcRequester, setVcRequester] = useState('');

  // Report state
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  // Check Parents Mode
  useEffect(() => {
    const check = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const r = await axios.get(`${BACKEND_URL}/api/user/parents-mode/check-battle-access`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.data.success && !r.data.can_access_battle) {
          setParentsModeBlocked(true);
          setParentsModeTimeRemaining(r.data.time_remaining_seconds || 0);
          setBattleState('blocked');
        }
      } catch {}
    };
    check();
  }, []);

  useEffect(() => { if (user?.name) setPlayerName(user.name); }, [user]);

  // Socket connection
  useEffect(() => {
    const s = io(BACKEND_URL, { path: '/api/battlews/socket.io', transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 5, timeout: 20000 });
    setSocket(s);

    s.on('connect', () => console.log('Connected to battle server'));
    s.on('waiting', (d) => { if (d.timeout) setSearchCountdown(d.timeout); });

    s.on('match-found', async (d) => {
      setSearchTimedOut(false);
      setRoomId(d.roomId);
      const opp = d.players.find(p => p.playerName !== playerName);
      setOpponent(opp);
      setBattleState('matched');
      // Fetch questions
      try {
        const r = await axios.post(`${BACKEND_URL}/api/quiz/start`, { exam: examId, subject, topic, num_questions: 10 });
        if (r.data.success && r.data.questions) { setQuestions(r.data.questions); setTimeout(() => setBattleState('playing'), 2500); }
      } catch { if (s) s.emit('request-questions', { roomId: d.roomId, exam: examId, subject, topic }); }
    });

    s.on('match-timeout', () => { setSearchTimedOut(true); setBattleState('setup'); });
    s.on('battle-start', (d) => { if (d.questions) setQuestions(d.questions); setBattleState('playing'); });
    s.on('opponent-answered', (d) => { if (d.score !== undefined) setOpponentScore(d.score); setOpponentAnswer(d.answer); });
    s.on('opponent-score-update', (d) => setOpponentScore(d.score));
    s.on('chat-message', (d) => setChatMessages(prev => [...prev, { playerName: d.playerName, message: d.message, ts: Date.now() }]));
    s.on('opponent-disconnected', () => { toast.error('Opponent disconnected! You win.'); setBattleState('results'); });
    s.on('battle-ended', () => setBattleState('results'));

    // VC events
    s.on('vc_request', (d) => { setVcRequester(d.playerName); setVcState('incoming'); });
    s.on('vc_accepted', () => { initAgora(); setVcState('active'); toast.success('Video call connected!'); });
    s.on('vc_declined', () => { setVcState('idle'); toast('Video call declined'); });
    s.on('vc_ended', () => { setVcState('idle'); setAgoraToken(null); toast('Video call ended'); });

    return () => s.close();
  }, [playerName]);

  // Heartbeat
  useEffect(() => {
    if (!socket) return;
    const hb = setInterval(() => { if (socket?.connected) socket.emit('heartbeat', { timestamp: Date.now() }); }, 10000);
    return () => clearInterval(hb);
  }, [socket]);

  // Search countdown
  useEffect(() => {
    if (battleState !== 'searching') return;
    setSearchCountdown(30); setSearchTimedOut(false);
    const iv = setInterval(() => setSearchCountdown(p => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
    return () => clearInterval(iv);
  }, [battleState]);

  // Timer
  useEffect(() => {
    if (battleState === 'playing' && timeLeft > 0 && selectedAnswer === null) {
      const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(t);
    } else if (battleState === 'playing' && timeLeft === 0 && selectedAnswer === null) {
      handleAnswerSelect(-1);
    }
  }, [timeLeft, battleState, selectedAnswer]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // End VC on results
  useEffect(() => {
    if (battleState === 'results' && vcState === 'active') {
      if (socket && roomId) socket.emit('vc_ended', { roomId, playerName });
      setVcState('idle'); setAgoraToken(null);
    }
  }, [battleState]);

  const initAgora = async () => {
    const ch = roomId?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
    if (!ch) return;
    try {
      const token = localStorage.getItem('token');
      const h = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.get(`${BACKEND_URL}/api/agora/token?channel=${ch}`, { headers: h });
      setAgoraToken(data.token);
    } catch { setAgoraToken(''); }
  };

  const startMatchmaking = () => {
    if (!playerName.trim()) return;
    socket.emit('find-match', { playerName, exam: examId, subject, topic });
    setBattleState('searching');
  };

  const cancelMatchmaking = () => { socket.emit('cancel-match'); setBattleState('setup'); };

  const handleAnswerSelect = (index) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const q = questions[currentQuestionIndex];
    const raw = q.correctAnswer || q.correct_answer;
    let ci;
    if (typeof raw === 'string' && /^[A-Da-d]$/.test(raw)) ci = raw.toUpperCase().charCodeAt(0) - 65;
    else if (typeof raw === 'number') ci = raw;
    else ci = parseInt(raw) || 0;
    const ok = index === ci;
    const pts = ok ? Math.max(10, timeLeft * 3) : 0;
    setAnswerResult({ isCorrect: ok, correctAnswer: ci, points: pts });
    if (ok) setMyScore(p => p + pts);
    if (socket && roomId) socket.emit('battle-answer', { roomId, questionIndex: currentQuestionIndex, answer: index, isCorrect: ok, score: myScore + pts, timeTaken: 30 - timeLeft });
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(p => p + 1); setSelectedAnswer(null); setAnswerResult(null); setOpponentAnswer(null); setTimeLeft(30);
      } else {
        if (socket && roomId) socket.emit('battle-complete', { roomId, playerName, finalScore: myScore + pts, userId: user?.id || user?.user_id, totalQuestions: questions.length, exam: examId, subject });
        setBattleState('results');
      }
    }, 2000);
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim() && socket && roomId) {
      socket.emit('battle-chat', { roomId, playerName, message: chatInput });
      setChatMessages(p => [...p, { playerName, message: chatInput, ts: Date.now() }]);
      setChatInput('');
    }
  };

  const requestVC = () => { socket.emit('vc_request', { roomId, playerName }); setVcState('requesting'); };
  const acceptVC = () => { socket.emit('vc_accepted', { roomId, playerName }); initAgora(); setVcState('active'); };
  const declineVC = () => { socket.emit('vc_declined', { roomId, playerName }); setVcState('idle'); };
  const endVC = () => { socket.emit('vc_ended', { roomId, playerName }); setVcState('idle'); setAgoraToken(null); };

  const submitReport = async () => {
    if (!reportReason) return;
    setReportSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/admin/battles/report`, { battle_id: roomId, room_id: roomId, reported_user_id: opponent?.socketId || 'unknown', reported_username: opponent?.playerName || 'Opponent', reason: reportReason, description: reportDesc, chat_messages: [] }, { headers: { Authorization: `Bearer ${token}` } });
      setReportDone(true);
    } catch { toast.error('Failed to submit report'); }
    finally { setReportSubmitting(false); }
  };

  const isUserAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;
  const sanitizedChannel = roomId?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 64) || '';

  // ━━━━━━━━━━━━━━━━━━━━ LOGIN REQUIRED ━━━━━━━━━━━━━━━━━━━━
  if (!isUserAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.cream }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: C.red }}><Swords className="w-10 h-10 text-white" /></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to access 1v1 battles.</p>
          <button onClick={() => navigate('/login', { state: { from: location.pathname } })} className="w-full text-white py-3 rounded-xl font-bold" style={{ background: C.red }}>Login to Battle</button>
          <button onClick={() => navigate(-1)} className="w-full mt-3 text-gray-500 py-2 text-sm">← Go Back</button>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━ PARENTS MODE ━━━━━━━━━━━━━━━━━━━━
  if (battleState === 'blocked' || parentsModeBlocked) {
    const fmt = (s) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.cream }}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6"><Shield className="w-12 h-12 text-white" /></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Parents Mode Active</h2>
          <p className="text-gray-500 mb-6">1v1 Battle Mode has been temporarily disabled.</p>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6"><p className="text-amber-600 text-sm mb-2">Time remaining:</p><p className="text-4xl font-bold text-amber-600 font-mono">{fmt(parentsModeTimeRemaining)}</p></div>
          <button onClick={() => navigate('/profile/board')} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold">Go to My Board</button>
          <button onClick={() => navigate(-1)} className="w-full mt-3 text-gray-500 py-2 text-sm">← Go Back</button>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━ SETUP ━━━━━━━━━━━━━━━━━━━━
  if (battleState === 'setup') {
    return (
      <div className="min-h-screen" style={{ background: C.cream }}>
        <div className="px-4 sm:px-12 pt-4">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 py-3"><ArrowLeft className="w-5 h-5 mr-2" /> Back</button>
          <div className="w-full sm:max-w-[460px] sm:mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-10">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: C.red }}><Swords className="w-10 h-10 text-white" /></div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">1v1 Battle</h1>
              <p className="font-semibold text-lg" style={{ color: C.red }}>{decodeURIComponent(examId)}</p>
              <p className="text-gray-600">{decodeURIComponent(subject)} {topic ? `• ${decodeURIComponent(topic)}` : ''}</p>
              <p className="text-xs text-gray-400 mt-1">You'll be matched with anyone in this exam</p>
            </div>
            {searchTimedOut && <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-center"><p className="font-bold mb-1">No opponent found</p><p className="text-sm">Try again or pick a different subject!</p></div>}
            <div className="space-y-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Your Battle Name</label><input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Enter your name" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none font-medium" style={{ '--tw-ring-color': C.red }} data-testid="player-name-input" /></div>
              <div className="rounded-xl p-4 border-l-4" style={{ background: C.redLight, borderColor: C.red }}>
                <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: C.red }}><Swords className="w-5 h-5" /> Battle Rules</h3>
                <ul className="space-y-1 text-sm text-gray-700"><li>Real-time 1v1 quiz duel</li><li>10 questions, 30 seconds each</li><li>Faster answers = More points</li><li>Optional video call with opponent</li></ul>
              </div>
              <button onClick={startMatchmaking} disabled={!playerName.trim()} className="w-full text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: C.red }} data-testid="find-opponent-btn"><Swords className="w-5 h-5" /> {searchTimedOut ? 'Try Again' : 'Find Opponent'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━ SEARCHING ━━━━━━━━━━━━━━━━━━━━
  if (battleState === 'searching') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.cream }}>
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto" style={{ background: C.red }}><Swords className="w-14 h-14 text-white" /></div>
            <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full border-4 animate-ping opacity-20" style={{ borderColor: C.red }} />
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"><span className="text-sm font-black" style={{ color: C.red }} data-testid="search-countdown">{searchCountdown}</span></div>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Finding Opponent</h2>
          <p className="text-gray-500 text-sm mb-1">{decodeURIComponent(examId)} — matching across all topics</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6 mt-4 overflow-hidden"><div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(searchCountdown / 30) * 100}%`, background: C.red }} /></div>
          <div className="flex items-center justify-center gap-2 mb-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: C.red }} /><span className="text-gray-500 text-sm">{searchCountdown > 20 ? 'Searching...' : searchCountdown > 10 ? 'Still looking...' : 'Expanding search...'}</span></div>
          <button onClick={cancelMatchmaking} className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-300" data-testid="cancel-search-btn">Cancel</button>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━ MATCHED ━━━━━━━━━━━━━━━━━━━━
  if (battleState === 'matched') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.cream }}>
        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-6">Match Found!</h2>
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center"><div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2" style={{ background: C.red }}>{playerName.charAt(0).toUpperCase()}</div><p className="font-semibold text-gray-900">{playerName}</p></div>
            <div className="text-4xl font-black" style={{ color: C.red }}>VS</div>
            <div className="text-center"><div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2" style={{ background: C.blue }}>{opponent?.playerName?.charAt(0).toUpperCase() || '?'}</div><p className="font-semibold text-gray-900">{opponent?.playerName || 'Opponent'}</p></div>
          </div>
          <p className="text-gray-400 animate-pulse">Starting battle...</p>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━ PLAYING ━━━━━━━━━━━━━━━━━━━━
  if (battleState === 'playing' && questions.length > 0) {
    const q = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const oppName = opponent?.playerName || 'Opponent';

    return (
      <div className="min-h-screen" style={{ background: C.cream }}>
        {/* ── MOBILE LAYOUT ── */}
        <div className="md:hidden flex flex-col min-h-screen">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
            <div className="flex items-center gap-2"><button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5 text-gray-600" /></button><span className="font-bold text-gray-900 text-sm">{playerName}</span></div>
            <div className="px-3 py-1 rounded-full text-white text-sm font-bold" style={{ background: timeLeft <= 10 ? C.red : '#888' }}>{timeLeft}s</div>
          </div>

          {/* VC Panel (mobile) */}
          {vcState === 'active' && !vcHidden && (
            <div className="px-4 py-3" style={{ background: C.pink }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: C.blue }}>{oppName[0]}</div><div><p className="text-xs font-semibold text-gray-800">{oppName}</p><p className="text-[10px] text-green-600">Connected</p></div></div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setMicOn(!micOn)} className={`p-1.5 rounded-lg ${micOn ? 'bg-white' : 'bg-red-100'}`}>{micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-red-500" />}</button>
                  <button onClick={() => setCamOn(!camOn)} className={`p-1.5 rounded-lg ${camOn ? 'bg-white' : 'bg-red-100'}`}>{camOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5 text-red-500" />}</button>
                  <button onClick={() => setVcHidden(true)} className="p-1.5 bg-white rounded-lg"><EyeOff className="w-3.5 h-3.5 text-gray-500" /></button>
                  <button onClick={endVC} className="p-1.5 bg-red-500 rounded-lg"><PhoneOff className="w-3.5 h-3.5 text-white" /></button>
                </div>
              </div>
              {agoraToken !== null && <div className="w-full h-32 rounded-xl overflow-hidden bg-gray-900"><AgoraUIKit rtcProps={{ appId: AGORA_APP_ID, channel: sanitizedChannel, token: agoraToken || '', role: 'host', layout: 1 }} callbacks={{ EndCall: endVC }} /></div>}
            </div>
          )}

          {/* Hidden VC thumbnail */}
          {vcState === 'active' && vcHidden && (
            <button onClick={() => setVcHidden(false)} className="fixed bottom-20 right-3 z-50 w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border-2 border-white bg-gray-900">
              <div className="w-full h-full flex items-center justify-center"><Eye className="w-5 h-5 text-white" /></div>
            </button>
          )}

          {/* Progress bar */}
          <div className="h-1.5 mx-4 mt-2 rounded-full overflow-hidden" style={{ background: '#e0d8d0' }}><div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${C.red}, ${C.blue})` }} /></div>

          {/* Question */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Q{currentQuestionIndex + 1} of {questions.length} • {decodeURIComponent(subject)}</p>
            <h2 className="text-xl font-serif font-bold text-gray-900 mb-5 leading-relaxed"><MathText text={q.question} /></h2>
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const txt = typeof opt === 'object' ? (opt.text || opt.label) : opt;
                const isMine = selectedAnswer === i;
                const isOpp = opponentAnswer === i;
                const isCorrect = answerResult && answerResult.correctAnswer === i;
                const isWrong = isMine && answerResult && !answerResult.isCorrect;
                let border = '#e5e0db'; let bg = C.white; let badge = null;
                if (answerResult) {
                  if (isCorrect) { border = '#22c55e'; bg = '#f0fdf4'; }
                  else if (isWrong) { border = C.red; bg = C.redLight; }
                } else if (isMine) { border = C.red; bg = C.redLight; badge = 'You'; }
                if (isOpp && !answerResult) { border = C.blue; bg = C.blueLight; badge = oppName; }
                if (isMine && isOpp && !answerResult) { border = '#8b5cf6'; bg = '#f5f3ff'; }
                return (
                  <button key={i} onClick={() => handleAnswerSelect(i)} disabled={selectedAnswer !== null}
                    className="w-full text-left p-4 rounded-xl border-2 transition-all relative" style={{ borderColor: border, background: bg }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: isCorrect ? '#22c55e' : isWrong ? C.red : isMine ? C.red : isOpp ? C.blue : '#e5e0db', color: (isCorrect || isWrong || isMine || isOpp) ? '#fff' : '#374151' }}>{String.fromCharCode(65 + i)}</div>
                      <span className="flex-1 font-medium text-gray-900 text-sm"><MathText text={txt} /></span>
                      {isCorrect && <span className="text-green-500 font-bold">✓</span>}
                      {isWrong && <span style={{ color: C.red }} className="font-bold">✗</span>}
                    </div>
                    {badge && !answerResult && <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: isMine ? C.red : C.blue }}>{badge}</span>}
                  </button>
                );
              })}
            </div>
            {answerResult && <div className={`mt-4 p-3 rounded-xl border-2 ${answerResult.isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}><p className={`font-bold text-sm ${answerResult.isCorrect ? 'text-green-800' : 'text-red-800'}`}>{answerResult.isCorrect ? `✓ Correct! +${answerResult.points} pts` : '✗ Incorrect!'}</p></div>}
          </div>

          {/* Bottom score bar */}
          <div className="px-4 py-3 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="font-bold text-sm" style={{ color: C.red }}>{playerName.split(' ')[0]}</span><span className="text-lg font-black" style={{ color: C.red }}>{myScore} pts</span></div>
            <span className="text-gray-400 font-bold text-xs">VS</span>
            <div className="flex items-center gap-2"><span className="text-lg font-black" style={{ color: C.blue }}>{opponentScore} pts</span><span className="font-bold text-sm" style={{ color: C.blue }}>{oppName.split(' ')[0]}</span></div>
          </div>
        </div>

        {/* ── DESKTOP LAYOUT ── */}
        <div className="hidden md:block max-w-7xl mx-auto px-6 py-4">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: C.red }}>{playerName.charAt(0).toUpperCase()}</div>
              <div><p className="font-bold text-gray-900">{playerName}</p><p className="text-xl font-black" style={{ color: C.red }}>{myScore} pts</p></div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-black ${timeLeft <= 10 ? 'animate-pulse' : ''}`} style={{ color: timeLeft <= 10 ? C.red : '#374151' }}>{timeLeft}s</div>
              <p className="text-gray-400 text-sm">Q{currentQuestionIndex + 1}/{questions.length}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right"><p className="font-bold text-gray-900">{oppName}</p><p className="text-xl font-black" style={{ color: C.blue }}>{opponentScore} pts</p></div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: C.blue }}>{oppName.charAt(0).toUpperCase()}</div>
            </div>
          </div>

          {/* Progress */}
          <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: '#e0d8d0' }}><div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${C.red}, ${C.blue})` }} /></div>

          <div className="grid grid-cols-[1fr_240px] gap-4">
            {/* Quiz area */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{decodeURIComponent(subject)} {topic ? `• ${decodeURIComponent(topic)}` : ''}</span>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mt-3 mb-6 leading-relaxed"><MathText text={q.question} /></h2>
              <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt, i) => {
                  const txt = typeof opt === 'object' ? (opt.text || opt.label) : opt;
                  const isMine = selectedAnswer === i;
                  const isOpp = opponentAnswer === i;
                  const isCorrect = answerResult && answerResult.correctAnswer === i;
                  const isWrong = isMine && answerResult && !answerResult.isCorrect;
                  let border = '#e5e0db'; let bg = C.white; let badge = null;
                  if (answerResult) { if (isCorrect) { border = '#22c55e'; bg = '#f0fdf4'; } else if (isWrong) { border = C.red; bg = C.redLight; } }
                  else if (isMine) { border = C.red; bg = C.redLight; badge = 'You'; }
                  if (isOpp && !answerResult) { border = C.blue; bg = C.blueLight; badge = oppName; }
                  return (
                    <button key={i} onClick={() => handleAnswerSelect(i)} disabled={selectedAnswer !== null}
                      className="text-left p-4 rounded-xl border-2 transition-all hover:shadow-md relative" style={{ borderColor: border, background: bg }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: isCorrect ? '#22c55e' : isWrong ? C.red : isMine ? C.red : isOpp ? C.blue : '#e5e0db', color: (isCorrect || isWrong || isMine || isOpp) ? '#fff' : '#374151' }}>{String.fromCharCode(65 + i)}</div>
                        <span className="flex-1 font-medium text-gray-900"><MathText text={txt} /></span>
                        {isCorrect && <span className="text-green-500 font-bold text-xl">✓</span>}
                        {isWrong && <span style={{ color: C.red }} className="font-bold text-xl">✗</span>}
                      </div>
                      {badge && !answerResult && <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: isMine ? C.red : C.blue }}>{badge}</span>}
                    </button>
                  );
                })}
              </div>
              {answerResult && <div className={`mt-4 p-4 rounded-xl border-2 ${answerResult.isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}><p className={`font-bold ${answerResult.isCorrect ? 'text-green-800' : 'text-red-800'}`}>{answerResult.isCorrect ? `✓ Correct! +${answerResult.points} pts` : '✗ Incorrect!'}</p></div>}
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Opponent card */}
              <div className="rounded-2xl p-4 text-center" style={{ background: C.pink }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2" style={{ background: C.blue }}>{oppName.charAt(0).toUpperCase()}</div>
                <p className="font-bold text-gray-900 text-sm">{oppName}</p>
                <p className="text-xs text-gray-500">{decodeURIComponent(examId)}</p>
                {/* VC embedded in sidebar */}
                {vcState === 'active' && agoraToken !== null && (
                  <div className="mt-3 w-full h-32 rounded-xl overflow-hidden bg-gray-900"><AgoraUIKit rtcProps={{ appId: AGORA_APP_ID, channel: sanitizedChannel, token: agoraToken || '', role: 'host', layout: 1 }} callbacks={{ EndCall: endVC }} /></div>
                )}
              </div>

              {/* VC controls */}
              <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-2">
                {vcState === 'idle' && <button onClick={requestVC} className="w-full py-2 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ background: C.blue }}><Phone className="w-4 h-4" /> Start Video Call</button>}
                {vcState === 'requesting' && <div className="text-center py-2 text-sm text-gray-500 animate-pulse">Waiting for opponent...</div>}
                {vcState === 'active' && (
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setMicOn(!micOn)} className={`p-2 rounded-lg ${micOn ? 'bg-gray-100' : 'bg-red-100'}`}>{micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-500" />}</button>
                    <button onClick={() => setCamOn(!camOn)} className={`p-2 rounded-lg ${camOn ? 'bg-gray-100' : 'bg-red-100'}`}>{camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-red-500" />}</button>
                    <button onClick={endVC} className="p-2 bg-red-500 rounded-lg"><PhoneOff className="w-4 h-4 text-white" /></button>
                  </div>
                )}
                <button onClick={() => setShowReport(true)} className="w-full py-1.5 rounded-lg text-xs text-gray-400 hover:text-red-500 flex items-center justify-center gap-1"><Flag className="w-3 h-3" /> Report</button>
              </div>

              {/* Battle info */}
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Battle Info</p>
                <p className="text-xs text-gray-600">{decodeURIComponent(examId)}</p>
                <p className="text-xs text-gray-600">{decodeURIComponent(subject)}</p>
                <p className="text-xs text-gray-500 mt-1">Q{currentQuestionIndex + 1}/{questions.length} • {timeLeft}s left</p>
              </div>

              {/* Chat */}
              <div className="bg-white rounded-xl border border-gray-100 flex flex-col" style={{ height: '220px' }}>
                <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" style={{ color: C.blue }} /><span className="text-xs font-bold text-gray-700">Chat</span></div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {chatMessages.length === 0 ? <p className="text-center text-gray-400 text-[10px] py-2">Say hi!</p> : chatMessages.map((m, i) => (
                    <div key={i} className={`p-1.5 rounded-lg text-xs ${m.playerName === playerName ? 'ml-4 text-white' : 'mr-4 bg-gray-100 text-gray-800'}`} style={m.playerName === playerName ? { background: C.red } : {}}>
                      <p className="opacity-70 text-[10px]">{m.playerName}</p><p>{m.message}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendChat} className="flex gap-1.5 p-2 border-t border-gray-100">
                  <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message..." maxLength={100} className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none" />
                  <button type="submit" disabled={!chatInput.trim()} className="p-1.5 text-white rounded-lg disabled:opacity-50" style={{ background: C.red }}><Send className="w-3.5 h-3.5" /></button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* VC Request Modal (incoming) */}
        {vcState === 'incoming' && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse" style={{ background: C.blue }}><Phone className="w-8 h-8 text-white" /></div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Video Call Request</h3>
              <p className="text-gray-500 text-sm mb-6">{vcRequester} wants to video call</p>
              <div className="flex gap-3">
                <button onClick={declineVC} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold">Decline</button>
                <button onClick={acceptVC} className="flex-1 py-3 text-white rounded-xl font-semibold" style={{ background: '#22c55e' }}>Accept</button>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReport && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              {reportDone ? (
                <div className="p-8 text-center"><div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center"><svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div><h3 className="text-lg font-bold mb-2">Report Submitted</h3><button onClick={() => { setShowReport(false); setReportDone(false); setReportReason(''); setReportDesc(''); }} className="mt-4 px-6 py-2 rounded-xl text-white font-semibold" style={{ background: C.blue }}>Close</button></div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border-b"><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /><h3 className="font-bold">Report User</h3></div><button onClick={() => setShowReport(false)}><X className="w-4 h-4" /></button></div>
                  <div className="p-4 space-y-2">{REPORT_REASONS.map(r => (<label key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${reportReason === r.id ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}><input type="radio" name="rr" checked={reportReason === r.id} onChange={() => setReportReason(r.id)} /><span className="text-sm font-medium">{r.label}</span></label>))}<textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Details..." rows={2} className="w-full p-3 border rounded-xl text-sm" /></div>
                  <div className="p-4 border-t"><button onClick={submitReport} disabled={!reportReason || reportSubmitting} className="w-full py-2.5 bg-red-500 text-white rounded-xl font-medium disabled:opacity-50">{reportSubmitting ? 'Submitting...' : 'Submit Report'}</button></div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━ RESULTS ━━━━━━━━━━━━━━━━━━━━
  if (battleState === 'results') {
    const isWinner = myScore > opponentScore;
    const isTie = myScore === opponentScore;
    const oppName = opponent?.playerName || 'Opponent';

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.cream }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Result banner */}
            <div className={`py-8 px-6 text-center ${isWinner ? 'bg-gradient-to-br from-amber-400 to-orange-500' : isTie ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 'bg-gradient-to-br from-gray-400 to-gray-600'}`}>
              {isWinner && <div className="w-24 h-24 mx-auto mb-2"><DotLottiePlayer src="https://assets-v2.lottiefiles.com/a/745fc364-117b-11ee-b7ec-9f18a8a356e0/ctpFpJP75f.lottie" loop autoplay style={{ width: '100%', height: '100%' }} /></div>}
              {!isWinner && <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"><Trophy className="w-10 h-10 text-white" /></div>}
              <h1 className="text-4xl font-black text-white mb-1">{isWinner ? 'Victory!' : isTie ? 'Draw!' : 'Defeat'}</h1>
              <p className="text-white/80">{isWinner ? 'You dominated!' : isTie ? 'A worthy match!' : 'Better luck next time!'}</p>
            </div>

            {/* Score cards */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-4 rounded-xl text-center" style={{ background: C.redLight, border: isWinner ? `2px solid ${C.red}` : '2px solid transparent' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2" style={{ background: C.red }}>{playerName.charAt(0).toUpperCase()}</div>
                  <p className="text-xs text-gray-600 mb-1">You</p>
                  <p className="text-2xl font-black" style={{ color: C.red }}>{myScore}</p>
                </div>
                <div className="flex items-center justify-center"><span className="text-gray-300 font-black text-xl">VS</span></div>
                <div className="p-4 rounded-xl text-center" style={{ background: C.blueLight, border: !isWinner && !isTie ? `2px solid ${C.blue}` : '2px solid transparent' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2" style={{ background: C.blue }}>{oppName.charAt(0).toUpperCase()}</div>
                  <p className="text-xs text-gray-600 mb-1">{oppName.split(' ')[0]}</p>
                  <p className="text-2xl font-black" style={{ color: C.blue }}>{opponentScore}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div><p className="text-gray-400">Questions</p><p className="font-bold text-gray-900">{questions.length}</p></div>
                  <div><p className="text-gray-400">Exam</p><p className="font-bold text-gray-900">{decodeURIComponent(examId)}</p></div>
                  <div><p className="text-gray-400">Subject</p><p className="font-bold text-gray-900">{decodeURIComponent(subject)}</p></div>
                </div>
              </div>

              <div className="space-y-2">
                <button onClick={() => window.location.reload()} className="w-full text-white py-3.5 rounded-xl font-bold hover:shadow-xl transition-all" style={{ background: C.red }}>Battle Again</button>
                <button onClick={() => navigate('/victory-lane')} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">Victory Lane</button>
                <button onClick={() => navigate('/')} className="w-full text-gray-500 py-2 text-sm hover:text-gray-700">Home</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen flex items-center justify-center" style={{ background: C.cream }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: C.red }} /></div>;
};

export default Matchmaking1v1;
