import React, { useState, useEffect, useRef, useCallback, useMemo, memo, Component, lazy, Suspense } from 'react';

// Error boundary that catches Agora SDK crashes (invalid token, gateway errors)
// so they don't tear down the entire LiveBattle/Matchmaking page.
class AgoraErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false, msg: '' }; }
  static getDerivedStateFromError(err) {
    return { crashed: true, msg: err?.message || 'Video call unavailable' };
  }
  componentDidCatch(err) {
    console.warn('[AgoraErrorBoundary] caught:', err?.message);
  }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#aaa', fontSize: 13, gap: 8, padding: 16, textAlign: 'center' }}>
          <span style={{ fontSize: 24 }}>📵</span>
          <span>Video unavailable</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>{this.state.msg}</span>
        </div>
      );
    }
    return this.props.children;
  }
}
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, Clock, Send, MessageCircle, Swords, Loader2, Shield, Phone, Flag, X, AlertTriangle, Maximize2, Minimize2, GripHorizontal, Video, MoreVertical, Paperclip, Smile, Camera, Mic, CheckCheck } from 'lucide-react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import io from 'socket.io-client';
import axios from 'axios';
import MathText from '../components/MathText';
import { useAuth } from '../context/AuthContext';
import AgoraUIKit from 'agora-react-uikit';
import Header from '../components/Header';
import FollowButton from '../components/FollowButton';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
// ── Agora Video SDK (Feb 25, 2026) ──
// Token-based auth using App ID + Primary Certificate. The backend
// (/api/agora/token) generates the signed token; the client never sees the
// certificate. This is Agora's recommended production-ready setup per their
// QuickStart docs.
const AGORA_APP_ID = process.env.REACT_APP_AGORA_APP_ID || '';

const QuizView = lazy(() => import('../components/battle/QuizView'));
const BattleVideoOverlay = lazy(() => import('../components/battle/BattleVideoOverlay'));
const BattleReportModal = lazy(() => import('../components/battle/BattleReportModal'));
const BattleResultScreen = lazy(() => import('../components/battle/BattleResultScreen'));

/* ── VideoErrorBoundary ──
   Wraps the AgoraUIKit subtree so that any uncaught Agora SDK error
   (e.g. CAN_NOT_GET_GATEWAY_SERVER, network failures, getUserMedia
   denied) gracefully ends the call and shows a small toast — instead
   of crashing the entire quiz UI with React's red runtime-error overlay. */
class VideoErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('[VideoCall] Crashed:', error, info);
    try { toast.error('Video call dropped — quiz continues.'); } catch (_) { /* ignore */ }
    if (this.props.onError) this.props.onError(error);
  }
  render() {
    if (this.state.hasError) return null;   // silent fallback — quiz continues
    return this.props.children;
  }
}

/* ── 1v1 Battle Scoring Equation (Feb 24, 2026) ──
   Per-question scoring with a 30s timer:
   • CORRECT → CORRECT_BASE + round(TIME_BONUS_MAX × timeLeft / TIME_LIMIT)
                = 50–100 pts (instant=100, last sec=51)
   • WRONG   → -WRONG_PENALTY  (-10 pts; light penalty for guessing)
   • SKIPPED → 0 (no reward, no penalty)
   • Final score is clamped to [0, totalQuestions × MAX_PER_QUESTION]
   The same constants are mirrored on the backend (battle_socketio.py) for
   server-side validation, so the client can never store a score outside
   the legitimate range. ── */
const SCORE = {
  TIME_LIMIT: 30,
  CORRECT_BASE: 50,
  TIME_BONUS_MAX: 50,
  WRONG_PENALTY: 10,
  MAX_PER_QUESTION: 100,
};

function calcQuestionScore({ outcome, timeLeft }) {
  // outcome: 'correct' | 'wrong' | 'skipped'
  if (outcome === 'correct') {
    const bonus = Math.round((SCORE.TIME_BONUS_MAX * Math.max(0, Math.min(SCORE.TIME_LIMIT, timeLeft))) / SCORE.TIME_LIMIT);
    return SCORE.CORRECT_BASE + bonus;   // 50..100
  }
  if (outcome === 'wrong') return -SCORE.WRONG_PENALTY;
  return 0;
}

/* ── Stable Agora wrapper — prevents remount on parent re-renders.
   Per product requirement (Feb 24 2026):
   • Each user sees ONLY the opponent by default — local stream is sent
     but never rendered locally, mimicking a "looking through a window"
     telepresence feel.
   • A small "self-preview" eye-toggle button lets users briefly peek at
     themselves (mirror check) without leaving the call. When toggled ON,
     the local stream renders as a 90×120 (or 50×70 in compact) rounded
     PIP at the top-right of the overlay.
   • The remote stream fills the overlay completely (no split / stacking
     artefacts on Android Chrome).
   • Agora's built-in mute / camera-off / end-call buttons are SHOWN.
   • A "Connecting to opponent…" placeholder covers any brief moment before
     the remote feed actually arrives.
   • The Ceibaa "Report" flag stays in the quiz toolbar for abuse. */
/* ── StableAgoraVideo ──
   AgoraUIKit wrapper. Per product requirement (Feb 25 2026):
   • Each user sees ONLY the opponent (no self-view) — local stream is sent
     but never rendered locally.
   • Remote opponent fills the entire overlay (no Android Chrome 50/50 split).
   • Agora's built-in mute / camera-off / end-call buttons are SHOWN.
   • A "Connecting to opponent…" placeholder covers the moment before the
     remote feed arrives.
   • Token-based auth: parent fetches signed token from /api/agora/token,
     passes it down via the `token` prop. */
