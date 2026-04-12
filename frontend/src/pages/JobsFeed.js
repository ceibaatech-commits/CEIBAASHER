import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Briefcase, Code2, Trophy, Calendar, MapPin, DollarSign, Clock, Heart, MessageCircle, Share2, Users, ArrowRight, Bookmark, ChevronRight, Zap, Award, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const postTypeConfig = {
  job: { icon: Briefcase, color: '#4f7cff', bg: 'rgba(79,124,255,0.12)', label: 'Job Opening', actionLabel: 'Apply Now' },
  internship: { icon: Briefcase, color: '#4f7cff', bg: 'rgba(79,124,255,0.12)', label: 'Internship', actionLabel: 'Apply Now' },
  quiz: { icon: Code2, color: '#c084fc', bg: 'rgba(192,132,252,0.12)', label: 'MCQ Quiz', actionLabel: 'Attempt Quiz' },
  hackathon: { icon: Trophy, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Hackathon', actionLabel: 'Register' },
  event: { icon: Calendar, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Campus Event', actionLabel: 'Register' },
};

const airBadgeColor = (air) => {
  if (!air) return null;
  if (air <= 1000) return '#f59e0b';
  if (air <= 5000) return '#8892b0';
  return '#4f7cff';
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

/* ── YouTube/Instagram-style Feed Card ── */
const FeedCard = ({ post }) => {
  const config = postTypeConfig[post.post_type] || postTypeConfig.job;
  const Icon = config.icon;
  const linkTo = post.post_type === 'quiz' ? `/quiz-recruit/${post.id}` : post.post_type === 'hackathon' ? `/hackathon/${post.id}` : `/apply/${post.id}`;

  return (
    <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl overflow-hidden hover:border-[#4f7cff]/30 transition-all duration-300 group" data-testid={`post-card-${post.id}`}>
      {/* Card Header — company info + post type badge */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <Link to={`/company/${post.company_slug || post.company_id}`} className="flex-shrink-0">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-[#141720] ring-2 ring-[#252a3d]">
            {post.company_logo ? <img src={post.company_logo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#4f7cff] font-bold text-sm">{(post.company_name || '?')[0]}</div>}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/company/${post.company_slug || post.company_id}`} className="text-[#e8eaf0] font-semibold text-sm hover:text-[#4f7cff] transition-colors">{post.company_name}</Link>
          <p className="text-[#8892b0] text-xs">{timeAgo(post.created_at)}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: config.bg, color: config.color }}>
          <Icon size={13} />
          {config.label}
        </div>
      </div>

      {/* Card Body */}
      <div className="px-5 pb-3">
        <Link to={linkTo}>
          <h3 className="text-[#e8eaf0] font-bold text-lg leading-snug group-hover:text-[#4f7cff] transition-colors">{post.title}</h3>
        </Link>
        {post.description && <p className="text-[#8892b0] text-sm mt-1.5 line-clamp-2 leading-relaxed">{post.description}</p>}

        {/* Tags row */}
        <div className="flex flex-wrap gap-2 mt-3">
          {post.location && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#141720] text-[#8892b0]"><MapPin size={11} /> {post.location}</span>}
          {post.salary && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#141720] text-[#8892b0]"><DollarSign size={11} /> {post.salary}</span>}
          {post.role_type && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#141720] text-[#8892b0]"><Briefcase size={11} /> {post.role_type}</span>}
          {post.air_filter && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-[#f59e0b]" style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}><Award size={11} /> AIR ≤ {post.air_filter.toLocaleString()}</span>}
          {post.time_limit && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#141720] text-[#c084fc]"><Clock size={11} /> {post.time_limit} min</span>}
          {post.num_questions && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#141720] text-[#c084fc]"><Code2 size={11} /> {post.num_questions} Qs</span>}
          {post.team_size > 1 && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#141720] text-[#22c55e]"><Users size={11} /> Team of {post.team_size}</span>}
          {post.event_type && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#141720] text-[#f59e0b]"><Calendar size={11} /> {post.event_type}</span>}
          {post.deadline && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#141720] text-[#8892b0]"><Clock size={11} /> {post.deadline}</span>}
        </div>

        {/* Quiz preview — sample question */}
        {post.post_type === 'quiz' && post.questions?.length > 0 && (
          <div className="mt-3 bg-[#141720] border border-[#252a3d] rounded-xl p-3.5">
            <p className="text-[#c084fc] text-[10px] uppercase tracking-wider font-medium mb-1.5">Sample Question</p>
            <p className="text-[#e8eaf0] text-sm font-medium">{post.questions[0]?.question}</p>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {(post.questions[0]?.options || []).map((opt, i) => (
                <div key={i} className="text-xs text-[#8892b0] bg-[#1a1e2e] px-2.5 py-1.5 rounded-lg">{String.fromCharCode(65 + i)}. {opt}</div>
              ))}
            </div>
          </div>
        )}

        {/* Hackathon prizes */}
        {post.post_type === 'hackathon' && post.prizes && (
          <div className="flex gap-2 mt-3">
            {post.prizes.first && <div className="flex-1 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl py-2 text-center"><span className="text-[#f59e0b] text-xs font-bold block">1st</span><span className="text-[#e8eaf0] text-xs font-semibold">&#8377;{post.prizes.first}</span></div>}
            {post.prizes.second && <div className="flex-1 bg-[#8892b0]/10 border border-[#8892b0]/20 rounded-xl py-2 text-center"><span className="text-[#8892b0] text-xs font-bold block">2nd</span><span className="text-[#e8eaf0] text-xs font-semibold">&#8377;{post.prizes.second}</span></div>}
            {post.prizes.third && <div className="flex-1 bg-[#cd7f32]/10 border border-[#cd7f32]/20 rounded-xl py-2 text-center"><span className="text-[#cd7f32] text-xs font-bold block">3rd</span><span className="text-[#e8eaf0] text-xs font-semibold">&#8377;{post.prizes.third}</span></div>}
          </div>
        )}
      </div>

      {/* Card Footer — engagement + action */}
      <div className="border-t border-[#252a3d] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-5 text-[#8892b0]">
          <button className="flex items-center gap-1.5 text-xs hover:text-[#ef4444] transition-colors"><Heart size={15} /> <span>{post.likes_count || 0}</span></button>
          <button className="flex items-center gap-1.5 text-xs hover:text-[#4f7cff] transition-colors"><MessageCircle size={15} /> <span>{post.comments_count || 0}</span></button>
          <button className="flex items-center gap-1.5 text-xs hover:text-[#22c55e] transition-colors"><Share2 size={15} /></button>
          <button className="flex items-center gap-1.5 text-xs hover:text-[#f59e0b] transition-colors"><Bookmark size={15} /></button>
        </div>
        <Link to={linkTo} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110" style={{ backgroundColor: config.color, color: '#fff' }} data-testid={`action-${post.id}`}>
          {config.actionLabel} <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
};

/* ── Main Feed Page ── */
export default function JobsFeed() {
  const { user } = useAuth();
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

  const filterTabs = [
    { key: 'all', label: 'All', icon: Zap },
    { key: 'job', label: 'Jobs', icon: Briefcase },
    { key: 'quiz', label: 'Quizzes', icon: Code2 },
    { key: 'hackathon', label: 'Hackathons', icon: Trophy },
    { key: 'event', label: 'Events', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-[#0d0f14]" data-testid="jobs-feed-page">
      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-[#141720] to-[#0d0f14] border-b border-[#252a3d]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-extrabold text-2xl tracking-tight">cei</span>
            <span className="text-[#4f7cff] font-extrabold text-2xl tracking-tight">baa</span>
            <span className="text-[#8892b0] text-base font-medium ml-1">Recruitment</span>
          </div>
          <h1 className="text-[#e8eaf0] text-3xl md:text-4xl font-extrabold mt-3 leading-tight">Your Feed</h1>
          <p className="text-[#8892b0] mt-2 text-base">Posts from companies you follow. Verified ranks, no fake CVs.</p>
          <div className="flex gap-3 mt-5">
            <Link to="/discover" className="px-5 py-2.5 bg-[#4f7cff] text-white rounded-xl text-sm font-semibold hover:bg-[#3d6ae8] transition-colors flex items-center gap-2" data-testid="discover-companies-btn"><TrendingUp size={16} /> Discover Companies</Link>
            <Link to="/my-applications" className="px-5 py-2.5 bg-[#1a1e2e] text-[#e8eaf0] border border-[#252a3d] rounded-xl text-sm font-semibold hover:border-[#4f7cff]/40 transition-colors flex items-center gap-2" data-testid="my-applications-btn"><Briefcase size={16} /> My Applications</Link>
          </div>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-[64px] z-20 bg-[#0d0f14]/90 backdrop-blur-md border-b border-[#252a3d]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {filterTabs.map(f => {
            const FIcon = f.icon;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} data-testid={`filter-${f.key}`}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === f.key ? 'bg-[#4f7cff] text-white shadow-lg shadow-[#4f7cff]/20' : 'bg-[#1a1e2e] text-[#8892b0] border border-[#252a3d] hover:text-[#e8eaf0] hover:border-[#4f7cff]/30'}`}>
                <FIcon size={14} /> {f.label} {f.key !== 'all' && <span className="ml-0.5 text-xs opacity-70">({posts.filter(p => f.key === 'all' ? true : p.post_type === f.key).length})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-5">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl h-48 animate-pulse" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-[#1a1e2e] border border-[#252a3d] rounded-2xl">
                <Briefcase size={48} className="mx-auto text-[#252a3d] mb-4" />
                <p className="text-[#e8eaf0] text-lg font-semibold">No posts found</p>
                <p className="text-[#8892b0] text-sm mt-1">Follow companies in Discover to see their posts here</p>
                <Link to="/discover" className="inline-block mt-5 px-6 py-2.5 bg-[#4f7cff] text-white rounded-xl text-sm font-semibold">Browse Companies</Link>
              </div>
            ) : (
              filtered.map(post => <FeedCard key={post.id} post={post} />)
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5 hidden lg:block">
            {/* Trending Companies */}
            <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-5">
              <h3 className="text-[#e8eaf0] font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-[#4f7cff]" /> Trending Companies</h3>
              <TrendingSidebar />
            </div>
            {/* Quick Stats */}
            {user && (
              <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-5">
                <h3 className="text-[#e8eaf0] font-bold text-sm mb-3 flex items-center gap-2"><Award size={16} className="text-[#f59e0b]" /> Your Profile</h3>
                <ProfileBadgeCard user={user} />
              </div>
            )}
          </div>
        </div>
      </div>
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
    <div className="space-y-3">
      {companies.map(c => (
        <Link key={c.id} to={`/company/${c.slug}`} className="flex items-center gap-3 group" data-testid={`trending-${c.slug}`}>
          <div className="w-9 h-9 rounded-full overflow-hidden bg-[#141720] flex-shrink-0"><img src={c.logo_url} alt="" className="w-full h-full object-cover" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[#e8eaf0] text-sm font-medium truncate group-hover:text-[#4f7cff] transition-colors">{c.company_name}</p>
            <p className="text-[#8892b0] text-xs">{c.industry} · {c.open_roles || 0} roles</p>
          </div>
          {c.open_roles > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#22c55e]/15 text-[#22c55e] font-medium">Hiring</span>}
        </Link>
      ))}
    </div>
  );
}

function ProfileBadgeCard({ user }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#141720]">
          {(user.profile_picture || user.avatar) ? <img src={user.profile_picture || user.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#4f7cff] font-bold">{(user.name || '?')[0]}</div>}
        </div>
        <div>
          <p className="text-[#e8eaf0] text-sm font-semibold">{user.name}</p>
          {user.air_rank && <p className="text-[#f59e0b] text-xs font-medium">AIR {user.air_rank}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        {(user.badges || []).map((b, i) => <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-[#4f7cff]/10 text-[#4f7cff] font-medium">{b}</span>)}
      </div>
      <Link to="/my-applications" className="block mt-3 text-center py-2 rounded-lg bg-[#141720] text-[#8892b0] text-xs hover:text-[#e8eaf0] transition-colors">View Applications →</Link>
    </div>
  );
}
