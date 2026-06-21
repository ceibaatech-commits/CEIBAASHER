import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Upload, Video, BookOpen, Plus, Save, Building2 } from 'lucide-react';

const API_URL = window.location.origin;

const blankQuestion = {
  question: '',
  options: ['', '', '', ''],
  correct_index: 0,
  explanation: ''
};

const InstitutePanel = () => {
  const [tab, setTab] = useState('videos');
  const [instituteId, setInstituteId] = useState(localStorage.getItem('ceibaa_institute_id') || 'demo-institute');
  const [profile, setProfile] = useState({ institute_name: '', logo_url: '', description: '', website_url: '' });
  const [authMode, setAuthMode] = useState('login');
  const [ownerToken, setOwnerToken] = useState(localStorage.getItem('ceibaa_institute_owner_token') || '');
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [authForm, setAuthForm] = useState({ owner_name: '', email: '', password: '' });

  const [videoForm, setVideoForm] = useState({ title: '', description: '', video_url: '', thumbnail_url: '', exam_id: '', subject: '' });
  const [mcqForm, setMcqForm] = useState({ title: '', description: '', thumbnail_url: '', exam_id: '', subject: '', questions: [blankQuestion] });

  const [videos, setVideos] = useState([]);
  const [mcqSets, setMcqSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const authCardRef = useRef(null);

  const authHeaders = ownerToken ? { Authorization: `Bearer ${ownerToken}` } : {};

  const initials = useMemo(() => {
    const name = (profile.institute_name || instituteId || 'Institute').trim();
    return name.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');
  }, [profile.institute_name, instituteId]);

  useEffect(() => {
    localStorage.setItem('ceibaa_institute_id', instituteId);
  }, [instituteId]);

  useEffect(() => {
    if (ownerToken) {
      localStorage.setItem('ceibaa_institute_owner_token', ownerToken);
    } else {
      localStorage.removeItem('ceibaa_institute_owner_token');
    }
  }, [ownerToken]);

  useEffect(() => {
    const verifyOwner = async () => {
      if (!ownerToken) {
        setOwnerInfo(null);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/api/institutes/auth/verify`, { headers: authHeaders });
        if (res.data?.success) {
          setOwnerInfo(res.data.owner || null);
          if (res.data.owner?.institute_id) {
            setInstituteId(res.data.owner.institute_id);
          }
        }
      } catch (_) {
        setOwnerInfo(null);
        setOwnerToken('');
      }
    };
    verifyOwner();
  }, [ownerToken]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [profileRes, videoRes, mcqRes] = await Promise.all([
          axios.get(`${API_URL}/api/institutes/${instituteId}/profile`),
          axios.get(`${API_URL}/api/institutes/${instituteId}/videos`),
          axios.get(`${API_URL}/api/institutes/${instituteId}/mcqs`)
        ]);
        setProfile(profileRes.data.profile || profile);
        setVideos(videoRes.data.videos || []);
        setMcqSets(mcqRes.data.mcq_sets || []);
      } catch (err) {
        setNotice('Unable to load institute data');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [instituteId]);

  useEffect(() => {
    if (!ownerInfo && window.location.hash === '#owner-auth') {
      authCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [ownerInfo]);

  const saveProfile = async () => {
    await axios.put(`${API_URL}/api/institutes/${instituteId}/profile`, profile, { headers: authHeaders });
    setNotice('Institute profile saved');
    setTimeout(() => setNotice(''), 2500);
  };

  const addVideo = async () => {
    if (!videoForm.title || !videoForm.video_url) return;
    const res = await axios.post(`${API_URL}/api/institutes/videos`, { institute_id: instituteId, ...videoForm }, { headers: authHeaders });
    setVideos(prev => [res.data.video, ...prev]);
    setVideoForm({ title: '', description: '', video_url: '', thumbnail_url: '', exam_id: '', subject: '' });
    setNotice('Video uploaded');
    setTimeout(() => setNotice(''), 2500);
  };

  const addQuestion = () => setMcqForm(prev => ({ ...prev, questions: [...prev.questions, { ...blankQuestion }] }));

  const updateQuestion = (index, patch) => {
    setMcqForm(prev => {
      const copy = [...prev.questions];
      copy[index] = { ...copy[index], ...patch };
      return { ...prev, questions: copy };
    });
  };

  const publishMcq = async () => {
    if (!mcqForm.title || !mcqForm.questions[0]?.question) return;
    const payload = {
      institute_id: instituteId,
      title: mcqForm.title,
      description: mcqForm.description,
      thumbnail_url: mcqForm.thumbnail_url,
      exam_id: mcqForm.exam_id,
      subject: mcqForm.subject,
      questions: mcqForm.questions
    };
    const res = await axios.post(`${API_URL}/api/institutes/mcqs`, payload, { headers: authHeaders });
    setMcqSets(prev => [res.data.mcq_set, ...prev]);
    setMcqForm({ title: '', description: '', thumbnail_url: '', exam_id: '', subject: '', questions: [{ ...blankQuestion }] });
    setNotice('MCQ set published');
    setTimeout(() => setNotice(''), 2500);
  };

  const handleOwnerAuth = async () => {
    try {
      setNotice('');
      if (!authForm.email || !authForm.password || !instituteId) {
        setNotice('Institute ID, email and password are required');
        return;
      }

      if (authMode === 'register') {
        if (!authForm.owner_name || !profile.institute_name) {
          setNotice('Owner name and institute name are required for registration');
          return;
        }
        const reg = await axios.post(`${API_URL}/api/institutes/auth/register`, {
          institute_id: instituteId,
          institute_name: profile.institute_name,
          owner_name: authForm.owner_name,
          email: authForm.email,
          password: authForm.password
        });
        setOwnerToken(reg.data.token || '');
        setOwnerInfo(reg.data.owner || null);
        setNotice('Institute owner account created and logged in');
      } else {
        const login = await axios.post(`${API_URL}/api/institutes/auth/login`, {
          institute_id: instituteId,
          email: authForm.email,
          password: authForm.password
        });
        setOwnerToken(login.data.token || '');
        setOwnerInfo(login.data.owner || null);
        setNotice('Logged in as institute owner');
      }
      setTimeout(() => setNotice(''), 2500);
    } catch (err) {
      setNotice(err?.response?.data?.detail || 'Authentication failed');
    }
  };

  const logoutOwner = () => {
    setOwnerToken('');
    setOwnerInfo(null);
    setNotice('Logged out');
    setTimeout(() => setNotice(''), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 md:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="Institute" className="w-16 h-16 rounded-2xl object-cover border border-white/30" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 grid place-items-center font-extrabold text-xl">{initials || 'CI'}</div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Coaching Institute Studio</h1>
                <p className="text-white/85 text-sm">Upload videos, publish MCQ packs, and manage student-ready thumbnails.</p>
              </div>
            </div>
            <a href={`/institute/${instituteId}`} className="inline-flex items-center rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 font-bold">Open Student Hub</a>
          </div>
        </div>

        <div id="owner-auth" ref={authCardRef} className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-extrabold text-slate-900">Institute Owner Access</h3>
            {ownerInfo ? (
              <button onClick={logoutOwner} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold">Logout</button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setAuthMode('login')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${authMode === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Login</button>
                <button onClick={() => setAuthMode('register')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${authMode === 'register' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Register</button>
              </div>
            )}
          </div>

          {ownerInfo ? (
            <div className="text-sm text-slate-700">
              <p><span className="font-semibold">Owner:</span> {ownerInfo.owner_name || ownerInfo.email}</p>
              <p><span className="font-semibold">Institute:</span> {ownerInfo.institute_id}</p>
              <p className="text-emerald-700 font-semibold mt-1">You can now edit your institute panel.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-3">
              {authMode === 'register' && (
                <input value={authForm.owner_name} onChange={(e) => setAuthForm(v => ({ ...v, owner_name: e.target.value }))} placeholder="Owner Name" className="rounded-xl border border-slate-300 px-3 py-2" />
              )}
              <input value={authForm.email} onChange={(e) => setAuthForm(v => ({ ...v, email: e.target.value }))} placeholder="Owner Email" className="rounded-xl border border-slate-300 px-3 py-2" />
              <input type="password" value={authForm.password} onChange={(e) => setAuthForm(v => ({ ...v, password: e.target.value }))} placeholder="Password" className="rounded-xl border border-slate-300 px-3 py-2" />
              <button onClick={handleOwnerAuth} className="rounded-xl bg-slate-900 text-white px-4 py-2 font-bold">{authMode === 'register' ? 'Create Owner Account' : 'Login'}</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Institute ID</label>
              <input value={instituteId} onChange={(e) => setInstituteId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="e.g. apex-academy" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Institute Name</label>
              <input value={profile.institute_name} onChange={(e) => setProfile(p => ({ ...p, institute_name: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Apex Academy" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Logo URL</label>
              <input value={profile.logo_url} onChange={(e) => setProfile(p => ({ ...p, logo_url: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Website URL</label>
              <input value={profile.website_url} onChange={(e) => setProfile(p => ({ ...p, website_url: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="https://..." />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea value={profile.description} onChange={(e) => setProfile(p => ({ ...p, description: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <button disabled={!ownerInfo} onClick={saveProfile} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"><Save className="w-4 h-4" /> Save Profile</button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setTab('videos')} className={`px-4 py-2 rounded-xl font-semibold ${tab === 'videos' ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200'}`}><Video className="w-4 h-4 inline mr-1" /> Videos</button>
          <button onClick={() => setTab('mcqs')} className={`px-4 py-2 rounded-xl font-semibold ${tab === 'mcqs' ? 'bg-rose-600 text-white' : 'bg-white border border-slate-200'}`}><BookOpen className="w-4 h-4 inline mr-1" /> MCQ Packs</button>
        </div>

        {!ownerInfo && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-2 text-sm font-semibold">
            Read access is open, but login as institute owner to edit profile, upload videos, or publish MCQ packs.
          </div>
        )}

        {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-2 text-sm font-semibold">{notice}</div>}

        {tab === 'videos' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <h3 className="font-extrabold text-slate-900">Upload Video</h3>
              <input value={videoForm.title} onChange={(e) => setVideoForm(v => ({ ...v, title: e.target.value }))} placeholder="Video title" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              <input value={videoForm.video_url} onChange={(e) => setVideoForm(v => ({ ...v, video_url: e.target.value }))} placeholder="Video URL" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              <input value={videoForm.thumbnail_url} onChange={(e) => setVideoForm(v => ({ ...v, thumbnail_url: e.target.value }))} placeholder="Thumbnail URL" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              <input value={videoForm.exam_id} onChange={(e) => setVideoForm(v => ({ ...v, exam_id: e.target.value }))} placeholder="Exam (JEE/NEET/NDA...)" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              <input value={videoForm.subject} onChange={(e) => setVideoForm(v => ({ ...v, subject: e.target.value }))} placeholder="Subject" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              <textarea value={videoForm.description} onChange={(e) => setVideoForm(v => ({ ...v, description: e.target.value }))} placeholder="Description" rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              <button disabled={!ownerInfo} onClick={addVideo} className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-sky-600 text-white px-4 py-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"><Upload className="w-4 h-4" /> Publish Video</button>
            </div>
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
              {videos.map(v => (
                <article key={v.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="aspect-video bg-slate-100">
                    {v.thumbnail_url ? <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-slate-400"><Video className="w-10 h-10" /></div>}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-sky-700">{v.exam_id || 'General'} {v.subject ? `• ${v.subject}` : ''}</p>
                    <h4 className="font-bold text-slate-900 mt-1 line-clamp-2">{v.title}</h4>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{v.description}</p>
                    <a href={v.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-sky-700">Open video</a>
                  </div>
                </article>
              ))}
              {!loading && videos.length === 0 && <div className="text-slate-500 text-sm">No videos yet.</div>}
            </div>
          </div>
        )}

        {tab === 'mcqs' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <h3 className="font-extrabold text-slate-900">Publish MCQ Pack</h3>
              <input value={mcqForm.title} onChange={(e) => setMcqForm(v => ({ ...v, title: e.target.value }))} placeholder="MCQ pack title" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              <input value={mcqForm.thumbnail_url} onChange={(e) => setMcqForm(v => ({ ...v, thumbnail_url: e.target.value }))} placeholder="Thumbnail URL" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              <input value={mcqForm.exam_id} onChange={(e) => setMcqForm(v => ({ ...v, exam_id: e.target.value }))} placeholder="Exam" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              <input value={mcqForm.subject} onChange={(e) => setMcqForm(v => ({ ...v, subject: e.target.value }))} placeholder="Subject" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              <textarea value={mcqForm.description} onChange={(e) => setMcqForm(v => ({ ...v, description: e.target.value }))} placeholder="Description" rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2" />

              <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
                {mcqForm.questions.map((q, qi) => (
                  <div key={`q-${qi}`} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-bold text-slate-500 mb-2">Question {qi + 1}</p>
                    <input value={q.question} onChange={(e) => updateQuestion(qi, { question: e.target.value })} placeholder="Question text" className="w-full rounded-lg border border-slate-300 px-2 py-1.5 mb-2" />
                    {q.options.map((opt, oi) => (
                      <div key={`opt-${oi}`} className="flex items-center gap-2 mb-1">
                        <input type="radio" checked={q.correct_index === oi} onChange={() => updateQuestion(qi, { correct_index: oi })} />
                        <input value={opt} onChange={(e) => {
                          const opts = [...q.options];
                          opts[oi] = e.target.value;
                          updateQuestion(qi, { options: opts });
                        }} placeholder={`Option ${oi + 1}`} className="w-full rounded-lg border border-slate-300 px-2 py-1.5" />
                      </div>
                    ))}
                    <input value={q.explanation} onChange={(e) => updateQuestion(qi, { explanation: e.target.value })} placeholder="Explanation (optional)" className="w-full rounded-lg border border-slate-300 px-2 py-1.5 mt-1" />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button disabled={!ownerInfo} onClick={addQuestion} className="flex-1 rounded-xl border border-slate-300 px-3 py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"><Plus className="w-4 h-4 inline mr-1" /> Add Q</button>
                <button disabled={!ownerInfo} onClick={publishMcq} className="flex-1 rounded-xl bg-rose-600 text-white px-3 py-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"><Upload className="w-4 h-4 inline mr-1" /> Publish</button>
              </div>
            </div>

            <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
              {mcqSets.map(m => (
                <article key={m.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="aspect-video bg-slate-100">
                    {m.thumbnail_url ? <img src={m.thumbnail_url} alt={m.title} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-slate-400"><BookOpen className="w-10 h-10" /></div>}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-rose-700">{m.exam_id || 'General'} {m.subject ? `• ${m.subject}` : ''}</p>
                    <h4 className="font-bold text-slate-900 mt-1 line-clamp-2">{m.title}</h4>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{m.description}</p>
                    <p className="text-xs text-slate-500 mt-2">{m.question_count} questions • {m.attempt_count || 0} attempts</p>
                  </div>
                </article>
              ))}
              {!loading && mcqSets.length === 0 && <div className="text-slate-500 text-sm">No MCQ packs yet.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutePanel;
