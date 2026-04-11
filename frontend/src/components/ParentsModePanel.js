import React, { useState, useEffect } from 'react';
import { Shield, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;

export const ParentsModePanel = () => {
  const [parentsModeActive, setParentsModeActive] = useState(false);
  const [parentsModeTimeRemaining, setParentsModeTimeRemaining] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('ceibaa_token');
        if (!token) return;
        const res = await axios.get(`${BACKEND_URL}/api/user/parents-mode/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setParentsModeActive(res.data.parents_mode_active);
          setParentsModeTimeRemaining(res.data.time_remaining_seconds || 0);
        }
      } catch (err) {
        console.error('Error fetching parents mode status:', err);
      }
    };
    fetchStatus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!parentsModeActive || parentsModeTimeRemaining <= 0) return;
    const interval = setInterval(() => {
      setParentsModeTimeRemaining(prev => {
        if (prev <= 1) {
          setParentsModeActive(false);
          toast.success('Parents Mode has expired. 1v1 Battle Mode is now available!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [parentsModeActive, parentsModeTimeRemaining]);

  const enableParentsMode = async () => {
    setEnabling(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('ceibaa_token');
      if (!token) { toast.error('Please log in'); return; }
      const res = await axios.post(`${BACKEND_URL}/api/user/parents-mode/enable`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setParentsModeActive(true);
        setParentsModeTimeRemaining(res.data.time_remaining_seconds);
        setShowConfirm(false);
        toast.success('Parents Mode enabled! 1v1 Battle Mode is now blocked for 12 hours.');
      }
    } catch (err) {
      console.error('Error enabling parents mode:', err);
      toast.error('Failed to enable Parents Mode');
    } finally {
      setEnabling(false);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Enable Parents Mode</h3>
                  <p className="text-gray-500 text-sm">Protect your child from distractions</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Important Notice</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Once enabled, Parents Mode <strong>cannot be manually disabled</strong>. 
                      It will automatically turn off after <strong>12 hours</strong>.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full" />1v1 Battle Mode will be blocked</p>
                <p className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full" />Solo practice & quizzes remain available</p>
                <p className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full" />Auto-disables after 12 hours</p>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">Cancel</button>
              <button onClick={enableParentsMode} disabled={enabling}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
                {enabling ? (<><RefreshCw className="w-4 h-4 animate-spin" />Enabling...</>) : (<><Shield className="w-4 h-4" />Enable for 12 Hours</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 mb-8 border border-white/20" data-testid="parents-mode-panel">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              parentsModeActive ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-white/10 border border-white/20'
            }`}>
              <Shield className={`w-7 h-7 ${parentsModeActive ? 'text-white' : 'text-emerald-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Parents Mode
                {parentsModeActive && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-xs font-medium border border-amber-500/30">ACTIVE</span>
                )}
              </h3>
              <p className="text-emerald-200/70 text-sm">
                {parentsModeActive ? `1v1 Battle Mode blocked \u{2022} Expires in ${formatTime(parentsModeTimeRemaining)}` : 'Block 1v1 Battle Mode for 12 hours'}
              </p>
            </div>
          </div>
          {parentsModeActive ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-emerald-200/60">Time Remaining</p>
                <p className="text-2xl font-bold text-amber-400 font-mono">{formatTime(parentsModeTimeRemaining)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-500/30">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          ) : (
            <button onClick={() => setShowConfirm(true)}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Enable Parents Mode
            </button>
          )}
        </div>
        {parentsModeActive && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-amber-300/80 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>This mode cannot be manually disabled. It will automatically turn off when the timer expires.</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
