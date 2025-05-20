import {auth as firebaseAuth, db, apiClient} from './config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {doc, getDoc, setDoc} from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Helper to check if Firebase Auth is available
function isFirebaseAuthAvailable() {
  return (
    firebaseAuth &&
    typeof firebaseAuth.signInWithEmailAndPassword === 'function'
  );
}

// Login using Firebase first, then authenticate with the API
export async function login(
  email: string,
  password: string,
): Promise<ApiResponse<AuthResponse>> {
  try {
    console.log('[AUTH] Login attempt for:', email);

    // First check if Firebase is properly initialized
    if (!isFirebaseAuthAvailable()) {
      console.error('[AUTH] Firebase Auth is not properly initialized!');
      return {
        error:
          'Firebase authentication is not available. Please restart the app.',
      };
    }

    // Try Firebase Auth
    try {
      console.log('[AUTH] Attempting Firebase login...');

      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );

      console.log('[AUTH] Firebase login successful, fetching user data...');

      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      let userData: any = {};

      if (userDoc.exists()) {
        userData = userDoc.data();
        console.log('[AUTH] User data retrieved from Firestore');
      } else {
        console.log('[AUTH] No user data found in Firestore');
      }

      const user = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        userType: userData.userType || 'user',
      };

      console.log('[AUTH] Firebase login complete for user:', user.id);

      // Return the Firebase user in the expected format
      return {
        data: {
          token: await userCredential.user.getIdToken(),
          user,
        },
      };
    } catch (firebaseError: any) {
      console.log(
        '[AUTH] Firebase login failed:',
        firebaseError.message,
        'Trying API login...',
      );

      // If Firebase fails, try the API login
      try {
        console.log('[AUTH] Attempting API login...');

        const response = await apiClient.post('/auth/login', {
          email,
          password,
        });

        console.log('[AUTH] API Login successful');
        return {data: response.data};
      } catch (error: any) {
        console.log('[AUTH] API login error:', error);

        // Enhanced error handling for API errors
        if (error.response) {
          return {error: error.response.data.error || 'Login failed'};
        } else if (error.request) {
          return {
            error:
              'No response received from server. Please check your connection.',
          };
        } else {
          return {
            error:
              error.message || 'Network error. Please check your connection.',
          };
        }
      }
    }
  } catch (error: any) {
    console.error('[AUTH] Unhandled login error:', error);
    return {error: 'An unexpected error occurred during login.'};
  }
}

// Register using Firebase, then create account in the API
export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<ApiResponse<AuthResponse>> {
  try {
    console.log('[AUTH] Registration attempt for:', email);

    // First check if Firebase is properly initialized
    if (!isFirebaseAuthAvailable()) {
      console.error('[AUTH] Firebase Auth is not properly initialized!');
      return {
        error:
          'Firebase authentication is not available. Please restart the app.',
      };
    }

    // Register with Firebase
    try {
      console.log('[AUTH] Attempting Firebase registration...');

      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );

      console.log('[AUTH] Firebase account created, saving user data...');

      // Save additional user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        firstName,
        lastName,
        userType: 'parent',
        createdAt: new Date(),
      });

      console.log('[AUTH] Firebase registration successful');

      // Return in standard format
      return {
        data: {
          token: await userCredential.user.getIdToken(),
          user: {
            id: userCredential.user.uid,
            email: email,
            firstName: firstName,
            lastName: lastName,
            userType: 'parent',
          },
        },
      };
    } catch (firebaseError: any) {
      console.error(
        '[AUTH] Firebase registration failed:',
        firebaseError.message,
      );
      return {error: firebaseError.message};
    }
  } catch (error: any) {
    console.error('[AUTH] Registration error:', error);
    return {error: 'An error occurred during registration.'};
  }
}

// Logout from both Firebase and the API
export async function logout(): Promise<ApiResponse<void>> {
  try {
    console.log('[AUTH] Logout attempt');

    // First check if Firebase is properly initialized
    if (!isFirebaseAuthAvailable()) {
      console.warn(
        '[AUTH] Firebase Auth is not properly initialized, proceeding with local logout',
      );
      return {data: undefined};
    }

    await signOut(firebaseAuth);
    console.log('[AUTH] Logout successful');
    // Also logout from API if needed
    return {data: undefined};
  } catch (error: any) {
    console.error('[AUTH] Logout error:', error);
    return {error: 'Error logging out.'};
  }
}

// Get the auth header (for API requests that need authentication)
export function getAuthHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}
