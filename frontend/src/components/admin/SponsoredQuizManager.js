import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Plus, Trash2, Edit2, X, Save, Eye, EyeOff, Loader2,
  RefreshCw, BookOpen, Link, Image, Clock, Users,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';

const BACKEND_URL = window.location.origin;

const EMPTY_FORM = {
  title: '',
  description: '',
  banner_image: '',
  sponsor_name: '',
  sheet_url: '',
  time_per_question: 30,
  published: false,
};

const SHEET_HELP = `Sheet format (one row per question, header row optional):
Column A → Question text
Column B → Option A
Column C → Option B
Column D → Option C
Column E → Option D
Column F → Correct answer  (A / B / C / D)
Column G → Explanation (optional)

Min 5 questions · Max 25 questions
The sheet MUST be shared as "Anyone with the link can view".`;

export default function SponsoredQuizManager() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [reimporting, setReimporting] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showSheetHelp, setShowSheetHelp] = useState(false);

  useEffect(() => { fetchQuizzes(); }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/sponsored-quizzes`, { withCredentials: true });
      setQuizzes(res.data.quizzes || []);
    } catch {
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = async (quiz) => {
    setEditingId(quiz.id);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/sponsored-quizzes/${quiz.id}`, { withCredentials: true });
      const q = res.data.quiz;
      setForm({
        title: q.title || '',
        description: q.description || '',
        banner_image: q.banner_image || '',
        sponsor_name: q.sponsor_name || '',
        sheet_url: q.sheet_url || '',
        time_per_question: q.time_per_question || 30,
        published: q.published || false,
      });
    } catch {
      setForm({ ...EMPTY_FORM, ...quiz });
    }
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.sheet_url.trim()) return toast.error('Google Sheet URL is required');
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${BACKEND_URL}/api/admin/sponsored-quizzes/${editingId}`, form, { withCredentials: true });
        toast.success('Quiz updated');
      } else {
        const res = await axios.post(`${BACKEND_URL}/api/admin/sponsored-quizzes`, form, { withCredentials: true });
        toast.success(`Quiz created — ${res.data.question_count} questions imported`);
      }
      closeForm();
      fetchQuizzes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleReimport = async (quiz) => {
    setReimporting(quiz.id);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/admin/sponsored-quizzes/${quiz.id}/reimport`, {}, { withCredentials: true });
      toast.success(`Re-imported ${res.data.question_count} questions`);
      fetchQuizzes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Re-import failed');
    } finally {
      setReimporting(null);
    }
  };

  const handleTogglePublish = async (quiz) => {
    setTogglingId(quiz.id);
    try {
      const res = await axios.patch(`${BACKEND_URL}/api/admin/sponsored-quizzes/${quiz.id}/publish`, {}, { withCredentials: true });
      toast.success(res.data.published ? 'Quiz published — now live on home page' : 'Quiz unpublished');
      fetchQuizzes();
    } catch {
      toast.error('Failed to toggle publish status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (quiz) => {
    if (!window.confirm(`Delete "${quiz.title}"? This will also delete all attempts.`)) return;
    setDeletingId(quiz.id);
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/sponsored-quizzes/${quiz.id}`, { withCredentials: true });
      toast.success('Quiz deleted');
      setQuizzes(q => q.filter(x => x.id !== quiz.id));
    } catch {
      toast.error('Failed to delete quiz');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = async (quiz) => {
    if (expandedId === quiz.id) { setExpandedId(null); setExpandedQuestions([]); return; }
    setExpandedId(quiz.id);
    setLoadingQuestions(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/sponsored-quizzes/${quiz.id}`, { withCredentials: true });
      setExpandedQuestions(res.data.quiz?.questions || []);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const Field = ({ label, children, required }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sponsored Quizzes</h2>
          <p className="text-gray-500 text-sm mt-1">
            Import MCQs from Google Sheets → publish → appears as home-page banner
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
          <Plus className="w-4 h-4" /> New Quiz
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 text-lg">{editingId ? 'Edit Quiz' : 'Create New Quiz'}</h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Quiz Title" required>
              <input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. SSC GK Special — 20 Questions" />
            </Field>

            <Field label="Sponsor / Institute Name">
              <input className={inp} value={form.sponsor_name} onChange={e => setForm(f => ({ ...f, sponsor_name: e.target.value }))} placeholder="e.g. Rajasthan IAS Academy" />
            </Field>

            <div className="md:col-span-2">
              <Field label="Description">
                <textarea className={inp + " resize-none"} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description shown on the banner card..." />
              </Field>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">
                  Google Sheet URL <span className="text-red-500">*</span>
                </label>
                <button type="button" onClick={() => setShowSheetHelp(h => !h)} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Sheet format guide
                </button>
              </div>
              <input className={inp} type="url" value={form.sheet_url} onChange={e => setForm(f => ({ ...f, sheet_url: e.target.value }))} placeholder="https://docs.google.com/spreadsheets/d/..." />
              {showSheetHelp && (
                <pre className="mt-2 text-xs bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-indigo-800 whitespace-pre-wrap font-mono">
                  {SHEET_HELP}
                </pre>
              )}
            </div>

            <Field label="Banner Image URL">
              <input className={inp} type="url" value={form.banner_image} onChange={e => setForm(f => ({ ...f, banner_image: e.target.value }))} placeholder="https://... (1200×400 recommended)" />
            </Field>

            <Field label="Seconds per question">
              <div className="flex items-center gap-2">
                <input className={inp} type="number" min={10} max={120} value={form.time_per_question} onChange={e => setForm(f => ({ ...f, time_per_question: parseInt(e.target.value) || 30 }))} />
                <span className="text-sm text-gray-400">sec</span>
              </div>
            </Field>

            {form.banner_image && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Preview</label>
                <img src={form.banner_image} alt="Banner preview" className="w-full max-h-40 object-cover rounded-lg border border-gray-200" onError={e => { e.target.style.display = 'none'; }} />
              </div>
            )}

            <div className="md:col-span-2 flex items-center gap-3">
              <button type="button" onClick={() => setForm(f => ({ ...f, published: !f.published }))}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.published ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${form.published ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {form.published ? 'Publish immediately (visible on home page)' : 'Save as draft (not visible yet)'}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
            <button onClick={closeForm} className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? (saving ? 'Saving...' : 'Save Changes') : (saving ? 'Importing & Saving...' : 'Import & Create')}
            </button>
          </div>
        </div>
      )}

      {/* Quiz List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No sponsored quizzes yet</p>
          <p className="text-gray-400 text-sm mt-1">Create one and import MCQs from a Google Sheet.</p>
          <button onClick={openAdd} className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Create First Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map(quiz => (
            <div key={quiz.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${quiz.published ? 'border-green-200' : 'border-gray-200'}`}>
              {/* Card header */}
              <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="w-28 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0 flex items-center justify-center">
                  {quiz.banner_image
                    ? <img src={quiz.banner_image} alt={quiz.title} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    : <BookOpen className="w-8 h-8 text-indigo-300" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">{quiz.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${quiz.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {quiz.published ? '● Live' : '◌ Draft'}
                    </span>
                  </div>
                  {quiz.sponsor_name && <p className="text-xs text-indigo-600 font-medium mb-1">{quiz.sponsor_name}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {quiz.question_count} questions</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {quiz.time_per_question}s/q</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {quiz.attempt_count || 0} attempts</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Re-import */}
                  <button onClick={() => handleReimport(quiz)} disabled={reimporting === quiz.id} title="Re-import questions from sheet"
                    className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                    {reimporting === quiz.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>

                  {/* Expand questions */}
                  <button onClick={() => toggleExpand(quiz)} title="Preview questions"
                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition">
                    {expandedId === quiz.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Publish toggle */}
                  <button onClick={() => handleTogglePublish(quiz)} disabled={togglingId === quiz.id} title={quiz.published ? 'Unpublish' : 'Publish'}
                    className={`p-2 rounded-lg transition ${quiz.published ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                    {togglingId === quiz.id ? <Loader2 className="w-4 h-4 animate-spin" /> : quiz.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Edit */}
                  <button onClick={() => openEdit(quiz)} title="Edit"
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button onClick={() => handleDelete(quiz)} disabled={deletingId === quiz.id} title="Delete"
                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                    {deletingId === quiz.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sheet URL link */}
              {quiz.sheet_url && (
                <div className="px-4 pb-3">
                  <a href={quiz.sheet_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                    <ExternalLink className="w-3 h-3" /> View Source Sheet
                  </a>
                </div>
              )}

              {/* Expanded questions preview */}
              {expandedId === quiz.id && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
                  {loadingQuestions ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading questions…</div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{expandedQuestions.length} Questions</p>
                      {expandedQuestions.map((q, i) => (
                        <div key={q.id || i} className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-sm font-medium text-gray-800 mb-2">{i + 1}. {q.question}</p>
                          <div className="grid grid-cols-2 gap-1.5 mb-2">
                            {['a','b','c','d'].map(letter => {
                              const val = q[`option_${letter}`];
                              const isCorrect = q.correct_answer?.toUpperCase() === letter.toUpperCase();
                              return val ? (
                                <div key={letter} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${isCorrect ? 'bg-green-50 text-green-700 border border-green-200 font-medium' : 'bg-gray-50 text-gray-600'}`}>
                                  {isCorrect && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                                  <span className="font-semibold mr-1">{letter.toUpperCase()}.</span> {val}
                                </div>
                              ) : null;
                            })}
                          </div>
                          {q.explanation && <p className="text-xs text-gray-400 italic">💡 {q.explanation}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Help */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-indigo-700">
        <p className="font-semibold mb-1">💡 How it works</p>
        <ol className="list-decimal list-inside space-y-1 text-indigo-600">
          <li>Create a Google Sheet with your MCQs (use the format guide above)</li>
          <li>Share it: <strong>File → Share → Anyone with the link → Viewer</strong></li>
          <li>Paste the link here, fill in the quiz details, and click <strong>Import & Create</strong></li>
          <li>Toggle <strong>Publish</strong> → the quiz card appears on the Ceibaa home page</li>
          <li>Users click the card, attempt the quiz, and see their leaderboard rank</li>
        </ol>
      </div>
    </div>
  );
}
