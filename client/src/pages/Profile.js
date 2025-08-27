import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Phone, Mail, MapPin, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || ''
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
      const result = await updateProfile(formData);
      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      department: user?.department || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-secondary"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Profile Avatar */}
          <div className="flex items-center space-x-6 mb-6">
            <div className="h-20 w-20 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900">{user?.name}</h4>
              <p className="text-gray-600 capitalize">{user?.role}</p>
              {user?.employeeId && (
                <p className="text-sm text-gray-500">ID: {user.employeeId}</p>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    className="input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user?.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address
                </label>
                <p className="text-gray-900 py-2">{user?.email}</p>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    className="input"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user?.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="department"
                    className="input"
                    value={formData.department}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user?.department || 'Not specified'}</p>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <p className="text-gray-900 py-2 capitalize">{user?.role}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID
                  </label>
                  <p className="text-gray-900 py-2">{user?.employeeId || 'Not assigned'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <p className="text-gray-900 py-2">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Login
                  </label>
                  <p className="text-gray-900 py-2">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Location (for employees) */}
            {user?.role === 'employee' && user?.currentLocation && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  <MapPin className="h-5 w-5 inline mr-2" />
                  Current Location
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Latitude:</span>
                      <p className="font-medium">{user.currentLocation.latitude?.toFixed(6)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Longitude:</span>
                      <p className="font-medium">{user.currentLocation.longitude?.toFixed(6)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Address:</span>
                      <p className="font-medium">{user.currentLocation.address || 'Not available'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Last Updated:</span>
                      <p className="font-medium">
                        {user.currentLocation.timestamp 
                          ? new Date(user.currentLocation.timestamp).toLocaleString()
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Security</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Password</h4>
                <p className="text-sm text-gray-600">Last updated 30 days ago</p>
              </div>
              <button className="btn btn-secondary">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
