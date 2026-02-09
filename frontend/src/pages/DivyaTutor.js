import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Mic, MicOff, FileText, Image, X, Play, Pause, Loader2, Volume2, SkipBack, SkipForward, MessageCircle, Send, Network, Hand } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const DivyaTutor = () => {
  const { user, logout } = useAuth();

  // Upload state
  const [files, setFiles] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');

  // Podcast state
  const [dialogue, setDialogue] = useState([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(-1);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Join conversation state
  const [joined, setJoined] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [answering, setAnswering] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Mind map state
  const [mindMap, setMindMap] = useState(null);
  const [generatingMap, setGeneratingMap] = useState(false);

  // Source content for follow-ups
  const [sourceContent, setSourceContent] = useState('');

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const dialogueRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll transcript to current line
  useEffect(() => {
    if (currentLine >= 0 && dialogueRef.current && !joined) {
      const el = dialogueRef.current.querySelector(`[data-line="${currentLine}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLine, joined]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Estimate current line from audio time
  useEffect(() => {
    if (!dialogue.length || !audioDuration) return;
    const totalChars = dialogue.reduce((sum, d) => sum + d.text.length, 0);
    let elapsed = 0;
    for (let i = 0; i < dialogue.length; i++) {
      elapsed += dialogue[i].text.length;
      if ((elapsed / totalChars) * audioDuration >= audioTime) {
        setCurrentLine(i);
        return;
      }
    }
    setCurrentLine(dialogue.length - 1);
  }, [audioTime, dialogue, audioDuration]);

  // File handling
  const handleFileAdd = (e) => {
    const newFiles = Array.from(e.target.files);
    const pdfCount = files.filter(f => f.type === 'application/pdf').length + newFiles.filter(f => f.type === 'application/pdf').length;
    const total = files.length + newFiles.length;
    if (pdfCount > 1) { toast.error('Only 1 PDF allowed'); return; }
    if (total > 6) { toast.error('Maximum 6 files (1 PDF + 5 images)'); return; }
    for (const f of newFiles) {
      if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name} exceeds 20MB`); return; }
      const ext = f.name.split('.').pop().toLowerCase();
      if (!['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        toast.error(`Unsupported: ${f.name}`); return;
      }
    }
    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  // Generate podcast
  const generatePodcast = async () => {
    if (!files.length) { toast.error('Upload at least one file'); return; }
    setGenerating(true);
    setProgress('Uploading files...');
    setDialogue([]);
    setAudioUrl('');
    setCurrentLine(-1);
    setMindMap(null);
    setConversationHistory([]);
    setJoined(false);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      if (prompt) formData.append('prompt', prompt);

      setProgress('Divya & Sher are reading your content...');
      const res = await axios.post(`${BACKEND_URL}/api/divya/generate-podcast`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000
      });

      if (res.data.success) {
        setDialogue(res.data.dialogue);
        // Convert base64 audio to blob URL (no server storage)
        const audioBlob = new Blob(
          [Uint8Array.from(atob(res.data.audio_base64), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        setAudioUrl(URL.createObjectURL(audioBlob));
        setSourceContent(res.data.dialogue.map(d => `${d.speaker}: ${d.text}`).join('\n'));
        toast.success('Podcast ready!');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Generation failed');
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  // Audio controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => toast.error('Audio playback failed'));
    setIsPlaying(!isPlaying);
  };

  const seekAudio = (sec) => {
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + sec);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  // Join conversation - Raise hand during audio
  const handleRaiseHand = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setJoined(true);
    // Only Divya welcomes the student
    setConversationHistory(prev => [...prev, {
      speaker: 'Divya',
      text: "Haan, bolo! I paused for you. What would you like to know about what we just discussed? Feel free to ask anything!"
    }]);
  };

  // Full join conversation (from button)
  const handleJoin = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setJoined(true);
    setConversationHistory(prev => [...prev, {
      speaker: 'Divya',
      text: "Welcome! You've joined our discussion. Feel free to ask any question about what we've covered, and I'll explain it to you!"
    }]);
  };

  // Send user question (text)
  const sendQuestion = async () => {
    const q = userQuestion.trim();
    if (!q || answering) return;
    setUserQuestion('');
    setConversationHistory(prev => [...prev, { speaker: 'You', text: q }]);
    await getAIResponse(q);
  };

  // Get AI response to user question
  const getAIResponse = useCallback(async (question) => {
    setAnswering(true);
    try {
      const context = sourceContent.substring(0, 3000);
      const recentChat = conversationHistory.slice(-6).map(c => `${c.speaker}: ${c.text}`).join('\n');

      const res = await axios.post(`${BACKEND_URL}/api/divya/ask`, {
        question,
        context,
        recent_chat: recentChat
      }, { timeout: 60000 });

      if (res.data.success) {
        setConversationHistory(prev => [...prev, ...res.data.responses]);
      }
    } catch (err) {
      setConversationHistory(prev => [...prev, {
        speaker: 'Divya',
        text: "I'm sorry, I couldn't process that. Could you try rephrasing your question?"
      }]);
    } finally {
      setAnswering(false);
    }
  }, [sourceContent, conversationHistory]);

  // Voice input
  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Speech recognition not supported'); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setUserQuestion(transcript);
      if (e.results[0].isFinal) {
        setIsListening(false);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  // Generate mind map
  const generateMindMap = async () => {
    if (generatingMap) return;
    setGeneratingMap(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/divya/mind-map`, {
        content: sourceContent.substring(0, 4000)
      }, { timeout: 60000 });

      if (res.data.success) {
        setMindMap(res.data.mind_map);
        toast.success('Mind map generated!');
      }
    } catch (err) {
      toast.error('Failed to generate mind map');
    } finally {
      setGeneratingMap(false);
    }
  };

  // Reset
  const resetAll = () => {
    setDialogue([]); setAudioUrl(''); setFiles([]); setPrompt('');
    setCurrentLine(-1); setMindMap(null); setConversationHistory([]);
    setJoined(false); setSourceContent('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={!!user} user={user} onLogout={logout} />

      <div className="max-w-4xl mx-auto px-4 py-6 pt-20">
        {/* Hero */}
        <div className="bg-[#0f1729] rounded-2xl p-5 sm:p-7 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex -space-x-3 flex-shrink-0">
              <img src="/images/divya_avatar.png" alt="Divya" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#0f1729] object-cover bg-purple-200" />
              <img src="/images/sher_avatar.png" alt="Sher" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#0f1729] object-cover bg-teal-200" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white">Divya & Sher</h1>
              <p className="text-gray-400 text-xs sm:text-sm">Upload your chapter. We'll turn it into a podcast you can join!</p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        {!dialogue.length && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-800 mb-2">Upload your study material</h2>
            <p className="text-xs text-gray-400 mb-3">1 PDF (max 30 pages) + up to 5 images</p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors mb-3"
              data-testid="file-drop-zone"
            >
              <Upload className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
              <p className="text-sm text-gray-500 font-medium">Click to upload</p>
              <p className="text-xs text-gray-400">PDF, PNG, JPG, WEBP</p>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileAdd} className="hidden" />
            </div>

            {files.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    {f.type === 'application/pdf' ? <FileText className="w-4 h-4 text-red-500 flex-shrink-0" /> : <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                    <span className="text-xs text-gray-700 truncate flex-1">{f.name}</span>
                    <span className="text-[10px] text-gray-400">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                    <button onClick={() => removeFile(i)} className="p-0.5 hover:bg-gray-200 rounded"><X className="w-3 h-3 text-gray-400" /></button>
                  </div>
                ))}
              </div>
            )}

            <input
              type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Focus area? e.g. 'Explain formulas simply'"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent mb-3"
              data-testid="prompt-input"
            />

            <button
              onClick={generatePodcast} disabled={generating || !files.length}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="generate-btn"
            >
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" />{progress}</> : <><Mic className="w-4 h-4" />Generate Podcast</>}
            </button>
          </div>
        )}

        {/* Results */}
        {dialogue.length > 0 && (
          <>
            {/* Audio Player — sticky */}
            {audioUrl && (
              <div className="bg-[#0f1729] rounded-2xl p-4 mb-4 sticky top-16 z-30" data-testid="audio-player">
                <audio
                  ref={audioRef} src={audioUrl} preload="auto"
                  onTimeUpdate={() => setAudioTime(audioRef.current?.currentTime || 0)}
                  onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)}
                  onEnded={() => { setIsPlaying(false); setCurrentLine(-1); }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={(e) => console.error('Audio error:', e)}
                />
                <div className="flex items-center gap-3">
                  <button onClick={() => seekAudio(-10)} className="p-1 text-gray-400 hover:text-white"><SkipBack className="w-4 h-4" /></button>
                  <button onClick={togglePlay} className="w-10 h-10 bg-teal-500 hover:bg-teal-400 rounded-full flex items-center justify-center transition flex-shrink-0" data-testid="play-pause-btn">
                    {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                  </button>
                  <button onClick={() => seekAudio(10)} className="p-1 text-gray-400 hover:text-white"><SkipForward className="w-4 h-4" /></button>

                  <div className="flex-1 min-w-0">
                    <div className="w-full h-1.5 bg-slate-700 rounded-full cursor-pointer" onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (audioRef.current) audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioDuration;
                    }}>
                      <div className="h-1.5 bg-teal-400 rounded-full transition-all" style={{ width: audioDuration ? `${(audioTime / audioDuration) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{formatTime(audioTime)} / {formatTime(audioDuration)}</span>
                  </div>

                  {/* Raise Hand button - always visible during audio, pulses when playing */}
                  {!joined && (
                    <button
                      onClick={handleRaiseHand}
                      className={`text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition flex-shrink-0 ${
                        isPlaying 
                          ? 'bg-amber-500 hover:bg-amber-400 animate-pulse shadow-lg shadow-amber-500/30' 
                          : 'bg-amber-600 hover:bg-amber-500'
                      }`}
                      data-testid="raise-hand-btn"
                      title="Raise your hand to ask a question"
                    >
                      <Hand className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isPlaying ? 'Ask Now' : 'Ask'}</span>
                    </button>
                  )}
                </div>
                
                {/* Hint text when playing */}
                {isPlaying && !joined && (
                  <p className="text-[10px] text-gray-500 mt-2 text-center">
                    💡 Tap "Ask Now" anytime to pause and ask Divya a question
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={generateMindMap} disabled={generatingMap}
                className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-xs hover:bg-gray-50 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                data-testid="mind-map-btn"
              >
                {generatingMap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Network className="w-3.5 h-3.5" />}
                Mind Map
              </button>
              {!joined && (
                <button
                  onClick={handleJoin}
                  className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 py-2.5 rounded-xl font-semibold text-xs hover:bg-amber-100 transition flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />Ask Divya
                </button>
              )}
              <button onClick={resetAll} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-xs hover:bg-gray-50 transition">
                New Upload
              </button>
            </div>

            {/* Improved Mind Map UI */}
            {mindMap && (
              <div className="bg-gradient-to-br from-slate-50 to-teal-50 rounded-2xl border border-teal-100 p-5 sm:p-6 mb-4 relative overflow-hidden" data-testid="mind-map-section">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-200/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl" />
                
                <div className="relative z-10">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center">
                      <Network className="w-3.5 h-3.5 text-white" />
                    </div>
                    Mind Map
                  </h3>
                  
                  {/* Central Topic */}
                  <div className="flex justify-center mb-5">
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl px-6 py-3 text-center font-bold text-sm shadow-lg shadow-teal-200 max-w-xs">
                      {mindMap.title}
                    </div>
                  </div>
                  
                  {/* Branches - Radial Layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mindMap.branches?.map((branch, i) => {
                      const colors = [
                        { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'bg-purple-500', text: 'text-purple-700', line: 'border-purple-300' },
                        { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'bg-blue-500', text: 'text-blue-700', line: 'border-blue-300' },
                        { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'bg-amber-500', text: 'text-amber-700', line: 'border-amber-300' },
                        { bg: 'bg-rose-50', border: 'border-rose-200', accent: 'bg-rose-500', text: 'text-rose-700', line: 'border-rose-300' },
                        { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-500', text: 'text-emerald-700', line: 'border-emerald-300' },
                        { bg: 'bg-indigo-50', border: 'border-indigo-200', accent: 'bg-indigo-500', text: 'text-indigo-700', line: 'border-indigo-300' },
                      ];
                      const c = colors[i % colors.length];
                      return (
                        <div key={i} className={`${c.bg} ${c.border} border rounded-xl p-3 transition-all hover:shadow-md`}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 ${c.accent} rounded-full`} />
                            <h4 className={`text-xs font-bold ${c.text}`}>{branch.label}</h4>
                          </div>
                          <ul className="space-y-1 ml-4">
                            {branch.children?.map((child, j) => (
                              <li key={j} className={`text-[11px] text-gray-600 pl-2.5 border-l-2 ${c.line} relative`}>
                                <span className={`absolute -left-[5px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 ${c.accent} rounded-full opacity-60`} />
                                {child}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Summary */}
                  {mindMap.summary && (
                    <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-600 italic leading-relaxed">
                        <span className="font-semibold text-teal-600">Summary:</span> {mindMap.summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Conversation with Divya (when joined) */}
            {joined && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-4" data-testid="conversation-section">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-500" />Ask Divya
                </h3>

                <div className="max-h-80 overflow-y-auto space-y-2.5 mb-3 pr-1">
                  {conversationHistory.map((msg, idx) => {
                    const isDivya = msg.speaker === 'Divya';
                    const isUser = msg.speaker === 'You';
                    return (
                      <div key={idx} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                        {isUser ? (
                          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">U</div>
                        ) : (
                          <img
                            src="/images/divya_avatar.png"
                            alt="Divya" className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
                            style={{ backgroundColor: '#e9d5ff' }}
                          />
                        )}
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                          isUser ? 'bg-blue-500 text-white' : 'bg-purple-50'
                        }`}>
                          <span className={`text-[10px] font-bold ${isUser ? 'text-blue-100' : 'text-purple-600'}`}>
                            {msg.speaker}
                          </span>
                          <p className={`text-xs leading-relaxed ${isUser ? 'text-white' : 'text-gray-700'}`}>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {answering && (
                    <div className="flex gap-2.5">
                      <img src="/images/divya_avatar.png" alt="Divya" className="w-7 h-7 rounded-full flex-shrink-0 object-cover bg-purple-200" />
                      <div className="bg-purple-50 rounded-xl px-3 py-2 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span className="text-[10px] text-purple-400">Divya is thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <button
                    onClick={toggleVoice}
                    className={`p-2.5 rounded-xl transition flex-shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    data-testid="voice-btn"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <input
                    type="text" value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendQuestion()}
                    placeholder="Ask Divya anything..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    data-testid="chat-input"
                  />
                  <button
                    onClick={sendQuestion} disabled={!userQuestion.trim() || answering}
                    className="p-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-400 transition disabled:opacity-50 flex-shrink-0"
                    data-testid="send-btn"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Dialogue Transcript */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-5" ref={dialogueRef}>
              <h3 className="text-sm font-bold text-gray-700 mb-3">Transcript</h3>
              <div className="space-y-2">
                {dialogue.map((line, idx) => {
                  const isDivya = line.speaker === 'Divya';
                  const isActive = idx === currentLine;
                  return (
                    <div
                      key={idx} data-line={idx} data-testid={`dialogue-line-${idx}`}
                      className={`flex gap-2.5 p-2.5 rounded-xl transition-colors cursor-pointer ${
                        isActive ? (isDivya ? 'bg-purple-50 ring-1 ring-purple-200' : 'bg-teal-50 ring-1 ring-teal-200') : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (!audioRef.current || !audioDuration) return;
                        const totalChars = dialogue.reduce((s, d) => s + d.text.length, 0);
                        let before = 0;
                        for (let i = 0; i < idx; i++) before += dialogue[i].text.length;
                        audioRef.current.currentTime = (before / totalChars) * audioDuration;
                        if (!isPlaying) { audioRef.current.play(); setIsPlaying(true); }
                      }}
                    >
                      <img src={isDivya ? '/images/divya_avatar.png' : '/images/sher_avatar.png'} alt={line.speaker}
                        className="w-7 h-7 rounded-full flex-shrink-0 object-cover" style={{ backgroundColor: isDivya ? '#e9d5ff' : '#ccfbf1' }} />
                      <div className="min-w-0">
                        <span className={`text-[10px] font-bold ${isDivya ? 'text-purple-600' : 'text-teal-600'}`}>{line.speaker}</span>
                        <p className="text-xs text-gray-700 leading-relaxed">{line.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DivyaTutor;
