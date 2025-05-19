import axios from 'axios';

// Configure the base URL to your deployed website on Render.com
export const API_BASE_URL = 'https://findyournanny.onrender.com/api/mobile';

// Create a configured axios instance with proper timeout and headers
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Log the error for debugging
    console.error('API Error:', error);

    if (error.code === 'ECONNABORTED') {
      console.log('Request timeout');
    }

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('Error response data:', error.response.data);
      console.log('Error response status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received:', error.request);
    }

    return Promise.reject(error);
  },
);

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
