import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, Eye, EyeOff, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function RecruiterLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/recruitment/recruiter/login`, { email, password });
      localStorage.setItem('recruiter_token', data.access_token);
      localStorage.setItem('recruiter_data', JSON.stringify(data.recruiter));
      navigate('/recruiter/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center px-4" data-testid="recruiter-login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-white font-bold text-3xl">cei</span>
            <span className="text-[#4f7cff] font-bold text-3xl">baa</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Briefcase size={18} className="text-[#4f7cff]" />
            <span className="text-[#8892b0] text-lg">Recruiter Portal</span>
          </div>
        </div>

        <div className="bg-[#1a1e2e] border border-[#252a3d] rounded-2xl p-8">
          <h2 className="text-[#e8eaf0] text-xl font-bold text-center mb-6">Recruiter Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[#8892b0] text-xs uppercase tracking-wider block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required data-testid="recruiter-email-input"
                className="w-full px-4 py-3 bg-[#141720] border border-[#252a3d] rounded-xl text-[#e8eaf0] placeholder-[#8892b0]/50 focus:outline-none focus:border-[#4f7cff] transition-colors"
                placeholder="hr@company.com" />
            </div>
            <div>
              <label className="text-[#8892b0] text-xs uppercase tracking-wider block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required data-testid="recruiter-password-input"
                  className="w-full px-4 py-3 bg-[#141720] border border-[#252a3d] rounded-xl text-[#e8eaf0] placeholder-[#8892b0]/50 focus:outline-none focus:border-[#4f7cff] transition-colors pr-10"
                  placeholder="Enter password" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892b0]">{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            {error && <div className="flex items-center gap-2 text-[#ef4444] text-sm bg-[#ef4444]/10 p-3 rounded-lg" data-testid="login-error"><AlertCircle size={16} /> {error}</div>}
            <button type="submit" disabled={loading} data-testid="recruiter-login-btn"
              className="w-full py-3 bg-[#4f7cff] text-white rounded-xl font-medium hover:bg-[#3d6ae8] transition-colors disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-[#8892b0] text-xs text-center mt-6">Recruiter accounts are created by CEIBAA Admin. Contact admin@ceibaa.in for access.</p>
        </div>
      </div>
    </div>
  );
}
