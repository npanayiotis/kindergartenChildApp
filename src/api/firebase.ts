/**
 * Firebase initialization for React Native - MINIMAL VERSION
 * This avoids the app() function that's causing issues
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

console.log('🔥 Initializing Firebase for React Native...');

// Initialize services without the app reference
let firebaseAuth: any;
let firebaseFirestore: any;
let firebaseStorage: any;

try {
  firebaseAuth = auth();
  firebaseFirestore = firestore();
  firebaseStorage = storage();

  console.log('✅ Firebase services initialized successfully');
  console.log('🔐 Auth service ready:', !!firebaseAuth);
  console.log('📦 Firestore service ready:', !!firebaseFirestore);
  console.log('💾 Storage service ready:', !!firebaseStorage);

  // Check current user (will be null initially)
  const currentUser = firebaseAuth.currentUser;
  console.log('👤 Current user:', currentUser?.email || 'None');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

// Export the initialized services
export {
  firebaseAuth as auth,
  firebaseFirestore as firestore,
  firebaseStorage as storage,
};

// Export a null app to maintain compatibility
export const app = null;

// Default export
export default {
  auth: firebaseAuth,
  firestore: firebaseFirestore,
  storage: firebaseStorage,
  app: null,
};
