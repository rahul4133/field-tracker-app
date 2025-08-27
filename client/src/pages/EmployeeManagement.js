import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, pagination.current]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/employees', {
        params: {
          page: pagination.current,
          limit: 10,
          search: searchTerm
        }
      });
      
      setEmployees(response.data.employees || []);
      setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Fetch employees error:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const handleToggleStatus = async (employeeId, currentStatus) => {
    try {
      if (currentStatus) {
        await axios.put(`/api/employees/${employeeId}/deactivate`);
        toast.success('Employee deactivated');
      } else {
        await axios.put(`/api/employees/${employeeId}`, { isActive: true });
        toast.success('Employee activated');
      }
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to update employee status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage your field employees</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary mt-4 sm:mt-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search employees..."
          className="input pl-10"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <EmployeeRow
                  key={employee._id}
                  employee={employee}
                  onEdit={setEditingEmployee}
                  onToggleStatus={handleToggleStatus}
                  onRefresh={fetchEmployees}
                />
              ))}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No employees found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 rounded-md text-sm ${
                page === pagination.current
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      {(showAddModal || editingEmployee) && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setShowAddModal(false);
            setEditingEmployee(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingEmployee(null);
            fetchEmployees();
          }}
        />
      )}
    </div>
  );
};

const EmployeeRow = ({ employee, onEdit, onToggleStatus, onRefresh }) => {
  const handleCall = () => {
    window.open(`tel:${employee.phone}`);
  };

  const handleEmail = () => {
    window.open(`mailto:${employee.email}`);
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {employee.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
            <div className="text-sm text-gray-500">ID: {employee.employeeId}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-900">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <button onClick={handleCall} className="hover:text-primary-600">
              {employee.phone}
            </button>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Mail className="h-4 w-4 mr-2 text-gray-400" />
            <button onClick={handleEmail} className="hover:text-primary-600">
              {employee.email}
            </button>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
          {employee.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {employee.department || 'Not assigned'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${employee.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className={`px-2 py-1 text-xs rounded-full ${
            employee.isActive 
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {employee.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={() => onEdit(employee)}
          className="text-indigo-600 hover:text-indigo-900"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onToggleStatus(employee._id, employee.isActive)}
          className={`${employee.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
        >
          {employee.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        </button>
      </td>
    </tr>
  );
};

const EmployeeModal = ({ employee, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    password: '',
    phone: employee?.phone || '',
    role: employee?.role || 'employee',
    employeeId: employee?.employeeId || '',
    department: employee?.department || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (employee) {
        // Update existing employee
        await axios.put(`/api/employees/${employee._id}`, formData);
        toast.success('Employee updated successfully');
      } else {
        // Create new employee
        await axios.post('/api/auth/register', formData);
        toast.success('Employee created successfully');
      }
      onSuccess();
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {employee ? 'Edit Employee' : 'Add New Employee'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              className="input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
              disabled={!!employee}
              required
            />
          </div>
          
          {!employee && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                className="input"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              name="phone"
              className="input"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              className="input"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee ID
            </label>
            <input
              type="text"
              name="employeeId"
              className="input"
              value={formData.employeeId}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              name="department"
              className="input"
              value={formData.department}
              onChange={handleChange}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner mr-2" />
              ) : null}
              {employee ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeManagement;
