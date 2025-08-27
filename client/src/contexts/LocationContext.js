import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const { user, updateLocation } = useAuth();

  // Get current position once
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          };
          setCurrentLocation(location);
          setLocationError(null);
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Unable to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred';
              break;
          }
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Start continuous location tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    if (isTracking) {
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        };
        
        setCurrentLocation(location);
        setLocationError(null);
        
        // Update location on server if user is logged in
        if (user) {
          updateLocation(location.latitude, location.longitude);
        }
      },
      (error) => {
        let errorMessage = 'Unable to track location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'Location tracking error';
            break;
        }
        setLocationError(errorMessage);
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );

    setWatchId(id);
    setIsTracking(true);
  };

  // Stop location tracking
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      // Using a free geocoding service (you can replace with Google Maps API)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      return data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Start tracking when user logs in
  useEffect(() => {
    if (user && user.role === 'employee') {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [user]);

  const value = {
    currentLocation,
    locationError,
    isTracking,
    getCurrentPosition,
    startTracking,
    stopTracking,
    getAddressFromCoords,
    calculateDistance
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
