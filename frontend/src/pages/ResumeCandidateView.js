import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ResumeView from '@/components/resume/ResumeView';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Recruiter page: view a candidate's resume.
 * Access gated at backend — only accessible if candidate applied to a post
 * owned by the logged-in recruiter.
 */
export default function ResumeCandidateView() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/recruitment/resume/user/${userId}`);
        setResume(data);
      } catch (e) {
        const detail = e.response?.data?.detail || 'Failed to load resume';
        setError(detail);
        toast.error(detail);
        if (e.response?.status === 401) navigate('/recruiter');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="resume-candidate-view-page">
      <div className="max-w-4xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-6" data-testid="back-btn">
          <ArrowLeft size={16} /> Back
        </button>
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : error ? (
          <div className="bg-white border border-rose-200 text-rose-600 p-6 rounded-2xl text-center" data-testid="resume-error">{error}</div>
        ) : (
          <ResumeView resume={resume} />
        )}
      </div>
    </div>
  );
}
