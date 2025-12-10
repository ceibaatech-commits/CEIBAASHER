import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUserData } = useAuth();

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Get session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1)); // Remove # from hash
        const sessionId = params.get('session_id');

        if (!sessionId) {
          console.error('No session_id found in URL');
          window.location.replace('/login?error=auth_failed');
          return;
        }

        // Clear the hash immediately to prevent re-processing
        window.history.replaceState(null, '', window.location.pathname);

        // Exchange session_id for user data
        const response = await axios.post(`${BACKEND_URL}/api/auth/emergent/session`, {
          session_id: sessionId
        }, {
          withCredentials: true  // Important for setting cookies
        });

        if (response.data.success) {
          const userData = response.data.user;
          setUserData(userData);

          // Store session_token in localStorage as fallback
          localStorage.setItem('token', response.data.session_token);
          localStorage.setItem('auth_token', response.data.session_token);

          // Set flag to skip delay in ProtectedRoute
          sessionStorage.setItem('just_authenticated', 'true');

          // Use window.location.replace for hard redirect (clears React state)
          window.location.replace('/victory-lane');
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        window.location.replace('/login?error=auth_failed');
      }
    };

    processAuth();
  }, []); // Empty dependency array - run only once

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
