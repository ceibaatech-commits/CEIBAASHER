import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const AuthContext = createContext(null);

const BACKEND_URL = window.location.origin;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutRef = useRef(null);

  // Global Axios interceptor for expired tokens.
  // Only triggers a full logout when the request that 401'd was for the
  // session-validation endpoint (/api/auth/me). Other 401s (e.g. a single
  // legacy Bearer-only endpoint that hasn't been migrated to cookie-auth)
  // must NOT log the user out — they should fail in-place and surface their
  // own error UI. This narrowing is what unblocks Google OAuth users from
  // being kicked out the moment any background request returns 401.
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const url = error.config?.url || '';
          const isAuthMe = url.includes('/api/auth/me');
          const detail = error.response?.data?.detail || '';
          const looksExpired = detail.includes('expired');

          if (isAuthMe && looksExpired) {
            localStorage.removeItem('ceibaa_user');
            setUser(null);
            toast.error('Session expired. Please login again.');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('ceibaa_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('ceibaa_user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      // Try both endpoints - regular login and demo-login
      let response;
      try {
        response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
          email,
          password
        });
      } catch (err) {
        // If regular login fails, try demo-login with username/password
        response = await axios.post(`${BACKEND_URL}/api/auth/demo-login`, {
          username: email,
          password
        });
      }

      // Handle successful response
      if (response.data.access_token || response.data.success) {
        const userData = response.data.user;

        // Store user data (non-sensitive, for UX state persistence).
        // The auth token is delivered via httpOnly cookie by the backend
        // (_set_auth_cookie), so we no longer mirror it to localStorage.
        // This closes the XSS attack surface flagged in code review.
        setUser(userData);
        localStorage.setItem('ceibaa_user', JSON.stringify(userData));

        return { success: true };
      } else {
        return { success: false, message: response.data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.detail || error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      // Hit backend so the httpOnly session_token cookie is cleared server-side.
      // We wrap in try/finally so client state clears even if the network fails.
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.warn('[AuthContext] Backend logout failed (clearing client state anyway):', e?.message);
    } finally {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('ceibaa_user');
      setUser(null);
      console.log('[AuthContext] Logout complete');
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('ceibaa_user', JSON.stringify(updatedUser));
  };

  const setUserData = (userData) => {
    setUser(userData);
    localStorage.setItem('ceibaa_user', JSON.stringify(userData));
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    setUserData,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
