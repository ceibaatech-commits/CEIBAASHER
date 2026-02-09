import React, { useState, useRef, useEffect } from 'react';
import { Upload, Mic, FileText, Image, X, Play, Pause, Loader2, Volume2, SkipBack, SkipForward } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const DivyaTutor = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [dialogue, setDialogue] = useState([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(-1);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const dialogueRef = useRef(null);

  // Auto-scroll to current line
  useEffect(() => {
    if (currentLine >= 0 && dialogueRef.current) {
      const el = dialogueRef.current.querySelector(`[data-line="${currentLine}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLine]);

  // Estimate which line is playing based on audio time
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
        toast.error(`Unsupported: ${f.name}. Use PDF or images.`);
        return;
      }
    }
    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const generatePodcast = async () => {
    if (!files.length) { toast.error('Upload at least one file'); return; }
    setGenerating(true);
    setProgress('Uploading files...');
    setDialogue([]);
    setAudioUrl('');
    setCurrentLine(-1);

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
        setAudioUrl(`${BACKEND_URL}${res.data.audio_url}`);
        setProgress('');
        toast.success('Podcast ready! Hit play to listen.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Generation failed. Try again.');
      setProgress('');
    } finally {
      setGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const seekAudio = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={!!user} user={user} onLogout={logout} />

      <div className="max-w-4xl mx-auto px-4 py-6 pt-20">
        {/* Hero */}
        <div className="bg-[#0f1729] rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center gap-4 sm:gap-6">
            <div className="flex -space-x-3 flex-shrink-0">
              <img src="/images/divya_avatar.png" alt="Divya" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#0f1729] object-cover bg-purple-200" />
              <img src="/images/sher_avatar.png" alt="Sher" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#0f1729] object-cover bg-teal-200" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Divya & Sher</h1>
              <p className="text-gray-400 text-xs sm:text-sm">Upload a chapter PDF or screenshots. We'll explain it as a podcast!</p>
            </div>
          </div>
        </div>

        {/* Upload Section (only if no result yet) */}
        {!dialogue.length && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-6">
            <h2 className="text-base font-bold text-gray-800 mb-3">Upload your study material</h2>
            <p className="text-xs text-gray-400 mb-4">1 PDF (max 30 pages) + up to 5 images (screenshots, photos)</p>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors mb-4"
              data-testid="file-drop-zone"
            >
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">Click to upload files</p>
              <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, WEBP</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileAdd}
                className="hidden"
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2 mb-4">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                    {f.type === 'application/pdf'
                      ? <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                      : <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    }
                    <span className="text-sm text-gray-700 truncate flex-1">{f.name}</span>
                    <span className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                    <button onClick={() => removeFile(i)} className="p-1 hover:bg-gray-200 rounded">
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Optional prompt */}
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Any specific focus? e.g. 'Explain the formulas simply'"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent mb-4"
              data-testid="prompt-input"
            />

            <button
              onClick={generatePodcast}
              disabled={generating || !files.length}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="generate-btn"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{progress}</>
              ) : (
                <><Mic className="w-4 h-4" />Generate Podcast</>
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {dialogue.length > 0 && (
          <>
            {/* Audio Player */}
            {audioUrl && (
              <div className="bg-[#0f1729] rounded-2xl p-4 sm:p-5 mb-4 sticky top-16 z-30" data-testid="audio-player">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={() => setAudioTime(audioRef.current?.currentTime || 0)}
                  onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)}
                  onEnded={() => { setIsPlaying(false); setCurrentLine(-1); }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex -space-x-2 flex-shrink-0">
                    <img src="/images/divya_avatar.png" alt="D" className="w-9 h-9 rounded-full border-2 border-[#0f1729] object-cover bg-purple-200" />
                    <img src="/images/sher_avatar.png" alt="S" className="w-9 h-9 rounded-full border-2 border-[#0f1729] object-cover bg-teal-200" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <button onClick={() => seekAudio(-10)} className="p-1 text-gray-400 hover:text-white">
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button
                        onClick={togglePlay}
                        className="w-10 h-10 bg-teal-500 hover:bg-teal-400 rounded-full flex items-center justify-center transition"
                        data-testid="play-pause-btn"
                      >
                        {isPlaying
                          ? <Pause className="w-5 h-5 text-white" />
                          : <Play className="w-5 h-5 text-white ml-0.5" />
                        }
                      </button>
                      <button onClick={() => seekAudio(10)} className="p-1 text-gray-400 hover:text-white">
                        <SkipForward className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-400 font-mono ml-1">
                        {formatTime(audioTime)} / {formatTime(audioDuration)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="w-full h-1.5 bg-slate-700 rounded-full cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        if (audioRef.current) audioRef.current.currentTime = pct * audioDuration;
                      }}
                    >
                      <div
                        className="h-1.5 bg-teal-400 rounded-full transition-all duration-200"
                        style={{ width: audioDuration ? `${(audioTime / audioDuration) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>

                  <Volume2 className="w-4 h-4 text-gray-500 flex-shrink-0 hidden sm:block" />
                </div>
              </div>
            )}

            {/* Dialogue Transcript */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-6" ref={dialogueRef}>
              <h3 className="text-sm font-bold text-gray-700 mb-4">Transcript</h3>
              <div className="space-y-3">
                {dialogue.map((line, idx) => {
                  const isDivya = line.speaker === 'Divya';
                  const isActive = idx === currentLine;
                  return (
                    <div
                      key={idx}
                      data-line={idx}
                      data-testid={`dialogue-line-${idx}`}
                      className={`flex gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
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
                      <img
                        src={isDivya ? '/images/divya_avatar.png' : '/images/sher_avatar.png'}
                        alt={line.speaker}
                        className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                        style={{ backgroundColor: isDivya ? '#e9d5ff' : '#ccfbf1' }}
                      />
                      <div className="min-w-0">
                        <span className={`text-xs font-bold ${isDivya ? 'text-purple-600' : 'text-teal-600'}`}>
                          {line.speaker}
                        </span>
                        <p className="text-sm text-gray-700 leading-relaxed">{line.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* New podcast button */}
            <button
              onClick={() => { setDialogue([]); setAudioUrl(''); setFiles([]); setPrompt(''); setCurrentLine(-1); }}
              className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition mb-6"
              data-testid="new-podcast-btn"
            >
              Upload New Material
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DivyaTutor;
