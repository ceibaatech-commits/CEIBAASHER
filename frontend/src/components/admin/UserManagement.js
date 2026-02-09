import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Filter, Download, UserPlus, MoreVertical, 
  CheckCircle, XCircle, Edit, Trash2, Eye, Mail,
  Calendar, Clock, TrendingUp, Users as UsersIcon,
  Shield, Ban, RefreshCw, Award
} from 'lucide-react';

const BACKEND_URL = window.location.origin;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, online, offline
  const [sortBy, setSortBy] = useState('registration_date'); // registration_date, name, email
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(100); // 100 users per page
  const [goToPage, setGoToPage] = useState(''); // For direct page navigation
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    newToday: 0
  });

  // Fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/users`);
      
      if (response.data.success) {
        const usersData = response.data.users;
        setUsers(usersData);
        
        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const stats = {
          total: usersData.length,
          online: usersData.filter(u => u.status === 'online').length,
          offline: usersData.filter(u => u.status === 'offline').length,
          newToday: usersData.filter(u => {
            const regDate = new Date(u.created_at);
            return regDate >= today;
          }).length
        };
        
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle teacher status
  const toggleTeacherStatus = async (userId, currentStatus) => {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/users/${userId}/teacher-status`,
        { isTeacher: !currentStatus }
      );

      if (response.data.success) {
        // Update local state with mutual exclusivity
        // If turning Teacher ON, turn Professor OFF
        setUsers(users.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                isTeacher: !currentStatus,
                isProfessor: !currentStatus ? false : user.isProfessor
              }
            : user
        ));
        alert(`Teacher status updated successfully!${!currentStatus ? ' Professor status disabled (mutual exclusivity).' : ''}`);
      }
    } catch (error) {
      console.error('Error updating teacher status:', error);
      alert('Failed to update teacher status');
    }
  };

  // Toggle official status
  const toggleOfficialStatus = async (userId, currentStatus) => {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/users/${userId}/official-status`,
        { isOfficial: !currentStatus }
      );

      if (response.data.success) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isOfficial: !currentStatus }
            : user
        ));
        alert(`Official status updated successfully!`);
      }
    } catch (error) {
      console.error('Error updating official status:', error);
      alert('Failed to update official status');
    }
  };

  // Toggle institute status
  const toggleInstituteStatus = async (userId, currentStatus) => {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/users/${userId}/institute-status`,
        { isInstitute: !currentStatus }
      );

      if (response.data.success) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isInstitute: !currentStatus }
            : user
        ));
        alert(`Institute status updated successfully!`);
      }
    } catch (error) {
      console.error('Error updating institute status:', error);
      alert('Failed to update institute status');
    }
  };

  // Toggle professor status
  const toggleProfessorStatus = async (userId, currentStatus) => {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/users/${userId}/professor-status`,
        { isProfessor: !currentStatus }
      );

      if (response.data.success) {
        // Update local state with mutual exclusivity
        // If turning Professor ON, turn Teacher OFF
        setUsers(users.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                isProfessor: !currentStatus,
                isTeacher: !currentStatus ? false : user.isTeacher
              }
            : user
        ));
        alert(`Professor status updated successfully!${!currentStatus ? ' Teacher status disabled (mutual exclusivity).' : ''}`);
      }
    } catch (error) {
      console.error('Error updating professor status:', error);
      alert('Failed to update professor status');
    }
  };

  // Filter and sort users
  const getFilteredAndSortedUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch(sortBy) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'email':
          aVal = a.email?.toLowerCase() || '';
          bVal = b.email?.toLowerCase() || '';
          break;
        case 'registration_date':
          aVal = new Date(a.created_at || 0);
          bVal = new Date(b.created_at || 0);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const filteredUsers = getFilteredAndSortedUsers();

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export users to CSV
  const exportToCSV = () => {
    const headers = ['User ID', 'Name', 'Email', 'Registration Date', 'Status'];
    const csvData = filteredUsers.map(user => [
      user.id,
      user.name,
      user.email || 'N/A',
      formatDate(user.created_at),
      user.status
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ceibaa_users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <UsersIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Online Now</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.online}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Offline</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.offline}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <XCircle className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">New Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.newToday}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center space-x-3">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="registration_date">Registration Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
            </select>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchUsers}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Badges
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-mono text-gray-900">
                          {user.id?.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</div>
                          {user.provider && (
                            <div className="text-xs text-gray-500 flex items-center space-x-1">
                              <Shield className="w-3 h-3" />
                              <span>via {user.provider}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.status === 'online' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleTeacherStatus(user.id, user.isTeacher)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            user.isTeacher
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}
                          title={user.isTeacher ? 'Remove teacher badge' : 'Add teacher badge'}
                        >
                          {user.isTeacher ? '✓ Teacher' : 'Teacher'}
                        </button>
                        <button
                          onClick={() => toggleProfessorStatus(user.id, user.isProfessor)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            user.isProfessor
                              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}
                          title={user.isProfessor ? 'Remove professor badge' : 'Add professor badge'}
                        >
                          {user.isProfessor ? '✓ Professor' : 'Professor'}
                        </button>
                        <button
                          onClick={() => toggleOfficialStatus(user.id, user.isOfficial)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            user.isOfficial
                              ? 'bg-gray-500 text-white hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}
                          title={user.isOfficial ? 'Remove official badge' : 'Add official badge'}
                        >
                          {user.isOfficial ? '✓ Official' : 'Official'}
                        </button>
                        <button
                          onClick={() => toggleInstituteStatus(user.id, user.isInstitute)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            user.isInstitute
                              ? 'text-white hover:opacity-90'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}
                          style={user.isInstitute ? {backgroundColor: '#8B2E2E'} : {}}
                          title={user.isInstitute ? 'Remove institute badge' : 'Add institute badge'}
                        >
                          {user.isInstitute ? '✓ Institute' : 'Institute'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Ban User"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === index + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
