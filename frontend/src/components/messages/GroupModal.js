import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Users, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import UserAvatar from '../UserAvatar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Dark-themed modal used by the Messages page for:
 *  - mode="create": name a group + pick members from your followers/following
 *  - mode="add":    add more members to an existing group (any member can
 *                   invite people from their own connections)
 */
const GroupModal = ({ mode, conversationId, existingMemberIds, onClose, onCreated, onAdded }) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/messages/connections`)
      .then(res => { if (res.data?.success) setConnections(res.data.connections || []); })
      .catch(() => toast.error('Could not load your connections'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const candidates = connections.filter(c => {
    if (mode === 'add' && existingMemberIds?.has(c.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.username || '').toLowerCase().includes(q);
  });

  const submit = async () => {
    if (submitting) return;
    if (mode === 'create' && !name.trim()) { toast.error('Give your group a name'); return; }
    if (selected.size === 0) { toast.error('Pick at least one person'); return; }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const res = await axios.post(`${BACKEND_URL}/api/messages/groups`, {
          name: name.trim(),
          member_ids: [...selected],
        });
        if (res.data?.success) {
          toast.success(`Group "${name.trim()}" created`);
          onCreated?.(res.data.conversation);
        }
      } else {
        for (const uid of selected) {
          await axios.post(`${BACKEND_URL}/api/messages/groups/${conversationId}/members`, { user_id: uid });
        }
        toast.success(`Added ${selected.size} member${selected.size === 1 ? '' : 's'}`);
        onAdded?.();
      }
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid="group-modal">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="text-base font-bold text-white">
              {mode === 'create' ? 'New group' : 'Add members'}
            </h2>
          </div>
          <button onClick={onClose} data-testid="group-modal-close" className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 flex-1 overflow-hidden flex flex-col">
          {mode === 'create' && (
            <input
              data-testid="group-name-input"
              type="text"
              maxLength={50}
              placeholder="Group name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          )}
          <input
            data-testid="group-member-search"
            type="text"
            placeholder="Search your followers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />

          {/* Member picker */}
          <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1" data-testid="group-member-list">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-cyan-500 animate-spin" /></div>
            ) : candidates.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-10">
                {connections.length === 0
                  ? 'No connections yet — follow someone first'
                  : 'No one matches your search'}
              </p>
            ) : (
              candidates.map(c => {
                const isSel = selected.has(c.id);
                return (
                  <button
                    key={c.id}
                    data-testid={`group-member-option-${c.id}`}
                    onClick={() => toggle(c.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      isSel ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-gray-900 border border-transparent'
                    }`}
                  >
                    <UserAvatar profilePicture={c.avatar} name={c.name} size="sm" clickable={false} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">@{c.username}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                      isSel ? 'bg-cyan-500 border-cyan-500' : 'border-gray-700'
                    }`}>
                      {isSel && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800/60 flex items-center justify-between">
          <span className="text-xs text-gray-500" data-testid="group-selected-count">
            {selected.size} selected
          </span>
          <button
            data-testid="group-modal-submit"
            onClick={submit}
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? 'Working…' : mode === 'create' ? 'Create group' : 'Add members'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
