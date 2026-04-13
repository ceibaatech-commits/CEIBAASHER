import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const BACKEND_URL = window.location.origin;

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUserData } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double-processing in React 18 StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from hash fragment (Emergent Auth returns #session_id=xxx)
        let sessionId = null;
        const fullUrl = window.location.href;

        const hashIdx = fullUrl.indexOf('#');
        if (hashIdx !== -1) {
          const hashParams = new URLSearchParams(fullUrl.substring(hashIdx + 1));
          sessionId = hashParams.get('session_id');
        }

        // Fallback: check query params
        if (!sessionId) {
          const queryParams = new URLSearchParams(window.location.search);
          sessionId = queryParams.get('session_id');
        }

        if (!sessionId) {
          window.location.replace('/login?error=no_session_id');
          return;
        }

        // Clear URL fragment immediately
        window.history.replaceState(null, '', window.location.pathname);

        const response = await axios.post(`${BACKEND_URL}/api/auth/emergent/session`, {
          session_id: sessionId
        }, { withCredentials: true });

        if (response.data.success) {
          const userData = response.data.user;
          const jwtToken = response.data.access_token;
          const sessionToken = response.data.session_token;

          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('ceibaa_user');

          const tokenToStore = jwtToken || sessionToken;
          if (tokenToStore && tokenToStore !== 'undefined') {
            localStorage.setItem('token', tokenToStore);
            localStorage.setItem('auth_token', tokenToStore);
          }
          localStorage.setItem('ceibaa_user', JSON.stringify(userData));

          setUserData(userData);
          sessionStorage.setItem('just_authenticated', 'true');

          window.location.replace('/victory-lane');
        } else {
          throw new Error('Auth failed');
        }
      } catch (error) {
        console.error('[AuthCallback] Error:', error);
        window.location.replace('/login?error=auth_failed');
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
