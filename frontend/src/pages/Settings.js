import React from 'react';
import { Lock, Shield, User as UserIcon, ShieldOff, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChangePasswordForm from '../components/ChangePasswordForm';
import BlockedAccountsCard from '../components/settings/BlockedAccountsCard';
import { useAuth } from '../context/AuthContext';

const SettingsCard = ({ icon, iconBg, title, description, children }) => (
  <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_20px_50px_rgba(124,92,255,0.04)] hover:shadow-[0_30px_70px_rgba(124,92,255,0.08)] transition-all duration-300 overflow-hidden">
    <div className="px-5 md:px-6 pt-5 md:pt-6 pb-4 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-black text-slate-900">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
    <div className="px-5 md:px-6 pb-5 md:pb-6">{children}</div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const user = authUser || (() => {
    try { return JSON.parse(localStorage.getItem('ceibaa_user') || 'null'); }
    catch { return null; }
  })();

  const username = user?.username || user?.name || '';
  const profilePath = username ? `/profile/${username}` : '/profile/board';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-[#f7f5ff] to-[#f0f4ff]">
      {/* Decorative nodes */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#e3ddff]/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-[20%] right-[-100px] w-96 h-96 rounded-full bg-sky-300/10 blur-3xl pointer-events-none" />

      <Header />

      {/* ── Purple hero strip ── */}
      <div className="relative bg-gradient-to-br from-[#7c5cff] via-[#6a4ce4] to-[#4c2ec4] px-4 md:px-8 pt-6 pb-10 md:pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,_rgba(255,255,255,0.18)_0%,_transparent_60%)] pointer-events-none" />
        <div className="absolute -top-8 -right-8 w-56 h-56 rounded-full bg-violet-300/30 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="sdots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="white" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#sdots)" />
        </svg>
        <div className="relative max-w-3xl mx-auto z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white leading-tight">Account Settings</h1>
              <p className="text-white/60 text-xs mt-0.5">Manage security, profile &amp; preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="max-w-3xl mx-auto px-3 md:px-6 pb-10 -mt-6 relative z-10" data-testid="settings-page">
        <div className="space-y-4">

          {/* Change Password */}
          <SettingsCard
            iconBg="bg-violet-50 text-[#7c5cff]"
            icon={<Lock className="w-5 h-5 text-[#7c5cff]" />}
            title="Change Password"
            description="Enter your current password and choose a new one. You'll be signed out of other devices."
          >
            <ChangePasswordForm />
          </SettingsCard>

          {/* Profile */}
          <SettingsCard
            iconBg="bg-pink-50"
            icon={<UserIcon className="w-5 h-5 text-pink-500" />}
            title="Your Profile"
            description="View and edit your public profile — display name, bio, avatar, and social handles."
          >
            <button
              onClick={() => navigate(profilePath)}
              data-testid="settings-open-profile-link"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#7c5cff] to-[#ec4899] text-white text-sm font-bold rounded-2xl shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 active:scale-95 transition-all"
            >
              <UserIcon className="w-4 h-4" />
              View My Profile
              <ChevronRight className="w-4 h-4" />
            </button>
          </SettingsCard>

          {/* Blocked Accounts */}
          <SettingsCard
            iconBg="bg-red-50"
            icon={<ShieldOff className="w-5 h-5 text-red-500" />}
            title="Blocked Accounts"
            description="People you've blocked won't see your profile or posts. You can unblock them anytime."
          >
            <BlockedAccountsCardInner />
          </SettingsCard>

        </div>
      </div>

      <Footer />
    </div>
  );
};

// Inline version without the outer Card shell
const BlockedAccountsCardInner = () => {
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState(null);
  const BACKEND_URL = window.location.origin;

  const fetchBlocked = React.useCallback(async () => {
    setLoading(true);
    try {
      const { default: axios } = await import('axios');
      const res = await axios.get(`${BACKEND_URL}/api/profile/blocked-users`, { withCredentials: true });
      if (res.data?.success) setList(res.data.blocked_users || []);
    } catch { /* empty state covers it */ } finally { setLoading(false); }
  }, [BACKEND_URL]);

  React.useEffect(() => { fetchBlocked(); }, [fetchBlocked]);

  const handleUnblock = async (user) => {
    if (busyId) return;
    if (!window.confirm(`Unblock @${user.username || user.name}?`)) return;
    setBusyId(user.id);
    try {
      const { default: axios } = await import('axios');
      await axios.delete(`${BACKEND_URL}/api/profile/block/${user.id}`, { withCredentials: true });
      setList((prev) => prev.filter((u) => u.id !== user.id));
    } catch { /* ignore */ } finally { setBusyId(null); }
  };

  if (loading) return <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-violet-200 border-b-[#7c5cff] rounded-full animate-spin" /></div>;
  if (list.length === 0) return <p className="text-sm text-slate-400 py-2" data-testid="blocked-accounts-empty">You haven&apos;t blocked anyone.</p>;

  return (
    <ul className="divide-y divide-slate-100" data-testid="blocked-accounts-list">
      {list.map((u) => (
        <li key={u.id} className="flex items-center gap-3 py-3" data-testid={`blocked-row-${u.id}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-sm font-black shrink-0">
            {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover" /> : (u.name?.charAt(0) || '?')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-slate-900 truncate">{u.name}</p>
            {u.username && <p className="text-xs text-slate-400 truncate">@{u.username}</p>}
          </div>
          <button
            onClick={() => handleUnblock(u)}
            disabled={busyId === u.id}
            data-testid={`unblock-btn-${u.id}`}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {busyId === u.id ? 'Unblocking…' : 'Unblock'}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default Settings;
