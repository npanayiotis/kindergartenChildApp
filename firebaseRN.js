/**
 * React Native Firebase SDK Implementation
 * This connects to your real Firebase project
 */

import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration for your real Firebase project
const firebaseConfig = {
  apiKey: 'AIzaSyD8hXVobTNfvodNicXI259FQ0sO1bQnICI',
  authDomain: 'kindergartencyprus.firebaseapp.com',
  projectId: 'kindergartencyprus',
  storageBucket: 'kindergartencyprus.appspot.com',
  messagingSenderId: '43663453268',
  appId: '1:43663453268:web:35748d7194e33743d1a7e9',
  measurementId: 'G-TQVBQSZD9',
};

// Set up Firebase variables
let firebase = null;
let auth = null;
let firestore = null;

// Flag to track if we're using real Firebase or fallback
let usingMockImplementation = false;

console.log('[APP] Starting Firebase initialization...');

try {
  // Import Firebase modules directly
  const firebaseApp = require('@react-native-firebase/app').default;
  const firebaseAuth = require('@react-native-firebase/auth').default;
  const firebaseFirestore = require('@react-native-firebase/firestore').default;

  // Initialize Firebase if it hasn't been initialized yet
  if (firebaseApp.apps.length === 0) {
    console.log('[FIREBASE] Initializing Firebase app with config');
    firebaseApp.initializeApp(firebaseConfig);
  } else {
    console.log('[FIREBASE] Firebase was already initialized');
  }

  // Assign the modules after initialization
  firebase = firebaseApp;
  auth = firebaseAuth();
  console.log('[FIREBASE] Auth initialized successfully');

  firestore = firebaseFirestore();
  console.log('[FIREBASE] Firestore initialized successfully');
} catch (error) {
  console.error('[FIREBASE] Error during initialization:', error);
  // Create mock implementations instead of throwing
  usingMockImplementation = true;

  try {
    // Try to import the structured mocks
    const {createMockAuth, createMockFirestore} = require('./src/api/mockApi');
    auth = createMockAuth();
    firestore = createMockFirestore();
    console.log('[FIREBASE] Using structured mock implementations');
  } catch (mockError) {
    console.error(
      '[FIREBASE] Failed to load mock API, using inline fallbacks:',
      mockError,
    );

    // Inline fallback mocks if the import fails
    auth = {
      currentUser: null,
      signInWithEmailAndPassword: async () => {
        console.log('[MOCK] Sign in called');
        return {
          user: {
            uid: 'mock-user-id',
            email: 'mock@example.com',
            displayName: 'Mock User',
            role: 'parent',
          },
        };
      },
      signOut: async () => {
        console.log('[MOCK] Sign out called');
      },
    };

    // Mock firestore implementation
    firestore = {
      collection: name => ({
        doc: id => ({
          get: async () => ({
            exists: true,
            id: id,
            data: () => ({
              name: 'Mock Data',
              role: 'parent',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          }),
          update: async data => console.log('[MOCK] Updating document', data),
        }),
        where: () => ({
          get: async () => ({
            empty: false,
            size: 1,
            docs: [
              {
                id: 'mock-doc-id',
                exists: true,
                data: () => ({
                  childName: 'Mock Child',
                  mood: 'Happy',
                  meal: 'Good',
                  nap: true,
                  notes: 'Mock notes',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  parentId: 'mock-parent-id',
                  kindergartenId: 'mock-kindergarten-id',
                }),
              },
            ],
          }),
        }),
        orderBy: () => ({
          get: async () => ({
            empty: false,
            docs: [
              {
                id: 'mock-blog-id',
                exists: true,
                data: () => ({
                  title: 'Mock Blog Post',
                  content: 'Mock content',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  kindergartenId: 'mock-kindergarten-id',
                  kindergartenName: 'Mock Kindergarten',
                }),
              },
            ],
          }),
        }),
      }),
    };
  }

  console.log(
    '[FIREBASE] Using mock implementations due to initialization error',
  );
}

// Export Firebase resources
export {firebase, auth, firestore, firebaseConfig, usingMockImplementation};

// Also make them available globally for easier access
global.firebase = firebase;
global.firebaseAuth = auth;
global.firebaseDB = firestore;
