import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Visits from './pages/Visits';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import LiveTracking from './pages/LiveTracking';
import EmployeeManagement from './pages/EmployeeManagement';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="visits" element={<Visits />} />
        <Route path="payments" element={<Payments />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave" element={<LeaveManagement />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Admin/Manager only routes */}
        <Route 
          path="reports" 
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="live-tracking" 
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <LiveTracking />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="employees" 
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <EmployeeManagement />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <SocketProvider>
          <Router>
            <div className="App">
              <AppRoutes />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </div>
          </Router>
        </SocketProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
