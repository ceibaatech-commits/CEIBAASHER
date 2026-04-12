import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Users, Briefcase, Code2, Trophy, Calendar, CheckCircle2, Globe, MapPin, DollarSign, Clock, ChevronRight, Heart, MessageCircle, Share2, Bookmark, Award, TrendingUp, ExternalLink } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const postTypeConfig = {
  job: { icon: Briefcase, color: '#4f7cff', bg: 'rgba(79,124,255,0.12)', label: 'Job', actionLabel: 'Apply' },
  quiz: { icon: Code2, color: '#c084fc', bg: 'rgba(192,132,252,0.12)', label: 'MCQ Quiz', actionLabel: 'Attempt' },
  hackathon: { icon: Trophy, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Hackathon', actionLabel: 'Register' },
  event: { icon: Calendar, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Event', actionLabel: 'Register' },
};

const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'jobs', label: 'Jobs & Internships' },
  { key: 'quizzes', label: 'MCQ Quizzes' },
  { key: 'hackathons', label: 'Hackathons' },
  { key: 'events', label: 'Events' },
  { key: 'about', label: 'About' },
];

const timeAgo = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function CompanyChannel() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [suggestedCompanies, setSuggestedCompanies] = useState([]);

  useEffect(() => { fetchCompany(); fetchSuggested(); }, [slug]);
  useEffect(() => { fetchPosts(); }, [slug, tab]);

  const fetchCompany = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/company/${slug}`, { headers });
      setCompany(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPosts = async () => {
    const typeMap = { home: '', jobs: 'job', quizzes: 'quiz', hackathons: 'hackathon', events: 'event' };
    const postType = typeMap[tab] || '';
    try {
      const params = postType ? `?post_type=${postType}` : '';
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/company/${slug}/posts${params}`);
      setPosts(data.posts || []);
    } catch (err) { console.error(err); }
  };

  const fetchSuggested = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/companies?limit=4`);
      setSuggestedCompanies((data.companies || []).filter(c => c.slug !== slug).slice(0, 4));
    } catch {}
  };

  const handleFollow = async () => {
    if (!company) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/recruitment/follow/${company.id}`, {}, { headers: { Authorization: `Bearer ${token}` }});
      setCompany(prev => ({ ...prev, is_following: !prev.is_following, followers_count: prev.is_following ? prev.followers_count - 1 : prev.followers_count + 1 }));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#4f7cff] border-t-transparent rounded-full animate-spin" /></div>;
  if (!company) return <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center text-[#8892b0]">Company not found</div>;

  return (
    <div className="min-h-screen bg-[#0d0f14]" data-testid="company-channel-page">
      {/* ── Wide Banner (YouTube channel art style) ── */}
      <div className="h-56 md:h-64 relative overflow-hidden">
        {company.banner_url ? (
          <img src={company.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a1e2e 0%, #252a3d 40%, #4f7cff10 70%, #1a1e2e 100%)' }}>
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #4f7cff 0, #4f7cff 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-[#0d0f14]/40 to-transparent" />
      </div>

      {/* ── Channel Header ── */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        <div className="flex items-end gap-5 flex-wrap">
          {/* Logo — like YouTube profile pic */}
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-[#0d0f14] bg-[#141720] shadow-2xl flex-shrink-0">
            <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 pb-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[#e8eaf0] text-2xl md:text-3xl font-extrabold">{company.company_name}</h1>
              {(company.verified_email || company.verified_gst) && <CheckCircle2 size={22} className="text-[#4f7cff]" />}
            </div>
            <p className="text-[#8892b0] text-sm mt-0.5">{company.industry} {company.founding_year && `· Est. ${company.founding_year}`}</p>
            {/* Stats row (like YouTube subscriber/video counts) */}
            <div className="flex items-center gap-4 mt-2 text-sm text-[#8892b0]">
              <span><span className="text-[#e8eaf0] font-bold">{company.followers_count}</span> followers</span>
              <span className="text-[#252a3d]">·</span>
              <span><span className="text-[#e8eaf0] font-bold">{company.posts_count}</span> posts</span>
              <span className="text-[#252a3d]">·</span>
              <span><span className="text-[#e8eaf0] font-bold">{company.open_roles}</span> open roles</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pb-2">
            {company.open_roles > 0 && <span className="px-3 py-1 rounded-full text-xs bg-[#22c55e]/15 text-[#22c55e] font-semibold animate-pulse">Hiring now</span>}
            <button
              onClick={handleFollow}
              data-testid="follow-btn"
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                company.is_following ? 'bg-[#1a1e2e] border border-[#4f7cff] text-[#4f7cff] hover:bg-[#4f7cff]/10' : 'bg-[#4f7cff] text-white hover:bg-[#3d6ae8] shadow-lg shadow-[#4f7cff]/20'
              }`}
            >
              {company.is_following ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Verified Badges */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {company.verified_email && <span className="px-2.5 py-1 rounded-lg text-xs bg-[#4f7cff]/10 text-[#4f7cff] flex items-center gap-1 font-medium"><CheckCircle2 size={11} /> Email Verified</span>}
          {company.verified_mobile && <span className="px-2.5 py-1 rounded-lg text-xs bg-[#22c55e]/10 text-[#22c55e] flex items-center gap-1 font-medium"><CheckCircle2 size={11} /> Mobile Verified</span>}
          {company.verified_gst && <span className="px-2.5 py-1 rounded-lg text-xs bg-[#f59e0b]/10 text-[#f59e0b] flex items-center gap-1 font-medium"><CheckCircle2 size={11} /> GST Registered</span>}
        </div>

        {/* ── 6 Tabs (like YouTube channel tabs) ── */}
        <div className="flex gap-0 mt-5 overflow-x-auto border-b border-[#252a3d] no-scrollbar">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} data-testid={`tab-${t.key}`}
              className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-[3px] ${
                tab === t.key ? 'text-[#e8eaf0] border-[#4f7cff]' : 'text-[#8892b0] border-transparent hover:text-[#e8eaf0] hover:bg-[#141720]/50'
              }`}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── Content Area (main + sidebar) ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {tab === 'about' ? (
              <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-6" data-testid="about-section">
                <h2 className="text-[#e8eaf0] text-xl font-bold mb-4">About {company.company_name}</h2>
                <p className="text-[#8892b0] leading-relaxed text-sm">{company.about || 'No description available.'}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm bg-[#141720] p-3 rounded-xl hover:bg-[#252a3d] transition-colors"><Globe size={18} className="text-[#4f7cff]" /><span className="text-[#4f7cff]">{company.website}</span><ExternalLink size={12} className="text-[#8892b0]" /></a>}
                  {company.employee_count && <div className="flex items-center gap-3 text-sm bg-[#141720] p-3 rounded-xl text-[#8892b0]"><Users size={18} /> {company.employee_count} employees</div>}
                  {company.industry && <div className="flex items-center gap-3 text-sm bg-[#141720] p-3 rounded-xl text-[#8892b0]"><Briefcase size={18} /> {company.industry}</div>}
                  {company.gst_number && <div className="flex items-center gap-3 text-sm bg-[#141720] p-3 rounded-xl text-[#8892b0]"><CheckCircle2 size={18} /> GST: {company.gst_number}</div>}
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-[#1a1e2e] border border-[#252a3d] rounded-2xl"><p className="text-[#8892b0]">No posts in this category yet</p></div>
            ) : (
              <div className="space-y-5">
                {posts.map(post => {
                  const config = postTypeConfig[post.post_type] || postTypeConfig.job;
                  const Icon = config.icon;
                  const linkTo = post.post_type === 'quiz' ? `/quiz-recruit/${post.id}` : post.post_type === 'hackathon' ? `/hackathon/${post.id}` : `/apply/${post.id}`;
                  return (
                    <div key={post.id} className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl overflow-hidden hover:border-[#4f7cff]/30 transition-all group">
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: config.bg, color: config.color }}><Icon size={12} /> {config.label}</div>
                          {post.air_filter && <span className="px-2 py-0.5 rounded-full text-xs bg-[#f59e0b]/10 text-[#f59e0b]">AIR ≤ {post.air_filter?.toLocaleString()}</span>}
                          <span className="text-[#8892b0] text-xs ml-auto">{timeAgo(post.created_at)}</span>
                        </div>
                        <Link to={linkTo}><h3 className="text-[#e8eaf0] font-bold text-lg group-hover:text-[#4f7cff] transition-colors">{post.title}</h3></Link>
                        <p className="text-[#8892b0] text-sm mt-1 line-clamp-2">{post.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.location && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#141720] text-[#8892b0]"><MapPin size={11} /> {post.location}</span>}
                          {post.salary && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#141720] text-[#8892b0]"><DollarSign size={11} /> {post.salary}</span>}
                          {post.deadline && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#141720] text-[#8892b0]"><Clock size={11} /> {post.deadline}</span>}
                        </div>
                      </div>
                      <div className="border-t border-[#252a3d] px-5 py-3 flex items-center justify-between">
                        <div className="flex gap-5 text-[#8892b0] text-xs">
                          <span className="flex items-center gap-1"><Heart size={14} /> {post.likes_count || 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle size={14} /> {post.comments_count || 0}</span>
                          <Share2 size={14} className="cursor-pointer hover:text-[#e8eaf0]" />
                        </div>
                        <Link to={linkTo} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: config.color }}>{config.actionLabel}</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Sidebar (YouTube-style) ── */}
          <div className="space-y-5 hidden lg:block">
            {/* Quiz Leaderboard */}
            <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-5">
              <h3 className="text-[#e8eaf0] font-bold text-sm mb-4 flex items-center gap-2"><Trophy size={16} className="text-[#f59e0b]" /> Quiz Leaderboard</h3>
              <p className="text-[#8892b0] text-xs mb-3">Top scorers on latest quiz</p>
              {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((e, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'bg-[#141720] text-[#8892b0]'}`}>{i + 1}</span>
                  <span className="flex-1 text-[#e8eaf0] text-sm truncate">{e.user_name}</span>
                  <span className="text-[#4f7cff] text-xs font-bold">{e.score}/{e.total}</span>
                </div>
              )) : <p className="text-[#8892b0]/50 text-xs italic">No quiz attempts yet</p>}
            </div>

            {/* More Company Channels */}
            <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-5">
              <h3 className="text-[#e8eaf0] font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-[#4f7cff]" /> More Channels</h3>
              <div className="space-y-3">
                {suggestedCompanies.map(c => (
                  <Link key={c.id} to={`/company/${c.slug}`} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-[#141720] flex-shrink-0"><img src={c.logo_url} alt="" className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#e8eaf0] text-sm font-medium truncate group-hover:text-[#4f7cff] transition-colors">{c.company_name}</p>
                      <p className="text-[#8892b0] text-xs">{c.followers_count || 0} followers</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Badge Progress Card */}
            {user && (
              <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-5">
                <h3 className="text-[#e8eaf0] font-bold text-sm mb-3 flex items-center gap-2"><Award size={16} className="text-[#7c3aed]" /> Your Badges</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(user.badges || ['CEIBAA Verified']).map((b, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[#7c3aed]/10 text-[#c084fc]">{b}</span>
                  ))}
                </div>
                <div className="mt-3 bg-[#141720] rounded-lg p-2.5">
                  <div className="flex justify-between text-xs text-[#8892b0] mb-1"><span>Badge Progress</span><span>2/5</span></div>
                  <div className="w-full h-1.5 bg-[#252a3d] rounded-full"><div className="h-full bg-[#7c3aed] rounded-full" style={{ width: '40%' }} /></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
