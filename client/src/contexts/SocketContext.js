import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          userId: user.id,
          role: user.role
        }
      });

      newSocket.on('connect', () => {
        setConnected(true);
        console.log('Socket connected:', newSocket.id);
        
        // Join employee room for real-time updates
        if (user.role === 'employee') {
          newSocket.emit('join-employee', user.id);
        }
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
        console.log('Socket disconnected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user]);

  // Emit location update
  const emitLocationUpdate = (locationData) => {
    if (socket && connected) {
      socket.emit('location-update', {
        employeeId: user.id,
        ...locationData,
        timestamp: new Date()
      });
    }
  };

  // Subscribe to location updates (for admin/manager)
  const subscribeToLocationUpdates = (callback) => {
    if (socket && connected) {
      socket.on('employee-location-update', callback);
      
      return () => {
        socket.off('employee-location-update', callback);
      };
    }
  };

  // Emit visit status update
  const emitVisitUpdate = (visitData) => {
    if (socket && connected) {
      socket.emit('visit-update', {
        employeeId: user.id,
        ...visitData,
        timestamp: new Date()
      });
    }
  };

  // Subscribe to visit updates
  const subscribeToVisitUpdates = (callback) => {
    if (socket && connected) {
      socket.on('visit-update', callback);
      
      return () => {
        socket.off('visit-update', callback);
      };
    }
  };

  const value = {
    socket,
    connected,
    emitLocationUpdate,
    subscribeToLocationUpdates,
    emitVisitUpdate,
    subscribeToVisitUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
