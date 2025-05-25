/**
 * Firebase React Native Configuration
 * Updated to use modern Firebase v22+ API to resolve deprecation warnings
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {getApps, initializeApp} from '@react-native-firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyD8hXVobTNfvodNicXI259FQ0sO1bQnICI',
  authDomain: 'kindergartencyprus.firebaseapp.com',
  projectId: 'kindergartencyprus',
  storageBucket: 'kindergartencyprus.appspot.com',
  messagingSenderId: '43663453268',
  appId: '1:43663453268:android:35748d7194e33743d1a7e9',
};

console.log('[APP] Starting Firebase initialization...');

// Initialize Firebase app if not already initialized
let app;
const apps = getApps();
if (apps.length === 0) {
  console.log('[FIREBASE] Initializing Firebase app...');
  app = initializeApp(firebaseConfig);
} else {
  console.log('[FIREBASE] Firebase was already initialized');
  app = apps[0];
}

// Get Firebase service instances using modern API
const firebase = app;
const firebaseAuth = auth();
const firebaseFirestore = firestore();

console.log('[FIREBASE] Auth initialized successfully');
console.log('[FIREBASE] Firestore initialized successfully');

// Export flag to indicate we're using real Firebase (not mocks)
export const usingMockImplementation = false;

// Export the services
export {firebase, firebaseAuth as auth, firebaseFirestore as firestore};

console.log('[APP] Firebase initialization complete');
