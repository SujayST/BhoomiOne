import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export const authService = {
  async signin(email: string, password: string): Promise<{ token?: string; error?: string }> {
    try {
      const res = await api.post('/signin', { email, password });
      if (res.data?.token) {
        await AsyncStorage.setItem('user_token', res.data.token);
      }
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Login failed' };
    }
  },

  async signup(data: {
    fullname: string;
    email: string;
    password: string;
    cPassword: string;
  }): Promise<{ success?: string; error?: any }> {
    try {
      console.log("line25");
      const res = await api.post('/signup', data);
      console.log(res.data);
      
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Registration failed' };
    }
  },

  async signupApp(data: {
    name: string;
    email: string;
    mobile: string;
  }): Promise<{ success?: string; error?: any }> {
    try {
      const res = await api.post('/signup_app', data);
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'App signup failed' };
    }
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('user_profile');
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('user_token');
  },
};

