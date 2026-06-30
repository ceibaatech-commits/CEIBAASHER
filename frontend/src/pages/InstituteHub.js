import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Play, BookOpen, CheckCircle2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const API_URL = window.location.origin;

const InstituteHub = () => {
  const { instituteId } = useParams();
  const { user, isAuthenticated, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [mcqSets, setMcqSets] = useState([]);
  const [activeMcq, setActiveMcq] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [userName, setUserName] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    const run = async () => {
      const [p, v, m] = await Promise.all([
        axios.get(`${API_URL}/api/institutes/${instituteId}/profile`),
        axios.get(`${API_URL}/api/institutes/${instituteId}/videos`),
        axios.get(`${API_URL}/api/institutes/${instituteId}/mcqs`)
      ]);
      setProfile(p.data.profile);
      setVideos(v.data.videos || []);
      setMcqSets(m.data.mcq_sets || []);
    };
    run();
  }, [instituteId]);

  const initials = useMemo(() => {
    const nm = profile?.institute_name || instituteId || 'Institute';
    return nm.split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase() || '').join('');
  }, [profile, instituteId]);

  const openAttempt = async (mcqId) => {
    const res = await axios.get(`${API_URL}/api/institutes/mcqs/${mcqId}`);
    const set = res.data.mcq_set;
    setActiveMcq(set);
    setAnswers(new Array((set.questions || []).length).fill(-1));
    setResult(null);
  };

  const submitAttempt = async () => {
    if (!activeMcq || !userName.trim()) return;
    const res = await axios.post(`${API_URL}/api/institutes/mcqs/${activeMcq.id}/attempt`, {
      user_name: userName,
      answers
    });
    setResult(res.data.result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-between" style={{ paddingTop: '72px' }}>
      <Header isLoggedIn={isAuthenticated()} user={user} onLogout={logout} />
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-slate-900 text-white p-6 md:p-8">
            <div className="flex items-center gap-4">
              {profile?.logo_url ? (
                <img src={profile.logo_url} alt={profile?.institute_name} className="w-16 h-16 rounded-2xl object-cover border border-white/30" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/15 grid place-items-center text-xl font-black">{initials}</div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{profile?.institute_name || instituteId}</h1>
                <p className="text-white/85 text-sm">{profile?.description || 'Daily videos and MCQ practice packs for exam success.'}</p>
              </div>
            </div>
          </div>

          <section>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-4">Featured Video Lessons</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map(v => (
                <article key={v.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="aspect-video bg-slate-100 relative">
                    {v.thumbnail_url ? <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" /> : null}
                    <a href={v.video_url} target="_blank" rel="noreferrer" className="absolute inset-0 grid place-items-center bg-black/10 hover:bg-black/20 transition-colors">
                      <span className="w-12 h-12 rounded-full bg-white/85 grid place-items-center"><Play className="w-5 h-5 text-slate-900 ml-0.5" /></span>
                    </a>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-indigo-700">{v.exam_id || 'General'} {v.subject ? `• ${v.subject}` : ''}</p>
                    <h3 className="font-bold text-slate-900 mt-1 line-clamp-2">{v.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{v.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-4">Attempt MCQ Packs</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mcqSets.map(m => (
                <article key={m.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="aspect-video bg-slate-100">
                    {m.thumbnail_url ? <img src={m.thumbnail_url} alt={m.title} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-slate-400"><BookOpen className="w-10 h-10" /></div>}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-indigo-700">{m.exam_id || 'General'} {m.subject ? `• ${m.subject}` : ''}</p>
                    <h3 className="font-bold text-slate-900 mt-1 line-clamp-2">{m.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{m.description}</p>
                    <p className="text-xs text-slate-500 mt-2">{m.question_count} questions • {m.attempt_count || 0} attempts</p>
                    <button onClick={() => openAttempt(m.id)} className="w-full mt-3 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-1.5 text-xs">Start Attempt</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      {activeMcq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setActiveMcq(null)}>
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{activeMcq.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{activeMcq.description}</p>
            </div>

            {!result && (
              <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Enter your name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            )}

            <div className="space-y-4">
              {(activeMcq.questions || []).map((q, qi) => (
                <div key={`q-${qi}`} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900 mb-3">Q{qi + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {(q.options || []).map((opt, oi) => (
                      <label key={`q-${qi}-opt-${oi}`} className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="radio" checked={answers[qi] === oi} onChange={() => setAnswers(prev => {
                          const copy = [...prev];
                          copy[qi] = oi;
                          return copy;
                        })} />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!result && (
              <button onClick={submitAttempt} className="w-full rounded-xl bg-indigo-700 text-white py-2 font-bold text-sm">Submit Attempt</button>
            )}

            {result && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-bold text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Score: {result.correct}/{result.total} ({result.score_percent}%)</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default InstituteHub;
