import api from './api';
import { Product } from '../types';
import * as Speech from 'expo-speech';

export interface AIQueryResponse {
  success: boolean;
  query: string;
  topic: string;
  answer: string;
  weatherAdvisory?: string;
  recommendedProducts: Product[];
  followUps?: string[];
}

export interface FeaturedAITopic {
  id: string;
  title: string;
  query: string;
  icon: string;
  category: string;
}

export const aiService = {
  async askQuestion(query: string): Promise<AIQueryResponse> {
    try {
      const res = await api.post('/ai/ask', { query });
      if (res.data?.success) {
        return res.data;
      }
      throw new Error(res.data?.error || 'Failed to get answer');
    } catch (error: any) {
      console.warn('AI Assistant network call failed, utilizing offline fallback:', error.message);
      return aiService.getOfflineFallback(query);
    }
  },

  async getFeaturedTopics(): Promise<FeaturedAITopic[]> {
    try {
      const res = await api.get('/ai/topics');
      return res.data?.topics || [];
    } catch (e) {
      return [
        {
          id: '1',
          title: 'Tomato & Chilli Leaf Curl',
          query: 'How to cure tomato leaf curl virus and whiteflies?',
          icon: 'bug',
          category: 'Crop Protection',
        },
        {
          id: '2',
          title: 'Fertilizer & NPK Dosage',
          query: 'What is the best NPK fertilizer for crop flowering and fruiting?',
          icon: 'sprout',
          category: 'Nutrition',
        },
        {
          id: '3',
          title: 'Monsoon Weather Advisory',
          query: 'Weather and rainfall advice for farming this week',
          icon: 'cloud-rain',
          category: 'Weather',
        },
        {
          id: '4',
          title: 'High-Yield Hybrid Seeds',
          query: 'Recommend best certified hybrid seeds for high yield',
          icon: 'package',
          category: 'Seeds',
        },
        {
          id: '5',
          title: 'Drip & Sprayer Tools',
          query: 'Best battery sprayers and farm machinery for horticulture',
          icon: 'wrench',
          category: 'Machinery',
        },
      ];
    }
  },

  // Voice synthesis (Text-to-Speech)
  speak(text: string, onDone?: () => void) {
    try {
      Speech.stop();
      // Clean markdown bullets for smooth voice delivery
      const cleanVoiceText = text
        .replace(/•/g, '')
        .replace(/\n+/g, '. ')
        .replace(/[*_#]/g, '');

      Speech.speak(cleanVoiceText, {
        language: 'en-IN',
        pitch: 1.0,
        rate: 0.95,
        onDone: onDone,
        onError: () => {
          if (onDone) onDone();
        },
      });
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (onDone) onDone();
    }
  },

  stopSpeaking() {
    try {
      Speech.stop();
    } catch (e) {}
  },

  getOfflineFallback(query: string): AIQueryResponse {
    const q = query.toLowerCase();
    if (q.includes('leaf curl') || q.includes('curl') || q.includes('virus') || q.includes('tomato')) {
      return {
        success: true,
        query,
        topic: 'Crop Disease & Pest Management',
        answer: 'Leaf curl in tomato and chilli is primarily caused by virus transmitted by whiteflies or mites.\n\n• Immediate Spray: Apply Neem Oil (3-5ml/L) or Acetamiprid/Imidacloprid (0.5ml/L) to control whiteflies.\n• Organic Remedy: Spray sour buttermilk solution (50ml/L) every 7 days.\n• Nutrition: Spray Micronutrient Zinc + Boron to stimulate fresh foliage growth.',
        weatherAdvisory: 'Warm, dry weather accelerates whitefly spread. Maintain adequate soil moisture.',
        recommendedProducts: [],
        followUps: ['Best organic neem spray?', 'NPK dosage for tomatoes', 'Whitefly traps'],
      };
    }
    if (q.includes('fertilizer') || q.includes('npk') || q.includes('growth') || q.includes('urea')) {
      return {
        success: true,
        query,
        topic: 'Soil Nutrition & Fertilization',
        answer: 'Optimal crop nutrition requires stage-wise NPK application:\n\n• Sowing: Apply NPK 19:19:19 or DAP + Potash for strong root establishment.\n• Vegetative Growth: Apply High-Nitrogen (NPK 12:61:00 or Urea) for lush green growth.\n• Flowering & Fruiting: Switch to High-Potassium (NPK 0:52:34 or NPK 0:0:50) with Boron.',
        weatherAdvisory: 'Apply granular fertilizers when soil is moist or before light irrigation.',
        recommendedProducts: [],
        followUps: ['NPK 19:19:19 dosage per acre?', 'Prevent flower drop', 'Organic bio-fertilizers'],
      };
    }
    return {
      success: true,
      query,
      topic: 'General Agricultural Advisory',
      answer: `Agricultural Advisory for "${query}":\n\n• Soil & Crop Health: Ensure soil is tested for N-P-K and pH (ideal 6.5-7.5). Practice crop rotation and incorporate organic manure.\n• Pest Monitoring: Inspect the underside of leaves weekly for early signs of sucking pests or fungal spots.\n• Quality Inputs: Use certified hybrid seeds and balanced water-soluble fertilizers for maximum yield.`,
      weatherAdvisory: 'Maintain optimal field moisture and avoid spraying during high noon winds or direct rain.',
      recommendedProducts: [],
      followUps: ['Best fertilizers for current season?', 'How to cure pest attacks?', 'Recommend high-yield seeds'],
    };
  },
};

