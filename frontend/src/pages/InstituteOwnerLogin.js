import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const API_URL = window.location.origin;

const InstituteOwnerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({
    institute_id: localStorage.getItem('ceibaa_institute_id') || '',
    institute_name: '',
    owner_name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/institute/panel';

  const submit = async () => {
    setError('');
    if (!form.institute_id || !form.email || !form.password) {
      setError('Institute ID, email and password are required.');
      return;
    }

    if (authMode === 'register' && (!form.owner_name || !form.institute_name)) {
      setError('Institute name and owner name are required for registration.');
      return;
    }

    try {
      setLoading(true);
      let res;
      if (authMode === 'register') {
        res = await axios.post(`${API_URL}/api/institutes/auth/register`, {
          institute_id: form.institute_id,
          institute_name: form.institute_name,
          owner_name: form.owner_name,
          email: form.email,
          password: form.password
        });
      } else {
        res = await axios.post(`${API_URL}/api/institutes/auth/login`, {
          institute_id: form.institute_id,
          email: form.email,
          password: form.password
        });
      }

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
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Institute Owner Login</h1>
        <p className="text-sm text-slate-600 mt-1">Use your institute owner account to access the panel.</p>

        <div className="mt-4 flex gap-2">
          <button onClick={() => setAuthMode('login')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${authMode === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Login</button>
          <button onClick={() => setAuthMode('register')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${authMode === 'register' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Register</button>
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={form.institute_id}
            onChange={(e) => setForm(v => ({ ...v, institute_id: e.target.value }))}
            placeholder="Institute ID"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />

          {authMode === 'register' && (
            <>
              <input
                value={form.institute_name}
                onChange={(e) => setForm(v => ({ ...v, institute_name: e.target.value }))}
                placeholder="Institute Name"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
              <input
                value={form.owner_name}
                onChange={(e) => setForm(v => ({ ...v, owner_name: e.target.value }))}
                placeholder="Owner Name"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </>
          )}

          <input
            value={form.email}
            onChange={(e) => setForm(v => ({ ...v, email: e.target.value }))}
            placeholder="Owner Email"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm(v => ({ ...v, password: e.target.value }))}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />

          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm px-3 py-2">{error}</div>}

          <button
            disabled={loading}
            onClick={submit}
            className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-bold disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (authMode === 'register' ? 'Create Owner Account' : 'Login to Panel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstituteOwnerLogin;
