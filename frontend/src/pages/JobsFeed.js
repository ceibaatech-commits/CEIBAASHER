import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Briefcase, Code2, Trophy, Calendar, MapPin, DollarSign, Clock,
  Heart, MessageCircle, Share2, Users, ArrowRight, Bookmark,
  ChevronRight, Zap, Award, TrendingUp, Sparkles, Search
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const POST_TYPE_CONFIG = {
  job:        { icon: Briefcase, color: 'bg-blue-100 text-blue-700 border-blue-200',   accent: 'from-blue-500 to-indigo-600',  label: 'Job Opening',  actionLabel: 'Apply Now',    actionColor: 'bg-blue-600 hover:bg-blue-700' },
  internship: { icon: Briefcase, color: 'bg-blue-100 text-blue-700 border-blue-200',   accent: 'from-blue-500 to-indigo-600',  label: 'Internship',   actionLabel: 'Apply Now',    actionColor: 'bg-blue-600 hover:bg-blue-700' },
  quiz:       { icon: Code2,     color: 'bg-violet-100 text-violet-700 border-violet-200', accent: 'from-violet-500 to-purple-600', label: 'MCQ Quiz',  actionLabel: 'Attempt Quiz', actionColor: 'bg-violet-600 hover:bg-violet-700' },
  hackathon:  { icon: Trophy,    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', accent: 'from-emerald-500 to-teal-600', label: 'Hackathon', actionLabel: 'Register',     actionColor: 'bg-emerald-600 hover:bg-emerald-700' },
  event:      { icon: Calendar,  color: 'bg-amber-100 text-amber-700 border-amber-200', accent: 'from-amber-500 to-orange-600', label: 'Campus Event', actionLabel: 'Register',     actionColor: 'bg-amber-600 hover:bg-amber-700' },
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const FILTER_TABS = [
  { key: 'all',       label: 'All',        icon: Zap },
  { key: 'job',       label: 'Jobs',       icon: Briefcase },
  { key: 'quiz',      label: 'Quizzes',    icon: Code2 },
  { key: 'hackathon', label: 'Hackathons', icon: Trophy },
  { key: 'event',     label: 'Events',     icon: Calendar },
];

/* ── Feed Card ── */
function FeedCard({ post }) {
  const config = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.job;
  const Icon = config.icon;
  const linkTo = post.post_type === 'quiz' ? `/quiz-recruit/${post.id}` : post.post_type === 'hackathon' ? `/hackathon/${post.id}` : `/apply/${post.id}`;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden" data-testid={`post-card-${post.id}`}>
      {/* Top accent bar */}
      <div className={`h-1 bg-gradient-to-r ${config.accent}`} />

      {/* Company header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-2">
        <Link to={`/company/${post.company_slug || post.company_id}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 ring-2 ring-slate-200">
            {post.company_logo ? <img src={post.company_logo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-sm">{(post.company_name || '?')[0]}</div>}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/company/${post.company_slug || post.company_id}`} className="text-slate-900 font-semibold text-sm hover:text-blue-600 transition-colors">{post.company_name}</Link>
          <p className="text-slate-400 text-xs">{timeAgo(post.created_at)}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.color}`}>
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 pb-3">
        <Link to={linkTo}>
          <h3 className="text-slate-900 font-bold text-lg leading-snug group-hover:text-blue-600 transition-colors">{post.title}</h3>
        </Link>
        {post.description && <p className="text-slate-500 text-sm mt-1.5 line-clamp-2 leading-relaxed">{post.description}</p>}

        {/* Meta tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {post.location && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600"><MapPin className="w-3 h-3" /> {post.location}</span>}
          {post.salary && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600"><DollarSign className="w-3 h-3" /> {post.salary}</span>}
          {post.role_type && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600"><Briefcase className="w-3 h-3" /> {post.role_type}</span>}
          {post.air_filter && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-medium"><Award className="w-3 h-3" /> AIR &le; {post.air_filter.toLocaleString()}</span>}
          {post.time_limit && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700"><Clock className="w-3 h-3" /> {post.time_limit} min</span>}
          {post.num_questions && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700"><Code2 className="w-3 h-3" /> {post.num_questions} Qs</span>}
          {post.team_size > 1 && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700"><Users className="w-3 h-3" /> Team of {post.team_size}</span>}
          {post.event_type && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700"><Calendar className="w-3 h-3" /> {post.event_type}</span>}
          {post.deadline && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500"><Clock className="w-3 h-3" /> {post.deadline}</span>}
        </div>

        {/* Quiz preview */}
        {post.post_type === 'quiz' && post.questions?.length > 0 && (
          <div className="mt-3 bg-violet-50 border border-violet-100 rounded-xl p-3.5">
            <p className="text-violet-600 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Sample Question</p>
            <p className="text-slate-800 text-sm font-medium">{post.questions[0]?.question}</p>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {(post.questions[0]?.options || []).map((opt, i) => (
                <div key={i} className="text-xs text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-violet-100">{String.fromCharCode(65 + i)}. {opt}</div>
              ))}
            </div>
          </div>
        )}

        {/* Hackathon prizes */}
        {post.post_type === 'hackathon' && post.prizes && (
          <div className="flex gap-2 mt-3">
            {post.prizes.first && <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl py-2 text-center"><span className="text-amber-600 text-xs font-bold block">1st</span><span className="text-slate-800 text-xs font-semibold">&#8377;{post.prizes.first}</span></div>}
            {post.prizes.second && <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 text-center"><span className="text-slate-500 text-xs font-bold block">2nd</span><span className="text-slate-800 text-xs font-semibold">&#8377;{post.prizes.second}</span></div>}
            {post.prizes.third && <div className="flex-1 bg-orange-50 border border-orange-200 rounded-xl py-2 text-center"><span className="text-orange-600 text-xs font-bold block">3rd</span><span className="text-slate-800 text-xs font-semibold">&#8377;{post.prizes.third}</span></div>}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-5 text-slate-400">
          <button className="flex items-center gap-1.5 text-xs hover:text-rose-500 transition-colors"><Heart className="w-4 h-4" /> <span>{post.likes_count || 0}</span></button>
          <button className="flex items-center gap-1.5 text-xs hover:text-blue-500 transition-colors"><MessageCircle className="w-4 h-4" /> <span>{post.comments_count || 0}</span></button>
          <button className="flex items-center gap-1.5 text-xs hover:text-emerald-500 transition-colors"><Share2 className="w-4 h-4" /></button>
          <button className="flex items-center gap-1.5 text-xs hover:text-amber-500 transition-colors"><Bookmark className="w-4 h-4" /></button>
        </div>
        <Link to={linkTo} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${config.actionColor}`} data-testid={`action-${post.id}`}>
          {config.actionLabel} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ── Main Feed Page ── */
export default function JobsFeed() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchFeed(); }, []);

  const fetchFeed = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/feed?page=1&limit=50`, { headers });
      setPosts(data.posts || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? posts : posts.filter(p => p.post_type === filter);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="jobs-feed-page">
      <Header isLoggedIn={isAuthenticated?.()} user={user} />

      {/* Hero */}
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
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Jobs, quizzes, hackathons &amp; events from verified companies. Apply with your CEIBAA profile.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link to="/discover" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25" data-testid="discover-companies-btn"><Search className="w-4 h-4" /> Discover Companies</Link>
            <Link to="/my-applications" className="px-5 py-2.5 bg-white/10 backdrop-blur text-white border border-white/20 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all flex items-center gap-2" data-testid="my-applications-btn"><Briefcase className="w-4 h-4" /> My Applications</Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 flex flex-nowrap gap-1 overflow-x-auto scrollbar-hide" data-testid="feed-filters" style={{ WebkitOverflowScrolling: 'touch' }}>
          {FILTER_TABS.map(f => {
            const FIcon = f.icon;
            const count = f.key === 'all' ? posts.length : posts.filter(p => p.post_type === f.key).length;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} data-testid={`filter-${f.key}`}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  filter === f.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}>
                <FIcon className="w-3.5 h-3.5" /> {f.label} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Grid */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-5">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-52 animate-pulse border border-slate-200" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-800 text-lg font-semibold">No posts found</p>
                <p className="text-slate-500 text-sm mt-1">Follow companies in Discover to see their posts here</p>
                <Link to="/discover" className="inline-block mt-5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all">Browse Companies</Link>
              </div>
            ) : (
              filtered.map(post => <FeedCard key={post.id} post={post} />)
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5 hidden lg:block">
            <TrendingSidebar />
            {user && <ProfileBadgeCard user={user} />}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-amber-500 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Want to hire from CEIBAA?</h2>
          <p className="text-white/80 mb-6 text-sm sm:text-base">Post jobs, run quizzes, and find top talent with verified AIR ranks.</p>
          <button onClick={() => navigate('/recruiter')} className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all text-sm" data-testid="recruiter-cta">
            Recruiter Portal
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ── Sidebar Components ── */
function TrendingSidebar() {
  const [companies, setCompanies] = useState([]);
  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/recruitment/companies?limit=4`).then(r => setCompanies((r.data.companies || []).slice(0, 4))).catch(() => {});
  }, []);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-slate-900 font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Trending Companies</h3>
      <div className="space-y-3">
        {companies.map(c => (
          <Link key={c.id} to={`/company/${c.slug}`} className="flex items-center gap-3 group" data-testid={`trending-${c.slug}`}>
            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 ring-1 ring-slate-200"><img src={c.logo_url} alt="" className="w-full h-full object-cover" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-sm font-medium truncate group-hover:text-blue-600 transition-colors">{c.company_name}</p>
              <p className="text-slate-400 text-xs">{c.industry} · {c.open_roles || 0} roles</p>
            </div>
            {c.open_roles > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-600 font-semibold border border-emerald-200">Hiring</span>}
          </Link>
        ))}
      </div>
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
        <div>
          <p className="text-slate-800 text-sm font-semibold">{user.name}</p>
          {user.air_rank && <p className="text-amber-600 text-xs font-medium">AIR {user.air_rank}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(user.badges || []).map((b, i) => <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-medium border border-blue-200">{b}</span>)}
      </div>
      <Link to="/my-applications" className="block mt-3 text-center py-2 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200">View Applications &rarr;</Link>
    </div>
  );
}
