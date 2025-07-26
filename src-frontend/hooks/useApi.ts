import { useAuth } from '@clerk/clerk-react';
import apiClient, { addAuthToken } from '@/lib/api';

export const useApi = () => {
  const { getToken } = useAuth();

  const makeAuthenticatedRequest = async (method: string, url: string, data?: any, config = {}) => {
    try {
      const token = await getToken();
      console.log('🔐 Clerk token retrieved:', token ? 'YES' : 'NO');
      if (token) {
        console.log('🔐 Token preview:', token.substring(0, 20) + '...');
      }
      
      const authenticatedConfig = addAuthToken(config, token);
      
      switch (method) {
        case 'GET':
          return apiClient.get(url, authenticatedConfig);
        case 'POST':
          return apiClient.post(url, data, authenticatedConfig);
        case 'PUT':
          return apiClient.put(url, data, authenticatedConfig);
        case 'DELETE':
          return apiClient.delete(url, authenticatedConfig);
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    } catch (error) {
      console.error('❌ Failed to make authenticated request:', error);
      throw error;
    }
  };

  return {
    get: (url: string, config = {}) => makeAuthenticatedRequest('GET', url, undefined, config),
    post: (url: string, data?: any, config = {}) => makeAuthenticatedRequest('POST', url, data, config),
    put: (url: string, data?: any, config = {}) => makeAuthenticatedRequest('PUT', url, data, config),
    delete: (url: string, config = {}) => makeAuthenticatedRequest('DELETE', url, undefined, config),
  };
}; 