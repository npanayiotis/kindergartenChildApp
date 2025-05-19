import {apiClient, API_BASE_URL, ApiResponse} from './config';

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

export async function login(
  email: string,
  password: string,
): Promise<ApiResponse<AuthResponse>> {
  console.log(`Attempting login to: ${API_BASE_URL}/auth/login`);

  try {
    // Using the axios instance with proper configuration
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });

    console.log('Login successful');
    return {data: response.data};
  } catch (error: any) {
    console.log(
      `Login error details: ${JSON.stringify(
        error,
        Object.getOwnPropertyNames(error),
      )}`,
    );

    // Enhanced error handling
    if (error.response) {
      // Server responded with an error
      console.log(`Server response: ${JSON.stringify(error.response.data)}`);
      return {error: error.response.data.error || 'Login failed'};
    } else if (error.request) {
      // Request was made but no response received
      console.log('No response received from server');
      return {
        error:
          'No response received from server. Please check your connection.',
      };
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      return {error: 'Request timed out. Please try again.'};
    } else {
      // Something else went wrong
      return {
        error: error.message || 'Network error. Please check your connection.',
      };
    }
  }
}

export async function logout(): Promise<void> {
  // If your backend requires logout, implement it here
  return Promise.resolve();
}

export function getAuthHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}
