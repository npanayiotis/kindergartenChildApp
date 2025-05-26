/**
 * Firebase initialization for React Native
 * This is the ONLY Firebase file you need
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import app from '@react-native-firebase/app';

console.log('🔥 Initializing Firebase for React Native...');

// Initialize services
let firebaseAuth: any;
let firebaseFirestore: any;
let firebaseStorage: any;
let firebaseApp: any;

try {
  firebaseAuth = auth();
  firebaseFirestore = firestore();
  firebaseStorage = storage();
  firebaseApp = app();

  console.log('✅ Firebase services initialized successfully');
  console.log('🔐 Auth service ready:', !!firebaseAuth);
  console.log('📦 Firestore service ready:', !!firebaseFirestore);
  console.log('💾 Storage service ready:', !!firebaseStorage);
  console.log('🏠 App name:', firebaseApp.name);

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
  firebaseApp as app,
};

// Default export
export default {
  auth: firebaseAuth,
  firestore: firebaseFirestore,
  storage: firebaseStorage,
  app: firebaseApp,
};
