import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  UserPlus, UserCheck, UserMinus, Clock, Loader2,
  Heart, Share2, Link2, ShieldOff, X, Star, StarOff
} from 'lucide-react';

const BACKEND_URL = window.location.origin;

// Follow Popup (not yet following)
const FollowPopup = ({ username, onFollow, onBlock, onClose, anchorRef }) => (
  <div
    className="absolute top-full mt-2 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
    style={{ minWidth: 260 }}
    ref={anchorRef}
  >
    <div className="px-4 py-3 border-b border-gray-100">
      <p className="text-sm font-semibold text-gray-900">Follow @{username}</p>
      <p className="text-xs text-gray-500 mt-0.5">Choose how you want to follow</p>
    </div>

    <button
      onClick={() => onFollow('approved')}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      data-testid="follow-normal-btn"
    >
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <UserPlus className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">Follow</p>
        <p className="text-xs text-gray-500">See their posts in your feed</p>
      </div>
    </button>

    <button
      onClick={() => onFollow('close_friend')}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-teal-50 transition-colors text-left border-t border-gray-100"
      data-testid="follow-close-friend-btn"
    >
      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
        <Heart className="w-4 h-4 text-teal-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">Follow + Close friend</p>
        <p className="text-xs text-gray-500">Priority feed + all notifications</p>
      </div>
    </button>

    <button
      onClick={onBlock}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
      data-testid="block-user-btn-popup"
    >
      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
        <ShieldOff className="w-4 h-4 text-red-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-red-600">Block user</p>
        <p className="text-xs text-gray-500">They won't see your profile or posts</p>
      </div>
    </button>

    <button
      onClick={onClose}
      className="w-full py-2.5 text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-100 transition-colors"
    >
      Cancel
    </button>
  </div>
);

