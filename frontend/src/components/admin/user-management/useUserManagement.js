import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const BACKEND_URL = window.location.origin;

const BADGE_ENDPOINTS = {
  isTeacher: 'teacher-status',
  isProfessor: 'professor-status',
  isOfficial: 'official-status',
  isInstitute: 'institute-status',
};

const mutualExclusion = (badgeKey, nextValue) => {
  // Teacher and Professor are mutually exclusive. Turning one on turns the other off.
  if (nextValue && badgeKey === 'isTeacher') return { isProfessor: false };
  if (nextValue && badgeKey === 'isProfessor') return { isTeacher: false };
  return {};
};

export function useUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('registration_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 100;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/users`);
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const stats = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return {
      total: users.length,
      online: users.filter(u => u.status === 'online').length,
      offline: users.filter(u => u.status === 'offline').length,
      newToday: users.filter(u => u.created_at && new Date(u.created_at) >= startOfToday).length,
    };
  }, [users]);

  const toggleBadge = useCallback(async (userId, badgeKey, currentValue) => {
    const endpoint = BADGE_ENDPOINTS[badgeKey];
    if (!endpoint) return;
    const nextValue = !currentValue;
    try {
      const res = await axios.put(
        `${BACKEND_URL}/api/admin/users/${userId}/${endpoint}`,
        { [badgeKey]: nextValue }
      );
      if (!res.data.success) {
        alert(`Failed to update ${badgeKey}`);
        return;
      }
      const extra = mutualExclusion(badgeKey, nextValue);
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, [badgeKey]: nextValue, ...extra } : u
      ));
    } catch (err) {
      console.error(`Error updating ${badgeKey}:`, err);
      alert(`Failed to update ${badgeKey}`);
    }
  }, []);

  const toggleDisableUser = useCallback(async (userId, isCurrentlyDisabled) => {
    const nextStatus = isCurrentlyDisabled ? 'active' : 'banned';
    const verb = isCurrentlyDisabled ? 'enable' : 'disable';
    if (!window.confirm(`Are you sure you want to ${verb} this user?`)) return;
    try {
      const res = await axios.put(
        `${BACKEND_URL}/api/admin/users/${userId}/status`,
        null,
        { params: { status: nextStatus } }
      );
      if (!res.data.success) {
        alert(`Failed to ${verb} user`);
        return;
      }
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, account_status: nextStatus } : u
      ));
    } catch (err) {
      console.error(`Error ${verb}ing user:`, err);
      alert(`Failed to ${verb} user`);
    }
  }, []);

  const deleteUser = useCallback(async (userId, userName) => {
    if (!window.confirm(`Permanently delete user "${userName}"?\n\nThis will soft-delete their account. Proceed?`)) return;
    try {
      const res = await axios.delete(`${BACKEND_URL}/api/admin/users/${userId}`);
      if (!res.data.success) {
        alert('Failed to delete user');
        return;
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'name') {
        aVal = a.name?.toLowerCase() || ''; bVal = b.name?.toLowerCase() || '';
      } else if (sortBy === 'email') {
        aVal = a.email?.toLowerCase() || ''; bVal = b.email?.toLowerCase() || '';
      } else {
        aVal = new Date(a.created_at || 0); bVal = new Date(b.created_at || 0);
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [users, searchQuery, filterStatus, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  return {
    // data
    users, loading, stats,
    filteredUsers, currentUsers,
    // filters / sort / pagination
    searchQuery, setSearchQuery,
    filterStatus, setFilterStatus,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    currentPage, setCurrentPage, totalPages, usersPerPage,
    indexOfFirstUser, indexOfLastUser,
    // actions
    fetchUsers, toggleBadge, toggleDisableUser, deleteUser,
  };
}
