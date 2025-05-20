/**
 * Firebase Initialization Module
 *
 * This file is imported directly from index.js before any other imports
 * to ensure Firebase is initialized before any React components are loaded.
 */

// Global is already defined in React Native, this is just a safety check
// We don't need to polyfill in a React Native environment
// We'll skip this block as it's causing syntax issues

// Setup Firebase
import {initializeApp} from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import {getStorage} from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create mock functions for error cases
const createMockAuth = () => {
  const mockAuth = {
    app: {},
    currentUser: null,
    // Mock auth methods
    signInWithEmailAndPassword: () =>
      Promise.reject(new Error('Firebase Auth not initialized')),
    createUserWithEmailAndPassword: () =>
      Promise.reject(new Error('Firebase Auth not initialized')),
    signOut: () => Promise.reject(new Error('Firebase Auth not initialized')),
    // Needed for Firebase Auth to function
    _canUseIndexedDBPromise: Promise.resolve(true),
    _getRecaptchaConfig: () => Promise.resolve(null),
    languageCode: null,
    onAuthStateChanged: callback => {
      callback(null);
      return () => {};
    },
    tenantId: null,
  };
  return mockAuth;
};

const createMockFirestore = () => {
  const mockDb = {
    app: {},
    // Mock Firestore methods
    collection: () => ({get: () => Promise.resolve([]), doc: () => ({})}),
    doc: () => ({
      get: () => Promise.resolve({exists: false, data: () => ({})}),
    }),
    getDoc: () => Promise.resolve({exists: false, data: () => ({})}),
    setDoc: () => Promise.resolve(),
    query: () => ({get: () => Promise.resolve([])}),
    where: () => ({}),
  };
  return mockDb;
};

// Declare variables at the top level for export
let app, auth, db, storage;

// Logs for debugging
console.log('[FIREBASE] Initialization started');

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

try {
  // Initialize app with the configuration
  console.log('[FIREBASE] Initializing app');
  app = initializeApp(firebaseConfig);
  console.log('[FIREBASE] App initialized');

  // Initialize auth - using standard getAuth instead of initializeAuth
  console.log('[FIREBASE] Initializing auth');
  auth = getAuth(app);
  console.log('[FIREBASE] Auth initialized:', auth ? 'SUCCESS' : 'FAILED');

  // Initialize firestore
  console.log('[FIREBASE] Initializing firestore');
  db = getFirestore(app);
  console.log('[FIREBASE] Firestore initialized:', db ? 'SUCCESS' : 'FAILED');

  // Initialize storage
  console.log('[FIREBASE] Initializing storage');
  storage = getStorage(app);
  console.log(
    '[FIREBASE] Storage initialized:',
    storage ? 'SUCCESS' : 'FAILED',
  );

  // Export initialized services
  console.log('[FIREBASE] All components initialized successfully');
} catch (error) {
  console.error('[FIREBASE] Initialization error:', error);

  // Create more robust mock objects
  app = {};
  auth = createMockAuth();
  db = createMockFirestore();
  storage = {
    app: {},
    ref: () => ({
      put: () => Promise.reject(new Error('Firebase Storage not initialized')),
    }),
  };

  console.error('[FIREBASE] Using mock objects due to initialization failure');
}

// Make these Firebase references available globally
global.firebaseApp = app;
global.firebaseAuth = auth;
global.firebaseDB = db;
global.firebaseStorage = storage;

// Add Firebase methods to global scope for direct access
// This helps when using Firebase methods directly
global.collection = collection;
global.doc = doc;
global.getDoc = getDoc;
global.getDocs = getDocs;
global.setDoc = setDoc;
global.query = query;
global.where = where;
global.signInWithEmailAndPassword = signInWithEmailAndPassword;
global.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
global.signOut = signOut;

// Also export normally for ESM imports
export {app, auth, db, storage};
