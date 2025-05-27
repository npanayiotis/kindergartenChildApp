/**
 * Firebase initialization for React Native - FIXED VERSION
 * Updated to use modern Firebase v22 API patterns
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
// Import app differently to avoid deprecation warnings
import {firebase} from '@react-native-firebase/app';

console.log('🔥 Initializing Firebase for React Native...');

// Initialize services using modern approach
let firebaseAuth: any;
let firebaseFirestore: any;
let firebaseStorage: any;
let firebaseApp: any;

try {
  // Get the default app instance (this is the modern way)
  firebaseApp = firebase.app();

  // Initialize services from the app
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

  // Fallback to basic initialization
  try {
    firebaseAuth = auth();
    firebaseFirestore = firestore();
    firebaseStorage = storage();
    firebaseApp = null; // Will be null in fallback mode

    console.log('⚠️ Using fallback Firebase initialization');
  } catch (fallbackError) {
    console.error(
      '❌ Fallback Firebase initialization also failed:',
      fallbackError,
    );
    throw fallbackError;
  }
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
