import React from 'react';
import { Users as UsersIcon } from 'lucide-react';
import { UserRow } from './UserRow';

const HEADERS = ['User ID', 'Name', 'Email', 'Registration Date', 'Status', 'Badges', 'Actions'];

export const UserTable = ({ users, onToggleBadge, children }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="user-management-table">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {HEADERS.map(h => (
              <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.length === 0 ? (
            <tr>
              <td colSpan={HEADERS.length} className="px-6 py-12 text-center text-gray-500">
                <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No users found</p>
              </td>
            </tr>
          ) : (
            users.map(user => (
              <UserRow key={user.id} user={user} onToggleBadge={onToggleBadge} />
            ))
          )}
        </tbody>
      </table>
    </div>
    {children}
  </div>
);
