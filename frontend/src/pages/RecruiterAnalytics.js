import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BarChart3, Users, Briefcase, TrendingUp, Award } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function RecruiterAnalytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('recruiter_token');
    if (!token) { navigate('/recruiter'); return; }
    fetchStats(token);
  }, []);

  const fetchStats = async (token) => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/analytics`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/recruiter');
    } finally { setLoading(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#4f7cff] border-t-transparent rounded-full animate-spin" /></div>;
  if (!stats) return null;

  return (
    <div className="min-h-screen bg-[#0d0f14]" data-testid="recruiter-analytics-page">
      <div className="bg-[#141720] border-b border-[#252a3d]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button onClick={() => navigate('/recruiter/dashboard')} className="flex items-center gap-2 text-[#8892b0] hover:text-[#e8eaf0] mb-3 text-sm"><ArrowLeft size={16} /> Back</button>
          <h1 className="text-[#e8eaf0] text-2xl font-bold flex items-center gap-2"><BarChart3 size={24} className="text-[#4f7cff]" /> Analytics</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applications', value: stats.total_applications, icon: Users, color: '#4f7cff' },
            { label: 'Shortlisted', value: stats.shortlisted, icon: Award, color: '#22c55e' },
            { label: 'Offers Sent', value: stats.offers_sent, icon: Briefcase, color: '#f59e0b' },
            { label: 'Acceptance Rate', value: `${stats.acceptance_rate}%`, icon: TrendingUp, color: '#7c3aed' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5">
                <Icon size={20} style={{ color: s.color }} className="mb-2" />
                <p className="text-3xl font-bold text-[#e8eaf0]">{s.value}</p>
                <p className="text-[#8892b0] text-xs mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Per-Post Stats */}
        <h2 className="text-[#e8eaf0] text-xl font-bold mb-4">Per-Post Performance</h2>
        <div className="space-y-3">
          {(stats.post_stats || []).map(p => (
            <div key={p.id} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5 flex items-center justify-between">
              <div>
                <h3 className="text-[#e8eaf0] font-semibold">{p.title}</h3>
                <div className="flex gap-3 text-xs text-[#8892b0] mt-1">
                  <span className="capitalize">{p.post_type}</span>
                  <span className={p.status === 'approved' ? 'text-[#22c55e]' : p.status === 'pending' ? 'text-[#f59e0b]' : 'text-[#ef4444]'}>{p.status}</span>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div><p className="text-xl font-bold text-[#4f7cff]">{p.applications}</p><p className="text-[#8892b0] text-xs">Apps</p></div>
                <div><p className="text-xl font-bold text-[#22c55e]">{p.shortlisted}</p><p className="text-[#8892b0] text-xs">Shortlisted</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
