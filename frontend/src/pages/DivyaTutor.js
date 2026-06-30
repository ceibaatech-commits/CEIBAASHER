import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Headphones } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import LoginPrompt from '../components/divya/LoginPrompt';
import LiveTutor from '../components/divya/LiveTutor';
import PodcastMode from '../components/divya/PodcastMode';

const DivyaTutor = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const isLoggedIn = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;
  const [activeTab, setActiveTab] = useState('live');
  const [liveSessionActive, setLiveSessionActive] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={isLoggedIn} user={user} onLogout={logout} />
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        {!isLoggedIn ? <LoginPrompt navigate={navigate} /> : (
          <>
            {/* Hide tabs when in live session */}
            {!liveSessionActive && (
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4" data-testid="mode-tabs">
                {[['live', Mic, 'Live Tutor'], ['podcast', Headphones, 'Podcast']].map(([key, Icon, label]) => (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    data-testid={`tab-${key}`}>
                    <Icon className="w-4 h-4 shrink-0" /> {label}
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'live' ? <LiveTutor onSessionChange={setLiveSessionActive} /> : <PodcastMode />}
          </>
        )}
      </div>
    </div>
  );
};

export default DivyaTutor;

