import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBackendUrl = (): string => {
  // 1. Try to extract IP from Expo development bundler host (e.g. "192.168.1.4:8081")
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000/api`;
    }
  }

  // 2. Android Emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }

  // 3. Fallback to local network IP or localhost
  return 'http://192.168.1.4:8000/api';
};

export const API_BASE_URL = getBackendUrl();
console.log('[BhoomiOne Mobile] Connecting to backend API:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.token = token;
      }
    } catch (error) {
      console.error('Error fetching token from storage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with helpful error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'Network Error' || !error.response) {
      console.warn(
        `[BhoomiOne Network Error] Unable to connect to ${API_BASE_URL}. Ensure your Node backend is running (cd server && npm run start:dev) and your mobile device is on the same Wi-Fi network.`
      );
    }
    return Promise.reject(error);
  }
);

export default api;

