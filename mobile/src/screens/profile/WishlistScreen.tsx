import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { ProductCard } from '../../components/products/ProductCard';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { productService } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';
import { Heart, ShoppingBag } from 'lucide-react-native';

export const WishlistScreen = ({ navigation }: any) => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      // Fetch products
      const list = await productService.getAllProducts();
      // Show sample saved products for the farmer
      setProducts(list.slice(0, 4));
    } catch (e) {
      console.error('Error fetching wishlist:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Saved For Next Season"
        showBack
        onBack={() => navigation.goBack()}
        showCart
        onCartPress={() => navigation.navigate('CartTab')}
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading saved items...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerLoading}>
              <Heart size={54} color={colors.primaryMuted} />
              <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
              <Text style={styles.emptySubtitle}>Save seeds and equipment for your upcoming crops.</Text>
              <Button
                title="Discover Products"
                onPress={() => navigation.navigate('HomeTab')}
                size="md"
                style={{ marginTop: 16 }}
              />
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
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});

