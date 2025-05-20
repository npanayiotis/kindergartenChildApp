// src/context/AuthContext.tsx
import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {login as apiLogin, logout as apiLogout, User} from '../api/authService';
import {auth} from '../api/config';

const TOKEN_STORAGE_KEY = '@NannyApp:token';
const USER_STORAGE_KEY = '@NannyApp:user';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  firebaseReady: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Check if Firebase is initialized
  useEffect(() => {
    try {
      // Simple check to see if auth has been initialized
      if (auth) {
        console.log('Firebase Auth is available');
        setFirebaseReady(true);
      } else {
        console.error('Firebase Auth is not available');
      }
    } catch (error) {
      console.error('Error checking Firebase Auth:', error);
    }
  }, []);

  // Load token from storage on startup
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);

        if (storedToken) {
          setToken(storedToken);
        }

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<string | null> => {
    if (!firebaseReady) {
      return 'Firebase Authentication is not initialized yet. Please restart the app.';
    }

    try {
      const result = await apiLogin(email, password);

      if (result.error) {
        return result.error;
      }

      if (result.data) {
        // Save to state
        setToken(result.data.token);
        setUser(result.data.user);

        // Save to storage
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, result.data.token);
        await AsyncStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify(result.data.user),
        );

        return null;
      }

      return 'An unknown error occurred';
    } catch (error) {
      console.error('Login error:', error);
      return 'Network error. Please check your connection.';
    }
  };

  const logout = async (): Promise<void> => {
    if (!firebaseReady) {
      console.warn(
        'Firebase Authentication is not initialized, but proceeding with local logout',
      );
    }

    try {
      // Clear state
      setToken(null);
      setUser(null);

      // Clear storage
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);

      // Call API logout (optional if your backend requires it)
      if (firebaseReady) {
        await apiLogout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{token, user, isLoading, firebaseReady, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
