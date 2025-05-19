// src/api/auth.ts
import axios from 'axios';
import {API_BASE_URL, ApiResponse} from './config';

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
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    console.log('Login successful');
    return {data: response.data};
  } catch (error) {
    console.log(`Login error details: ${JSON.stringify(error)}`);
    if (axios.isAxiosError(error) && error.response) {
      console.log(`Server response: ${JSON.stringify(error.response.data)}`);
      return {error: error.response.data.error || 'Login failed'};
    }
    return {error: 'Network error. Please check your connection.'};
  }
}

export async function logout(): Promise<void> {
  // If your backend requires logout, implement it here
  return Promise.resolve();
}

export async function getAuthHeader(
  token: string,
): Promise<Record<string, string>> {
  return {
    Authorization: `Bearer ${token}`,
  };
}
