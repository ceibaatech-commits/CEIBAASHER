import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Briefcase, MapPin, DollarSign, Clock, CheckCircle2, ArrowLeft, Users, AlertCircle, FileText, Pencil } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ApplyJob() {
  const { jobId } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');
  const [resumeStatus, setResumeStatus] = useState({ loaded: false, hasContent: false });

  useEffect(() => { fetchPost(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [jobId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated?.()) return;
    (async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/resume/me`);
        const hasContent = !!(
          (data.experience && data.experience.length) ||
          (data.education && data.education.length) ||
          (data.projects && data.projects.length) ||
          (data.basics && data.basics.headline)
        );
        setResumeStatus({ loaded: true, hasContent });
      } catch (e) {
        setResumeStatus({ loaded: true, hasContent: false });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

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
      await axios.post(`${BACKEND_URL}/api/recruitment/apply/${jobId}`, {});
      setApplied(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to apply');
    } finally { setApplying(false); }
  };

  if (loading) return <div className="min-h-screen bg-slate-50"><Header isLoggedIn={isAuthenticated?.()} user={user} /><div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div><Footer /></div>;
  if (!post) return <div className="min-h-screen bg-slate-50"><Header isLoggedIn={isAuthenticated?.()} user={user} /><div className="flex items-center justify-center py-32 text-slate-500">Post not found</div><Footer /></div>;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="apply-job-page">
      <Header isLoggedIn={isAuthenticated?.()} user={user} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 text-sm" data-testid="back-btn">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
              {post.company_logo && <img src={post.company_logo} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600 font-medium border border-blue-200">{post.post_type === 'event' ? 'Event' : post.role_type || 'Job'}</span>
              <h1 className="text-slate-900 text-2xl font-bold mt-2">{post.title}</h1>
              <Link to={`/company/${post.company_slug}`} className="text-blue-600 text-sm hover:underline mt-1 inline-block">{post.company_name}</Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6 text-sm text-slate-600">
            {post.location && <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><MapPin size={14} /> {post.location}</span>}
            {post.salary && <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><DollarSign size={14} /> {post.salary}</span>}
            {post.deadline && <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><Clock size={14} /> Deadline: {post.deadline}</span>}
            {post.air_filter && <span className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg text-amber-700"><Users size={14} /> AIR &le; {post.air_filter.toLocaleString()}</span>}
          </div>

          {post.min_qualification && (
            <div className="mb-4"><span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Minimum Qualification</span><p className="text-slate-800 text-sm mt-1">{post.min_qualification}</p></div>
          )}

          <div className="mb-6">
            <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Description</span>
            <p className="text-slate-700 text-sm mt-2 leading-relaxed whitespace-pre-wrap">{post.description}</p>
          </div>

          {post.screening_questions?.length > 0 && (
            <div className="mb-6">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Screening Questions</span>
              <ul className="mt-2 space-y-2">
                {post.screening_questions.map((q, i) => <li key={i} className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-200">{i + 1}. {q}</li>)}
              </ul>
            </div>
          )}

          {error && <div className="flex items-center gap-2 text-rose-600 text-sm mb-4 bg-rose-50 p-3 rounded-lg border border-rose-200" data-testid="apply-error"><AlertCircle size={16} /> {error}</div>}

          {resumeStatus.loaded && !applied && (
            <div
              className={`mb-4 p-4 rounded-xl border flex items-start gap-3 ${
                resumeStatus.hasContent
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
              data-testid="resume-status-card"
            >
              <FileText size={20} className={resumeStatus.hasContent ? 'text-emerald-600 flex-shrink-0' : 'text-amber-600 flex-shrink-0'} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {resumeStatus.hasContent ? 'Your CEIBAA resume is ready' : 'Build your resume first'}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {resumeStatus.hasContent
                    ? 'The recruiter will see your resume when you apply.'
                    : 'Applying now will only share your basic profile. Add experience, projects and education to stand out.'}
                </p>
              </div>
              <button
                onClick={() => navigate('/resume')}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 flex-shrink-0"
                data-testid="edit-resume-btn"
              >
                <Pencil size={12} /> {resumeStatus.hasContent ? 'Edit' : 'Build'}
              </button>
            </div>
          )}

          {applied ? (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-4 rounded-lg border border-emerald-200" data-testid="applied-success">
              <CheckCircle2 size={20} /> Applied successfully! Track your application in <Link to="/my-applications" className="underline font-medium">My Applications</Link>
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={applying}
              data-testid="apply-btn"
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {applying ? 'Applying...' : 'Apply with CEIBAA Profile'}
            </button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
