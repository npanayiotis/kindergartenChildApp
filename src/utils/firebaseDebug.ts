import {Platform} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * Firebase Debug Utilities - Updated for React Native Firebase
 */

// Check Firebase status
export const checkFirebaseStatus = () => {
  console.log('🔍 [DEBUG] Checking Firebase status...');

  const status = {
    platform: Platform.OS,
    platformVersion: Platform.Version,
    services: {
      auth: {
        available: false,
        initialized: false,
        currentUser: null,
      },
      firestore: {
        available: false,
        initialized: false,
      },
    },
    issues: [] as string[],
  };

  try {
    // Check Auth service
    const authService = auth();
    status.services.auth.available = !!authService;
    status.services.auth.initialized = true;
    status.services.auth.currentUser = authService.currentUser;

    console.log('✅ [DEBUG] Auth service available');
  } catch (error) {
    console.error('❌ [DEBUG] Auth service error:', error);
    status.issues.push(
      'Auth service not available: ' + (error as Error).message,
    );
  }

  try {
    // Check Firestore service
    const firestoreService = firestore();
    status.services.firestore.available = !!firestoreService;
    status.services.firestore.initialized = true;

    console.log('✅ [DEBUG] Firestore service available');
  } catch (error) {
    console.error('❌ [DEBUG] Firestore service error:', error);
    status.issues.push(
      'Firestore service not available: ' + (error as Error).message,
    );
  }

  return status;
};

// Test Firebase authentication
export const testFirebaseAuth = async (email: string, password: string) => {
  console.log(`🔐 [DEBUG] Testing authentication for: ${email}`);

  try {
    const userCredential = await auth().signInWithEmailAndPassword(
      email,
      password,
    );
    const user = userCredential.user;

    console.log('✅ [DEBUG] Authentication successful!');
    console.log('👤 User ID:', user.uid);
    console.log('📧 Email:', user.email);

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        role: 'parent', // Default, you can enhance this
      },
    };
  } catch (error: any) {
    console.error('❌ [DEBUG] Authentication failed:', error.message);
    console.error('Error code:', error.code);

    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

// Log Firebase environment info
export const logFirebaseEnvironment = () => {
  console.log('==========================================');
  console.log('🔥 FIREBASE ENVIRONMENT INFO');
  console.log('==========================================');

  const status = checkFirebaseStatus();

  console.log('📱 Platform:', status.platform, status.platformVersion);
  console.log('🔐 Auth Available:', status.services.auth.available);
  console.log('📦 Firestore Available:', status.services.firestore.available);
  console.log(
    '👤 Current User:',
    status.services.auth.currentUser?.email || 'None',
  );

  if (status.issues.length > 0) {
    console.log('⚠️ Issues:');
    status.issues.forEach(issue => console.log('  -', issue));
  }

  console.log('==========================================');
};

// Test Firestore connection
export const testFirestoreConnection = async () => {
  console.log('🔧 [DEBUG] Testing Firestore connection...');

  try {
    // Try to read from a test collection
    const testRef = firestore().collection('test').limit(1);
    await testRef.get();

    console.log('✅ [DEBUG] Firestore connection successful');
    return true;
  } catch (error) {
    console.error('❌ [DEBUG] Firestore connection failed:', error);
    return false;
  }
};
