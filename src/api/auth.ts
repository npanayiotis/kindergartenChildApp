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

export interface User {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  userType: string;
  emailVerified?: boolean;
}

// Interface for authentication results
export class AuthResult {
  user: User | null;
  error: string | null;

  constructor(user: User | null = null, error: string | null = null) {
    this.user = user;
    this.error = error;
  }
}

// Login with email and password
export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    console.log(`Attempting login with Firebase Auth: ${email}`);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    let userData: any = {};

    if (userDoc.exists()) {
      userData = userDoc.data();
    }

    const user: User = {
      id: userCredential.user.uid,
      email: userCredential.user.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      userType: userData.userType || 'user',
      emailVerified: userCredential.user.emailVerified,
    };

    console.log('Firebase Auth login successful');
    return new AuthResult(user);
  } catch (error: any) {
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
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  userType: string = 'parent',
): Promise<AuthResult> {
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

    const user: User = {
      id: userCredential.user.uid,
      email,
      firstName,
      lastName,
      userType,
    };

    return new AuthResult(user);
  } catch (error: any) {
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
export async function logout(): Promise<AuthResult> {
  try {
    await signOut(auth);
    return new AuthResult(null);
  } catch (error: any) {
    console.error('Logout error:', error);
    return new AuthResult(null, 'Failed to sign out.');
  }
}

// Reset password
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    await sendPasswordResetEmail(auth, email);
    return new AuthResult(null);
  } catch (error: any) {
    console.error('Reset password error:', error);
    return new AuthResult(null, 'Failed to send password reset email.');
  }
}

// Auth state observer
export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async user => {
    if (user) {
      // User is signed in
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userData: any = {};

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
export async function getCurrentUser(): Promise<User | null> {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  // Get additional user data from Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  let userData: any = {};

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
