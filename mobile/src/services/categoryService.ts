import api from './api';
import { Category, Section } from '../types';

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    try {
      const res = await api.get('/category/all-category');
      return res.data?.Categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  async getCategoriesBySection(secId: string): Promise<Category[]> {
    try {
      const res = await api.post('/category/category-by-section', { secId });
      return res.data?.Categories || [];
    } catch (error) {
      console.error('Error fetching categories by section:', error);
      return [];
    }
  },

  async getCategoriesByStore(storeId: string): Promise<Category[]> {
    try {
      const res = await api.post('/category/category-by-store', { storeId });
      return res.data?.Categories || [];
    } catch (error) {
      console.error('Error fetching categories by store:', error);
      return [];
    }
  },

  async getAllSections(): Promise<Section[]> {
    try {
      const res = await api.get('/section/all-section');
      return res.data?.Sections || [];
    } catch (error) {
      console.error('Error fetching sections:', error);
      return [];
    }
  },
};

