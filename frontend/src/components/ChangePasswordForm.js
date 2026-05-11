import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BACKEND_URL = window.location.origin;

const authHeader = () => ({});

/**
 * Shared "Change Password" form used by the dedicated Settings page AND the
 * header-dropdown modal. Emits onSuccess so the parent can close/redirect.
 */
const ChangePasswordForm = ({ onSuccess }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [revokedCount, setRevokedCount] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (next.length < 6) return setError('New password must be at least 6 characters');
    if (next === current) return setError('New password must differ from the current one');
    if (next !== confirm) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/auth/change-password`,
        { current_password: current, new_password: next },
        { headers: authHeader() }
      );
      setRevokedCount(res.data?.other_sessions_revoked || 0);
      setDone(true);
      if (onSuccess) setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-6" data-testid="change-password-success">
        <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Password updated</h3>
        <p className="text-sm text-gray-500">
          For your security, we've logged out {revokedCount} other {revokedCount === 1 ? 'session' : 'sessions'}.
          A confirmation email has been sent.
        </p>
      </div>
    );
  }

  const toggleShow = () => setShow(s => !s);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="change-password-form">
      <div className="space-y-2">
        <Label htmlFor="cp-current">Current password</Label>
        <div className="relative">
          <Input
            id="cp-current"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            data-testid="change-password-current-input"
          />
          <button type="button" onClick={toggleShow} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cp-new">New password</Label>
        <Input
          id="cp-new"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={6}
          data-testid="change-password-new-input"
        />
        <p className="text-xs text-gray-500">At least 6 characters. Use a mix of letters, numbers, and symbols.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cp-confirm">Confirm new password</Label>
        <Input
          id="cp-confirm"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          data-testid="change-password-confirm-input"
        />
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
        data-testid="change-password-submit-btn"
      >
        <Lock className="w-4 h-4 mr-2" />
        {loading ? 'Updating...' : 'Change password'}
      </Button>
    </form>
  );
};

export default ChangePasswordForm;
