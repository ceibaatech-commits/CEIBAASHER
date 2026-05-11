import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Trophy, Calendar, Users, ArrowLeft, CheckCircle2, Link2, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function HackathonDetail() {
  const { hackId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [projectLink, setProjectLink] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // eslint-disable-next-line
  useEffect(() => { fetchPost(); }, [hackId]);

  const fetchPost = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/posts/${hackId}`);
      setPost(data);
    } catch { setError('Not found'); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await axios.post(`${BACKEND_URL}/api/recruitment/hackathon/${hackId}/register`, {});
      setRegistered(true);
    } catch (err) { setError(err.response?.data?.detail || 'Registration failed'); }
  };

  const handleSubmit = async () => {
    if (!projectLink) return;
    setSubmitting(true);
    try {
      await axios.post(`${BACKEND_URL}/api/recruitment/hackathon/${hackId}/submit`, { project_link: projectLink, description: projDesc });
      setError('');
      alert('Submission successful!');
    } catch (err) { setError(err.response?.data?.detail || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-slate-50"><Header isLoggedIn={isAuthenticated?.()} user={user} /><div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div><Footer /></div>;
  if (!post) return <div className="min-h-screen bg-slate-50"><Header isLoggedIn={isAuthenticated?.()} user={user} /><div className="flex items-center justify-center py-32 text-slate-500">Not found</div><Footer /></div>;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="hackathon-detail-page">
      <Header isLoggedIn={isAuthenticated?.()} user={user} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 text-sm"><ArrowLeft size={16} /> Back</button>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={20} className="text-emerald-600" />
            <span className="text-emerald-600 text-xs font-semibold uppercase tracking-wider">Hackathon</span>
          </div>
          <h1 className="text-slate-900 text-2xl font-bold">{post.title}</h1>
          <Link to={`/company/${post.company_slug}`} className="text-blue-600 text-sm hover:underline mt-1 inline-block">{post.company_name}</Link>
          <p className="text-slate-600 text-sm mt-4 leading-relaxed">{post.description}</p>

          {post.theme && <div className="mt-4"><span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Theme</span><p className="text-slate-800 text-sm mt-1">{post.theme}</p></div>}

          <div className="flex flex-wrap gap-3 mt-4 text-sm text-slate-600">
            {post.start_date && <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><Calendar size={14} /> Start: {post.start_date}</span>}
            {post.end_date && <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><Calendar size={14} /> End: {post.end_date}</span>}
            {post.team_size && <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><Users size={14} /> Team of {post.team_size}</span>}
          </div>

          {post.prizes && (
            <div className="mt-6">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Prize Structure</span>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {post.prizes.first && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center"><span className="text-amber-600 text-2xl font-bold">1st</span><p className="text-slate-800 font-semibold mt-1">&#8377;{post.prizes.first}</p></div>}
                {post.prizes.second && <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center"><span className="text-slate-500 text-2xl font-bold">2nd</span><p className="text-slate-800 font-semibold mt-1">&#8377;{post.prizes.second}</p></div>}
                {post.prizes.third && <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center"><span className="text-orange-600 text-2xl font-bold">3rd</span><p className="text-slate-800 font-semibold mt-1">&#8377;{post.prizes.third}</p></div>}
              </div>
            </div>
          )}

          {error && <div className="flex items-center gap-2 text-rose-600 text-sm mt-4 bg-rose-50 p-3 rounded-lg border border-rose-200"><AlertCircle size={16} /> {error}</div>}

          {!registered ? (
            <button onClick={handleRegister} data-testid="register-hackathon-btn" className="w-full mt-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors">Register for Hackathon</button>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 p-3 rounded-lg border border-emerald-200"><CheckCircle2 size={16} /> Registered! Submit your project below.</div>
              <input
                type="url" placeholder="Project link (GitHub / URL)" value={projectLink} onChange={e => setProjectLink(e.target.value)}
                data-testid="project-link-input"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                placeholder="Brief description of your project" value={projDesc} onChange={e => setProjDesc(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
              />
              <button onClick={handleSubmit} disabled={submitting || !projectLink} data-testid="submit-project-btn" className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors">
                {submitting ? 'Submitting...' : 'Submit Project'}
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
