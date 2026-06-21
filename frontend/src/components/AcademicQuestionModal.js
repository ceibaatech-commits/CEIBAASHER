import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GraduationCap, Send, Info, Loader2 } from 'lucide-react';
import axios from 'axios';
import MathInput from './MathInput';
import { toast } from 'sonner';
import ModalShell from './modal/ModalShell';
import BottomSheetSelect from './modal/BottomSheetSelect';

const BACKEND_URL = window.location.origin;

// Class list with streams
const CLASS_OPTIONS = [
  { value: 'Class 6', label: 'Class 6' },
  { value: 'Class 7', label: 'Class 7' },
  { value: 'Class 8', label: 'Class 8' },
  { value: 'Class 9', label: 'Class 9' },
  { value: 'Class 10', label: 'Class 10' },
  { value: 'Class 11 (Science)', label: 'Class 11 — Science' },
  { value: 'Class 11 (Commerce)', label: 'Class 11 — Commerce' },
  { value: 'Class 11 (Humanities)', label: 'Class 11 — Humanities' },
  { value: 'Class 12 (Science)', label: 'Class 12 — Science' },
  { value: 'Class 12 (Commerce)', label: 'Class 12 — Commerce' },
  { value: 'Class 12 (Humanities)', label: 'Class 12 — Humanities' },
];

const AcademicQuestionModal = ({ isOpen, onClose, onSubmit }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [cbseData, setCbseData] = useState({});
  const [loadingCbseData, setLoadingCbseData] = useState(true);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [questionText, setQuestionText] = useState('');

  const subjects = selectedClass && cbseData[selectedClass]
    ? Object.keys(cbseData[selectedClass])
    : [];
  const chapters = selectedClass && selectedSubject && cbseData[selectedClass]?.[selectedSubject]
    ? cbseData[selectedClass][selectedSubject]
    : [];

  // Fetch class data
  useEffect(() => {
    if (!isOpen) return;
    setLoadingCbseData(true);
    const selectedBoard = new URLSearchParams(location.search).get('board') || 'cbse';
    axios.get(`${BACKEND_URL}/api/cbse-data/admin/class-subjects?board=${selectedBoard}`)
      .then((res) => {
        if (res.data.success) setCbseData(res.data.class_subjects);
      })
      .catch(() => toast.error('Failed to load class data'))
      .finally(() => setLoadingCbseData(false));
  }, [isOpen, location.search]);

  // Cascading resets
  useEffect(() => { setSelectedSubject(''); setSelectedChapter(''); }, [selectedClass]);
  useEffect(() => { setSelectedChapter(''); }, [selectedSubject]);

  const resetForm = () => {
    setSelectedClass(''); setSelectedSubject(''); setSelectedChapter(''); setQuestionText('');
  };

  const handleSubmit = async () => {
    if (!selectedClass)    return toast.error('Please select a class');
    if (!selectedSubject)  return toast.error('Please select a subject');
    if (!selectedChapter)  return toast.error('Please select a chapter');
    if (!questionText.trim()) return toast.error('Please enter your question');

    setLoading(true);
    try {
      await onSubmit({
        class_name: selectedClass,
        subject: selectedSubject,
        chapter: selectedChapter,
        question: questionText.trim(),
      });
      resetForm();
      onClose();
    } catch {
      toast.error('Failed to post question');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && selectedClass && selectedSubject && selectedChapter && questionText.trim();

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      testid="academic-question-modal"
      icon={<GraduationCap className="w-[18px] h-[18px]" strokeWidth={2.2} />}
      title="Ask Academic Question"
      subtitle="Post a doubt from your class syllabus"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="basis-[40%] h-[52px] rounded-[14px] border border-slate-200 text-slate-700 font-semibold text-[15px] hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50"
            data-testid="academic-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="basis-[60%] h-[52px] rounded-[14px] bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold text-[16px] flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(79,70,229,0.55)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            data-testid="academic-submit-btn"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Posting…' : 'Post Question'}
          </button>
        </div>
      }
    >
      {loadingCbseData ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Class */}
          <FieldLabel>Select Class</FieldLabel>
          <BottomSheetSelect
            value={selectedClass}
            onChange={setSelectedClass}
            options={CLASS_OPTIONS}
            placeholder="Choose your class"
            testid="academic-class-select"
            ariaLabel="Select class"
          />

          {/* Subject */}
          <FieldLabel>Subject</FieldLabel>
          <BottomSheetSelect
            value={selectedSubject}
            onChange={setSelectedSubject}
            options={subjects.map((s) => ({ value: s, label: s }))}
            placeholder={selectedClass ? 'Choose subject' : 'Select class first'}
            disabled={!selectedClass}
            testid="academic-subject-select"
            ariaLabel="Select subject"
          />

          {/* Chapter */}
          <FieldLabel>Chapter</FieldLabel>
          <BottomSheetSelect
            value={selectedChapter}
            onChange={setSelectedChapter}
            options={chapters.map((c) => ({ value: c, label: c }))}
            placeholder={selectedSubject ? 'Choose chapter' : 'Select subject first'}
            disabled={!selectedSubject}
            testid="academic-chapter-select"
            ariaLabel="Select chapter"
          />

          {/* Question */}
          <FieldLabel>
            Your Question
            <InlineTooltip text='Wrap math in $…$ — e.g. $x^2 + y^2 = z^2$' />
          </FieldLabel>
          <MathInput
            value={questionText}
            onChange={setQuestionText}
            placeholder="Type your question here…"
            showToolbar
            multiline
            rows={5}
          />

          {/* Subtle tip */}
          <div className="flex items-start gap-2 px-1 text-[12.5px] text-slate-500 leading-relaxed">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>Your question appears on Capazoo and on the chapter page so peers in the same chapter can help.</span>
          </div>
        </div>
      )}
    </ModalShell>
  );
};

// ─────────────── tiny helpers (inline, not exported) ──────────────────────
const FieldLabel = ({ children }) => (
  <label className="block text-[14px] font-medium text-slate-700 mb-2">{children}</label>
);

const InlineTooltip = ({ text }) => (
  <span className="ml-1.5 inline-flex items-center align-middle">
    <span className="group relative inline-flex">
      <Info className="w-3.5 h-3.5 text-slate-400" />
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block whitespace-nowrap rounded-md bg-slate-900 text-white text-[11px] px-2 py-1 shadow-md z-10">
        {text}
      </span>
    </span>
  </span>
);

export default AcademicQuestionModal;
