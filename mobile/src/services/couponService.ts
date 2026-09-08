import api from './api';
import { Coupon } from '../types';

export const couponService = {
  async getAllCoupons(): Promise<Coupon[]> {
    try {
      const res = await api.get('/coupon/get-allcoupon');
      return res.data?.Coupons || res.data || [];
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return [];
    }
  },
};

