import api from './api';
import { Store } from '../types';

export const storeService = {
  async getAllStores(): Promise<Store[]> {
    try {
      const res = await api.get('/store/all-store');
      return res.data?.Stores || [];
    } catch (error) {
      console.error('Error fetching stores:', error);
      return [];
    }
  },

  async getSingleStore(storeId: string): Promise<Store | null> {
    try {
      const res = await api.post('/store/single-store', { storeId });
      return res.data?.Store || null;
    } catch (error) {
      console.error('Error fetching single store:', error);
      return null;
    }
  },
};

