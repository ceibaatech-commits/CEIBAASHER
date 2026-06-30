import React from 'react';
import { LogIn } from 'lucide-react';

const LoginPrompt = ({ navigate }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mt-4">
    <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <LogIn className="w-8 h-8 text-teal-600" />
    </div>
    <h2 className="text-lg font-bold text-gray-800 mb-2">Login Required</h2>
    <p className="text-sm text-gray-500 mb-5">Login to talk with Divya & Sher — your personal AI tutors!</p>
    <div className="flex gap-3 justify-center">
      <button onClick={() => navigate('/login')} className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm" data-testid="login-btn">Login</button>
      <button onClick={() => navigate('/signup')} className="border-2 border-teal-500 text-teal-600 px-6 py-2.5 rounded-xl font-semibold text-sm" data-testid="signup-btn">Sign Up Free</button>
    </div>
  </div>
);

export default LoginPrompt;
