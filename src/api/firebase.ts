/**
 * Firebase initialization module for React Native
 * This file uses the React Native Firebase SDK
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import app from '@react-native-firebase/app';

console.log('🔥 Initializing Firebase services for React Native...');

// Check if Firebase is properly initialized

// CORRECT: Initialize Firebase services - call them as functions
const firebaseAuth = auth();
const firebaseFirestore = firestore();
const firebaseStorage = storage();

// Test services
try {
  console.log('🔐 Auth service available:', !!firebaseAuth);
  console.log('📦 Firestore service available:', !!firebaseFirestore);
  console.log('💾 Storage service available:', !!firebaseStorage);

  // Test current user
  const currentUser = firebaseAuth.currentUser;
  console.log('👤 Current user:', currentUser?.email || 'None');

  console.log('✅ All Firebase services initialized successfully');
} catch (error) {
  console.error('❌ Firebase services initialization error:', error);
}

// Export initialized Firebase components
export {
  app,
  firebaseAuth as auth,
  firebaseFirestore as firestore,
  firebaseStorage as storage,
};

// Default export
export default {
  app,
  auth: firebaseAuth,
  firestore: firebaseFirestore,
  storage: firebaseStorage,
};
