import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, Clock, Send, MessageCircle, Swords, Loader2, Shield, Phone, Flag, X, AlertTriangle, Maximize2, Minimize2, GripHorizontal } from 'lucide-react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import io from 'socket.io-client';
import axios from 'axios';
import MathText from '../components/MathText';
import { useAuth } from '../context/AuthContext';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import Header from '../components/Header';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
// ── ZegoCloud Video Call (Feb 24, 2026) ──
// Replaced AgoraUIKit with ZegoUIKitPrebuilt. Auth uses App ID + Server
// Secret (kit-token-for-test, generated in-browser). Acceptable for testing
// per Zego docs; for prod, move token generation to backend.
const ZEGO_APP_ID = parseInt(process.env.REACT_APP_ZEGO_APP_ID || '0', 10);
const ZEGO_SERVER_SECRET = process.env.REACT_APP_ZEGO_SERVER_SECRET || '';

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
const StableZegoVideo = memo(({ channel, userId, userName, onEnd, compact = false }) => {
  const containerRef = useRef(null);
  const zpRef = useRef(null);
  const initRef = useRef(false);
  const onEndRef = useRef(onEnd);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  // ── Local UI state ──
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  // Whisper-style call duration timer (starts when remote joins).
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

  // ── Zego lifecycle: join on mount, leave on unmount ──
  // The container ref must be set before joinRoom() runs. The init-guard ref
  // prevents double-mount in React StrictMode dev from creating two clients.
  useEffect(() => {
    if (initRef.current) return undefined;
    if (!containerRef.current) return undefined;
    if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET) {
      console.error('[Zego] Missing REACT_APP_ZEGO_APP_ID or REACT_APP_ZEGO_SERVER_SECRET');
      try { toast.error('Video call config missing.'); } catch (_) { /* ignore */ }
      if (onEndRef.current) onEndRef.current();
      return undefined;
    }
    initRef.current = true;

    let cancelled = false;
    const start = async () => {
      try {
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          ZEGO_APP_ID,
          ZEGO_SERVER_SECRET,
          channel,
          String(userId || `u_${Date.now()}`),
          userName || 'Player',
        );
        if (cancelled) return;
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;
        await zp.joinRoom({
          container: containerRef.current,
          scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
          // Skip Zego's pre-join camera/mic test — quiz flow already handled it.
          showPreJoinView: false,
          showLeavingView: false,
          showRoomTimer: false,           // we render our own MM:SS pill
          showScreenSharingButton: false,
          showAudioVideoSettingsButton: !compact,
          showTextChat: false,            // quiz has its own chat
          showUserList: false,
          showRemoveUserButton: false,
          // Built-in mute / camera-off / end-call buttons stay visible.
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showLeavingView: false,
          turnOnCameraWhenJoining: true,
          turnOnMicrophoneWhenJoining: true,
          useSpeakerWhenJoining: true,
          // Remote-joined detection + clean teardown wiring.
          onUserJoin: (users) => {
            console.log('[Zego] user-joined:', users);
            if (Array.isArray(users) && users.length > 0) setRemoteJoined(true);
          },
          onUserLeave: (users) => {
            console.log('[Zego] user-left:', users);
            // After last remote leaves, return to Connecting placeholder.
            setRemoteJoined(false);
          },
          onLeaveRoom: () => {
            console.log('[Zego] onLeaveRoom');
            if (onEndRef.current) onEndRef.current();
          },
        });
        if (cancelled) {
          try { zp.destroy(); } catch (_) { /* ignore */ }
          zpRef.current = null;
        }
      } catch (err) {
        console.error('[Zego] joinRoom failed:', err);
        try { toast.error('Could not start video call.'); } catch (_) { /* ignore */ }
        if (onEndRef.current) onEndRef.current();
      }
    };
    start();

    return () => {
      cancelled = true;
      const zp = zpRef.current;
      zpRef.current = null;
      initRef.current = false;
      if (zp) {
        try { zp.destroy(); }
        catch (e) { console.warn('[Zego] destroy() failed:', e); }
      }
    };
    // Note: channel/userId/userName are stable for the lifetime of an active call,
    // so the empty-deps semantics are intentional. We avoid eslint-disable directives
    // here because the rule isn't configured in this CRA setup.
  }, [channel, userId, userName]);

  return (
    <div
      data-vc-stage
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', backgroundColor: '#0a0a0a' }}
    >
      {/* Force Zego's <video> elements to object-fit:cover so they fill the
          rounded floating overlay cleanly across iOS Safari + Android Chrome. */}
      <style>{`
        [data-vc-stage] video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
      `}</style>

      {/* Zego mounts its prebuilt UI here */}
      <div
        ref={containerRef}
        data-testid="zego-container"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

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
StableZegoVideo.displayName = 'StableZegoVideo';

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
  // Per-outcome tally for the results breakdown card
  const [tally, setTally] = useState({ correct: 0, wrong: 0, skipped: 0, timeBonus: 0 });

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const chatEndRef = useRef(null);

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

  // Refs so socket listeners always read live values (prevents stale closures)
  const roomIdRef = useRef(null);
  const playerNameRef = useRef('');
  const socketRef = useRef(null);

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

  // initAgora (kept name for minimal-diff; now wraps Zego setup) — Zego's
  // kit-token is generated client-side inside StableZegoVideo, so no backend
  // call is needed. We just validate the channel and flip vcReady so the
  // overlay mounts. Any actual Zego connection error bubbles up through
  // VideoErrorBoundary and the StableZegoVideo's own error handling.
  const initAgora = useCallback(async () => {
    const ch = roomIdRef.current?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
    if (!ch) {
      console.warn('[VC] initAgora: roomIdRef.current is empty, aborting');
      return;
    }
    if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET) {
      console.error('[VC] Missing REACT_APP_ZEGO_APP_ID / REACT_APP_ZEGO_SERVER_SECRET');
      toast.error('Video call config missing.');
      setVcState('idle');
      setVcReady(false);
      return;
    }
    console.log('[VC] Zego ready for channel:', ch);
    setVcReady(true);
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

    s.on('connect', () => console.log('[Socket] Connected to battle server'));

    s.on('waiting', (d) => { if (d.timeout) setSearchCountdown(d.timeout); });

    s.on('match-found', async (d) => {
      setSearchTimedOut(false);
      // Update both state AND ref immediately so any code below can use the ref
      setRoomId(d.roomId);
      roomIdRef.current = d.roomId;
      const opp = d.players.find(p => p.playerName !== playerNameRef.current);
      setOpponent(opp);
      setBattleState('matched');

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
      if (d.score !== undefined) setOpponentScore(d.score);
      setOpponentAnswer(d.answer);
    });
    s.on('opponent-score-update', (d) => setOpponentScore(d.score));
    s.on('chat-message', (d) => setChatMessages(prev => [...prev, { playerName: d.playerName, message: d.message, ts: Date.now() }]));
    s.on('opponent-disconnected', () => { toast.error('Opponent disconnected! You win.'); setBattleState('results'); });
    s.on('battle-ended', () => setBattleState('results'));

    // VC socket events
    s.on('vc_request', (d) => { setVcRequester(d.playerName); setVcState('incoming'); });

    // vc_accepted fires on User A (the requester) — they now fetch their token
    s.on('vc_accepted', async () => {
      await initAgora();
      setVcState('active');
      toast.success('Video call connected!');
    });

    s.on('vc_declined', () => { setVcState('idle'); toast('Video call declined'); });

    s.on('vc_ended', () => {
      setVcState('idle');
      setVcReady(false);
      setAgoraToken(null);
      toast('Video call ended');
    });

    return () => s.close();
  
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
 
  }, [timeLeft, battleState, selectedAnswer, questions.length]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

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
    }
  };

  const requestVC = () => {
    if (!socket || !roomIdRef.current) return;
    socket.emit('vc_request', { roomId: roomIdRef.current, playerName });
    setVcState('requesting');
  };

  // acceptVC: User B fetches their own token, then emits accepted so User A gets vc_accepted
  const acceptVC = async () => {
    if (!socket || !roomIdRef.current) return;
    socket.emit('vc_accepted', { roomId: roomIdRef.current, playerName });
    await initAgora();
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
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/admin/battles/report`,
        {
          battle_id: roomIdRef.current,
          room_id: roomIdRef.current,
          reported_user_id: opponent?.socketId || 'unknown',
          reported_username: opponent?.playerName || 'Opponent',
          reason: reportReason,
          description: reportDesc,
          chat_messages: [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReportDone(true);
    } catch {
      toast.error('Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const isUserAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;

  // Derive sanitized channel name (stable ref-based)
  const sanitizedChannel = roomIdRef.current?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 64) || '';

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
    const q = questions[currentQuestionIndex];
    if (!q) return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.cream }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.red }} />
      </div>
    );
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const oppName = opponent?.playerName || 'Opponent';

    return (
      <div className="min-h-screen" style={{ background: C.cream }}>

        {/* ── MOBILE LAYOUT ── */}
        <div className="md:hidden flex flex-col min-h-screen">
          <Header isLoggedIn={isUserAuth} user={user} />

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
              <span className="font-bold text-gray-900 text-sm">{playerName}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Chat toggle with unread badge */}
              <button onClick={() => setMobileChatOpen(o => !o)} className="relative p-1.5 rounded-lg bg-gray-100" data-testid="mobile-chat-toggle">
                <MessageCircle className="w-4 h-4 text-gray-600" />
                {chatMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] text-white flex items-center justify-center" style={{ background: C.red }}>
                    {chatMessages.length > 9 ? '9+' : chatMessages.length}
                  </span>
                )}
              </button>
              {vcState === 'idle' && (
                <button onClick={requestVC} className="p-1.5 rounded-lg text-white" style={{ background: C.blue }} data-testid="mobile-start-vc">
                  <Phone className="w-4 h-4" />
                </button>
              )}
              {vcState === 'requesting' && <span className="text-xs text-gray-400 animate-pulse">Calling...</span>}
              {vcState === 'active' && (
                <span className="text-xs font-semibold animate-pulse" style={{ color: C.blue }}>● Live</span>
              )}
              <button onClick={() => setShowReport(true)} className="p-1.5 rounded-lg bg-gray-100"><Flag className="w-3.5 h-3.5 text-gray-400" /></button>
              <div className="px-3 py-1 rounded-full text-white text-sm font-bold" style={{ background: timeLeft <= 10 ? C.red : '#888' }}>{timeLeft}s</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 mx-4 mt-2 rounded-full overflow-hidden" style={{ background: '#e0d8d0' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${C.red}, ${C.blue})` }} />
          </div>

          {/* Question area */}
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
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{ background: isCorrect ? '#22c55e' : isWrong ? C.red : isMine ? C.red : isOpp ? C.blue : '#e5e0db', color: (isCorrect || isWrong || isMine || isOpp) ? '#fff' : '#374151' }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="flex-1 font-medium text-gray-900 text-sm"><MathText text={txt} /></span>
                      {isCorrect && <span className="text-green-500 font-bold">✓</span>}
                      {isWrong && <span style={{ color: C.red }} className="font-bold">✗</span>}
                    </div>
                    {badge && !answerResult && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: isMine ? C.red : C.blue }}>{badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {answerResult && (
              <div className={`mt-4 p-3 rounded-xl border-2 ${
                answerResult.outcome === 'correct' ? 'bg-green-50 border-green-400' :
                answerResult.outcome === 'wrong' ? 'bg-red-50 border-red-400' :
                'bg-amber-50 border-amber-400'
              }`}>
                <p className={`font-bold text-sm ${
                  answerResult.outcome === 'correct' ? 'text-green-800' :
                  answerResult.outcome === 'wrong' ? 'text-red-800' :
                  'text-amber-800'
                }`}>
                  {answerResult.outcome === 'correct' && `✓ Correct! +${answerResult.points} pts`}
                  {answerResult.outcome === 'wrong' && `✗ Incorrect — ${answerResult.points} pts`}
                  {answerResult.outcome === 'skipped' && `⊘ Time's up — 0 pts`}
                </p>
              </div>
            )}
          </div>

          {/* Mobile chat drawer — above score bar */}
          {mobileChatOpen && (
            <div className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex flex-col" style={{ height: '240px' }}>
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" style={{ color: C.blue }} />
                  <span className="text-xs font-bold text-gray-700">Chat</span>
                </div>
                <button onClick={() => setMobileChatOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {chatMessages.length === 0
                  ? <p className="text-center text-gray-400 text-[10px] py-2">Say hi!</p>
                  : chatMessages.map((m, i) => (
                    <div key={i} className={`p-1.5 rounded-lg text-xs ${m.playerName === playerName ? 'ml-4 text-white' : 'mr-4 bg-gray-100 text-gray-800'}`}
                      style={m.playerName === playerName ? { background: C.red } : {}}>
                      <p className="opacity-70 text-[10px]">{m.playerName}</p>
                      <p>{m.message}</p>
                    </div>
                  ))
                }
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={sendChat} className="flex gap-1.5 p-2 border-t border-gray-100">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message..." maxLength={100}
                  className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none" />
                <button type="submit" disabled={!chatInput.trim()} className="p-1.5 text-white rounded-lg disabled:opacity-50" style={{ background: C.red }}>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Bottom score bar */}
          <div className="px-4 py-3 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: C.red }}>{playerName.split(' ')[0]}</span>
              <span className="text-lg font-black" style={{ color: C.red }}>{myScore} pts</span>
            </div>
            <span className="text-gray-400 font-bold text-xs">VS</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black" style={{ color: C.blue }}>{opponentScore} pts</span>
              <span className="font-bold text-sm" style={{ color: C.blue }}>{oppName.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* ── DESKTOP LAYOUT ── */}
        <div className="hidden md:block">
          <Header isLoggedIn={isUserAuth} user={user} />
          <div className="max-w-7xl mx-auto px-6 py-4">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: C.red }}>{playerName.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="font-bold text-gray-900">{playerName}</p>
                  <p className="text-xl font-black" style={{ color: C.red }}>{myScore} pts</p>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-black ${timeLeft <= 10 ? 'animate-pulse' : ''}`} style={{ color: timeLeft <= 10 ? C.red : '#374151' }}>{timeLeft}s</div>
                <p className="text-gray-400 text-sm">Q{currentQuestionIndex + 1}/{questions.length}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-gray-900">{oppName}</p>
                  <p className="text-xl font-black" style={{ color: C.blue }}>{opponentScore} pts</p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: C.blue }}>{oppName.charAt(0).toUpperCase()}</div>
              </div>
            </div>

            {/* Progress */}
            <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: '#e0d8d0' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${C.red}, ${C.blue})` }} />
            </div>

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
                    if (answerResult) {
                      if (isCorrect) { border = '#22c55e'; bg = '#f0fdf4'; }
                      else if (isWrong) { border = C.red; bg = C.redLight; }
                    } else if (isMine) { border = C.red; bg = C.redLight; badge = 'You'; }
                    if (isOpp && !answerResult) { border = C.blue; bg = C.blueLight; badge = oppName; }
                    return (
                      <button key={i} onClick={() => handleAnswerSelect(i)} disabled={selectedAnswer !== null}
                        className="text-left p-4 rounded-xl border-2 transition-all hover:shadow-md relative" style={{ borderColor: border, background: bg }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                            style={{ background: isCorrect ? '#22c55e' : isWrong ? C.red : isMine ? C.red : isOpp ? C.blue : '#e5e0db', color: (isCorrect || isWrong || isMine || isOpp) ? '#fff' : '#374151' }}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className="flex-1 font-medium text-gray-900"><MathText text={txt} /></span>
                          {isCorrect && <span className="text-green-500 font-bold text-xl">✓</span>}
                          {isWrong && <span style={{ color: C.red }} className="font-bold text-xl">✗</span>}
                        </div>
                        {badge && !answerResult && (
                          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: isMine ? C.red : C.blue }}>{badge}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {answerResult && (
                  <div className={`mt-4 p-4 rounded-xl border-2 ${
                    answerResult.outcome === 'correct' ? 'bg-green-50 border-green-400' :
                    answerResult.outcome === 'wrong' ? 'bg-red-50 border-red-400' :
                    'bg-amber-50 border-amber-400'
                  }`}>
                    <p className={`font-bold ${
                      answerResult.outcome === 'correct' ? 'text-green-800' :
                      answerResult.outcome === 'wrong' ? 'text-red-800' :
                      'text-amber-800'
                    }`}>
                      {answerResult.outcome === 'correct' && `✓ Correct! +${answerResult.points} pts`}
                      {answerResult.outcome === 'wrong' && `✗ Incorrect — ${answerResult.points} pts`}
                      {answerResult.outcome === 'skipped' && `⊘ Time's up — 0 pts`}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-3">
                {/* Opponent card */}
                <div className="rounded-2xl p-4 text-center" style={{ background: C.pink }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2" style={{ background: C.blue }}>{oppName.charAt(0).toUpperCase()}</div>
                  <p className="font-bold text-gray-900 text-sm">{oppName}</p>
                  <p className="text-xs text-gray-500">{decodeURIComponent(examId)}</p>
                </div>

                {/* VC controls */}
                <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-2">
                  {vcState === 'idle' && (
                    <button onClick={requestVC} className="w-full py-2 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ background: C.blue }} data-testid="desktop-start-vc">
                      <Phone className="w-4 h-4" /> Start Video Call
                    </button>
                  )}
                  {vcState === 'requesting' && <div className="text-center py-2 text-sm text-gray-500 animate-pulse">Ringing opponent...</div>}
                  {vcState === 'active' && (
                    <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold" style={{ color: C.blue }}>
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.blue }} />
                      Live — use video controls below
                    </div>
                  )}
                  <button onClick={() => setShowReport(true)} className="w-full py-1.5 rounded-lg text-xs text-gray-400 hover:text-red-500 flex items-center justify-center gap-1">
                    <Flag className="w-3 h-3" /> Report
                  </button>
                </div>

                {/* Battle info */}
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Battle Info</p>
                  <p className="text-xs text-gray-600">{decodeURIComponent(examId)}</p>
                  <p className="text-xs text-gray-600">{decodeURIComponent(subject)}</p>
                  <p className="text-xs text-gray-500 mt-1">Q{currentQuestionIndex + 1}/{questions.length} • {timeLeft}s left</p>
                </div>

                {/* Desktop chat */}
                <div className="bg-white rounded-xl border border-gray-100 flex flex-col" style={{ height: '220px' }}>
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" style={{ color: C.blue }} />
                    <span className="text-xs font-bold text-gray-700">Chat</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {chatMessages.length === 0
                      ? <p className="text-center text-gray-400 text-[10px] py-2">Say hi!</p>
                      : chatMessages.map((m, i) => (
                        <div key={i} className={`p-1.5 rounded-lg text-xs ${m.playerName === playerName ? 'ml-4 text-white' : 'mr-4 bg-gray-100 text-gray-800'}`}
                          style={m.playerName === playerName ? { background: C.red } : {}}>
                          <p className="opacity-70 text-[10px]">{m.playerName}</p>
                          <p>{m.message}</p>
                        </div>
                      ))
                    }
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={sendChat} className="flex gap-1.5 p-2 border-t border-gray-100">
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message..." maxLength={100}
                      className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none" />
                    <button type="submit" disabled={!chatInput.trim()} className="p-1.5 text-white rounded-lg disabled:opacity-50" style={{ background: C.red }}>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FLOATING VIDEO CALL OVERLAY ──
            WhatsApp / Instagram-style draggable PIP with three modes:
              • mini  — small bubble (130×180), no Agora controls, double-tap or
                        maximize button to expand. Draggable.
              • pip   — medium card (300×420), Agora controls visible. Draggable,
                        snaps to nearest edge on release.
              • full  — fullscreen takeover; Agora controls visible; drag disabled.
            The Flag/Report button on the quiz toolbar handles abuse reporting;
            the call ends via Agora's built-in end-call button. */}
        {vcState === 'active' && vcReady && (() => {
          const isFull = vcSize === 'full';
          const isMini = vcSize === 'mini';
          const dims = isFull
            ? { left: 0, top: 0, width: '100vw', height: '100vh', borderRadius: 0 }
            : isMini
              ? { left: vcPos.x, top: vcPos.y, width: vcDims.mini.w, height: vcDims.mini.h, borderRadius: 22 }
              : { left: vcPos.x, top: vcPos.y, width: vcDims.pip.w, height: vcDims.pip.h, borderRadius: 18 };
          return (
            <div
              data-testid="vc-pip"
              data-vc-size={vcSize}
              onMouseDown={!isFull ? onDragStart : undefined}
              onTouchStart={!isFull ? onDragStart : undefined}
              onClick={onOverlayClick}
              onDoubleClick={() => setVcSize(isFull ? 'pip' : 'full')}
              style={{
                position: 'fixed',
                zIndex: 70,
                ...dims,
                overflow: 'hidden',
                border: isFull ? 'none' : '2px solid white',
                backgroundColor: '#111',
                boxShadow: isFull ? 'none' : '0 12px 48px rgba(0,0,0,0.5)',
                display: 'block',
                cursor: isFull ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                touchAction: isFull ? 'auto' : 'none',
                transition: isDragging ? 'none' : 'width 0.25s ease, height 0.25s ease, border-radius 0.25s ease, left 0.25s ease, top 0.25s ease',
                userSelect: 'none',
              }}
            >
              <VideoErrorBoundary onError={() => endVC()}>
                <StableZegoVideo
                  channel={sanitizedChannel}
                  userId={user?.id || user?.user_id || playerName}
                  userName={playerName || 'Player'}
                  onEnd={endVC}
                  compact={isMini}
                />
              </VideoErrorBoundary>

              {/* Top-left drag grip (visual handle, dragging works on whole card) */}
              {!isFull && !isMini && (
                <div
                  data-vc-control
                  style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', zIndex: 9, padding: '4px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', pointerEvents: 'none' }}
                >
                  <GripHorizontal size={14} color="#fff" style={{ opacity: 0.7 }} />
                </div>
              )}

              {/* Maximize / Minimize button — top-left, like WhatsApp.
                  Hidden in mini bubble (tap-to-expand handles that). */}
              {!isMini && (
                <button
                  data-vc-control
                  data-testid="vc-toggle-size"
                  onClick={(e) => { e.stopPropagation(); setVcSize(isFull ? 'pip' : 'full'); }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(6px)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 9,
                  }}
                >
                  {isFull ? <Minimize2 size={14} color="#fff" /> : <Maximize2 size={14} color="#fff" />}
                </button>
              )}

              {/* Collapse-to-bubble button — only in pip / full mode */}
              {!isMini && (
                <button
                  data-vc-control
                  data-testid="vc-toggle-mini"
                  onClick={(e) => { e.stopPropagation(); setVcSize('mini'); }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 46,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(6px)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 9,
                  }}
                  title="Collapse to bubble"
                >
                  <X size={14} color="#fff" />
                </button>
              )}

              {/* Mini bubble: pulsing live dot — Agora's mute/camera/end-call
                  controls render at the bottom of the bubble, so users always
                  have call controls without expanding. Tap empty area = expand. */}
              {isMini && (
                <div
                  data-vc-control
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: '#22c55e',
                    boxShadow: '0 0 0 0 rgba(34,197,94,0.7)',
                    animation: 'vcPulse 1.4s infinite',
                    zIndex: 9,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          );
        })()}

        {/* Pulse keyframes for mini bubble live indicator */}
        {vcState === 'active' && (
          <style>{`@keyframes vcPulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.7);} 70% { box-shadow: 0 0 0 8px rgba(34,197,94,0);} 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0);} }`}</style>
        )}

        {/* VC incoming request modal */}
        {vcState === 'incoming' && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse" style={{ background: C.blue }}>
                <Phone className="w-8 h-8 text-white" />
              </div>
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
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Report Submitted</h3>
                  <button onClick={() => { setShowReport(false); setReportDone(false); setReportReason(''); setReportDesc(''); }}
                    className="mt-4 px-6 py-2 rounded-xl text-white font-semibold" style={{ background: C.blue }}>Close</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /><h3 className="font-bold">Report User</h3></div>
                    <button onClick={() => setShowReport(false)}><X className="w-4 h-4" /></button>
                  </div>
                  <div className="p-4 space-y-2">
                    {REPORT_REASONS.map(r => (
                      <label key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${reportReason === r.id ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                        <input type="radio" name="rr" checked={reportReason === r.id} onChange={() => setReportReason(r.id)} />
                        <span className="text-sm font-medium">{r.label}</span>
                      </label>
                    ))}
                    <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Details..." rows={2} className="w-full p-3 border rounded-xl text-sm" />
                  </div>
                  <div className="p-4 border-t">
                    <button onClick={submitReport} disabled={!reportReason || reportSubmitting} className="w-full py-2.5 bg-red-500 text-white rounded-xl font-medium disabled:opacity-50">
                      {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
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
      <div className="min-h-screen" style={{ background: C.cream }}>
        <Header isLoggedIn={isUserAuth} user={user} />
        <div className="flex items-center justify-center p-4 py-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className={`py-8 px-6 text-center ${isWinner ? 'bg-gradient-to-br from-amber-400 to-orange-500' : isTie ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 'bg-gradient-to-br from-gray-400 to-gray-600'}`}>
                {isWinner && (
                  <div className="w-24 h-24 mx-auto mb-2">
                    <DotLottiePlayer src="https://assets-v2.lottiefiles.com/a/745fc364-117b-11ee-b7ec-9f18a8a356e0/ctpFpJP75f.lottie" loop autoplay style={{ width: '100%', height: '100%' }} />
                  </div>
                )}
                {!isWinner && (
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                )}
                <h1 className="text-4xl font-black text-white mb-1">{isWinner ? 'Victory!' : isTie ? 'Draw!' : 'Defeat'}</h1>
                <p className="text-white/80">{isWinner ? 'You dominated!' : isTie ? 'A worthy match!' : 'Better luck next time!'}</p>
              </div>

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

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div><p className="text-gray-400">Questions</p><p className="font-bold text-gray-900">{questions.length}</p></div>
                    <div><p className="text-gray-400">Exam</p><p className="font-bold text-gray-900">{decodeURIComponent(examId)}</p></div>
                    <div><p className="text-gray-400">Subject</p><p className="font-bold text-gray-900">{decodeURIComponent(subject)}</p></div>
                  </div>
                </div>

                {/* ── Score breakdown card (Feb 2026) ──
                    Shows the user how their points were earned per the unified
                    scoring equation: correct (50–100), wrong (-10), skipped (0). */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6" data-testid="score-breakdown">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Score Breakdown</p>
                    <p className="text-xs text-gray-400">out of {questions.length * SCORE.MAX_PER_QUESTION}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div className="rounded-lg bg-green-50 p-2">
                      <p className="text-green-700 font-bold text-lg" data-testid="tally-correct">{tally.correct}</p>
                      <p className="text-green-600">Correct</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-2">
                      <p className="text-red-700 font-bold text-lg" data-testid="tally-wrong">{tally.wrong}</p>
                      <p className="text-red-600">Wrong</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2">
                      <p className="text-amber-700 font-bold text-lg" data-testid="tally-skipped">{tally.skipped}</p>
                      <p className="text-amber-600">Skipped</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                    <span>⚡ Time bonus earned</span>
                    <span className="font-bold text-gray-700" data-testid="tally-time-bonus">+{tally.timeBonus} pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>📊 Accuracy</span>
                    <span className="font-bold text-gray-700">
                      {questions.length > 0 ? Math.round((tally.correct / questions.length) * 100) : 0}%
                    </span>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.cream }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.red }} />
    </div>
  );
};

export default Matchmaking1v1;
