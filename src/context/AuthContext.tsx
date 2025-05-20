// Auth Context for React Native mobile app

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

  // Check for existing user session on app start
  useEffect(() => {
    const loadUserFromStorage = async (): Promise<void> => {
      try {
        const userDataJson = await AsyncStorage.getItem('user_data');
        const token = await AsyncStorage.getItem('user_token');

        if (userDataJson && token) {
          setUser(JSON.parse(userDataJson));
        }
      } catch (error) {
        console.error('Failed to load user data', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.auth.login(email, password);
      setUser(data.user);
    } catch (error) {
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
      await apiService.auth.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error', error);
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
