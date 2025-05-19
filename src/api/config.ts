import {initializeApp} from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import {getStorage} from 'firebase/storage';

// Firebase configuration from your web app
const firebaseConfig = {
  apiKey: 'AIzaSyD8hXVobTNfvodNicXI259FQ0sO1bQnICI',
  authDomain: 'kindergartencyprus.firebaseapp.com',
  projectId: 'kindergartencyprus',
  storageBucket: 'kindergartencyprus.firebasestorage.app',
  messagingSenderId: '43663453268',
  appId: '1:43663453268:web:35748d7194e33743d1a7e9',
  measurementId: 'G-TQVBQSZD9',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings optimized for mobile
initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Get Firestore instance
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firebase Storage
const storage = getStorage(app);

export {app, db, auth, storage};
