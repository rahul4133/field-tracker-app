import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import axios from 'axios';
import { 
  Users, 
  MapPin, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  Navigation,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentLocation, isTracking, getCurrentPosition } = useLocation();
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVisit, setActiveVisit] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch different data based on user role
      if (user.role === 'employee') {
        await fetchEmployeeDashboard();
      } else {
        await fetchManagerDashboard();
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDashboard = async () => {
    try {
      const [visitsRes, paymentsRes, customersRes] = await Promise.all([
        axios.get('/api/visits?limit=5'),
        axios.get('/api/payments?limit=5'),
        axios.get('/api/customers?limit=5')
      ]);

      const visits = visitsRes.data.visits || [];
      const payments = paymentsRes.data.payments || [];
      const customers = customersRes.data.customers || [];

      // Find active visit
      const active = visits.find(v => v.status === 'in_progress');
      setActiveVisit(active);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayVisits = visits.filter(v => v.date.startsWith(today));
      const todayPayments = payments.filter(p => p.paymentDate.startsWith(today));
      
      setStats({
        totalCustomers: customers.length,
        todayVisits: todayVisits.length,
        completedVisits: todayVisits.filter(v => v.status === 'completed').length,
        todayPayments: todayPayments.length,
        todayAmount: todayPayments.reduce((sum, p) => sum + p.amount, 0)
      });

      // Recent activities
      const activities = [
        ...visits.slice(0, 3).map(v => ({
          type: 'visit',
          title: `Visit to ${v.customer?.name}`,
          time: new Date(v.checkInTime).toLocaleTimeString(),
          status: v.status,
          icon: MapPin
        })),
        ...payments.slice(0, 2).map(p => ({
          type: 'payment',
          title: `Payment from ${p.customer?.name}`,
          time: new Date(p.paymentDate).toLocaleTimeString(),
          amount: p.amount,
          icon: CreditCard
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time));

      setRecentActivities(activities);
    } catch (error) {
      console.error('Employee dashboard error:', error);
    }
  };

  const fetchManagerDashboard = async () => {
    try {
      const [visitsRes, paymentsRes, employeesRes] = await Promise.all([
        axios.get('/api/visits'),
        axios.get('/api/payments'),
        axios.get('/api/employees')
      ]);

      const visits = visitsRes.data.visits || [];
      const payments = paymentsRes.data.payments || [];
      const employees = employeesRes.data.employees || [];

      const today = new Date().toISOString().split('T')[0];
      const todayVisits = visits.filter(v => v.date.startsWith(today));
      const todayPayments = payments.filter(p => p.paymentDate.startsWith(today));
      const activeEmployees = employees.filter(e => e.isOnline);

      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        todayVisits: todayVisits.length,
        completedVisits: todayVisits.filter(v => v.status === 'completed').length,
        todayPayments: todayPayments.length,
        todayAmount: todayPayments.reduce((sum, p) => sum + p.amount, 0)
      });

      // Recent activities for manager view
      const activities = [
        ...visits.slice(0, 5).map(v => ({
          type: 'visit',
          title: `${v.employee?.name} visited ${v.customer?.name}`,
          time: new Date(v.checkInTime).toLocaleTimeString(),
          status: v.status,
          icon: MapPin
        }))
      ];

      setRecentActivities(activities);
    } catch (error) {
      console.error('Manager dashboard error:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      await getCurrentPosition();
      toast.success('Location access granted');
    } catch (error) {
      toast.error('Location access denied');
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          {user?.role === 'employee' ? 'Track your visits and collect payments' : 'Monitor your team performance'}
        </p>
      </div>

      {/* Location Status for Employees */}
      {user?.role === 'employee' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Navigation className={`h-6 w-6 ${isTracking ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Location Status</h3>
                <p className="text-sm text-gray-600">
                  {isTracking ? 'Location tracking is active' : 'Location tracking is inactive'}
                </p>
              </div>
            </div>
            {!isTracking && (
              <button
                onClick={requestLocationPermission}
                className="btn btn-primary"
              >
                Enable Location
              </button>
            )}
          </div>
          {currentLocation && (
            <div className="mt-4 text-sm text-gray-500">
              Last update: {currentLocation.timestamp?.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Active Visit Alert for Employees */}
      {user?.role === 'employee' && activeVisit && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Active Visit</h4>
              <p className="text-sm text-blue-700">
                You have an ongoing visit to {activeVisit.customer?.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'employee' ? (
          <>
            <StatCard
              title="My Customers"
              value={stats.totalCustomers || 0}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Today's Visits"
              value={stats.todayVisits || 0}
              icon={MapPin}
              color="green"
            />
            <StatCard
              title="Completed Visits"
              value={stats.completedVisits || 0}
              icon={CheckCircle}
              color="purple"
            />
            <StatCard
              title="Today's Collections"
              value={`₹${stats.todayAmount || 0}`}
              icon={CreditCard}
              color="yellow"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees || 0}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Active Employees"
              value={stats.activeEmployees || 0}
              icon={Navigation}
              color="green"
            />
            <StatCard
              title="Today's Visits"
              value={stats.todayVisits || 0}
              icon={MapPin}
              color="purple"
            />
            <StatCard
              title="Today's Collections"
              value={`₹${stats.todayAmount || 0}`}
              icon={CreditCard}
              color="yellow"
            />
          </>
        )}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
        </div>
        <div className="p-6">
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'visit' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <activity.icon className={`h-4 w-4 ${
                      activity.type === 'visit' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  {activity.amount && (
                    <span className="text-sm font-medium text-green-600">
                      ₹{activity.amount}
                    </span>
                  )}
                  {activity.status && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activity.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : activity.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status.replace('_', ' ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activities</p>
          )}
        </div>
      </div>
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

export default Dashboard;
