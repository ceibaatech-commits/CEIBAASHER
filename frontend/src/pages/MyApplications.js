import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Briefcase, CheckCircle2, XCircle, FileText, Sparkles, Bookmark, ChevronRight, MapPin, DollarSign, Clock, Code2, Trophy, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  applied:     { color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',    label: 'Applied' },
  shortlisted: { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Shortlisted' },
  interview:   { color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200',  label: 'Interview' },
  offer:       { color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',   label: 'Offer Received' },
  accepted:    { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Accepted' },
  rejected:    { color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-200',     label: 'Rejected' },
};

const postTypeIcons = { job: Briefcase, quiz: Code2, hackathon: Trophy, event: Calendar };

export default function MyApplications() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('applications');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchApps();
    fetchSaved();
  // eslint-disable-next-line
  }, [user]);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/my-applications`, { headers: { Authorization: `Bearer ${token}` } });
      setApps(data.applications || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSaved = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/my-bookmarks`, { headers: { Authorization: `Bearer ${token}` } });
      setSavedPosts(data.posts || []);
    } catch (err) { console.error(err); }
  };

  const handleUnsave = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/recruitment/posts/${postId}/bookmark`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Failed to unsave post:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="my-applications-page">
      <Header isLoggedIn={isAuthenticated?.()} user={user} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 pt-12 pb-16 px-4">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(59,130,246,0.35), transparent 50%), radial-gradient(circle at 75% 20%, rgba(139,92,246,0.25), transparent 50%)' }} />
        <div className="max-w-4xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-white/90 font-medium">Application Tracker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Applications</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Track your job applications and saved posts in one place.
          </p>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 flex gap-1">
          <button onClick={() => setTab('applications')} data-testid="tab-applications"
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'applications' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Briefcase className="w-4 h-4" /> Applications ({apps.length})
          </button>
          <button onClick={() => setTab('saved')} data-testid="tab-saved"
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'saved' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Bookmark className="w-4 h-4" /> Saved ({savedPosts.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {tab === 'applications' ? (
          /* Applications Tab */
          loading ? (
            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-slate-200" />)}</div>
          ) : apps.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-800 text-lg font-semibold">No applications yet</p>
              <p className="text-slate-500 text-sm mt-1">Start applying to jobs, quizzes, and hackathons</p>
              <Link to="/jobs" className="inline-block mt-5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all">Browse Opportunities</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {apps.map(app => {
                const sc = statusConfig[app.status] || statusConfig.applied;
                return (
                  <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-200 transition-all" data-testid={`application-${app.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {app.company_logo && <img src={app.company_logo} alt="" className="w-10 h-10 rounded-lg border border-slate-200" />}
                        <div>
                          <h3 className="text-slate-900 font-semibold">{app.post_title}</h3>
                          <p className="text-slate-500 text-sm">{app.company_name}</p>
                          <p className="text-slate-400 text-xs mt-1">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4 overflow-x-auto">
                      {['applied', 'shortlisted', 'interview', 'offer', 'accepted'].map((step, i, arr) => {
                        const stepOrder = arr.indexOf(app.status);
                        const isActive = i <= stepOrder && app.status !== 'rejected';
                        const isRejected = app.status === 'rejected';
                        return (
                          <React.Fragment key={step}>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap ${isActive ? 'text-blue-600 font-medium' : isRejected && i === 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                              {isActive ? <CheckCircle2 className="w-3 h-3" /> : isRejected && step === app.status ? <XCircle className="w-3 h-3 text-rose-500" /> : <div className="w-3 h-3 rounded-full border-2 border-slate-200" />}
                              <span className="capitalize">{step}</span>
                            </div>
                            {i < arr.length - 1 && <div className={`w-6 h-px ${isActive ? 'bg-blue-400' : 'bg-slate-200'}`} />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Saved Tab */
          savedPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Bookmark className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-800 text-lg font-semibold">No saved posts</p>
              <p className="text-slate-500 text-sm mt-1">Bookmark posts from the feed to save them here</p>
              <Link to="/jobs" className="inline-block mt-5 px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-all">Browse Feed</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPosts.map(post => {
                const PostIcon = postTypeIcons[post.post_type] || Briefcase;
                const linkTo = post.post_type === 'quiz' ? `/quiz-recruit/${post.id}` : post.post_type === 'hackathon' ? `/hackathon/${post.id}` : `/apply/${post.id}`;
                return (
                  <div key={post.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-amber-200 transition-all" data-testid={`saved-post-${post.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {post.company_logo && <img src={post.company_logo} alt="" className="w-10 h-10 rounded-lg border border-slate-200" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              <PostIcon className="w-3 h-3" /> {post.post_type}
                            </span>
                          </div>
                          <Link to={linkTo}><h3 className="text-slate-900 font-semibold hover:text-blue-600 transition-colors">{post.title}</h3></Link>
                          <p className="text-slate-500 text-sm">{post.company_name}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {post.location && <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="w-3 h-3" /> {post.location}</span>}
                            {post.salary && <span className="flex items-center gap-1 text-xs text-slate-500"><DollarSign className="w-3 h-3" /> {post.salary}</span>}
                            {post.deadline && <span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="w-3 h-3" /> {post.deadline}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={linkTo} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                        <button onClick={() => handleUnsave(post.id)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" data-testid={`unsave-btn-${post.id}`}>
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <Footer />
    </div>
  );
}
