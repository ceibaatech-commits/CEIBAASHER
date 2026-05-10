import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, Users, FileText, BarChart3, Plus, LogOut, Clock, CheckCircle2, XCircle, Eye, Camera, Pencil, Save, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [recruiter, setRecruiter] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ company_name: '', about: '', website: '', industry: '', logo_url: '', banner_url: '', founding_year: '', employee_count: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Auth now lives in httpOnly session_token cookie (Stage 3).
    // Check non-sensitive recruiter_data for client-side gating only.
    if (!localStorage.getItem('recruiter_data')) { navigate('/recruiter'); return; }
    fetchData();
  // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    try {
      const [me, myPosts, analytics] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/recruitment/recruiter/me`),
        axios.get(`${BACKEND_URL}/api/recruitment/posts/my`),
        axios.get(`${BACKEND_URL}/api/recruitment/analytics`),
      ]);
      setRecruiter(me.data);
      setPosts(myPosts.data.posts || []);
      setStats(analytics.data);
      setProfileForm({
        company_name: me.data.company_name || '',
        about: me.data.about || '',
        website: me.data.website || '',
        industry: me.data.industry || '',
        logo_url: me.data.logo_url || '',
        banner_url: me.data.banner_url || '',
        founding_year: me.data.founding_year || '',
        employee_count: me.data.employee_count || '',
      });
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('recruiter_data'); navigate('/recruiter'); }
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('recruiter_data');
    // Cookie is cleared server-side on /api/recruitment/recruiter/logout if you wire it;
    // for now the cookie auto-expires and unauthenticated calls will 401.
    navigate('/recruiter');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${BACKEND_URL}/api/recruitment/company/update`, profileForm);
      setRecruiter(prev => ({ ...prev, ...profileForm }));
      setEditingProfile(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleLogoUrlChange = (e) => {
    setProfileForm(prev => ({ ...prev, logo_url: e.target.value }));
  };

  if (loading) return <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#4f7cff] border-t-transparent rounded-full animate-spin" /></div>;

  const statusIcon = { pending: <Clock size={14} className="text-[#f59e0b]" />, approved: <CheckCircle2 size={14} className="text-[#22c55e]" />, rejected: <XCircle size={14} className="text-[#ef4444]" /> };

  return (
    <div className="min-h-screen bg-[#0d0f14]" data-testid="recruiter-dashboard">
      {/* Header */}
      <div className="bg-[#141720] border-b border-[#252a3d]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#1a1e2e]">
                {recruiter?.logo_url ? <img src={recruiter.logo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#4f7cff] font-bold">{(recruiter?.company_name || '?')[0]}</div>}
              </div>
              <button onClick={() => setEditingProfile(true)} className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#4f7cff] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-testid="edit-logo-btn">
                <Camera size={10} className="text-white" />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[#e8eaf0] font-bold text-lg">{recruiter?.company_name}</h1>
                <button onClick={() => setEditingProfile(true)} className="text-[#8892b0] hover:text-[#4f7cff]" data-testid="edit-company-btn"><Pencil size={14} /></button>
              </div>
              <span className="text-[#4f7cff] text-xs flex items-center gap-1"><CheckCircle2 size={12} /> Verified Recruiter</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/recruiter/post" data-testid="create-post-btn" className="px-4 py-2 bg-[#4f7cff] text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#3d6ae8] shadow-lg shadow-[#4f7cff]/20"><Plus size={16} /> New Post</Link>
            <Link to="/recruiter/analytics" className="px-4 py-2 bg-[#1a1e2e] border border-[#252a3d] text-[#e8eaf0] rounded-xl text-sm flex items-center gap-2 hover:border-[#4f7cff]/30"><BarChart3 size={16} /> Analytics</Link>
            <button onClick={handleLogout} className="p-2 text-[#8892b0] hover:text-[#ef4444]" data-testid="recruiter-logout-btn"><LogOut size={18} /></button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ── Edit Profile Modal ── */}
        {editingProfile && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4" data-testid="edit-profile-modal">
            <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[#e8eaf0] text-lg font-bold">Edit Company Profile</h2>
                <button onClick={() => setEditingProfile(false)} className="text-[#8892b0] hover:text-[#e8eaf0]"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                {/* Logo Preview + URL */}
                <div>
                  <label className="text-[#8892b0] text-xs uppercase tracking-wider block mb-2">Company Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#141720] border-2 border-dashed border-[#252a3d] flex-shrink-0">
                      {profileForm.logo_url ? <img src={profileForm.logo_url} alt="" className="w-full h-full object-cover" /> : <Camera size={24} className="m-auto mt-6 text-[#8892b0]" />}
                    </div>
                    <div className="flex-1">
                      <input value={profileForm.logo_url} onChange={handleLogoUrlChange} className="w-full px-3 py-2 bg-[#141720] border border-[#252a3d] rounded-lg text-[#e8eaf0] text-sm placeholder-[#8892b0]/50 focus:outline-none focus:border-[#4f7cff]" placeholder="Logo image URL" data-testid="logo-url-input" />
                      <p className="text-[#8892b0] text-[10px] mt-1">Paste a direct image URL (square format recommended)</p>
                    </div>
                  </div>
                </div>
                {/* Banner URL */}
                <div>
                  <label className="text-[#8892b0] text-xs uppercase tracking-wider block mb-1.5">Banner Image URL</label>
                  <input value={profileForm.banner_url} onChange={e => setProfileForm(prev => ({ ...prev, banner_url: e.target.value }))} className="w-full px-3 py-2 bg-[#141720] border border-[#252a3d] rounded-lg text-[#e8eaf0] text-sm placeholder-[#8892b0]/50 focus:outline-none focus:border-[#4f7cff]" placeholder="Wide banner image URL (16:9)" data-testid="banner-url-input" />
                </div>
                {/* Company Name */}
                <div>
                  <label className="text-[#8892b0] text-xs uppercase tracking-wider block mb-1.5">Company Name</label>
                  <input value={profileForm.company_name} onChange={e => setProfileForm(prev => ({ ...prev, company_name: e.target.value }))} className="w-full px-3 py-2 bg-[#141720] border border-[#252a3d] rounded-lg text-[#e8eaf0] text-sm focus:outline-none focus:border-[#4f7cff]" data-testid="company-name-input" />
                </div>
                {/* About */}
                <div>
                  <label className="text-[#8892b0] text-xs uppercase tracking-wider block mb-1.5">About</label>
                  <textarea value={profileForm.about} onChange={e => setProfileForm(prev => ({ ...prev, about: e.target.value }))} className="w-full px-3 py-2 bg-[#141720] border border-[#252a3d] rounded-lg text-[#e8eaf0] text-sm focus:outline-none focus:border-[#4f7cff] h-24 resize-none" placeholder="Describe your company..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[#8892b0] text-xs uppercase tracking-wider block mb-1.5">Website</label><input value={profileForm.website} onChange={e => setProfileForm(prev => ({ ...prev, website: e.target.value }))} className="w-full px-3 py-2 bg-[#141720] border border-[#252a3d] rounded-lg text-[#e8eaf0] text-sm focus:outline-none focus:border-[#4f7cff]" placeholder="https://..." /></div>
                  <div><label className="text-[#8892b0] text-xs uppercase tracking-wider block mb-1.5">Industry</label><input value={profileForm.industry} onChange={e => setProfileForm(prev => ({ ...prev, industry: e.target.value }))} className="w-full px-3 py-2 bg-[#141720] border border-[#252a3d] rounded-lg text-[#e8eaf0] text-sm focus:outline-none focus:border-[#4f7cff]" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[#8892b0] text-xs uppercase tracking-wider block mb-1.5">Founded Year</label><input value={profileForm.founding_year} onChange={e => setProfileForm(prev => ({ ...prev, founding_year: e.target.value }))} className="w-full px-3 py-2 bg-[#141720] border border-[#252a3d] rounded-lg text-[#e8eaf0] text-sm focus:outline-none focus:border-[#4f7cff]" placeholder="e.g. 1998" /></div>
                  <div><label className="text-[#8892b0] text-xs uppercase tracking-wider block mb-1.5">Employee Count</label><input value={profileForm.employee_count} onChange={e => setProfileForm(prev => ({ ...prev, employee_count: e.target.value }))} className="w-full px-3 py-2 bg-[#141720] border border-[#252a3d] rounded-lg text-[#e8eaf0] text-sm focus:outline-none focus:border-[#4f7cff]" placeholder="e.g. 50,000+" /></div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingProfile(false)} className="flex-1 py-2.5 bg-[#141720] border border-[#252a3d] text-[#8892b0] rounded-xl text-sm font-medium">Cancel</button>
                <button onClick={handleSaveProfile} disabled={saving} data-testid="save-profile-btn" className="flex-1 py-2.5 bg-[#4f7cff] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? 'Saving...' : <><Save size={14} /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Applications', value: stats.total_applications, color: '#4f7cff' },
              { label: 'Shortlisted', value: stats.shortlisted, color: '#22c55e' },
              { label: 'Offers Sent', value: stats.offers_sent, color: '#f59e0b' },
              { label: 'Followers', value: stats.followers, color: '#c084fc' },
              { label: 'Active Posts', value: stats.approved_posts, color: '#4f7cff' },
            ].map((s, i) => (
              <div key={i} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-4">
                <p className="text-[#8892b0] text-xs uppercase tracking-wider">{s.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Company Channel Preview */}
        <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#e8eaf0] font-bold text-sm">Company Channel</h3>
            <Link to={`/company/${recruiter?.slug}`} className="text-[#4f7cff] text-xs hover:underline">View Public Page →</Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#141720]">
              {recruiter?.logo_url && <img src={recruiter.logo_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              <p className="text-[#e8eaf0] font-semibold">{recruiter?.company_name}</p>
              <p className="text-[#8892b0] text-sm">{recruiter?.industry} {recruiter?.founding_year && `· Est. ${recruiter.founding_year}`}</p>
              <button onClick={() => setEditingProfile(true)} className="text-[#4f7cff] text-xs mt-1 flex items-center gap-1 hover:underline" data-testid="edit-channel-btn"><Pencil size={11} /> Edit Logo & Details</button>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#e8eaf0] text-xl font-bold">Your Posts</h2>
        </div>
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1e2e] border border-[#252a3d] rounded-2xl">
            <FileText size={48} className="mx-auto text-[#252a3d] mb-4" />
            <p className="text-[#8892b0]">No posts yet</p>
            <Link to="/recruiter/post" className="inline-block mt-4 px-5 py-2 bg-[#4f7cff] text-white rounded-xl text-sm font-semibold">Create Your First Post</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5 flex items-center justify-between" data-testid={`recruiter-post-${post.id}`}>
                <div className="flex items-start gap-3">
                  {statusIcon[post.status] || statusIcon.pending}
                  <div>
                    <h3 className="text-[#e8eaf0] font-semibold">{post.title}</h3>
                    <div className="flex gap-3 text-xs text-[#8892b0] mt-1">
                      <span className="capitalize">{post.post_type}</span>
                      <span className={post.status === 'approved' ? 'text-[#22c55e]' : post.status === 'pending' ? 'text-[#f59e0b]' : 'text-[#ef4444]'}>{post.status}</span>
                      <span>{post.applications_count || 0} applications</span>
                    </div>
                  </div>
                </div>
                {post.status === 'approved' && (
                  <Link to={`/recruiter/applicants/${post.id}`} className="px-3 py-1.5 bg-[#4f7cff]/10 text-[#4f7cff] rounded-lg text-sm flex items-center gap-1.5 hover:bg-[#4f7cff]/20" data-testid={`view-applicants-${post.id}`}>
                    <Eye size={14} /> Applicants
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
