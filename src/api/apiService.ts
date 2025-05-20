// API service for mobile app
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChildStatus, BlogPost, User} from '../types';
import {
  auth as firebaseAuth,
  firestore as firebaseFirestore,
  usingMockImplementation,
} from '../../firebaseRN';
import {FirebaseAuth, FirebaseFirestore, FirebaseUser} from '../types/firebase';

// Cast the imported objects to our defined interfaces
const typedAuth = firebaseAuth as FirebaseAuth;
const typedFirestore = firebaseFirestore as FirebaseFirestore;

// Base URL of your API (commented out as we're using Firebase directly)
// const API_URL = 'https://findyournanny.onrender.com/api/mobile';

// Get token from AsyncStorage
const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Failed to get token', error);
    return null;
  }
};

// Auth response type
interface AuthResponse {
  token: string;
  user: User;
}

// Helper function to convert Firebase user to our User type
const convertFirebaseUser = (fbUser: FirebaseUser): User => {
  // Extract custom claims if they exist
  let role: 'parent' | 'kindergarten' | 'admin' = 'parent';

  // Try to get role from firestore if available
  const userRole = fbUser.role || 'parent';
  if (
    userRole === 'parent' ||
    userRole === 'kindergarten' ||
    userRole === 'admin'
  ) {
    role = userRole as 'parent' | 'kindergarten' | 'admin';
  }

  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || fbUser.name || 'User',
    role: role,
    profileImage: fbUser.photoURL || undefined,
  };
};

// API methods
const apiService = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      try {
        // Use our Firebase auth implementation
        console.log(
          `[API] Attempting to sign in with ${
            usingMockImplementation ? 'mock' : 'Firebase'
          }`,
        );
        const result = await typedAuth.signInWithEmailAndPassword(
          email,
          password,
        );

        if (!result.user) {
          throw new Error('Authentication failed');
        }

        let userData = result.user;

        // If this is a real Firebase user, try to get additional user data from Firestore
        if (typedAuth.currentUser && !usingMockImplementation) {
          try {
            console.log('[API] Getting additional user data from Firestore');
            const userDoc = await typedFirestore
              .collection('users')
              .doc(result.user.uid)
              .get();

            if (userDoc.exists) {
              const firestoreData = userDoc.data();
              // Merge Firestore data with auth data
              if (firestoreData) {
                userData = {
                  ...userData,
                  ...firestoreData,
                };
              }
            }
          } catch (error) {
            console.warn(
              '[API] Could not fetch additional user data from Firestore',
              error,
            );
          }
        }

        // Convert Firebase user to our app's User type
        const user = convertFirebaseUser(userData);

        // Store user data for our app
        await AsyncStorage.setItem('user_data', JSON.stringify(user));

        // Generate a token or get it from Firebase
        const token = (await getToken()) || 'firebase-token-' + Date.now();
        await AsyncStorage.setItem('auth_token', token);

        return {
          token,
          user,
        };
      } catch (error) {
        console.error('[API] Login error:', error);
        throw error;
      }
    },

    logout: async (): Promise<void> => {
      await typedAuth.signOut();
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('auth_token');
    },
  },

  // Child status endpoints
  childStatus: {
    getAll: async (): Promise<ChildStatus[]> => {
      if (!typedAuth.currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log(
          '[API] Fetching all child status records for user',
          typedAuth.currentUser.uid,
        );

        // Get data from Firestore
        const childStatusCollection = await typedFirestore
          .collection('childStatus')
          .where('parentId', '==', typedAuth.currentUser.uid)
          .get();

        if (!childStatusCollection.empty) {
          console.log(
            '[API] Found',
            childStatusCollection.size,
            'child status records',
          );
          // Return data from Firestore
          return childStatusCollection.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              childName: data?.childName || '',
              createdAt:
                data?.createdAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
              updatedAt:
                data?.updatedAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
              mood: data?.mood || '',
              meal: data?.meal || '',
              nap: !!data?.nap,
              notes: data?.notes || '',
              parentId: data?.parentId || '',
              kindergartenId: data?.kindergartenId || '',
            };
          });
        } else {
          console.log('[API] No child status records found in Firestore');
          // Return empty array instead of throwing error
          return [];
        }
      } catch (error) {
        console.error('[API] Error fetching child status:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<ChildStatus> => {
      if (!typedAuth.currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log('[API] Fetching child status record by ID:', id);
        // Get data from Firestore
        const doc = await typedFirestore
          .collection('childStatus')
          .doc(id)
          .get();

        if (doc.exists) {
          const data = doc.data();
          return {
            id: doc.id,
            childName: data?.childName || '',
            createdAt:
              data?.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            updatedAt:
              data?.updatedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            mood: data?.mood || '',
            meal: data?.meal || '',
            nap: !!data?.nap,
            notes: data?.notes || '',
            parentId: data?.parentId || '',
            kindergartenId: data?.kindergartenId || '',
          };
        } else {
          console.log('[API] No child status record found with ID:', id);
          throw new Error('Record not found');
        }
      } catch (error) {
        console.error('[API] Error fetching child status by ID:', error);
        throw error;
      }
    },

    update: async (
      id: string,
      data: Partial<ChildStatus>,
    ): Promise<ChildStatus> => {
      if (!typedAuth.currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log('[API] Updating child status record:', id);
        // Update data in Firestore
        await typedFirestore
          .collection('childStatus')
          .doc(id)
          .update({
            ...data,
            updatedAt: new Date(),
          });

        // Get the updated document
        const updatedDoc = await typedFirestore
          .collection('childStatus')
          .doc(id)
          .get();

        if (updatedDoc.exists) {
          const docData = updatedDoc.data();
          return {
            id: updatedDoc.id,
            childName: docData?.childName || '',
            createdAt:
              docData?.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            updatedAt:
              docData?.updatedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            mood: docData?.mood || '',
            meal: docData?.meal || '',
            nap: !!docData?.nap,
            notes: docData?.notes || '',
            parentId: docData?.parentId || '',
            kindergartenId: docData?.kindergartenId || '',
          };
        } else {
          throw new Error('Updated record not found');
        }
      } catch (error) {
        console.error('[API] Error updating child status:', error);
        throw error;
      }
    },
  },

  // Blog posts endpoints
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
        console.log('[API] Fetching blog posts');
        // Get data from Firestore
        let query = typedFirestore.collection('blog');

        if (kindergartenId) {
          query = query.where('kindergartenId', '==', kindergartenId);
        }

        // Add pagination (Firestore has limitations with skip/limit)
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
          console.log('[API] No blog posts found');
          // Return empty array instead of throwing error
          return {
            posts: [],
            total: 0,
            page,
            pageSize,
          };
        }
      } catch (error) {
        console.error('[API] Error fetching blog posts:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<BlogPost> => {
      try {
        console.log('[API] Fetching blog post by ID:', id);
        // Get data from Firestore
        const doc = await typedFirestore.collection('blog').doc(id).get();

        if (doc.exists) {
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
        } else {
          console.log('[API] No blog post found with ID:', id);
          throw new Error('Post not found');
        }
      } catch (error) {
        console.error('[API] Error fetching blog post by ID:', error);
        throw error;
      }
    },
  },
};

export default apiService;
