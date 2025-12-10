import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserData } = useAuth();
  const [demoUsername, setDemoUsername] = useState('');
  const [demoPassword, setDemoPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    // Use Emergent-managed Google auth
    // CRITICAL: Use window.location.origin dynamically
    const redirectUrl = `${window.location.origin}/auth-callback`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSocialLogin = (provider) => {
    if (provider === 'google') {
      handleGoogleLogin();
    } else {
      window.location.href = `${BACKEND_URL}/api/auth/${provider}`;
    }
  };

  const handleDemoLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/demo-login`, {
        username: demoUsername,
        password: demoPassword
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('auth_token', response.data.access_token);
      const userData = response.data.user;
      setUserData(userData);

      const from = location.state?.from || '/victory-lane';
      navigate(from, { replace: true });
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    navigate('/victory-lane', { state: { guestMode: true } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src="/ceibaa-logo.png" 
                alt="Ceibaa Logo" 
                className="h-24 w-auto object-contain"
              />
            </div>
            <div>
              <CardTitle className="text-3xl">Welcome Back</CardTitle>
              <CardDescription className="text-base">Login to continue your learning journey</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleDemoLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={demoUsername}
                  onChange={(e) => setDemoUsername(e.target.value)}
                  placeholder="Enter username (e.g., demo1)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={demoPassword}
                  onChange={(e) => setDemoPassword(e.target.value)}
                  placeholder="Enter password"
                  required
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
              >
                <LogIn className="w-4 h-4 mr-2" />
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                Or continue with
              </span>
            </div>

            <Button
              variant="outline"
              onClick={() => handleGoogleLogin()}
              className="w-full"
            >
              <img src="/google-icon.svg" alt="Google" className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>

            <Button
              variant="ghost"
              onClick={handleGuestMode}
              className="w-full"
            >
              Continue as Guest
            </Button>
          </CardContent>

          <CardFooter className="flex-col space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Don't have an account?{' '}
              <Button
                variant="link"
                onClick={() => navigate('/signup')}
                className="p-0 h-auto font-semibold text-cyan-600"
              >
                Sign Up
              </Button>
            </p>
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to Ceibaa's Terms of Service and Privacy Policy
            </p>
          </CardFooter>
        </Card>

        <Card className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg">Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="font-semibold">demo1 / demo1</div>
              <div className="text-gray-600">JEE aspirant</div>
              <div className="font-semibold">demo2 / demo2</div>
              <div className="text-gray-600">NEET aspirant</div>
              <div className="font-semibold">demo3 / demo3</div>
              <div className="text-gray-600">SSC aspirant</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;