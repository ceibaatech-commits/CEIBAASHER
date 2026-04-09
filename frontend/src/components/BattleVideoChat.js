import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Minimize2, Maximize2, AlertCircle, Flag,
  X, AlertTriangle, Loader2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ─── Report reasons ────────────────────────────────────────────────────────────
const REPORT_REASONS = [
  { id: 'nudity', label: 'Nudity / Sexual Content', description: 'Showing private parts or sexual behaviour' },
  { id: 'harassment', label: 'Harassment / Bullying', description: 'Verbal abuse or threatening behaviour' },
  { id: 'offensive_content', label: 'Offensive Content', description: 'Hate speech, slurs, or discriminatory behaviour' },
  { id: 'cheating', label: 'Cheating', description: 'Using unfair means to win' },
  { id: 'inappropriate_behavior', label: 'Other Inappropriate Behaviour', description: 'Any other concerning behaviour' },
];

// ─── ICE configuration ─────────────────────────────────────────────────────────
// Uses only the most reliable free STUN servers + Metered TURN as fallback.
// Keep iceCandidatePoolSize low – a value of 10 floods the signalling channel
// and makes the first offer arrive before the peer is ready to receive it.
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turns:openrelay.metered.ca:443'],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 2, // lower = faster first candidate
  bundlePolicy: 'max-bundle', // one DTLS connection for audio + video
  rtcpMuxPolicy: 'require',
};

// ─── Video constraints ─────────────────────────────────────────────────────────
// Low-res intentionally: this is a side PiP during a quiz, not a video call app.
const VIDEO_CONSTRAINTS = {
  width: { ideal: 320, max: 480 },
  height: { ideal: 240, max: 360 },
  frameRate: { ideal: 15, max: 20 },
};

// How long (ms) to wait for the remote peer to respond before showing a hint.
const OFFER_TIMEOUT_MS = 18000;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const noop = () => {};

/**
 * BattleVideoChat
 *
 * Key improvements over the original:
 *  1. AUTO-START – as soon as both socket + roomId are available, the component
 *     joins the video room and the caller (determined by socket.id comparison)
 *     sends an offer without the user having to press a button.
 *  2. SINGLE PEER REF PATTERN – every mutation goes through `pcRef` so stale-
 *     closure bugs are eliminated.
 *  3. TRICKLE ICE with a queue – ICE candidates that arrive before
 *     setRemoteDescription is called are buffered and flushed immediately after.
 *  4. ROBUST RECONNECT – on ICE failure/disconnect we restart ICE via
 *     `createOffer({iceRestart: true})` instead of rebuilding the whole peer.
 *  5. OFFER DEDUPLICATION – a `makingOffer` guard and the perfect-negotiation
 *     pattern prevent double-offer races.
 *  6. FRAME POSITION FIXED – the widget is `position: fixed` and never
 *     interferes with the quiz layout.  It starts minimised so it doesn't
 *     block quiz content on mobile.
 *  7. GRACEFUL MEDIA ERRORS – camera/mic permission denial, device not found,
 *     etc. are caught and displayed without breaking the quiz.
 */
