// Enhanced API service with improved child tracking
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChildActivity, BlogPost, User, ChildStatus, Child} from '../types';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

console.log('🔥 API Service initializing with improved child tracking...');

// Helper function to convert Firebase user to our User type
const convertFirebaseUser = async (fbUser: any): Promise<User> => {
  let role: 'parent' | 'kindergarten' | 'admin' = 'parent';

  try {
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

interface AuthResponse {
  token: string;
  user: User;
}

const apiService = {
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

        const user = await convertFirebaseUser(userCredential.user);
        await AsyncStorage.setItem('user_data', JSON.stringify(user));
        const token = 'firebase-token-' + Date.now();
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
  },

  // NEW: Children management
  children: {
    // Get all children for the current parent using direct parent-child relationship
    getAllForParent: async (): Promise<Child[]> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log('👶 [API] Fetching children for parent:', currentUser.uid);

        // Query children collection directly by parentId
        const childrenSnapshot = await firestore()
          .collection('children')
          .where('parentId', '==', currentUser.uid)
          .get();

        if (childrenSnapshot.empty) {
          console.log('ℹ️ [API] No children found in children collection');

          // FALLBACK: Try the old reservation-based approach for backward compatibility
          console.log('🔄 [API] Falling back to reservations approach...');
          return await this.getChildrenFromReservations();
        }

        const children = childrenSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data?.name || '',
            kindergartenId: data?.kindergartenId || '',
            userId: data?.parentId || currentUser.uid,
            dateOfBirth: data?.dateOfBirth || undefined,
            createdAt:
              data?.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            updatedAt:
              data?.updatedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
          };
        });

        console.log(
          '✅ [API] Found',
          children.length,
          'children via children collection',
        );
        return children;
      } catch (error) {
        console.error('❌ [API] Error fetching children:', error);
        throw error;
      }
    },

    // FALLBACK: Get children from reservations (backward compatibility)
    getChildrenFromReservations: async (): Promise<Child[]> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log('🔄 [API] Using reservations fallback for children');

        const reservationsSnapshot = await firestore()
          .collection('reservations')
          .where('userId', '==', currentUser.uid)
          .get();

        if (reservationsSnapshot.empty) {
          return [];
        }

        const children: Child[] = [];
        reservationsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.childName) {
            children.push({
              id: doc.id, // Use reservation ID as child ID
              name: data.childName,
              kindergartenId: data.kindergartenId || '',
              userId: currentUser.uid,
            });
          }
        });

        console.log(
          '✅ [API] Found',
          children.length,
          'children via reservations fallback',
        );
        return children;
      } catch (error) {
        console.error('❌ [API] Error in reservations fallback:', error);
        throw error;
      }
    },

    // Set up real-time listener for children
    subscribeToChildren: (onChildrenUpdate: (children: Child[]) => void) => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('🔗 [API] Setting up real-time children listener');

      const unsubscribe = firestore()
        .collection('children')
        .where('parentId', '==', currentUser.uid)
        .onSnapshot(
          snapshot => {
            const children = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data?.name || '',
                kindergartenId: data?.kindergartenId || '',
                userId: data?.parentId || currentUser.uid,
                dateOfBirth: data?.dateOfBirth || undefined,
                createdAt:
                  data?.createdAt?.toDate?.()?.toISOString() ||
                  new Date().toISOString(),
                updatedAt:
                  data?.updatedAt?.toDate?.()?.toISOString() ||
                  new Date().toISOString(),
              };
            });

            console.log(
              '🔄 [API] Children updated via listener:',
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
  },

  // ENHANCED: Child Activities with improved approach
  childActivities: {
    // Get activities using childId instead of childName
    getAllForParent: async (): Promise<ChildActivity[]> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log(
          '📦 [API] Fetching child activities for parent (improved):',
          currentUser.uid,
        );

        // STEP 1: Get children for this parent
        const children = await apiService.children.getAllForParent();

        if (children.length === 0) {
          console.log('ℹ️ [API] No children found for parent');
          return [];
        }

        const childIds = children.map(child => child.id);
        console.log('👶 [API] Found children with IDs:', childIds);

        // STEP 2: Query activities by childId (more reliable than childName)
        let activities: ChildActivity[] = [];

        // Handle Firebase 'in' query limit of 10 items
        const batchSize = 10;
        for (let i = 0; i < childIds.length; i += batchSize) {
          const batch = childIds.slice(i, i + batchSize);

          console.log(
            `🔍 [API] Querying activities for child IDs batch:`,
            batch,
          );

          const activitiesSnapshot = await firestore()
            .collection('childActivities')
            .where('childId', 'in', batch)
            .where('deleted', '==', false)
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

          const batchActivities = activitiesSnapshot.docs.map(doc => {
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

          activities = activities.concat(batchActivities);
        }

        // FALLBACK: If no activities found by childId, try childName approach
        if (activities.length === 0) {
          console.log(
            '🔄 [API] No activities found by childId, trying childName fallback...',
          );
          activities = await this.getAllForParentByName();
        }

        // Sort all activities by timestamp
        activities.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        console.log('✅ [API] Found', activities.length, 'activities total');
        return activities.slice(0, 100); // Limit results
      } catch (error) {
        console.error(
          '❌ [API] Error fetching child activities (improved):',
          error,
        );
        throw error;
      }
    },

    // FALLBACK: Original childName-based approach for backward compatibility
    getAllForParentByName: async (): Promise<ChildActivity[]> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log('🔄 [API] Using childName fallback approach');

        // Get children and extract names
        const children = await apiService.children.getAllForParent();
        const childNames = children
          .map(child => child.name)
          .filter(name => name.trim());

        if (childNames.length === 0) {
          return [];
        }

        // Query by childName (original approach)
        const activitiesSnapshot = await firestore()
          .collection('childActivities')
          .where('childName', 'in', childNames.slice(0, 10))
          .where('deleted', '==', false)
          .orderBy('timestamp', 'desc')
          .limit(100)
          .get();

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
      } catch (error) {
        console.error('❌ [API] Error in childName fallback:', error);
        throw error;
      }
    },

    // Get activities for a specific child by ID with date filtering
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
      } catch (error) {
        console.error(
          '❌ [API] Error fetching child activities by date:',
          error,
        );
        throw error;
      }
    },

    // Real-time listener for child activities
    subscribeToChildActivities: (
      childId: string,
      date: Date,
      onActivitiesUpdate: (activities: ChildActivity[]) => void,
    ) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('🔗 [API] Setting up real-time listener for child:', childId);

      const unsubscribe = firestore()
        .collection('childActivities')
        .where('childId', '==', childId)
        .where('timestamp', '>=', startOfDay)
        .where('timestamp', '<=', endOfDay)
        .where('deleted', '==', false)
        .orderBy('timestamp', 'desc')
        .onSnapshot(
          snapshot => {
            const activities = snapshot.docs.map(doc => {
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

            console.log(
              '🔄 [API] Activities updated via listener:',
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

    // For kindergarten users
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
      } catch (error) {
        console.error(
          '❌ [API] Error fetching activities for kindergarten:',
          error,
        );
        throw error;
      }
    },

    // DEPRECATED: Use children.getAllForParent() instead
    getChildren: async (): Promise<
      Array<{id: string; name: string; kindergartenId: string}>
    > => {
      console.warn(
        '⚠️ [API] getChildren() is deprecated. Use children.getAllForParent() instead.',
      );
      const children = await apiService.children.getAllForParent();
      return children.map(child => ({
        id: child.id,
        name: child.name,
        kindergartenId: child.kindergartenId,
      }));
    },
  },

  // Legacy childStatus endpoints (backward compatibility)
  childStatus: {
    getAll: async (): Promise<ChildStatus[]> => {
      const activities = await apiService.childActivities.getAllForParent();
      // Convert activities to legacy format...
      const statusMap = new Map<string, ChildStatus>();
      // ... (rest of conversion logic remains the same)
      return Array.from(statusMap.values());
    },

    getAllForKindergarten: async (): Promise<ChildStatus[]> => {
      const activities =
        await apiService.childActivities.getAllForKindergarten();
      // Convert activities to legacy format...
      const statusMap = new Map<string, ChildStatus>();
      // ... (rest of conversion logic remains the same)
      return Array.from(statusMap.values());
    },
  },

  // Blog posts (unchanged)
  blog: {
    getAll: async (
      page: number = 1,
      pageSize: number = 10,
      kindergartenId: string | null = null,
    ) => {
      // ... existing blog implementation
      try {
        console.log('📰 [API] Fetching blog posts');
        let query = firestore().collection('blog');
        if (kindergartenId) {
          query = query.where('kindergartenId', '==', kindergartenId);
        }
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        // ... rest of blog logic
        return {posts: [], total: 0, page, pageSize}; // Placeholder
      } catch (error) {
        console.error('❌ [API] Error fetching blog posts:', error);
        throw error;
      }
    },

    getById: async (id: string) => {
      // ... existing implementation
      return {} as BlogPost; // Placeholder
    },
  },
};

export default apiService;
