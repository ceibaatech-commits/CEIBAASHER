import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Mic, MicOff, FileText, Image, X, Loader2, Volume2, VolumeX, MessageCircle, Send, LogIn, ChevronLeft, Languages, Sparkles, StopCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/* ─── Language & Tutor Config ─── */
const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', flag: '🇮🇳' },
];

const TUTORS = {
  divya: {
    name: 'Divya',
    tagline: 'Warm & Encouraging',
    desc: 'Explains with examples & analogies. Makes learning fun!',
    avatar: '/images/divya_avatar.png',
    color: 'purple',
    bg: 'from-purple-500 to-pink-500',
    light: 'bg-purple-50',
    border: 'border-purple-200',
    ring: 'ring-purple-400',
    text: 'text-purple-600',
    pulse: 'bg-purple-400',
  },
  sher: {
    name: 'Sher',
    tagline: 'Sharp & Exam-Focused',
    desc: 'Mnemonics, tricks & strategies to ace your exams.',
    avatar: '/images/sher_avatar.png',
    color: 'teal',
    bg: 'from-teal-500 to-cyan-500',
    light: 'bg-teal-50',
    border: 'border-teal-200',
    ring: 'ring-teal-400',
    text: 'text-teal-600',
    pulse: 'bg-teal-400',
  },
};

