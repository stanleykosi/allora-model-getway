import axios from 'axios';

// The server URL - defaults to current domain for production, localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to add auth token to a request config
export const addAuthToken = (config: any, token: string | null) => {
  // Ensure config and headers exist
  if (!config) {
    config = {};
  }
  if (!config.headers) {
    config.headers = {};
  }

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
    console.log('✅ Authorization header added');
  } else {
    console.log('❌ No token available, request will fail');
  }
  return config;
};

// Interceptor to log requests (but not add tokens automatically)
apiClient.interceptors.request.use(
  async (config) => {
    console.log('🌐 Making API request to:', config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

export default apiClient; 