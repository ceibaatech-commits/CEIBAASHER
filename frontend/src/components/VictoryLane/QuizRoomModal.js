import React, { useState } from 'react';
import { Plus, Upload, FileSpreadsheet, Link as LinkIcon, Loader2, Edit3, Users, Trash2, Info, Trophy } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { QUIZ_CATEGORIES, getInitialQuizForm } from './constants';
import ModalShell from '../modal/ModalShell';
import BottomSheetSelect from '../modal/BottomSheetSelect';

const BACKEND_URL = window.location.origin;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 50;
const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 150;

const DIFFICULTY_OPTIONS = [
  { value: 'Easy',   label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard',   label: 'Hard' },
];
const ACCESS_OPTIONS = [
  { value: 'public',    label: 'Public',    hint: 'Anyone can join via the room PIN.' },
  { value: 'followers', label: 'Private',   hint: 'Only your followers can join.' },
];

const QuizRoomModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [quizForm, setQuizForm] = useState(getInitialQuizForm());
  const [quizInputMethod, setQuizInputMethod] = useState('manual');
  const [selectedQuizImage, setSelectedQuizImage] = useState(null);
  const [quizImagePreview, setQuizImagePreview] = useState(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [extractingQuestions, setExtractingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validCount = quizForm.questions.filter((q) => q.question.trim()).length;
  const progressPct = Math.min((validCount / MIN_QUESTIONS) * 100, 100);

  const updateQuestion = (index, field, value) => {
    setQuizForm((prev) => {
      const next = [...prev.questions];
      if (field === 'question') next[index] = { ...next[index], question: value };
      else if (field === 'correctAnswer') next[index] = { ...next[index], correctAnswer: value };
      else if (field.startsWith('option')) {
        const optIdx = parseInt(field.replace('option', ''), 10);
        const options = [...next[index].options];
        options[optIdx] = value;
        next[index] = { ...next[index], options };
      }
      return { ...prev, questions: next };
    });
  };

  const addQuestion = () => {
    if (quizForm.questions.length >= MAX_QUESTIONS) return toast.error(`Maximum ${MAX_QUESTIONS} questions allowed`);
    setQuizForm((p) => ({ ...p, questions: [...p.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }] }));
  };

  const removeQuestion = (index) => {
    if (quizForm.questions.length <= 1) return toast.error('At least one question is required');
    setQuizForm((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== index) }));
  };

  const handleImageExtraction = async () => {
    if (!selectedQuizImage) return toast.error('Please select an image first');
    setExtractingQuestions(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedQuizImage);
      const res = await axios.post(`${BACKEND_URL}/api/victory-lane/extract-questions-from-image`, formData,
        { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success && res.data.questions) {
        const questions = res.data.questions.slice(0, MAX_QUESTIONS).map((q) => ({
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correctAnswer: 0,
          explanation: q.explanation || '',
        }));
        setQuizForm((p) => ({ ...p, questions }));
        toast.success(`Extracted ${questions.length} questions — pick correct answers below.`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to extract questions from image');
    } finally { setExtractingQuestions(false); }
  };

  const handleGoogleSheetExtraction = async () => {
    if (!googleSheetUrl.trim()) return toast.error('Please enter a Google Sheet URL');
    if (!googleSheetUrl.includes('docs.google.com/spreadsheets')) return toast.error('Please enter a valid Google Sheets URL');
    setExtractingQuestions(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/extract-questions-from-sheet`, { sheet_url: googleSheetUrl });
      if (res.data.success && res.data.questions) {
        const questions = res.data.questions.slice(0, MAX_QUESTIONS).map((q) => ({
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correctAnswer: q.correctAnswer || 0,
          explanation: q.explanation || '',
        }));
        setQuizForm((p) => ({ ...p, questions }));
        toast.success(`Extracted ${questions.length} questions from Google Sheet!`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to extract questions from Google Sheet');
    } finally { setExtractingQuestions(false); }
  };

  const handleCreateQuizRoom = async () => {
    const validQs = quizForm.questions.filter((q) => q.question.trim());
    if (validQs.length < MIN_QUESTIONS) return toast.error(`Minimum ${MIN_QUESTIONS} questions required`);
    if (validQs.length > MAX_QUESTIONS) return toast.error(`Maximum ${MAX_QUESTIONS} questions allowed`);
    if (!quizForm.title.trim() || !quizForm.category) return toast.error('Please fill in title and category');
    if (quizForm.maxParticipants < MIN_PARTICIPANTS || quizForm.maxParticipants > MAX_PARTICIPANTS)
      return toast.error(`Participants must be between ${MIN_PARTICIPANTS} and ${MAX_PARTICIPANTS}`);

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/battle/create-room`, {
        hostName: user?.name || 'Quiz Host',
        subject: quizForm.category,
        maxParticipants: quizForm.maxParticipants,
        timePerQuestion: Math.floor((quizForm.timeLimit * 60) / validQs.length),
        questions: validQs.map((q, idx) => ({
          id: `q${idx + 1}`,
          question: q.question,
          options: q.options.map((opt, i) => ({ id: String.fromCharCode(97 + i), text: opt })),
          correctAnswer: String.fromCharCode(97 + q.correctAnswer),
        })),
      });
      if (res.data.success) {
        const roomId = res.data.roomId;
        const post = await axios.post(`${BACKEND_URL}/api/social/posts`, {
          post_type: 'quiz_room',
          content: `Created a new quiz room: ${quizForm.title}`,
          quiz_details: {
            title: quizForm.title, category: quizForm.category, difficulty: quizForm.difficulty,
            questions_count: validQs.length, room_code: roomId, time_limit: quizForm.timeLimit,
            max_participants: quizForm.maxParticipants, access_control: quizForm.accessControl,
            host_name: user?.name || 'Quiz Host', host_id: user?.id,
          },
        });
        if (post.data.success) {
          toast.success(`Quiz room created! PIN: ${roomId}`, { duration: 5000 });
          onSuccess?.();
          handleClose();
        } else { toast.error('Quiz room created but failed to post to feed'); }
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || e.response?.data?.message || 'Failed to create quiz room');
    } finally { setIsSubmitting(false); }
  };

  const handleClose = () => {
    setQuizForm(getInitialQuizForm());
    setQuizInputMethod('manual');
    setSelectedQuizImage(null);
    setQuizImagePreview(null);
    setGoogleSheetUrl('');
    onClose();
  };

  const canSubmit = !isSubmitting && validCount >= MIN_QUESTIONS && validCount <= MAX_QUESTIONS
    && !!quizForm.title.trim() && !!quizForm.category
    && quizForm.maxParticipants >= MIN_PARTICIPANTS && quizForm.maxParticipants <= MAX_PARTICIPANTS;

  return (
    <ModalShell
      open={isOpen}
      onClose={handleClose}
      testid="quiz-room-modal"
      icon={<Trophy className="w-[18px] h-[18px]" strokeWidth={2.2} />}
      title="Create Quiz Room"
      subtitle="Host a live quiz for your followers"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="basis-[40%] h-[52px] rounded-[14px] border border-slate-200 text-slate-700 font-semibold text-[15px] hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50"
            data-testid="quiz-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateQuizRoom}
            disabled={!canSubmit}
            className="basis-[60%] h-[52px] rounded-[14px] bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold text-[16px] flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(79,70,229,0.55)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            data-testid="create-quiz-room-btn"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Creating…' : 'Create Room'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Title */}
        <Field label="Quiz Title">
          <input
            type="text"
            value={quizForm.title}
            onChange={(e) => setQuizForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Thermodynamics Masterclass"
            className={inputClass}
            data-testid="quiz-title-input"
          />
        </Field>

        {/* Category */}
        <Field label="Category">
          <BottomSheetSelect
            value={quizForm.category}
            onChange={(v) => setQuizForm((p) => ({ ...p, category: v }))}
            options={QUIZ_CATEGORIES.map((c) => ({ value: c, label: c }))}
            placeholder="Select category"
            testid="quiz-category-select"
            ariaLabel="Quiz category"
          />
        </Field>

        {/* 2-col on mobile too: Difficulty | Time Limit */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Difficulty">
            <BottomSheetSelect
              value={quizForm.difficulty}
              onChange={(v) => setQuizForm((p) => ({ ...p, difficulty: v }))}
              options={DIFFICULTY_OPTIONS}
              placeholder="Difficulty"
              testid="quiz-difficulty-select"
              ariaLabel="Difficulty"
            />
          </Field>
          <Field label="Time Limit (min)">
            <input
              type="number"
              min={5}
              max={60}
              value={quizForm.timeLimit}
              onChange={(e) => setQuizForm((p) => ({ ...p, timeLimit: parseInt(e.target.value, 10) || 15 }))}
              className={`${inputClass} tabular-nums`}
              data-testid="quiz-time-input"
            />
          </Field>
        </div>

        {/* 2-col on mobile too: Max Participants | Access */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Max Participants">
            <input
              type="number"
              min={MIN_PARTICIPANTS}
              max={MAX_PARTICIPANTS}
              value={quizForm.maxParticipants}
              onChange={(e) => setQuizForm((p) => ({ ...p, maxParticipants: parseInt(e.target.value, 10) || MAX_PARTICIPANTS }))}
              className={`${inputClass} tabular-nums`}
              data-testid="quiz-participants-input"
            />
          </Field>
          <Field label="Access">
            <BottomSheetSelect
              value={quizForm.accessControl}
              onChange={(v) => setQuizForm((p) => ({ ...p, accessControl: v }))}
              options={ACCESS_OPTIONS}
              placeholder="Access"
              testid="quiz-access-select"
              ariaLabel="Access control"
            />
          </Field>
        </div>

        {/* Helper for followers-only */}
        {quizForm.accessControl === 'followers' && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-[12px] bg-[#EEF0FF] text-[#4338CA] text-[13px] leading-snug">
            <Users className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Only users who follow you can join this quiz room.</span>
          </div>
        )}

        {/* Input method tabs */}
        <Field label="Add Questions">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <SegBtn active={quizInputMethod === 'manual'} onClick={() => setQuizInputMethod('manual')} icon={<Edit3 className="w-4 h-4" />}>Manual</SegBtn>
            <SegBtn active={quizInputMethod === 'image'}  onClick={() => setQuizInputMethod('image')}  icon={<Upload className="w-4 h-4" />}>Image</SegBtn>
            <SegBtn active={quizInputMethod === 'sheet'}  onClick={() => setQuizInputMethod('sheet')}  icon={<FileSpreadsheet className="w-4 h-4" />}>Sheet</SegBtn>
          </div>

          {/* Inline counter + progress bar (replaces the bulky yellow box) */}
          <div className="mt-2 mb-1 flex items-center justify-between text-[12.5px]">
            <span className="font-medium text-slate-600">
              <span className={`tabular-nums font-semibold ${validCount >= MIN_QUESTIONS ? 'text-emerald-600' : 'text-slate-900'}`}>
                {validCount}
              </span>
              <span className="text-slate-400"> / {MIN_QUESTIONS} minimum · max {MAX_QUESTIONS}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-slate-400 cursor-help group relative">
              <Info className="w-3.5 h-3.5" />
              <span className="hidden group-hover:flex absolute right-0 top-full mt-1 w-56 text-[11px] bg-slate-900 text-white rounded-md p-2 leading-snug z-10">
                Each room needs {MIN_QUESTIONS}–{MAX_QUESTIONS} questions and {MIN_PARTICIPANTS}–{MAX_PARTICIPANTS} participants.
              </span>
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                validCount >= MIN_QUESTIONS ? 'bg-emerald-500' : 'bg-[#4F46E5]'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </Field>

        {/* Image upload */}
        {quizInputMethod === 'image' && (
          <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) return toast.error('Image must be under 10MB');
                if (file.size > 3.8 * 1024 * 1024) toast.warning('Image >3.8MB may fail. Consider compressing.');
                setSelectedQuizImage(file);
                const reader = new FileReader();
                reader.onloadend = () => setQuizImagePreview(reader.result);
                reader.readAsDataURL(file);
              }}
              className="hidden"
              id="quiz-image-upload"
            />
            <label htmlFor="quiz-image-upload" className="cursor-pointer block">
              {quizImagePreview ? (
                <div className="text-center">
                  <img src={quizImagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm mb-3" />
                  <p className="text-[12px] text-slate-500 mb-3 truncate">{selectedQuizImage?.name}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); handleImageExtraction(); }}
                    disabled={extractingQuestions}
                    className="w-full h-[44px] rounded-[12px] bg-[#4F46E5] text-white font-semibold text-[14px] disabled:opacity-50"
                  >
                    {extractingQuestions ? 'Extracting…' : `Extract Questions (Max ${MAX_QUESTIONS})`}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-[#4F46E5]" />
                  <p className="font-semibold text-slate-800 text-[14px]">Upload an image of your questions</p>
                  <p className="text-[12px] text-slate-500 mt-1">PNG / JPG · under 3.8 MB recommended</p>
                </div>
              )}
            </label>
          </div>
        )}

        {/* Google Sheet */}
        {quizInputMethod === 'sheet' && (
          <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                className={`${inputClass} pl-10`}
              />
            </div>
            <p className="text-[12px] text-slate-500 leading-snug">
              Format: <span className="font-medium text-slate-700">Question | A | B | C | D | Correct (0–3)</span>
            </p>
            <button
              type="button"
              onClick={handleGoogleSheetExtraction}
              disabled={extractingQuestions || !googleSheetUrl.trim()}
              className="w-full h-[44px] rounded-[12px] bg-[#4F46E5] text-white font-semibold text-[14px] disabled:opacity-50"
            >
              {extractingQuestions ? 'Extracting…' : `Extract from Sheet (Max ${MAX_QUESTIONS})`}
            </button>
          </div>
        )}

        {/* Questions list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] font-medium text-slate-700">Questions</span>
            <span className="text-[12px] text-slate-400 tabular-nums">{quizForm.questions.length} added</span>
          </div>
          <div className="space-y-3">
            {quizForm.questions.map((q, idx) => (
              <div key={idx} className="rounded-[14px] border border-slate-200 bg-white p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Q{idx + 1}</span>
                  {quizForm.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      aria-label={`Remove question ${idx + 1}`}
                      className="text-rose-500 hover:bg-rose-50 active:bg-rose-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                  placeholder="Enter your question…"
                  className={`${inputClass} h-[44px] text-[14px]`}
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['A','B','C','D'].map((opt, optIdx) => (
                    <input
                      key={opt}
                      type="text"
                      value={q.options[optIdx]}
                      onChange={(e) => updateQuestion(idx, `option${optIdx}`, e.target.value)}
                      placeholder={`Option ${opt}`}
                      className={`${inputClass} h-[44px] text-[14px]`}
                    />
                  ))}
                </div>
                <BottomSheetSelect
                  value={q.correctAnswer}
                  onChange={(v) => updateQuestion(idx, 'correctAnswer', parseInt(v, 10))}
                  options={[0,1,2,3].map((n) => ({ value: n, label: `Correct: Option ${String.fromCharCode(65 + n)}` }))}
                  placeholder="Correct option"
                  ariaLabel="Correct option"
                />
              </div>
            ))}
          </div>
          {quizForm.questions.length < MAX_QUESTIONS ? (
            <button
              type="button"
              onClick={addQuestion}
              className="mt-3 w-full h-[44px] rounded-[12px] border-[1.5px] border-dashed border-slate-300 text-slate-600 hover:text-[#4F46E5] hover:border-[#4F46E5] hover:bg-[#EEF0FF] transition-colors text-[14px] font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Question
              <span className="text-slate-400 tabular-nums">({quizForm.questions.length}/{MAX_QUESTIONS})</span>
            </button>
          ) : (
            <p className="mt-3 text-[12px] text-slate-400 text-center">Maximum {MAX_QUESTIONS} questions reached</p>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

// ──────────────────────── shared input styling ───────────────────────────
const inputClass = `w-full h-[52px] px-4 rounded-[14px] border-[1.5px] border-slate-200 bg-white text-[15px] text-slate-900 placeholder:text-slate-400
  transition-all focus:outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/20`;

const Field = ({ label, children }) => (
  <div>
    {label && <label className="block text-[14px] font-medium text-slate-700 mb-2">{label}</label>}
    {children}
  </div>
);

const SegBtn = ({ active, onClick, icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`h-[44px] rounded-[12px] flex items-center justify-center gap-1.5 text-[13.5px] font-semibold transition-colors ${
      active
        ? 'bg-[#4F46E5] text-white shadow-[0_4px_12px_-4px_rgba(79,70,229,0.5)]'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
    }`}
  >
    {icon}
    <span>{children}</span>
  </button>
);

export default QuizRoomModal;
