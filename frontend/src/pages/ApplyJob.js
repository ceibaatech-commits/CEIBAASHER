import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Briefcase, MapPin, DollarSign, Clock, CheckCircle2, ArrowLeft, Users, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ApplyJob() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchPost(); }, [jobId]);

  const fetchPost = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/posts/${jobId}`);
      setPost(data);
    } catch (err) { setError('Post not found'); }
    finally { setLoading(false); }
  };

  const handleApply = async () => {
    if (!user) { navigate('/login'); return; }
    setApplying(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/recruitment/apply/${jobId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setApplied(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to apply');
    } finally { setApplying(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#4f7cff] border-t-transparent rounded-full animate-spin" /></div>;
  if (!post) return <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center text-[#8892b0]">Post not found</div>;

  return (
    <div className="min-h-screen bg-[#0d0f14]" data-testid="apply-job-page">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#8892b0] hover:text-[#e8eaf0] mb-6 text-sm" data-testid="back-btn">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#141720] flex-shrink-0">
              {post.company_logo && <img src={post.company_logo} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full text-xs bg-[#4f7cff]/20 text-[#4f7cff] font-medium">{post.post_type === 'event' ? 'Event' : post.role_type || 'Job'}</span>
              <h1 className="text-[#e8eaf0] text-2xl font-bold mt-2">{post.title}</h1>
              <Link to={`/company/${post.company_slug}`} className="text-[#4f7cff] text-sm hover:underline mt-1 inline-block">{post.company_name}</Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6 text-sm text-[#8892b0]">
            {post.location && <span className="flex items-center gap-1.5 bg-[#141720] px-3 py-1.5 rounded-lg"><MapPin size={14} /> {post.location}</span>}
            {post.salary && <span className="flex items-center gap-1.5 bg-[#141720] px-3 py-1.5 rounded-lg"><DollarSign size={14} /> {post.salary}</span>}
            {post.deadline && <span className="flex items-center gap-1.5 bg-[#141720] px-3 py-1.5 rounded-lg"><Clock size={14} /> Deadline: {post.deadline}</span>}
            {post.air_filter && <span className="flex items-center gap-1.5 bg-[#f59e0b]/10 px-3 py-1.5 rounded-lg text-[#f59e0b]"><Users size={14} /> AIR ≤ {post.air_filter.toLocaleString()}</span>}
          </div>

          {post.min_qualification && (
            <div className="mb-4"><span className="text-[#8892b0] text-xs uppercase tracking-wider">Minimum Qualification</span><p className="text-[#e8eaf0] text-sm mt-1">{post.min_qualification}</p></div>
          )}

          <div className="mb-6">
            <span className="text-[#8892b0] text-xs uppercase tracking-wider">Description</span>
            <p className="text-[#e8eaf0] text-sm mt-2 leading-relaxed whitespace-pre-wrap">{post.description}</p>
          </div>

          {post.screening_questions?.length > 0 && (
            <div className="mb-6">
              <span className="text-[#8892b0] text-xs uppercase tracking-wider">Screening Questions</span>
              <ul className="mt-2 space-y-2">
                {post.screening_questions.map((q, i) => <li key={i} className="text-[#e8eaf0] text-sm bg-[#141720] p-3 rounded-lg">{i + 1}. {q}</li>)}
              </ul>
            </div>
          )}

          {error && <div className="flex items-center gap-2 text-[#ef4444] text-sm mb-4 bg-[#ef4444]/10 p-3 rounded-lg" data-testid="apply-error"><AlertCircle size={16} /> {error}</div>}

          {applied ? (
            <div className="flex items-center gap-2 text-[#22c55e] bg-[#22c55e]/10 p-4 rounded-lg" data-testid="applied-success">
              <CheckCircle2 size={20} /> Applied successfully! Track your application in <Link to="/my-applications" className="underline">My Applications</Link>
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={applying}
              data-testid="apply-btn"
              className="w-full py-3 bg-[#4f7cff] text-white rounded-xl font-medium hover:bg-[#3d6ae8] transition-colors disabled:opacity-50"
            >
              {applying ? 'Applying...' : 'Apply with CEIBAA Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
