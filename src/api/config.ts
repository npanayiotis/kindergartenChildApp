/**
 * API Configuration
 *
 * This file uses Firebase instances from global scope.
 * These globals are set in the firebase.js file that's imported in index.js
 * before any other imports.
 */

import axios from 'axios';

// Use the globally initialized Firebase components
// This prevents circular dependencies and timing issues
declare global {
  var firebaseApp: any;
  var firebaseAuth: any;
  var firebaseDB: any;
  var firebaseStorage: any;
}

// Get Firebase components from global scope
const app = global.firebaseApp;
const auth = global.firebaseAuth;
const db = global.firebaseDB;
const storage = global.firebaseStorage;

// Create API client configuration
const API_BASE_URL = 'https://findyournanny.onrender.com/api/mobile';

// Create axios client for API calls
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add request interceptor to log API calls for debugging
apiClient.interceptors.request.use(
  config => {
    console.log(`[API] Request to ${config.url}`);
    return config;
  },
  error => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  },
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  response => {
    console.log(
      `[API] Response from ${response.config.url} - Status: ${response.status}`,
    );
    return response;
  },
  error => {
    console.error('[API] Response error:', error);
    return Promise.reject(error);
  },
);

export {app, auth, db, storage, API_BASE_URL};
