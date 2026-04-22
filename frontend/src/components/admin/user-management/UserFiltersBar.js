import React from 'react';
import { Search, Download, RefreshCw } from 'lucide-react';

export const UserFiltersBar = ({
  searchQuery, setSearchQuery,
  filterStatus, setFilterStatus,
  sortBy, setSortBy,
  sortOrder, setSortOrder,
  onExport, onRefresh,
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="user-search-input"
        />
      </div>

      <div className="flex items-center space-x-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="user-status-filter"
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="user-sort-by"
        >
          <option value="registration_date">Registration Date</option>
          <option value="name">Name</option>
          <option value="email">Email</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          data-testid="user-sort-order-toggle"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>

        <button
          onClick={onExport}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          data-testid="user-export-csv-btn"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={onRefresh}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          title="Refresh"
          data-testid="user-refresh-btn"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
);
