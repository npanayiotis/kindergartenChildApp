// Fixed API service for React Native Firebase - Updated for Child Activities
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChildActivity, BlogPost, User, ChildStatus} from '../types';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

console.log('🔥 API Service initializing with React Native Firebase...');

// Helper function to convert Firebase user to our User type
const convertFirebaseUser = async (fbUser: any): Promise<User> => {
  let role: 'parent' | 'kindergarten' | 'admin' = 'parent';

  try {
    // Try to get additional user data from Firestore
    const userDoc = await firestore().collection('users').doc(fbUser.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.role) {
        role = userData.role as 'parent' | 'kindergarten' | 'admin';
      }
    }
  } catch (error) {
    console.warn('[API] Could not fetch user role from Firestore:', error);
  }

  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || fbUser.name || 'User',
    role: role,
    profileImage: fbUser.photoURL || undefined,
  };
};

// Auth response type
interface AuthResponse {
  token: string;
  user: User;
}

const apiService = {
  // Auth endpoints
  auth: {
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

        console.log('✅ [API] Firebase authentication successful');

        // Convert Firebase user to our app's User type
        const user = await convertFirebaseUser(userCredential.user);

        // Store user data for our app
        await AsyncStorage.setItem('user_data', JSON.stringify(user));

        // Generate a token
        const token = 'firebase-token-' + Date.now();
        await AsyncStorage.setItem('auth_token', token);

        console.log('✅ [API] Login completed successfully for:', user.email);

        return {
          token,
          user,
        };
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
  },

  // Child Activities endpoints - FIXED FOR RESERVATIONS STRUCTURE
  childActivities: {
    // Get all activities for children associated with the current parent
    getAllForParent: async (): Promise<ChildActivity[]> => {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log(
          '📦 [API] Fetching child activities for parent:',
          currentUser.uid,
        );

        // STEP 1: Find reservations for this parent
        console.log('🔍 [API] Looking for reservations for parent...');
        const reservationsSnapshot = await firestore()
          .collection('reservations')
          .where('userId', '==', currentUser.uid)
          .get();

        if (reservationsSnapshot.empty) {
          console.log('ℹ️ [API] No reservations found for this parent');
          return [];
        }

        // STEP 2: Extract child names from reservations
        const childNames: string[] = [];
        const reservationData: any[] = [];

        reservationsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.childName) {
            childNames.push(data.childName);
            reservationData.push({
              id: doc.id,
              childName: data.childName,
              kindergartenId: data.kindergartenId,
              status: data.status,
              ...data,
            });
          }
        });

        console.log('✅ [API] Found reservations for children:', childNames);
        console.log('📊 [API] Reservation details:', reservationData);

        if (childNames.length === 0) {
          console.log('ℹ️ [API] No child names found in reservations');
          return [];
        }

        // STEP 3: Find child activities for these children
        console.log(
          '🔍 [API] Looking for activities for children:',
          childNames,
        );

        const activitiesSnapshot = await firestore()
          .collection('childActivities')
          .where('childName', 'in', childNames)
          .where('deleted', '==', false)
          .orderBy('timestamp', 'desc')
          .limit(100)
          .get();

        if (activitiesSnapshot.empty) {
          console.log('ℹ️ [API] No activities found for these children');
          console.log(
            '🔧 [API] DEBUG: Looking for activities with childName in:',
            childNames,
          );

          // DEBUG: Let's see what activities exist
          const allActivitiesSnapshot = await firestore()
            .collection('childActivities')
            .where('deleted', '==', false)
            .limit(10)
            .get();

          console.log('🔍 [API] All activities in database:');
          allActivitiesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(
              `  - Activity ID: ${doc.id}, Child: ${data.childName}, Type: ${data.type}`,
            );
          });

          return [];
        }

        // STEP 4: Convert and return activities
        const activities = activitiesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            childId: data?.childId || '',
            childName: data?.childName || '',
            type: data?.type || '',
            subtype: data?.subtype || '',
            timestamp:
              data?.timestamp?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            details: data?.details || '',
            createdBy: data?.createdBy || '',
            kindergartenId: data?.kindergartenId || '',
            deleted: !!data?.deleted,
          };
        });

        console.log('✅ [API] Found', activities.length, 'child activities');
        console.log('📊 [API] Activities summary:');
        activities.forEach(activity => {
          console.log(
            `  - ${activity.childName}: ${activity.type} - ${activity.subtype}`,
          );
        });

        return activities;
      } catch (error) {
        console.error('❌ [API] Error fetching child activities:', error);
        console.error('❌ [API] Full error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          userId: currentUser.uid,
          userEmail: currentUser.email,
        });
        throw error;
      }
    },

    // Get activities for a specific child on a specific date
    getByChildAndDate: async (
      childId: string,
      date: Date,
    ): Promise<ChildActivity[]> => {
      try {
        console.log(
          '📦 [API] Fetching activities for child:',
          childId,
          'on date:',
          date,
        );

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const activitiesSnapshot = await firestore()
          .collection('childActivities')
          .where('childId', '==', childId)
          .where('timestamp', '>=', startOfDay)
          .where('timestamp', '<=', endOfDay)
          .where('deleted', '==', false)
          .orderBy('timestamp', 'desc')
          .get();

        if (!activitiesSnapshot.empty) {
          return activitiesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              childId: data?.childId || '',
              childName: data?.childName || '',
              type: data?.type || '',
              subtype: data?.subtype || '',
              timestamp:
                data?.timestamp?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
              details: data?.details || '',
              createdBy: data?.createdBy || '',
              kindergartenId: data?.kindergartenId || '',
              deleted: !!data?.deleted,
            };
          });
        } else {
          console.log(
            'ℹ️ [API] No activities found for this child on this date',
          );
          return [];
        }
      } catch (error) {
        console.error(
          '❌ [API] Error fetching child activities by date:',
          error,
        );
        throw error;
      }
    },

    // Get all children for the current parent - USING RESERVATIONS
    getChildren: async (): Promise<
      Array<{id: string; name: string; kindergartenId: string}>
    > => {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log('👶 [API] Fetching children for parent:', currentUser.uid);

        // Use reservations collection to find children
        const reservationsSnapshot = await firestore()
          .collection('reservations')
          .where('userId', '==', currentUser.uid)
          .get();

        if (reservationsSnapshot.empty) {
          console.log('ℹ️ [API] No reservations found for this parent');
          return [];
        }

        const children: Array<{
          id: string;
          name: string;
          kindergartenId: string;
        }> = [];

        reservationsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.childName) {
            children.push({
              id: doc.id, // Use reservation ID as child ID for now
              name: data.childName,
              kindergartenId: data.kindergartenId || '',
            });
          }
        });

        console.log(
          '✅ [API] Found children via reservations:',
          children.length,
        );
        return children;
      } catch (error) {
        console.error('❌ [API] Error fetching children:', error);
        throw error;
      }
    },

    // For kindergarten users to get all activities for their kindergarten
    getAllForKindergarten: async (): Promise<ChildActivity[]> => {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log(
          '📦 [API] Fetching child activities for kindergarten:',
          currentUser.uid,
        );

        const activitiesSnapshot = await firestore()
          .collection('childActivities')
          .where('kindergartenId', '==', currentUser.uid)
          .where('deleted', '==', false)
          .orderBy('timestamp', 'desc')
          .limit(100)
          .get();

        if (!activitiesSnapshot.empty) {
          console.log(
            '✅ [API] Found',
            activitiesSnapshot.size,
            'child activities',
          );

          return activitiesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              childId: data?.childId || '',
              childName: data?.childName || '',
              type: data?.type || '',
              subtype: data?.subtype || '',
              timestamp:
                data?.timestamp?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
              details: data?.details || '',
              createdBy: data?.createdBy || '',
              kindergartenId: data?.kindergartenId || '',
              deleted: !!data?.deleted,
            };
          });
        } else {
          console.log('ℹ️ [API] No activities found for kindergarten');
          return [];
        }
      } catch (error) {
        console.error(
          '❌ [API] Error fetching activities for kindergarten:',
          error,
        );
        throw error;
      }
    },
  },

  // Legacy ChildStatus endpoints for backward compatibility
  childStatus: {
    // Convert child activities to legacy child status format
    getAll: async (): Promise<ChildStatus[]> => {
      const activities = await apiService.childActivities.getAllForParent();

      // Convert activities to legacy child status format
      const statusMap = new Map<string, ChildStatus>();

      activities.forEach(activity => {
        const key = activity.childName;
        if (!statusMap.has(key)) {
          statusMap.set(key, {
            id: activity.id,
            childName: activity.childName,
            createdAt: activity.timestamp,
            updatedAt: activity.timestamp,
            kindergartenId: activity.kindergartenId,
          });
        }

        const status = statusMap.get(key)!;

        // Map activity types to legacy status fields
        if (activity.type === 'meal') {
          status.meal = activity.subtype;
        } else if (activity.type === 'nap') {
          status.nap = true;
        } else if (activity.details) {
          status.notes = activity.details;
        }
      });

      return Array.from(statusMap.values());
    },

    getAllForKindergarten: async (): Promise<ChildStatus[]> => {
      const activities =
        await apiService.childActivities.getAllForKindergarten();

      // Convert activities to legacy child status format
      const statusMap = new Map<string, ChildStatus>();

      activities.forEach(activity => {
        const key = activity.childName;
        if (!statusMap.has(key)) {
          statusMap.set(key, {
            id: activity.id,
            childName: activity.childName,
            createdAt: activity.timestamp,
            updatedAt: activity.timestamp,
            kindergartenId: activity.kindergartenId,
          });
        }

        const status = statusMap.get(key)!;

        // Map activity types to legacy status fields
        if (activity.type === 'meal') {
          status.meal = activity.subtype;
        } else if (activity.type === 'nap') {
          status.nap = true;
        } else if (activity.details) {
          status.notes = activity.details;
        }
      });

      return Array.from(statusMap.values());
    },
  },

  // Blog posts endpoints (keeping existing)
  blog: {
    getAll: async (
      page: number = 1,
      pageSize: number = 10,
      kindergartenId: string | null = null,
    ): Promise<{
      posts: BlogPost[];
      total: number;
      page: number;
      pageSize: number;
    }> => {
      try {
        console.log('📰 [API] Fetching blog posts');

        let query = firestore().collection('blog');

        if (kindergartenId) {
          query = query.where('kindergartenId', '==', kindergartenId);
        }

        const snapshot = await query.orderBy('createdAt', 'desc').get();

        if (!snapshot.empty) {
          // Simple pagination implementation
          const allDocs = snapshot.docs;
          const startIdx = (page - 1) * pageSize;
          const endIdx = startIdx + pageSize;
          const paginatedDocs = allDocs.slice(startIdx, endIdx);

          const posts = paginatedDocs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data?.title || '',
              content: data?.content || '',
              createdAt:
                data?.createdAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
              updatedAt:
                data?.updatedAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
              kindergartenId: data?.kindergartenId || '',
              kindergartenName: data?.kindergartenName || 'Kindergarten',
              image: data?.image,
            };
          });

          return {
            posts,
            total: allDocs.length,
            page,
            pageSize,
          };
        } else {
          console.log('ℹ️ [API] No blog posts found');
          return {
            posts: [],
            total: 0,
            page,
            pageSize,
          };
        }
      } catch (error) {
        console.error('❌ [API] Error fetching blog posts:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<BlogPost> => {
      try {
        console.log('📰 [API] Fetching blog post by ID:', id);

        const doc = await firestore().collection('blog').doc(id).get();

        if (doc.exists && doc.data()) {
          const data = doc.data()!;
          return {
            id: doc.id,
            title: data.title || '',
            content: data.content || '',
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            kindergartenId: data.kindergartenId || '',
            kindergartenName: data.kindergartenName || 'Kindergarten',
            image: data.image,
          };
        } else {
          throw new Error('Post not found');
        }
      } catch (error) {
        console.error('❌ [API] Error fetching blog post by ID:', error);
        throw error;
      }
    },
  },
};

export default apiService;
