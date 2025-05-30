// src/api/apiService.ts - Updated with Firebase Firestore Blog Integration
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChildActivity, BlogPost, User, Child} from '../types';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import blogService from './blogService';

console.log('🌐 API Service initializing with Firebase Firestore...');

// Helper function to get Firebase ID token
const getAuthToken = async (): Promise<string> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  try {
    const token = await currentUser.getIdToken(false);
    console.log('🔑 [API] Retrieved Firebase ID token');
    return token;
  } catch (error) {
    console.error('❌ [API] Failed to get ID token:', error);
    throw new Error('Failed to retrieve authentication token');
  }
};

// Helper function to convert Firebase user to our User type
const convertFirebaseUser = async (fbUser: any): Promise<User> => {
  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    role: 'parent', // Default role, you can fetch this from Firestore
    profileImage: fbUser.photoURL || undefined,
  };
};

interface AuthResponse {
  token: string;
  user: User;
}

// Main API Service Class
class ApiService {
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

  // Children management using Firestore
  children = {
    getAllForParent: async (): Promise<Child[]> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log(
          '👶 [API] Fetching children for parent from Firestore:',
          currentUser.email,
        );

        // Query children collection where userId matches current user
        const childrenSnapshot = await firestore()
          .collection('children')
          .where('userId', '==', currentUser.uid)
          .get();

        if (childrenSnapshot.empty) {
          console.log('ℹ️ [API] No children found for parent');
          return [];
        }

        const children: Child[] = childrenSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || data.childName || '',
            kindergartenId: data.kindergartenId || '',
            userId: data.userId || currentUser.uid,
            dateOfBirth: data.dateOfBirth,
            profileImage: data.profileImage,
            medicalInfo: data.medicalInfo,
            emergencyContact: data.emergencyContact,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          };
        });

        console.log(
          '✅ [API] Found',
          children.length,
          'children via Firestore',
        );
        return children;
      } catch (error) {
        console.error(
          '❌ [API] Error fetching children from Firestore:',
          error,
        );
        throw error;
      }
    },

    subscribeToChildren: (onChildrenUpdate: (children: Child[]) => void) => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('🔗 [API] Setting up children real-time listener');

      const unsubscribe = firestore()
        .collection('children')
        .where('userId', '==', currentUser.uid)
        .onSnapshot(
          snapshot => {
            const children: Child[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name || data.childName || '',
                kindergartenId: data.kindergartenId || '',
                userId: data.userId || currentUser.uid,
                dateOfBirth: data.dateOfBirth,
                profileImage: data.profileImage,
                medicalInfo: data.medicalInfo,
                emergencyContact: data.emergencyContact,
                createdAt:
                  data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt:
                  data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
              };
            });

            console.log(
              '🔄 [API] Children updated in real-time:',
              children.length,
            );
            onChildrenUpdate(children);
          },
          error => {
            console.error('❌ [API] Children listener error:', error);
          },
        );

      return unsubscribe;
    },
  };

  // Child Activities using Firestore
  childActivities = {
    getAllForParent: async (): Promise<ChildActivity[]> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log(
          '📦 [API] Fetching all child activities for parent from Firestore',
        );

        // First get children
        const children = await this.children.getAllForParent();

        if (children.length === 0) {
          console.log('ℹ️ [API] No children found for parent');
          return [];
        }

        // Get activities for all children
        let allActivities: ChildActivity[] = [];

        for (const child of children) {
          const activitiesSnapshot = await firestore()
            .collection('childActivities')
            .where('childId', '==', child.id)
            .where('deleted', '!=', true)
            .orderBy('timestamp', 'desc')
            .limit(50) // Limit per child
            .get();

          const childActivities: ChildActivity[] = activitiesSnapshot.docs.map(
            doc => {
              const data = doc.data();
              return {
                id: doc.id,
                childId: data.childId || child.id,
                childName: data.childName || child.name,
                type: data.type || '',
                subtype: data.subtype || '',
                timestamp:
                  data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
                details: data.details || '',
                createdBy: data.createdBy || '',
                kindergartenId: data.kindergartenId || child.kindergartenId,
                deleted: data.deleted || false,
                mood: data.mood,
                photos: data.photos || [],
                duration: data.duration,
                quantity: data.quantity,
              };
            },
          );

          allActivities = allActivities.concat(childActivities);
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

    getByChildAndDate: async (
      childId: string,
      date: Date,
    ): Promise<ChildActivity[]> => {
      try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        console.log(
          '📦 [API] Fetching activities for child:',
          childId,
          'on date:',
          date.toDateString(),
        );

        const activitiesSnapshot = await firestore()
          .collection('childActivities')
          .where('childId', '==', childId)
          .where('timestamp', '>=', startOfDay)
          .where('timestamp', '<=', endOfDay)
          .where('deleted', '!=', true)
          .orderBy('timestamp', 'desc')
          .get();

        const activities: ChildActivity[] = activitiesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            childId: data.childId || childId,
            childName: data.childName || '',
            type: data.type || '',
            subtype: data.subtype || '',
            timestamp:
              data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
            details: data.details || '',
            createdBy: data.createdBy || '',
            kindergartenId: data.kindergartenId || '',
            deleted: data.deleted || false,
            mood: data.mood,
            photos: data.photos || [],
            duration: data.duration,
            quantity: data.quantity,
          };
        });

        console.log(
          '✅ [API] Found',
          activities.length,
          'activities for child',
        );
        return activities;
      } catch (error) {
        console.error(
          '❌ [API] Error fetching child activities by date:',
          error,
        );
        throw error;
      }
    },

    subscribeToChildActivities: (
      childId: string,
      date: Date,
      onActivitiesUpdate: (activities: ChildActivity[]) => void,
    ) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(
        '🔗 [API] Setting up activity real-time listener for child:',
        childId,
      );

      const unsubscribe = firestore()
        .collection('childActivities')
        .where('childId', '==', childId)
        .where('timestamp', '>=', startOfDay)
        .where('timestamp', '<=', endOfDay)
        .where('deleted', '!=', true)
        .orderBy('timestamp', 'desc')
        .onSnapshot(
          snapshot => {
            const activities: ChildActivity[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                childId: data.childId || childId,
                childName: data.childName || '',
                type: data.type || '',
                subtype: data.subtype || '',
                timestamp:
                  data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
                details: data.details || '',
                createdBy: data.createdBy || '',
                kindergartenId: data.kindergartenId || '',
                deleted: data.deleted || false,
                mood: data.mood,
                photos: data.photos || [],
                duration: data.duration,
                quantity: data.quantity,
              };
            });

            console.log(
              '🔄 [API] Activities updated in real-time:',
              activities.length,
            );
            onActivitiesUpdate(activities);
          },
          error => {
            console.error('❌ [API] Activities listener error:', error);
          },
        );

      return unsubscribe;
    },

    getAllForKindergarten: async (): Promise<ChildActivity[]> => {
      throw new Error('Kindergarten functionality not implemented yet');
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

  // Blog posts using the dedicated blog service
  blog = {
    getAll: async (
      page: number = 1,
      pageSize: number = 10,
      kindergartenId: string | null = null,
    ) => {
      try {
        console.log('📰 [API] Fetching blog posts');
        return await blogService.getAll(page, pageSize, kindergartenId);
      } catch (error) {
        console.error('❌ [API] Error fetching blog posts:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<BlogPost> => {
      try {
        console.log('📰 [API] Fetching blog post by ID:', id);
        return await blogService.getById(id);
      } catch (error) {
        console.error('❌ [API] Error fetching blog post:', error);
        throw error;
      }
    },

    // Subscribe to real-time blog updates
    subscribe: (
      onUpdate: (posts: BlogPost[]) => void,
      kindergartenId?: string,
    ) => {
      return blogService.subscribeToBlogs(onUpdate, kindergartenId);
    },
  };

  // Legacy childStatus endpoints (backward compatibility)
  childStatus = {
    getAll: async (): Promise<any[]> => {
      const activities = await this.childActivities.getAllForParent();
      return activities;
    },

    getAllForKindergarten: async (): Promise<any[]> => {
      const activities = await this.childActivities.getAllForKindergarten();
      return activities;
    },
  };

  // Utility method to test connections
  testConnection = async (): Promise<boolean> => {
    try {
      console.log('🔧 [API] Testing Firebase connections...');

      // Test Firestore connection
      await firestore().collection('test').limit(1).get();

      // Test blog service
      await blogService.testConnection();

      console.log('✅ [API] All connections successful');
      return true;
    } catch (error) {
      console.error('❌ [API] Connection test failed:', error);
      return false;
    }
  };

  // Development helper - create mock data
  createMockData = async (): Promise<void> => {
    try {
      console.log('🔧 [API] Creating mock data for development...');

      // Create mock blog posts
      await blogService.createMockPosts();

      console.log('✅ [API] Mock data created successfully');
    } catch (error) {
      console.error('❌ [API] Error creating mock data:', error);
      throw error;
    }
  };
}

// Create and export a single instance
const apiService = new ApiService();
export default apiService;

// Export types for convenience
export type {Child, ChildActivity, User, BlogPost};
