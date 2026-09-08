import api from './api';
import { Product, Category, Order, User, SliderImage } from '../types';

export interface DashboardStats {
  Categories: number;
  Products: number;
  Orders: number;
  Users: number;
  RecentUsers?: number;
  RecentOrders?: number;
}

export const adminService = {
  async getDashboardData(): Promise<DashboardStats | null> {
    try {
      const res = await api.post('/customize/dashboard-data');
      return res.data || null;
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      return null;
    }
  },

  async getAllOrders(): Promise<Order[]> {
    try {
      const res = await api.get('/order/get-all-orders');
      return res.data?.Orders || [];
    } catch (error) {
      console.error('Error fetching all admin orders:', error);
      return [];
    }
  },

  async updateOrderStatus(oId: string, status: string): Promise<{ success?: string; error?: string }> {
    try {
      const res = await api.post('/order/update-order', { oId, status });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Failed to update order' };
    }
  },

  async deleteOrder(oId: string): Promise<{ success?: string; error?: string }> {
    try {
      const res = await api.post('/order/delete-order', { oId });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Failed to delete order' };
    }
  },

  async createShipment(oId: string): Promise<any> {
    try {
      const res = await api.post('/order/create-shippment', { oId });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Shipment creation failed' };
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const res = await api.get('/user/all-user');
      return res.data?.Users || [];
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  },

  async addProduct(formData: FormData): Promise<{ success?: string; error?: string; data?: any }> {
    try {
      const res = await api.post('/product/add-product', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Failed to add product' };
    }
  },

  async deleteProduct(pId: string): Promise<{ success?: string; error?: string }> {
    try {
      const res = await api.post('/product/delete-product', { pId });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Failed to delete product' };
    }
  },

  async addCategory(formData: FormData): Promise<{ success?: string; error?: string }> {
    try {
      const res = await api.post('/category/add-category', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Failed to add category' };
    }
  },

  async deleteCategory(cId: string): Promise<{ success?: string; error?: string }> {
    try {
      const res = await api.post('/category/delete-category', { cId });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Failed to delete category' };
    }
  },

  async uploadBanner(formData: FormData): Promise<{ success?: string; error?: string }> {
    try {
      const res = await api.post('/customize/upload-slide-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Failed to upload banner' };
    }
  },

  async deleteSlideImage(id: string): Promise<{ success?: string; error?: string }> {
    try {
      const res = await api.post('/customize/delete-slide-image', { id });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Failed to delete banner' };
    }
  },
};

