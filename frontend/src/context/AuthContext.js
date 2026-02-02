import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const BACKEND_URL = window.location.origin;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const token = response.data.access_token;
        
        // Store both user data and JWT token
        setUser(userData);
        localStorage.setItem('ceibaa_user', JSON.stringify(userData));
        
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('auth_token', token); // Keep for backward compatibility
          console.log('JWT token stored successfully');
        }
        
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

  const logout = () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('ceibaa_user');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    
    // Clear React state
    setUser(null);
    
    console.log('[AuthContext] Logout complete - all tokens cleared');
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
