import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserData } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        // No token, redirect to login with error
        navigate('/login?error=Authentication failed');
        return;
      }

      try {
        // Store token in localStorage
        localStorage.setItem('auth_token', token);
        
        // Fetch user data using the token
        const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data) {
          const userData = response.data;
          
          // Update AuthContext with user data
          setUserData(userData);
          
          // Redirect to social feed
          navigate('/social-feed', { replace: true });
        } else {
          throw new Error('Failed to fetch user data');
        }
        
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
        
        // Clean up and redirect to login after a moment
        localStorage.removeItem('auth_token');
        setTimeout(() => {
          navigate('/login?error=Authentication failed');
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUserData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div>
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <p className="text-red-600 font-semibold text-lg">{error}</p>
            <p className="text-gray-600 mt-2">Redirecting to login...</p>
          </div>
        ) : (
          <div>
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600"></div>
            <p className="mt-4 text-gray-600 font-semibold">Completing sign in...</p>
            <p className="mt-2 text-gray-500 text-sm">Fetching your profile...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
