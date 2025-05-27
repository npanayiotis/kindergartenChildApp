// API Configuration - src/config/api.ts
// 🔧 UPDATE THE BASE_URL WITH YOUR ACTUAL API DOMAIN

export const API_CONFIG = {
  // 🚨 IMPORTANT: Replace this with your actual API domain
  // Example: 'https://findyournanny.onrender.com' or 'https://your-api-domain.com'
  BASE_URL: 'https://findyournanny.onrender.com',

  // API Endpoints (matching your backend routes)
  ENDPOINTS: {
    // Parent endpoints
    PARENT_CHILDREN: '/api/mobile/parent/children',
    PARENT_ACTIVITIES: '/api/mobile/parent/activities', // Will append /[childId]?date=YYYY-MM-DD

    // Additional endpoints
    AUTH_LOGIN: '/api/mobile/auth/login',
    BLOG: '/api/mobile/blog',
    KINDERGARTEN_ACTIVITIES: '/api/mobile/kindergarten/activities',
  },

  // Request configuration
  REQUEST: {
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },

  // Polling intervals for real-time updates (in milliseconds)
  POLLING: {
    CHILDREN: 30000, // 30 seconds
    ACTIVITIES: 15000, // 15 seconds
    BLOG: 60000, // 1 minute
  },

  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;

// Helper function to build URLs
export const buildApiUrl = (endpoint: string, baseUrl?: string): string => {
  const base = baseUrl || API_CONFIG.BASE_URL;
  return `${base}${endpoint}`;
};

// Helper function to build query parameters
export const buildQueryParams = (
  params: Record<string, string | number | boolean | undefined>,
): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Environment-specific configurations
export const getApiConfig = (
  environment: 'development' | 'staging' | 'production' = 'production',
) => {
  const configs = {
    development: {
      ...API_CONFIG,
      BASE_URL: 'http://localhost:3000', // Your local development server
    },
    staging: {
      ...API_CONFIG,
      BASE_URL: 'https://staging-api.your-domain.com', // Your staging server
    },
    production: {
      ...API_CONFIG,
      BASE_URL: 'https://findyournanny.onrender.com', // Your production server
    },
  };

  return configs[environment];
};

// Export types
export type ApiEnvironment = 'development' | 'staging' | 'production';
export type ApiEndpoint = keyof typeof API_CONFIG.ENDPOINTS;