/* ─── Main Component ─── */
const DivyaTutor = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const isLoggedIn = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;

  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [pdfContext, setPdfContext] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Conversation state
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');

  // Audio refs
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      stopRecording();
    };
  }, []);

  /* ─── PDF Upload ─── */
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large (max 20MB)');
      return;
    }

    setUploadingPdf(true);
    setPdfName(file.name);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const res = await axios.post(`${BACKEND_URL}/api/divya/live/upload-context`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      if (res.data.success) {
        setPdfContext(res.data.context);
        toast.success(`PDF loaded: ${res.data.char_count} chars extracted`);
      }
    } catch (err) {
      toast.error('Failed to process PDF');
      setPdfName('');
    } finally {
      setUploadingPdf(false);
    }
  };

  const removePdf = () => {
    setPdfContext('');
    setPdfName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ─── Start Session ─── */
  const startSession = (tutor) => {
    setSelectedTutor(tutor);
    setSessionActive(true);
    const t = TUTORS[tutor];
    setMessages([{
      role: 'tutor',
      text: tutor === 'divya'
        ? `Namaste! I'm Divya. ${pdfContext ? "I've read your study material — ask me anything about it!" : "Upload a PDF or just ask me any question. I'm here to help you learn!"}`
        : `Hey! I'm Sher. ${pdfContext ? "I've gone through your material — let's crack those exam questions!" : "Upload a PDF or fire away with your doubts. Let's get you exam-ready!"}`,
    }]);
  };

  /* ─── End Session ─── */
  const endSession = () => {
    stopAudio();
    stopRecording();
    setSessionActive(false);
    setSelectedTutor(null);
    setMessages([]);
    setIsProcessing(false);
  };

  /* ─── Audio Playback ─── */
  const playAudio = (base64Audio) => {
    stopAudio();
    try {
      const audioBytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const blob = new Blob([audioBytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.play().catch(() => setIsSpeaking(false));
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  /* ─── Send Message (Text) ─── */
  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isProcessing) return;
    const userText = text.trim();
    setInputText('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsProcessing(true);

    // Build chat history for context
    const chatHistory = messages.slice(-8).map(m => ({
      role: m.role === 'user' ? 'Student' : TUTORS[selectedTutor]?.name || 'Tutor',
      text: m.text,
    }));

    try {
      const res = await axios.post(`${BACKEND_URL}/api/divya/live/ask`, {
        text: userText,
        tutor: selectedTutor,
        language: selectedLang,
        context: pdfContext,
        chat_history: chatHistory,
      }, { timeout: 60000 });

      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'tutor', text: res.data.text }]);
        if (res.data.audio_base64) {
          playAudio(res.data.audio_base64);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'tutor',
        text: "Sorry, I couldn't process that. Could you try again?",
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, messages, selectedTutor, selectedLang, pdfContext]);

  /* ─── Voice Recording ─── */
  const startRecording = async () => {
    // Barge-in: stop tutor audio if playing
    stopAudio();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 1000) {
          await transcribeAndSend(blob);
        }
      };

      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  /* ─── Transcribe Audio & Send ─── */
  const transcribeAndSend = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      const res = await axios.post(`${BACKEND_URL}/api/divya/live/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      if (res.data.success && res.data.text) {
        await sendMessage(res.data.text);
      } else {
        toast.error("Couldn't understand the audio. Please try again.");
        setIsProcessing(false);
      }
    } catch (err) {
      toast.error('Transcription failed. Try typing instead.');
      setIsProcessing(false);
    }
  };

  const tutor = selectedTutor ? TUTORS[selectedTutor] : null;

  /* ─── RENDER ─── */
  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={isLoggedIn} user={user} onLogout={logout} />

      <div className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        {/* Login Gate */}
        {!isLoggedIn ? (
          <LoginPrompt navigate={navigate} />
        ) : !sessionActive ? (
          /* ─── Setup Screen ─── */
          <SetupScreen
            selectedLang={selectedLang}
            setSelectedLang={setSelectedLang}
            pdfName={pdfName}
            pdfContext={pdfContext}
            uploadingPdf={uploadingPdf}
            handlePdfUpload={handlePdfUpload}
            removePdf={removePdf}
            fileInputRef={fileInputRef}
            startSession={startSession}
          />
        ) : (
          /* ─── Conversation Screen ─── */
          <ConversationScreen
            tutor={tutor}
            selectedTutor={selectedTutor}
            messages={messages}
            isProcessing={isProcessing}
            isSpeaking={isSpeaking}
            isRecording={isRecording}
            inputText={inputText}
            setInputText={setInputText}
            sendMessage={sendMessage}
            toggleRecording={toggleRecording}
            stopAudio={stopAudio}
            endSession={endSession}
            chatEndRef={chatEndRef}
            pdfName={pdfName}
          />
        )}
      </div>
    </div>
  );
};

/* ─── Login Prompt ─── */
const LoginPrompt = ({ navigate }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mt-4">
    <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <LogIn className="w-8 h-8 text-teal-600" />
    </div>
    <h2 className="text-lg font-bold text-gray-800 mb-2">Login Required</h2>
    <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
      Login to talk with Divya & Sher — your personal AI tutors who respond in voice!
    </p>
    <div className="flex gap-3 justify-center">
      <button onClick={() => navigate('/login')} className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm" data-testid="login-btn">Login</button>
      <button onClick={() => navigate('/signup')} className="border-2 border-teal-500 text-teal-600 px-6 py-2.5 rounded-xl font-semibold text-sm" data-testid="signup-btn">Sign Up Free</button>
    </div>
  </div>
);

/* ─── Setup Screen ─── */
const SetupScreen = ({ selectedLang, setSelectedLang, pdfName, pdfContext, uploadingPdf, handlePdfUpload, removePdf, fileInputRef, startSession }) => (
  <>
    {/* Hero */}
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

    {/* Language Selection */}
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4" data-testid="language-selector">
      <div className="flex items-center gap-2 mb-3">
        <Languages className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-bold text-gray-700">Choose Language</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => setSelectedLang(lang.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedLang === lang.code
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            data-testid={`lang-${lang.code}`}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>
    </div>

    {/* PDF Upload (Optional) */}
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5" data-testid="pdf-upload-section">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-bold text-gray-700">Study Material <span className="text-gray-400 font-normal">(optional)</span></h3>
      </div>
      {pdfName ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
          <FileText className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-xs text-green-700 font-medium truncate flex-1">{pdfName}</span>
          <span className="text-[10px] text-green-500">{pdfContext ? 'Ready' : 'Processing...'}</span>
          <button onClick={removePdf} className="p-0.5 hover:bg-green-100 rounded"><X className="w-3.5 h-3.5 text-green-500" /></button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingPdf}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-colors disabled:opacity-50"
          data-testid="upload-pdf-btn"
        >
          {uploadingPdf ? (
            <Loader2 className="w-6 h-6 text-teal-500 mx-auto mb-1 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
          )}
          <p className="text-xs text-gray-500 font-medium">{uploadingPdf ? 'Processing PDF...' : 'Upload PDF (max 30 pages)'}</p>
        </button>
      )}
      <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
    </div>

    {/* Tutor Selection */}
    <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">Choose Your Tutor</h3>
    <div className="grid grid-cols-2 gap-3 mb-6">
      {Object.entries(TUTORS).map(([key, t]) => (
        <button
          key={key}
          onClick={() => startSession(key)}
          className="bg-white rounded-2xl border-2 border-gray-200 p-4 text-center hover:shadow-lg hover:border-gray-300 transition-all group active:scale-95"
          data-testid={`tutor-${key}-btn`}
        >
          <div className="relative mx-auto w-20 h-20 mb-3">
            <img
              src={t.avatar}
              alt={t.name}
              className={`w-20 h-20 rounded-full object-cover border-3 ${t.border} group-hover:shadow-lg transition-all`}
              style={{ backgroundColor: key === 'divya' ? '#e9d5ff' : '#ccfbf1' }}
            />
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

/* ─── Conversation Screen ─── */
const ConversationScreen = ({ tutor, selectedTutor, messages, isProcessing, isSpeaking, isRecording, inputText, setInputText, sendMessage, toggleRecording, stopAudio, endSession, chatEndRef, pdfName }) => (
  <div className="flex flex-col" style={{ height: 'calc(100vh - 6rem)' }}>
    {/* Top Bar */}
    <div className="flex items-center gap-3 py-3 border-b border-gray-200 bg-white rounded-t-2xl px-4 shrink-0">
      <button onClick={endSession} className="p-1.5 hover:bg-gray-100 rounded-lg transition" data-testid="end-session-btn">
        <ChevronLeft className="w-5 h-5 text-gray-500" />
      </button>
      <div className="relative">
        <img
          src={tutor.avatar}
          alt={tutor.name}
          className="w-10 h-10 rounded-full object-cover border-2"
          style={{
            borderColor: isSpeaking ? (selectedTutor === 'divya' ? '#a855f7' : '#14b8a6') : '#e5e7eb',
            backgroundColor: selectedTutor === 'divya' ? '#e9d5ff' : '#ccfbf1',
          }}
        />
        {isSpeaking && (
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${tutor.pulse} rounded-full animate-pulse border-2 border-white`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-gray-800">{tutor.name}</h3>
        <p className="text-[10px] text-gray-400">
          {isSpeaking ? 'Speaking...' : isProcessing ? 'Thinking...' : 'Listening'}
          {pdfName && ` · ${pdfName}`}
        </p>
      </div>
      {isSpeaking && (
        <button
          onClick={stopAudio}
          className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition"
          data-testid="stop-audio-btn"
          title="Stop speaking"
        >
          <VolumeX className="w-4 h-4 text-red-500" />
        </button>
      )}
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50" data-testid="chat-messages">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} msg={msg} tutor={tutor} selectedTutor={selectedTutor} />
      ))}
      {isProcessing && (
        <div className="flex gap-2.5">
          <img src={tutor.avatar} alt={tutor.name} className="w-8 h-8 rounded-full shrink-0 object-cover"
            style={{ backgroundColor: selectedTutor === 'divya' ? '#e9d5ff' : '#ccfbf1' }} />
          <div className={`${tutor.light} rounded-2xl rounded-tl-sm px-4 py-3`}>
            <div className="flex gap-1.5">
              <span className={`w-2 h-2 ${tutor.pulse} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
              <span className={`w-2 h-2 ${tutor.pulse} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
              <span className={`w-2 h-2 ${tutor.pulse} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>

    {/* Input Area */}
    <div className="bg-white border-t border-gray-200 px-4 py-3 rounded-b-2xl shrink-0">
      {/* Mic Button */}
      <div className="flex items-center justify-center mb-3">
        <button
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 disabled:opacity-50 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
              : `bg-gradient-to-r ${tutor.bg} hover:opacity-90 shadow-gray-200`
          }`}
          data-testid="mic-button"
        >
          {isRecording ? (
            <StopCircle className="w-7 h-7 text-white" />
          ) : (
            <Mic className="w-7 h-7 text-white" />
          )}
          {isRecording && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
          )}
        </button>
      </div>
      <p className="text-[10px] text-gray-400 text-center mb-3">
        {isRecording ? 'Listening... Tap to stop' : isSpeaking ? 'Tap mic to interrupt' : 'Tap mic to speak'}
      </p>

      {/* Text Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
          placeholder={`Ask ${tutor.name} anything...`}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-300 focus:border-transparent"
          disabled={isProcessing}
          data-testid="text-input"
        />
        <button
          onClick={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isProcessing}
          className={`p-2.5 bg-gradient-to-r ${tutor.bg} text-white rounded-xl hover:opacity-90 transition disabled:opacity-40 shrink-0`}
          data-testid="send-btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

/* ─── Message Bubble ─── */
const MessageBubble = ({ msg, tutor, selectedTutor }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 text-white text-[11px] font-bold">
          You
        </div>
      ) : (
        <img
          src={tutor.avatar}
          alt={tutor.name}
          className="w-8 h-8 rounded-full shrink-0 object-cover"
          style={{ backgroundColor: selectedTutor === 'divya' ? '#e9d5ff' : '#ccfbf1' }}
        />
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-gray-800 text-white rounded-tr-sm'
            : `${tutor.light} rounded-tl-sm`
        }`}
      >
        <p className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-700'}`}>{msg.text}</p>
      </div>
    </div>
  );
};

export default DivyaTutor;
