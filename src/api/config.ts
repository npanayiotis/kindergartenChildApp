// src/api/config.ts
// Configure the base URL to your deployed website on Render.com
export const API_BASE_URL = 'https://findyournanny.onrender.com/api/mobile';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