// Following Popup (already following)
const FollowingPopup = ({
  username,
  isCloseFriend,
  onToggleCloseFriend,
  onUnfollow,
  onBlock,
  onShareProfile,
  onClose,
  anchorRef,
}) => (
  <div
    className="absolute top-full mt-2 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
    style={{ minWidth: 260 }}
    ref={anchorRef}
  >
    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-900">@{username}</p>
        <p className="text-xs text-gray-500">You are following this account</p>
      </div>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>

    <button
      onClick={onToggleCloseFriend}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-teal-50 transition-colors text-left"
      data-testid="toggle-close-friend-btn"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCloseFriend ? 'bg-teal-100' : 'bg-gray-100'}`}>
        {isCloseFriend
          ? <StarOff className="w-4 h-4 text-teal-600" />
          : <Star className="w-4 h-4 text-gray-500" />}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">
          {isCloseFriend ? 'Remove from close friends' : 'Add to close friends'}
        </p>
        <p className="text-xs text-gray-500">
          {isCloseFriend ? 'Revert to normal following' : 'Priority feed + full notifications'}
        </p>
      </div>
    </button>

    <button
      onClick={onShareProfile}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
      data-testid="share-profile-btn"
    >
      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
        <Link2 className="w-4 h-4 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">Share profile</p>
        <p className="text-xs text-gray-500">Copy profile link to clipboard</p>
      </div>
    </button>

    <button
      onClick={onUnfollow}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
      data-testid="unfollow-btn"
    >
      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
        <UserMinus className="w-4 h-4 text-red-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-red-600">Unfollow</p>
        <p className="text-xs text-gray-500">Stop seeing their posts</p>
      </div>
    </button>

    <button
      onClick={onBlock}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
      data-testid="block-user-btn"
    >
      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
        <ShieldOff className="w-4 h-4 text-red-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-red-600">Block user</p>
        <p className="text-xs text-gray-500">They won't see your profile or posts</p>
      </div>
    </button>
  </div>
);

// Main FollowButton
const FollowButton = ({
  targetUserId,
  targetUsername,
  initialStatus = null,
  onFollowChange,
  onBlock,
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(initialStatus === null);
  const [popup, setPopup] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (initialStatus !== null) { setLoading(false); return; }
    (async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/profile/follow-status/${targetUserId}`
        );
        if (res.data.success) setStatus(res.data.status);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, [targetUserId, initialStatus]);

  useEffect(() => {
    if (!popup) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setPopup(null);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [popup]);

  const apiFollow = useCallback(async (type) => {
    setLoading(true);
    setPopup(null);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/profile/follow`,
        { target_user_id: targetUserId, follow_type: type }
      );
      if (res.data.success) {
        const newStatus = type === 'close_friend' ? 'close_friend' : res.data.status;
        setStatus(newStatus);
        onFollowChange?.(newStatus);
        if (type === 'close_friend') {
          await axios.post(
            `${BACKEND_URL}/api/profile/close-friend`,
            { target_user_id: targetUserId, action: 'add' }
          ).catch(() => {});
        }
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to follow.';
      alert(msg);
    } finally { setLoading(false); }
  }, [targetUserId, onFollowChange]);

  const apiUnfollow = useCallback(async () => {
    setLoading(true);
    setPopup(null);
    try {
      await axios.delete(
        `${BACKEND_URL}/api/profile/unfollow/${targetUserId}`
      );
      setStatus(null);
      onFollowChange?.(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to unfollow.');
    } finally { setLoading(false); }
  }, [targetUserId, onFollowChange]);

  const apiToggleCloseFriend = useCallback(async () => {
    setPopup(null);
    const isNowClose = status !== 'close_friend';
    const nextStatus = isNowClose ? 'close_friend' : 'approved';
    setStatus(nextStatus);
    onFollowChange?.(nextStatus);
    try {
      await axios.post(
        `${BACKEND_URL}/api/profile/close-friend`,
        { target_user_id: targetUserId, action: isNowClose ? 'add' : 'remove' }
      ).catch(() => {});
    } catch { /* already optimistic */ }
  }, [status, targetUserId, onFollowChange]);

  const apiBlock = useCallback(async () => {
    setPopup(null);
    if (!window.confirm(`Block @${targetUsername}? They won't be able to see your profile.`)) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/profile/block`,
        { target_user_id: targetUserId }
      );
      if (res.data.success) {
        setStatus(null);
        onFollowChange?.(null);
        onBlock?.();
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to block user');
    } finally { setLoading(false); }
  }, [targetUserId, targetUsername, onFollowChange, onBlock]);

  const shareProfile = useCallback(() => {
    setPopup(null);
    const url = `${window.location.origin}/profile/${targetUserId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => alert('Profile link copied!'));
    } else {
      alert(`Profile link: ${url}`);
    }
  }, [targetUserId]);

  const handleClick = () => {
    if (loading) return;
    if (!status || status === null) {
      setPopup(popup === 'follow' ? null : 'follow');
    } else if (status === 'pending') {
      apiUnfollow();
    } else {
      setPopup(popup === 'following' ? null : 'following');
    }
  };

  const btnProps = (() => {
    if (status === 'close_friend') return {
      className: 'inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm bg-teal-50 border border-teal-200 text-teal-700 cursor-pointer active:scale-95 transition-all',
      icon: <Heart className="w-4 h-4" />,
      label: 'Close friend',
    };
    if (status === 'approved') return {
      className: 'inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm bg-blue-50 border border-blue-200 text-blue-700 cursor-pointer active:scale-95 transition-all',
      icon: <UserCheck className="w-4 h-4" />,
      label: 'Following',
    };
    if (status === 'pending') return {
      className: 'inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm bg-amber-50 border border-amber-200 text-amber-700 cursor-pointer active:scale-95 transition-all',
      icon: <Clock className="w-4 h-4" />,
      label: 'Requested',
    };
    return {
      className: 'inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm bg-gray-900 text-white hover:bg-gray-800 cursor-pointer active:scale-95 transition-all',
      icon: <UserPlus className="w-4 h-4" />,
      label: 'Follow',
    };
  })();

  return (
    <div className="relative inline-block" ref={wrapRef}>
      <button
        onClick={handleClick}
        disabled={loading}
        data-testid="follow-button"
        className={`${btnProps.className} ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : btnProps.icon}
        <span>{loading ? '...' : btnProps.label}</span>
      </button>

      {popup === 'follow' && (
        <FollowPopup
          username={targetUsername}
          onFollow={apiFollow}
          onBlock={apiBlock}
          onClose={() => setPopup(null)}
          anchorRef={wrapRef}
        />
      )}

      {popup === 'following' && (
        <FollowingPopup
          username={targetUsername}
          isCloseFriend={status === 'close_friend'}
          onToggleCloseFriend={apiToggleCloseFriend}
          onUnfollow={apiUnfollow}
          onBlock={apiBlock}
          onShareProfile={shareProfile}
          onClose={() => setPopup(null)}
          anchorRef={wrapRef}
        />
      )}
    </div>
  );
};

export default FollowButton;
