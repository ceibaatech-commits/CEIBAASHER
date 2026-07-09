import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Plus, Edit, Trash2,
  Search, RefreshCw, CheckCircle, XCircle,
  Calendar, User
} from 'lucide-react';
import EmployeeFormModal from './EmployeeFormModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const EmployeeManager = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    password: '',
    role: 'sheet_manager'
  });

  const roles = [
    { value: 'sheet_manager', label: 'Sheet Manager' },
    { value: 'content_manager', label: 'Content Manager' },
    { value: 'senior_editor', label: 'Senior Editor' }
  ];

  useEffect(() => {
    fetchEmployees();
  // eslint-disable-next-line
  }, []);

  // Cookie-based auth — the httpOnly `ceibaa_admin_token` cookie is sent
  // automatically because `axios.defaults.withCredentials = true` is set
  // globally in index.js. Kept as a thin per-request config object so
  // existing callsites stay unchanged.
  const getAuthHeaders = () => ({ withCredentials: true });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/employees`, getAuthHeaders());
      if (response.data.success) {
        setEmployees(response.data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!formData.name || !formData.employee_id || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/employees`,
        formData,
        getAuthHeaders()
      );

      if (response.data.success) {
        alert('Employee created successfully!');
        setShowAddModal(false);
        resetForm();
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      alert(error.response?.data?.detail || 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!formData.name) {
      alert('Name is required');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        name: formData.name,
        role: formData.role
      };
      
      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await axios.put(
        `${BACKEND_URL}/api/admin/employees/${selectedEmployee.id}`,
        updateData,
        getAuthHeaders()
      );

      if (response.data.success) {
        alert('Employee updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert(error.response?.data?.detail || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (employee) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/admin/employees/${employee.id}`,
        { is_active: !employee.is_active },
        getAuthHeaders()
      );
      fetchEmployees();
    } catch (error) {
      console.error('Error toggling employee status:', error);
      alert('Failed to update employee status');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(
        `${BACKEND_URL}/api/admin/employees/${employeeId}`,
        getAuthHeaders()
      );
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
    }
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      employee_id: employee.employee_id,
      password: '',
      role: employee.role
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      employee_id: '',
      password: '',
      role: 'sheet_manager'
    });
    setSelectedEmployee(null);
    setShowPassword(false);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
    setShowPassword(true);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-sm text-gray-500">Manage employee accounts for the Employee Portal</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={fetchEmployees}
          className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Employee ID</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Stats</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading employees...
                  </div>
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  No employees found. Click "Add Employee" to create one.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-500">
                          Last login: {employee.last_login ? new Date(employee.last_login).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{employee.employee_id}</code>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {employee.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(employee)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        employee.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {employee.is_active ? (
                        <><CheckCircle className="w-3 h-3" /> Active</>
                      ) : (
                        <><XCircle className="w-3 h-3" /> Inactive</>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{employee.sheets_added || 0}</span> sheets
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(employee)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <EmployeeFormModal
          mode="add"
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          generatePassword={generatePassword}
          onSubmit={handleAddEmployee}
          onClose={() => { setShowAddModal(false); resetForm(); }}
          saving={saving}
          roles={roles}
        />
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <EmployeeFormModal
          mode="edit"
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          generatePassword={generatePassword}
          onSubmit={handleUpdateEmployee}
          onClose={() => { setShowEditModal(false); resetForm(); }}
          saving={saving}
          roles={roles}
        />
      )}
    </div>
  );
};

export default EmployeeManager;
