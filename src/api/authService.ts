import {
  login as firebaseLogin,
  register as firebaseRegister,
  logout as firebaseLogout,
  AuthResult,
} from './auth';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'https://findyournanny.onrender.com/api/mobile';

// Axios instance for API calls
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Login using Firebase first, then authenticate with the API
export async function login(
  email: string,
  password: string,
): Promise<ApiResponse<AuthResponse>> {
  try {
    // First, try Firebase Auth
    const firebaseResult = await firebaseLogin(email, password);

    if (firebaseResult.error) {
      console.log('Firebase login failed, trying API login');

      // If Firebase fails, try the API login
      try {
        const response = await apiClient.post('/auth/login', {
          email,
          password,
        });

        console.log('API Login successful');
        return {data: response.data};
      } catch (error: any) {
        console.log('API login error:', error);

        // Enhanced error handling for API errors
        if (error.response) {
          return {error: error.response.data.error || 'Login failed'};
        } else if (error.request) {
          return {
            error:
              'No response received from server. Please check your connection.',
          };
        } else {
          return {
            error:
              error.message || 'Network error. Please check your connection.',
          };
        }
      }
    }

    // Firebase login was successful, convert to expected format
    const user = firebaseResult.user;

    // Now authenticate with the API using Firebase credentials
    try {
      // You might need to get a Firebase ID token to send to your API
      // For now, let's just return the Firebase user in the expected format
      return {
        data: {
          token: 'firebase-auth', // Placeholder, replace with actual token if needed
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: user.userType,
          },
        },
      };
    } catch (error: any) {
      console.log('Error authenticating with API after Firebase login:', error);
      return {error: 'Error connecting to the server after login.'};
    }
  } catch (error: any) {
    console.log('Unhandled login error:', error);
    return {error: 'An unexpected error occurred during login.'};
  }
}

// Register using Firebase, then create account in the API
export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<ApiResponse<AuthResponse>> {
  try {
    // First, register with Firebase
    const firebaseResult = await firebaseRegister(
      email,
      password,
      firstName,
      lastName,
    );

    if (firebaseResult.error) {
      return {error: firebaseResult.error};
    }

    // Firebase registration successful, now register with the API
    // This depends on your API's registration endpoint
    return {
      data: {
        token: 'firebase-auth', // Placeholder
        user: {
          id: firebaseResult.user.id,
          email: firebaseResult.user.email,
          firstName: firebaseResult.user.firstName,
          lastName: firebaseResult.user.lastName,
          userType: firebaseResult.user.userType,
        },
      },
    };
  } catch (error: any) {
    console.log('Registration error:', error);
    return {error: 'An error occurred during registration.'};
  }
}

// Logout from both Firebase and the API
export async function logout(): Promise<ApiResponse<void>> {
  try {
    await firebaseLogout();
    // Also logout from API if needed
    // await apiClient.post('/auth/logout');
    return {data: undefined};
  } catch (error: any) {
    return {error: 'Error logging out.'};
  }
}

// Get the auth header (for API requests that need authentication)
export function getAuthHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}
