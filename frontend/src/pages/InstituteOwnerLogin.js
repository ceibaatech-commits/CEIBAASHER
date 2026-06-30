import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const API_URL = window.location.origin;

const InstituteOwnerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('ceibaa_institute_owner_token');
    if (token) {
      navigate('/institute/panel', { replace: true });
    } else if (isAuthenticated() && user) {
      const username = user.username || user.email?.split('@')[0] || 'me';
      navigate(`/profile/${username}`, { replace: true });
    }
  }, [navigate, isAuthenticated, user]);

  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({
    institute_id: localStorage.getItem('ceibaa_institute_id') || '',
    institute_name: '',
    owner_name: '',
    email: '',
    password: ''
  });

  const [isListed, setIsListed] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authMode !== 'login' || !form.institute_id || form.institute_id.length < 3) {
      setIsListed(true);
      return;
    }
    const checkListing = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/institutes/${form.institute_id}/profile`);
        setIsListed(res.data.is_listed !== false);
      } catch (_) {
        setIsListed(true);
      }
    };
    checkListing();
  }, [form.institute_id, authMode]);

  const from = location.state?.from || '/institute/panel';

  const sendOTP = async () => {
    setError('');
    setOtpSentMessage('');
    if (!form.email) {
      setError('Email is required to send verification code.');
      return;
    }
    if (!form.institute_name || !form.owner_name || !form.password) {
      setError('Institute Name, Owner Name, and Password are required.');
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/institutes/auth/register/send-otp`, {
        email: form.email
      });
      setOtpSent(true);
      setOtpSentMessage('A 6-digit verification code has been sent to your email.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setError('');
    if (authMode === 'register') {
      if (!form.email || !form.password || !form.institute_name || !form.owner_name || !otpCode) {
        setError('All registration fields and the verification code are required.');
        return;
      }
      try {
        setLoading(true);
        const res = await axios.post(`${API_URL}/api/institutes/auth/register/verify-otp`, {
          email: form.email,
          code: otpCode,
          institute_name: form.institute_name,
          owner_name: form.owner_name,
          password: form.password
        });
        if (res.data?.token) {
          localStorage.setItem('ceibaa_institute_owner_token', res.data.token);
          localStorage.setItem('ceibaa_institute_id', res.data.institute_id);
          navigate(from.includes('/institute/panel') ? '/institute/panel#owner-auth' : from, { replace: true });
        } else {
          setError('Authentication failed. No token returned.');
        }
      } catch (err) {
        setError(err?.response?.data?.detail || 'Verification failed.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!form.institute_id || !form.email || !form.password) {
        setError('Institute ID, email and password are required.');
        return;
      }
      try {
        setLoading(true);
        const res = await axios.post(`${API_URL}/api/institutes/auth/login`, {
          institute_id: form.institute_id,
          email: form.email,
          password: form.password
        });
        if (res.data?.token) {
          localStorage.setItem('ceibaa_institute_owner_token', res.data.token);
          localStorage.setItem('ceibaa_institute_id', form.institute_id);
          navigate(from.includes('/institute/panel') ? '/institute/panel#owner-auth' : from, { replace: true });
        } else {
          setError('Authentication failed. No token returned.');
        }
      } catch (err) {
        setError(err?.response?.data?.detail || 'Authentication failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" style={{ paddingTop: '72px' }}>
      <Header isLoggedIn={isAuthenticated()} user={user} onLogout={logout} />
      
      <div className="flex-1 py-10 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Institute Owner Access</h1>
          <p className="text-sm text-slate-600 mt-1">Manage study updates, lessons, and tests for your students.</p>

          <div className="mt-4 flex gap-2">
            <button onClick={() => { setAuthMode('login'); setError(''); }} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${authMode === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Login</button>
            <button onClick={() => { setAuthMode('register'); setError(''); }} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${authMode === 'register' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Register</button>
          </div>

          <div className="mt-4 space-y-3">
            {authMode === 'login' && (
              <>
                {!isListed && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs px-3 py-2 font-semibold shadow-xs">
                    We are trying our best to make Teachers here but they are finding you
                  </div>
                )}
                <input
                  value={form.institute_id}
                  onChange={(e) => setForm(v => ({ ...v, institute_id: e.target.value }))}
                  placeholder="Institute ID"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </>
            )}

            {authMode === 'register' && (
              <>
                <input
                  value={form.institute_name}
                  onChange={(e) => setForm(v => ({ ...v, institute_name: e.target.value }))}
                  placeholder="Institute Name (e.g. Apex Academy)"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={form.owner_name}
                  onChange={(e) => setForm(v => ({ ...v, owner_name: e.target.value }))}
                  placeholder="Owner / Teacher Name"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </>
            )}

            <input
              value={form.email}
              onChange={(e) => setForm(v => ({ ...v, email: e.target.value }))}
              placeholder="Owner Email"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm(v => ({ ...v, password: e.target.value }))}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            {authMode === 'register' && otpSent && (
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-Digit Verification Code"
                maxLength={6}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-center tracking-widest"
              />
            )}

            {otpSentMessage && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs px-3 py-2 font-medium">
                {otpSentMessage}
              </div>
            )}

            {error && <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm px-3 py-2">{error}</div>}

            {authMode === 'register' && !otpSent ? (
              <button
                disabled={loading}
                onClick={sendOTP}
                className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-bold disabled:opacity-50 text-sm"
              >
                {loading ? 'Please wait...' : 'Send Verification OTP'}
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={submit}
                className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-bold disabled:opacity-50 text-sm"
              >
                {loading ? 'Please wait...' : (authMode === 'register' ? 'Verify OTP & Register' : 'Login to Panel')}
              </button>
            )}

            {authMode === 'register' && otpSent && (
              <button
                disabled={loading}
                onClick={sendOTP}
                className="w-full text-center text-xs font-semibold text-cyan-600 hover:text-cyan-700 block transition-colors mt-2"
              >
                Resend Code
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default InstituteOwnerLogin;