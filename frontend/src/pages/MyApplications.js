import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Briefcase, CheckCircle2, XCircle, FileText, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  applied:     { color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',    dot: 'bg-blue-500',    label: 'Applied' },
  shortlisted: { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Shortlisted' },
  interview:   { color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200',  dot: 'bg-violet-500',  label: 'Interview' },
  offer:       { color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-500',   label: 'Offer Received' },
  accepted:    { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Accepted' },
  rejected:    { color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-200',     dot: 'bg-rose-500',    label: 'Rejected' },
};

export default function MyApplications() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchApps();
  }, [user]);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/my-applications`, { headers: { Authorization: `Bearer ${token}` } });
      setApps(data.applications || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="my-applications-page">
      <Header isLoggedIn={isAuthenticated?.()} user={user} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 pt-12 pb-16 px-4">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(59,130,246,0.35), transparent 50%), radial-gradient(circle at 75% 20%, rgba(139,92,246,0.25), transparent 50%)' }} />
        <div className="max-w-4xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-white/90 font-medium">Application Tracker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Applications</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Track all your job applications and their status in one place.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-slate-200" />)}</div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-800 text-lg font-semibold">No applications yet</p>
            <p className="text-slate-500 text-sm mt-1">Start applying to jobs, quizzes, and hackathons</p>
            <Link to="/jobs" className="inline-block mt-5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all">Browse Opportunities</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map(app => {
              const sc = statusConfig[app.status] || statusConfig.applied;
              return (
                <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-200 transition-all" data-testid={`application-${app.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {app.company_logo && <img src={app.company_logo} alt="" className="w-10 h-10 rounded-lg border border-slate-200" />}
                      <div>
                        <h3 className="text-slate-900 font-semibold">{app.post_title}</h3>
                        <p className="text-slate-500 text-sm">{app.company_name}</p>
                        <p className="text-slate-400 text-xs mt-1">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>{sc.label}</span>
                  </div>
                  {/* Status Timeline */}
                  <div className="flex items-center gap-2 mt-4 overflow-x-auto">
                    {['applied', 'shortlisted', 'interview', 'offer', 'accepted'].map((step, i, arr) => {
                      const stepOrder = arr.indexOf(app.status);
                      const isActive = i <= stepOrder && app.status !== 'rejected';
                      const isRejected = app.status === 'rejected';
                      return (
                        <React.Fragment key={step}>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap ${isActive ? 'text-blue-600 font-medium' : isRejected && i === 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                            {isActive ? <CheckCircle2 className="w-3 h-3" /> : isRejected && step === app.status ? <XCircle className="w-3 h-3 text-rose-500" /> : <div className="w-3 h-3 rounded-full border-2 border-slate-200" />}
                            <span className="capitalize">{step}</span>
                          </div>
                          {i < arr.length - 1 && <div className={`w-6 h-px ${isActive ? 'bg-blue-400' : 'bg-slate-200'}`} />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
