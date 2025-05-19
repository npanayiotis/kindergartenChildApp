// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, logout as apiLogout, User } from '../api/auth';

const TOKEN_STORAGE_KEY = '@NannyApp:token';
const USER_STORAGE_KEY = '@NannyApp:user';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const login = async (email: string, password: string): Promise<string | null> => {
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
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.data.user));
        
        return null;
      }
      
      return 'An unknown error occurred';
    } catch (error) {
      console.error('Login error:', error);
      return 'Network error. Please check your connection.';
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear state
      setToken(null);
      setUser(null);
      
      // Clear storage
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      
      // Call API logout (optional if your backend requires it)
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
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
