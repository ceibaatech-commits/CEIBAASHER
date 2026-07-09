/**
 * BannerManager.js
 *
 * Admin panel for managing home-page banners.
 *
 * When destination type is "quiz_room":
 *   Tab 1 — Search & pick an existing quiz room by title / code
 *   Tab 2 — Create a brand-new room with an inline question builder
 *
 * When destination type is "battle":
 *   Search & pick an existing battle room
 *
 * Other types (leaderboard, url): plain text target_id field.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Image, Plus, Edit, Trash2, Search,
  ToggleLeft, ToggleRight, ArrowUp, ArrowDown,
  ExternalLink, Layers, RefreshCw, X, Save,
  CheckCircle, PlusCircle, MinusCircle,
  ChevronDown, ChevronUp, FileSpreadsheet, AlertCircle,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

// ── Constants ──────────────────────────────────────────────────────────────
const TARGET_TYPE_OPTIONS = [
  { value: 'quiz_room',   label: '🧩 Quiz Room',  hint: 'Pick or create a quiz room with questions' },
  { value: 'battle',      label: '⚔️ Battle Room', hint: 'Pick or create a battle room with questions' },
  { value: 'leaderboard', label: '🏆 Leaderboard', hint: 'Pick or create a room — its leaderboard becomes the destination' },
  { value: 'url',         label: '🔗 Custom URL',  hint: 'Full URL (https://…)' },
];

const CORRECT_OPTIONS = ['A', 'B', 'C', 'D'];
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 25;

const EMPTY_QUESTION = () => ({
  _key: Math.random().toString(36).slice(2),
  question_text: '',
  option_a: '', option_b: '', option_c: '', option_d: '',
  correct_answer: 'A',
  time_limit: 30,
});

const EMPTY_FORM = {
  title: '', image_url: '', target_type: 'quiz_room',
  target_id: '', is_active: true, display_order: 0,
};

const EMPTY_ROOM_FORM = { title: '', description: '', category: '', privacy: 'public' };

// ── Helpers ────────────────────────────────────────────────────────────────
const targetLabel = (t) => TARGET_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;
const badgeColor  = (t) => ({
  quiz_room:   'bg-purple-100 text-purple-700',
  battle:      'bg-red-100    text-red-700',
  leaderboard: 'bg-yellow-100 text-yellow-700',
  url:         'bg-blue-100   text-blue-700',
}[t] ?? 'bg-gray-100 text-gray-600');

// ── RoomPicker — searchable list of existing rooms ─────────────────────────
const RoomPicker = ({ apiPath, onSelect, selectedCode, placeholder }) => {
  const [query, setQuery]     = useState('');
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef           = useRef(null);

  const search = useCallback(async (q) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}${apiPath}`, { params: { search: q, limit: 20 } });
      if (res.data.success) setRooms(res.data.rooms || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [apiPath]);

  useEffect(() => { search(''); }, [search]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={query} onChange={handleChange} placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>

      {loading && <p className="text-xs text-gray-400">Searching…</p>}

      <div className="max-h-44 overflow-y-auto space-y-1 border border-gray-100 rounded-lg bg-gray-50 p-1">
        {!loading && rooms.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No rooms found</p>
        )}
        {rooms.map((room) => {
          const code   = room.room_code;
          const active = code === selectedCode;
          return (
            <button key={code} type="button" onClick={() => onSelect(code)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                active ? 'bg-indigo-100 text-indigo-800 font-medium' : 'hover:bg-white text-gray-700'
              }`}>
              <span className="truncate">{room.title || room.room_code}</span>
              <span className="ml-2 flex-shrink-0 font-mono text-xs text-gray-400">{code}</span>
              {active && <CheckCircle className="w-4 h-4 text-indigo-500 ml-1 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {selectedCode && (
        <p className="text-xs text-indigo-600 font-medium">
          ✅ Selected: <code className="bg-indigo-50 px-1 rounded">{selectedCode}</code>
        </p>
      )}
    </div>
  );
};

// ── SheetFormatGuide ─ collapsible reference card ──────────────────────────
const SheetFormatGuide = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 text-xs">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-blue-700 font-medium">
        <span className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> Required Google Sheet Column Format
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 text-blue-800">
          <p>Sheet must be <strong>public</strong> ("Anyone with the link can view").</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px] bg-white rounded shadow-sm">
              <thead>
                <tr className="bg-blue-100">
                  {['Question','A','B','C','D','Answer','Explanation'].map((h) => (
                    <th key={h} className="border border-blue-200 px-2 py-1 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-blue-100 px-2 py-1">Capital of India?</td>
                  <td className="border border-blue-100 px-2 py-1">Mumbai</td>
                  <td className="border border-blue-100 px-2 py-1">Delhi</td>
                  <td className="border border-blue-100 px-2 py-1">Chennai</td>
                  <td className="border border-blue-100 px-2 py-1">Kolkata</td>
                  <td className="border border-blue-100 px-2 py-1 font-bold text-green-700">B</td>
                  <td className="border border-blue-100 px-2 py-1 text-gray-500">Delhi is the capital.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-blue-600">
            Answer column accepts: <code className="bg-blue-100 px-1 rounded">A B C D</code> or <code className="bg-blue-100 px-1 rounded">1 2 3 4</code>.
            Column headers are case-insensitive.
          </p>
        </div>
      )}
    </div>
  );
};

// ── InlineRoomCreator — manual entry + Google Sheet import ─────────────────
const InlineRoomCreator = ({ onCreated }) => {
  const [roomForm, setRoomForm]       = useState(EMPTY_ROOM_FORM);
  const [questions, setQuestions]     = useState(() => Array.from({ length: 5 }, EMPTY_QUESTION));
  const [creating, setCreating]       = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(0);

  // Sheet import state
  const [inputTab, setInputTab]       = useState('manual'); // 'manual' | 'sheet'
  const [sheetUrl, setSheetUrl]       = useState('');
  const [sheetTimeLimit, setSheetTimeLimit] = useState(30);
  const [fetching, setFetching]       = useState(false);
  const [sheetPreview, setSheetPreview] = useState(null); // { count, questions }

  const setRF = (k, v) => setRoomForm((f) => ({ ...f, [k]: v }));

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) {
      toast.error(`Maximum ${MAX_QUESTIONS} questions allowed`);
      return;
    }
    setQuestions((prev) => [...prev, EMPTY_QUESTION()]);
    setExpandedIdx(questions.length);
  };

  const removeQuestion = (idx) => {
    if (questions.length <= MIN_QUESTIONS) { toast.error(`Minimum ${MIN_QUESTIONS} questions required`); return; }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIdx((p) => Math.min(p, questions.length - 2));
  };

  const setQF = (idx, field, value) =>
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));

  // ── Google Sheet fetch ──────────────────────────────────────────────────
  const handleFetchSheet = async () => {
    if (!sheetUrl.trim()) { toast.error('Paste a Google Sheet URL first'); return; }
    setFetching(true);
    setSheetPreview(null);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/admin/banners/fetch-sheet`, {
        sheet_url: sheetUrl.trim(),
        time_limit: sheetTimeLimit,
      });
      if (res.data.success && res.data.questions?.length) {
        setSheetPreview({ count: res.data.count, questions: res.data.questions });
        toast.success(`Fetched ${res.data.count} questions from sheet`);
      } else {
        toast.error('No questions found — check the sheet format');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to fetch sheet';
      toast.error(detail);
    } finally {
      setFetching(false);
    }
  };

  const handleImportSheet = () => {
    if (!sheetPreview?.questions?.length) return;
    const imported = sheetPreview.questions.slice(0, MAX_QUESTIONS).map((q) => ({
      _key: Math.random().toString(36).slice(2),
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      time_limit: q.time_limit,
    }));
    const capped = sheetPreview.count > MAX_QUESTIONS;
    setQuestions(imported);
    setSheetPreview(null);
    setSheetUrl('');
    setInputTab('manual');
    toast.success(
      capped
        ? `${MAX_QUESTIONS} questions imported (sheet had ${sheetPreview.count} — capped at max)`
        : `${imported.length} questions imported — review and create room`
    );
  };

  const handleCreate = async () => {
    if (!roomForm.title.trim())    { toast.error('Room title required');    return; }
    if (!roomForm.category.trim()) { toast.error('Room category required'); return; }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Question ${i + 1} text is empty`); setExpandedIdx(i); return;
      }
      if (!q.option_a || !q.option_b || !q.option_c || !q.option_d) {
        toast.error(`All 4 options required in question ${i + 1}`); setExpandedIdx(i); return;
      }
    }

    setCreating(true);
    try {
      const payload = {
        title:       roomForm.title,
        description: roomForm.description || roomForm.title,
        category:    roomForm.category,
        privacy:     roomForm.privacy,
        questions:   questions.map(({ _key, ...q }) => ({
          ...q,
          correct_answer: q.correct_answer.toUpperCase(),
        })),
      };

      // Use admin session cookie + fallback to stored token
      const token = localStorage.getItem('ceibaa_admin_token') || '';
      const res = await axios.post(
        `${BACKEND_URL}/api/social/quiz-rooms`,
        payload,
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, withCredentials: true },
      );

      if (res.data.success) {
        toast.success(`Room created — Code: ${res.data.room_code}`);
        onCreated(res.data.room_code);
      } else {
        toast.error('Failed to create room');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Room meta */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Room Title <span className="text-red-500">*</span>
          </label>
          <input type="text" value={roomForm.title} onChange={(e) => setRF('title', e.target.value)}
            placeholder="e.g. SSC CGL Mock Test 2026"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <input type="text" value={roomForm.category} onChange={(e) => setRF('category', e.target.value)}
            placeholder="e.g. General Knowledge"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Privacy</label>
          <select value={roomForm.privacy} onChange={(e) => setRF('privacy', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {/* ── Question input mode tabs ── */}
      <div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-3">
          {[
            { key: 'manual', label: '✏️ Manual Entry'     },
            { key: 'sheet',  label: '📊 Google Sheet Import' },
          ].map((t) => (
            <button key={t.key} type="button" onClick={() => setInputTab(t.key)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                inputTab === t.key ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}>{t.label}</button>
          ))}
        </div>

        {/* ── Sheet import panel ── */}
        {inputTab === 'sheet' && (
          <div className="space-y-3">
            <SheetFormatGuide />

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Google Sheet Public URL <span className="text-red-500">*</span>
              </label>
              <input type="url" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>

            <div className="flex items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Default Time/Question</label>
                <select value={sheetTimeLimit} onChange={(e) => setSheetTimeLimit(Number(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
                  {[15, 20, 30, 45, 60].map((v) => <option key={v} value={v}>{v}s</option>)}
                </select>
              </div>
              <button type="button" onClick={handleFetchSheet} disabled={fetching}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                <FileSpreadsheet className="w-4 h-4" />
                {fetching ? 'Fetching…' : 'Fetch Questions'}
              </button>
            </div>

            {/* Preview panel */}
            {sheetPreview && (
              <div className="border border-green-200 bg-green-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    {sheetPreview.count} questions fetched
                    {sheetPreview.count > MAX_QUESTIONS && (
                      <span className="text-orange-600 font-normal text-xs ml-1">
                        (first {MAX_QUESTIONS} will be imported)
                      </span>
                    )}
                  </p>
                  <button type="button" onClick={handleImportSheet}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700">
                    <Download className="w-3.5 h-3.5" /> Import All
                  </button>
                </div>
                {/* Quick preview of first 3 */}
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {sheetPreview.questions.slice(0, 3).map((q, i) => (
                    <div key={i} className="bg-white rounded-lg px-2 py-1.5 text-xs text-gray-700 flex items-start gap-2">
                      <span className="flex-shrink-0 w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="truncate">{q.question_text}</span>
                      <span className="flex-shrink-0 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 rounded ml-auto">
                        {q.correct_answer}
                      </span>
                    </div>
                  ))}
                  {sheetPreview.count > 3 && (
                    <p className="text-[11px] text-green-600 text-center">
                      + {sheetPreview.count - 3} more questions
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Manual questions ── */}
        {inputTab === 'manual' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Questions&nbsp;
                <span className={`font-bold ${
                  questions.length >= MAX_QUESTIONS ? 'text-orange-500' : 'text-indigo-600'
                }`}>{questions.length}</span>
                <span className="text-gray-400 font-normal"> / {MAX_QUESTIONS} max (min {MIN_QUESTIONS})</span>
              </span>
              <button type="button" onClick={addQuestion}
                disabled={questions.length >= MAX_QUESTIONS}
                className="flex items-center gap-1 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed text-indigo-600 hover:text-indigo-800">
                <PlusCircle className="w-3.5 h-3.5" />
                {questions.length >= MAX_QUESTIONS ? 'Max reached' : 'Add Question'}
              </button>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  questions.length >= MAX_QUESTIONS ? 'bg-orange-400' : 'bg-indigo-400'
                }`}
                style={{ width: `${(questions.length / MAX_QUESTIONS) * 100}%` }}
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
              {questions.map((q, idx) => {
                const open   = expandedIdx === idx;
                const filled = q.question_text && q.option_a && q.option_b && q.option_c && q.option_d;
                return (
                  <div key={q._key}
                    className={`border rounded-xl overflow-hidden ${filled ? 'border-green-200' : 'border-gray-200'}`}>
                    <div onClick={() => setExpandedIdx(open ? -1 : idx)}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer select-none ${
                        open ? 'bg-indigo-50' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex-shrink-0 flex items-center justify-center ${
                          filled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>{idx + 1}</span>
                        <span className="text-sm text-gray-700 truncate">
                          {q.question_text || <span className="text-gray-400 italic">Question {idx + 1}</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {questions.length > 5 && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                            className="p-1 text-red-400 hover:text-red-600">
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        )}
                        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {open && (
                      <div className="p-3 space-y-3 bg-white">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Question Text</label>
                          <textarea rows={2} value={q.question_text}
                            onChange={(e) => setQF(idx, 'question_text', e.target.value)}
                            placeholder="Type the question here…"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {['a', 'b', 'c', 'd'].map((letter) => {
                            const isCorrect = q.correct_answer.toLowerCase() === letter;
                            return (
                              <div key={letter} className="relative">
                                <input type="text" value={q[`option_${letter}`]}
                                  onChange={(e) => setQF(idx, `option_${letter}`, e.target.value)}
                                  placeholder={`Option ${letter.toUpperCase()}`}
                                  className={`w-full border rounded-lg pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                                    isCorrect ? 'border-green-400 bg-green-50 focus:ring-green-300' : 'border-gray-200 focus:ring-indigo-300'}`} />
                                <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold ${
                                  isCorrect ? 'text-green-600' : 'text-gray-400'}`}>{letter.toUpperCase()}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-end gap-4">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Correct Answer</label>
                            <div className="flex gap-1.5">
                              {CORRECT_OPTIONS.map((opt) => (
                                <button key={opt} type="button" onClick={() => setQF(idx, 'correct_answer', opt)}
                                  className={`w-9 h-8 rounded-lg text-sm font-bold border transition-colors ${
                                    q.correct_answer === opt
                                      ? 'bg-green-500 text-white border-green-500'
                                      : 'bg-white text-gray-500 border-gray-200 hover:border-green-400'}`}>{opt}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Time Limit</label>
                            <select value={q.time_limit} onChange={(e) => setQF(idx, 'time_limit', Number(e.target.value))}
                              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none">
                              {[15, 20, 30, 45, 60].map((v) => <option key={v} value={v}>{v}s</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={handleCreate} disabled={creating || inputTab === 'sheet'}
        className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
        <PlusCircle className="w-4 h-4" />
        {creating
          ? 'Creating Room…'
          : inputTab === 'sheet'
            ? 'Import questions first, then create'
            : `Create Room & Use as Destination (${questions.length} Qs)`}
      </button>
    </div>
  );
};

// Config per target type for the picker
const TARGET_PICKER_CONFIG = {
  quiz_room:   { apiPath: '/api/admin/rooms/quiz',   pickLabel: '🔍 Pick Existing Quiz Room',  placeholder: 'Search by title or room code…' },
  battle:      { apiPath: '/api/admin/rooms/battle', pickLabel: '🔍 Pick Existing Battle Room', placeholder: 'Search by pin or subject…'     },
  leaderboard: { apiPath: '/api/admin/rooms/quiz',   pickLabel: '🔍 Pick Existing Room',        placeholder: 'Search by title or room code…' },
};

// ── TargetPicker — same two-tab UI for quiz_room, battle & leaderboard ────
const TargetPicker = ({ targetType, targetId, onSelect }) => {
  const [tab, setTab] = useState('pick');
  const cfg = TARGET_PICKER_CONFIG[targetType];
  if (!cfg) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'pick',   label: cfg.pickLabel        },
          { key: 'create', label: '➕ Create New Room' },
        ].map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              tab === t.key ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}>{t.label}</button>
        ))}
      </div>
      {tab === 'pick' && (
        <RoomPicker apiPath={cfg.apiPath} selectedCode={targetId}
          onSelect={onSelect} placeholder={cfg.placeholder} />
      )}
      {tab === 'create' && (
        <InlineRoomCreator onCreated={(code) => { onSelect(code); setTab('pick'); }} />
      )}
    </div>
  );
};

// ── BannerManager ──────────────────────────────────────────────────────────
const BannerManager = () => {
  const [banners, setBanners]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [showAddModal, setShowAddModal]     = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [form, setForm]                     = useState(EMPTY_FORM);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/banners`);
      if (res.data.success) setBanners(res.data.banners || []);
      else toast.error('Failed to load banners');
    } catch (err) {
      console.error(err); toast.error('Failed to load banners');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(EMPTY_FORM); setShowAddModal(true); };

  const openEdit = (banner) => {
    setSelectedBanner(banner);
    setForm({
      title:         banner.title || '',
      image_url:     banner.image_url,
      target_type:   banner.target_type,
      target_id:     banner.target_id,
      is_active:     banner.is_active,
      display_order: banner.display_order,
    });
    setShowEditModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.image_url.trim()) return toast.error('Image URL is required');
    if (!form.target_id.trim()) return toast.error('Select or create a destination first');
    setSaving(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/admin/banners`, form);
      if (res.data.success) { toast.success('Banner created'); setShowAddModal(false); fetchBanners(); }
    } catch (err) { console.error(err); toast.error('Failed to create banner'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedBanner) return;
    if (!form.image_url.trim()) return toast.error('Image URL is required');
    if (!form.target_id.trim()) return toast.error('Select or create a destination first');
    setSaving(true);
    try {
      const res = await axios.put(`${BACKEND_URL}/api/admin/banners/${selectedBanner.id}`, form);
      if (res.data.success) { toast.success('Banner updated'); setShowEditModal(false); fetchBanners(); }
    } catch (err) { console.error(err); toast.error('Failed to update banner'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (banner) => {
    if (!window.confirm(`Delete banner "${banner.title || banner.id}"?`)) return;
    try {
      const res = await axios.delete(`${BACKEND_URL}/api/admin/banners/${banner.id}`);
      if (res.data.success) { toast.success('Deleted'); fetchBanners(); }
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggleActive = async (banner) => {
    try {
      await axios.put(`${BACKEND_URL}/api/admin/banners/${banner.id}`, { is_active: !banner.is_active });
      toast.success(banner.is_active ? 'Banner hidden' : 'Banner activated');
      fetchBanners();
    } catch { toast.error('Toggle failed'); }
  };

  const handleReorder = async (banner, direction) => {
    const sorted  = [...banners].sort((a, b) => a.display_order - b.display_order);
    const idx     = sorted.findIndex((b) => b.id === banner.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    try {
      await Promise.all([
        axios.patch(`${BACKEND_URL}/api/admin/banners/${banner.id}/order`,             { display_order: sorted[swapIdx].display_order }),
        axios.patch(`${BACKEND_URL}/api/admin/banners/${sorted[swapIdx].id}/order`, { display_order: sorted[idx].display_order }),
      ]);
      fetchBanners();
    } catch { toast.error('Reorder failed'); }
  };

  const filtered = banners.filter((b) => {
    const q = searchQuery.toLowerCase();
    return !q || b.title?.toLowerCase().includes(q) || b.target_type.includes(q) || b.target_id?.toLowerCase().includes(q);
  });

  // ── Shared form body (reused in both modals) ───────────────────────────
  const FormBody = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Admin label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-xs text-gray-400 font-normal">(admin label, not shown on home)</span>
        </label>
        <input type="text" value={form.title} onChange={(e) => setField('title', e.target.value)}
          placeholder="e.g. SSC CGL Launch Banner"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      {/* Image URL + preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Banner Image URL <span className="text-red-500">*</span>
        </label>
        <input type="url" required value={form.image_url} onChange={(e) => setField('image_url', e.target.value)}
          placeholder="https://cdn.ceibaa.com/banners/example.webp"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        {form.image_url && (
          <img src={form.image_url} alt="preview"
            onError={(e) => { e.target.style.display = 'none'; }}
            className="mt-2 h-24 w-full object-cover rounded-lg border border-gray-200" />
        )}
      </div>

      {/* Destination type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Destination Type <span className="text-red-500">*</span>
        </label>
        <select value={form.target_type}
          onChange={(e) => { setField('target_type', e.target.value); setField('target_id', ''); }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          {TARGET_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Destination picker ── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          {form.target_type === 'quiz_room'   ? '🧩 Quiz Room Destination'   :
           form.target_type === 'battle'      ? '⚔️ Battle Room Destination' :
           form.target_type === 'leaderboard' ? '🏆 Leaderboard Destination'  :
           'Destination'} <span className="text-red-500">*</span>
        </label>

        {['quiz_room', 'battle', 'leaderboard'].includes(form.target_type) ? (
          <>
            <TargetPicker
              targetType={form.target_type}
              targetId={form.target_id}
              onSelect={(code) => setField('target_id', code)}
            />
            {/* Manual override */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Or type code / pin manually</label>
              <input type="text" value={form.target_id}
                onChange={(e) => setField('target_id', e.target.value)}
                placeholder="Room code / PIN"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </>
        ) : (
          <input
            type="url"
            required value={form.target_id}
            onChange={(e) => setField('target_id', e.target.value)}
            placeholder="https://…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        )}
      </div>

      {/* Order + active toggle */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
          <input type="number" min={0} value={form.display_order}
            onChange={(e) => setField('display_order', parseInt(e.target.value, 10) || 0)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm font-medium text-gray-700">Active</span>
            <button type="button" onClick={() => setField('is_active', !form.is_active)}>
              {form.is_active
                ? <ToggleRight className="w-8 h-8 text-green-500" />
                : <ToggleLeft  className="w-8 h-8 text-gray-400" />}
            </button>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button"
          onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Home Banner Manager</h1>
            <p className="text-sm text-gray-500">
              Create banners that link directly to quiz rooms or battle lobbies — with built-in question builder.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchBanners} title="Refresh"
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',    value: banners.length,                          color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Active',   value: banners.filter((b) => b.is_active).length,  color: 'bg-green-50  text-green-700'  },
          { label: 'Inactive', value: banners.filter((b) => !b.is_active).length, color: 'bg-gray-50   text-gray-600'   },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search banners…" value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
          Loading banners…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
          <Image className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>No banners yet — click <strong>Add Banner</strong> to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order', 'Preview', 'Title', 'Destination', 'Target ID / Code', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.slice().sort((a, b) => a.display_order - b.display_order).map((banner, idx, arr) => (
                <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                  {/* Order controls */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={() => handleReorder(banner, 'up')} disabled={idx === 0}
                        className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20">
                        <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <span className="text-xs font-mono text-gray-500">{banner.display_order}</span>
                      <button onClick={() => handleReorder(banner, 'down')} disabled={idx === arr.length - 1}
                        className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20">
                        <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  </td>

                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    {banner.image_url
                      ? <img src={banner.image_url} alt="" className="w-20 h-11 object-cover rounded-lg border border-gray-200"
                          onError={(e) => { e.target.style.display = 'none'; }} />
                      : <div className="w-20 h-11 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Image className="w-5 h-5 text-gray-300" /></div>}
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[140px] truncate">
                    {banner.title || <span className="text-gray-400 italic">Untitled</span>}
                  </td>

                  {/* Type badge */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor(banner.target_type)}`}>
                      {targetLabel(banner.target_type)}
                    </span>
                  </td>

                  {/* Target ID */}
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700 max-w-[130px] truncate inline-block">
                      {banner.target_id || '—'}
                    </code>
                  </td>

                  {/* Active toggle */}
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(banner)} className="flex items-center gap-1.5 text-xs">
                      {banner.is_active
                        ? <><ToggleRight className="w-5 h-5 text-green-500" /><span className="text-green-600 font-medium">Active</span></>
                        : <><ToggleLeft  className="w-5 h-5 text-gray-400" /><span className="text-gray-400">Hidden</span></>}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {banner.target_type === 'url' && banner.target_id && (
                        <a href={banner.target_id} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => openEdit(banner)}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(banner)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" /> Add New Banner
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              <FormBody onSubmit={handleCreate} submitLabel="Create Banner" />
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && selectedBanner && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-500" /> Edit Banner
              </h2>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              <FormBody onSubmit={handleUpdate} submitLabel="Save Changes" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManager;
