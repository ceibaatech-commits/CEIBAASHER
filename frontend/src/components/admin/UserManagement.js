import React from 'react';
import { RefreshCw } from 'lucide-react';

import { useUserManagement } from './user-management/useUserManagement';
import { UserStatsCards } from './user-management/UserStatsCards';
import { UserFiltersBar } from './user-management/UserFiltersBar';
import { UserTable } from './user-management/UserTable';
import { UserPagination } from './user-management/UserPagination';

const formatDateForCSV = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const exportUsersToCSV = (users) => {
  const headers = ['User ID', 'Name', 'Email', 'Registration Date', 'Status'];
  const rows = users.map(u => [u.id, u.name, u.email || 'N/A', formatDateForCSV(u.created_at), u.status]);
  const csv = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ceibaa_users_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
};

const UserManagement = () => {
  const {
    loading, stats, filteredUsers, currentUsers,
    searchQuery, setSearchQuery,
    filterStatus, setFilterStatus,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    currentPage, setCurrentPage, totalPages,
    indexOfFirstUser, indexOfLastUser,
    fetchUsers, toggleBadge,
  } = useUserManagement();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="user-management-loading">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="user-management-root">
      <UserStatsCards stats={stats} />
      <UserFiltersBar
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        sortBy={sortBy} setSortBy={setSortBy}
        sortOrder={sortOrder} setSortOrder={setSortOrder}
        onExport={() => exportUsersToCSV(filteredUsers)}
        onRefresh={fetchUsers}
      />
      <UserTable users={currentUsers} onToggleBadge={toggleBadge}>
        <UserPagination
          currentPage={currentPage} setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          indexOfFirstUser={indexOfFirstUser} indexOfLastUser={indexOfLastUser}
          totalCount={filteredUsers.length}
        />
      </UserTable>
    </div>
  );
};

export default UserManagement;