const BattleVideoChat = ({ socket, roomId, playerName, opponentName, opponentId }) => {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState('idle'); // idle|joining|connecting|connected|error
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [minimised, setMinimised] = useState(true); // start minimised
  const [errorMsg, setErrorMsg] = useState('');
  const [remoteReady, setRemoteReady] = useState(false);

  // Report modal
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportId, setReportId] = useState(null);

  // ── Refs (never trigger re-renders) ──────────────────────────────────────
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null); // RTCPeerConnection
  const localStreamRef = useRef(null); // MediaStream
  const pendingCandidates = useRef([]); // ICE candidates buffered before SDP
  const makingOffer = useRef(false);
  const ignoreOffer = useRef(false);
  const roomJoined = useRef(false);
  const isPoliteRef = useRef(false); // perfect-negotiation role
  const offerTimer = useRef(null);
  const phaseRef = useRef('idle'); // mirror of `phase` for use inside callbacks

  // keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // ── Logging ───────────────────────────────────────────────────────────────
  const log = useCallback((msg) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[VideoChat ${new Date().toLocaleTimeString()}] ${msg}`);
    }
  }, []);

  // ── Attach remote stream to <video> element ───────────────────────────────
  const attachRemoteStream = useCallback((stream) => {
    if (!remoteVideoRef.current) return;
    remoteVideoRef.current.srcObject = stream;
    remoteVideoRef.current.play().catch(noop);
    setRemoteReady(true);
    setPhase('connected');
    log('Remote stream attached');
  }, [log]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    log('Cleanup called');
    clearTimeout(offerTimer.current);
    makingOffer.current = false;
    ignoreOffer.current = false;
    pendingCandidates.current = [];

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.onnegotiationneeded = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setRemoteReady(false);
    setPhase('idle');
  }, [log]);

  // ── Get local media ───────────────────────────────────────────────────────
  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    log('Requesting camera/mic...');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: VIDEO_CONSTRAINTS,
    });

    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(noop);
    }
    log(`Got local stream (${stream.getTracks().length} tracks)`);
    return stream;
  }, [log]);

  // ── Drain buffered ICE candidates ─────────────────────────────────────────
  const drainCandidates = useCallback(async (pc) => {
    while (pendingCandidates.current.length > 0) {
      const c = pendingCandidates.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
        log('Drained buffered ICE candidate');
      } catch (e) {
        log(`Buffered ICE error (ignored): ${e.message}`);
      }
    }
  }, [log]);

  // ── ICE restart (avoid full teardown) ────────────────────────────────────
  const restartICE = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !socket?.connected || !roomId) {
      cleanup(); return;
    }
    log('Restarting ICE...');
    try {
      makingOffer.current = true;
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', { roomId, offer: pc.localDescription });
      log('ICE-restart offer sent');
    } catch (err) {
      log(`ICE restart failed: ${err.message}`);
      cleanup();
    } finally {
      makingOffer.current = false;
    }
  }, [cleanup, log, socket, roomId]);

  // ── Create RTCPeerConnection ──────────────────────────────────────────────
  const createPC = useCallback((stream) => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    log('Creating RTCPeerConnection...');
    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Receive remote tracks
    pc.ontrack = (e) => {
      log(`ontrack: ${e.track.kind}, streams: ${e.streams.length}`);
      const remoteStream = e.streams?.[0] ?? (() => {
        const s = new MediaStream(); s.addTrack(e.track); return s;
      })();
      attachRemoteStream(remoteStream);
    };

    // Trickle ICE
    pc.onicecandidate = (e) => {
      if (e.candidate && socket?.connected && roomId) {
        socket.emit('webrtc_ice_candidate', { roomId, candidate: e.candidate });
      }
    };

    // ICE state machine
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      log(`ICE: ${s}`);
      if (s === 'connected' || s === 'completed') {
        clearTimeout(offerTimer.current);
        setPhase('connected');
        setErrorMsg('');
      } else if (s === 'disconnected') {
        // ICE may recover on its own; wait 4 s then restart
        setTimeout(() => {
          if (pcRef.current?.iceConnectionState === 'disconnected') {
            log('ICE still disconnected - restarting...');
            restartICE();
          }
        }, 4000);
      } else if (s === 'failed') {
        log('ICE failed - restarting...');
        restartICE();
      }
    };

    pc.onconnectionstatechange = () => {
      log(`Connection: ${pc.connectionState}`);
      if (pc.connectionState === 'failed') restartICE();
    };

    // Renegotiation (e.g. after track replacement)
    pc.onnegotiationneeded = async () => {
      if (isPoliteRef.current || makingOffer.current) return;
      log('Negotiation needed');
      try {
        makingOffer.current = true;
        const offer = await pc.createOffer();
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(offer);
        socket?.emit('webrtc_offer', { roomId, offer: pc.localDescription });
        log('Re-negotiation offer sent');
      } catch (err) {
        log(`Renegotiation error: ${err.message}`);
      } finally {
        makingOffer.current = false;
      }
    };

    return pc;
    // eslint-disable-next-line
  }, [attachRemoteStream, log, socket, roomId]);

  // ── Initiate call (caller side) ───────────────────────────────────────────
  const startCall = useCallback(async () => {
    if (!socket?.connected || !roomId) {
      log('Socket not ready'); return;
    }
    if (makingOffer.current) {
      log('Already making offer'); return;
    }
    if (phaseRef.current === 'connecting' || phaseRef.current === 'connected') return;

    log(`Starting call in room ${roomId}`);
    setPhase('connecting');
    setErrorMsg('');

    try {
      const stream = await getLocalStream();
      const pc = createPC(stream);

      makingOffer.current = true;
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', { roomId, offer: pc.localDescription });
      log('Offer sent');

      // Hint after timeout if no response
      clearTimeout(offerTimer.current);
      offerTimer.current = setTimeout(() => {
        if (phaseRef.current === 'connecting') {
          setErrorMsg('Opponent hasn\'t responded yet - they may need to open the battle page.');
        }
      }, OFFER_TIMEOUT_MS);

    } catch (err) {
      log(`startCall error: ${err.name} - ${err.message}`);
      cleanup();
      setErrorMsg(
        err.name === 'NotAllowedError' ? 'Camera/mic access denied. Please allow in browser settings.' :
        err.name === 'NotFoundError' ? 'No camera or microphone found on this device.' :
        'Could not start video. Please retry.'
      );
      setPhase('error');
    } finally {
      makingOffer.current = false;
    }
  }, [cleanup, createPC, getLocalStream, log, roomId, socket]);

  // ── Auto-join + auto-call on mount (or when socket/roomId arrive) ─────────
  useEffect(() => {
    if (!socket || !roomId) return;
    if (roomJoined.current) return;

    // Determine negotiation role: lower socket.id string = caller (impolite)
    isPoliteRef.current = socket.id > roomId;
    log(`Role: ${isPoliteRef.current ? 'polite (answerer)' : 'impolite (caller)'}`);

    socket.emit('join-video-room', { roomId });
    roomJoined.current = true;
    log(`Joined video room ${roomId}`);

    // Only the caller initiates; answerer waits for offer.
    if (!isPoliteRef.current) {
      // Small delay so both sides have joined the room before the offer arrives.
      const t = setTimeout(() => startCall(), 800);
      return () => clearTimeout(t);
    }
    // We intentionally exclude `startCall` from deps to avoid re-running
    // eslint-disable-next-line
  }, [socket, roomId]);

  // ── Socket event handlers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // ── handle offer ────────────────────────────────────────────────────────
    const onOffer = async ({ offer, from }) => {
      log(`Offer from ${from}`);

      const collision = makingOffer.current ||
        (pcRef.current && pcRef.current.signalingState !== 'stable');

      ignoreOffer.current = !isPoliteRef.current && collision;
      if (ignoreOffer.current) {
        log('Ignoring offer (collision, impolite)'); return;
      }

      setPhase(p => p === 'idle' ? 'connecting' : p);
      setErrorMsg('');

      try {
        // Ensure we have a peer connection
        if (!pcRef.current) {
          const stream = await getLocalStream();
          createPC(stream);
        }
        const pc = pcRef.current;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        log('Remote description (offer) set');

        await drainCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { roomId, answer: pc.localDescription });
        log('Answer sent');

      } catch (err) {
        log(`onOffer error: ${err.message}`);
        setErrorMsg('Connection failed. Please retry.');
        cleanup();
        setPhase('error');
      }
    };

    // ── handle answer ────────────────────────────────────────────────────────
    const onAnswer = async ({ answer, from }) => {
      log(`Answer from ${from}`);
      const pc = pcRef.current;
      if (!pc) {
        log('No PC for answer'); return;
      }
      if (pc.signalingState !== 'have-local-offer') {
        log(`Ignoring answer - state: ${pc.signalingState}`); return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        log('Remote description (answer) set');
        await drainCandidates(pc);
      } catch (err) {
        log(`onAnswer error: ${err.message}`);
      }
    };

    // ── handle ICE candidate ─────────────────────────────────────────────────
    const onICE = async ({ candidate }) => {
      if (!candidate) return;
      const pc = pcRef.current;
      if (pc?.remoteDescription?.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          if (!e.message?.includes('location')) log(`ICE add error: ${e.message}`);
        }
      } else {
        log('Buffering ICE candidate (no remote desc yet)');
        pendingCandidates.current.push(candidate);
      }
    };

    // ── peer left ────────────────────────────────────────────────────────────
    const onPeerLeft = ({ reason }) => {
      log(`Peer left: ${reason}`);
      cleanup();
    };

    socket.on('webrtc-offer', onOffer);
    socket.on('webrtc-answer', onAnswer);
    socket.on('webrtc-ice-candidate', onICE);
    socket.on('peer-left', onPeerLeft);

    return () => {
      socket.off('webrtc-offer', onOffer);
      socket.off('webrtc-answer', onAnswer);
      socket.off('webrtc-ice-candidate', onICE);
      socket.off('peer-left', onPeerLeft);
    };
  }, [cleanup, createPC, drainCandidates, getLocalStream, log, roomId, socket]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => cleanup(), [cleanup]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudioOn(track.enabled);
    }
  };
  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoOn(track.enabled);
    }
  };
  const endCall = () => {
    cleanup();
    roomJoined.current = false;
  };

  // ── Report submission ─────────────────────────────────────────────────────
  const submitReport = async () => {
    if (!reportReason) {
      toast.error('Please select a reason'); return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/admin/battles/report`,
        {
          battle_id: roomId, room_id: roomId,
          reported_user_id: opponentId || 'unknown',
          reported_username: opponentName || 'Opponent',
          reason: reportReason, description: reportDesc, chat_messages: [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setReportId(res.data.report_id);
        setReportDone(true);
      }
    } catch (e) {
      console.error('Failed to submit report:', e);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeReport = () => {
    setShowReport(false);
    setReportDone(false);
    setReportId(null);
    setReportReason('');
    setReportDesc('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // Nothing to show until socket + room are available
  if (!socket || !roomId) return null;

  return (
    <>
      {/* ── Report modal ───────────────────────────────────────────────────── */}
      {showReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4" data-testid="report-modal">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            {reportDone ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Report Submitted</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Your report against <strong>{opponentName || 'this user'}</strong> has been received.
                </p>
                {reportId && (
                  <p className="font-mono text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 inline-block mb-4">
                    Ref: {reportId.slice(0, 8).toUpperCase()}
                  </p>
                )}
                <button onClick={closeReport} className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition" data-testid="report-close-btn">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-100 rounded-full"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
                    <h3 className="font-bold text-gray-900">Report User</h3>
                  </div>
                  <button onClick={closeReport} className="p-1.5 hover:bg-gray-100 rounded-full" data-testid="report-close-x"><X className="w-4 h-4 text-gray-500" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-sm text-gray-600">Report <strong>{opponentName || 'this user'}</strong> for inappropriate behaviour.</p>
                  <div className="space-y-2">
                    {REPORT_REASONS.map(r => (
                      <label key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${reportReason === r.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="report_reason" value={r.id} checked={reportReason === r.id} onChange={e => setReportReason(e.target.value)} className="mt-0.5 text-red-500" />
                        <div>
                          <p className="font-medium text-sm text-gray-900">{r.label}</p>
                          <p className="text-xs text-gray-500">{r.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Additional details (optional)" rows={3}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" data-testid="report-description" />
                </div>
                <div className="flex gap-3 p-4 border-t">
                  <button onClick={closeReport} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition" data-testid="report-cancel-btn">Cancel</button>
                  <button onClick={submitReport} disabled={!reportReason || submitting}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition disabled:opacity-50" data-testid="report-submit-btn">
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Main video widget ──────────────────────────────────────────────── */}
      <div
        className="fixed bottom-4 right-4 z-[70]"
        style={{ willChange: 'transform' }}
        data-testid="video-chat-widget"
      >

        {/* ── MINIMISED pill ──────────────────────────────────────────────── */}
        {minimised ? (
          <div className="relative w-28 h-20 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-900 cursor-pointer"
            onClick={() => setMinimised(false)} data-testid="video-minimised">

            {/* Remote video thumbnail */}
            <video ref={remoteVideoRef} autoPlay playsInline
              className={`absolute inset-0 w-full h-full object-cover ${remoteReady ? '' : 'opacity-0'}`} />

            {/* Placeholder when no remote video */}
            {!remoteReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                {phase === 'connecting' || phase === 'joining'
                  ? <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                  : <Video className="w-5 h-5 text-gray-500" />}
              </div>
            )}

            {/* Local PiP (tiny) */}
            <div className="absolute top-1 right-1 w-8 h-6 rounded overflow-hidden border border-white/30 bg-gray-700">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>

            {/* Expand hint */}
            <div className="absolute bottom-1 left-1">
              <Maximize2 className="w-3 h-3 text-white/60" />
            </div>

            {/* Status badge */}
            <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
              phase === 'connected' ? 'bg-green-400' :
              phase === 'connecting' || phase === 'joining' ? 'bg-yellow-400 animate-pulse' :
              'bg-gray-500'}`} />
          </div>

        ) : (
          /* ── EXPANDED card ──────────────────────────────────────────────── */
          <div className="w-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900/95 backdrop-blur-md" data-testid="video-expanded">

            {/* Remote video area */}
            <div className="relative" style={{ aspectRatio: '4/3' }}>
              <div className="absolute inset-0 bg-gray-800">
                <video ref={remoteVideoRef} autoPlay playsInline
                  className={`w-full h-full object-cover ${remoteReady ? '' : 'opacity-0'}`} />

                {/* Overlay when no remote stream */}
                {!remoteReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    {phase === 'error' ? (
                      <>
                        <AlertCircle className="w-7 h-7 text-red-400" />
                        <p className="text-red-300 text-xs text-center px-4">{errorMsg || 'Connection error'}</p>
                        <button onClick={() => { setPhase('idle'); setErrorMsg(''); roomJoined.current = false; startCall(); }}
                          className="mt-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full transition" data-testid="video-retry-btn">
                          Retry
                        </button>
                      </>
                    ) : phase === 'connecting' || phase === 'joining' ? (
                      <>
                        <Loader2 className="w-7 h-7 text-green-400 animate-spin" />
                        <p className="text-gray-400 text-xs">
                          {phase === 'joining' ? 'Joining room...' : 'Connecting to opponent...'}
                        </p>
                        {errorMsg && <p className="text-yellow-300 text-xs text-center px-4">{errorMsg}</p>}
                      </>
                    ) : (
                      <>
                        <Video className="w-7 h-7 text-gray-500" />
                        <p className="text-gray-500 text-xs">
                          {opponentName ? `Waiting for ${opponentName}...` : 'Video loading...'}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Opponent name badge */}
                {remoteReady && opponentName && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-white text-xs font-medium">
                    {opponentName}
                  </div>
                )}
              </div>

              {/* Local PiP */}
              <div className="absolute top-2 right-2 w-20 h-16 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg bg-gray-700">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {playerName && (
                  <div className="absolute bottom-0 left-0 right-0 text-center text-white text-[9px] bg-black/50 truncate px-1">
                    {playerName}
                  </div>
                )}
              </div>

              {/* Top bar: minimise + report */}
              <div className="absolute top-2 left-2 flex gap-1.5">
                <button onClick={() => setMinimised(true)} className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition" title="Minimise" data-testid="video-minimise-btn">
                  <Minimize2 className="w-3.5 h-3.5 text-white/70" />
                </button>
                <button onClick={() => setShowReport(true)} className="p-1.5 bg-orange-500/80 hover:bg-orange-600 rounded-lg transition" title="Report user" data-testid="video-report-btn">
                  <Flag className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Controls bar */}
            <div className="flex justify-center items-center gap-3 px-4 py-3 bg-gray-800/60">
              <button onClick={toggleAudio}
                className={`p-2.5 rounded-full transition ${audioOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
                title={audioOn ? 'Mute' : 'Unmute'} data-testid="video-toggle-audio">
                {audioOn ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
              </button>

              <button onClick={toggleVideo}
                className={`p-2.5 rounded-full transition ${videoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
                title={videoOn ? 'Turn off camera' : 'Turn on camera'} data-testid="video-toggle-video">
                {videoOn ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4 text-white" />}
              </button>

              <button onClick={endCall} className="p-2.5 bg-red-500 hover:bg-red-600 rounded-full transition" title="End call" data-testid="video-end-call">
                <PhoneOff className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BattleVideoChat;
