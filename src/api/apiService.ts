// API service for mobile app
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChildStatus, BlogPost, User } from '../types';

// Base URL of your API
const API_URL = 'https://findyournanny.onrender.com/api/mobile';

// Utility function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  const data = text && JSON.parse(text);

  if (!response.ok) {
    const error = (data && data.error) || response.statusText;
    return Promise.reject(error);
  }

  return data as T;
};

// Get token from AsyncStorage
const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('user_token');
  } catch (error) {
    console.error('Failed to get token', error);
    return null;
  }
};

// Helper function to create fetch options with auth header
interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

const authHeader = async (options: FetchOptions = {}): Promise<FetchOptions> => {
  const token = await getToken();

  return {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
  };
};

// Auth response type
interface AuthResponse {
  token: string;
  user: User;
}

// API methods
const apiService = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
      });

      const data = await handleResponse<AuthResponse>(response);

      // Store token for subsequent requests
      if (data.token) {
        await AsyncStorage.setItem('user_token', data.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      }

      return data;
    },

    logout: async (): Promise<void> => {
      await AsyncStorage.removeItem('user_token');
      await AsyncStorage.removeItem('user_data');
    },
  },

  // Child status endpoints
  childStatus: {
    getAll: async (): Promise<ChildStatus[]> => {
      const options = await authHeader();
      const response = await fetch(`${API_URL}/childStatus`, options);
      return handleResponse<ChildStatus[]>(response);
    },

    getById: async (id: string): Promise<ChildStatus> => {
      const options = await authHeader();
      const response = await fetch(`${API_URL}/childStatus/${id}`, options);
      return handleResponse<ChildStatus>(response);
    },

    update: async (id: string, data: Partial<ChildStatus>): Promise<ChildStatus> => {
      const options = await authHeader({
        method: 'PUT',
        body: JSON.stringify(data),
      });

      const response = await fetch(`${API_URL}/childStatus/${id}`, options);
      return handleResponse<ChildStatus>(response);
    },
  },

  // Blog posts endpoints
  blog: {
    getAll: async (page: number = 1, pageSize: number = 10, kindergartenId: string | null = null): Promise<{
      posts: BlogPost[];
      total: number;
      page: number;
      pageSize: number;
    }> => {
      const options = await authHeader();
      let url = `${API_URL}/blog?page=${page}&pageSize=${pageSize}`;

      if (kindergartenId) {
        url += `&kindergartenId=${kindergartenId}`;
      }

      const response = await fetch(url, options);
      return handleResponse(response);
    },

    getById: async (id: string): Promise<BlogPost> => {
      const options = await authHeader();
      const response = await fetch(`${API_URL}/blog/${id}`, options);
      return handleResponse<BlogPost>(response);
    },
  },
};

export default apiService; 