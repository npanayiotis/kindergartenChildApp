// REST API Service for Mobile App - FIXED TypeScript Errors
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChildActivity, BlogPost, User, Child} from '../types';
import auth from '@react-native-firebase/auth';
import {API_CONFIG, buildApiUrl, buildQueryParams} from '../config/api';

console.log('🌐 REST API Service initializing...');

// Use configuration from config file
const {BASE_URL, ENDPOINTS, REQUEST, POLLING, DEFAULT_HEADERS} = API_CONFIG;

// Helper function to get Firebase ID token
const getAuthToken = async (): Promise<string> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  try {
    // Get fresh ID token (Firebase handles caching automatically)
    const token = await currentUser.getIdToken(false); // false = use cached token if valid
    console.log('🔑 [API] Retrieved Firebase ID token');
    return token;
  } catch (error) {
    console.error('❌ [API] Failed to get ID token:', error);
    throw new Error('Failed to retrieve authentication token');
  }
};

// Helper function to make authenticated API requests with retry logic
const makeAuthenticatedRequest = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0,
): Promise<Response> => {
  try {
    const token = await getAuthToken();

    const requestHeaders = {
      ...DEFAULT_HEADERS,
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const requestOptions: RequestInit = {
      ...options,
      headers: requestHeaders,
    };

    const url = buildApiUrl(endpoint);
    console.log(`📡 [API] Making request to: ${url}`);

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ [API] Request failed: ${response.status} ${response.statusText}`,
        errorText,
      );

      // Handle specific status codes
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Check your permissions.');
      } else if (response.status === 404) {
        throw new Error('Resource not found.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }

      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response;
  } catch (error) {
    console.error(`❌ [API] Request error (attempt ${retryCount + 1}):`, error);

    // Retry logic for network errors (fixed TypeScript error)
    if (
      retryCount < REQUEST.RETRY_ATTEMPTS &&
      (error instanceof TypeError ||
        (error instanceof Error && error.message.includes('timeout')))
    ) {
      console.log(
        `🔄 [API] Retrying request... (${retryCount + 1}/${
          REQUEST.RETRY_ATTEMPTS
        })`,
      );
      await new Promise(resolve =>
        setTimeout(resolve, REQUEST.RETRY_DELAY * (retryCount + 1)),
      );
      return makeAuthenticatedRequest(endpoint, options, retryCount + 1);
    }

    throw error;
  }
};

// Helper function to convert Firebase user to our User type
const convertFirebaseUser = async (fbUser: any): Promise<User> => {
  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    role: 'parent', // Default role, you can fetch this from your API
    profileImage: fbUser.photoURL || undefined,
  };
};

interface AuthResponse {
  token: string;
  user: User;
}

// Main API Service Class
class RestApiService {
  // Authentication methods
  auth = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      try {
        console.log('🔐 [API] Attempting Firebase sign in with:', email);
        const userCredential = await auth().signInWithEmailAndPassword(
          email,
          password,
        );

        if (!userCredential.user) {
          throw new Error('Authentication failed - no user returned');
        }

        const user = await convertFirebaseUser(userCredential.user);
        await AsyncStorage.setItem('user_data', JSON.stringify(user));

        // Get Firebase ID token for immediate use
        const token = await userCredential.user.getIdToken();
        await AsyncStorage.setItem('auth_token', token);

        console.log('✅ [API] Login completed successfully for:', user.email);
        return {token, user};
      } catch (error) {
        console.error('❌ [API] Login error:', error);
        throw error;
      }
    },

    logout: async (): Promise<void> => {
      try {
        console.log('🚪 [API] Signing out from Firebase');
        await auth().signOut();
        await AsyncStorage.removeItem('user_data');
        await AsyncStorage.removeItem('auth_token');
        console.log('✅ [API] Logout completed');
      } catch (error) {
        console.error('❌ [API] Logout error:', error);
        throw error;
      }
    },
  };

  // Children management using REST API
  children = {
    // Get all children for the current parent from REST API
    getAllForParent: async (): Promise<Child[]> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log(
          '👶 [API] Fetching children for parent from REST API:',
          currentUser.email,
        );

        const response = await makeAuthenticatedRequest(
          ENDPOINTS.PARENT_CHILDREN,
          {
            method: 'GET',
          },
        );

        const data = await response.json();

        // Assuming your API returns an array of children or {children: [...]}
        const children: Child[] = Array.isArray(data)
          ? data
          : data.children || [];

        // Map the API response to our Child interface
        const mappedChildren: Child[] = children.map((child: any) => ({
          id: child.id || child._id || '', // Handle different ID formats
          name: child.name || child.childName || '',
          kindergartenId: child.kindergartenId || child.kindergarten_id || '',
          userId:
            child.userId || child.parentId || child.user_id || currentUser.uid,
          dateOfBirth: child.dateOfBirth || child.date_of_birth,
          profileImage: child.profileImage || child.profile_image,
          medicalInfo: child.medicalInfo || child.medical_info,
          emergencyContact: child.emergencyContact || child.emergency_contact,
          createdAt:
            child.createdAt || child.created_at || new Date().toISOString(),
          updatedAt:
            child.updatedAt || child.updated_at || new Date().toISOString(),
        }));

        console.log(
          '✅ [API] Found',
          mappedChildren.length,
          'children via REST API',
        );
        return mappedChildren;
      } catch (error) {
        console.error('❌ [API] Error fetching children from REST API:', error);
        throw error;
      }
    },

    // Set up polling for real-time updates (since REST doesn't support real-time by default)
    subscribeToChildren: (onChildrenUpdate: (children: Child[]) => void) => {
      console.log('🔗 [API] Setting up children polling (REST API)');

      let pollInterval: ReturnType<typeof setInterval>; // Fixed TypeScript error

      const poll = async () => {
        try {
          const children = await this.children.getAllForParent();
          onChildrenUpdate(children);
        } catch (error) {
          console.error('❌ [API] Error polling children:', error);
        }
      };

      // Initial fetch
      poll();

      // Poll every 30 seconds for updates
      pollInterval = setInterval(poll, POLLING.CHILDREN);

      // Return unsubscribe function
      return () => {
        console.log('🔌 [API] Stopping children polling');
        clearInterval(pollInterval);
      };
    },
  };

  // Child Activities using REST API
  childActivities = {
    // Get all activities for parent from REST API
    getAllForParent: async (): Promise<ChildActivity[]> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log(
          '📦 [API] Fetching all child activities for parent from REST API',
        );

        // Get children first
        const children = await this.children.getAllForParent();

        if (children.length === 0) {
          console.log('ℹ️ [API] No children found for parent');
          return [];
        }

        // Fetch activities for each child (last 7 days)
        let allActivities: ChildActivity[] = [];

        for (const child of children) {
          try {
            const childActivities =
              await this.childActivities.getByChildAndDate(
                child.id,
                new Date(), // Today
              );
            allActivities = allActivities.concat(childActivities);
          } catch (error) {
            console.warn(
              `⚠️ [API] Failed to fetch activities for child ${child.name}:`,
              error,
            );
          }
        }

        // Sort by timestamp
        allActivities.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        console.log('✅ [API] Found', allActivities.length, 'total activities');
        return allActivities;
      } catch (error) {
        console.error('❌ [API] Error fetching all child activities:', error);
        throw error;
      }
    },

    // Get activities for a specific child by date from REST API
    getByChildAndDate: async (
      childId: string,
      date: Date,
    ): Promise<ChildActivity[]> => {
      try {
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        const endpoint = `${
          ENDPOINTS.PARENT_ACTIVITIES
        }/${childId}${buildQueryParams({date: dateString})}`;

        console.log(
          '📦 [API] Fetching activities for child:',
          childId,
          'on date:',
          dateString,
        );

        const response = await makeAuthenticatedRequest(endpoint, {
          method: 'GET',
        });

        const data = await response.json();

        // Assuming your API returns an array of activities or {activities: [...]}
        const activities: any[] = Array.isArray(data)
          ? data
          : data.activities || [];

        // Map the API response to our ChildActivity interface
        const mappedActivities: ChildActivity[] = activities.map(
          (activity: any) => ({
            id: activity.id || activity._id || '',
            childId: activity.childId || activity.child_id || childId,
            childName: activity.childName || activity.child_name || '',
            type: activity.type || '',
            subtype: activity.subtype || activity.sub_type || '',
            timestamp:
              activity.timestamp ||
              activity.created_at ||
              new Date().toISOString(),
            details: activity.details || activity.description || '',
            createdBy: activity.createdBy || activity.created_by || '',
            kindergartenId:
              activity.kindergartenId || activity.kindergarten_id || '',
            deleted: activity.deleted || false,
            mood: activity.mood,
            photos: activity.photos || [],
            duration: activity.duration,
            quantity: activity.quantity,
          }),
        );

        console.log(
          '✅ [API] Found',
          mappedActivities.length,
          'activities for child',
        );
        return mappedActivities;
      } catch (error) {
        console.error(
          '❌ [API] Error fetching child activities by date:',
          error,
        );
        throw error;
      }
    },

    // Set up polling for real-time activity updates
    subscribeToChildActivities: (
      childId: string,
      date: Date,
      onActivitiesUpdate: (activities: ChildActivity[]) => void,
    ) => {
      console.log('🔗 [API] Setting up activity polling for child:', childId);

      let pollInterval: ReturnType<typeof setInterval>; // Fixed TypeScript error

      const poll = async () => {
        try {
          const activities = await this.childActivities.getByChildAndDate(
            childId,
            date,
          );
          onActivitiesUpdate(activities);
        } catch (error) {
          console.error('❌ [API] Error polling activities:', error);
        }
      };

      // Initial fetch
      poll();

      // Poll every 15 seconds for activity updates
      pollInterval = setInterval(poll, POLLING.ACTIVITIES);

      // Return unsubscribe function
      return () => {
        console.log('🔌 [API] Stopping activity polling');
        clearInterval(pollInterval);
      };
    },

    // For kindergarten users (if needed)
    getAllForKindergarten: async (): Promise<ChildActivity[]> => {
      // This would require a different endpoint for kindergarten users
      // Implement based on your API structure
      throw new Error(
        'Not implemented - contact API team for kindergarten endpoint',
      );
    },

    // Backward compatibility
    getChildren: async (): Promise<
      Array<{id: string; name: string; kindergartenId: string}>
    > => {
      console.warn(
        '⚠️ [API] getChildren() is deprecated. Use children.getAllForParent() instead.',
      );
      const children = await this.children.getAllForParent();
      return children.map(child => ({
        id: child.id,
        name: child.name,
        kindergartenId: child.kindergartenId,
      }));
    },
  };

  // Legacy childStatus endpoints (backward compatibility)
  childStatus = {
    getAll: async (): Promise<any[]> => {
      // Redirect to new activities endpoint
      const activities = await this.childActivities.getAllForParent();
      return activities; // Return activities as-is for backward compatibility
    },

    getAllForKindergarten: async (): Promise<any[]> => {
      const activities = await this.childActivities.getAllForKindergarten();
      return activities;
    },
  };

  // Blog posts (REST API)
  blog = {
    getAll: async (
      page: number = 1,
      pageSize: number = 10,
      kindergartenId: string | null = null,
    ) => {
      try {
        console.log('📰 [API] Fetching blog posts from REST API');

        const queryParams = buildQueryParams({
          page,
          pageSize,
          ...(kindergartenId && {kindergartenId}),
        });

        const response = await makeAuthenticatedRequest(
          `${ENDPOINTS.BLOG}${queryParams}`,
          {
            method: 'GET',
          },
        );

        const data = await response.json();

        return {
          posts: data.posts || [],
          total: data.total || 0,
          page: data.page || page,
          pageSize: data.pageSize || pageSize,
        };
      } catch (error) {
        console.error('❌ [API] Error fetching blog posts:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<BlogPost> => {
      try {
        const response = await makeAuthenticatedRequest(
          `${ENDPOINTS.BLOG}/${id}`,
          {
            method: 'GET',
          },
        );

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('❌ [API] Error fetching blog post:', error);
        throw error;
      }
    },
  };

  // Utility method to test API connection
  testConnection = async (): Promise<boolean> => {
    try {
      console.log('🔧 [API] Testing REST API connection...');

      // Try to fetch children as a connectivity test
      await this.children.getAllForParent();

      console.log('✅ [API] REST API connection successful');
      return true;
    } catch (error) {
      console.error('❌ [API] REST API connection failed:', error);
      return false;
    }
  };
}

// Create and export a single instance
const apiService = new RestApiService();
export default apiService;

// Export configuration for easy updates
export const API_CONFIG_EXPORT = {
  BASE_URL,
  ENDPOINTS,
  POLLING_INTERVALS: POLLING,
};

// Export types for convenience
export type {Child, ChildActivity, User, BlogPost};
