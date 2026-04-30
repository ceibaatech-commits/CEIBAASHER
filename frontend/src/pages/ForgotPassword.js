import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BACKEND_URL = window.location.origin;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      <Header isLoggedIn={false} user={null} onLogin={() => {}} onLogout={() => {}} />
      <div className="flex items-center justify-center p-4 pt-24" data-testid="forgot-password-page">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl">
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                {sent ? <CheckCircle2 className="w-7 h-7 text-white" /> : <Mail className="w-7 h-7 text-white" />}
              </div>
              <CardTitle className="text-2xl">
                {sent ? 'Check your email' : 'Forgot password?'}
              </CardTitle>
              <CardDescription className="text-base">
                {sent
                  ? `We've sent reset instructions to ${email}. The link expires in 1 hour.`
                  : 'Enter the email associated with your account and we\'ll send you a reset link.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!sent && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      data-testid="forgot-password-email-input"
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                    data-testid="forgot-password-submit-btn"
                  >
                    {loading ? 'Sending...' : 'Send reset link'}
                  </Button>
                </form>
              )}

              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/login')}
                className="w-full"
                data-testid="forgot-password-back-btn"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
