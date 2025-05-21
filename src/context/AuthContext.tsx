// Auth Context for React Native mobile app

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api/apiService';
import {User, AuthContextType} from '../types';
import {auth as firebaseAuth, usingMockImplementation} from '../../firebaseRN';

// Define Firebase user type for TypeScript
interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role?: string;
}

// Create auth context with proper typing
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isParent: false,
  isKindergarten: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [_error, setError] = useState<Error | null>(null);
  const userRef = useRef<User | null>(null);

  // Keep userRef in sync with user state for use in interval
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Check for existing user session on app start
  useEffect(() => {
    const loadUserFromStorage = async (): Promise<void> => {
      try {
        const userDataJson = await AsyncStorage.getItem('user_data');
        const token = await AsyncStorage.getItem('auth_token');

        if (userDataJson && token) {
          console.log('[AUTH] Loaded user from storage');
          setUser(JSON.parse(userDataJson));
        } else if (firebaseAuth.currentUser) {
          // We have a current user from Firebase auth, let's use that
          console.log('[AUTH] Using current Firebase user');
          const fbUser = firebaseAuth.currentUser as FirebaseUser;

          // Convert to our User type
          const userData: User = {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'User',
            role:
              (fbUser.role as 'parent' | 'kindergarten' | 'admin') || 'parent',
          };

          setUser(userData);

          // Store for later use
          await AsyncStorage.setItem('user_data', JSON.stringify(userData));
          // Generate a token and store it
          const newToken = 'firebase-token-' + Date.now();
          await AsyncStorage.setItem('auth_token', newToken);
        }
      } catch (error) {
        console.error('[AUTH] Failed to load user data', error);
        // Clear any corrupted or invalid data
        await AsyncStorage.removeItem('user_data');
        await AsyncStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();

    // Check auth status every 30 seconds as a fallback, but use ref instead of state
    // This avoids infinite re-renders
    const intervalId = setInterval(() => {
      if (!firebaseAuth.currentUser && userRef.current !== null) {
        console.log('[AUTH] User signed out detected by interval check');
        setUser(null);
        // Clear stored data
        AsyncStorage.removeItem('user_data').catch(err =>
          console.error('[AUTH] Error removing user data:', err),
        );
        AsyncStorage.removeItem('auth_token').catch(err =>
          console.error('[AUTH] Error removing token:', err),
        );
      }
    }, 30000);

    // Cleanup the interval
    return () => clearInterval(intervalId);
  }, []); // Remove user from dependencies

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        `[AUTH] Attempting login for ${email} (using ${
          usingMockImplementation ? 'mock' : 'real'
        } implementation)`,
      );

      // Use the proper login method
      const data = await apiService.auth.login(email, password);

      console.log('[AUTH] Login successful:', data.user);
      setUser(data.user);

      // Store user data
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      await AsyncStorage.setItem('auth_token', data.token);
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('[AUTH] Logging out');

      // First clear the user state to immediately update the UI
      setUser(null);

      // Then perform the actual logout operation
      try {
        await apiService.auth.logout();
        console.log('[AUTH] Firebase logout completed');
      } catch (error) {
        console.error('[AUTH] Error during Firebase logout:', error);
        // Continue with cleanup even if Firebase logout fails
      }

      // Clear user data from storage
      try {
        await AsyncStorage.removeItem('user_data');
        await AsyncStorage.removeItem('auth_token');
        console.log('[AUTH] Local storage cleared');
      } catch (storageError) {
        console.error('[AUTH] Error clearing storage:', storageError);
      }

      console.log('[AUTH] Logout completed successfully');
    } catch (error) {
      console.error('[AUTH] Logout error', error);
      // Rethrow to allow the UI to handle the error
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Check if user is parent
  const isParent = user?.role === 'parent';

  // Check if user is kindergarten
  const isKindergarten = user?.role === 'kindergarten';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        isParent,
        isKindergarten,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
