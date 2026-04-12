import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Trophy, Calendar, Users, ArrowLeft, CheckCircle2, Link2, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function HackathonDetail() {
  const { hackId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [projectLink, setProjectLink] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/recruitment/hackathon/${hackId}/register`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setRegistered(true);
    } catch (err) { setError(err.response?.data?.detail || 'Registration failed'); }
  };

  const handleSubmit = async () => {
    if (!projectLink) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/recruitment/hackathon/${hackId}/submit`, { project_link: projectLink, description: projDesc }, { headers: { Authorization: `Bearer ${token}` } });
      setError('');
      alert('Submission successful!');
    } catch (err) { setError(err.response?.data?.detail || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#4f7cff] border-t-transparent rounded-full animate-spin" /></div>;
  if (!post) return <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center text-[#8892b0]">Not found</div>;

  return (
    <div className="min-h-screen bg-[#0d0f14]" data-testid="hackathon-detail-page">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#8892b0] hover:text-[#e8eaf0] mb-6 text-sm"><ArrowLeft size={16} /> Back</button>

        <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={20} className="text-[#22c55e]" />
            <span className="text-[#22c55e] text-xs font-medium uppercase tracking-wider">Hackathon</span>
          </div>
          <h1 className="text-[#e8eaf0] text-2xl font-bold">{post.title}</h1>
          <Link to={`/company/${post.company_slug}`} className="text-[#4f7cff] text-sm hover:underline mt-1 inline-block">{post.company_name}</Link>
          <p className="text-[#8892b0] text-sm mt-4 leading-relaxed">{post.description}</p>

          {post.theme && <div className="mt-4"><span className="text-[#8892b0] text-xs uppercase tracking-wider">Theme</span><p className="text-[#e8eaf0] text-sm mt-1">{post.theme}</p></div>}

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-[#8892b0]">
            {post.start_date && <span className="flex items-center gap-1.5 bg-[#141720] px-3 py-1.5 rounded-lg"><Calendar size={14} /> Start: {post.start_date}</span>}
            {post.end_date && <span className="flex items-center gap-1.5 bg-[#141720] px-3 py-1.5 rounded-lg"><Calendar size={14} /> End: {post.end_date}</span>}
            {post.team_size && <span className="flex items-center gap-1.5 bg-[#141720] px-3 py-1.5 rounded-lg"><Users size={14} /> Team of {post.team_size}</span>}
          </div>

          {post.prizes && (
            <div className="mt-6">
              <span className="text-[#8892b0] text-xs uppercase tracking-wider">Prize Structure</span>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {post.prizes.first && <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl p-4 text-center"><span className="text-[#f59e0b] text-2xl font-bold">1st</span><p className="text-[#e8eaf0] font-semibold mt-1">&#8377;{post.prizes.first}</p></div>}
                {post.prizes.second && <div className="bg-[#8892b0]/10 border border-[#8892b0]/20 rounded-xl p-4 text-center"><span className="text-[#8892b0] text-2xl font-bold">2nd</span><p className="text-[#e8eaf0] font-semibold mt-1">&#8377;{post.prizes.second}</p></div>}
                {post.prizes.third && <div className="bg-[#cd7f32]/10 border border-[#cd7f32]/20 rounded-xl p-4 text-center"><span className="text-[#cd7f32] text-2xl font-bold">3rd</span><p className="text-[#e8eaf0] font-semibold mt-1">&#8377;{post.prizes.third}</p></div>}
              </div>
            </div>
          )}

          {error && <div className="flex items-center gap-2 text-[#ef4444] text-sm mt-4 bg-[#ef4444]/10 p-3 rounded-lg"><AlertCircle size={16} /> {error}</div>}

          {!registered ? (
            <button onClick={handleRegister} data-testid="register-hackathon-btn" className="w-full mt-6 py-3 bg-[#22c55e] text-white rounded-xl font-medium hover:bg-[#1ea34e] transition-colors">Register for Hackathon</button>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-[#22c55e] text-sm"><CheckCircle2 size={16} /> Registered! Submit your project below.</div>
              <input
                type="url" placeholder="Project link (GitHub / URL)" value={projectLink} onChange={e => setProjectLink(e.target.value)}
                data-testid="project-link-input"
                className="w-full px-4 py-3 bg-[#141720] border border-[#252a3d] rounded-xl text-[#e8eaf0] placeholder-[#8892b0]/50 focus:outline-none focus:border-[#4f7cff]"
              />
              <textarea
                placeholder="Brief description of your project" value={projDesc} onChange={e => setProjDesc(e.target.value)}
                className="w-full px-4 py-3 bg-[#141720] border border-[#252a3d] rounded-xl text-[#e8eaf0] placeholder-[#8892b0]/50 focus:outline-none focus:border-[#4f7cff] h-24 resize-none"
              />
              <button onClick={handleSubmit} disabled={submitting || !projectLink} data-testid="submit-project-btn" className="w-full py-3 bg-[#4f7cff] text-white rounded-xl font-medium disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Project'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
