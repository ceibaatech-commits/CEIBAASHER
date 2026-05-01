import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, ShieldCheck, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BACKEND_URL = window.location.origin;

// Auth moved to httpOnly session_token cookie (Stage 3 migration).
// Cookies are auto-sent via axios.defaults.withCredentials = true, so
// no Bearer header is needed here.

const VerifyPhone = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  // If already verified, bounce to destination
  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auth/phone-status`);
        if (!res.data?.needs_verification) {
          const from = location.state?.from || '/victory-lane';
          navigate(from, { replace: true });
          return;
        }
      } catch (err) {
        // No token or error → send back to login
        if (err.response?.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
      } finally {
        setChecking(false);
      }
    };
    run();
  }, [navigate, location.state]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/auth/phone/send-otp`,
        { phone }
      );
      setDeliveryInfo(res.data?.message || 'Code sent.');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/auth/phone/verify-otp`,
        { code }
      );
      const from = location.state?.from || '/victory-lane';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
        <div className="text-gray-500 text-sm">Checking account status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      <Header isLoggedIn={false} user={null} onLogin={() => {}} onLogout={() => {}} />
      <div className="flex items-center justify-center p-4 pt-24" data-testid="verify-phone-page">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl">
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                {step === 'phone' ? <Phone className="w-7 h-7 text-white" /> : <ShieldCheck className="w-7 h-7 text-white" />}
              </div>
              <CardTitle className="text-2xl">
                {step === 'phone' ? 'Verify your contact number' : 'Enter the 6-digit code'}
              </CardTitle>
              <CardDescription className="text-base">
                {step === 'phone'
                  ? 'We need a phone number on file for account security. You\'ll only need to do this once.'
                  : deliveryInfo || 'We\'ve emailed you a verification code.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {step === 'phone' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                      data-testid="verify-phone-input"
                    />
                    <p className="text-xs text-gray-500">Include country code, e.g. <span className="font-mono">+91</span> for India.</p>
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button
                    type="submit"
                    disabled={loading || phone.length < 7}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                    data-testid="verify-phone-send-otp-btn"
                  >
                    {loading ? 'Sending...' : 'Send verification code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification code</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      required
                      className="text-center text-2xl tracking-widest font-mono"
                      data-testid="verify-phone-otp-input"
                    />
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                    data-testid="verify-phone-submit-btn"
                  >
                    {loading ? 'Verifying...' : 'Verify & continue'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                    className="w-full"
                    data-testid="verify-phone-change-btn"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Change phone number
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VerifyPhone;
