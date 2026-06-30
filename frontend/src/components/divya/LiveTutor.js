import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Mic, VolumeX, StopCircle, Send, Loader2, Brain } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

import {
  BACKEND_URL,
  TUTORS,
  LEARNING_MODES,
  AUDIO_MODES,
  STUDENT_GOALS,
  GOAL_QUICK_PROMPTS,
  QUICK_PROMPTS
} from './divyaConfig';
import { audioMgr } from './AudioManager';
import QuizPanel from './QuizPanel';
import LiveSetup from './LiveSetup';
import MsgBubble from './MsgBubble';

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
  const [learningMode, setLearningMode] = useState('concept');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceMode, setVoiceMode] = useState('default');
  const [studentGoal, setStudentGoal] = useState('school');

  // Phase 2 — session_id returned by /api/divya/progress/session/start
  const sessionIdRef = useRef(null);

  // Phase 4 — Quiz mode
  const QUIZ_TOTAL = 5;
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizPicked, setQuizPicked] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const quizHistoryRef = useRef([]);

  const mediaRecorderRef = useRef(null);
  const recordTimerRef = useRef(null);
  const chunksRef = useRef([]);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  useEffect(() => () => {
    audioMgr.stop();
    stopRecording();
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
  }, []);

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
        timeout: 120000,
      });
      if (res.data.success) {
        setPdfContext(res.data.context || '');
        if (Array.isArray(res.data.warnings) && res.data.warnings.length) {
          toast.warning(res.data.warnings[0]);
        }
        toast.success(`${files.length} file(s): ${res.data.char_count || 0} chars extracted`);
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.message;
      toast.error(detail || 'Failed to process files');
      setPdfContext('');
      setUploadedFiles([]);
    } finally { setUploadingFiles(false); }
  };

  const removeFiles = () => { setPdfContext(''); setUploadedFiles([]); if (fileInputRef.current) fileInputRef.current.value = ''; };

  /* ─── Session ─── */
  const startSession = async (tutor) => {
    audioMgr.warmUp();
    setSelectedTutor(tutor);
    setSessionActive(true);
    onSessionChange?.(true);

    const baseGreeting = tutor === 'divya'
      ? `Namaste! I'm Divya. ${pdfContext ? "I've read your material — ask me anything!" : "Upload a file or ask me any question!"}`
      : `Hey! I'm Sher. ${pdfContext ? "I've reviewed your material — let's ace those exams!" : "Upload a file or fire your doubts!"}`;
    setMessages([{ role: 'tutor', text: baseGreeting }]);

    // Phase 2 — start a backend-tracked session (best-effort, anonymous-safe)
    try {
      const res = await axios.post(`${BACKEND_URL}/api/divya/progress/session/start`,
        { tutor, language: selectedLang, pdf_name: uploadedFiles[0] || null },
        { withCredentials: true });
      if (res.data?.session_id) sessionIdRef.current = res.data.session_id;
    } catch { /* not logged in or backend down — ignore, continue without tracking */ }

    // Weakest-topic drill suggestion (silent if no quiz history yet)
    try {
      const w = await axios.get(`${BACKEND_URL}/api/divya/progress/weakest-topics?limit=1`, { withCredentials: true });
      const weak = w.data?.weakest?.[0];
      if (weak && weak.label && weak.avg_percentage < 75) {
        const suggestion = tutor === 'divya'
          ? `Hey — I noticed your ${weak.label} average is ${weak.avg_percentage}% across ${weak.attempts} quiz${weak.attempts === 1 ? '' : 'zes'}. Want me to drill you on it? Just tap the Quiz button up top whenever you're ready! 💪`
          : `Quick heads-up champ — your ${weak.label} avg is sitting at ${weak.avg_percentage}% (${weak.attempts} attempt${weak.attempts === 1 ? '' : 's'}). Tap Quiz to drill it now — that's how you climb the ranks. 🎯`;
        setMessages(prev => [...prev, { role: 'tutor', text: suggestion, drill: true }]);
      }
    } catch { /* not logged in or no history — ignore */ }
  };

  const endSession = async () => {
    audioMgr.stop(); stopRecording();
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setRecordSeconds(0);
    const sid = sessionIdRef.current;
    sessionIdRef.current = null;
    setSessionActive(false);
    onSessionChange?.(false);
    setSelectedTutor(null);
    setMessages([]);
    setIsProcessing(false);
    setQuizMode(false);
    setQuizQuestion(null);
    setQuizScore(0);
    setQuizPicked(null);
    quizHistoryRef.current = [];
    if (sid) {
      try { await axios.post(`${BACKEND_URL}/api/divya/progress/session/end`, { session_id: sid }, { withCredentials: true }); } catch { /* ignore */ }
    }
  };

  /* ─── Phase 4: Quiz Mode ─── */
  const fetchQuizQuestion = async (qNumber) => {
    setQuizLoading(true);
    setQuizPicked(null);
    setQuizQuestion(null);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/divya/live/quiz`, {
        tutor: selectedTutor,
        language: selectedLang,
        context: pdfContext || '',
        question_number: qNumber,
        total_questions: QUIZ_TOTAL,
        previous_qa: quizHistoryRef.current,
      }, { timeout: 60000 });
      if (res.data?.success) {
        setQuizQuestion(res.data);
        if (res.data.audio_base64) playMessageAudio(res.data.audio_base64);
      } else {
        toast.error('Could not load question — try again');
      }
    } catch {
      toast.error('Quiz failed. Try again?');
    } finally {
      setQuizLoading(false);
    }
  };

  const startQuiz = async () => {
    audioMgr.warmUp();
    setQuizMode(true);
    setQuizScore(0);
    setQuizPicked(null);
    quizHistoryRef.current = [];
    await fetchQuizQuestion(1);
  };

  const pickQuizOption = (idx) => {
    if (quizPicked !== null || !quizQuestion) return;
    setQuizPicked(idx);
    const correct = idx === quizQuestion.correct_index;
    if (correct) setQuizScore((s) => s + 1);
    quizHistoryRef.current = [
      ...quizHistoryRef.current,
      { question: quizQuestion.question, user_answer: quizQuestion.options[idx], correct },
    ];
  };

  const nextQuizQuestion = async () => {
    const nextNum = (quizQuestion?.question_number || 0) + 1;
    if (nextNum > QUIZ_TOTAL) {
      // Quiz complete — persist attempt (best-effort, requires auth)
      try {
        await axios.post(`${BACKEND_URL}/api/divya/progress/quiz`, {
          session_id: sessionIdRef.current,
          tutor: selectedTutor,
          language: selectedLang,
          score: quizScore,
          total_questions: QUIZ_TOTAL,
        }, { withCredentials: true });
      } catch { /* ignore */ }
      setQuizQuestion({ ...quizQuestion, complete: true });
      return;
    }
    await fetchQuizQuestion(nextNum);
  };

  const exitQuiz = () => {
    audioMgr.stop();
    setQuizMode(false);
    setQuizQuestion(null);
    setQuizPicked(null);
  };

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
      const modeGuidance = LEARNING_MODES[learningMode]?.guidance || LEARNING_MODES.concept.guidance;
      const guidedText = `${userText}\n\n[Student Preference]\nLearning mode: ${LEARNING_MODES[learningMode]?.label || 'Concept'}\nGuidance: ${modeGuidance}`;
      const payload = {
        text: guidedText,
        tutor: selectedTutor,
        language: selectedLang,
        context: pdfContext || '',
        chat_history: Array.isArray(chatHistory) ? chatHistory : [],
        voice_mode: voiceMode || 'default',
        student_goal: studentGoal || null,
      };
      const res = await axios.post(`${BACKEND_URL}/api/divya/live/ask`, payload, { timeout: 60000 });

      if (res.data.success) {
        const audioB64 = res.data.audio_base64 || null;
        setMessages(prev => [...prev, { role: 'tutor', text: res.data.text, audio: audioB64 }]);
        if (audioB64 && autoSpeak) playMessageAudio(audioB64);
        // Phase 2 — log this exchange (user + tutor = 2 messages)
        const sid = sessionIdRef.current;
        if (sid) {
          axios.post(`${BACKEND_URL}/api/divya/progress/session/log-message`, { session_id: sid, role: 'user' }, { withCredentials: true }).catch(() => {});
          axios.post(`${BACKEND_URL}/api/divya/progress/session/log-message`, { session_id: sid, role: 'tutor' }, { withCredentials: true }).catch(() => {});
        }
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || "couldn't process that";
      console.error('[Divya Error]', detail);
      setMessages(prev => [...prev, { role: 'tutor', text: `Sorry, ${detail}. Try again?` }]);
    } finally { setIsProcessing(false); }
  }, [
    isProcessing,
    messages,
    selectedTutor,
    selectedLang,
    pdfContext,
    learningMode,
    autoSpeak,
    voiceMode,
    studentGoal,
  ]);

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
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        setRecordSeconds(0);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 1000) await transcribeAndSend(blob);
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds(prev => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      const denied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      const unavailable = err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError';
      if (denied) toast.error('Microphone permission denied. Please allow mic access.');
      else if (unavailable) toast.error('No microphone detected on this device.');
      else toast.error('Could not start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
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
      if (selectedLang) fd.append('language', selectedLang);
      const res = await axios.post(`${BACKEND_URL}/api/divya/live/transcribe`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000,
      });
      if (res.data.success && res.data.text) await sendMessage(res.data.text);
      else { toast.error("Couldn't understand. Try again."); setIsProcessing(false); }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 413) toast.error('Audio too long. Keep each recording under 1 minute.');
      else if (status === 429) toast.error('Voice service is busy right now. Please retry in a moment.');
      else toast.error('Transcription failed. Try typing.');
      setIsProcessing(false);
    }
  };

  const tutor = selectedTutor ? TUTORS[selectedTutor] : null;
  const sessionStatus = isRecording
    ? `Listening... ${recordSeconds}s`
    : isSpeaking
      ? 'Speaking...'
      : isProcessing
        ? 'Thinking...'
        : 'Ready for your question';

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
            <img src={tutor?.avatar} alt={tutor?.name} className="w-10 h-10 rounded-full object-cover border-2"
              style={{ borderColor: isSpeaking ? (selectedTutor === 'divya' ? '#a855f7' : '#14b8a6') : '#e5e7eb',
                backgroundColor: selectedTutor === 'divya' ? '#e9d5ff' : '#ccfbf1' }} />
            {isSpeaking && <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${tutor?.pulse} rounded-full animate-pulse border-2 border-white`} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-800">{tutor?.name}</h3>
            <p className="text-[10px] text-gray-400">{sessionStatus}</p>
          </div>
          {!quizMode && (
            <button
              onClick={startQuiz}
              disabled={isProcessing}
              data-testid="start-quiz-btn"
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              <Brain className="w-3.5 h-3.5" /> Quiz
            </button>
          )}
          {isSpeaking && (
            <button onClick={() => audioMgr.stop()} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg" data-testid="stop-audio-btn">
              <VolumeX className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>

        {/* Quiz overlay — replaces chat when active */}
        {quizMode ? (
          <QuizPanel
            tutor={tutor}
            totalQuestions={QUIZ_TOTAL}
            quizQuestion={quizQuestion}
            quizPicked={quizPicked}
            quizScore={quizScore}
            quizLoading={quizLoading}
            onPick={pickQuizOption}
            onNext={nextQuizQuestion}
            onExit={exitQuiz}
          />
        ) : (
          <>
            <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-100 -mx-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[11px] font-semibold text-gray-500">Learning mode</p>
                <button
                  onClick={() => setAutoSpeak(prev => !prev)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition ${autoSpeak ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                  data-testid="auto-speak-toggle"
                >
                  {autoSpeak ? 'Auto voice ON' : 'Auto voice OFF'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2" data-testid="learning-mode-selector">
                {Object.entries(LEARNING_MODES).map(([key, mode]) => (
                  <button
                    key={key}
                    onClick={() => setLearningMode(key)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${learningMode === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    data-testid={`learning-mode-${key}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2" data-testid="voice-mode-selector">
                <p className="text-[11px] font-semibold text-gray-500 mr-1">Voice mode</p>
                {Object.entries(AUDIO_MODES).map(([key, mode]) => (
                  <button
                    key={key}
                    onClick={() => setVoiceMode(key)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${voiceMode === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    data-testid={`voice-mode-${key}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2" data-testid="student-goal-selector">
                <p className="text-[11px] font-semibold text-gray-500 mr-1">Target</p>
                {Object.entries(STUDENT_GOALS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setStudentGoal(key)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${studentGoal === key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    data-testid={`student-goal-${key}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
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
                  <img src={tutor?.avatar} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover"
                    style={{ backgroundColor: selectedTutor === 'divya' ? '#e9d5ff' : '#ccfbf1' }} />
                  <div className={`${tutor?.light} rounded-2xl rounded-tl-sm px-4 py-3`}>
                    <div className="flex gap-1.5">
                      {[0, 150, 300].map(d => <span key={d} className={`w-2 h-2 ${tutor?.pulse} rounded-full animate-bounce`} style={{ animationDelay: `${d}ms` }} />)}
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
                    isRecording ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : `bg-gradient-to-r ${tutor?.bg} hover:opacity-90 shadow-gray-200`}`}
                  data-testid="mic-button">
                  {isRecording ? <StopCircle className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
                  {isRecording && <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mb-3">
                {isRecording ? `Listening... ${recordSeconds}s (auto-stop at 60s)` : isSpeaking ? 'Tap mic to interrupt' : 'Tap mic to speak'}
              </p>
              {!isRecording && !isProcessing && (
                <div className="flex flex-wrap gap-1.5 justify-center mb-3" data-testid="quick-prompt-row">
                  {(GOAL_QUICK_PROMPTS[studentGoal] || QUICK_PROMPTS).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInputText(prompt)}
                      className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold hover:bg-gray-200 transition"
                      data-testid={`quick-prompt-${prompt.substring(0, 20)}`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(inputText)}
                  placeholder={`Ask ${tutor?.name} anything...`}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                  disabled={isProcessing} data-testid="text-input" />
                <button onClick={() => sendMessage(inputText)} disabled={!inputText.trim() || isProcessing}
                  className={`p-2.5 bg-gradient-to-r ${tutor?.bg} text-white rounded-xl hover:opacity-90 disabled:opacity-40 shrink-0`}
                  data-testid="send-btn">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveTutor;