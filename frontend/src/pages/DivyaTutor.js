import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Mic, FileText, X, Loader2, VolumeX,
  Send, LogIn, ChevronLeft, Languages, Sparkles, StopCircle,
  Radio, Headphones, Play, Pause, SkipBack, SkipForward, ImagePlus, Volume2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const ACCEPTED_FILES = '.pdf,.jpg,.jpeg,.png,.webp';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', flag: '🇮🇳' },
];

const TUTORS = {
  divya: {
    name: 'Divya', tagline: 'Warm & Encouraging',
    desc: 'Explains with examples & analogies. Makes learning fun!',
    avatar: '/images/divya_avatar.png',
    bg: 'from-purple-500 to-pink-500', light: 'bg-purple-50',
    border: 'border-purple-200', text: 'text-purple-600', pulse: 'bg-purple-400',
  },
  sher: {
    name: 'Sher', tagline: 'Sharp & Exam-Focused',
    desc: 'Mnemonics, tricks & strategies to ace your exams.',
    avatar: '/images/sher_avatar.png',
    bg: 'from-teal-500 to-cyan-500', light: 'bg-teal-50',
    border: 'border-teal-200', text: 'text-teal-600', pulse: 'bg-teal-400',
  },
};

/* ──────────────────────────────────────
   AUDIO MANAGER — bulletproof playback
   ────────────────────────────────────── */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.currentSource = null;
    this.currentAudio = null;
    this.onStart = null;
    this.onEnd = null;
  }

  // Must be called from a user gesture (click handler)
  warmUp() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  async play(base64Audio, onStart, onEnd) {
    this.stop();
    this.onStart = onStart;
    this.onEnd = onEnd;

    // Decode base64 to bytes
    const raw = atob(base64Audio);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/wav' });
    const blobUrl = URL.createObjectURL(blob);

    // Strategy 1: AudioContext + MediaElementSource (most reliable for autoplay)
    if (this.ctx && this.ctx.state === 'running') {
      try {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = blobUrl;
        const source = this.ctx.createMediaElementSource(audio);
        source.connect(this.ctx.destination);
        this.currentAudio = audio;

        audio.onended = () => { this._cleanup(blobUrl); };
        audio.onerror = () => { this._cleanup(blobUrl); };

        this.onStart?.();
        await audio.play();
        return true;
      } catch (e) {
        console.warn('AudioContext MediaElement play failed:', e);
      }
    }

    // Strategy 2: Plain Audio element (works if user recently interacted)
    try {
      const audio = new Audio(blobUrl);
      this.currentAudio = audio;
      audio.onended = () => { this._cleanup(blobUrl); };
      audio.onerror = () => { this._cleanup(blobUrl); };
      this.onStart?.();
      await audio.play();
      return true;
    } catch (e) {
      console.warn('Direct Audio.play failed:', e);
      URL.revokeObjectURL(blobUrl);
      this._cleanup(null);
      return false;
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.removeAttribute('src');
      this.currentAudio = null;
    }
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch {}
      this.currentSource = null;
    }
    this.onEnd?.();
  }

  _cleanup(blobUrl) {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    this.currentAudio = null;
    this.currentSource = null;
    this.onEnd?.();
  }
}

// Singleton audio manager
const audioMgr = new AudioManager();

