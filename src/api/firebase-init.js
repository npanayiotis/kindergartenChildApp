/**
 * Firebase initialization module
 * This file explicitly initializes Firebase and exports the initialized components
 */

// Import Firebase modules
import {initializeApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import {getStorage} from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyD8hXVobTNfvodNicXI259FQ0sO1bQnICI',
  authDomain: 'kindergartencyprus.firebaseapp.com',
  projectId: 'kindergartencyprus',
  storageBucket: 'kindergartencyprus.appspot.com',
  messagingSenderId: '43663453268',
  appId: '1:43663453268:web:35748d7194e33743d1a7e9',
  measurementId: 'G-TQVBQSZD9',
};

console.log('Starting Firebase initialization...');

// 1. Initialize Firebase app
const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized');

// 2. Initialize Firebase Authentication
const auth = getAuth(app);
console.log('Firebase Auth initialized');

// 3. Initialize Firestore
const db = getFirestore(app);
console.log('Firebase Firestore initialized');

// 4. Initialize Storage
const storage = getStorage(app);
console.log('Firebase Storage initialized');

console.log('Firebase initialized successfully ✅');

// Export initialized Firebase components
export {app, auth, db, storage};
