import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import axios from 'axios';
import { MapPin, Clock, CheckCircle, Play, Square, Camera, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const Visits = () => {
  const { user } = useAuth();
  const { currentLocation, getCurrentPosition } = useLocation();
  const [visits, setVisits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVisit, setActiveVisit] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  useEffect(() => {
    fetchVisits();
    fetchCustomers();
  }, []);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/visits');
      const visitsList = response.data.visits || [];
      setVisits(visitsList);
      
      // Find active visit
      const active = visitsList.find(v => v.status === 'in_progress');
      setActiveVisit(active);
    } catch (error) {
      console.error('Fetch visits error:', error);
      toast.error('Failed to load visits');
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

  const handleCheckIn = async (customerId, purpose, notes) => {
    try {
      if (!currentLocation) {
        const location = await getCurrentPosition();
        if (!location) {
          toast.error('Location is required for check-in');
          return;
        }
      }

      const response = await axios.post('/api/visits/checkin', {
        customerId,
        purpose,
        notes,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: 'Current Location'
      });

      setActiveVisit(response.data.visit);
      setShowCheckInModal(false);
      toast.success('Checked in successfully');
      fetchVisits();
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Check-in failed');
    }
  };

  const handleCheckOut = async (notes, paymentAmount, paymentMethod) => {
    try {
      if (!currentLocation) {
        await getCurrentPosition();
      }

      const checkOutData = {
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        address: 'Current Location',
        notes
      };

      if (paymentAmount && paymentMethod) {
        checkOutData.paymentCollected = {
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          status: 'completed'
        };
      }

      await axios.put(`/api/visits/${activeVisit._id}/checkout`, checkOutData);
      
      setActiveVisit(null);
      toast.success('Checked out successfully');
      fetchVisits();
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error('Check-out failed');
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
          <h1 className="text-2xl font-bold text-gray-900">Visits</h1>
          <p className="text-gray-600">Track your customer visits</p>
        </div>
        {user?.role === 'employee' && !activeVisit && (
          <button
            onClick={() => setShowCheckInModal(true)}
            className="btn btn-primary mt-4 sm:mt-0"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Visit
          </button>
        )}
      </div>

      {/* Active Visit Alert */}
      {activeVisit && (
        <ActiveVisitCard 
          visit={activeVisit} 
          onCheckOut={handleCheckOut}
        />
      )}

      {/* Visits List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Visits</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {visits.map((visit) => (
            <VisitCard key={visit._id} visit={visit} />
          ))}
        </div>
        {visits.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No visits found</p>
          </div>
        )}
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && (
        <CheckInModal
          customers={customers}
          onCheckIn={handleCheckIn}
          onClose={() => setShowCheckInModal(false)}
        />
      )}
    </div>
  );
};

const ActiveVisitCard = ({ visit, onCheckOut }) => {
  const [notes, setNotes] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showCheckOut, setShowCheckOut] = useState(false);

  const duration = visit.checkInTime ? 
    Math.floor((new Date() - new Date(visit.checkInTime)) / (1000 * 60)) : 0;

  const handleSubmitCheckOut = () => {
    onCheckOut(notes, paymentAmount, paymentMethod);
    setShowCheckOut(false);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Active Visit</h3>
            <p className="text-blue-700">{visit.customer?.name}</p>
          </div>
        </div>
        <button
          onClick={() => setShowCheckOut(true)}
          className="btn btn-danger"
        >
          <Square className="h-4 w-4 mr-2" />
          Check Out
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-blue-600">Check-in Time:</span>
          <p className="font-medium">{new Date(visit.checkInTime).toLocaleTimeString()}</p>
        </div>
        <div>
          <span className="text-blue-600">Duration:</span>
          <p className="font-medium">{duration} minutes</p>
        </div>
      </div>

      {/* Check-out Modal */}
      {showCheckOut && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Check Out</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Notes
                </label>
                <textarea
                  className="input"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add visit notes..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    className="input"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="">Select method</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCheckOut(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCheckOut}
                className="btn btn-primary flex-1"
              >
                Check Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VisitCard = ({ visit }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <MapPin className="h-5 w-5 text-gray-400" />
          <div>
            <h4 className="font-medium text-gray-900">{visit.customer?.name}</h4>
            <p className="text-sm text-gray-600">{visit.purpose.replace('_', ' ')}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(visit.status)}`}>
          {visit.status.replace('_', ' ')}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Check-in:</span>
          <p className="font-medium">
            {visit.checkInTime ? new Date(visit.checkInTime).toLocaleTimeString() : '-'}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Check-out:</span>
          <p className="font-medium">
            {visit.checkOutTime ? new Date(visit.checkOutTime).toLocaleTimeString() : '-'}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Duration:</span>
          <p className="font-medium">{visit.duration || 0} min</p>
        </div>
        <div>
          <span className="text-gray-600">Payment:</span>
          <p className="font-medium">
            {visit.paymentCollected?.amount ? `₹${visit.paymentCollected.amount}` : '-'}
          </p>
        </div>
      </div>
      
      {visit.notes && (
        <div className="mt-3 text-sm text-gray-600">
          <strong>Notes:</strong> {visit.notes}
        </div>
      )}
    </div>
  );
};

const CheckInModal = ({ customers, onCheckIn, onClose }) => {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomer || !purpose) {
      toast.error('Please select customer and purpose');
      return;
    }
    onCheckIn(selectedCustomer, purpose, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Start New Visit</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              className="input"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
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
              Purpose
            </label>
            <select
              className="input"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
            >
              <option value="">Select purpose</option>
              <option value="payment_collection">Payment Collection</option>
              <option value="delivery">Delivery</option>
              <option value="meeting">Meeting</option>
              <option value="support">Support</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              className="input"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add visit notes..."
            />
          </div>
          
          <div className="flex space-x-3">
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
              Check In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Visits;
