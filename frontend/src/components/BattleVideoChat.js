import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Maximize2, Phone } from 'lucide-react';

const ICE_SERVERS = { 
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }, 
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Free TURN servers for testing
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ] 
};

const BattleVideoChat = ({ socket, roomId, playerName }) => {
  const [callState, setCallState] = useState('idle'); // idle | connecting | connected
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [showButton, setShowButton] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef([]);
  const makingOffer = useRef(false);

  const log = (msg) => {
    console.log(`[VIDEO] ${msg}`);
    setDebugInfo(prev => `${msg}\n${prev}`.slice(0, 500));
  };

  const cleanup = useCallback(() => {
    log('Cleaning up...');
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
    pendingCandidates.current = [];
    makingOffer.current = false;
  }, []);

  // Set remote video when stream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      log('Setting remote stream to video element');
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) {
      log('No socket available');
      return;
    }

    log(`Socket connected: ${socket.connected}, roomId: ${roomId}`);

    // Explicitly join the room when roomId is set
    if (roomId) {
      log(`Joining room: ${roomId}`);
      socket.emit('join-video-room', { roomId });
    }

    const handleOffer = async (data) => {
      log(`Received offer from: ${data.from}`);
      if (callState === 'connected') {
        log('Already connected, ignoring offer');
        return;
      }
      try {
        setCallState('connecting');
        setShowButton(false);
        
        const stream = await getLocalStream();
        const pc = createPeer(stream);
        
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        log('Set remote description (offer)');
        
        // Add any pending ICE candidates
        for (const c of pendingCandidates.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidates.current = [];
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        log('Created and set local description (answer)');
        
        socket.emit('webrtc_answer', { roomId, answer });
        log('Sent answer');
      } catch (err) {
        log(`Offer handling error: ${err.message}`);
        console.error('WebRTC offer error:', err);
        cleanup();
        setShowButton(true);
      }
    };

    const handleAnswer = async (data) => {
      log(`Received answer from: ${data.from}`);
      try {
        if (peerRef.current && peerRef.current.signalingState !== 'stable') {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          log('Set remote description (answer)');
          
          // Add any pending ICE candidates
          for (const c of pendingCandidates.current) {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidates.current = [];
          log('Call setup complete!');
        } else {
          log(`Ignoring answer - state: ${peerRef.current?.signalingState}`);
        }
      } catch (err) {
        log(`Answer handling error: ${err.message}`);
        console.error('WebRTC answer error:', err);
      }
    };

    const handleICE = async (data) => {
      log(`Received ICE candidate`);
      try {
        if (peerRef.current && peerRef.current.remoteDescription) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          log('Added ICE candidate');
        } else {
          log('Queuing ICE candidate (no remote description yet)');
          pendingCandidates.current.push(data.candidate);
        }
      } catch (err) {
        log(`ICE handling error: ${err.message}`);
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
    log('Requesting camera/mic access...');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: 320, height: 240, frameRate: 15 }
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    log('Got local stream');
    return stream;
  };

  const createPeer = (stream) => {
    log('Creating peer connection...');
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerRef.current = pc;
    
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      log(`Added ${track.kind} track`);
    });

    pc.ontrack = (e) => {
      log(`Received remote ${e.track.kind} track`);
      if (e.streams && e.streams[0]) {
        setRemoteStream(e.streams[0]);
        setCallState('connected');
        log('Remote stream connected!');
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && socket && roomId) {
        socket.emit('webrtc_ice_candidate', { roomId, candidate: e.candidate });
        log('Sent ICE candidate');
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      log(`ICE connection state: ${state}`);
      if (state === 'connected' || state === 'completed') {
        setCallState('connected');
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        cleanup();
        setShowButton(true);
      }
    };

    pc.onconnectionstatechange = () => {
      log(`Connection state: ${pc.connectionState}`);
    };

    return pc;
  };

  const startCall = async () => {
    if (!socket) {
      log('No socket connection');
      alert('Waiting for battle connection...');
      return;
    }
    if (!roomId) {
      log('No roomId available');
      alert('Waiting for opponent match...');
      return;
    }
    
    if (makingOffer.current) {
      log('Already making offer, skipping...');
      return;
    }
    
    try {
      makingOffer.current = true;
      log(`Starting call in room: ${roomId}`);
      setCallState('connecting');
      setShowButton(false);
      
      const stream = await getLocalStream();
      const pc = createPeer(stream);
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      log('Created and set local description (offer)');
      
      socket.emit('webrtc_offer', { roomId, offer });
      log('Sent offer');
    } catch (err) {
      log(`Start call error: ${err.message}`);
      console.error('Start call error:', err);
      cleanup();
      setShowButton(true);
      makingOffer.current = false;
      if (err.name === 'NotAllowedError') {
        alert('Camera/microphone access denied. Please allow access and try again.');
      }
    }
  };

  const endCall = () => {
    log('Ending call');
    cleanup();
    setShowButton(true);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        log(`Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        log(`Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  // Don't render if no socket or roomId
  if (!socket || !roomId) {
    return null;
  }

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

  // Connecting state
  if (callState === 'connecting') {
    return (
      <div className="fixed bottom-6 right-4 z-[60] bg-gray-900/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-green-400 animate-pulse" />
          </div>
          <div>
            <p className="text-white font-medium">Connecting...</p>
            <p className="text-gray-400 text-xs">Setting up video call</p>
          </div>
        </div>
      </div>
    );
  }

  // Connected: show video UI
  if (callState === 'connected') {
    if (minimized) {
      return (
        <div className="fixed bottom-6 right-4 z-[60] bg-gray-900/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
          <div className="relative w-32 h-24">
            {remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-gray-900" />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <Video className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-1 left-1 right-1 flex justify-between items-center">
              <button onClick={() => setMinimized(false)} className="p-1 bg-black/50 rounded">
                <Maximize2 className="w-3 h-3 text-white" />
              </button>
              <button onClick={endCall} className="p-1 bg-red-500 rounded">
                <PhoneOff className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed bottom-6 right-4 z-[60] bg-gray-900/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-gray-700 w-72">
        {/* Remote Video (Main) */}
        <div className="relative aspect-[4/3] bg-gray-800">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Video className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-xs">Waiting for video...</p>
              </div>
            </div>
          )}
          
          {/* Local Video (PiP) */}
          <div className="absolute top-2 right-2 w-20 h-16 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-gray-700" />
          </div>
          
          {/* Minimize button */}
          <button 
            onClick={() => setMinimized(true)} 
            className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition"
          >
            <Minimize2 className="w-4 h-4 text-white/50" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 p-3 bg-gray-800/50">
          <button
            onClick={toggleAudio}
            className={`p-2.5 rounded-full transition ${audioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {audioEnabled ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-2.5 rounded-full transition ${videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {videoEnabled ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4 text-white" />}
          </button>
          <button
            onClick={endCall}
            className="p-2.5 bg-red-500 hover:bg-red-600 rounded-full transition"
          >
            <PhoneOff className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default BattleVideoChat;
