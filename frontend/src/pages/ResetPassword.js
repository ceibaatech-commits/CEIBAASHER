import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BACKEND_URL = window.location.origin;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/auth/reset-password`, {
        token,
        new_password: password,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const invalidLink = !token;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      <Header isLoggedIn={false} user={null} onLogin={() => {}} onLogout={() => {}} />
      <div className="flex items-center justify-center p-4 pt-24" data-testid="reset-password-page">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl">
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                {done
                  ? <CheckCircle2 className="w-7 h-7 text-white" />
                  : invalidLink
                    ? <AlertCircle className="w-7 h-7 text-white" />
                    : <Lock className="w-7 h-7 text-white" />}
              </div>
              <CardTitle className="text-2xl">
                {done ? 'Password updated' : invalidLink ? 'Invalid link' : 'Set a new password'}
              </CardTitle>
              <CardDescription className="text-base">
                {done
                  ? 'You can now log in with your new password.'
                  : invalidLink
                    ? 'This reset link is missing a token. Please request a new one.'
                    : 'Choose a strong password that\'s at least 6 characters long.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!done && !invalidLink && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="reset-password-new-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      data-testid="reset-password-confirm-input"
                    />
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                    data-testid="reset-password-submit-btn"
                  >
                    {loading ? 'Updating...' : 'Update password'}
                  </Button>
                </form>
              )}

              <Button
                type="button"
                variant={done ? 'default' : 'ghost'}
                onClick={() => navigate('/login')}
                className={done ? 'w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700' : 'w-full'}
                data-testid="reset-password-login-btn"
              >
                {done ? 'Go to login' : 'Back to login'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
