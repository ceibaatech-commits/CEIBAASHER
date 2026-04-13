import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = window.location.origin || 'http://localhost:8001';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUserData } = useAuth();

  useEffect(() => {
    const processAuth = async () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        console.log('[AuthCallback] session_id:', sessionId);

        if (!sessionId) {
          setTimeout(() => window.location.replace('/login?error=no_session_id'), 1000);
          return;
        }

        window.history.replaceState(null, '', window.location.pathname);

        const response = await axios.post(`${BACKEND_URL}/api/auth/emergent/session`, {
          session_id: sessionId
        }, { withCredentials: true });

        console.log('[AuthCallback] Full response:', JSON.stringify(response.data));

        if (response.data.success) {
          const userData = response.data.user;
          const jwtToken = response.data.access_token;
          const sessionToken = response.data.session_token;

          console.log('[AuthCallback] userData:', JSON.stringify(userData));
          console.log('[AuthCallback] jwtToken:', jwtToken ? 'present' : 'missing');

          // Write to localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('ceibaa_user');

          // Prefer JWT token (works with all API routes), fall back to session token
          const tokenToStore = jwtToken || sessionToken;
          if (tokenToStore && tokenToStore !== 'undefined') {
            localStorage.setItem('token', tokenToStore);
            localStorage.setItem('auth_token', tokenToStore);
          }
          localStorage.setItem('ceibaa_user', JSON.stringify(userData));

          setUserData(userData);
          sessionStorage.setItem('just_authenticated', 'true');

          setTimeout(() => {
            window.location.replace('/victory-lane');
          }, 300);

        } else {
          throw new Error('Auth failed');
        }
      } catch (error) {
        console.error('[AuthCallback] Error:', error);
        console.error('[AuthCallback] Response data:', error.response?.data);
        setTimeout(() => window.location.replace('/login?error=auth_failed'), 2000);
      }
    };

    processAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
        <p className="mt-6 text-xl font-semibold text-gray-800">Completing authentication...</p>
        <p className="mt-2 text-sm text-gray-500">Please wait while we sign you in</p>
      </div>
    </div>
  );
};

export default AuthCallback;