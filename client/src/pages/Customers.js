import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Plus, Search, Upload, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, pagination.current]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/customers', {
        params: {
          page: pagination.current,
          limit: 10,
          search: searchTerm
        }
      });
      
      setCustomers(response.data.customers || []);
      setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Fetch customers error:', error);
      toast.error('Failed to load customers');
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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search customers..."
          className="input pl-10"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <CustomerCard
            key={customer._id}
            customer={customer}
            onEdit={setEditingCustomer}
            onRefresh={fetchCustomers}
            canEdit={user?.role === 'admin' || user?.role === 'manager'}
          />
        ))}
      </div>

      {customers.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No customers found</p>
        </div>
      )}

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
    </div>
  );
};

const CustomerCard = ({ customer, onEdit, onRefresh, canEdit }) => {
  const handleCall = () => {
    window.open(`tel:${customer.phone}`);
  };

  const handleEmail = () => {
    window.open(`mailto:${customer.email}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await axios.delete(`/api/customers/${customer._id}`);
      toast.success('Customer deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
          {customer.businessName && (
            <p className="text-sm text-gray-600">{customer.businessName}</p>
          )}
          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
            customer.status === 'active' 
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {customer.status}
          </span>
        </div>
        {canEdit && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(customer)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="h-4 w-4 mr-2" />
          <button onClick={handleCall} className="hover:text-primary-600">
            {customer.phone}
          </button>
        </div>
        
        {customer.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2" />
            <button onClick={handleEmail} className="hover:text-primary-600">
              {customer.email}
            </button>
          </div>
        )}
        
        {customer.address?.city && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{customer.address.city}, {customer.address.state}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Outstanding:</span>
          <span className="font-medium text-red-600">₹{customer.outstandingAmount || 0}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Assigned to:</span>
          <span className="font-medium">{customer.assignedEmployee?.name}</span>
        </div>
      </div>
    </div>
  );
};

export default Customers;
