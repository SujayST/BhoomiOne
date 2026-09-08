import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    fullname: string;
    email: string;
    password: string;
    cPassword: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoredAuth = async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem('user_token');
      if (storedToken) {
        setToken(storedToken);
        const profileRes = await userService.getProfile();
        if (profileRes.User) {
          setUser(profileRes.User);
        }
      }
    } catch (error) {
      console.error('Failed to load stored auth session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await authService.signin(email, pass);
      if (res.token) {
        setToken(res.token);
        const profileRes = await userService.getProfile();
        if (profileRes.User) {
          setUser(profileRes.User);
        }
        return { success: true };
      }
      return { success: false, error: res.error || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (data: {
    fullname: string;
    email: string;
    password: string;
    cPassword: string;
  }) => {
    try {
      const res = await authService.signup(data);
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: typeof res.error === 'object' ? Object.values(res.error).find(Boolean) as string : (res.error || 'Registration failed') };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const profileRes = await userService.getProfile();
      if (profileRes.User) {
        setUser(profileRes.User);
      }
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

