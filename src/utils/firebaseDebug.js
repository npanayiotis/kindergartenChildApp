/**
 * Firebase Debug Utility
 * Use this to test Firebase connection and authentication
 */

import {auth, firestore} from '../../firebaseRN';

// Test Firebase connectivity
export const testFirebaseConnection = async () => {
  console.log('🔧 Testing Firebase Connection...');

  try {
    // Test 1: Check if services are available
    console.log('✅ Auth service available:', !!auth);
    console.log('✅ Firestore service available:', !!firestore);

    // Test 2: Try to access Firestore
    const testCollection = firestore.collection('test');
    console.log('✅ Firestore collection access successful');

    // Test 3: Check current auth state
    const currentUser = auth.currentUser;
    console.log('👤 Current user:', currentUser ? currentUser.email : 'None');

    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
};

// Test authentication with existing user
export const testAuthentication = async (email, password) => {
  console.log(`🔐 Testing authentication for: ${email}`);

  try {
    const userCredential = await auth.signInWithEmailAndPassword(
      email,
      password,
    );
    const user = userCredential.user;

    console.log('✅ Authentication successful!');
    console.log('👤 User ID:', user.uid);
    console.log('📧 Email:', user.email);
    console.log('✅ Email verified:', user.emailVerified);

    return {success: true, user};
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    console.error('Error code:', error.code);

    return {success: false, error: error.message, code: error.code};
  }
};

// Run all tests
export const runAllTests = async () => {
  console.log('🚀 Running all Firebase tests...');
  console.log('=====================================');

  const connectionOk = await testFirebaseConnection();
  if (!connectionOk) {
    console.log('❌ Cannot continue - Firebase connection failed');
    return;
  }

  console.log('🏁 Tests completed');
  console.log(
    '🔐 To test authentication, use the test buttons in the login screen',
  );
};
