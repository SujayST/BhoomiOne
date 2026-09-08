import api from './api';
import { User, SavedAddress } from '../types';

export const userService = {
  async getProfile(): Promise<{ User?: User; error?: string }> {
    try {
      const res = await api.post('/user/single-user');
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Failed to fetch profile' };
    }
  },

  async getSavedAddresses(): Promise<SavedAddress[]> {
    try {
      const res = await api.post('/user/get-saved-address');
      if (Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      return [];
    }
  },

  async saveAddress(address: SavedAddress): Promise<{ success?: string; error?: string }> {
    try {
      const res = await api.post('/user/save-address', address);
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Failed to save address' };
    }
  },

  async removeSavedAddress(savedAddressId: string): Promise<any> {
    try {
      const res = await api.post('/user/remove-saved-address', { savedAddressId });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Failed to remove address' };
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success?: string; error?: string }> {
    try {
      const res = await api.post('/user/change-password', { oldPassword, newPassword });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Failed to change password' };
    }
  },
};

