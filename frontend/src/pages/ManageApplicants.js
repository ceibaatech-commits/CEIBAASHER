import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Award, GraduationCap, Mail, CheckCircle2, XCircle, MessageSquare, Download } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const airBadge = (air) => {
  if (!air) return { color: '#8892b0', label: 'N/A' };
  if (air <= 1000) return { color: '#f59e0b', label: `AIR ${air}` };
  if (air <= 5000) return { color: '#8892b0', label: `AIR ${air}` };
  return { color: '#4f7cff', label: `AIR ${air}` };
};

export default function ManageApplicants() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchApplicants(); }, [postId]);

  const fetchApplicants = async () => {
    try {
      const token = localStorage.getItem('recruiter_token');
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/applicants/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
      setApplicants(data.applicants || []);
      setPost(data.post);
    } catch (err) {
      if (err.response?.status === 401) navigate('/recruiter');
    } finally { setLoading(false); }
  };

  const updateStatus = async (appId, status) => {
    try {
      const token = localStorage.getItem('recruiter_token');
      await axios.put(`${BACKEND_URL}/api/recruitment/applicant/${appId}/status`, { status }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#4f7cff] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0d0f14]" data-testid="manage-applicants-page">
      <div className="bg-[#141720] border-b border-[#252a3d]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button onClick={() => navigate('/recruiter/dashboard')} className="flex items-center gap-2 text-[#8892b0] hover:text-[#e8eaf0] mb-3 text-sm"><ArrowLeft size={16} /> Back</button>
          <h1 className="text-[#e8eaf0] text-xl font-bold">{post?.title || 'Applicants'}</h1>
          <p className="text-[#8892b0] text-sm mt-1">{applicants.length} applicant{applicants.length !== 1 ? 's' : ''} (sorted by AIR rank)</p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {applicants.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1e2e] border border-[#252a3d] rounded-xl"><User size={48} className="mx-auto text-[#252a3d] mb-4" /><p className="text-[#8892b0]">No applicants yet</p></div>
        ) : (
          <div className="space-y-3">
            {applicants.map(app => {
              const badge = airBadge(app.user_air);
              return (
                <div key={app.id} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5" data-testid={`applicant-${app.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#141720] flex items-center justify-center overflow-hidden">
                        {app.user_avatar ? <img src={app.user_avatar} alt="" className="w-full h-full object-cover" /> : <User size={24} className="text-[#8892b0]" />}
                      </div>
                      <div>
                        <h3 className="text-[#e8eaf0] font-semibold text-lg">{app.user_name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: `${badge.color}20`, color: badge.color }}><Award size={10} className="inline mr-1" />{badge.label}</span>
                          {app.user_exam_type && <span className="px-2 py-0.5 rounded-full text-xs bg-[#7c3aed]/20 text-[#7c3aed]">{app.user_exam_type}</span>}
                          {app.user_college && <span className="px-2 py-0.5 rounded-full text-xs bg-[#141720] text-[#8892b0]"><GraduationCap size={10} className="inline mr-1" />{app.user_college}</span>}
                        </div>
                        {app.user_email && <p className="text-[#8892b0] text-xs mt-2 flex items-center gap-1"><Mail size={12} /> {app.user_email}</p>}
                        <p className="text-[#8892b0]/60 text-xs mt-1">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        app.status === 'shortlisted' ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                        app.status === 'rejected' ? 'bg-[#ef4444]/20 text-[#ef4444]' :
                        app.status === 'offer' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                        'bg-[#4f7cff]/20 text-[#4f7cff]'
                      }`}>{app.status}</span>
                      <div className="flex gap-1 mt-1">
                        {app.status !== 'shortlisted' && <button onClick={() => updateStatus(app.id, 'shortlisted')} className="px-2 py-1 bg-[#22c55e]/10 text-[#22c55e] rounded text-xs hover:bg-[#22c55e]/20" data-testid={`shortlist-${app.id}`}>Shortlist</button>}
                        {app.status !== 'rejected' && <button onClick={() => updateStatus(app.id, 'rejected')} className="px-2 py-1 bg-[#ef4444]/10 text-[#ef4444] rounded text-xs hover:bg-[#ef4444]/20" data-testid={`reject-${app.id}`}>Reject</button>}
                        {app.status === 'shortlisted' && <button onClick={() => updateStatus(app.id, 'offer')} className="px-2 py-1 bg-[#f59e0b]/10 text-[#f59e0b] rounded text-xs hover:bg-[#f59e0b]/20" data-testid={`offer-${app.id}`}>Send Offer</button>}
                      </div>
                    </div>
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
