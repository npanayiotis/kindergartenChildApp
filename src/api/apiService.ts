// src/api/apiService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChildActivity, BlogPost, User, Child} from '../types';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import blogService from './blogService';

console.log('🌐 API Service initializing with Firebase Firestore...');

// Base URL for REST API endpoints
const API_BASE_URL = 'https://findyournannyincyprus.onrender.com/api';

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

        // Get Firebase ID token for potential future use
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

  // Children management using REST API with Firestore fallback
  children = {
    getAllForParent: async (): Promise<Child[]> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        // First attempt to use the REST API
        try {
          console.log('👶 [API] Fetching children from REST API');
          const token = await currentUser.getIdToken();

          const response = await fetch(
            `${API_BASE_URL}/mobile/parent/children`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();
          console.log(
            '✅ [API] Successfully fetched children via REST API:',
            data.children.length,
          );
          return data.children;
        } catch (apiError) {
          // If REST API fails, fall back to direct Firestore queries
          console.warn(
            '⚠️ [API] REST API failed, falling back to Firestore:',
            apiError,
          );

          // Array to store all children with no duplicates
          const allChildren: {[key: string]: Child} = {};

          console.log(
            '👶 [API] Fetching children from Firestore by userId:',
            currentUser.uid,
          );

          // 1. Query children collection by userId
          try {
            const childrenByUserIdSnapshot = await firestore()
              .collection('children')
              .where('userId', '==', currentUser.uid)
              .get();

            childrenByUserIdSnapshot.forEach(doc => {
              const data = doc.data();
              allChildren[doc.id] = {
                id: doc.id,
                name:
                  data.childName ||
                  data.name ||
                  `${data.childFirstName || ''} ${
                    data.childLastName || ''
                  }`.trim(),
                kindergartenId: data.kindergartenId || '',
                userId: data.userId || currentUser.uid,
                dateOfBirth: data.dateOfBirth,
                profileImage: data.profileImage,
                medicalInfo: data.medicalInfo || data.medicalConditions,
                emergencyContact: data.emergencyContact,
                createdAt:
                  data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt:
                  data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
              };
            });

            console.log(
              `Found ${Object.keys(allChildren).length} children by userId`,
            );
          } catch (error) {
            console.error('Error querying children by userId:', error);
          }

          // 2. Query children collection by parentEmail
          if (currentUser.email) {
            try {
              console.log(
                '👶 [API] Fetching children from Firestore by parentEmail:',
                currentUser.email,
              );
              const childrenByEmailSnapshot = await firestore()
                .collection('children')
                .where('parentEmail', '==', currentUser.email)
                .get();

              childrenByEmailSnapshot.forEach(doc => {
                if (!allChildren[doc.id]) {
                  const data = doc.data();
                  allChildren[doc.id] = {
                    id: doc.id,
                    name:
                      data.childName ||
                      data.name ||
                      `${data.childFirstName || ''} ${
                        data.childLastName || ''
                      }`.trim(),
                    kindergartenId: data.kindergartenId || '',
                    userId: data.userId || currentUser.uid,
                    dateOfBirth: data.dateOfBirth,
                    profileImage: data.profileImage,
                    medicalInfo: data.medicalInfo || data.medicalConditions,
                    emergencyContact: data.emergencyContact,
                    createdAt:
                      data.createdAt?.toDate?.()?.toISOString() ||
                      data.createdAt,
                    updatedAt:
                      data.updatedAt?.toDate?.()?.toISOString() ||
                      data.updatedAt,
                  };
                }
              });

              console.log(
                `Found ${
                  Object.keys(allChildren).length
                } total children after email query`,
              );
            } catch (error) {
              console.error('Error querying children by parentEmail:', error);
            }
          }

          // 3. Check reservations as a fallback
          try {
            console.log(
              '👶 [API] Fetching children from reservations collection',
            );
            const reservationsSnapshot = await firestore()
              .collection('reservations')
              .where('userId', '==', currentUser.uid)
              .where('status', '==', 'confirmed')
              .get();

            reservationsSnapshot.forEach(doc => {
              if (!allChildren[doc.id]) {
                const data = doc.data();
                if (
                  data.childName ||
                  (data.childFirstName && data.childLastName)
                ) {
                  allChildren[doc.id] = {
                    id: doc.id,
                    name:
                      data.childName ||
                      `${data.childFirstName} ${
                        data.childLastName || ''
                      }`.trim(),
                    kindergartenId: data.kindergartenId || '',
                    userId: data.userId || currentUser.uid,
                    dateOfBirth: data.childDateOfBirth || data.dateOfBirth,
                    profileImage: undefined,
                    medicalInfo: data.medicalConditions || '',
                    emergencyContact: data.contactPhone || '',
                    createdAt:
                      data.createdAt?.toDate?.()?.toISOString() ||
                      data.createdAt,
                    updatedAt:
                      data.updatedAt?.toDate?.()?.toISOString() ||
                      data.updatedAt,
                  };
                }
              }
            });

            console.log(
              `Found ${
                Object.keys(allChildren).length
              } total children after reservations query`,
            );
          } catch (error) {
            console.error('Error querying reservations:', error);
          }

          const childrenArray = Object.values(allChildren);
          console.log(
            '✅ [API] Found',
            childrenArray.length,
            'children via Firestore',
          );
          return childrenArray;
        }
      } catch (error) {
        console.error('❌ [API] Error fetching children:', error);
        throw error;
      }
    },

    subscribeToChildren: (onChildrenUpdate: (children: Child[]) => void) => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('🔗 [API] Setting up children real-time listener');

      // Storage for tracked children IDs to avoid duplicates in real-time updates
      const trackedChildrenIds = new Set<string>();
      const unsubscribers: Array<() => void> = [];

      // 1. Listen for children by userId
      const userIdUnsubscribe = firestore()
        .collection('children')
        .where('userId', '==', currentUser.uid)
        .onSnapshot(
          snapshot => {
            // Track additions, modifications, and removals
            snapshot.docChanges().forEach(change => {
              if (change.type === 'added' || change.type === 'modified') {
                trackedChildrenIds.add(change.doc.id);
              } else if (change.type === 'removed') {
                trackedChildrenIds.delete(change.doc.id);
              }
            });

            // Fetch all current children and send update
            _fetchAndNotifyChildren(trackedChildrenIds, onChildrenUpdate);
          },
          error => {
            console.error('❌ [API] Children userId listener error:', error);
          },
        );
      unsubscribers.push(userIdUnsubscribe);

      // 2. Listen for children by parentEmail
      if (currentUser.email) {
        const emailUnsubscribe = firestore()
          .collection('children')
          .where('parentEmail', '==', currentUser.email)
          .onSnapshot(
            snapshot => {
              // Track additions, modifications, and removals
              snapshot.docChanges().forEach(change => {
                if (change.type === 'added' || change.type === 'modified') {
                  trackedChildrenIds.add(change.doc.id);
                } else if (change.type === 'removed') {
                  trackedChildrenIds.delete(change.doc.id);
                }
              });

              // Fetch all current children and send update
              _fetchAndNotifyChildren(trackedChildrenIds, onChildrenUpdate);
            },
            error => {
              console.error(
                '❌ [API] Children parentEmail listener error:',
                error,
              );
            },
          );
        unsubscribers.push(emailUnsubscribe);
      }

      // Helper function to fetch and notify about children updates
      const _fetchAndNotifyChildren = async (
        childIds: Set<string>,
        callback: (children: Child[]) => void,
      ) => {
        if (childIds.size === 0) {
          callback([]);
          return;
        }

        try {
          const children: Child[] = [];

          // Fetch each child document individually
          for (const childId of childIds) {
            try {
              const childDoc = await firestore()
                .collection('children')
                .doc(childId)
                .get();

              if (childDoc.exists) {
                const data = childDoc.data()!;
                children.push({
                  id: childDoc.id,
                  name:
                    data.childName ||
                    data.name ||
                    `${data.childFirstName || ''} ${
                      data.childLastName || ''
                    }`.trim(),
                  kindergartenId: data.kindergartenId || '',
                  userId: data.userId || currentUser.uid,
                  dateOfBirth: data.dateOfBirth,
                  profileImage: data.profileImage,
                  medicalInfo: data.medicalInfo || data.medicalConditions,
                  emergencyContact: data.emergencyContact,
                  createdAt:
                    data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                  updatedAt:
                    data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
                });
              }
            } catch (error) {
              console.error(`Error fetching child ${childId}:`, error);
            }
          }

          console.log(
            '🔄 [API] Children updated in real-time:',
            children.length,
          );
          callback(children);
        } catch (error) {
          console.error('Error fetching children details:', error);
        }
      };

      // Return a function to unsubscribe from all listeners
      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    },
  };

  // Child Activities using REST API with Firestore fallback
  childActivities = {
    getAllForParent: async (): Promise<ChildActivity[]> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        // First attempt to use the REST API
        try {
          console.log('📦 [API] Fetching all child activities from REST API');
          const token = await currentUser.getIdToken();

          const response = await fetch(
            `${API_BASE_URL}/mobile/parent/activities`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();
          console.log(
            '✅ [API] Successfully fetched activities via REST API:',
            data.activities.length,
          );
          return data.activities;
        } catch (apiError) {
          // If REST API fails, fall back to direct Firestore queries
          console.warn(
            '⚠️ [API] REST API failed, falling back to Firestore:',
            apiError,
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
            try {
              const activitiesSnapshot = await firestore()
                .collection('childActivities')
                .where('childId', '==', child.id)
                .where('deleted', '!=', true)
                .orderBy('timestamp', 'desc')
                .limit(50) // Limit per child
                .get();

              const childActivities: ChildActivity[] =
                activitiesSnapshot.docs.map(doc => {
                  const data = doc.data();
                  return {
                    id: doc.id,
                    childId: data.childId || child.id,
                    childName: data.childName || child.name,
                    type: data.type || '',
                    subtype: data.subtype || '',
                    timestamp:
                      data.timestamp?.toDate?.()?.toISOString() ||
                      data.timestamp,
                    details: data.details || '',
                    createdBy: data.createdBy || '',
                    kindergartenId: data.kindergartenId || child.kindergartenId,
                    deleted: data.deleted || false,
                    mood: data.mood,
                    photos: data.photos || [],
                    duration: data.duration,
                    quantity: data.quantity,
                  };
                });

              allActivities = allActivities.concat(childActivities);
              console.log(
                `Found ${childActivities.length} activities for child ${child.name}`,
              );
            } catch (error) {
              console.error(
                `Error fetching activities for child ${child.id}:`,
                error,
              );
            }
          }

          // Sort by timestamp
          allActivities.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );

          console.log(
            '✅ [API] Found',
            allActivities.length,
            'total activities via Firestore',
          );
          return allActivities;
        }
      } catch (error) {
        console.error('❌ [API] Error fetching all child activities:', error);
        throw error;
      }
    },

    getByChildAndDate: async (
      childId: string,
      date: Date,
    ): Promise<ChildActivity[]> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        // First attempt to use the REST API
        try {
          console.log(
            '📦 [API] Fetching activities for child from REST API:',
            childId,
          );
          const token = await currentUser.getIdToken();
          const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD

          const response = await fetch(
            `${API_BASE_URL}/mobile/parent/activities/${childId}?date=${formattedDate}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();
          console.log(
            '✅ [API] Successfully fetched activities via REST API:',
            data.activities.length,
          );
          return data.activities;
        } catch (apiError) {
          // If REST API fails, fall back to direct Firestore query
          console.warn(
            '⚠️ [API] REST API failed, falling back to Firestore:',
            apiError,
          );

          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);

          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          console.log(
            '📦 [API] Fetching activities from Firestore for child:',
            childId,
            'on date:',
            date.toDateString(),
          );

          // Verify this child belongs to the current user
          const childDoc = await firestore()
            .collection('children')
            .doc(childId)
            .get();
          if (childDoc.exists) {
            const childData = childDoc.data()!;
            if (
              childData.userId !== currentUser.uid &&
              childData.parentEmail !== currentUser.email
            ) {
              console.warn('⚠️ Child does not belong to current user');
              return [];
            }
          } else {
            // Check if this is a reservation ID
            const reservationDoc = await firestore()
              .collection('reservations')
              .doc(childId)
              .get();
            if (
              !reservationDoc.exists ||
              reservationDoc.data()?.userId !== currentUser.uid
            ) {
              console.warn(
                '⚠️ Child/reservation not found or does not belong to user',
              );
              return [];
            }
          }

          const activitiesSnapshot = await firestore()
            .collection('childActivities')
            .where('childId', '==', childId)
            .where('timestamp', '>=', startOfDay)
            .where('timestamp', '<=', endOfDay)
            .where('deleted', '!=', true)
            .orderBy('timestamp', 'desc')
            .get();

          const activities: ChildActivity[] = activitiesSnapshot.docs.map(
            doc => {
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
            },
          );

          console.log(
            '✅ [API] Found',
            activities.length,
            'activities for child via Firestore',
          );
          return activities;
        }
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
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(
        '🔗 [API] Setting up activity real-time listener for child:',
        childId,
      );

      // First verify child belongs to parent
      firestore()
        .collection('children')
        .doc(childId)
        .get()
        .then(childDoc => {
          // If child doc doesn't exist, check if it's a reservation ID
          if (!childDoc.exists) {
            return firestore()
              .collection('reservations')
              .doc(childId)
              .get()
              .then(reservationDoc => {
                if (!reservationDoc.exists) {
                  console.warn('⚠️ Child/reservation not found');
                  return false;
                }
                const data = reservationDoc.data()!;
                return data.userId === currentUser.uid;
              });
          }

          const data = childDoc.data()!;
          return (
            data.userId === currentUser.uid ||
            data.parentEmail === currentUser.email
          );
        })
        .then(isAuthorized => {
          if (!isAuthorized) {
            console.warn('⚠️ User not authorized for this child');
            onActivitiesUpdate([]);
            return () => {}; // Return empty unsubscribe function
          }

          // Set up the activities subscription
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
                      data.timestamp?.toDate?.()?.toISOString() ||
                      data.timestamp,
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
        })
        .catch(error => {
          console.error('Error setting up activities subscription:', error);
          return () => {}; // Return empty unsubscribe function
        });

      // Return placeholder unsubscribe function
      // The real one will be used internally after authorization check
      return () => {};
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

  // Utility method to test connections
  testConnection = async (): Promise<boolean> => {
    try {
      console.log('🔧 [API] Testing connections...');

      // Test Firestore connection
      await firestore().collection('test').limit(1).get();

      // Test REST API connection
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
          console.warn(
            '⚠️ REST API health check failed, but Firestore is available',
          );
        } else {
          console.log('✅ REST API connection successful');
        }
      } catch (apiError) {
        console.warn('⚠️ REST API unavailable, will use Firestore fallback');
      }

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
