import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import axios from 'axios';
import { CreditCard, DollarSign, Receipt, Plus, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const Payments = () => {
  const { user } = useAuth();
  const { currentLocation, getCurrentPosition } = useLocation();
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
    fetchPaymentStats();
  }, [filterStatus]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/payments', {
        params: { status: filterStatus }
      });
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Fetch payments error:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Fetch customers error:', error);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await axios.get('/api/payments/stats/summary');
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Fetch payment stats error:', error);
    }
  };

  const handlePayment = async (paymentData) => {
    try {
      if (!currentLocation) {
        await getCurrentPosition();
      }

      const data = {
        ...paymentData,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        address: 'Current Location'
      };

      let response;
      if (paymentData.method === 'cash') {
        response = await axios.post('/api/payments/cash', data);
      } else if (paymentData.method === 'upi') {
        response = await axios.post('/api/payments/upi', data);
      }

      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      fetchPayments();
      fetchPaymentStats();

      // Send notification if requested
      if (paymentData.sendNotification) {
        const customer = customers.find(c => c._id === paymentData.customerId);
        if (customer) {
          await axios.post('/api/notifications/payment-confirmation', {
            customerId: paymentData.customerId,
            paymentId: response.data.payment._id,
            amount: paymentData.amount,
            method: paymentData.method,
            receiptNumber: response.data.payment.receiptNumber,
            phone: customer.phone,
            customerName: customer.name,
            notificationType: paymentData.notificationType || 'sms'
          });
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment recording failed');
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
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track and collect payments</p>
        </div>
        {user?.role === 'employee' && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn btn-primary mt-4 sm:mt-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Amount"
          value={`₹${stats.totalAmount || 0}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Payments"
          value={stats.totalPayments || 0}
          icon={Receipt}
          color="blue"
        />
        <StatCard
          title="Cash Payments"
          value={`₹${stats.cashPayments || 0}`}
          icon={DollarSign}
          color="yellow"
        />
        <StatCard
          title="Digital Payments"
          value={`₹${(stats.cardPayments || 0) + (stats.upiPayments || 0)}`}
          icon={CreditCard}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          className="input w-auto"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Payments</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {payments.map((payment) => (
            <PaymentCard key={payment._id} payment={payment} />
          ))}
        </div>
        {payments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No payments found</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          customers={customers}
          onPayment={handlePayment}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const PaymentCard = ({ payment }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'cash': return DollarSign;
      case 'card': case 'upi': return CreditCard;
      default: return Receipt;
    }
  };

  const MethodIcon = getMethodIcon(payment.method);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <MethodIcon className="h-5 w-5 text-gray-400" />
          <div>
            <h4 className="font-medium text-gray-900">{payment.customer?.name}</h4>
            <p className="text-sm text-gray-600">Receipt: {payment.receiptNumber}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">₹{payment.amount}</p>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
            {payment.status}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Method:</span>
          <p className="font-medium capitalize">{payment.method}</p>
        </div>
        <div>
          <span className="text-gray-600">Date:</span>
          <p className="font-medium">
            {new Date(payment.paymentDate).toLocaleDateString()}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Time:</span>
          <p className="font-medium">
            {new Date(payment.paymentDate).toLocaleTimeString()}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Employee:</span>
          <p className="font-medium">{payment.employee?.name}</p>
        </div>
      </div>
      
      {payment.description && (
        <div className="mt-3 text-sm text-gray-600">
          <strong>Description:</strong> {payment.description}
        </div>
      )}
    </div>
  );
};

const PaymentModal = ({ customers, onPayment, onClose }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    method: 'cash',
    description: '',
    transactionId: '',
    sendNotification: false,
    notificationType: 'sms'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.amount) {
      toast.error('Please fill in required fields');
      return;
    }
    onPayment(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer *
            </label>
            <select
              name="customerId"
              className="input"
              value={formData.customerId}
              onChange={handleChange}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              name="amount"
              className="input"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              name="method"
              className="input"
              value={formData.method}
              onChange={handleChange}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          
          {(formData.method === 'upi' || formData.method === 'bank_transfer') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID
              </label>
              <input
                type="text"
                name="transactionId"
                className="input"
                value={formData.transactionId}
                onChange={handleChange}
                placeholder="Enter transaction ID"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              className="input"
              rows="2"
              value={formData.description}
              onChange={handleChange}
              placeholder="Payment description..."
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="sendNotification"
              id="sendNotification"
              checked={formData.sendNotification}
              onChange={handleChange}
              className="rounded"
            />
            <label htmlFor="sendNotification" className="text-sm text-gray-700">
              Send payment confirmation
            </label>
          </div>
          
          {formData.sendNotification && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Type
              </label>
              <select
                name="notificationType"
                className="input"
                value={formData.notificationType}
                onChange={handleChange}
              >
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Payments;
