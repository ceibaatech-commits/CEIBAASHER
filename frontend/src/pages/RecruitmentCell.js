import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Shield, Users, FileText, BarChart3, Plus, LogOut, CheckCircle2, XCircle, Clock, Building2, Eye, EyeOff, AlertCircle, Trash2, Upload, Mail, ArrowLeft, Edit3, Save, X } from 'lucide-react';

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
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);

  const headers = { Authorization: `Bearer ${adminToken}` };

  useEffect(() => { if (adminToken) fetchAll(); }, [adminToken]);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginLoading(true); setLoginError('');
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/recruitment-admin/login`, loginForm);
      localStorage.setItem('admin_recruitment_token', data.access_token);
      setAdminToken(data.access_token);
    } catch (err) { setLoginError(err.response?.data?.detail || 'Login failed'); }
    finally { setLoginLoading(false); }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, p, a] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/recruitment-admin/recruiters`, { headers }),
        axios.get(`${BACKEND_URL}/api/recruitment-admin/pending-posts`, { headers }),
        axios.get(`${BACKEND_URL}/api/recruitment-admin/analytics`, { headers }),
      ]);
      setRecruiters(r.data.recruiters || []);
      setPendingPosts(p.data.posts || []);
      setAnalytics(a.data);
    } catch (err) { if (err.response?.status === 401) { setAdminToken(null); localStorage.removeItem('admin_recruitment_token'); } }
    finally { setLoading(false); }
  };

  const addRecruiter = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/recruitment-admin/recruiters`, newRec, { headers });
      setShowAddRecruiter(false);
      setNewRec({ company_name: '', email: '', password: '', industry: '', mobile: '' });
      fetchAll();
      toast.success('Recruiter added');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const verifyRecruiter = async (id, field, val) => {
    await axios.put(`${BACKEND_URL}/api/recruitment-admin/recruiter/${id}/verify`, { [field]: val }, { headers });
    fetchAll();
  };

  const revokeRecruiter = async (id) => { await axios.put(`${BACKEND_URL}/api/recruitment-admin/recruiter/${id}/revoke`, {}, { headers }); fetchAll(); };
  const activateRecruiter = async (id) => { await axios.put(`${BACKEND_URL}/api/recruitment-admin/recruiter/${id}/activate`, {}, { headers }); fetchAll(); };
  const approvePost = async (id) => { await axios.put(`${BACKEND_URL}/api/recruitment-admin/post/${id}/approve`, {}, { headers }); fetchAll(); toast.success('Post approved'); };
  const rejectPost = async (id) => { await axios.put(`${BACKEND_URL}/api/recruitment-admin/post/${id}/reject`, { reason: 'Does not meet guidelines' }, { headers }); fetchAll(); };

  const openRecruiterDetail = async (id) => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment-admin/recruiter/${id}`, { headers });
      setSelectedRecruiter(data);
    } catch { toast.error('Failed to load details'); }
  };

  const logout = () => { localStorage.removeItem('admin_recruitment_token'); setAdminToken(null); };

  // ── LOGIN ──
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center px-4" data-testid="admin-login">
        <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Shield size={40} className="mx-auto text-[#4f7cff] mb-4" />
            <h1 className="text-[#e8eaf0] text-2xl font-bold">CEIBAA Recruitment Cell</h1>
            <p className="text-[#8892b0] text-sm">Admin Portal</p>
          </div>
          {loginError && <div className="bg-[#ef4444]/10 text-[#ef4444] p-3 rounded-lg text-sm mb-4">{loginError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required className="w-full bg-[#141720] border border-[#252a3d] rounded-lg px-4 py-3 text-[#e8eaf0] placeholder-[#8892b0]/50 focus:outline-none focus:border-[#4f7cff]" placeholder="Admin Email" data-testid="admin-email" />
            <input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required className="w-full bg-[#141720] border border-[#252a3d] rounded-lg px-4 py-3 text-[#e8eaf0] placeholder-[#8892b0]/50 focus:outline-none focus:border-[#4f7cff]" placeholder="Password" data-testid="admin-password" />
            <button type="submit" disabled={loginLoading} className="w-full bg-[#4f7cff] text-white py-3 rounded-lg font-semibold disabled:opacity-50" data-testid="admin-login-btn">{loginLoading ? 'Logging in...' : 'Login'}</button>
          </form>
        </div>
      </div>
    );
  }

  const inputCls = "w-full bg-[#141720] border border-[#252a3d] rounded-lg px-4 py-2.5 text-[#e8eaf0] placeholder-[#8892b0]/50 focus:outline-none focus:border-[#4f7cff] text-sm";
  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'recruiters', label: 'Companies', icon: Building2 },
    { key: 'moderation', label: 'Moderation', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#0d0f14]" data-testid="admin-panel">
      {/* Header */}
      <div className="bg-[#1a1e2e] border-b border-[#252a3d] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-[#4f7cff]" />
          <div><span className="text-[#e8eaf0] font-bold text-lg">CEIBAA</span><span className="text-[#8892b0] text-xs ml-2">Recruitment Cell</span></div>
        </div>
        <div className="flex items-center gap-2">
          {tabs.map(t => { const I = t.icon; return (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedRecruiter(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${tab === t.key ? 'bg-[#4f7cff] text-white' : 'text-[#8892b0] hover:bg-[#252a3d]'}`}>
              <I className="w-3.5 h-3.5" />{t.label}
            </button>
          ); })}
          <button onClick={logout} className="ml-4 p-2 text-[#8892b0] hover:text-[#ef4444]"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {loading && <div className="text-center py-12 text-[#8892b0]">Loading...</div>}

        {/* ── Company Detail View ── */}
        {selectedRecruiter && <CompanyDetailPanel rec={selectedRecruiter} headers={headers} onClose={() => { setSelectedRecruiter(null); fetchAll(); }} />}

        {/* ── Dashboard ── */}
        {!selectedRecruiter && tab === 'dashboard' && analytics && (
          <div>
            <h2 className="text-[#e8eaf0] text-xl font-bold mb-4">Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: 'Recruiters', val: analytics.total_recruiters, color: '#4f7cff' },
                { label: 'Active Listings', val: analytics.active_listings, color: '#22c55e' },
                { label: 'Applications', val: analytics.total_applications, color: '#f59e0b' },
                { label: 'Placed', val: analytics.students_placed, color: '#7c3aed' },
                { label: 'Pending', val: analytics.pending_posts, color: '#ef4444' },
              ].map(s => (
                <div key={s.label} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-4 text-center">
                  <p className="text-3xl font-black" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[#8892b0] text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            {analytics.top_hiring?.length > 0 && (
              <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5">
                <h3 className="text-[#e8eaf0] font-semibold mb-4">Top Hiring Companies</h3>
                {analytics.top_hiring.map((t, i) => (
                  <div key={`hiring-${i}-${t.company_name}`} className="flex items-center gap-3 py-2">
                    <span className="w-6 h-6 rounded-full bg-[#7c3aed]/20 text-[#7c3aed] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="flex-1 text-[#e8eaf0]">{t.company_name}</span>
                    <span className="text-[#f59e0b] font-semibold">{t.count} offers</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Companies Tab ── */}
        {!selectedRecruiter && tab === 'recruiters' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#e8eaf0] text-xl font-bold">Companies ({recruiters.length})</h2>
              <button onClick={() => setShowAddRecruiter(!showAddRecruiter)} className="px-4 py-2 bg-[#4f7cff] text-white rounded-lg text-sm font-medium flex items-center gap-2"><Plus size={14} /> Add Recruiter</button>
            </div>
            {showAddRecruiter && (
              <form onSubmit={addRecruiter} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5 mb-4 grid grid-cols-2 gap-3">
                <input value={newRec.company_name} onChange={e => setNewRec({ ...newRec, company_name: e.target.value })} required className={inputCls} placeholder="Company Name *" data-testid="new-company-name" />
                <input type="email" value={newRec.email} onChange={e => setNewRec({ ...newRec, email: e.target.value })} required className={inputCls} placeholder="Email *" data-testid="new-company-email" />
                <input value={newRec.password} onChange={e => setNewRec({ ...newRec, password: e.target.value })} required className={inputCls} placeholder="Password *" data-testid="new-company-password" />
                <input value={newRec.industry} onChange={e => setNewRec({ ...newRec, industry: e.target.value })} className={inputCls} placeholder="Industry" />
                <input value={newRec.mobile} onChange={e => setNewRec({ ...newRec, mobile: e.target.value })} className={inputCls} placeholder="Mobile" />
                <button type="submit" className="bg-[#22c55e] text-white px-4 py-2 rounded-lg text-sm font-medium">Create</button>
              </form>
            )}
            <div className="space-y-3">
              {recruiters.map(rec => (
                <div key={rec.id} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5 hover:border-[#4f7cff]/30 transition-all cursor-pointer" data-testid={`admin-recruiter-${rec.id}`} onClick={() => openRecruiterDetail(rec.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <img src={rec.logo_url} alt="" className="w-12 h-12 rounded-xl" />
                      <div>
                        <h3 className="text-[#e8eaf0] font-semibold">{rec.company_name}</h3>
                        <p className="text-[#8892b0] text-sm">{rec.email} | {rec.industry}</p>
                        <div className="flex gap-2 mt-2">
                          {[
                            { key: 'verified_email', label: 'Email' },
                            { key: 'verified_mobile', label: 'Mobile' },
                            { key: 'verified_gst', label: 'GST' },
                            { key: 'verified_pan', label: 'PAN' },
                            { key: 'verified_cin', label: 'CIN' },
                          ].map(v => (
                            <span key={v.key} className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 ${rec[v.key] ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#252a3d] text-[#8892b0]'}`}>
                              {rec[v.key] ? <CheckCircle2 size={9} /> : <XCircle size={9} />} {v.label}
                            </span>
                          ))}
                        </div>
                        <p className="text-[#8892b0] text-xs mt-1">{rec.posts_count || 0} posts · Status: <span className={rec.status === 'active' ? 'text-[#22c55e]' : 'text-[#ef4444]'}>{rec.status}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
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

        {/* ── Moderation Tab ── */}
        {!selectedRecruiter && tab === 'moderation' && (
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

/* ── Company Detail & Verification Panel ── */
function CompanyDetailPanel({ rec, headers, onClose }) {
  const [form, setForm] = useState({
    gst_number: rec.gst_number || '', pan_number: rec.pan_number || '', cin_number: rec.cin_number || '',
    verified_email: rec.verified_email || false, verified_mobile: rec.verified_mobile || false,
    verified_gst: rec.verified_gst || false, verified_pan: rec.verified_pan || false, verified_cin: rec.verified_cin || false,
    admin_notes: rec.admin_notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});

  const saveVerification = async () => {
    setSaving(true);
    try {
      await axios.put(`${BACKEND_URL}/api/recruitment-admin/recruiter/${rec.id}/verification`, form, { headers });
      toast.success('Verification updated');
    } catch (err) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const uploadDoc = async (docType, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [docType]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await axios.post(`${BACKEND_URL}/api/recruitment-admin/recruiter/${rec.id}/upload-document?doc_type=${docType}`, fd, { headers });
      toast.success(`${docType.replace(/_/g, ' ')} uploaded`);
      rec[`${docType}_url`] = data.url;
    } catch (err) { toast.error(err.response?.data?.detail || 'Upload failed'); }
    finally { setUploading(prev => ({ ...prev, [docType]: false })); }
  };

  const sendVerifEmail = async () => {
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/recruitment-admin/recruiter/${rec.id}/send-verification-email`, {}, { headers });
      if (data.sent) toast.success('Verification email sent');
      else toast.info(`Email service sandbox mode. Code: ${data.code || 'N/A'}`);
    } catch { toast.error('Failed'); }
  };

  const docTypes = [
    { key: 'gst_certificate', label: 'GST Certificate', urlKey: 'gst_certificate_url' },
    { key: 'pan_card', label: 'PAN Card', urlKey: 'pan_card_url' },
    { key: 'cin_certificate', label: 'CIN Certificate', urlKey: 'cin_certificate_url' },
    { key: 'incorporation_certificate', label: 'Certificate of Incorporation', urlKey: 'incorporation_certificate_url' },
  ];
  const verifications = [
    { key: 'verified_email', label: 'Email Verified' },
    { key: 'verified_mobile', label: 'Mobile Verified' },
    { key: 'verified_gst', label: 'GST Verified' },
    { key: 'verified_pan', label: 'PAN Verified' },
    { key: 'verified_cin', label: 'CIN Verified' },
  ];

  return (
    <div data-testid="company-detail-panel">
      <button onClick={onClose} className="flex items-center gap-2 text-[#8892b0] hover:text-[#e8eaf0] mb-4 text-sm"><ArrowLeft size={16} /> Back to Companies</button>

      {/* Company Header */}
      <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-6 mb-4">
        <div className="flex items-center gap-4">
          <img src={rec.logo_url} alt="" className="w-16 h-16 rounded-xl" />
          <div>
            <h2 className="text-[#e8eaf0] text-xl font-bold">{rec.company_name}</h2>
            <p className="text-[#8892b0] text-sm">{rec.email} · {rec.industry} · {rec.posts_count} posts · {rec.apps_count} applications</p>
            <p className="text-[#8892b0] text-xs mt-1">Status: <span className={rec.status === 'active' ? 'text-[#22c55e]' : 'text-[#ef4444]'}>{rec.status}</span> · Created: {new Date(rec.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GST / PAN / CIN Numbers */}
        <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5">
          <h3 className="text-[#e8eaf0] font-semibold mb-4 flex items-center gap-2"><Edit3 size={16} className="text-[#4f7cff]" /> Company Registration</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[#8892b0] text-xs mb-1 block">GST Number</label>
              <input value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value })} className="w-full bg-[#141720] border border-[#252a3d] rounded-lg px-3 py-2 text-[#e8eaf0] text-sm focus:outline-none focus:border-[#4f7cff]" placeholder="e.g. 27AAACR5055K1Z5" data-testid="gst-input" />
            </div>
            <div>
              <label className="text-[#8892b0] text-xs mb-1 block">PAN Number</label>
              <input value={form.pan_number} onChange={e => setForm({ ...form, pan_number: e.target.value })} className="w-full bg-[#141720] border border-[#252a3d] rounded-lg px-3 py-2 text-[#e8eaf0] text-sm focus:outline-none focus:border-[#4f7cff]" placeholder="e.g. AAACR5055K" data-testid="pan-input" />
            </div>
            <div>
              <label className="text-[#8892b0] text-xs mb-1 block">CIN Number</label>
              <input value={form.cin_number} onChange={e => setForm({ ...form, cin_number: e.target.value })} className="w-full bg-[#141720] border border-[#252a3d] rounded-lg px-3 py-2 text-[#e8eaf0] text-sm focus:outline-none focus:border-[#4f7cff]" placeholder="e.g. L22210MH1995PLC084781" data-testid="cin-input" />
            </div>
            <div>
              <label className="text-[#8892b0] text-xs mb-1 block">Admin Notes</label>
              <textarea value={form.admin_notes} onChange={e => setForm({ ...form, admin_notes: e.target.value })} rows={2} className="w-full bg-[#141720] border border-[#252a3d] rounded-lg px-3 py-2 text-[#e8eaf0] text-sm focus:outline-none focus:border-[#4f7cff] resize-none" placeholder="Internal notes..." />
            </div>
            <button onClick={saveVerification} disabled={saving} className="w-full bg-[#4f7cff] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2" data-testid="save-verification">
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Verification Toggles */}
        <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5">
          <h3 className="text-[#e8eaf0] font-semibold mb-4 flex items-center gap-2"><CheckCircle2 size={16} className="text-[#22c55e]" /> Verification Status</h3>
          <div className="space-y-2.5">
            {verifications.map(v => (
              <button key={v.key} onClick={() => setForm(prev => ({ ...prev, [v.key]: !prev[v.key] }))}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${form[v.key] ? 'border-[#22c55e]/30 bg-[#22c55e]/5' : 'border-[#252a3d] bg-[#141720]'}`} data-testid={`toggle-${v.key}`}>
                <span className="text-sm text-[#e8eaf0]">{v.label}</span>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${form[v.key] ? 'bg-[#22c55e]' : 'bg-[#252a3d]'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form[v.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>
            ))}
          </div>
          <button onClick={sendVerifEmail} className="w-full mt-4 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2" data-testid="send-verif-email">
            <Mail size={14} /> Send Verification Email
          </button>
        </div>

        {/* Document Upload */}
        <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5 lg:col-span-2">
          <h3 className="text-[#e8eaf0] font-semibold mb-4 flex items-center gap-2"><Upload size={16} className="text-[#f59e0b]" /> Company Documents (Stored on Cloud)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {docTypes.map(d => (
              <div key={d.key} className="bg-[#141720] border border-[#252a3d] rounded-xl p-4">
                <p className="text-[#e8eaf0] text-sm font-medium mb-2">{d.label}</p>
                {rec[d.urlKey] ? (
                  <div className="flex items-center gap-2 mb-2">
                    <a href={rec[d.urlKey]} target="_blank" rel="noreferrer" className="text-[#4f7cff] text-xs hover:underline truncate flex-1">{rec[d.urlKey].split('/').pop()}</a>
                    <CheckCircle2 size={14} className="text-[#22c55e] flex-shrink-0" />
                  </div>
                ) : (
                  <p className="text-[#8892b0] text-xs mb-2">No document uploaded</p>
                )}
                <label className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${uploading[d.key] ? 'bg-[#252a3d] text-[#8892b0]' : 'bg-[#4f7cff]/10 text-[#4f7cff] hover:bg-[#4f7cff]/20'}`}>
                  <Upload size={12} /> {uploading[d.key] ? 'Uploading...' : rec[d.urlKey] ? 'Replace' : 'Upload'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={e => uploadDoc(d.key, e.target.files?.[0])} disabled={uploading[d.key]} data-testid={`upload-${d.key}`} />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
