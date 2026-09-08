import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { productService } from '../../services/productService';
import { adminService } from '../../services/adminService';
import { Product } from '../../types';
import {
  Package,
  Plus,
  Search,
  Trash2,
  X,
  Store,
  Tag,
} from 'lucide-react-native';

export const AdminProductsScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const list = await productService.getAllProducts();
      setProducts(list);
      setFilteredProducts(list);
    } catch (e) {
      console.error('Error fetching admin products:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.pName.toLowerCase().includes(q) ||
            p.pDescription?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, products]);

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to permanently delete "${product.pName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await adminService.deleteProduct(product._id);
            if (res.success || !res.error) {
              Alert.alert('Deleted', 'Product removed successfully.');
              fetchProducts();
            } else {
              Alert.alert('Error', res.error || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={`Manage Products (${products.length})`}
        showBack
        onBack={() => navigation.goBack()}
        showCart={false}
      />

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputBox}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products by name or details..."
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
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching product list...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centerLoading}>
              <Package size={50} color={colors.primaryMuted} />
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptySubtitle}>Tap the button below to upload your first product.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const imgUrl = item.url && item.url.length > 0 ? item.url[0] : null;
            const storeName = typeof item.pStore === 'object' && item.pStore !== null ? item.pStore.sName : undefined;
            const catName = typeof item.pCategory === 'object' && item.pCategory !== null ? item.pCategory.cName : undefined;

            return (
              <View style={styles.productCard}>
                <View style={styles.imageBox}>
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={styles.image} />
                  ) : (
                    <Package size={30} color={colors.primary} />
                  )}
                </View>

                <View style={styles.productInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {item.pName}
                    </Text>
                    <Badge
                      label={item.pStatus || 'Active'}
                      variant={item.pStatus === 'Disabled' ? 'error' : 'success'}
                      size="sm"
                    />
                  </View>

                  <Text style={styles.priceText}>
                    ₹{item.pPrice?.toLocaleString('en-IN')}{' '}
                    {item.pOffer && (
                      <Text style={styles.offerText}>({item.pOffer}% OFF)</Text>
                    )}
                  </Text>

                  <View style={styles.metaRow}>
                    {catName && (
                      <View style={styles.metaChip}>
                        <Tag size={12} color={colors.primaryDark} />
                        <Text style={styles.metaChipText}>{catName}</Text>
                      </View>
                    )}
                    {storeName && (
                      <View style={styles.metaChip}>
                        <Store size={12} color={colors.textSecondary} />
                        <Text style={styles.metaChipText}>{storeName}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteProduct(item)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Floating Add Product Button */}
      <View style={styles.bottomBar}>
        <Button
          title="Upload New Product"
          onPress={() =>
            navigation.navigate('AdminAddProduct', {
              onSuccess: fetchProducts,
            })
          }
          size="lg"
          icon={<Plus size={18} color="#FFFFFF" />}
          style={styles.addBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
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
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 90,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageBox: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 2,
  },
  offerText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    gap: 4,
  },
  metaChipText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
  addBtn: {
    width: '100%',
  },
});

