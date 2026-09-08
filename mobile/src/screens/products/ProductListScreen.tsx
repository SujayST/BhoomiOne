import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { ProductCard } from '../../components/products/ProductCard';
import { colors, borderRadius } from '../../theme/colors';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react-native';

export const ProductListScreen = ({ route, navigation }: any) => {
  const { categoryId, categoryName, storeId, storeName } = route.params || {};
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'default' | 'priceLow' | 'priceHigh'>('default');

  const pageTitle = categoryName || storeName || 'Farm Supplies';

  useEffect(() => {
    fetchProducts();
  }, [categoryId, storeId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let list: Product[] = [];
      if (categoryId) {
        list = await productService.getProductsByCategory(categoryId);
      } else if (storeId) {
        list = await productService.getProductsByStore(storeId);
      } else {
        list = await productService.getAllProducts();
      }
      setProducts(list);
      setFilteredProducts(list);
    } catch (e) {
      console.error('Error fetching product list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.pName.toLowerCase().includes(q) ||
          p.pDescription.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'priceLow') {
      result.sort((a, b) => a.pPrice - b.pPrice);
    } else if (sortBy === 'priceHigh') {
      result.sort((a, b) => b.pPrice - a.pPrice);
    }

    setFilteredProducts(result);
  }, [searchQuery, sortBy, products]);

  const toggleSort = () => {
    if (sortBy === 'default') setSortBy('priceLow');
    else if (sortBy === 'priceLow') setSortBy('priceHigh');
    else setSortBy('default');
  };

  return (
    <View style={styles.container}>
      <Header
        title={pageTitle}
        showBack
        onBack={() => navigation.goBack()}
        showCart
        onCartPress={() => navigation.navigate('CartTab')}
      />

      {/* Search & Sort Bar */}
      <View style={styles.filterBar}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search seeds, fertilizers, tools..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textMuted}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
          <ArrowUpDown size={16} color={colors.textSecondary} />
          <Text style={styles.sortButtonText}>
            {sortBy === 'priceLow'
              ? '₹ Low-High'
              : sortBy === 'priceHigh'
              ? '₹ High-Low'
              : 'Sort'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={styles.emptyTitle}>No matching products</Text>
              <Text style={styles.emptySubtitle}>Try changing your search terms</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() =>
                navigation.navigate('ProductDetails', { productId: item._id })
              }
              onAddToCart={() => addToCart(item, 1)}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 6,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyView: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
});

