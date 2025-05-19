// src/api/config.ts
// Configure the base URL to your deployed website
export const API_BASE_URL = 'https://findyournannyincyprus.com/api/mobile';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
