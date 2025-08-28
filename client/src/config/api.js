// API Configuration for Field Tracker App

// Base URL for API calls - Using Netlify Functions
const API_BASE_URL = process.env.NODE_ENV === 'production' 
                       ? '/.netlify/functions'  // Netlify Functions
                       : 'http://localhost:5000';

export { API_BASE_URL };

// Axios default configuration
import axios from 'axios';

// Set base URL for all axios requests
axios.defaults.baseURL = API_BASE_URL;

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;
