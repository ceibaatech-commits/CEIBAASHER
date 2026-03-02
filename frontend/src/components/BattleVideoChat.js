import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Maximize2, Phone, AlertCircle, Flag, X, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Report reasons for inappropriate behavior
const REPORT_REASONS = [
  { id: 'nudity', label: 'Nudity / Sexual Content', description: 'Showing private parts or sexual behavior' },
  { id: 'harassment', label: 'Harassment / Bullying', description: 'Verbal abuse or threatening behavior' },
  { id: 'offensive_content', label: 'Offensive Content', description: 'Hate speech, slurs, or discriminatory behavior' },
  { id: 'cheating', label: 'Cheating', description: 'Using unfair means to win' },
  { id: 'inappropriate_behavior', label: 'Other Inappropriate Behavior', description: 'Any other concerning behavior' }
];

// Updated ICE servers with reliable STUN/TURN
const ICE_SERVERS = { 
  iceServers: [
    // Google STUN servers (free, reliable)
    { urls: 'stun:stun.l.google.com:19302' }, 
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Metered Open Relay TURN servers (free tier)
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
    },
    // Additional backup TURN
    {
      urls: 'turns:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

const BattleVideoChat = ({ socket, roomId, playerName, opponentName, opponentId }) => {
  const [callState, setCallState] = useState('idle'); // idle | connecting | connected | error
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [showButton, setShowButton] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPolite, setIsPolite] = useState(false); // For perfect negotiation
  
  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportId, setReportId] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef([]);
  const makingOffer = useRef(false);
  const ignoreOffer = useRef(false);
  const roomJoinedRef = useRef(false);

  const log = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[VIDEO ${timestamp}] ${msg}`);
    setDebugInfo(prev => `${timestamp}: ${msg}\n${prev}`.slice(0, 800));
  };

  const cleanup = useCallback(() => {
    log('Cleaning up WebRTC...');
    makingOffer.current = false;
    ignoreOffer.current = false;
    
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.oniceconnectionstatechange = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.onnegotiationneeded = null;
      peerRef.current.close();
      peerRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => {
        t.stop();
        log(`Stopped ${t.kind} track`);
      });
      localStreamRef.current = null;
    }
    
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    setRemoteStream(null);
    setCallState('idle');
    pendingCandidates.current = [];
  }, []);

  // Set remote video when stream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      log('Setting remote stream to video element');
      remoteVideoRef.current.srcObject = remoteStream;
      // Ensure video plays
      remoteVideoRef.current.play().catch(e => log(`Video play error: ${e.message}`));
    }
  }, [remoteStream]);

  // Join video room when roomId is available
  useEffect(() => {
    if (!socket || !roomId || roomJoinedRef.current) return;
    
    log(`Joining video room: ${roomId}`);
    socket.emit('join-video-room', { roomId });
    roomJoinedRef.current = true;
    
    // Determine politeness based on socket ID (for perfect negotiation)
    // The "impolite" peer creates offers, the "polite" peer yields to collision
    setIsPolite(socket.id > roomId.split('_').pop());
    log(`Role: ${socket.id > roomId.split('_').pop() ? 'polite' : 'impolite'}`);
  }, [socket, roomId]);

  // Socket event listeners with perfect negotiation pattern
  useEffect(() => {
    if (!socket) {
      log('No socket available');
      return;
    }

    log(`Socket status: ${socket.connected ? 'connected' : 'disconnected'}, roomId: ${roomId}`);

    const handleOffer = async (data) => {
      log(`Received offer from: ${data.from}`);
      
      // Perfect negotiation: handle offer collision
      const offerCollision = makingOffer.current || 
        (peerRef.current && peerRef.current.signalingState !== 'stable');
      
      ignoreOffer.current = !isPolite && offerCollision;
      if (ignoreOffer.current) {
        log('Ignoring offer due to collision (impolite peer)');
        return;
      }

      try {
        setCallState('connecting');
        setShowButton(false);
        setErrorMsg('');
        
        // Get or create peer connection
        if (!peerRef.current) {
          const stream = await getLocalStream();
          createPeer(stream);
        }
        
        const pc = peerRef.current;
        
        // Set remote description (offer)
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        log('Set remote description (offer)');
        
        // Drain pending ICE candidates
        while (pendingCandidates.current.length > 0) {
          const candidate = pendingCandidates.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            log('Added queued ICE candidate');
          } catch (e) {
            log(`Failed to add queued ICE: ${e.message}`);
          }
        }
        
        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        log('Created and set local description (answer)');
        
        socket.emit('webrtc_answer', { roomId, answer });
        log('Sent answer to room');
        
      } catch (err) {
        log(`Offer handling error: ${err.message}`);
        console.error('WebRTC offer error:', err);
        setErrorMsg('Connection failed. Try again.');
        cleanup();
        setShowButton(true);
      }
    };

    const handleAnswer = async (data) => {
      log(`Received answer from: ${data.from}`);
      try {
        const pc = peerRef.current;
        if (!pc) {
          log('No peer connection for answer');
          return;
        }
        
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          log('Set remote description (answer)');
          
          // Drain pending ICE candidates
          while (pendingCandidates.current.length > 0) {
            const candidate = pendingCandidates.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
              log('Added queued ICE candidate');
            } catch (e) {
              log(`Failed to add queued ICE: ${e.message}`);
            }
          }
          log('Call setup complete!');
        } else {
          log(`Ignoring answer - wrong state: ${pc.signalingState}`);
        }
      } catch (err) {
        log(`Answer handling error: ${err.message}`);
        console.error('WebRTC answer error:', err);
      }
    };

    const handleICE = async (data) => {
      log(`Received ICE candidate from: ${data.from}`);
      try {
        const pc = peerRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          log('Added ICE candidate directly');
        } else {
          log('Queuing ICE candidate (waiting for remote description)');
          pendingCandidates.current.push(data.candidate);
        }
      } catch (err) {
        // Ignore non-fatal ICE errors
        if (!err.message.includes('location information')) {
          log(`ICE handling error: ${err.message}`);
        }
      }
    };

    // Listen for peer disconnection
    const handlePeerLeft = (data) => {
      log(`Peer left: ${data.reason || 'disconnected'}`);
      cleanup();
      setShowButton(true);
    };

    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleICE);
    socket.on('peer-left', handlePeerLeft);

    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleICE);
      socket.off('peer-left', handlePeerLeft);
    };
  }, [socket, roomId, isPolite]);

  const getLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    log('Requesting camera/mic access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: { 
          width: { ideal: 320, max: 640 }, 
          height: { ideal: 240, max: 480 }, 
          frameRate: { ideal: 15, max: 24 }
        }
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      log('Got local stream with ' + stream.getTracks().length + ' tracks');
      return stream;
    } catch (err) {
      log(`Media access error: ${err.name} - ${err.message}`);
      throw err;
    }
  };

  const createPeer = (stream) => {
    // Close existing peer if any
    if (peerRef.current) {
      peerRef.current.close();
    }
    
    log('Creating new peer connection...');
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerRef.current = pc;
    
    // Add all local tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      log(`Added local ${track.kind} track`);
    });

    // Handle incoming tracks (remote stream)
    pc.ontrack = (e) => {
      log(`Received remote ${e.track.kind} track, streams: ${e.streams.length}`);
      if (e.streams && e.streams[0]) {
        log(`Remote stream has ${e.streams[0].getTracks().length} tracks`);
        setRemoteStream(e.streams[0]);
        setCallState('connected');
        log('Remote stream connected!');
      } else if (e.track) {
        // Fallback: create stream from track
        log('Creating stream from track...');
        const newStream = new MediaStream([e.track]);
        setRemoteStream(prev => {
          if (prev) {
            prev.addTrack(e.track);
            return prev;
          }
          return newStream;
        });
        setCallState('connected');
      }
    };

    // Send ICE candidates to peer
    pc.onicecandidate = (e) => {
      if (e.candidate && socket && roomId) {
        socket.emit('webrtc_ice_candidate', { roomId, candidate: e.candidate });
        log(`Sent ICE candidate (${e.candidate.type || 'unknown'})`);
      } else if (!e.candidate) {
        log('ICE gathering complete');
      }
    };

    // Monitor ICE connection state
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      log(`ICE connection: ${state}`);
      
      switch (state) {
        case 'checking':
          setCallState('connecting');
          break;
        case 'connected':
        case 'completed':
          setCallState('connected');
          setErrorMsg('');
          break;
        case 'disconnected':
          log('ICE disconnected - attempting reconnection...');
          // Don't immediately cleanup, ICE may recover
          break;
        case 'failed':
          log('ICE connection failed');
          setErrorMsg('Connection failed. Please retry.');
          setCallState('error');
          break;
        case 'closed':
          cleanup();
          setShowButton(true);
          break;
        default:
          break;
      }
    };

    // Monitor overall connection state
    pc.onconnectionstatechange = () => {
      log(`Connection state: ${pc.connectionState}`);
      if (pc.connectionState === 'failed') {
        setErrorMsg('Connection lost. Please retry.');
        cleanup();
        setShowButton(true);
      }
    };

    // Handle negotiation needed (for renegotiation)
    pc.onnegotiationneeded = async () => {
      log('Negotiation needed');
      // Only the impolite peer should initiate renegotiation
      if (!isPolite && callState === 'connected') {
        try {
          makingOffer.current = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc_offer', { roomId, offer });
          log('Sent renegotiation offer');
        } catch (err) {
          log(`Renegotiation error: ${err.message}`);
        } finally {
          makingOffer.current = false;
        }
      }
    };

    return pc;
  };

  const startCall = async () => {
    if (!socket) {
      log('No socket connection');
      setErrorMsg('Waiting for connection...');
      return;
    }
    if (!roomId) {
      log('No roomId available');
      setErrorMsg('Waiting for opponent match...');
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
      setErrorMsg('');
      
      // Ensure we're in the video room
      if (!roomJoinedRef.current) {
        socket.emit('join-video-room', { roomId });
        roomJoinedRef.current = true;
        // Small delay to ensure room join is processed
        await new Promise(r => setTimeout(r, 200));
      }
      
      const stream = await getLocalStream();
      const pc = createPeer(stream);
      
      // Create and send offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      log('Created and set local description (offer)');
      
      socket.emit('webrtc_offer', { roomId, offer });
      log('Sent offer to room');
      
      // Set timeout for no response
      setTimeout(() => {
        if (callState === 'connecting' && !remoteStream) {
          log('Connection timeout - no response from peer');
          setErrorMsg('Opponent not responding. They may need to click "Video Call".');
        }
      }, 15000);
      
    } catch (err) {
      log(`Start call error: ${err.message}`);
      console.error('Start call error:', err);
      cleanup();
      setShowButton(true);
      makingOffer.current = false;
      
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera/mic access denied. Please allow access.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera/microphone found.');
      } else {
        setErrorMsg('Failed to start call. Please retry.');
      }
    } finally {
      makingOffer.current = false;
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

  // Submit report for inappropriate behavior
  const handleSubmitReport = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    setSubmittingReport(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to submit a report');
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/admin/battles/report`,
        {
          battle_id: roomId,
          room_id: roomId,
          reported_user_id: opponentId || 'unknown',
          reported_username: opponentName || 'Opponent',
          reason: selectedReason,
          description: reportDescription,
          chat_messages: []
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReportId(response.data.report_id);
        setReportSubmitted(true);
        setSelectedReason('');
        setReportDescription('');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Close report modal and reset state
  const closeReportModal = () => {
    setShowReportModal(false);
    setReportSubmitted(false);
    setReportId(null);
    setSelectedReason('');
    setReportDescription('');
  };

  // Don't render if no socket or roomId
  if (!socket || !roomId) {
    return null;
  }

  // Error state
  if (callState === 'error' || errorMsg) {
    return (
      <div className="fixed bottom-6 right-4 z-[60] bg-gray-900/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-red-700 max-w-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Connection Issue</p>
            <p className="text-red-400 text-xs">{errorMsg || 'Please retry'}</p>
          </div>
        </div>
        <button
          onClick={() => { setErrorMsg(''); setCallState('idle'); setShowButton(true); }}
          className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Idle: show call button
  if (callState === 'idle' && showButton) {
    return (
      <button
        onClick={startCall}
        className="fixed bottom-6 right-4 z-[60] flex items-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-full shadow-2xl transition-all animate-pulse"
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
      <>
        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              
              {/* Report Submitted Confirmation */}
              {reportSubmitted ? (
                <>
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Complaint Raised Successfully</h3>
                    <p className="text-gray-600 mb-4">
                      Your report against <span className="font-semibold">{opponentName || 'this user'}</span> has been submitted.
                    </p>
                    
                    {reportId && (
                      <div className="bg-gray-50 rounded-xl p-3 mb-4">
                        <p className="text-xs text-gray-500">Reference ID</p>
                        <p className="font-mono text-sm text-gray-800">{reportId.slice(0, 8).toUpperCase()}</p>
                      </div>
                    )}
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-blue-900 text-sm">What happens next?</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Our moderation team will review your complaint within 24-48 hours. 
                            If action is taken, you will be notified. Thank you for helping keep our community safe.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={closeReportModal}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Report User</h3>
                    </div>
                    <button
                      onClick={closeReportModal}
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-600">
                      Report <span className="font-semibold">{opponentName || 'this user'}</span> for inappropriate behavior during the battle.
                    </p>

                    {/* Reason Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Select a reason *</label>
                      {REPORT_REASONS.map((reason) => (
                        <label
                          key={reason.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                            selectedReason === reason.id
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="report_reason"
                            value={reason.id}
                            checked={selectedReason === reason.id}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="mt-1 w-4 h-4 text-red-500 focus:ring-red-500"
                          />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{reason.label}</p>
                            <p className="text-xs text-gray-500">{reason.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Additional Details */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Additional details (optional)</label>
                      <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Provide any additional context..."
                        className="mt-1 w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Warning */}
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-xs text-yellow-800">
                        <strong>Note:</strong> False reports may result in action against your account. 
                        Only report genuine violations.
                      </p>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex gap-3 p-4 border-t border-gray-200">
                    <button
                      onClick={closeReportModal}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReport}
                      disabled={!selectedReason || submittingReport}
                      className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingReport ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Video Chat UI */}
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
            </button>

            {/* Report button */}
            <button 
              onClick={() => setShowReportModal(true)} 
              className="absolute top-2 left-10 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-lg transition"
              title="Report user"
            >
              <Flag className="w-4 h-4 text-white" />
            </button>
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
              onClick={() => setShowReportModal(true)}
              className="p-2.5 bg-orange-500 hover:bg-orange-600 rounded-full transition"
              title="Report inappropriate behavior"
            >
              <Flag className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={endCall}
              className="p-2.5 bg-red-500 hover:bg-red-600 rounded-full transition"
            >
              <PhoneOff className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default BattleVideoChat;
