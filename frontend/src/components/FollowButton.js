import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  UserPlus, UserCheck, UserMinus, Clock, Loader2,
  Heart, Link2, ShieldOff, X, Star, StarOff
} from 'lucide-react';

const BACKEND_URL = window.location.origin;

// Follow Bottom Sheet (not yet following) — Threads/Meta-style
const FollowSheet = ({ username, onFollow, onClose }) => {
  // Lock body scroll while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      data-testid="follow-bottom-sheet"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-200"
        data-testid="follow-sheet-backdrop"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl shadow-2xl pb-[max(env(safe-area-inset-bottom),1rem)] animate-in slide-in-from-bottom duration-300"
      >
        {/* Grabber */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-gray-100">
          <p className="text-base font-semibold text-gray-900">Follow @{username}</p>
          <p className="text-xs text-gray-500 mt-0.5">Choose how you want to follow</p>
        </div>

        {/* Follow */}
        <button
          onClick={() => onFollow('approved')}
          className="w-full flex items-center gap-3 px-5 py-4 active:bg-gray-50 transition-colors text-left"
          data-testid="follow-normal-btn"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Follow</p>
            <p className="text-xs text-gray-500">See their posts in your feed</p>
          </div>
        </button>

        {/* Follow + Close friend */}
        <button
          onClick={() => onFollow('close_friend')}
          className="w-full flex items-center gap-3 px-5 py-4 active:bg-teal-50 transition-colors text-left border-t border-gray-50"
          data-testid="follow-close-friend-btn"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Follow + Close friends</p>
            <p className="text-xs text-gray-500">Priority feed + all notifications</p>
          </div>
        </button>

        {/* Cancel */}
        <div className="px-5 pt-3">
          <button
            onClick={onClose}
            data-testid="follow-sheet-cancel"
            className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Following Bottom Sheet (already following) — Threads/Meta-style
const FollowingSheet = ({
  username,
  isCloseFriend,
  onToggleCloseFriend,
  onUnfollow,
  onBlock,
  onShareProfile,
  onClose,
}) => {
  // Lock body scroll while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      data-testid="following-bottom-sheet"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-200"
        data-testid="following-sheet-backdrop"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl shadow-2xl pb-[max(env(safe-area-inset-bottom),1rem)] animate-in slide-in-from-bottom duration-300"
      >
        {/* Grabber */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-gray-100 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-base font-semibold text-gray-900 truncate">@{username}</p>
            <p className="text-xs text-gray-500 mt-0.5">You are following this account</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Toggle Close Friend */}
        <button
          onClick={onToggleCloseFriend}
          className="w-full flex items-center gap-3 px-5 py-4 active:bg-teal-50 transition-colors text-left"
          data-testid="toggle-close-friend-btn"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCloseFriend ? 'bg-teal-100' : 'bg-gray-100'}`}>
            {isCloseFriend
              ? <StarOff className="w-5 h-5 text-teal-600" />
              : <Star className="w-5 h-5 text-gray-500" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {isCloseFriend ? 'Remove from close friends' : 'Add to close friends'}
            </p>
            <p className="text-xs text-gray-500">
              {isCloseFriend ? 'Revert to normal following' : 'Priority feed + full notifications'}
            </p>
          </div>
        </button>

        {/* Share profile */}
        <button
          onClick={onShareProfile}
          className="w-full flex items-center gap-3 px-5 py-4 active:bg-gray-50 transition-colors text-left border-t border-gray-50"
          data-testid="share-profile-btn"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Share profile</p>
            <p className="text-xs text-gray-500">Copy profile link to clipboard</p>
          </div>
        </button>

        {/* Unfollow */}
        <button
          onClick={onUnfollow}
          className="w-full flex items-center gap-3 px-5 py-4 active:bg-red-50 transition-colors text-left border-t border-gray-50"
          data-testid="unfollow-btn"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <UserMinus className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-600">Unfollow</p>
            <p className="text-xs text-gray-500">Stop seeing their posts</p>
          </div>
        </button>

        {/* Block */}
        <button
          onClick={onBlock}
          className="w-full flex items-center gap-3 px-5 py-4 active:bg-red-50 transition-colors text-left border-t border-gray-50"
          data-testid="block-user-btn"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <ShieldOff className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-600">Block user</p>
            <p className="text-xs text-gray-500">They won&apos;t see your profile or posts</p>
          </div>
        </button>

        {/* Cancel */}
        <div className="px-5 pt-3">
          <button
            onClick={onClose}
            data-testid="following-sheet-cancel"
            className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

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
      } else if (res.data.message) {
        toast.error(res.data.message);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to follow.';
      toast.error(msg);
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
      toast.success('Unfollowed');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to unfollow.');
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
        toast.success(`Blocked @${targetUsername}`);
        onBlock?.();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to block user');
    } finally { setLoading(false); }
  }, [targetUserId, targetUsername, onFollowChange, onBlock]);

  const shareProfile = useCallback(async () => {
    setPopup(null);
    const url = `${window.location.origin}/profile/${targetUsername || targetUserId}`;
    const title = targetUsername ? `@${targetUsername}` : 'Profile';

    // Prefer the native Web Share API on mobile / supported browsers
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        // User cancelled or share failed — fall through to clipboard fallback
        if (err && err.name === 'AbortError') return;
      }
    }

    // Clipboard fallback for desktop / unsupported browsers
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Legacy fallback for very old browsers
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast.success('Profile link copied!');
    } catch {
      toast.error('Could not copy link');
    }
  }, [targetUsername, targetUserId]);

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
    const base = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm w-full sm:w-auto cursor-pointer active:scale-95 transition-all';
    if (status === 'close_friend') return {
      className: `${base} bg-teal-50 border border-teal-200 text-teal-700`,
      icon: <Heart className="w-4 h-4" />,
      label: 'Close friend',
    };
    if (status === 'approved') return {
      className: `${base} bg-blue-50 border border-blue-200 text-blue-700`,
      icon: <UserCheck className="w-4 h-4" />,
      label: 'Following',
    };
    if (status === 'pending') return {
      className: `${base} bg-amber-50 border border-amber-200 text-amber-700`,
      icon: <Clock className="w-4 h-4" />,
      label: 'Requested',
    };
    return {
      className: `${base} bg-gray-900 text-white hover:bg-gray-800`,
      icon: <UserPlus className="w-4 h-4" />,
      label: 'Follow',
    };
  })();

  return (
    <div className="w-full sm:inline-block" ref={wrapRef}>
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
        <FollowSheet
          username={targetUsername}
          onFollow={apiFollow}
          onClose={() => setPopup(null)}
        />
      )}

      {popup === 'following' && (
        <FollowingSheet
          username={targetUsername}
          isCloseFriend={status === 'close_friend'}
          onToggleCloseFriend={apiToggleCloseFriend}
          onUnfollow={apiUnfollow}
          onBlock={apiBlock}
          onShareProfile={shareProfile}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
};

export default FollowButton;
