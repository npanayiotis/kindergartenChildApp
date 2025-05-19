// src/api/childStatus.ts
import axios from 'axios';
import { API_BASE_URL, ApiResponse } from './config';
import { getAuthHeader } from './auth';

export interface ChildStatus {
  id: string;
  childId: string;
  childName: string;
  mood?: string;
  meal?: string;
  nap?: string;
  activity?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChildStatusDetail extends ChildStatus {
  child: {
    id: string;
    name: string;
    birthDate?: string;
    allergies?: string[];
    specialNeeds?: string;
  };
}

export async function getChildStatuses(token: string): Promise<ApiResponse<ChildStatus[]>> {
  try {
    const headers = getAuthHeader(token);
    const response = await axios.get(`${API_BASE_URL}/childStatus`, { headers });
    return { data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return { error: error.response.data.error || 'Failed to fetch child statuses' };
    }
    return { error: 'Network error. Please check your connection.' };
  }
}

export async function getChildStatusDetails(token: string, id: string): Promise<ApiResponse<ChildStatusDetail>> {
  try {
    const headers = getAuthHeader(token);
    const response = await axios.get(`${API_BASE_URL}/childStatus/${id}`, { headers });
    return { data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return { error: error.response.data.error || 'Failed to fetch child status details' };
    }
    return { error: 'Network error. Please check your connection.' };
  }
}
