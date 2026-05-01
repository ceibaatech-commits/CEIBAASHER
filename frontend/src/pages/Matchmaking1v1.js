import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, Clock, Send, MessageCircle, Swords, Loader2, Shield, Mic, MicOff, Video, VideoOff, Phone, PhoneOff, EyeOff, Eye, Flag, X, AlertTriangle, Minimize2, Maximize2 } from 'lucide-react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import io from 'socket.io-client';
import axios from 'axios';
import MathText from '../components/MathText';
import { useAuth } from '../context/AuthContext';
import AgoraUIKit from 'agora-react-uikit';
import Header from '../components/Header';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
const AGORA_APP_ID = 'f512a6c76b5a4e0abd193119f3ba22fe';

/* ── Stable Agora wrapper — Isolated from parent re-renders ── */
const StableAgoraVideo = memo(({ appId, channel, token, onEnd }) => {
  const rtcProps = useMemo(() => ({
    appId, 
    channel: channel || 'loading', 
    token: token || '', 
    role: 'host', 
    layout: 1 
  }), [appId, channel, token]);

  const callbacks = useMemo(() => ({ 
    EndCall: onEnd 
  }), [onEnd]);

  if (!token || !channel) return null;

  return <AgoraUIKit rtcProps={rtcProps} callbacks={callbacks} />;
});
StableAgoraVideo.displayName = 'StableAgoraVideo';

const C = {
  cream: '#F5F0EB', pink: '#F9D5C8', red: '#E8503A', blue: '#5B8FD4',
  redLight: '#FDE8E4', blueLight: '#E4EEF9', white: '#FFFFFF',
};

const Matchmaking1v1 = () => {
  const { examId, subject, topic } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [battleState, setBattleState] = useState('setup');
  const [playerName, setPlayerName] = useState('');
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [searchCountdown, setSearchCountdown] = useState(30);

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  // Video Call state
  const [vcState, setVcState] = useState('idle'); // idle | requesting | incoming | active
  const [agoraToken, setAgoraToken] = useState(null);
  const [vcReady, setVcReady] = useState(false);
  const [vcRequester, setVcRequester] = useState('');

  const roomIdRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  /**
   * 1. FIX: initAgora with isSubscribed guard + state clear
   */
  const initAgora = useCallback(async () => {
    let isSubscribed = true;
    const currentRoom = roomIdRef.current;
    const ch = currentRoom?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
    
    if (!ch) return;

    // Reset strictly before fetch
    setVcReady(false);
    setAgoraToken(null);

    try {
      const authToken = localStorage.getItem('token');
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const { data } = await axios.get(`${BACKEND_URL}/api/agora/token?channel=${ch}`, { headers });
      
      if (isSubscribed && data?.token) {
        setAgoraToken(data.token);
        // Small delay ensures the previous Agora instance is fully unmounted
        setTimeout(() => {
          if (isSubscribed) setVcReady(true);
        }, 200);
      }
    } catch (err) {
      if (isSubscribed) {
        console.error('[VC] Token fetch failed:', err);
        setVcState('idle');
        setVcReady(false);
      }
    }
    
    return () => { isSubscribed = false; };
  }, []);

  /**
   * 2. FIX: endVC with Status Check (Prevents Error Code 102)
   */
  const endVC = useCallback(() => {
    // If already idle, don't try to log out again
    if (vcState === 'idle') return;

    const s = socketRef.current;
    if (s && roomIdRef.current) {
      s.emit('vc_ended', { roomId: roomIdRef.current, playerName: user?.name || playerName });
    }

    setVcState('idle');
    setVcReady(false);
    setAgoraToken(null);
  }, [vcState, user?.name, playerName]);

  // Socket logic
  useEffect(() => {
    const s = io(BACKEND_URL, {
      path: '/api/battlews/socket.io',
      transports: ['websocket'],
    });
    setSocket(s);
    socketRef.current = s;

    s.on('vc_request', (d) => { setVcRequester(d.playerName); setVcState('incoming'); });
    s.on('vc_accepted', () => {
      initAgora();
      setVcState('active');
    });
    s.on('vc_ended', () => {
      setVcState('idle');
      setVcReady(false);
      setAgoraToken(null);
    });

    return () => s.close();
  }, [initAgora, user?.name]);

  // Sanitized channel name (Memoized to prevent per-second re-renders)
  const sanitizedChannel = useMemo(() => 
    roomId?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 64) || '', 
  [roomId]);

  return (
    <div className="min-h-screen">
      {/* ... Your existing Header and Quiz UI ... */}

      {/* 3. FIX: Only mount the Video component when vcReady is strictly true */}
      {vcState === 'active' && vcReady && agoraToken && (
        <div className="fixed bottom-4 right-4 z-[100] w-[320px] h-[240px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-gray-900">
          <StableAgoraVideo 
            appId={AGORA_APP_ID}
            channel={sanitizedChannel}
            token={agoraToken}
            onEnd={endVC}
          />
        </div>
      )}

      {/* Incoming Call UI */}
      {vcState === 'incoming' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 animate-bounce">
              <Video size={40} />
            </div>
            <h3 className="text-xl font-bold mb-1">{vcRequester}</h3>
            <p className="text-gray-500 mb-6">Inbound Video Call...</p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  socketRef.current.emit('vc_declined', { roomId: roomIdRef.current, playerName: user?.name || playerName });
                  setVcState('idle');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold"
              >
                Decline
              </button>
              <button 
                onClick={async () => {
                  socketRef.current.emit('vc_accepted', { roomId: roomIdRef.current, playerName: user?.name || playerName });
                  await initAgora();
                  setVcState('active');
                }}
                className="flex-1 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-200"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matchmaking1v1;