import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocation as useLocationContext } from '../contexts/LocationContext';
import { 
  Home, 
  Users, 
  MapPin, 
  CreditCard, 
  BarChart3, 
  User, 
  LogOut, 
  Menu, 
  X,
  Navigation,
  UserCheck,
  Clock,
  Calendar
} from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { currentLocation, isTracking } = useLocationContext();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'manager', 'employee'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['admin', 'manager', 'employee'] },
    { name: 'Visits', href: '/visits', icon: MapPin, roles: ['admin', 'manager', 'employee'] },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['admin', 'manager', 'employee'] },
    { name: 'Attendance', href: '/attendance', icon: Clock, roles: ['admin', 'manager', 'employee'] },
    { name: 'Leave', href: '/leave', icon: Calendar, roles: ['admin', 'manager', 'employee'] },
    { name: 'Live Tracking', href: '/live-tracking', icon: Navigation, roles: ['admin', 'manager'] },
    { name: 'Employees', href: '/employees', icon: UserCheck, roles: ['admin', 'manager'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">Field Tracker</h1>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            {user?.role === 'employee' && (
              <div className="mb-4 p-2 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-600">
                    {isTracking ? 'Location Active' : 'Location Inactive'}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          <div className="flex h-16 items-center px-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">Field Tracker</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                {user?.employeeId && (
                  <p className="text-xs text-gray-400">ID: {user.employeeId}</p>
                )}
              </div>
            </div>
            {user?.role === 'employee' && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Location Status</span>
                  <div className={`h-2 w-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <p className="text-xs text-gray-600">
                  {isTracking ? 'Tracking active' : 'Tracking inactive'}
                </p>
                {currentLocation && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last update: {currentLocation.timestamp?.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
            <Link
              to="/profile"
              className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors mb-2"
            >
              <User className="mr-3 h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 lg:hidden">
          <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm">
            <button
              type="button"
              className="text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
              Field Tracker
            </div>
            <div className="flex items-center space-x-2">
              {user?.role === 'employee' && (
                <div className={`h-2 w-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
              )}
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
