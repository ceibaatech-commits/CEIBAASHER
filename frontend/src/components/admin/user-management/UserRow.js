import React from 'react';
import { Calendar, Shield, Eye, Trash2, Ban, CheckCircle2 } from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const BadgeButton = ({ active, onClick, label, activeClass, inactiveClass = 'bg-gray-200 text-gray-500 hover:bg-gray-300', style, testId }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${active ? activeClass : inactiveClass}`}
    style={style}
    title={active ? `Remove ${label.toLowerCase()} badge` : `Add ${label.toLowerCase()} badge`}
    data-testid={testId}
  >
    {active ? `✓ ${label}` : label}
  </button>
);

const StatusPill = ({ status, isDisabled }) => {
  if (isDisabled) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
        <Ban className="w-3 h-3 mr-1.5" />
        Disabled
      </span>
    );
  }
  if (status === 'online') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
        Online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
      Offline
    </span>
  );
};

export const UserRow = ({ user, onToggleBadge, onToggleDisable, onDelete }) => {
  const isDisabled = user.account_status === 'banned' || user.account_status === 'suspended';
  const rowDim = isDisabled ? 'opacity-60' : '';

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${rowDim}`} data-testid={`user-row-${user.id}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-mono text-gray-900">{user.id?.substring(0, 8)}...</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="ml-4">
            <div className={`text-sm font-medium ${isDisabled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {user.name || 'Unknown'}
            </div>
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
        <StatusPill status={user.status} isDisabled={isDisabled} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-wrap gap-2">
          <BadgeButton
            label="Teacher" active={user.isTeacher}
            activeClass="bg-blue-100 text-blue-700 hover:bg-blue-200"
            onClick={() => onToggleBadge(user.id, 'isTeacher', user.isTeacher)}
            testId={`badge-teacher-${user.id}`}
          />
          <BadgeButton
            label="Professor" active={user.isProfessor}
            activeClass="bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            onClick={() => onToggleBadge(user.id, 'isProfessor', user.isProfessor)}
            testId={`badge-professor-${user.id}`}
          />
          <BadgeButton
            label="Official" active={user.isOfficial}
            activeClass="bg-gray-500 text-white hover:bg-gray-600"
            onClick={() => onToggleBadge(user.id, 'isOfficial', user.isOfficial)}
            testId={`badge-official-${user.id}`}
          />
          <BadgeButton
            label="Institute" active={user.isInstitute}
            activeClass="text-white hover:opacity-90"
            style={user.isInstitute ? { backgroundColor: '#8B2E2E' } : {}}
            onClick={() => onToggleBadge(user.id, 'isInstitute', user.isInstitute)}
            testId={`badge-institute-${user.id}`}
          />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
            data-testid={`view-user-${user.id}`}
          >
            <Eye className="w-4 h-4" />
          </button>

          {isDisabled ? (
            <button
              onClick={() => onToggleDisable(user.id, true)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Enable User"
              data-testid={`enable-user-${user.id}`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onToggleDisable(user.id, false)}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Disable User"
              data-testid={`disable-user-${user.id}`}
            >
              <Ban className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onDelete(user.id, user.name)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete User"
            data-testid={`delete-user-${user.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
