/**
 * Firebase Debug Utilities
 *
 * This file contains helper functions to diagnose Firebase-related issues
 */

import {Platform} from 'react-native';
import {auth, firestore, usingMockImplementation} from '../../firebaseRN';

/**
 * Checks Firebase initialization status and availability
 * @returns {Object} Status report about Firebase services
 */
export const checkFirebaseStatus = () => {
  const status = {
    platform: Platform.OS,
    platformVersion: Platform.Version,
    usingMocks: usingMockImplementation,
    services: {
      auth: {
        available: !!auth,
        initialized: false,
        currentUser: null,
      },
      firestore: {
        available: !!firestore,
        initialized: false,
      },
    },
    issues: [],
  };

  // Check Auth status
  try {
    if (auth) {
      status.services.auth.initialized = true;
      status.services.auth.currentUser = auth.currentUser
        ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            isAnonymous: auth.currentUser.isAnonymous,
          }
        : null;
    } else {
      status.issues.push('Firebase Auth is not available');
    }
  } catch (error) {
    status.issues.push(`Firebase Auth error: ${error.message}`);
  }

  // Check Firestore status
  try {
    if (firestore) {
      status.services.firestore.initialized = true;

      // Try a simple operation to verify Firestore is working
      try {
        firestore.collection('_test_');
        status.services.firestore.operationSucceeded = true;
      } catch (error) {
        status.services.firestore.operationSucceeded = false;
        status.issues.push(`Firestore operation error: ${error.message}`);
      }
    } else {
      status.issues.push('Firestore is not available');
    }
  } catch (error) {
    status.issues.push(`Firestore error: ${error.message}`);
  }

  return status;
};

/**
 * Attempts a test login to check if auth is working
 * @param {string} testEmail - Test email to use
 * @param {string} testPassword - Test password to use
 * @returns {Promise<Object>} Result of the test
 */
export const testFirebaseAuth = async (testEmail, testPassword) => {
  try {
    if (!auth) {
      return {
        success: false,
        error: 'Firebase Auth is not available',
        usingMocks: usingMockImplementation,
      };
    }

    console.log('[DEBUG] Testing Firebase Auth sign in');
    const result = await auth.signInWithEmailAndPassword(
      testEmail,
      testPassword,
    );

    return {
      success: true,
      user: {
        uid: result.user.uid,
        email: result.user.email,
        role: result.user.role || 'unknown',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      code: error.code || 'unknown',
      usingMocks: usingMockImplementation,
    };
  }
};

/**
 * Logs Firebase environment details to console
 */
export const logFirebaseEnvironment = () => {
  const status = checkFirebaseStatus();
  console.log('===== Firebase Environment Report =====');
  console.log(`Platform: ${status.platform} (${status.platformVersion})`);
  console.log(
    `Using mock implementations: ${status.usingMocks ? 'YES' : 'NO'}`,
  );
  console.log(
    'Auth:',
    status.services.auth.available ? 'Available' : 'NOT AVAILABLE',
  );
  console.log(
    'Auth initialized:',
    status.services.auth.initialized ? 'YES' : 'NO',
  );
  console.log(
    'Current user:',
    status.services.auth.currentUser
      ? `${status.services.auth.currentUser.email}`
      : 'None',
  );
  console.log(
    'Firestore:',
    status.services.firestore.available ? 'Available' : 'NOT AVAILABLE',
  );
  console.log(
    'Firestore initialized:',
    status.services.firestore.initialized ? 'YES' : 'NO',
  );

  if (status.issues.length > 0) {
    console.log('ISSUES DETECTED:');
    status.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  } else {
    console.log('No issues detected');
  }
  console.log('=======================================');

  return status;
};
