import api from './api';
import { Order } from '../types';

export const orderService = {
  async getUserOrders(): Promise<Order[]> {
    try {
      const res = await api.post('/order/order-by-user');
      return res.data?.Orders || [];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  },

  async createOrder(data: {
    allProduct: {
      id: string;
      quantitiy: number;
      subtotal: number;
      size?: string;
    }[];
    amount: number;
    transactionDetails: any[];
    address: string;
    phone: number;
    store: string;
  }): Promise<{ success?: string; error?: string; order?: any }> {
    try {
      const res = await api.post('/order/create-order', data);
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message || 'Order creation failed' };
    }
  },

  async trackOrder(orderId: string): Promise<any> {
    try {
      const res = await api.post('/order/track-order', { orderId });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Tracking details unavailable' };
    }
  },

  async getInvoiceLink(orderId: string): Promise<{ invoiceUrl?: string; error?: string }> {
    try {
      const res = await api.post('/order/get-invoice-link', { orderId });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Invoice not available' };
    }
  },
};

