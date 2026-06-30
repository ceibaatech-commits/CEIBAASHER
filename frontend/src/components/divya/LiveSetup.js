import React from 'react';
import { Languages, FileText, X, Loader2, Upload, Mic } from 'lucide-react';
import { LANGUAGES, TUTORS, ACCEPTED_FILES } from './divyaConfig';

const LiveSetup = ({
  selectedLang,
  setSelectedLang,
  uploadedFiles,
  uploadingFiles,
  handleFileUpload,
  removeFiles,
  fileInputRef,
  startSession,
  pdfContext,
}) => (
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

export default LiveSetup;
