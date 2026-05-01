import React from 'react';
import { X, User, Briefcase, Lock, Eye, EyeOff, RefreshCw, Save } from 'lucide-react';

/**
 * Unified Add / Edit employee modal, extracted from EmployeeManager.js.
 * `mode` controls which fields are editable and the submit label.
 */
const EmployeeFormModal = ({
  mode,                // 'add' | 'edit'
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  generatePassword,
  onSubmit,
  onClose,
  saving,
  roles,
}) => {
  const isEdit = mode === 'edit';
  const title = isEdit ? 'Edit Employee' : 'Add New Employee';
  const submitLabel = isEdit ? 'Update Employee' : 'Create Employee';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Employee name"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Employee ID (locked in edit) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee ID {isEdit ? '' : '*'}
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => !isEdit && setFormData({ ...formData, employee_id: e.target.value })}
                disabled={isEdit}
                placeholder="e.g., EMP001"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${isEdit ? 'bg-gray-50 text-gray-500' : ''}`}
              />
            </div>
            {isEdit && <p className="text-xs text-gray-400 mt-1">Employee ID cannot be changed</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isEdit ? 'New Password' : 'Password *'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={isEdit ? 'Leave empty to keep current' : 'Password'}
                className="w-full pl-10 pr-20 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={generatePassword}
              className="mt-1 text-xs text-purple-600 hover:text-purple-700"
            >
              {isEdit ? 'Generate new password' : 'Generate random password'}
            </button>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeFormModal;
