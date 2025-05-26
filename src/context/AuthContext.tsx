// Auth Context for React Native mobile app - FIXED INFINITE LOOP

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api/apiService';
import {User, AuthContextType} from '../types';
import auth from '@react-native-firebase/auth';

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
  const [error, setError] = useState<Error | null>(null);

  // Check for existing user session on app start - FIXED VERSION
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async (): Promise<void> => {
      try {
        console.log('🔍 [AUTH] Initializing authentication...');

        // First check AsyncStorage for user data
        const userDataJson = await AsyncStorage.getItem('user_data');
        const token = await AsyncStorage.getItem('auth_token');

        if (userDataJson && token) {
          console.log('✅ [AUTH] Found user data in storage');
          setUser(JSON.parse(userDataJson));
        }

        // Set up Firebase auth state listener - ONLY ONCE
        unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
          console.log(
            '🔥 [AUTH] Firebase auth state changed:',
            firebaseUser?.email || 'None',
          );

          if (firebaseUser) {
            // User is signed in
            if (!userDataJson) {
              // Create local user data if it doesn't exist
              const userData: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'User',
                role: 'parent', // Default role
              };

              setUser(userData);
              await AsyncStorage.setItem('user_data', JSON.stringify(userData));

              if (!token) {
                const newToken = 'firebase-token-' + Date.now();
                await AsyncStorage.setItem('auth_token', newToken);
              }
            }
          } else {
            // User is signed out
            if (user) {
              console.log('🚪 [AUTH] User signed out - clearing local data');
              setUser(null);
              await AsyncStorage.removeItem('user_data');
              await AsyncStorage.removeItem('auth_token');
            }
          }
        });
      } catch (error) {
        console.error('❌ [AUTH] Failed to initialize auth:', error);
        // Clear any corrupted data
        await AsyncStorage.removeItem('user_data');
        await AsyncStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // EMPTY DEPENDENCY ARRAY - run only once

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 [AUTH] Attempting login for:', email);

      const data = await apiService.auth.login(email, password);

      console.log('✅ [AUTH] Login successful for:', data.user.email);
      setUser(data.user);
    } catch (error) {
      console.error('❌ [AUTH] Login error:', error);
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
      console.log('🚪 [AUTH] Logging out...');

      // Clear user state immediately
      setUser(null);

      // Perform logout operations
      await apiService.auth.logout();

      console.log('✅ [AUTH] Logout completed successfully');
    } catch (error) {
      console.error('❌ [AUTH] Logout error:', error);
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
