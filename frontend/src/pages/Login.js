import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin, setUserData } = useAuth();
  const [demoUsername, setDemoUsername] = useState('');
  const [demoPassword, setDemoPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSocialLogin = (provider) => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${BACKEND_URL}/api/auth/${provider}`;
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

      // Store token in localStorage
      localStorage.setItem('auth_token', response.data.access_token);
      const userData = response.data.user;
      
      // Update AuthContext with user data
      localStorage.setItem('ceibaa_user', JSON.stringify(userData));
      updateUser(userData);

      // Navigate back to where user came from, or to social feed by default
      const from = location.state?.from || '/social-feed';
      navigate(from, { replace: true });
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mx-auto mb-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_prepchamp/artifacts/531vq7tt_IMG_1159-removebg-preview.png" 
                alt="Ceibaa Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Ceibaa</h1>
            <p className="text-gray-600">Sign in to join the battle arena</p>
          </div>

          {/* Demo Login Section */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">🎓 Demo Login</h3>
            <p className="text-sm text-gray-600 text-center mb-4">Use demo accounts to explore the platform</p>
            
            <form onSubmit={handleDemoLogin} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={demoUsername}
                  onChange={(e) => setDemoUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={demoPassword}
                  onChange={(e) => setDemoPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-all shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>{loading ? 'Logging in...' : 'Login'}</span>
              </button>
            </form>
            
            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-200">
              <p className="font-bold text-gray-700 mb-2 text-center">📝 Demo Accounts</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                  <span className="font-semibold text-gray-700">Demo Student 1:</span>
                  <span className="font-mono text-blue-600">demo1 / demo1</span>
                </div>
                <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                  <span className="font-semibold text-gray-700">Demo Student 2:</span>
                  <span className="font-mono text-green-600">demo2 / demo2</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Click username/password to copy
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Guest Mode */}
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-all"
          >
            Continue as Guest
          </button>

          {/* Info */}
          <p className="text-center text-xs text-gray-500 mt-6">
            By continuing, you agree to Ceibaa's Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-3">Why sign in?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">✓</span>
              <span>Track your progress and scores</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">✓</span>
              <span>Compete on global leaderboards</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">✓</span>
              <span>Send gifts and reactions to players</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">✓</span>
              <span>Create and host custom battle rooms</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
