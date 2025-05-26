// Fixed API service for React Native Firebase
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChildStatus, BlogPost, User} from '../types';
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

  // Child status endpoints
  childStatus: {
    getAll: async (): Promise<ChildStatus[]> => {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log(
          '📦 [API] Fetching child status records for user:',
          currentUser.uid,
        );

        const childStatusSnapshot = await firestore()
          .collection('childStatus')
          .where('parentId', '==', currentUser.uid)
          .orderBy('updatedAt', 'desc')
          .get();

        if (!childStatusSnapshot.empty) {
          console.log(
            '✅ [API] Found',
            childStatusSnapshot.size,
            'child status records',
          );

          return childStatusSnapshot.docs.map(doc => {
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
          console.log('ℹ️ [API] No child status records found');
          return [];
        }
      } catch (error) {
        console.error('❌ [API] Error fetching child status:', error);
        throw error;
      }
    },

    // FIXED: This was incorrectly calling blog endpoint before
    getById: async (id: string): Promise<ChildStatus> => {
      try {
        console.log('📦 [API] Fetching child status by ID:', id);

        const doc = await firestore().collection('childStatus').doc(id).get();

        if (doc.exists && doc.data()) {
          const data = doc.data()!;
          return {
            id: doc.id,
            childName: data.childName || '',
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            mood: data.mood || '',
            meal: data.meal || '',
            nap: !!data.nap,
            notes: data.notes || '',
            parentId: data.parentId || '',
            kindergartenId: data.kindergartenId || '',
          };
        } else {
          throw new Error('Child status not found');
        }
      } catch (error) {
        console.error('❌ [API] Error fetching child status by ID:', error);
        throw error;
      }
    },

    update: async (
      id: string,
      data: Partial<ChildStatus>,
    ): Promise<ChildStatus> => {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log('📝 [API] Updating child status record:', id);

        await firestore()
          .collection('childStatus')
          .doc(id)
          .update({
            ...data,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });

        // Get the updated document
        const updatedDoc = await firestore()
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
        console.error('❌ [API] Error updating child status:', error);
        throw error;
      }
    },

    // For kindergarten users to get all children in their care
    getAllForKindergarten: async (): Promise<ChildStatus[]> => {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        console.log(
          '📦 [API] Fetching child status records for kindergarten:',
          currentUser.uid,
        );

        const childStatusSnapshot = await firestore()
          .collection('childStatus')
          .where('kindergartenId', '==', currentUser.uid)
          .orderBy('updatedAt', 'desc')
          .get();

        if (!childStatusSnapshot.empty) {
          console.log(
            '✅ [API] Found',
            childStatusSnapshot.size,
            'child status records',
          );

          return childStatusSnapshot.docs.map(doc => {
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
          console.log(
            'ℹ️ [API] No child status records found for kindergarten',
          );
          return [];
        }
      } catch (error) {
        console.error(
          '❌ [API] Error fetching child status for kindergarten:',
          error,
        );
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
