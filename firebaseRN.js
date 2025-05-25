/**
 * Firebase React Native Configuration - CORRECTED
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import app from '@react-native-firebase/app';

let usingMockImplementation = false;

try {
  // CORRECT: Call auth() and firestore() as functions to get instances
  const testAuth = auth();
  const testFirestore = firestore();

  console.log('✅ Firebase React Native initialized successfully');
  console.log('📱 App name:', app.name);
  console.log('👤 Current user:', testAuth.currentUser?.email || 'None');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  usingMockImplementation = true;
}

// CORRECT: Export the service constructors, not instances
export {auth, firestore, app, usingMockImplementation};

// Default export
export default {
  auth,
  firestore,
  app,
  usingMockImplementation,
};
