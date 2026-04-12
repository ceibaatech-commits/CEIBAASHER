import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Briefcase, Clock, CheckCircle2, XCircle, ArrowRight, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  applied: { color: '#4f7cff', bg: '#4f7cff', label: 'Applied' },
  shortlisted: { color: '#22c55e', bg: '#22c55e', label: 'Shortlisted' },
  interview: { color: '#7c3aed', bg: '#7c3aed', label: 'Interview' },
  offer: { color: '#f59e0b', bg: '#f59e0b', label: 'Offer Received' },
  accepted: { color: '#22c55e', bg: '#22c55e', label: 'Accepted' },
  rejected: { color: '#ef4444', bg: '#ef4444', label: 'Rejected' },
};

export default function MyApplications() {
  const { user } = useAuth();
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
    <div className="min-h-screen bg-[#0d0f14]" data-testid="my-applications-page">
      <div className="border-b border-[#252a3d] bg-[#141720]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-[#e8eaf0] text-3xl font-bold">My Applications</h1>
          <p className="text-[#8892b0] mt-2">Track all your job applications and their status</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl h-24 animate-pulse" />)}</div>
        ) : apps.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-[#252a3d] mb-4" />
            <p className="text-[#8892b0] text-lg">No applications yet</p>
            <Link to="/jobs" className="inline-block mt-4 px-5 py-2 bg-[#4f7cff] text-white rounded-lg text-sm">Browse Opportunities</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map(app => {
              const sc = statusConfig[app.status] || statusConfig.applied;
              return (
                <div key={app.id} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5" data-testid={`application-${app.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {app.company_logo && <img src={app.company_logo} alt="" className="w-10 h-10 rounded-lg" />}
                      <div>
                        <h3 className="text-[#e8eaf0] font-semibold">{app.post_title}</h3>
                        <p className="text-[#8892b0] text-sm">{app.company_name}</p>
                        <p className="text-[#8892b0]/60 text-xs mt-1">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${sc.bg}20`, color: sc.color }}>{sc.label}</span>
                  </div>
                  {/* Status Timeline */}
                  <div className="flex items-center gap-2 mt-4 overflow-x-auto">
                    {['applied', 'shortlisted', 'interview', 'offer', 'accepted'].map((step, i, arr) => {
                      const stepOrder = arr.indexOf(app.status);
                      const isActive = i <= stepOrder && app.status !== 'rejected';
                      const isRejected = app.status === 'rejected';
                      return (
                        <React.Fragment key={step}>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap ${isActive ? 'text-[#4f7cff]' : isRejected && i === 0 ? 'text-[#ef4444]' : 'text-[#8892b0]/40'}`}>
                            {isActive ? <CheckCircle2 size={12} /> : isRejected && step === app.status ? <XCircle size={12} className="text-[#ef4444]" /> : <div className="w-3 h-3 rounded-full border border-[#252a3d]" />}
                            <span className="capitalize">{step}</span>
                          </div>
                          {i < arr.length - 1 && <div className={`w-4 h-px ${isActive ? 'bg-[#4f7cff]' : 'bg-[#252a3d]'}`} />}
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
    </div>
  );
}
