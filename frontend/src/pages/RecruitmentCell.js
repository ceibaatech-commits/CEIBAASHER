import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Users, FileText, BarChart3, Plus, LogOut, CheckCircle2, XCircle, Clock, Building2, Eye, EyeOff, AlertCircle, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function RecruitmentCell() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_recruitment_token'));
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [recruiters, setRecruiters] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddRecruiter, setShowAddRecruiter] = useState(false);
  const [newRec, setNewRec] = useState({ company_name: '', email: '', password: '', industry: '', mobile: '' });

  useEffect(() => {
    if (adminToken) fetchAll();
  }, [adminToken]);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginLoading(true); setLoginError('');
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/recruitment-admin/login`, loginForm);
      localStorage.setItem('admin_recruitment_token', data.access_token);
      setAdminToken(data.access_token);
    } catch (err) { setLoginError(err.response?.data?.detail || 'Login failed'); }
    finally { setLoginLoading(false); }
  };

  const headers = { Authorization: `Bearer ${adminToken}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [recs, posts, stats] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/recruitment-admin/recruiters`, { headers }),
        axios.get(`${BACKEND_URL}/api/recruitment-admin/pending-posts`, { headers }),
        axios.get(`${BACKEND_URL}/api/recruitment-admin/analytics`, { headers }),
      ]);
      setRecruiters(recs.data.recruiters || []);
      setPendingPosts(posts.data.posts || []);
      setAnalytics(stats.data);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('admin_recruitment_token'); setAdminToken(null); }
    } finally { setLoading(false); }
  };

  const approvePost = async (id) => {
    await axios.put(`${BACKEND_URL}/api/recruitment-admin/post/${id}/approve`, {}, { headers });
    setPendingPosts(prev => prev.filter(p => p.id !== id));
  };

  const rejectPost = async (id) => {
    const reason = prompt('Rejection reason (optional):') || '';
    await axios.put(`${BACKEND_URL}/api/recruitment-admin/post/${id}/reject`, { reason }, { headers });
    setPendingPosts(prev => prev.filter(p => p.id !== id));
  };

  const verifyRecruiter = async (id, field, value) => {
    await axios.put(`${BACKEND_URL}/api/recruitment-admin/recruiter/${id}/verify`, { [field]: value }, { headers });
    setRecruiters(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const revokeRecruiter = async (id) => {
    if (!window.confirm('Revoke this recruiter? All their posts will go offline.')) return;
    await axios.put(`${BACKEND_URL}/api/recruitment-admin/recruiter/${id}/revoke`, {}, { headers });
    setRecruiters(prev => prev.map(r => r.id === id ? { ...r, status: 'revoked' } : r));
  };

  const activateRecruiter = async (id) => {
    await axios.put(`${BACKEND_URL}/api/recruitment-admin/recruiter/${id}/activate`, {}, { headers });
    setRecruiters(prev => prev.map(r => r.id === id ? { ...r, status: 'active' } : r));
  };

  const addRecruiter = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/recruitment-admin/recruiters`, newRec, { headers });
      setShowAddRecruiter(false);
      setNewRec({ company_name: '', email: '', password: '', industry: '', mobile: '' });
      fetchAll();
    } catch (err) { alert(err.response?.data?.detail || 'Failed'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_recruitment_token');
    setAdminToken(null);
  };

  // Login Screen
  if (!adminToken) return (
    <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center px-4" data-testid="admin-recruitment-login">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-white font-bold text-3xl">cei</span>
            <span className="text-[#4f7cff] font-bold text-3xl">baa</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Shield size={18} className="text-[#7c3aed]" />
            <span className="text-[#8892b0] text-lg">Recruitment Cell</span>
          </div>
        </div>
        <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-8">
          <h2 className="text-[#e8eaf0] text-xl font-bold text-center mb-6">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required data-testid="admin-email-input"
              className="w-full px-4 py-3 bg-[#141720] border border-[#252a3d] rounded-xl text-[#e8eaf0] placeholder-[#8892b0]/50 focus:outline-none focus:border-[#7c3aed]"
              placeholder="Admin email" />
            <input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required data-testid="admin-password-input"
              className="w-full px-4 py-3 bg-[#141720] border border-[#252a3d] rounded-xl text-[#e8eaf0] placeholder-[#8892b0]/50 focus:outline-none focus:border-[#7c3aed]"
              placeholder="Password" />
            {loginError && <div className="flex items-center gap-2 text-[#ef4444] text-sm bg-[#ef4444]/10 p-3 rounded-lg"><AlertCircle size={16} /> {loginError}</div>}
            <button type="submit" disabled={loginLoading} data-testid="admin-login-btn"
              className="w-full py-3 bg-[#7c3aed] text-white rounded-xl font-medium hover:bg-[#6d28d9] disabled:opacity-50 transition-colors">
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const inputCls = "w-full px-4 py-3 bg-[#141720] border border-[#252a3d] rounded-xl text-[#e8eaf0] placeholder-[#8892b0]/50 focus:outline-none focus:border-[#7c3aed] text-sm";

  return (
    <div className="min-h-screen bg-[#0d0f14]" data-testid="recruitment-cell-page">
      {/* Header */}
      <div className="bg-[#141720] border-b border-[#252a3d]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-[#7c3aed]" />
            <div>
              <h1 className="text-[#e8eaf0] font-bold text-lg">CEIBAA Recruitment Cell</h1>
              <span className="text-[#8892b0] text-xs">Master Control Panel</span>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 text-[#8892b0] hover:text-[#ef4444]" data-testid="admin-logout-btn"><LogOut size={18} /></button>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { key: 'recruiters', label: 'Recruiters', icon: Building2 },
            { key: 'moderation', label: 'Moderation', icon: FileText },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} data-testid={`admin-tab-${t.key}`}
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${tab === t.key ? 'text-[#7c3aed] border-[#7c3aed]' : 'text-[#8892b0] border-transparent hover:text-[#e8eaf0]'}`}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading && <div className="text-center py-8"><div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin mx-auto" /></div>}

        {/* Dashboard Tab */}
        {tab === 'dashboard' && analytics && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Verified Recruiters', value: analytics.total_recruiters, color: '#7c3aed' },
                { label: 'Active Listings', value: analytics.active_listings, color: '#4f7cff' },
                { label: 'Total Applications', value: analytics.total_applications, color: '#22c55e' },
                { label: 'Students Placed', value: analytics.students_placed, color: '#f59e0b' },
                { label: 'Pending Approval', value: analytics.pending_posts, color: '#ef4444' },
              ].map((s, i) => (
                <div key={i} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-4">
                  <p className="text-[#8892b0] text-xs uppercase tracking-wider">{s.label}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
            {analytics.top_hiring?.length > 0 && (
              <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-6">
                <h3 className="text-[#e8eaf0] font-semibold mb-4">Top Hiring Companies</h3>
                {analytics.top_hiring.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-[#252a3d] last:border-0">
                    <span className="w-6 h-6 rounded-full bg-[#7c3aed]/20 text-[#7c3aed] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="flex-1 text-[#e8eaf0]">{t.company_name}</span>
                    <span className="text-[#f59e0b] font-semibold">{t.count} offers</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recruiters Tab */}
        {tab === 'recruiters' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#e8eaf0] text-xl font-bold">Recruiters ({recruiters.length})</h2>
              <button onClick={() => setShowAddRecruiter(true)} data-testid="add-recruiter-btn" className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> Add Recruiter</button>
            </div>
            {showAddRecruiter && (
              <form onSubmit={addRecruiter} className="bg-[#1a1e2e] border border-[#7c3aed]/30 rounded-xl p-6 mb-4 space-y-3" data-testid="add-recruiter-form">
                <div className="grid grid-cols-2 gap-3">
                  <input value={newRec.company_name} onChange={e => setNewRec({ ...newRec, company_name: e.target.value })} required className={inputCls} placeholder="Company Name *" data-testid="new-company-name" />
                  <input type="email" value={newRec.email} onChange={e => setNewRec({ ...newRec, email: e.target.value })} required className={inputCls} placeholder="Email *" data-testid="new-company-email" />
                  <input value={newRec.password} onChange={e => setNewRec({ ...newRec, password: e.target.value })} required className={inputCls} placeholder="Password *" data-testid="new-company-password" />
                  <input value={newRec.industry} onChange={e => setNewRec({ ...newRec, industry: e.target.value })} className={inputCls} placeholder="Industry" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowAddRecruiter(false)} className="px-4 py-2 bg-[#1a1e2e] border border-[#252a3d] text-[#8892b0] rounded-lg text-sm">Cancel</button>
                  <button type="submit" data-testid="save-recruiter-btn" className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm">Create Recruiter</button>
                </div>
              </form>
            )}
            <div className="space-y-3">
              {recruiters.map(rec => (
                <div key={rec.id} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5" data-testid={`admin-recruiter-${rec.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <img src={rec.logo_url} alt="" className="w-12 h-12 rounded-xl" />
                      <div>
                        <h3 className="text-[#e8eaf0] font-semibold">{rec.company_name}</h3>
                        <p className="text-[#8892b0] text-sm">{rec.email} | {rec.industry}</p>
                        <div className="flex gap-2 mt-2">
                          {['verified_email', 'verified_mobile', 'verified_gst'].map(field => (
                            <button key={field} onClick={() => verifyRecruiter(rec.id, field, !rec[field])}
                              className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${rec[field] ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#252a3d] text-[#8892b0]'}`}>
                              {rec[field] ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                              {field.replace('verified_', '')}
                            </button>
                          ))}
                        </div>
                        <p className="text-[#8892b0] text-xs mt-1">{rec.posts_count || 0} posts</p>
                      </div>
                    </div>
                    <div>
                      {rec.status === 'active' ? (
                        <button onClick={() => revokeRecruiter(rec.id)} className="px-3 py-1 bg-[#ef4444]/10 text-[#ef4444] rounded-lg text-xs">Revoke</button>
                      ) : (
                        <button onClick={() => activateRecruiter(rec.id)} className="px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] rounded-lg text-xs">Activate</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Moderation Tab */}
        {tab === 'moderation' && (
          <div>
            <h2 className="text-[#e8eaf0] text-xl font-bold mb-4">Pending Approval ({pendingPosts.length})</h2>
            {pendingPosts.length === 0 ? (
              <div className="text-center py-16 bg-[#1a1e2e] border border-[#252a3d] rounded-xl">
                <CheckCircle2 size={48} className="mx-auto text-[#22c55e] mb-4" />
                <p className="text-[#8892b0]">All caught up! No pending posts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPosts.map(post => (
                  <div key={post.id} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5" data-testid={`pending-post-${post.id}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-[#f59e0b]/20 text-[#f59e0b]">{post.post_type}</span>
                          <Clock size={14} className="text-[#f59e0b]" />
                        </div>
                        <h3 className="text-[#e8eaf0] font-semibold text-lg">{post.title}</h3>
                        <p className="text-[#8892b0] text-sm">{post.company_name}</p>
                        <p className="text-[#8892b0] text-xs mt-1 line-clamp-2">{post.description}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => approvePost(post.id)} data-testid={`approve-${post.id}`} className="px-4 py-2 bg-[#22c55e] text-white rounded-lg text-sm font-medium">Approve</button>
                        <button onClick={() => rejectPost(post.id)} data-testid={`reject-${post.id}`} className="px-4 py-2 bg-[#ef4444] text-white rounded-lg text-sm font-medium">Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