const StableAgoraVideo = memo(({ appId, channel, token, uid, onEnd, compact = false }) => {
  const [videoCall, setVideoCall] = useState(true);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const onEndRef = useRef(onEnd);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  // ── Call-duration timer (WhatsApp-style "MM:SS") ──
  const [callSeconds, setCallSeconds] = useState(0);
  useEffect(() => {
    if (!remoteJoined) return undefined;
    const id = setInterval(() => setCallSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [remoteJoined]);
  const formattedDuration = useMemo(() => {
    const mm = String(Math.floor(callSeconds / 60)).padStart(2, '0');
    const ss = String(callSeconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [callSeconds]);

  const rtcProps = useMemo(() => ({
    appId,
    channel,
    token: token || null,
    uid: uid || 0,
    role: 'host',
    layout: 1,             // Pinned layout (max view + min view PIP). Min is hidden.
    disableRtm: true,
    enableVideo: true,
    enableAudio: true,
  }), [appId, channel, token, uid]);

  const callbacks = useMemo(() => ({
    EndCall: () => { setVideoCall(false); if (onEndRef.current) onEndRef.current(); },
    'user-joined': (user) => { console.log('[Agora] user-joined:', user); setRemoteJoined(true); },
    'user-published': (user, mediaType) => { console.log('[Agora] user-published:', user, mediaType); setRemoteJoined(true); },
    'user-left': (user) => { console.log('[Agora] user-left:', user); setRemoteJoined(false); },
  }), []);

  if (!videoCall) return null;

  // Bottom control bar (mute / camera / end-call) — always visible.
  const localBtnContainer = {
    position: 'absolute',
    bottom: compact ? 4 : 8,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    gap: compact ? 4 : 8,
    zIndex: 30,
    background: 'transparent',
    padding: 0,
    border: 'none',
  };
  const BtnTemplateStyles = {
    width: compact ? 28 : 40,
    height: compact ? 28 : 40,
    borderRadius: compact ? 14 : 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(6px)',
  };

  return (
    <div
      data-vc-stage
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', backgroundColor: '#0a0a0a' }}
    >
      {/* Force <video> elements to object-fit:cover so the remote stream
          fills the rounded floating overlay cleanly across iOS Safari +
          Android Chrome. */}
      <style>{`
        [data-vc-stage] video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
      `}</style>
      <AgoraErrorBoundary key={`${channel}-${token}`}>
        <AgoraUIKit
          rtcProps={rtcProps}
          callbacks={callbacks}
          styleProps={{
            UIKitContainer: { width: '100%', height: '100%', position: 'absolute', inset: 0, backgroundColor: '#0a0a0a' },
            videoMode: { max: 'cover', min: 'cover' },
            // LOCAL self-view → hidden. The local stream still publishes, but
            // is not rendered locally — each user sees only the opponent.
            minViewContainer: { display: 'none', width: 0, height: 0, opacity: 0, pointerEvents: 'none' },
            // REMOTE opponent → fills the entire overlay.
            maxViewContainer: { position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 },
            localBtnContainer,
            BtnTemplateStyles,
          }}
        />
      </AgoraErrorBoundary>

      {/* ── Call-duration pill (WhatsApp-style) ── */}
      {remoteJoined && (
        <div
          data-testid="vc-call-duration"
          style={{
            position: 'absolute',
            top: compact ? 6 : 10,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: compact ? 4 : 6,
            padding: compact ? '2px 8px' : '4px 12px',
            borderRadius: 12,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            color: '#fff',
            fontSize: compact ? 10 : 12,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.02em',
            zIndex: 22,
            pointerEvents: 'none',
          }}
        >
          <span style={{
            width: compact ? 5 : 6,
            height: compact ? 5 : 6,
            borderRadius: '50%',
            background: '#ef4444',
            animation: 'vcDurPulse 1.4s infinite',
          }} />
          <span>{formattedDuration}</span>
          <style>{`@keyframes vcDurPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }`}</style>
        </div>
      )}

      {/* ── "Connecting to opponent…" placeholder ── */}
      {!remoteJoined && (
        <div
          data-testid="vc-connecting-placeholder"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 25,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: '#fff',
            textAlign: 'center',
            padding: compact ? 8 : 20,
          }}
        >
          <div style={{
            width: compact ? 28 : 56,
            height: compact ? 28 : 56,
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#5B8FD4',
            animation: 'vcConnSpin 0.9s linear infinite',
          }} />
          <p style={{ fontSize: compact ? 10 : 13, fontWeight: 600, opacity: 0.9, margin: 0 }}>
            {compact ? 'Connecting…' : 'Connecting to opponent…'}
          </p>
          <style>{`@keyframes vcConnSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
});
StableAgoraVideo.displayName = 'StableAgoraVideo';

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

const REMATCH_MUTE_BEHAVIOR = {
  AUTO_DECLINE: 'auto_decline',
  IGNORE: 'ignore',
  PASSIVE_BADGE: 'passive_badge',
};

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
  const [opponentQuestionIndex, setOpponentQuestionIndex] = useState(1);
  const [answerResult, setAnswerResult] = useState(null);
  const [opponentAnswer, setOpponentAnswer] = useState(null);
  const [scorePulse, setScorePulse] = useState({ me: false, opp: false });
  const [scoreDeltas, setScoreDeltas] = useState([]);
  const [isReconnecting, setIsReconnecting] = useState(false);
  // Per-outcome tally for the results breakdown card
  const [tally, setTally] = useState({ correct: 0, wrong: 0, skipped: 0, timeBonus: 0 });

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [opponentOnline, setOpponentOnline] = useState(false);
  const [opponentTyping, setOpponentTyping] = useState(false);
  const [opponentFinishedQuiz, setOpponentFinishedQuiz] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const chatEndRef = useRef(null);
  const typingEmitRef = useRef(null);
  const typingResetRef = useRef(null);

  // Rematch state — drives the "Rematch" button + incoming-request banner on results screen
  // Values: 'idle' | 'pending' (I asked, awaiting opponent) | 'requested' (opponent asked, I decide)
  const [rematchState, setRematchState] = useState('idle');
  const [rematchRequesterName, setRematchRequesterName] = useState('');
  const [rematchCountdown, setRematchCountdown] = useState(30);
  const [rematchMuteBehavior, setRematchMuteBehavior] = useState(REMATCH_MUTE_BEHAVIOR.AUTO_DECLINE);
  const [passiveRematchRequest, setPassiveRematchRequest] = useState(null);

  // Video Call state
  // KEY FIX: we use `vcReady` as the gate for mounting AgoraUIKit, not `agoraToken !== null`.
  // Previously: agoraToken was initialised to null, overlay condition was `agoraToken !== null`.
  //   - On error, initAgora set token to '' (empty string). '' !== null → overlay mounted with
  //     empty token → Agora joined with no credentials → black screen for both users.
  //   - On success for User A (requester), `vc_accepted` called the stale initAgora that
  //     had captured roomId=null at mount time → token fetch used channel=undefined →
  //     returned wrong/no token → black screen.
  // Now: vcReady is only set true after a valid non-empty token is confirmed.
  const [vcState, setVcState] = useState('idle'); // idle | requesting | incoming | active
  const [agoraToken, setAgoraToken] = useState(null);
  const [agoraUid, setAgoraUid] = useState(0);
  const [agoraAppId, setAgoraAppId] = useState(AGORA_APP_ID);
  const [vcReady, setVcReady] = useState(false);
  // ── WhatsApp/Instagram-style PIP behaviour ──
  // 'mini'   — tiny draggable bubble (just video, no Agora controls)
  // 'pip'    — medium floating card with Agora controls visible (default after VC starts)
  // 'full'   — fullscreen takeover with Agora controls visible (drag disabled)
  const [vcSize, setVcSize] = useState('pip');
  const [vcPos, setVcPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [vcRequester, setVcRequester] = useState('');

  // Report state
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [liveNotice, setLiveNotice] = useState(null);
  const [resultNotice, setResultNotice] = useState(null);

  const displayMyScore = Number.isFinite(myScore) ? myScore : 0;
  const displayOpponentScore = Number.isFinite(opponentScore) ? opponentScore : 0;
  const isPlayerMe = useCallback((playerId) => {
    const uid = user?.id || user?.user_id;
    if (playerId == null || uid == null) return true;
    return String(playerId) === String(uid);
  }, [user]);

  // Refs so socket listeners always read live values (prevents stale closures)
  const roomIdRef = useRef(null);
  const playerNameRef = useRef('');
  const userRef = useRef(null);
  const notificationsMutedRef = useRef(false);
  const rematchMuteBehaviorRef = useRef(REMATCH_MUTE_BEHAVIOR.AUTO_DECLINE);
  const socketRef = useRef(null);
  const battleStateRef = useRef('setup');
  const questionsRef = useRef([]);

  // ── Drag refs (avoid re-creating handlers on every render) ──
  const dragStateRef = useRef({ dragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });
  const vcSizeRef = useRef(vcSize);
  const vcPosRef = useRef(vcPos);
  useEffect(() => { vcSizeRef.current = vcSize; }, [vcSize]);
  useEffect(() => { vcPosRef.current = vcPos; }, [vcPos]);

  // Dimensions for each VC size mode (used by drag-clamp + snap logic).
  // mini bubble height includes ~36px for the always-visible Agora control bar
  // (mute / camera / end-call) so users can never lose access to them.
  const vcDims = useMemo(() => ({
    mini: { w: 120, h: 190 },
    pip: { w: 300, h: 420 },
    full: { w: 0, h: 0 },   // dimensions irrelevant in fullscreen
  }), []);

  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { notificationsMutedRef.current = notificationsMuted; }, [notificationsMuted]);
  useEffect(() => { rematchMuteBehaviorRef.current = rematchMuteBehavior; }, [rematchMuteBehavior]);
  useEffect(() => { battleStateRef.current = battleState; }, [battleState]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // Check Parents Mode
  useEffect(() => {
    const check = async () => {
      try {
        const r = await axios.get(`${BACKEND_URL}/api/user/parents-mode/check-battle-access`);
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

  // initAgora — fetches a signed Agora token from /api/agora/token.
  // Backend reads AGORA_APP_ID + AGORA_APP_CERTIFICATE from env, builds an
  // RtcTokenBuilder token (1h expiry), returns { token, uid, mode }.
  // Per Agora QuickStart, token-based auth is the production-ready path and
  // requires the channel name + uid in the token to match the join request.
  const initAgora = useCallback(async () => {
    const ch = roomIdRef.current?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
    if (!ch) {
      console.warn('[VC] initAgora: roomIdRef.current is empty, aborting');
      return false;
    }
    setVcReady(false);
    try {
      // Auth lives in the httpOnly session_token cookie, auto-sent by axios.
      const { data } = await axios.get(
        `${BACKEND_URL}/api/agora/token?channel=${encodeURIComponent(ch)}`,
        { withCredentials: true }
      );
      const token = typeof data?.token === 'string' ? data.token.trim() : '';
      const uid = Number.isFinite(Number(data?.uid)) ? Number(data.uid) : 0;
      const mode = String(data?.mode || '').toLowerCase();
      const appIdFromServer = typeof data?.appId === 'string' ? data.appId.trim() : '';
      const resolvedAppId = appIdFromServer || AGORA_APP_ID;

      if (!resolvedAppId) {
        throw new Error('Missing Agora App ID');
      }
      if (mode !== 'token' || !token) {
        throw new Error('Agora project requires dynamic key (token), but backend returned app_id_only/missing token');
      }

      console.log('[VC] Agora credentials ready for channel:', ch, 'uid:', uid, 'mode:', data?.mode);
      setAgoraAppId(resolvedAppId);
      setAgoraToken(token || null);
      setAgoraUid(uid);
      setVcReady(true);
      return true;
    } catch (err) {
      console.error('[VC] Token fetch failed:', err);
      toast.error('Could not start video call. Please try again.');
      setVcState('idle');
      setVcReady(false);
      setAgoraToken(null);
      setAgoraAppId(AGORA_APP_ID);
      return false;
    }
  }, []);

  // Socket connection — empty dep array is intentional; all mutable values are read via refs
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
      console.log('[Socket] Connected to battle server');
      // Send authenticated user data so backend can read user_id from session
      // (used by matchmaking to skip blocked opponents + emit user info to peers)
      const u = userRef.current;
      if (u && u.id) {
        s.emit('authenticate', { userData: { id: u.id, username: u.username, name: u.name } });
      }
    });

    s.on('waiting', (d) => { if (d.timeout) setSearchCountdown(d.timeout); });

    s.on('match-found', async (d) => {
      setSearchTimedOut(false);
      // Reset per-battle state so rematches start clean
      setMyScore(0);
      setOpponentScore(0);
      setOpponentQuestionIndex(1);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setOpponentAnswer(null);
      setAnswerResult(null);
      setTimeLeft(30);
      setLiveNotice(null);
      setResultNotice(null);
      setOpponentFinishedQuiz(false);
      setTally({ correct: 0, wrong: 0, skipped: 0, timeBonus: 0 });
      setChatMessages([]);
      setRematchState('idle');
      setPassiveRematchRequest(null);
      // Update both state AND ref immediately so any code below can use the ref
      setRoomId(d.roomId);
      roomIdRef.current = d.roomId;
      const opp = d.players[1] || d.players.find(p => p.playerName !== playerNameRef.current);
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
          } catch {}
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

    s.on('match-timeout', () => { setSearchTimedOut(true); setBattleState('setup'); });
    s.on('battle-start', (d) => { if (d.questions) setQuestions(d.questions); setBattleState('playing'); });
    s.on('opponent-answered', (d) => {
      if (typeof d?.score === 'number') setOpponentScore(d.score);
      setOpponentOnline(true);
      if (typeof d?.questionIndex === 'number') {
        setOpponentQuestionIndex(Math.max(1, d.questionIndex + 1));
      }
      setOpponentAnswer(d.answer);
    });
    s.on('opponent-score-update', (d) => {
      if (typeof d?.score === 'number') setOpponentScore(d.score);
      setOpponentOnline(true);
      if (d?.completed) {
        setOpponentFinishedQuiz(true);
        const totalQs = Number.isFinite(d?.totalQuestions)
          ? Number(d.totalQuestions)
          : (questionsRef.current.length || 10);
        setOpponentQuestionIndex(totalQs + 1);
        if (battleStateRef.current === 'playing') {
          setLiveNotice(`${d?.playerName || 'Opponent'} finished! Keep going — you can still complete your MCQs.`);
        }
      }
    });
    s.on('chat-message', (d) => {
      setOpponentOnline(true);
      setChatMessages(prev => [...prev, { playerName: d.playerName, message: d.message, ts: Date.now() }]);
    });
    s.on('chat-typing', (d) => {
      setOpponentOnline(true);
      setOpponentTyping(!!d?.isTyping);
      // Safety: auto-clear after 4s of silence
      clearTimeout(typingResetRef.current);
      if (d?.isTyping) {
        typingResetRef.current = setTimeout(() => setOpponentTyping(false), 4000);
      }
    });
    s.on('opponent-disconnected', () => {
      setOpponentOnline(false);
      setOpponentTyping(false);
      setResultNotice('Opponent disconnected. You win by default.');
      if (battleStateRef.current === 'playing') {
        // Keep the active player in quiz — just show a notice
        setLiveNotice('Opponent disconnected. You can continue answering remaining questions.');
        toast.error('Opponent disconnected. Continue your MCQs.');
      } else {
        toast.error('Opponent disconnected! You win.');
        setBattleState('results');
      }
    });
    s.on('battle-ended', () => {
      // Only move to results if both players have finished — never interrupt mid-quiz
      if (battleStateRef.current !== 'playing') {
        setBattleState('results');
      }
    });
    s.on('battle-complete-ack', () => {
      // Server confirms both players done — now safe to go to results
      setBattleState('results');
    });

    // ── Rematch events ──
    s.on('rematch-pending', () => {
      toast('Waiting for opponent to accept...');
      setRematchState('pending');
    });
    s.on('rematch-requested', (d) => {
      const expiresIn = Number.isFinite(Number(d?.expiresIn)) ? Number(d.expiresIn) : 15;
      const requesterName = d?.requesterName || 'Opponent';
      const targetRoomId = d?.roomId || roomIdRef.current;

      if (notificationsMutedRef.current) {
        const behavior = rematchMuteBehaviorRef.current;
        if (behavior === REMATCH_MUTE_BEHAVIOR.AUTO_DECLINE) {
          s.emit('rematch-decline', {
            roomId: targetRoomId,
            reason: 'Opponent has muted rematch requests',
          });
          return;
        }
        if (behavior === REMATCH_MUTE_BEHAVIOR.IGNORE) {
          return;
        }
        if (behavior === REMATCH_MUTE_BEHAVIOR.PASSIVE_BADGE) {
          setRematchState('idle');
          setPassiveRematchRequest({
            roomId: targetRoomId,
            requesterName,
            expiresAt: Date.now() + (expiresIn * 1000),
          });
          setRematchRequesterName(requesterName);
          setRematchCountdown(expiresIn);
          return;
        }
      }

      toast(`${requesterName} wants a rematch!`);
      setPassiveRematchRequest(null);
      setRematchState('requested');
      setRematchRequesterName(requesterName);
      setRematchCountdown(expiresIn);
    });
    s.on('rematch-declined', (d) => {
      toast.error(d?.reason || 'Rematch declined');
      setRematchState('idle');
      setPassiveRematchRequest(null);
    });
    s.on('rematch-timeout', () => {
      toast.error('Opponent didn\'t respond');
      setRematchState('idle');
      setPassiveRematchRequest(null);
    });
    s.on('rematch-expired', () => {
      setRematchState('idle');
      setPassiveRematchRequest(null);
    });

    // VC socket events
    s.on('vc_request', (d) => {
      setOpponentOnline(true);
      setVcRequester(d.playerName);
      setVcState('incoming');
    });

    // vc_accepted fires on User A (the requester) — they now fetch their token
    s.on('vc_accepted', async () => {
      setOpponentOnline(true);
      const ok = await initAgora();
      if (ok) {
        setVcState('active');
        toast.success('Video call connected!');
      }
    });

    s.on('vc_declined', () => { setVcState('idle'); toast('Video call declined'); });

    s.on('vc_ended', () => {
      setVcState('idle');
      setVcReady(false);
      setAgoraToken(null);
      toast('Video call ended');
    });

    return () => s.close();
  
  // eslint-disable-next-line
  }, []); // intentionally empty — uses refs and stable initAgora

  // Heartbeat
  useEffect(() => {
    if (!socket) return;
    const hb = setInterval(() => {
      if (socket?.connected) socket.emit('heartbeat', { timestamp: Date.now() });
    }, 10000);
    return () => clearInterval(hb);
  }, [socket]);

  // Search countdown
  useEffect(() => {
    if (battleState !== 'searching') return;
    setSearchCountdown(30);
    setSearchTimedOut(false);
    const iv = setInterval(() => setSearchCountdown(p => {
      if (p <= 1) { clearInterval(iv); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [battleState]);

  // Per-question timer
  useEffect(() => {
    if (battleState === 'playing' && questions.length > 0 && timeLeft > 0 && selectedAnswer === null) {
      const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(t);
    } else if (battleState === 'playing' && questions.length > 0 && timeLeft === 0 && selectedAnswer === null) {
      handleAnswerSelect(-1);
    }
 
  // eslint-disable-next-line
  }, [timeLeft, battleState, selectedAnswer, questions.length]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, opponentTyping]);

  // Keep rematch countdown fresh for modal and passive badge modes.
  useEffect(() => {
    const hasModalRequest = rematchState === 'requested';
    const hasPassiveRequest = !!passiveRematchRequest;
    if (!hasModalRequest && !hasPassiveRequest) return undefined;

    const tick = () => {
      const msLeft = hasPassiveRequest
        ? Math.max(0, passiveRematchRequest.expiresAt - Date.now())
        : null;
      const nextCount = hasPassiveRequest
        ? Math.ceil(msLeft / 1000)
        : null;

      if (hasPassiveRequest && nextCount <= 0) {
        setPassiveRematchRequest(null);
        setRematchCountdown(0);
        return;
      }

      setRematchCountdown((prev) => {
        if (hasPassiveRequest) return nextCount;
        return Math.max(0, prev - 1);
      });
    };

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rematchState, passiveRematchRequest]);

  // ── Phone-style vibration during ringing (1v1 video-call request) ──
  // Pattern: 400ms vibrate, 200ms pause, repeat. Stops as soon as the call
  // is accepted, declined, or cancelled.
  useEffect(() => {
    if (!('vibrate' in navigator)) return undefined;
    const ringing = vcState === 'incoming' || vcState === 'requesting';
    if (!ringing) {
      navigator.vibrate(0);
      return undefined;
    }
    // Initial pulse
    navigator.vibrate([400, 200, 400, 200, 400]);
    const interval = setInterval(() => {
      navigator.vibrate([400, 200, 400, 200, 400]);
    }, 1600);
    return () => {
      clearInterval(interval);
      navigator.vibrate(0);
    };
  }, [vcState]);

  // ── Initialise PIP at top-right corner in MINI mode when call goes active ──
  // Default to the small bubble so the quiz remains fully usable from the
  // moment the call connects. Users tap the bubble to expand to pip.
  useEffect(() => {
    if (vcState !== 'active') return;
    const { w } = vcDims.mini;
    const margin = 12;
    setVcPos({
      x: Math.max(margin, window.innerWidth - w - margin),
      y: 100,   // sits below the quiz toolbar
    });
    setVcSize('mini');
  }, [vcState, vcDims]);

  // ── Drag handlers (mouse + touch). WhatsApp-style snap-to-edge on release.
  //    Distinguishes a quick tap from a drag using a 5px movement threshold so
  //    tapping the mini bubble cleanly expands it without triggering drag. ──
  const wasDragRef = useRef(false);

  const onDragStart = useCallback((e) => {
    if (vcSizeRef.current === 'full') return;        // no drag in fullscreen
    if (e.target.closest?.('[data-vc-control]')) return;  // ignore clicks on toggle buttons
    const point = e.touches ? e.touches[0] : e;
    dragStateRef.current = {
      dragging: false,        // becomes true after movement threshold
      moved: false,
      startX: point.clientX,
      startY: point.clientY,
      posX: vcPosRef.current.x,
      posY: vcPosRef.current.y,
    };
    // No preventDefault — `touchAction: 'none'` on the overlay handles
    // scroll/zoom suppression. Skipping preventDefault preserves the
    // synthetic click event so tapping the mini bubble can expand it.
  }, []);

  const onDragMove = useCallback((e) => {
    const ds = dragStateRef.current;
    if (!ds || !ds.startX) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - ds.startX;
    const dy = point.clientY - ds.startY;
    if (!ds.dragging && Math.hypot(dx, dy) > 5) {
      ds.dragging = true;
      ds.moved = true;
      setIsDragging(true);
    }
    if (!ds.dragging) return;
    const { w, h } = vcDims[vcSizeRef.current] || vcDims.pip;
    const margin = 6;
    const nx = Math.max(margin, Math.min(window.innerWidth - w - margin, ds.posX + dx));
    const ny = Math.max(margin, Math.min(window.innerHeight - h - margin, ds.posY + dy));
    setVcPos({ x: nx, y: ny });
  }, [vcDims]);

  const onDragEnd = useCallback(() => {
    const ds = dragStateRef.current;
    if (!ds) return;
    if (ds.dragging) {
      setIsDragging(false);
      wasDragRef.current = true;   // suppress the next synthetic click
      // Snap to nearest horizontal edge (WhatsApp/Instagram behaviour)
      const { w, h } = vcDims[vcSizeRef.current] || vcDims.pip;
      const margin = 12;
      setVcPos((p) => {
        const cx = p.x + w / 2;
        const x = cx < window.innerWidth / 2 ? margin : window.innerWidth - w - margin;
        const y = Math.max(margin, Math.min(window.innerHeight - h - margin, p.y));
        return { x, y };
      });
    }
    dragStateRef.current = { dragging: false, moved: false, startX: 0, startY: 0, posX: 0, posY: 0 };
  }, [vcDims]);

  // Tap (not drag) on the overlay → expand mini bubble to pip
  const onOverlayClick = useCallback((e) => {
    if (wasDragRef.current) { wasDragRef.current = false; return; }
    if (e.target.closest?.('[data-vc-control]')) return;
    if (vcSizeRef.current === 'mini') setVcSize('pip');
  }, []);

  // Attach global drag listeners while call is active
  useEffect(() => {
    if (vcState !== 'active') return undefined;
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
    window.addEventListener('touchcancel', onDragEnd);
    return () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchmove', onDragMove);
      window.removeEventListener('touchend', onDragEnd);
      window.removeEventListener('touchcancel', onDragEnd);
    };
  }, [vcState, onDragMove, onDragEnd]);

  // End VC when battle finishes
  useEffect(() => {
    if (battleState === 'results' && vcState === 'active') {
      const s = socketRef.current;
      if (s && roomIdRef.current) s.emit('vc_ended', { roomId: roomIdRef.current, playerName: playerNameRef.current });
      setVcState('idle');
      setVcReady(false);
      setAgoraToken(null);
    }
  }, [battleState, vcState]);

  const startMatchmaking = () => {
    if (!playerName.trim()) return;
    socket.emit('find-match', { playerName, exam: examId, subject, topic });
    setBattleState('searching');
  };

  const cancelMatchmaking = () => {
    socket.emit('cancel-match');
    setBattleState('setup');
  };

  const handleBattleBack = () => {
    if (battleState === 'playing' && roomIdRef.current && socket) {
      socket.emit('battle-quit', {
        roomId: roomIdRef.current,
        playerName,
        reason: 'manual-back',
      });
    }
    navigate(-1);
  };

  const handleAnswerSelect = (index) => {
    if (selectedAnswer !== null) return;
    const q = questions[currentQuestionIndex];
    if (!q) return;
    setSelectedAnswer(index);
    const raw = q.correctAnswer || q.correct_answer;
    let ci;
    if (typeof raw === 'string' && /^[A-Da-d]$/.test(raw)) ci = raw.toUpperCase().charCodeAt(0) - 65;
    else if (typeof raw === 'number') ci = raw;
    else ci = parseInt(raw) || 0;

    // ── Scoring (unified equation, see SCORE / calcQuestionScore at top) ──
    const isSkipped = index === -1;            // timer ran out, no answer chosen
    const isCorrect = !isSkipped && index === ci;
    const outcome = isSkipped ? 'skipped' : isCorrect ? 'correct' : 'wrong';
    const pts = calcQuestionScore({ outcome, timeLeft });
    // Track outcome tally for the results breakdown
    const timeBonusEarned = outcome === 'correct'
      ? Math.round((SCORE.TIME_BONUS_MAX * Math.max(0, Math.min(SCORE.TIME_LIMIT, timeLeft))) / SCORE.TIME_LIMIT)
      : 0;
    setTally(t => ({
      correct: t.correct + (outcome === 'correct' ? 1 : 0),
      wrong: t.wrong + (outcome === 'wrong' ? 1 : 0),
      skipped: t.skipped + (outcome === 'skipped' ? 1 : 0),
      timeBonus: t.timeBonus + timeBonusEarned,
    }));

    setAnswerResult({ isCorrect, correctAnswer: ci, points: pts, outcome });
    // Always apply pts (positive for correct, negative for wrong, 0 for skipped).
    // Clamp running score to [0, max] so the user never sees a negative total.
    const maxBattleScore = (questions.length || 10) * SCORE.MAX_PER_QUESTION;
    const newScore = Math.max(0, Math.min(maxBattleScore, myScore + pts));

    setMyScore(newScore);

    if (socket && roomIdRef.current) {
      socket.emit('battle-answer', {
        roomId: roomIdRef.current,
        questionIndex: currentQuestionIndex,
        answer: index,
        isCorrect,
        outcome,
        score: newScore,
        timeTaken: SCORE.TIME_LIMIT - timeLeft,
      });
    }
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(p => p + 1);
        setSelectedAnswer(null);
        setAnswerResult(null);
        setOpponentAnswer(null);
        setTimeLeft(SCORE.TIME_LIMIT);
      } else {
        if (socket && roomIdRef.current) {
          socket.emit('battle-complete', {
            roomId: roomIdRef.current,
            playerName,
            finalScore: newScore,
            userId: user?.id || user?.user_id,
            totalQuestions: questions.length,
            exam: examId,
            subject,
          });
        }
        setBattleState('results');
      }
    }, 2000);
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim() && socket && roomIdRef.current) {
      socket.emit('battle-chat', { roomId: roomIdRef.current, playerName, message: chatInput });
      setChatMessages(p => [...p, { playerName, message: chatInput, ts: Date.now() }]);
      setChatInput('');
      // Stop typing immediately after send
      socket.emit('battle-chat-typing', { roomId: roomIdRef.current, isTyping: false });
    }
  };

  // Send a quick-reply chip directly (bypass input field)
  const sendQuickReply = (text) => {
    if (!socket || !roomIdRef.current || !text) return;
    socket.emit('battle-chat', { roomId: roomIdRef.current, playerName, message: text });
    setChatMessages(p => [...p, { playerName, message: text, ts: Date.now() }]);
  };

  // Typing indicator emitter — debounced; sends `isTyping: false` after 1.4s of silence
  const handleChatInputChange = (e) => {
    const v = e.target.value;
    setChatInput(v);
    if (!socket || !roomIdRef.current) return;
    if (v) {
      socket.emit('battle-chat-typing', { roomId: roomIdRef.current, isTyping: true });
      clearTimeout(typingEmitRef.current);
      typingEmitRef.current = setTimeout(() => {
        socket.emit('battle-chat-typing', { roomId: roomIdRef.current, isTyping: false });
      }, 1400);
    } else {
      clearTimeout(typingEmitRef.current);
      socket.emit('battle-chat-typing', { roomId: roomIdRef.current, isTyping: false });
    }
  };

  const handleViewProfile = () => {
    const target = opponent?.username || opponent?.userId;
    if (!target) {
      toast.error('Opponent profile is unavailable');
      return;
    }
    openProfileNewTab(target);
  };

  const handleMuteNotifications = () => {
    setNotificationsMuted((prev) => {
      const next = !prev;
      toast.success(next ? 'Notifications muted' : 'Notifications unmuted');
      return next;
    });
  };

  const handleReportPlayer = () => {
    setShowReport(true);
  };

  const requestRematch = () => {
    if (!socket || !roomIdRef.current) return;
    socket.emit('rematch-request', {
      roomId: roomIdRef.current,
      requesterUserId: user?.id || user?.user_id,
      requesterName: playerName,
    });
    setRematchState('pending');
  };

  const acceptRematch = (overrideRoomId) => {
    const targetRoomId = overrideRoomId || roomIdRef.current;
    if (!socket || !targetRoomId) return;
    socket.emit('rematch-accept', { roomId: targetRoomId });
    setRematchState('idle');
    setRematchRequesterName('');
    setPassiveRematchRequest(null);
  };

  const declineRematch = (overrideRoomId) => {
    const targetRoomId = overrideRoomId || roomIdRef.current;
    if (!socket || !targetRoomId) return;
    socket.emit('rematch-decline', { roomId: targetRoomId });
    setRematchState('idle');
    setRematchRequesterName('');
    setPassiveRematchRequest(null);
  };

  const handlePlayAgainFromResults = () => {
    requestRematch();
  };

  const handleFindNewOpponentFromResults = () => {
    if (!socket) {
      toast.error('Connection issue. Please try again in a moment.');
      return;
    }

    // Reset battle-specific UI state and jump directly into matchmaking
    // without a full app reload.
    setResultNotice(null);
    setLiveNotice(null);
    setOpponentFinishedQuiz(false);
    setOpponentTyping(false);
    setOpponentOnline(false);
    setOpponent(null);
    setRoomId(null);
    roomIdRef.current = null;
    setRematchState('idle');
    setRematchRequesterName('');
    setRematchCountdown(30);
    setPassiveRematchRequest(null);

    startMatchmaking();
  };

  // Always open profile in a NEW TAB so the live battle isn't disrupted
  const openProfileNewTab = (target) => {
    if (!target) return;
    window.open(`/profile/${target}`, '_blank', 'noopener,noreferrer');
  };

  const requestVC = () => {
    if (!socket || !roomIdRef.current) return;
    socket.emit('vc_request', { roomId: roomIdRef.current, playerName });
    setVcState('requesting');
  };

  // acceptVC: User B fetches their own token, then emits accepted so User A gets vc_accepted
  const acceptVC = async () => {
    if (!socket || !roomIdRef.current) return;
    const ok = await initAgora();
    if (!ok) {
      socket.emit('vc_declined', { roomId: roomIdRef.current, playerName });
      setVcState('idle');
      return;
    }
    socket.emit('vc_accepted', { roomId: roomIdRef.current, playerName });
    setVcState('active');
  };

  const declineVC = () => {
    if (!socket || !roomIdRef.current) return;
    socket.emit('vc_declined', { roomId: roomIdRef.current, playerName });
    setVcState('idle');
  };

  const endVC = useCallback(() => {
    if (socket && roomIdRef.current) socket.emit('vc_ended', { roomId: roomIdRef.current, playerName });
    // Delay state cleanup to let AgoraUIKit finish its own teardown
    setTimeout(() => {
      setVcState('idle');
      setVcReady(false);
      setAgoraToken(null);
    }, 500);
  }, [socket, playerName]);

  const submitReport = async () => {
    if (!reportReason) return;
    setReportSubmitting(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/battles/report`,
        {
          battle_id: roomIdRef.current || 'unknown',
          room_id: roomIdRef.current || 'unknown',
          reported_user_id: opponent?.userId || opponent?.socketId || 'unknown',
          reported_username: opponent?.playerName || opponent?.username || 'Opponent',
          reason: reportReason,
          description: reportDesc,
          // Pass last 50 chat messages as evidence so the admin team can review
          chat_messages: chatMessages.slice(-50).map(m => ({
            sender: m.playerName,
            text: m.message,
            ts: m.ts,
          })),
        },
        { withCredentials: true }
      );
      setReportDone(true);
      toast.success('Report submitted. Our team will review it shortly.');
    } catch (err) {
      console.error('[REPORT] submit failed:', err?.response?.status, err?.response?.data || err?.message);
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 401) {
        toast.error('Please log in again to submit a report.');
      } else if (status === 400) {
        toast.error(typeof detail === 'string' ? detail : 'Invalid report — please pick a reason.');
      } else if (status === 500) {
        toast.error('Server error while submitting report. Please retry in a moment.');
      } else {
        toast.error('Failed to submit report. Please check your connection.');
      }
    } finally {
      setReportSubmitting(false);
    }
  };

  const isUserAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;

  // Derive sanitized channel name (stable ref-based)
  const sanitizedChannel = roomIdRef.current?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 64) || '';
  const resolvedAgoraAppId = agoraAppId || AGORA_APP_ID;

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
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6">
            <p className="text-amber-600 text-sm mb-2">Time remaining:</p>
            <p className="text-4xl font-bold text-amber-600 font-mono">{fmt(parentsModeTimeRemaining)}</p>
          </div>
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
        <Header isLoggedIn={isUserAuth} user={user} />
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
            {searchTimedOut && (
              <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-center">
                <p className="font-bold mb-1">No opponent found</p>
                <p className="text-sm">Try again or pick a different subject!</p>
              </div>
            )}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Battle Name</label>
                <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Enter your name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none font-medium" data-testid="player-name-input" />
              </div>
              <div className="rounded-xl p-4 border-l-4" style={{ background: C.redLight, borderColor: C.red }}>
                <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: C.red }}><Swords className="w-5 h-5" /> Battle Rules</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>Real-time 1v1 quiz duel</li>
                  <li>10 questions, 30 seconds each</li>
                  <li>Faster answers = More points</li>
                  <li>Optional video call with opponent</li>
                </ul>
              </div>
              <button onClick={startMatchmaking} disabled={!playerName.trim()}
                className="w-full text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: C.red }} data-testid="find-opponent-btn">
                <Swords className="w-5 h-5" /> {searchTimedOut ? 'Try Again' : 'Find Opponent'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━ SEARCHING ━━━━━━━━━━━━━━━━━━━━
  if (battleState === 'searching') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: C.cream }}>
        <Header isLoggedIn={isUserAuth} user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm mx-auto px-4">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto" style={{ background: C.red }}><Swords className="w-14 h-14 text-white" /></div>
              <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full border-4 animate-ping opacity-20" style={{ borderColor: C.red }} />
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-black" style={{ color: C.red }} data-testid="search-countdown">{searchCountdown}</span>
              </div>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Finding Opponent</h2>
            <p className="text-gray-500 text-sm mb-1">{decodeURIComponent(examId)} — matching across all topics</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6 mt-4 overflow-hidden">
              <div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(searchCountdown / 30) * 100}%`, background: C.red }} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.red }} />
              <span className="text-gray-500 text-sm">{searchCountdown > 20 ? 'Searching...' : searchCountdown > 10 ? 'Still looking...' : 'Expanding search...'}</span>
            </div>
            <button onClick={cancelMatchmaking} className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-300" data-testid="cancel-search-btn">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━ MATCHED ━━━━━━━━━━━━━━━━━━━━
  if (battleState === 'matched') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: C.cream }}>
        <Header isLoggedIn={isUserAuth} user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-6">Match Found!</h2>
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2" style={{ background: C.red }}>{playerName.charAt(0).toUpperCase()}</div>
                <p className="font-semibold text-gray-900">{playerName}</p>
              </div>
              <div className="text-4xl font-black" style={{ color: C.red }}>VS</div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2" style={{ background: C.blue }}>{opponent?.playerName?.charAt(0).toUpperCase() || '?'}</div>
                <p className="font-semibold text-gray-900">{opponent?.playerName || 'Opponent'}</p>
              </div>
            </div>
            <p className="text-gray-400 animate-pulse">Starting battle...</p>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━ PLAYING ━━━━━━━━━━━━━━━━━━━━
  if (battleState === 'playing' && questions.length > 0) {
    return (
      <div className="min-h-screen" style={{ background: C.cream }}>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: C.red }} /></div>}>
          <QuizView
            isUserAuth={isUserAuth}
            user={user}
            C={C}
            playerName={playerName}
            timeLeft={timeLeft}
            handleBattleBack={handleBattleBack}
            setMobileChatOpen={setMobileChatOpen}
            chatMessages={chatMessages}
            setChatMenuOpen={setChatMenuOpen}
            chatMenuOpen={chatMenuOpen}
            handleViewProfile={handleViewProfile}
            opponent={opponent}
            handleMuteNotifications={handleMuteNotifications}
            notificationsMuted={notificationsMuted}
            handleReportPlayer={handleReportPlayer}
            liveNotice={liveNotice}
            currentQuestionIndex={currentQuestionIndex}
            questions={questions}
            subject={subject}
            selectedAnswer={selectedAnswer}
            opponentAnswer={opponentAnswer}
            answerResult={answerResult}
            handleAnswerSelect={handleAnswerSelect}
            mobileChatOpen={mobileChatOpen}
            openProfileNewTab={openProfileNewTab}
            battleState={battleState}
            opponentFinishedQuiz={opponentFinishedQuiz}
            opponentOnline={opponentOnline}
            requestVC={requestVC}
            opponentTyping={opponentTyping}
            chatEndRef={chatEndRef}
            sendQuickReply={sendQuickReply}
            sendChat={sendChat}
            chatInput={chatInput}
            handleChatInputChange={handleChatInputChange}
            setChatInput={setChatInput}
            displayMyScore={displayMyScore}
            displayOpponentScore={displayOpponentScore}
            opponentQuestionIndex={opponentQuestionIndex}
            scorePulse={scorePulse}
            scoreDeltas={scoreDeltas}
            isPlayerMe={isPlayerMe}
            isReconnecting={isReconnecting}
            topic={topic}
            examId={examId}
            navigate={navigate}
            myScore={myScore}
            opponentScore={opponentScore}
            vcState={vcState}
            setShowReport={setShowReport}
          />
          <BattleVideoOverlay
            vcState={vcState}
            vcReady={vcReady}
            vcSize={vcSize}
            setVcSize={setVcSize}
            vcPos={vcPos}
            vcDims={vcDims}
            onDragStart={onDragStart}
            onOverlayClick={onOverlayClick}
            isDragging={isDragging}
            agoraAppId={resolvedAgoraAppId}
            AGORA_APP_ID={AGORA_APP_ID}
            sanitizedChannel={sanitizedChannel}
            agoraToken={agoraToken}
            agoraUid={agoraUid}
            endVC={endVC}
            vcRequester={vcRequester}
            declineVC={declineVC}
            acceptVC={acceptVC}
            C={C}
          />
          <BattleReportModal
            showReport={showReport}
            reportDone={reportDone}
            setShowReport={setShowReport}
            setReportDone={setReportDone}
            setReportReason={setReportReason}
            setReportDesc={setReportDesc}
            reportReason={reportReason}
            REPORT_REASONS={REPORT_REASONS}
            reportDesc={reportDesc}
            submitReport={submitReport}
            reportSubmitting={reportSubmitting}
            C={C}
          />
        </Suspense>
      </div>
    );
  }
  // ━━━━━━━━━━━━━━━━━━━━ RESULTS ━━━━━━━━━━━━━━━━━━━━
  if (battleState === 'results') {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: C.red }} /></div>}>
        <BattleResultScreen
          playerName={playerName}
          opponent={opponent}
          myScore={myScore}
          opponentScore={opponentScore}
          questions={questions}
          examId={examId}
          subject={subject}
          tally={tally}
          rematchState={rematchState}
          rematchRequesterName={rematchRequesterName}
          rematchCountdown={rematchCountdown}
          rematchMuteBehavior={rematchMuteBehavior}
          setRematchMuteBehavior={setRematchMuteBehavior}
          notificationsMuted={notificationsMuted}
          passiveRematchRequest={passiveRematchRequest}
          requestRematch={requestRematch}
          acceptRematch={acceptRematch}
          declineRematch={declineRematch}
          onPlayAgain={handlePlayAgainFromResults}
          onFindNewOpponent={handleFindNewOpponentFromResults}
          navigate={navigate}
          openProfileNewTab={openProfileNewTab}
          isUserAuth={isUserAuth}
          user={user}
          SCORE={SCORE}
          resultNotice={resultNotice}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.cream }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.red }} />
    </div>
  );
};

export default Matchmaking1v1;
