import React, { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, User, CheckCircle, XCircle, AlertCircle, Plus, Upload } from 'lucide-react';
import axios from 'axios';

const LeaveManagement = () => {
  const [activeTab, setActiveTab] = useState('apply');
  const [leaves, setLeaves] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [loading, setLoading] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);

  const userRole = localStorage.getItem('userRole');
  const isManager = userRole === 'manager' || userRole === 'admin';

  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false,
    halfDayType: 'first-half',
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    },
    handoverTo: '',
    isUrgent: false,
    attachments: []
  });

  useEffect(() => {
    fetchMyLeaves();
    fetchLeaveBalance();
    if (isManager) {
      fetchPendingApprovals();
    }
  }, [isManager]);

  const fetchMyLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/leave/my-leaves', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setLeaves(response.data.leaves);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/leave/pending-approvals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPendingApprovals(response.data.leaves);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/leave/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setLeaveBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Append form fields
      Object.keys(formData).forEach(key => {
        if (key === 'emergencyContact') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === 'attachments') {
          formData.attachments.forEach(file => {
            formDataToSend.append('attachments', file);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.post('/api/leave/apply', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert('Leave application submitted successfully!');
        setShowApplyForm(false);
        setFormData({
          leaveType: 'casual',
          startDate: '',
          endDate: '',
          reason: '',
          isHalfDay: false,
          halfDayType: 'first-half',
          emergencyContact: { name: '', phone: '', relation: '' },
          handoverTo: '',
          isUrgent: false,
          attachments: []
        });
        fetchMyLeaves();
        fetchLeaveBalance();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId, action, comments) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/leave/${leaveId}/action`, {
        action,
        comments
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(`Leave ${action}d successfully!`);
        fetchPendingApprovals();
      }
    } catch (error) {
      alert(error.response?.data?.message || `Failed to ${action} leave`);
    }
  };

  const handleCancelLeave = async (leaveId, reason) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/leave/${leaveId}/cancel`, {
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Leave cancelled successfully!');
        fetchMyLeaves();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel leave');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const renderApplyForm = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Apply for Leave</h3>
        <button
          onClick={() => setShowApplyForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmitLeave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type *
            </label>
            <select
              name="leaveType"
              value={formData.leaveType}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="annual">Annual Leave</option>
              <option value="maternity">Maternity Leave</option>
              <option value="paternity">Paternity Leave</option>
              <option value="emergency">Emergency Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isHalfDay"
                checked={formData.isHalfDay}
                onChange={handleInputChange}
                className="mr-2"
              />
              Half Day
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isUrgent"
                checked={formData.isUrgent}
                onChange={handleInputChange}
                className="mr-2"
              />
              Urgent
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>

        {formData.isHalfDay && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Half Day Type
            </label>
            <select
              name="halfDayType"
              value={formData.halfDayType}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="first-half">First Half</option>
              <option value="second-half">Second Half</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason *
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            rows="3"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Name
            </label>
            <input
              type="text"
              name="emergencyContact.name"
              value={formData.emergencyContact.name}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Phone
            </label>
            <input
              type="tel"
              name="emergencyContact.phone"
              value={formData.emergencyContact.phone}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relation
            </label>
            <input
              type="text"
              name="emergencyContact.relation"
              value={formData.emergencyContact.relation}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachments
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 5MB each)
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setShowApplyForm(false)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderLeaveBalance = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Object.entries(leaveBalance).map(([type, balance]) => (
        <div key={type} className="bg-white p-4 rounded-lg shadow-md">
          <h4 className="text-sm font-medium text-gray-600 capitalize mb-2">
            {type.replace('-', ' ')} Leave
          </h4>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {balance.remaining}
          </div>
          <div className="text-xs text-gray-500">
            Used: {balance.used} / {balance.entitled}
          </div>
        </div>
      ))}
    </div>
  );

  const renderMyLeaves = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">My Leave Applications</h3>
        <button
          onClick={() => setShowApplyForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Apply Leave</span>
        </button>
      </div>

      {renderLeaveBalance()}

      {showApplyForm && renderApplyForm()}

      <div className="space-y-3">
        {leaves.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No leave applications found
          </div>
        ) : (
          leaves.map((leave) => (
            <div key={leave._id} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-semibold capitalize">
                      {leave.leaveType.replace('-', ' ')} Leave
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(leave.status)}`}>
                      {getStatusIcon(leave.status)}
                      <span className="capitalize">{leave.status}</span>
                    </span>
                    {leave.isUrgent && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                        Urgent
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                    <div>
                      <span className="font-medium">Duration:</span> {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </div>
                    <div>
                      <span className="font-medium">Days:</span> {leave.totalDays} {leave.isHalfDay ? '(Half Day)' : ''}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Reason:</span> {leave.reason}
                  </p>
                  
                  {leave.finalComments && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Comments:</span> {leave.finalComments}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  <span className="text-xs text-gray-500">
                    Applied: {formatDate(leave.appliedDate)}
                  </span>
                  
                  {leave.status === 'pending' && (
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for cancellation:');
                        if (reason) handleCancelLeave(leave._id, reason);
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              
              {/* Approval Hierarchy */}
              {leave.approvalHierarchy && leave.approvalHierarchy.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Approval Status:</h5>
                  <div className="space-y-2">
                    {leave.approvalHierarchy.map((approval, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(approval.status)}`}>
                          Level {approval.level}
                        </span>
                        <span className="text-gray-600">
                          {approval.approver.name} ({approval.approver.role})
                        </span>
                        {approval.actionDate && (
                          <span className="text-gray-500">
                            - {formatDate(approval.actionDate)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderPendingApprovals = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pending Approvals</h3>
      
      {pendingApprovals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No pending approvals
        </div>
      ) : (
        <div className="space-y-3">
          {pendingApprovals.map((leave) => (
            <div key={leave._id} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold">{leave.employee.name}</span>
                    <span className="text-sm text-gray-600">({leave.employee.employeeId})</span>
                    {leave.isUrgent && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                        Urgent
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                    <div>
                      <span className="font-medium">Type:</span> {leave.leaveType.replace('-', ' ')}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </div>
                    <div>
                      <span className="font-medium">Days:</span> {leave.totalDays} {leave.isHalfDay ? '(Half Day)' : ''}
                    </div>
                    <div>
                      <span className="font-medium">Applied:</span> {formatDate(leave.appliedDate)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-4">
                    <span className="font-medium">Reason:</span> {leave.reason}
                  </p>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const comments = prompt('Approval comments (optional):');
                        handleLeaveAction(leave._id, 'approve', comments || '');
                      }}
                      className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const comments = prompt('Rejection reason:');
                        if (comments) handleLeaveAction(leave._id, 'reject', comments);
                      }}
                      className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Leave Management</h1>
          <p className="text-gray-600">Manage leave applications and approvals</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('apply')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'apply' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>My Leaves</span>
          </button>
          
          {isManager && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'approvals' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Approvals</span>
              {pendingApprovals.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'apply' && renderMyLeaves()}
        {activeTab === 'approvals' && isManager && renderPendingApprovals()}
      </div>
    </div>
  );
};

export default LeaveManagement;
