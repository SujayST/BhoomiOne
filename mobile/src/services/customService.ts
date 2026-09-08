import api from './api';
import { SliderImage } from '../types';

export const customService = {
  async getMobileBanners(): Promise<SliderImage[]> {
    try {
      const res = await api.get('/customize/get-slide-image-mobile');
      return res.data?.Images || [];
    } catch (error) {
      console.error('Error fetching mobile slider images:', error);
      return [];
    }
  },

  async getDesktopBanners(): Promise<SliderImage[]> {
    try {
      const res = await api.get('/customize/get-slide-image');
      return res.data?.Images || [];
    } catch (error) {
      console.error('Error fetching desktop slider images:', error);
      return [];
    }
  },
};

