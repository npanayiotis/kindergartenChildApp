import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import {doc, getDoc, setDoc} from 'firebase/firestore';
import {auth, db} from './config';

// Interface for authentication results
export class AuthResult {
  constructor(user = null, error = null) {
    this.user = user;
    this.error = error;
  }
}

// Login with email and password
export async function login(email, password) {
  try {
    console.log(`Attempting login with Firebase Auth: ${email}`);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    let userData = {};

    if (userDoc.exists()) {
      userData = userDoc.data();
    }

    const user = {
      id: userCredential.user.uid,
      email: userCredential.user.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      userType: userData.userType || 'user',
      emailVerified: userCredential.user.emailVerified,
    };

    console.log('Firebase Auth login successful');
    return new AuthResult(user);
  } catch (error) {
    console.error('Firebase Auth login error:', error);

    // Map Firebase error messages to user-friendly messages
    let errorMessage = 'Login failed. Please try again.';

    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMessage = 'Invalid email or password.';
        break;
      case 'auth/too-many-requests':
        errorMessage =
          'Too many failed login attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection.';
        break;
    }

    return new AuthResult(null, errorMessage);
  }
}

// Register new user
export async function register(
  email,
  password,
  firstName,
  lastName,
  userType = 'parent',
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Update user profile
    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`,
    });

    // Save additional user data to Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      firstName,
      lastName,
      userType,
      createdAt: new Date(),
    });

    return new AuthResult({
      id: userCredential.user.uid,
      email,
      firstName,
      lastName,
      userType,
    });
  } catch (error) {
    console.error('Registration error:', error);

    let errorMessage = 'Registration failed. Please try again.';

    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email address is already in use.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection.';
        break;
    }

    return new AuthResult(null, errorMessage);
  }
}

// Sign out
export async function logout() {
  try {
    await signOut(auth);
    return new AuthResult(null);
  } catch (error) {
    console.error('Logout error:', error);
    return new AuthResult(null, 'Failed to sign out.');
  }
}

// Reset password
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return new AuthResult(null);
  } catch (error) {
    console.error('Reset password error:', error);
    return new AuthResult(null, 'Failed to send password reset email.');
  }
}

// Auth state observer
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, async user => {
    if (user) {
      // User is signed in
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userData = {};

      if (userDoc.exists()) {
        userData = userDoc.data();
      }

      callback({
        id: user.uid,
        email: user.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        userType: userData.userType || 'user',
        emailVerified: user.emailVerified,
      });
    } else {
      // User is signed out
      callback(null);
    }
  });
}

// Get current authenticated user
export async function getCurrentUser() {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  // Get additional user data from Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  let userData = {};

  if (userDoc.exists()) {
    userData = userDoc.data();
  }

  return {
    id: user.uid,
    email: user.email,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    userType: userData.userType || 'user',
    emailVerified: user.emailVerified,
  };
}
