import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const Login = () => {
  const navigate = useNavigate();

  const handleSocialLogin = (provider) => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${BACKEND_URL}/api/auth/${provider}`;
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

          {/* Social Login Buttons */}
          <div className="space-y-4">
            {/* X (Twitter) Login */}
            <button
              onClick={() => handleSocialLogin('twitter')}
              className="w-full flex items-center justify-center space-x-3 bg-black hover:bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold transition-all shadow-md hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Login with X</span>
            </button>

            {/* Facebook Login */}
            <button
              onClick={() => handleSocialLogin('facebook')}
              className="w-full flex items-center justify-center space-x-3 bg-[#1877F2] hover:bg-[#166fe5] text-white py-3 px-6 rounded-lg font-semibold transition-all shadow-md hover:shadow-xl"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Continue with Facebook</span>
            </button>
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
