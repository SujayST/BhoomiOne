import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { ProductCard } from '../../components/products/ProductCard';
import { colors, borderRadius } from '../../theme/colors';
import { storeService } from '../../services/storeService';
import { productService } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import { Store, Product } from '../../types';
import { Store as StoreIcon, MapPin, ShieldCheck } from 'lucide-react-native';

export const StoreDetailsScreen = ({ route, navigation }: any) => {
  const { storeId, storeName } = route.params;
  const { addToCart } = useCart();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreData();
  }, [storeId]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const [sRes, pRes] = await Promise.all([
        storeService.getSingleStore(storeId),
        productService.getProductsByStore(storeId),
      ]);
      setStore(sRes);
      setProducts(pRes);
    } catch (e) {
      console.error('Error fetching store details:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={storeName || 'Partner Store'}
        showBack
        onBack={() => navigation.goBack()}
        showCart
        onCartPress={() => navigation.navigate('CartTab')}
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading store products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.storeHeaderCard}>
              <View style={styles.storeAvatar}>
                {store?.url ? (
                  <Image source={{ uri: store.url }} style={styles.storeImg} />
                ) : (
                  <StoreIcon size={32} color={colors.primary} />
                )}
              </View>

              <Text style={styles.storeTitle}>{store?.sName || storeName}</Text>
              {store?.sDescription && (
                <Text style={styles.storeDesc}>{store.sDescription}</Text>
              )}

              {store?.sAddress && (
                <View style={styles.locRow}>
                  <MapPin size={14} color={colors.textMuted} />
                  <Text style={styles.locText}>
                    {store.sAddress} {store.sPincode ? `(${store.sPincode})` : ''}
                  </Text>
                </View>
              )}

              <View style={styles.verifiedBadge}>
                <ShieldCheck size={14} color={colors.primaryDark} />
                <Text style={styles.verifiedText}>Verified BhoomiOne Agri Distributor</Text>
              </View>

              <Text style={styles.catalogHeading}>Supplies from this Vendor ({products.length})</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.centerLoading}>
              <Text style={styles.emptyText}>No items available from this store currently.</Text>
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  storeHeaderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  storeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  storeImg: {
    width: '100%',
    height: '100%',
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  storeDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  locText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 6,
    marginTop: 10,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  catalogHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

