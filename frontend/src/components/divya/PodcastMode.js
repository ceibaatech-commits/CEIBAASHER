import React, { useState, useRef, useEffect } from 'react';
import { Radio, FileText, ImagePlus, X, Upload, Loader2, Sparkles, SkipBack, Play, Pause, SkipForward } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { BACKEND_URL, ACCEPTED_FILES } from './divyaConfig';

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

export default PodcastMode;
