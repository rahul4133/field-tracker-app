import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import { MapPin, Users, Navigation, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const LiveTracking = () => {
  const { subscribeToLocationUpdates } = useSocket();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchEmployeeLocations();
    
    // Subscribe to real-time location updates
    const unsubscribe = subscribeToLocationUpdates((data) => {
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === data.employeeId 
            ? { ...emp, location: { ...data, timestamp: new Date(data.timestamp) } }
            : emp
        )
      );
      setLastUpdate(new Date());
    });

    // Refresh data every 30 seconds
    const interval = setInterval(fetchEmployeeLocations, 30000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, [subscribeToLocationUpdates]);

  const fetchEmployeeLocations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/employees/locations/live');
      setEmployees(response.data.locations || []);
    } catch (error) {
      console.error('Fetch locations error:', error);
      toast.error('Failed to load employee locations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchEmployeeLocations();
    toast.success('Locations refreshed');
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
          <h1 className="text-2xl font-bold text-gray-900">Live Employee Tracking</h1>
          <p className="text-gray-600">Monitor field employees in real-time</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Navigation className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Online Now</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(emp => emp.isOnline).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With Location</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(emp => emp.location?.latitude).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Field Employees</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {employees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  isSelected={selectedEmployee?.id === employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                />
              ))}
            </div>
            {employees.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No employees found</p>
              </div>
            )}
          </div>
        </div>

        {/* Map/Details View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedEmployee ? `${selectedEmployee.name} - Location Details` : 'Select an employee to view location'}
              </h3>
            </div>
            <div className="p-6">
              {selectedEmployee ? (
                <EmployeeLocationDetails employee={selectedEmployee} />
              ) : (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select an employee from the list to view their location details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeCard = ({ employee, isSelected, onClick }) => {
  const getStatusColor = (isOnline) => {
    return isOnline ? 'bg-green-500' : 'bg-red-500';
  };

  const getLastSeenText = (location) => {
    if (!location?.timestamp) return 'No location data';
    
    const now = new Date();
    const lastSeen = new Date(location.timestamp);
    const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div
      className={`p-4 cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {employee.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${getStatusColor(employee.isOnline)}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{employee.name}</p>
            <p className="text-xs text-gray-500">ID: {employee.employeeId}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">
            {getLastSeenText(employee.location)}
          </p>
          {employee.location?.latitude && (
            <MapPin className="h-4 w-4 text-green-500 ml-auto mt-1" />
          )}
        </div>
      </div>
    </div>
  );
};

const EmployeeLocationDetails = ({ employee }) => {
  const [dailyRoute, setDailyRoute] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDailyRoute();
  }, [employee.id]);

  const fetchDailyRoute = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/visits/employee/${employee.id}/route`);
      setDailyRoute(response.data.routeData || []);
    } catch (error) {
      console.error('Fetch route error:', error);
    } finally {
      setLoading(false);
    }
  };

  const { location } = employee;

  return (
    <div className="space-y-6">
      {/* Current Location */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Current Location</h4>
        {location?.latitude ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Latitude:</span>
                <p className="font-medium">{location.latitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-gray-600">Longitude:</span>
                <p className="font-medium">{location.longitude.toFixed(6)}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Address:</span>
                <p className="font-medium">{location.address || 'Address not available'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Last Updated:</span>
                <p className="font-medium">
                  {location.timestamp ? new Date(location.timestamp).toLocaleString() : 'Unknown'}
                </p>
              </div>
            </div>
            
            {/* Google Maps Link */}
            <div className="pt-2">
              <a
                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <MapPin className="h-4 w-4 mr-1" />
                View on Google Maps
              </a>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No location data available</p>
        )}
      </div>

      {/* Today's Route */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900">Today's Route</h4>
          {loading && <div className="spinner" />}
        </div>
        
        {dailyRoute.length > 0 ? (
          <div className="space-y-3">
            {dailyRoute.map((visit, index) => (
              <div key={visit.visitId} className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{visit.customer?.name}</p>
                  <p className="text-xs text-gray-500">
                    {visit.checkInTime && new Date(visit.checkInTime).toLocaleTimeString()}
                    {visit.checkOutTime && ` - ${new Date(visit.checkOutTime).toLocaleTimeString()}`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    visit.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : visit.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {visit.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No visits recorded for today</p>
        )}
      </div>

      {/* Employee Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Employee Status</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Status:</span>
            <div className="flex items-center mt-1">
              <div className={`h-2 w-2 rounded-full mr-2 ${employee.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">{employee.isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <div>
            <span className="text-gray-600">Today's Visits:</span>
            <p className="font-medium">{dailyRoute.length}</p>
          </div>
          <div>
            <span className="text-gray-600">Completed:</span>
            <p className="font-medium">{dailyRoute.filter(v => v.status === 'completed').length}</p>
          </div>
          <div>
            <span className="text-gray-600">In Progress:</span>
            <p className="font-medium">{dailyRoute.filter(v => v.status === 'in_progress').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