/* ──────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────── */
const DivyaTutor = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const isLoggedIn = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;
  const [activeTab, setActiveTab] = useState('live');
  const [liveSessionActive, setLiveSessionActive] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={isLoggedIn} user={user} onLogout={logout} />
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        {!isLoggedIn ? <LoginPrompt navigate={navigate} /> : (
          <>
            {/* Hide tabs when in live session */}
            {!liveSessionActive && (
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4" data-testid="mode-tabs">
                {[['live', Mic, 'Live Tutor'], ['podcast', Headphones, 'Podcast']].map(([key, Icon, label]) => (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    data-testid={`tab-${key}`}>
                    <Icon className="w-4 h-4 shrink-0" /> {label}
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'live' ? <LiveTutor onSessionChange={setLiveSessionActive} /> : <PodcastMode />}
          </>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   LIVE TUTOR
   ══════════════════════════════════════ */
const LiveTutor = ({ onSessionChange }) => {
  const [sessionActive, setSessionActive] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [pdfContext, setPdfContext] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  useEffect(() => () => { audioMgr.stop(); stopRecording(); }, []);

  /* ─── File Upload ─── */
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []).filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext) && f.size <= 20 * 1024 * 1024;
    });
    if (!files.length) return toast.error('Upload PDF or images (max 20MB)');
    setUploadingFiles(true);
    setUploadedFiles(files.map(f => f.name));
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      const res = await axios.post(`${BACKEND_URL}/api/divya/live/upload-context`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000,
      });
      if (res.data.success) {
        setPdfContext(res.data.context);
        toast.success(`${files.length} file(s): ${res.data.char_count} chars extracted`);
      }
    } catch { toast.error('Failed to process files'); setUploadedFiles([]); }
    finally { setUploadingFiles(false); }
  };

  const removeFiles = () => { setPdfContext(''); setUploadedFiles([]); if (fileInputRef.current) fileInputRef.current.value = ''; };

  /* ─── Session ─── */
  const startSession = (tutor) => {
    audioMgr.warmUp();
    setSelectedTutor(tutor);
    setSessionActive(true);
    onSessionChange?.(true);
    setMessages([{
      role: 'tutor',
      text: tutor === 'divya'
        ? `Namaste! I'm Divya. ${pdfContext ? "I've read your material — ask me anything!" : "Upload a file or ask me any question!"}`
        : `Hey! I'm Sher. ${pdfContext ? "I've reviewed your material — let's ace those exams!" : "Upload a file or fire your doubts!"}`,
    }]);
  };

  const endSession = () => { audioMgr.stop(); stopRecording(); setSessionActive(false); onSessionChange?.(false); setSelectedTutor(null); setMessages([]); setIsProcessing(false); };

  /* ─── Play audio for a specific message ─── */
  const playMessageAudio = async (audioB64) => {
    audioMgr.warmUp();
    const played = await audioMgr.play(
      audioB64,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
    if (!played) toast('Tap the play button on the message to hear audio', { icon: '🔊' });
  };

  /* ─── Send Message ─── */
  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isProcessing) return;
    audioMgr.warmUp(); // keep audio context alive
    const userText = text.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsProcessing(true);

    const chatHistory = messages.slice(-8).map(m => ({
      role: m.role === 'user' ? 'Student' : TUTORS[selectedTutor]?.name || 'Tutor',
      text: m.text,
    }));

    try {
      const res = await axios.post(`${BACKEND_URL}/api/divya/live/ask`, {
        text: userText, tutor: selectedTutor, language: selectedLang,
        context: pdfContext, chat_history: chatHistory,
      }, { timeout: 60000 });

      if (res.data.success) {
        const audioB64 = res.data.audio_base64 || null;
        setMessages(prev => [...prev, { role: 'tutor', text: res.data.text, audio: audioB64 }]);
        if (audioB64) playMessageAudio(audioB64);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'tutor', text: "Sorry, couldn't process that. Try again?" }]);
    } finally { setIsProcessing(false); }
  }, [isProcessing, messages, selectedTutor, selectedLang, pdfContext]);

  /* ─── Voice Recording ─── */
  const startRecording = async () => {
    audioMgr.stop(); // barge-in
    audioMgr.warmUp();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm',
      });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 1000) await transcribeAndSend(blob);
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch { toast.error('Microphone access denied'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      try { mediaRecorderRef.current?.stop(); } catch {}
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const toggleRecording = () => isRecording ? stopRecording() : startRecording();

  const transcribeAndSend = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const fd = new FormData();
      fd.append('file', audioBlob, 'recording.webm');
      // Send the selected language so Whisper transcribes in the right tongue.
      // Backend accepts both short codes ("en") and Sarvam codes ("en-IN").
      if (selectedLang) fd.append('language', selectedLang);
      const res = await axios.post(`${BACKEND_URL}/api/divya/live/transcribe`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000,
      });
      if (res.data.success && res.data.text) await sendMessage(res.data.text);
      else { toast.error("Couldn't understand. Try again."); setIsProcessing(false); }
    } catch { toast.error('Transcription failed. Try typing.'); setIsProcessing(false); }
  };

  const tutor = selectedTutor ? TUTORS[selectedTutor] : null;

  if (!sessionActive) {
    return (
      <LiveSetup selectedLang={selectedLang} setSelectedLang={setSelectedLang}
        uploadedFiles={uploadedFiles} uploadingFiles={uploadingFiles}
        handleFileUpload={handleFileUpload} removeFiles={removeFiles}
        fileInputRef={fileInputRef} startSession={startSession} pdfContext={pdfContext} />
    );
  }

  return (
    <div className="fixed inset-x-0 top-16 bottom-14 z-40 bg-gray-50">
      <div className="max-w-2xl mx-auto h-full flex flex-col px-4">
        {/* Top Bar */}
        <div className="flex items-center gap-3 py-3 border-b border-gray-200 bg-white px-4 shrink-0 -mx-4">
          <button onClick={endSession} className="p-1.5 hover:bg-gray-100 rounded-lg" data-testid="end-session-btn">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="relative">
          <img src={tutor.avatar} alt={tutor.name} className="w-10 h-10 rounded-full object-cover border-2"
            style={{ borderColor: isSpeaking ? (selectedTutor === 'divya' ? '#a855f7' : '#14b8a6') : '#e5e7eb',
              backgroundColor: selectedTutor === 'divya' ? '#e9d5ff' : '#ccfbf1' }} />
          {isSpeaking && <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${tutor.pulse} rounded-full animate-pulse border-2 border-white`} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-800">{tutor.name}</h3>
          <p className="text-[10px] text-gray-400">{isSpeaking ? 'Speaking...' : isProcessing ? 'Thinking...' : 'Listening'}</p>
        </div>
        {isSpeaking && (
          <button onClick={() => audioMgr.stop()} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg" data-testid="stop-audio-btn">
            <VolumeX className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50" data-testid="chat-messages">
        {messages.map((msg, idx) => (
          <MsgBubble key={msg.id || msg.timestamp || `msg-${idx}`} msg={msg} tutor={tutor} selectedTutor={selectedTutor}
            onPlayAudio={msg.audio ? () => playMessageAudio(msg.audio) : null}
            isSpeaking={isSpeaking} />
        ))}
        {isProcessing && (
          <div className="flex gap-2.5">
            <img src={tutor.avatar} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover"
              style={{ backgroundColor: selectedTutor === 'divya' ? '#e9d5ff' : '#ccfbf1' }} />
            <div className={`${tutor.light} rounded-2xl rounded-tl-sm px-4 py-3`}>
              <div className="flex gap-1.5">
                {[0, 150, 300].map(d => <span key={d} className={`w-2 h-2 ${tutor.pulse} rounded-full animate-bounce`} style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
        <div className="flex items-center justify-center mb-3">
          <button onClick={toggleRecording} disabled={isProcessing}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 disabled:opacity-50 ${
              isRecording ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : `bg-gradient-to-r ${tutor.bg} hover:opacity-90 shadow-gray-200`}`}
            data-testid="mic-button">
            {isRecording ? <StopCircle className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
            {isRecording && <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mb-3">
          {isRecording ? 'Listening... Tap to stop' : isSpeaking ? 'Tap mic to interrupt' : 'Tap mic to speak'}
        </p>
        <div className="flex gap-2">
          <input type="text" value={inputText} onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(inputText)}
            placeholder={`Ask ${tutor.name} anything...`}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-300 focus:border-transparent"
            disabled={isProcessing} data-testid="text-input" />
          <button onClick={() => sendMessage(inputText)} disabled={!inputText.trim() || isProcessing}
            className={`p-2.5 bg-gradient-to-r ${tutor.bg} text-white rounded-xl hover:opacity-90 disabled:opacity-40 shrink-0`}
            data-testid="send-btn">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   PODCAST MODE
   ══════════════════════════════════════ */
const PodcastMode = () => {
  const [files, setFiles] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [podcast, setPodcast] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFiles = (e) => {
    const valid = Array.from(e.target.files || []).filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext) && f.size <= 20 * 1024 * 1024;
    });
    if (valid.length) setFiles(prev => [...prev, ...valid].slice(0, 6));
    else toast.error('Upload PDF or images (max 20MB each)');
  };

  const generatePodcast = async () => {
    if (!files.length) return toast.error('Upload at least one file');
    setGenerating(true);
    setPodcast(null);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      const res = await axios.post(`${BACKEND_URL}/api/divya/generate-podcast`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000,
      });
      if (res.data.audio_base64 || res.data.audio_url) {
        let src = res.data.audio_url;
        if (res.data.audio_base64) src = `data:audio/wav;base64,${res.data.audio_base64}`;
        else if (src && !src.startsWith('http')) src = `${BACKEND_URL}${src}`;
        setPodcast({ audio_src: src, dialogue: res.data.dialogue || [] });
        toast.success('Podcast generated!');
      }
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to generate podcast'); }
    finally { setGenerating(false); }
  };

  useEffect(() => {
    if (!podcast?.audio_src) return;
    const audio = new Audio(podcast.audio_src);
    audioRef.current = audio;
    audio.onplay = () => setPlaying(true);
    audio.onpause = () => setPlaying(false);
    audio.onended = () => { setPlaying(false); setProgress(0); };
    audio.ontimeupdate = () => { if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100); };
    return () => { audio.pause(); audio.src = ''; };
  }, [podcast?.audio_src]);

  return (
    <>
      <div className="bg-[#0f1729] rounded-2xl p-6 mb-5 relative overflow-hidden" data-testid="podcast-hero">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Radio className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-black text-white mb-1">Divya & Sher Podcast</h2>
          <p className="text-gray-400 text-sm">Upload study material — get an engaging audio discussion!</p>
        </div>
      </div>

      {!podcast && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4" data-testid="podcast-upload">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-700">Upload Study Material</h3>
            <span className="text-[10px] text-gray-400 ml-auto">PDF, JPG, PNG</span>
          </div>
          {files.length > 0 && (
            <div className="space-y-2 mb-3">
              {files.map((f, i) => (
                <div key={f.name || `file-${i}`} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  {f.type?.includes('image') ? <ImagePlus className="w-4 h-4 text-blue-500 shrink-0" /> : <FileText className="w-4 h-4 text-orange-500 shrink-0" />}
                  <span className="text-xs text-gray-600 truncate flex-1">{f.name}</span>
                  <span className="text-[10px] text-gray-400">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="p-0.5 hover:bg-gray-200 rounded"><X className="w-3.5 h-3.5 text-gray-400" /></button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => fileInputRef.current?.click()} disabled={generating}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-orange-400 hover:bg-orange-50/30 transition disabled:opacity-50 mb-3"
            data-testid="podcast-upload-btn">
            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-500 font-medium">Add PDF or images (max 6 files)</p>
          </button>
          <input ref={fileInputRef} type="file" accept={ACCEPTED_FILES} multiple onChange={handleFiles} className="hidden" />
          <button onClick={generatePodcast} disabled={!files.length || generating}
            className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2"
            data-testid="generate-podcast-btn">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Podcast</>}
          </button>
          {generating && <p className="text-[10px] text-center text-gray-400 mt-2">This may take 1-3 minutes...</p>}
        </div>
      )}

      {podcast && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" data-testid="podcast-player">
          <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-5 text-white">
            <div className="flex justify-center items-center gap-6 mb-4">
              <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); }}
                className="p-2 hover:bg-white/20 rounded-full" data-testid="seek-back"><SkipBack className="w-5 h-5" /></button>
              <button onClick={() => { if (!audioRef.current) return; playing ? audioRef.current.pause() : audioRef.current.play().catch(() => {}); }}
                className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition" data-testid="play-pause-btn">
                {playing ? <Pause className="w-6 h-6 text-orange-600" /> : <Play className="w-6 h-6 text-orange-600 ml-0.5" />}
              </button>
              <button onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }}
                className="p-2 hover:bg-white/20 rounded-full" data-testid="seek-forward"><SkipForward className="w-5 h-5" /></button>
            </div>
            <div className="w-full bg-white/30 rounded-full h-1.5 cursor-pointer"
              onClick={e => { if (audioRef.current?.duration) audioRef.current.currentTime = (e.nativeEvent.offsetX / e.currentTarget.offsetWidth) * audioRef.current.duration; }}>
              <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {podcast.dialogue?.length > 0 && (
            <div className="p-4 max-h-64 overflow-y-auto" data-testid="podcast-transcript">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Transcript</h4>
              <div className="space-y-2">
                {podcast.dialogue.map((line, i) => (
                  <div key={`${line.speaker}-${i}`} className="flex gap-2 p-2 rounded-lg">
                    <span className={`text-[10px] font-bold shrink-0 mt-0.5 ${line.speaker === 'DIVYA' ? 'text-purple-500' : 'text-teal-500'}`}>{line.speaker}</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{line.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="p-4 border-t border-gray-100">
            <button onClick={() => { setPodcast(null); setFiles([]); setProgress(0); }}
              className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
              data-testid="new-podcast-btn">Generate New Podcast</button>
          </div>
        </div>
      )}
    </>
  );
};

/* ══════════════════════════════════════
   SHARED COMPONENTS
   ══════════════════════════════════════ */
const LoginPrompt = ({ navigate }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mt-4">
    <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <LogIn className="w-8 h-8 text-teal-600" />
    </div>
    <h2 className="text-lg font-bold text-gray-800 mb-2">Login Required</h2>
    <p className="text-sm text-gray-500 mb-5">Login to talk with Divya & Sher — your personal AI tutors!</p>
    <div className="flex gap-3 justify-center">
      <button onClick={() => navigate('/login')} className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm" data-testid="login-btn">Login</button>
      <button onClick={() => navigate('/signup')} className="border-2 border-teal-500 text-teal-600 px-6 py-2.5 rounded-xl font-semibold text-sm" data-testid="signup-btn">Sign Up Free</button>
    </div>
  </div>
);

const LiveSetup = ({ selectedLang, setSelectedLang, uploadedFiles, uploadingFiles, handleFileUpload, removeFiles, fileInputRef, startSession, pdfContext }) => (
  <>
    <div className="bg-[#0f1729] rounded-2xl p-6 mb-5 relative overflow-hidden" data-testid="tutor-hero">
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl" />
      <div className="relative z-10 text-center">
        <div className="flex justify-center -space-x-3 mb-3">
          <img src="/images/divya_avatar.png" alt="Divya" className="w-14 h-14 rounded-full border-3 border-[#0f1729] object-cover bg-purple-200" />
          <img src="/images/sher_avatar.png" alt="Sher" className="w-14 h-14 rounded-full border-3 border-[#0f1729] object-cover bg-teal-200" />
        </div>
        <h1 className="text-xl font-black text-white mb-1">AI Voice Tutor</h1>
        <p className="text-gray-400 text-sm">Talk to your tutor. They respond in voice!</p>
      </div>
    </div>
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4" data-testid="language-selector">
      <div className="flex items-center gap-2 mb-3">
        <Languages className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-bold text-gray-700">Choose Language</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map(l => (
          <button key={l.code} onClick={() => setSelectedLang(l.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedLang === l.code ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            data-testid={`lang-${l.code}`}>{l.flag} {l.label}</button>
        ))}
      </div>
    </div>
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5" data-testid="file-upload-section">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-bold text-gray-700">Study Material <span className="text-gray-400 font-normal">(optional)</span></h3>
        <span className="text-[10px] text-gray-400 ml-auto">PDF, JPG, PNG</span>
      </div>
      {uploadedFiles.length > 0 ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
          <FileText className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-xs text-green-700 font-medium truncate flex-1">{uploadedFiles.length} file(s): {uploadedFiles.join(', ')}</span>
          <span className="text-[10px] text-green-500">{pdfContext ? 'Ready' : 'Processing...'}</span>
          <button onClick={removeFiles} className="p-0.5 hover:bg-green-100 rounded"><X className="w-3.5 h-3.5 text-green-500" /></button>
        </div>
      ) : (
        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFiles}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-teal-400 hover:bg-teal-50/30 transition disabled:opacity-50"
          data-testid="upload-files-btn">
          {uploadingFiles ? <Loader2 className="w-6 h-6 text-teal-500 mx-auto mb-1 animate-spin" /> : <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />}
          <p className="text-xs text-gray-500 font-medium">{uploadingFiles ? 'Processing...' : 'Upload PDF or images'}</p>
        </button>
      )}
      <input ref={fileInputRef} type="file" accept={ACCEPTED_FILES} multiple onChange={handleFileUpload} className="hidden" />
    </div>
    <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">Choose Your Tutor</h3>
    <div className="grid grid-cols-2 gap-3 mb-6">
      {Object.entries(TUTORS).map(([key, t]) => (
        <button key={key} onClick={() => startSession(key)}
          className="bg-white rounded-2xl border-2 border-gray-200 p-4 text-center hover:shadow-lg hover:border-gray-300 transition-all group active:scale-95"
          data-testid={`tutor-${key}-btn`}>
          <div className="relative mx-auto w-20 h-20 mb-3">
            <img src={t.avatar} alt={t.name}
              className={`w-20 h-20 rounded-full object-cover border-3 ${t.border} group-hover:shadow-lg transition`}
              style={{ backgroundColor: key === 'divya' ? '#e9d5ff' : '#ccfbf1' }} />
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r ${t.bg} rounded-full flex items-center justify-center shadow-md`}>
              <Mic className="w-3 h-3 text-white" />
            </div>
          </div>
          <h4 className="text-sm font-bold text-gray-800">{t.name}</h4>
          <p className={`text-[10px] font-semibold ${t.text} mb-1`}>{t.tagline}</p>
          <p className="text-[10px] text-gray-400 leading-relaxed">{t.desc}</p>
        </button>
      ))}
    </div>
  </>
);

/* Message Bubble with play button */
const MsgBubble = ({ msg, tutor, selectedTutor, onPlayAudio, isSpeaking }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 text-white text-[11px] font-bold">You</div>
      ) : (
        <img src={tutor.avatar} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover"
          style={{ backgroundColor: selectedTutor === 'divya' ? '#e9d5ff' : '#ccfbf1' }} />
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isUser ? 'bg-gray-800 text-white rounded-tr-sm' : `${tutor.light} rounded-tl-sm`}`}>
        <p className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-700'}`}>{msg.text}</p>
        {onPlayAudio && !isUser && (
          <button onClick={onPlayAudio}
            className={`mt-1.5 flex items-center gap-1 text-[10px] font-semibold ${tutor.text} hover:opacity-70 transition`}
            data-testid="play-audio-btn">
            <Volume2 className="w-3 h-3" /> {isSpeaking ? 'Playing...' : 'Play audio'}
          </button>
        )}
      </div>
    </div>
  );
};

export default DivyaTutor;
