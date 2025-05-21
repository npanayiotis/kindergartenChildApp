/**
 * Firebase initialization module
 * This file uses the React Native Firebase SDK
 */

// Import React Native Firebase modules
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

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

console.log('Starting Firebase initialization in api/firebase.ts...');

// 1. Initialize Firebase app if not already initialized
if (firebase.apps.length === 0) {
  console.log('Initializing Firebase app with config');
  firebase.initializeApp(firebaseConfig);
}

// 2. Get Firebase service instances
const app = firebase;
const db = firestore();

console.log('Firebase services initialized successfully in api/firebase.ts ✅');

// Export initialized Firebase components
export {app, auth, db as firestore, storage};
