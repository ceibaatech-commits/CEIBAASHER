import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeedCard from '@/components/FeedCard';
import CommentModal from '@/components/CommentModal';
import { toast } from 'sonner';
import { Briefcase, Code2, Trophy, Calendar, Zap, Award, TrendingUp, Sparkles, Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FILTER_TABS = [
  { key: 'all',       label: 'All',        icon: Zap },
  { key: 'job',       label: 'Jobs',       icon: Briefcase },
  { key: 'quiz',      label: 'Quizzes',    icon: Code2 },
  { key: 'hackathon', label: 'Hacks',      icon: Trophy },
  { key: 'event',     label: 'Events',     icon: Calendar },
];

export default function JobsFeed() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [likedIds, setLikedIds] = useState(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [commentModalPostId, setCommentModalPostId] = useState(null);

  useEffect(() => { fetchFeed(); fetchInteractions(); }, []);

  const fetchFeed = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/feed?page=1&limit=50`, { headers });
      setPosts(data.posts || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchInteractions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/my-interactions`, { headers: { Authorization: `Bearer ${token}` } });
      setLikedIds(new Set(data.liked_post_ids || []));
      setBookmarkedIds(new Set(data.bookmarked_post_ids || []));
    } catch {}
  };

  const handleLike = useCallback(async (postId) => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to like posts'); navigate('/login'); return; }
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/recruitment/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setLikedIds(prev => { const s = new Set(prev); data.liked ? s.add(postId) : s.delete(postId); return s; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: data.likes_count } : p));
    } catch { toast.error('Failed to like'); }
  }, [navigate]);

  const handleBookmark = useCallback(async (postId) => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to save posts'); navigate('/login'); return; }
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/recruitment/posts/${postId}/bookmark`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setBookmarkedIds(prev => { const s = new Set(prev); data.bookmarked ? s.add(postId) : s.delete(postId); return s; });
      toast.success(data.bookmarked ? 'Post saved' : 'Post unsaved');
    } catch { toast.error('Failed to save'); }
  }, [navigate]);

  const handleShare = useCallback(async (post) => {
    const url = `${window.location.origin}/apply/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      axios.post(`${BACKEND_URL}/api/recruitment/posts/${post.id}/share`).catch(() => {});
    } catch { toast.error('Failed to copy link'); }
  }, []);

  const filtered = filter === 'all' ? posts : posts.filter(p => p.post_type === filter);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="jobs-feed-page">
      <Header isLoggedIn={isAuthenticated?.()} user={user} />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 pt-12 pb-16 px-4">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(59,130,246,0.35), transparent 50%), radial-gradient(circle at 75% 20%, rgba(245,158,11,0.25), transparent 50%)' }} />
        <div className="max-w-5xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-white/90 font-medium">The Headhunt</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Your Recruitment <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-400">Feed</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">Jobs, quizzes, hackathons &amp; events from verified companies.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link to="/discover" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25" data-testid="discover-companies-btn"><Search className="w-4 h-4" /> Discover Companies</Link>
            <Link to="/my-applications" className="px-5 py-2.5 bg-white/10 backdrop-blur text-white border border-white/20 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all flex items-center gap-2" data-testid="my-applications-btn"><Briefcase className="w-4 h-4" /> My Applications</Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 flex flex-nowrap gap-1 overflow-x-auto scrollbar-hide" data-testid="feed-filters" style={{ WebkitOverflowScrolling: 'touch' }}>
          {FILTER_TABS.map(f => {
            const FIcon = f.icon;
            const count = f.key === 'all' ? posts.length : posts.filter(p => p.post_type === f.key).length;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} data-testid={`filter-${f.key}`}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${filter === f.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
                <FIcon className="w-3.5 h-3.5" /> {f.label} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-52 animate-pulse border border-slate-200" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-800 text-lg font-semibold">No posts found</p>
                <Link to="/discover" className="inline-block mt-5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all">Browse Companies</Link>
              </div>
            ) : filtered.map(post => (
              <FeedCard key={post.id} post={post} liked={likedIds.has(post.id)} bookmarked={bookmarkedIds.has(post.id)} onLike={handleLike} onBookmark={handleBookmark} onShare={handleShare} onOpenComments={setCommentModalPostId} />
            ))}
          </div>
          <div className="space-y-5 hidden lg:block">
            <TrendingSidebar />
            {user && <ProfileBadgeCard user={user} />}
          </div>
        </div>
      </div>

      <section className="bg-gradient-to-r from-blue-600 to-amber-500 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Want to hire from CEIBAA?</h2>
          <p className="text-white/80 mb-6 text-sm sm:text-base">Post jobs, run quizzes, and find top talent with verified AIR ranks.</p>
          <button onClick={() => navigate('/recruiter')} className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all text-sm" data-testid="recruiter-cta">Recruiter Portal</button>
        </div>
      </section>

      <Footer />
      {commentModalPostId && <CommentModal postId={commentModalPostId} onClose={() => { setCommentModalPostId(null); fetchFeed(); }} />}
    </div>
  );
}

function TrendingSidebar() {
  const [companies, setCompanies] = useState([]);
  useEffect(() => { axios.get(`${BACKEND_URL}/api/recruitment/companies?limit=4`).then(r => setCompanies((r.data.companies || []).slice(0, 4))).catch(() => {}); }, []);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-slate-900 font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Trending Companies</h3>
      <div className="space-y-3">{companies.map(c => (
        <Link key={c.id} to={`/company/${c.slug}`} className="flex items-center gap-3 group" data-testid={`trending-${c.slug}`}>
          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 ring-1 ring-slate-200"><img src={c.logo_url} alt="" className="w-full h-full object-cover" /></div>
          <div className="flex-1 min-w-0"><p className="text-slate-800 text-sm font-medium truncate group-hover:text-blue-600 transition-colors">{c.company_name}</p><p className="text-slate-400 text-xs">{c.industry} · {c.open_roles || 0} roles</p></div>
          {c.open_roles > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-600 font-semibold border border-emerald-200">Hiring</span>}
        </Link>
      ))}</div>
    </div>
  );
}

function ProfileBadgeCard({ user }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-slate-900 font-bold text-sm mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Your Profile</h3>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200">
          {(user.profile_picture || user.avatar) ? <img src={user.profile_picture || user.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold">{(user.name || '?')[0]}</div>}
        </div>
        <div><p className="text-slate-800 text-sm font-semibold">{user.name}</p>{user.air_rank && <p className="text-amber-600 text-xs font-medium">AIR {user.air_rank}</p>}</div>
      </div>
      <Link to="/my-applications" className="block mt-3 text-center py-2 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200">View Applications &rarr;</Link>
    </div>
  );
}
