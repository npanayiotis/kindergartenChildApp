import {auth, db} from './config';
import {collection, getDocs, limit, query} from 'firebase/firestore';
import {signInAnonymously} from 'firebase/auth';

/**
 * Test Firebase connectivity
 * This function tries to perform basic Firebase operations to verify connectivity
 */
export async function testFirebaseConnection(): Promise<{
  authStatus: string;
  firestoreStatus: string;
  authDetails: string;
  firestoreDetails: string;
}> {
  const result = {
    authStatus: 'Not tested',
    firestoreStatus: 'Not tested',
    authDetails: '',
    firestoreDetails: '',
  };

  // Test if auth is properly defined
  if (!auth) {
    result.authStatus = 'Auth not available';
    result.authDetails = 'Firebase Auth object is undefined';
    result.firestoreStatus = 'Skipped - Auth not available';
    return result;
  }

  // Test if auth.app is properly defined
  if (!auth.app) {
    result.authStatus = 'Auth not properly initialized';
    result.authDetails = 'Firebase Auth app property is undefined';
    result.firestoreStatus = 'Skipped - Auth not initialized';
    return result;
  }

  // Check if auth has the required methods
  if (typeof auth.signInWithEmailAndPassword !== 'function') {
    result.authStatus = 'Auth methods missing';
    result.authDetails = 'Firebase Auth missing required methods';
    result.firestoreStatus = 'Skipped - Auth not initialized';
    return result;
  }

  // Test Firebase Auth
  try {
    // Try anonymous auth which doesn't require user credentials
    await signInAnonymously(auth);
    result.authStatus = 'Connected';
    result.authDetails = 'Anonymous auth successful';
  } catch (error: any) {
    result.authStatus = 'Error';
    result.authDetails = `${error.message || 'Unknown error'}`;
    console.error('[FIREBASE-TEST] Auth connection test failed:', error);
  }

  // Check if db is properly defined
  if (!db) {
    result.firestoreStatus = 'Firestore not available';
    result.firestoreDetails = 'Firestore object is undefined';
    return result;
  }

  // Check if db has the required methods
  if (typeof db.collection !== 'function' && typeof collection !== 'function') {
    result.firestoreStatus = 'Firestore methods missing';
    result.firestoreDetails = 'Firestore missing required methods';
    return result;
  }

  // Test Firestore
  try {
    // Try to read a simple collection query
    const testQuery = query(collection(db, 'users'), limit(1));
    await getDocs(testQuery);
    result.firestoreStatus = 'Connected';
    result.firestoreDetails = 'Successfully queried users collection';
  } catch (error: any) {
    result.firestoreStatus = 'Error';
    result.firestoreDetails = `${error.message || 'Unknown error'}`;
    console.error('[FIREBASE-TEST] Firestore connection test failed:', error);

    // Try with a direct approach if the first attempt failed
    try {
      if (typeof db.collection === 'function') {
        // Try direct Firestore API if available
        await db.collection('users').get();
        result.firestoreStatus = 'Connected (alt method)';
        result.firestoreDetails = 'Used db.collection directly';
      }
    } catch (altError: any) {
      result.firestoreDetails += ` | Alt method failed: ${
        altError.message || 'Unknown error'
      }`;
    }
  }

  return result;
}
