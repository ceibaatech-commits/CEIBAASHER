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
        console.log('[AuthCallback] Starting authentication process');
        console.log('[AuthCallback] Current URL:', window.location.href);
        console.log('[AuthCallback] Hash:', window.location.hash);
        
        // Get session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1)); // Remove # from hash
        const sessionId = params.get('session_id');

        console.log('[AuthCallback] Extracted session_id:', sessionId);

        if (!sessionId) {
          console.error('[AuthCallback] No session_id found in URL');
          console.error('[AuthCallback] Full hash:', hash);
          console.error('[AuthCallback] Parsed params:', Array.from(params.entries()));
          
          // Don't redirect immediately - wait a moment in case hash arrives late
          setTimeout(() => {
            window.location.replace('/login?error=no_session_id');
          }, 1000);
          return;
        }

        // Clear the hash immediately to prevent re-processing
        console.log('[AuthCallback] Clearing hash from URL');
        window.history.replaceState(null, '', window.location.pathname);

        // Exchange session_id for user data
        console.log('[AuthCallback] Exchanging session_id for user data');
        const response = await axios.post(`${BACKEND_URL}/api/auth/emergent/session`, {
          session_id: sessionId
        }, {
          withCredentials: true  // Important for setting cookies
        });

        console.log('[AuthCallback] Response received:', response.data.success);

        if (response.data.success) {
          const userData = response.data.user;
          console.log('[AuthCallback] User authenticated:', userData.email);
          
          setUserData(userData);

          // Store session_token in localStorage as fallback
          localStorage.setItem('token', response.data.session_token);
          localStorage.setItem('auth_token', response.data.session_token);

          // Set flag to skip delay in ProtectedRoute
          sessionStorage.setItem('just_authenticated', 'true');

          console.log('[AuthCallback] Redirecting to /victory-lane');
          
          // Use window.location.replace for hard redirect (clears React state)
          window.location.replace('/victory-lane');
        } else {
          throw new Error('Authentication failed - server returned success: false');
        }
      } catch (error) {
        console.error('[AuthCallback] Error during authentication:', error);
        console.error('[AuthCallback] Error details:', error.response?.data);
        
        setTimeout(() => {
          window.location.replace('/login?error=auth_failed');
        }, 2000);
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
