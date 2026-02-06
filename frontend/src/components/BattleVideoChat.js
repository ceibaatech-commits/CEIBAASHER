import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Maximize2, Phone } from 'lucide-react';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

const BattleVideoChat = ({ socket, roomId, playerName }) => {
  const [callState, setCallState] = useState('idle'); // idle | connecting | connected
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [showButton, setShowButton] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef([]);

  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setRemoteStream(null);
    setCallState('idle');
    setMinimized(false);
    pendingCandidates.current = [];
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Socket listeners for WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async (data) => {
      if (callState === 'connected') return;
      try {
        setCallState('connecting');
        setShowButton(false);
        const stream = await getLocalStream();
        const pc = createPeer(stream);
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        for (const c of pendingCandidates.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidates.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { roomId, answer });
      } catch (err) {
        console.error('WebRTC offer error:', err);
        cleanup();
        setShowButton(true);
      }
    };

    const handleAnswer = async (data) => {
      try {
        if (peerRef.current && peerRef.current.signalingState !== 'stable') {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          for (const c of pendingCandidates.current) {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidates.current = [];
        }
      } catch (err) {
        console.error('WebRTC answer error:', err);
      }
    };

    const handleICE = async (data) => {
      try {
        if (peerRef.current && peerRef.current.remoteDescription) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
          pendingCandidates.current.push(data.candidate);
        }
      } catch (err) {
        console.error('WebRTC ICE error:', err);
      }
    };

    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleICE);

    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleICE);
    };
  }, [socket, roomId, callState, cleanup]);

  const getLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: 320, height: 240, frameRate: 15 }
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const createPeer = (stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerRef.current = pc;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
      setCallState('connected');
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit('webrtc_ice_candidate', { roomId, candidate: e.candidate });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        cleanup();
        setShowButton(true);
      }
    };

    return pc;
  };

  const startCall = async () => {
    if (!socket) {
      alert('Waiting for battle connection...');
      return;
    }
    try {
      setCallState('connecting');
      setShowButton(false);
      const stream = await getLocalStream();
      const pc = createPeer(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', { roomId, offer });
    } catch (err) {
      console.error('Start call error:', err);
      cleanup();
      setShowButton(true);
      if (err.name === 'NotAllowedError') {
        alert('Camera/microphone access denied. Please allow access and try again.');
      }
    }
  };

  const endCall = () => {
    cleanup();
    setShowButton(true);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) { track.enabled = !track.enabled; setAudioEnabled(track.enabled); }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) { track.enabled = !track.enabled; setVideoEnabled(track.enabled); }
    }
  };

  // ===== RENDER =====

  // Idle: show call button
  if (callState === 'idle' && showButton) {
    return (
      <button
        onClick={startCall}
        className="fixed bottom-6 right-4 z-[60] flex items-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-full shadow-2xl transition-all"
        data-testid="start-video-call"
      >
        <Video className="w-5 h-5" />
        <span className="text-sm font-semibold">Video Call</span>
      </button>
    );
  }

  // Minimized PiP
  if (minimized && (callState === 'connecting' || callState === 'connected')) {
    return (
      <div
        className="fixed bottom-6 right-4 z-[60] w-28 h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 cursor-pointer group"
        onClick={() => setMinimized(false)}
        data-testid="pip-minimized"
      >
        {callState === 'connected' && remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-gray-900" />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
          <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
        </div>
      </div>
    );
  }

  // Expanded PiP (WhatsApp style)
  if (callState === 'connecting' || callState === 'connected') {
    return (
      <div className="fixed bottom-6 right-4 z-[60] w-48 rounded-2xl overflow-hidden shadow-2xl bg-gray-900 border border-white/20" data-testid="pip-expanded">
        {/* Remote Video */}
        <div className="relative w-full aspect-[3/4]">
          {callState === 'connected' && remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 gap-2">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-white/60 text-xs font-medium">Calling...</span>
            </div>
          )}

          {/* Local video overlay */}
          <div className="absolute top-2 right-2 w-16 h-20 rounded-xl overflow-hidden border-2 border-white/40 shadow-lg bg-gray-700">
            <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!videoEnabled ? 'hidden' : ''}`} />
            {!videoEnabled && (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <VideoOff className="w-4 h-4 text-white/50" />
              </div>
            )}
          </div>

          {/* Minimize button */}
          <button onClick={() => setMinimized(true)} className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition">
            <Minimize2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-center gap-3 py-3 bg-gray-900/95">
          <button
            onClick={toggleAudio}
            className={`p-2.5 rounded-full transition ${audioEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'}`}
            data-testid="toggle-audio"
          >
            {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-2.5 rounded-full transition ${videoEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'}`}
            data-testid="toggle-video"
          >
            {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>
          <button onClick={endCall} className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition" data-testid="end-call">
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default BattleVideoChat;
