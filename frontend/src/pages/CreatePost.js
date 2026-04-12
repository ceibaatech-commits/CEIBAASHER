import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, Code2, Trophy, Calendar, Plus, ArrowLeft, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const postTypes = [
  { key: 'job', label: 'Job / Internship', icon: Briefcase, color: '#4f7cff' },
  { key: 'quiz', label: 'MCQ Quiz', icon: Code2, color: '#c084fc' },
  { key: 'hackathon', label: 'Hackathon', icon: Trophy, color: '#22c55e' },
  { key: 'event', label: 'Event', icon: Calendar, color: '#f59e0b' },
];

const MAX_QUESTIONS = 25;

export default function CreatePost() {
  const navigate = useNavigate();
  const [postType, setPostType] = useState('job');
  const [form, setForm] = useState({ title: '', description: '', role_type: 'Full-time', location: '', salary: '', air_filter: '', min_qualification: '', deadline: '', screening_questions: [''], time_limit: 15, reward: '', top_n_shortlist: 10, theme: '', start_date: '', end_date: '', team_size: 1, submission_format: 'GitHub repository link', event_type: 'Webinar', event_date: '', platform: '', registration_limit: '', prize1: '', prize2: '', prize3: '' });

  // Quiz — like CEIBAA quiz room: select exam, subject, topic, auto-generate questions
  const [quizMode, setQuizMode] = useState('auto'); // 'auto' = CEIBAA engine, 'manual' = type questions
  const [quizExam, setQuizExam] = useState('');
  const [quizSubject, setQuizSubject] = useState('');
  const [quizTopic, setQuizTopic] = useState('');
  const [quizCount, setQuizCount] = useState(10);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [manualQuestions, setManualQuestions] = useState([{ question: '', options: ['', '', '', ''], correct_answer: 0 }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Auto-generate quiz from CEIBAA engine
  const generateQuiz = async () => {
    if (!quizExam || !quizSubject) { setError('Select exam and subject'); return; }
    setGeneratingQuiz(true); setError('');
    try {
      const count = Math.min(quizCount, MAX_QUESTIONS);
      const body = { exam: quizExam, subject: quizSubject, topic: quizTopic || undefined, numberOfQuestions: count };
      const { data } = await axios.post(`${BACKEND_URL}/api/quiz/start`, body);
      if (data.success && data.questions?.length > 0) {
        const formatted = data.questions.slice(0, MAX_QUESTIONS).map(q => ({
          question: q.question || q.text || '',
          options: q.options || [],
          correct_answer: q.correctAnswer ?? q.correct_answer ?? 0,
          explanation: q.explanation || ''
        }));
        setGeneratedQuestions(formatted);
      } else {
        setError('No questions found for this combination. Try different exam/subject.');
      }
    } catch (err) {
      setError('Failed to generate questions. Try a different exam/subject combination.');
    } finally { setGeneratingQuiz(false); }
  };

  // Manual question helpers
  const addManualQ = () => { if (manualQuestions.length < MAX_QUESTIONS) setManualQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], correct_answer: 0 }]); };
  const removeManualQ = (i) => setManualQuestions(prev => prev.filter((_, idx) => idx !== i));
  const updateManualQ = (i, field, val) => {
    const nq = [...manualQuestions];
    if (field === 'option') { nq[i].options[val.idx] = val.val; }
    else { nq[i][field] = val; }
    setManualQuestions(nq);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('recruiter_token');
      if (!token) { navigate('/recruiter'); return; }
      const body = { post_type: postType, title: form.title, description: form.description };
      if (postType === 'job') {
        Object.assign(body, { role_type: form.role_type, location: form.location, salary: form.salary, air_filter: form.air_filter ? parseInt(form.air_filter) : null, min_qualification: form.min_qualification, deadline: form.deadline, screening_questions: (form.screening_questions || []).filter(q => q.trim()) });
      } else if (postType === 'quiz') {
        const questions = quizMode === 'auto' ? generatedQuestions : manualQuestions.filter(q => q.question.trim());
        if (questions.length === 0) { setError('Generate or add at least 1 question'); setLoading(false); return; }
        Object.assign(body, { num_questions: questions.length, time_limit: parseInt(form.time_limit), reward: form.reward, top_n_shortlist: parseInt(form.top_n_shortlist), questions });
      } else if (postType === 'hackathon') {
        Object.assign(body, { theme: form.theme, prizes: { first: form.prize1, second: form.prize2, third: form.prize3 }, start_date: form.start_date, end_date: form.end_date, team_size: parseInt(form.team_size), submission_format: form.submission_format });
      } else if (postType === 'event') {
        Object.assign(body, { event_type: form.event_type, event_date: form.event_date, platform: form.platform, registration_limit: form.registration_limit ? parseInt(form.registration_limit) : null });
      }
      await axios.post(`${BACKEND_URL}/api/recruitment/posts`, body, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(true);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to create post'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center" data-testid="post-created-success">
      <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-8 text-center max-w-md">
        <CheckCircle2 size={48} className="mx-auto text-[#22c55e] mb-4" />
        <h2 className="text-[#e8eaf0] text-xl font-bold">Post Submitted!</h2>
        <p className="text-[#8892b0] mt-2 text-sm">Submitted for CEIBAA admin approval. It will go live once approved.</p>
        <div className="flex gap-3 mt-6 justify-center">
          <button onClick={() => navigate('/recruiter/dashboard')} className="px-5 py-2 bg-[#4f7cff] text-white rounded-xl text-sm font-semibold">Dashboard</button>
          <button onClick={() => { setSuccess(false); setForm({ ...form, title: '', description: '' }); setGeneratedQuestions([]); }} className="px-5 py-2 bg-[#1a1e2e] border border-[#252a3d] text-[#e8eaf0] rounded-xl text-sm">Create Another</button>
        </div>
      </div>
    </div>
  );

  const inputCls = "w-full px-4 py-3 bg-[#141720] border border-[#252a3d] rounded-xl text-[#e8eaf0] placeholder-[#8892b0]/50 focus:outline-none focus:border-[#4f7cff] transition-colors text-sm";
  const labelCls = "text-[#8892b0] text-xs uppercase tracking-wider block mb-1.5";

  const examOptions = ['JEE', 'NEET', 'UPSC', 'SSC', 'Banking', 'GATE', 'CAT', 'NDA', 'AFCAT', 'RRB-NTPC'];
  const subjectOptions = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Reasoning', 'Quantitative Aptitude', 'General Knowledge', 'Computer Science', 'Data Structures'];

  return (
    <div className="min-h-screen bg-[#0d0f14]" data-testid="create-post-page">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/recruiter/dashboard')} className="flex items-center gap-2 text-[#8892b0] hover:text-[#e8eaf0] mb-6 text-sm"><ArrowLeft size={16} /> Back to Dashboard</button>
        <h1 className="text-[#e8eaf0] text-2xl font-bold mb-6">Create New Post</h1>

        {/* Post Type Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {postTypes.map(pt => {
            const Icon = pt.icon;
            return (
              <button key={pt.key} onClick={() => setPostType(pt.key)} data-testid={`type-${pt.key}`}
                className={`p-4 rounded-xl border-2 text-center transition-all ${postType === pt.key ? 'border-[#4f7cff] bg-[#4f7cff]/10' : 'border-[#252a3d] bg-[#1a1e2e] hover:border-[#4f7cff]/30'}`}>
                <Icon size={24} className="mx-auto mb-2" style={{ color: pt.color }} />
                <span className="text-[#e8eaf0] text-sm font-medium">{pt.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-6">
          <div><label className={labelCls}>Title *</label><input value={form.title} onChange={e => set('title', e.target.value)} required className={inputCls} placeholder="e.g. Software Developer - Campus Hiring" data-testid="post-title-input" /></div>
          <div><label className={labelCls}>Description *</label><textarea value={form.description} onChange={e => set('description', e.target.value)} required className={`${inputCls} h-28 resize-none`} placeholder="Describe the role, requirements, and benefits..." data-testid="post-description-input" /></div>

          {/* ── Job Fields ── */}
          {postType === 'job' && (<>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Role Type</label><select value={form.role_type} onChange={e => set('role_type', e.target.value)} className={inputCls}><option value="Full-time">Full-time</option><option value="Internship">Internship</option><option value="Part-time">Part-time</option></select></div>
              <div><label className={labelCls}>Location</label><input value={form.location} onChange={e => set('location', e.target.value)} className={inputCls} placeholder="City or Remote" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Salary / Stipend</label><input value={form.salary} onChange={e => set('salary', e.target.value)} className={inputCls} placeholder="e.g. 7-9 LPA" /></div>
              <div><label className={labelCls}>AIR Filter (max rank)</label><input type="number" value={form.air_filter} onChange={e => set('air_filter', e.target.value)} className={inputCls} placeholder="e.g. 20000" /></div>
            </div>
            <div><label className={labelCls}>Min Qualification</label><input value={form.min_qualification} onChange={e => set('min_qualification', e.target.value)} className={inputCls} placeholder="e.g. B.Tech/B.E." /></div>
            <div><label className={labelCls}>Deadline</label><input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className={inputCls} /></div>
          </>)}

          {/* ── Quiz Fields — CEIBAA Engine Style ── */}
          {postType === 'quiz' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Time Limit (minutes)</label><input type="number" value={form.time_limit} onChange={e => set('time_limit', e.target.value)} className={inputCls} min="1" max="120" /></div>
                <div><label className={labelCls}>Top N Auto-Shortlist</label><input type="number" value={form.top_n_shortlist} onChange={e => set('top_n_shortlist', e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Reward</label><input value={form.reward} onChange={e => set('reward', e.target.value)} className={inputCls} placeholder="e.g. Direct shortlist for top 50 scorers" /></div>

              {/* Quiz Mode Toggle */}
              <div>
                <label className={labelCls}>Question Source</label>
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setQuizMode('auto')} className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${quizMode === 'auto' ? 'border-[#c084fc] bg-[#c084fc]/10 text-[#c084fc]' : 'border-[#252a3d] bg-[#141720] text-[#8892b0]'}`} data-testid="quiz-mode-auto">
                    CEIBAA Quiz Bank (auto)
                  </button>
                  <button type="button" onClick={() => setQuizMode('manual')} className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${quizMode === 'manual' ? 'border-[#c084fc] bg-[#c084fc]/10 text-[#c084fc]' : 'border-[#252a3d] bg-[#141720] text-[#8892b0]'}`} data-testid="quiz-mode-manual">
                    Custom Questions
                  </button>
                </div>
              </div>

              {quizMode === 'auto' ? (
                <div className="bg-[#141720] border border-[#252a3d] rounded-xl p-5 space-y-4">
                  <p className="text-[#c084fc] text-xs uppercase tracking-wider font-medium">Generate from CEIBAA Quiz Bank</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Exam *</label>
                      <select value={quizExam} onChange={e => setQuizExam(e.target.value)} className={inputCls} data-testid="quiz-exam-select">
                        <option value="">Select exam</option>
                        {examOptions.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Subject *</label>
                      <select value={quizSubject} onChange={e => setQuizSubject(e.target.value)} className={inputCls} data-testid="quiz-subject-select">
                        <option value="">Select subject</option>
                        {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Topic (optional)</label><input value={quizTopic} onChange={e => setQuizTopic(e.target.value)} className={inputCls} placeholder="e.g. Calculus" /></div>
                    <div><label className={labelCls}>Questions (max {MAX_QUESTIONS})</label><input type="number" value={quizCount} onChange={e => setQuizCount(Math.min(MAX_QUESTIONS, parseInt(e.target.value) || 1))} className={inputCls} min="1" max={MAX_QUESTIONS} data-testid="quiz-count-input" /></div>
                  </div>
                  <button type="button" onClick={generateQuiz} disabled={generatingQuiz} data-testid="generate-quiz-btn"
                    className="w-full py-3 bg-[#c084fc] text-white rounded-xl font-semibold hover:bg-[#a855f7] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {generatingQuiz ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</> : <><Code2 size={16} /> Generate {quizCount} Questions</>}
                  </button>
                  {generatedQuestions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[#22c55e] text-sm font-medium flex items-center gap-1"><CheckCircle2 size={14} /> {generatedQuestions.length} questions generated</p>
                      <div className="mt-2 max-h-60 overflow-y-auto space-y-2 pr-1">
                        {generatedQuestions.map((q, i) => (
                          <div key={i} className="bg-[#1a1e2e] rounded-lg p-3 text-sm">
                            <p className="text-[#e8eaf0] font-medium">Q{i + 1}. {q.question}</p>
                            <div className="grid grid-cols-2 gap-1 mt-1">
                              {q.options.map((opt, j) => (
                                <span key={j} className={`text-xs px-2 py-1 rounded ${j === q.correct_answer ? 'bg-[#22c55e]/15 text-[#22c55e]' : 'text-[#8892b0]'}`}>
                                  {String.fromCharCode(65 + j)}. {opt} {j === q.correct_answer && ' ✓'}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[#8892b0] text-xs">Max {MAX_QUESTIONS} questions. ({manualQuestions.length}/{MAX_QUESTIONS})</p>
                  {manualQuestions.map((q, i) => (
                    <div key={i} className="bg-[#141720] border border-[#252a3d] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[#8892b0] text-xs">Question {i + 1}</p>
                        {manualQuestions.length > 1 && <button type="button" onClick={() => removeManualQ(i)} className="text-[#ef4444] hover:text-[#ef4444]/80"><Trash2 size={14} /></button>}
                      </div>
                      <input value={q.question} onChange={e => updateManualQ(i, 'question', e.target.value)} className={`${inputCls} mb-2`} placeholder="Enter question" />
                      {q.options.map((opt, j) => (
                        <div key={j} className="flex items-center gap-2 mb-1">
                          <input type="radio" name={`correct-${i}`} checked={q.correct_answer === j} onChange={() => updateManualQ(i, 'correct_answer', j)} className="accent-[#c084fc]" />
                          <input value={opt} onChange={e => updateManualQ(i, 'option', { idx: j, val: e.target.value })} className={`${inputCls} flex-1`} placeholder={`Option ${String.fromCharCode(65 + j)}`} />
                        </div>
                      ))}
                    </div>
                  ))}
                  {manualQuestions.length < MAX_QUESTIONS && (
                    <button type="button" onClick={addManualQ} className="text-[#c084fc] text-sm flex items-center gap-1 hover:text-[#a855f7]"><Plus size={14} /> Add Question</button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Hackathon Fields ── */}
          {postType === 'hackathon' && (<>
            <div><label className={labelCls}>Theme</label><input value={form.theme} onChange={e => set('theme', e.target.value)} className={inputCls} placeholder="Hackathon theme" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>1st Prize</label><input value={form.prize1} onChange={e => set('prize1', e.target.value)} className={inputCls} placeholder="Amount" /></div>
              <div><label className={labelCls}>2nd Prize</label><input value={form.prize2} onChange={e => set('prize2', e.target.value)} className={inputCls} placeholder="Amount" /></div>
              <div><label className={labelCls}>3rd Prize</label><input value={form.prize3} onChange={e => set('prize3', e.target.value)} className={inputCls} placeholder="Amount" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Start Date</label><input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>End Date</label><input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Team Size</label><input type="number" value={form.team_size} onChange={e => set('team_size', e.target.value)} className={inputCls} min="1" /></div>
              <div><label className={labelCls}>Submission Format</label><input value={form.submission_format} onChange={e => set('submission_format', e.target.value)} className={inputCls} /></div>
            </div>
          </>)}

          {/* ── Event Fields ── */}
          {postType === 'event' && (<>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Event Type</label><select value={form.event_type} onChange={e => set('event_type', e.target.value)} className={inputCls}><option value="Webinar">Webinar</option><option value="Campus drive">Campus Drive</option><option value="Open day">Open Day</option><option value="AMA">AMA</option></select></div>
              <div><label className={labelCls}>Date & Time</label><input type="datetime-local" value={form.event_date} onChange={e => set('event_date', e.target.value)} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Platform</label><input value={form.platform} onChange={e => set('platform', e.target.value)} className={inputCls} placeholder="Zoom / Google Meet / In-person" /></div>
              <div><label className={labelCls}>Registration Limit</label><input type="number" value={form.registration_limit} onChange={e => set('registration_limit', e.target.value)} className={inputCls} placeholder="e.g. 500" /></div>
            </div>
          </>)}

          {error && <div className="flex items-center gap-2 text-[#ef4444] text-sm bg-[#ef4444]/10 p-3 rounded-lg"><AlertCircle size={16} /> {error}</div>}
          <button type="submit" disabled={loading} data-testid="submit-post-btn" className="w-full py-3.5 bg-[#4f7cff] text-white rounded-xl font-semibold hover:bg-[#3d6ae8] disabled:opacity-50 transition-colors text-base">
            {loading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </form>
      </div>
    </div>
  );
}
