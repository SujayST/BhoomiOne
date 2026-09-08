import api from './api';
import { Product } from '../types';

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    try {
      const res = await api.get('/product/all-product');
      return res.data?.Products || [];
    } catch (error) {
      console.error('Error fetching all products:', error);
      return [];
    }
  },

  async getSingleProduct(pId: string): Promise<Product | null> {
    try {
      const res = await api.post('/product/single-product', { pId });
      return res.data?.Product || null;
    } catch (error) {
      console.error('Error fetching single product:', error);
      return null;
    }
  },

  async getProductsByCategory(catId: string): Promise<Product[]> {
    try {
      const res = await api.post('/product/product-by-category', { catId });
      return res.data?.Products || [];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  },

  async getProductsBySection(secId: string): Promise<Product[]> {
    try {
      const res = await api.post('/product/product-by-section', { secId });
      return res.data?.Products || [];
    } catch (error) {
      console.error('Error fetching products by section:', error);
      return [];
    }
  },

  async getProductsByStore(storeId: string): Promise<Product[]> {
    try {
      const res = await api.post('/product/product-by-store', { storeId });
      return res.data?.Products || [];
    } catch (error) {
      console.error('Error fetching products by store:', error);
      return [];
    }
  },

  async getProductsByPrice(price: number): Promise<Product[]> {
    try {
      const res = await api.post('/product/product-by-price', { price });
      return res.data?.Products || [];
    } catch (error) {
      console.error('Error fetching products by price:', error);
      return [];
    }
  },

  async addReview(pId: string, rating: string, review: string): Promise<any> {
    try {
      const res = await api.post('/product/add-review', { pId, rating, review });
      return res.data;
    } catch (error) {
      console.error('Error adding review:', error);
      return null;
    }
  },
};

