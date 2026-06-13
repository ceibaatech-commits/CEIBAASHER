import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ShieldOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserAvatar from '../UserAvatar';

const BACKEND_URL = window.location.origin;

const formatBlockedAt = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
};

const BlockedAccountsCard = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchBlocked = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/profile/blocked-users`, { withCredentials: true });
      if (res.data?.success) setList(res.data.blocked_users || []);
    } catch {
      // Silent — empty state covers it
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBlocked(); }, [fetchBlocked]);

  const handleUnblock = async (user) => {
    if (busyId) return;
    if (!window.confirm(`Unblock @${user.username || user.name}? They will be able to see your profile and posts again.`)) return;
    setBusyId(user.id);
    try {
      await axios.delete(`${BACKEND_URL}/api/profile/block/${user.id}`, { withCredentials: true });
      setList((prev) => prev.filter((u) => u.id !== user.id));
      toast.success(`Unblocked @${user.username || user.name}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to unblock user');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="shadow-sm" data-testid="blocked-accounts-card">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-100">
            <ShieldOff className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Blocked accounts</CardTitle>
            <CardDescription>
              People you&apos;ve blocked won&apos;t see your profile or posts. You can unblock them anytime.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6" data-testid="blocked-accounts-loading">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-gray-500 py-2" data-testid="blocked-accounts-empty">
            You haven&apos;t blocked anyone.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100" data-testid="blocked-accounts-list">
            {list.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 py-3"
                data-testid={`blocked-row-${u.id}`}
              >
                <UserAvatar profilePicture={u.avatar} name={u.name} size="sm" clickable={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                  {u.username && (
                    <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                  )}
                  {u.blocked_at && (
                    <p className="text-[11px] text-gray-400 mt-0.5">Blocked {formatBlockedAt(u.blocked_at)}</p>
                  )}
                </div>
                <button
                  onClick={() => handleUnblock(u)}
                  disabled={busyId === u.id}
                  data-testid={`unblock-btn-${u.id}`}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busyId === u.id ? 'Unblocking…' : 'Unblock'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default BlockedAccountsCard;
