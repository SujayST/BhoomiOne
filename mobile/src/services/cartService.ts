import api from './api';
import { CartResponse, CartItem } from '../types';

export const cartService = {
  async getCartItems(): Promise<CartResponse | null> {
    try {
      const res = await api.get('/cart/get-cart-items');
      return res.data || null;
    } catch (error) {
      console.error('Error fetching cart:', error);
      return null;
    }
  },

  async addItemToCart(data: {
    productId: string;
    productSize?: string;
    productQuantity: number;
    productPrice: number;
    productStoreId?: string;
    productName: string;
    productPhotoUrl?: string;
  }): Promise<any> {
    try {
      const res = await api.post('/cart/add-product', data);
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to add item to cart' };
    }
  },

  async removeItemFromCart(productId: string, productSize: string = 'default'): Promise<any> {
    try {
      const res = await api.post('/cart/remove-cart-item', { productId, productSize });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to remove item' };
    }
  },

  async changeQuantity(productId: string, productQuantity: number, productSize: string = 'default'): Promise<any> {
    try {
      const res = await api.post('/cart/change-quantity', {
        productId,
        productSize,
        productQuantity,
      });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to change quantity' };
    }
  },

  async clearCart(): Promise<any> {
    try {
      const res = await api.get('/cart/remove-all-items');
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to clear cart' };
    }
  },

  async addToWishlist(productId: string): Promise<any> {
    try {
      const res = await api.post('/cart/add-wishlist', { productId });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to add to wishlist' };
    }
  },

  async removeFromWishlist(productId: string): Promise<any> {
    try {
      const res = await api.post('/cart/remove-from-wishlist', { productId });
      return res.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to remove from wishlist' };
    }
  },
};

