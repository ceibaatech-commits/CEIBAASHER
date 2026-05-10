import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Users, Briefcase, Code2, Trophy, Calendar, CheckCircle2, Globe, MapPin, DollarSign, Clock, ChevronRight, Heart, MessageCircle, Share2, Bookmark, Award, TrendingUp, ExternalLink } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const postTypeConfig = {
  job: { icon: Briefcase, color: 'bg-blue-600', textColor: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Job', actionLabel: 'Apply' },
  quiz: { icon: Code2, color: 'bg-violet-600', textColor: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', label: 'MCQ Quiz', actionLabel: 'Attempt' },
  hackathon: { icon: Trophy, color: 'bg-emerald-600', textColor: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Hackathon', actionLabel: 'Register' },
  event: { icon: Calendar, color: 'bg-amber-600', textColor: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Event', actionLabel: 'Register' },
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
  const { user, isAuthenticated } = useAuth();
  const [company, setCompany] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [suggestedCompanies, setSuggestedCompanies] = useState([]);

  // eslint-disable-next-line
  useEffect(() => { fetchCompany(); fetchSuggested(); }, [slug]);
  // eslint-disable-next-line
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

  if (loading) return <div className="min-h-screen bg-slate-50"><Header isLoggedIn={isAuthenticated?.()} user={user} /><div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div><Footer /></div>;
  if (!company) return <div className="min-h-screen bg-slate-50"><Header isLoggedIn={isAuthenticated?.()} user={user} /><div className="flex items-center justify-center py-32 text-slate-500">Company not found</div><Footer /></div>;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="company-channel-page">
      <Header isLoggedIn={isAuthenticated?.()} user={user} />
      {/* ── Wide Banner ── */}
      <div className="h-56 md:h-64 relative overflow-hidden">
        {company.banner_url ? (
          <img src={company.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #4f7cff 0, #4f7cff 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent" />
      </div>

      {/* ── Channel Header ── */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        <div className="flex items-end gap-5 flex-wrap">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white bg-white shadow-2xl flex-shrink-0">
            <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 pb-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-slate-900 text-2xl md:text-3xl font-extrabold">{company.company_name}</h1>
              {(company.verified_email || company.verified_gst) && <CheckCircle2 size={22} className="text-blue-500" />}
            </div>
            <p className="text-slate-500 text-sm mt-0.5">{company.industry} {company.founding_year && `· Est. ${company.founding_year}`}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span><span className="text-slate-800 font-bold">{company.followers_count}</span> followers</span>
              <span className="text-slate-300">·</span>
              <span><span className="text-slate-800 font-bold">{company.posts_count}</span> posts</span>
              <span className="text-slate-300">·</span>
              <span><span className="text-slate-800 font-bold">{company.open_roles}</span> open roles</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pb-2">
            {company.open_roles > 0 && <span className="px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-600 font-semibold border border-emerald-200">Hiring now</span>}
            <button
              onClick={handleFollow}
              data-testid="follow-btn"
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                company.is_following ? 'bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
              }`}
            >
              {company.is_following ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Verified Badges */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {company.verified_email && <span className="px-2.5 py-1 rounded-lg text-xs bg-blue-50 text-blue-600 flex items-center gap-1 font-medium border border-blue-200"><CheckCircle2 size={11} /> Email Verified</span>}
          {company.verified_mobile && <span className="px-2.5 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-600 flex items-center gap-1 font-medium border border-emerald-200"><CheckCircle2 size={11} /> Mobile Verified</span>}
          {company.verified_gst && <span className="px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-600 flex items-center gap-1 font-medium border border-amber-200"><CheckCircle2 size={11} /> GST Registered</span>}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0 mt-5 overflow-x-auto border-b border-slate-200 no-scrollbar">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} data-testid={`tab-${t.key}`}
              className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-[3px] ${
                tab === t.key ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100'
              }`}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {tab === 'about' ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" data-testid="about-section">
                <h2 className="text-slate-900 text-xl font-bold mb-4">About {company.company_name}</h2>
                <p className="text-slate-600 leading-relaxed text-sm">{company.about || 'No description available.'}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"><Globe size={18} className="text-blue-500" /><span className="text-blue-600">{company.website}</span><ExternalLink size={12} className="text-slate-400" /></a>}
                  {company.employee_count && <div className="flex items-center gap-3 text-sm bg-slate-50 p-3 rounded-xl text-slate-600 border border-slate-200"><Users size={18} /> {company.employee_count} employees</div>}
                  {company.industry && <div className="flex items-center gap-3 text-sm bg-slate-50 p-3 rounded-xl text-slate-600 border border-slate-200"><Briefcase size={18} /> {company.industry}</div>}
                  {company.gst_number && <div className="flex items-center gap-3 text-sm bg-slate-50 p-3 rounded-xl text-slate-600 border border-slate-200"><CheckCircle2 size={18} /> GST: {company.gst_number}</div>}
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm"><p className="text-slate-500">No posts in this category yet</p></div>
            ) : (
              <div className="space-y-5">
                {posts.map(post => {
                  const config = postTypeConfig[post.post_type] || postTypeConfig.job;
                  const Icon = config.icon;
                  const linkTo = post.post_type === 'quiz' ? `/quiz-recruit/${post.id}` : post.post_type === 'hackathon' ? `/hackathon/${post.id}` : `/apply/${post.id}`;
                  return (
                    <div key={post.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all group">
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.bg} ${config.textColor}`}><Icon className="w-3 h-3" /> {config.label}</span>
                          {post.air_filter && <span className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-600 border border-amber-200 font-medium">AIR &le; {post.air_filter?.toLocaleString()}</span>}
                          <span className="text-slate-400 text-xs ml-auto">{timeAgo(post.created_at)}</span>
                        </div>
                        <Link to={linkTo}><h3 className="text-slate-900 font-bold text-lg group-hover:text-blue-600 transition-colors">{post.title}</h3></Link>
                        <p className="text-slate-500 text-sm mt-1 line-clamp-2">{post.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.location && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600"><MapPin className="w-3 h-3" /> {post.location}</span>}
                          {post.salary && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600"><DollarSign className="w-3 h-3" /> {post.salary}</span>}
                          {post.deadline && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500"><Clock className="w-3 h-3" /> {post.deadline}</span>}
                        </div>
                      </div>
                      <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                        <div className="flex gap-5 text-slate-400 text-xs">
                          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likes_count || 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.comments_count || 0}</span>
                          <Share2 className="w-3.5 h-3.5 cursor-pointer hover:text-slate-600" />
                        </div>
                        <Link to={linkTo} className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white ${config.color}`}>{config.actionLabel}</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5 hidden lg:block">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-slate-900 font-bold text-sm mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Quiz Leaderboard</h3>
              <p className="text-slate-400 text-xs mb-3">Top scorers on latest quiz</p>
              {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((e, i) => (
                <div key={e.id || e.name || `lb-${i}`} className="flex items-center gap-2 py-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                  <span className="flex-1 text-slate-800 text-sm truncate">{e.user_name}</span>
                  <span className="text-blue-600 text-xs font-bold">{e.score}/{e.total}</span>
                </div>
              )) : <p className="text-slate-300 text-xs italic">No quiz attempts yet</p>}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-slate-900 font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> More Channels</h3>
              <div className="space-y-3">
                {suggestedCompanies.map(c => (
                  <Link key={c.id} to={`/company/${c.slug}`} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 ring-1 ring-slate-200"><img src={c.logo_url} alt="" className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-sm font-medium truncate group-hover:text-blue-600 transition-colors">{c.company_name}</p>
                      <p className="text-slate-400 text-xs">{c.followers_count || 0} followers</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {user && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-slate-900 font-bold text-sm mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-violet-500" /> Your Badges</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(user.badges || ['CEIBAA Verified']).map((b, i) => (
                    <span key={b || `badge-${i}`} className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-violet-50 text-violet-600 border border-violet-200">{b}</span>
                  ))}
                </div>
                <div className="mt-3 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Badge Progress</span><span>2/5</span></div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full"><div className="h-full bg-violet-500 rounded-full" style={{ width: '40%' }} /></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
