import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { colors, borderRadius, typography } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { BannerCarousel } from '../../components/home/BannerCarousel';
import { CategoryChips } from '../../components/home/CategoryChips';
import { ProductCard } from '../../components/products/ProductCard';
import { KisanVoiceWidget } from '../../components/home/KisanVoiceWidget';
import { VoiceAssistantModal } from '../../components/home/VoiceAssistantModal';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { storeService } from '../../services/storeService';
import { customService } from '../../services/customService';
import { Product, Category, Store, SliderImage } from '../../types';
import { useCart } from '../../context/CartContext';
import { useFocusEffect } from '@react-navigation/native';
import { Store as StoreIcon, ShieldCheck, Truck, Award, Sparkles, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const HomeScreen = ({ navigation }: any) => {
  const { addToCart } = useCart();

  const [banners, setBanners] = useState<SliderImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Voice Assistant Modal State
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [activeVoiceQuery, setActiveVoiceQuery] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHomeData = async () => {
    try {
      const [bannersRes, catRes, storesRes, productsRes] = await Promise.all([
        customService.getMobileBanners().catch(() => customService.getDesktopBanners()),
        categoryService.getAllCategories(),
        storeService.getAllStores(),
        productService.getAllProducts(),
      ]);

      setBanners(bannersRes || []);
      setCategories(catRes || []);
      setStores(storesRes || []);
      setProducts(productsRes || []);
    } catch (e) {
      console.error('Error loading home data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHomeData();
  }, []);

  const handleCategorySelect = async (cat: Category | null) => {
    setSelectedCategory(cat);
    if (!cat) {
      const all = await productService.getAllProducts();
      setProducts(all);
    } else {
      const filtered = await productService.getProductsByCategory(cat._id);
      setProducts(filtered);
    }
  };

  const handleAddToCart = async (product: Product) => {
    await addToCart(product, 1);
  };

  // Top deals (products with offers or high discount)
  const topDeals = products.filter((p) => !!p.pOffer).slice(0, 6);

  return (
    <View style={styles.container}>
      <Header
        title="BhoomiOne"
        showSearch
        onSearchPress={() => navigation.navigate('ProductList', { autoFocus: true })}
        onCartPress={() => navigation.navigate('CartTab')}
      />

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading farm supplies...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {/* Hero Banner Carousel */}
          {banners.length > 0 && <BannerCarousel banners={banners} />}

          {/* Major Voice AI Assistant Hero Widget */}
          <KisanVoiceWidget
            onOpenVoiceAssistant={(initialQ) => {
              setActiveVoiceQuery(initialQ);
              setVoiceModalVisible(true);
            }}
          />

          {/* Value Propositions / Trust Bar */}
          <View style={styles.trustBar}>
            <View style={styles.trustItem}>
              <ShieldCheck size={18} color={colors.primary} />
              <Text style={styles.trustText}>100% Genuine</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Truck size={18} color={colors.primary} />
              <Text style={styles.trustText}>Farm Delivery</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Award size={18} color={colors.primary} />
              <Text style={styles.trustText}>Best Price</Text>
            </View>
          </View>

          {/* Category Chips */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CategoriesTab')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <CategoryChips
            categories={categories}
            selectedCategoryId={selectedCategory?._id || null}
            onSelectCategory={handleCategorySelect}
          />

          {/* Top Deals Horizontal Section */}
          {topDeals.length > 0 && (
            <View style={styles.dealsSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.titleWithIcon}>
                  <Sparkles size={20} color={colors.accent} />
                  <Text style={styles.sectionTitle}>Season Special Deals</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalProducts}
              >
                {topDeals.map((product) => (
                  <View key={product._id} style={{ width: 160, marginRight: 12 }}>
                    <ProductCard
                      product={product}
                      onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
                      onAddToCart={handleAddToCart}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Partner Stores / Agri Hubs */}
          {stores.length > 0 && (
            <View style={styles.storesSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.titleWithIcon}>
                  <StoreIcon size={20} color={colors.primaryDark} />
                  <Text style={styles.sectionTitle}>Verified Partner Stores</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storesContainer}
              >
                {stores.map((store) => (
                  <TouchableOpacity
                    key={store._id}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('StoreDetails', { storeId: store._id, storeName: store.sName })}
                    style={styles.storeCard}
                  >
                    <View style={styles.storeAvatar}>
                      {store.url ? (
                        <Image source={{ uri: store.url }} style={styles.storeImage} />
                      ) : (
                        <StoreIcon size={24} color={colors.primary} />
                      )}
                    </View>
                    <Text style={styles.storeTitle} numberOfLines={1}>
                      {store.sName}
                    </Text>
                    {store.sAddress && (
                      <Text style={styles.storeLoc} numberOfLines={1}>
                        {store.sAddress}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Main Products Grid */}
          <View style={styles.productsGridSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory ? `${selectedCategory.cName} Supplies` : 'All Agricultural Supplies'}
              </Text>
              <Text style={styles.productCount}>{products.length} Items</Text>
            </View>

            {products.length === 0 ? (
              <View style={styles.emptyProducts}>
                <Text style={styles.emptyText}>No products found in this category.</Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {products.map((item) => (
                  <ProductCard
                    key={item._id}
                    product={item}
                    onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Voice Assistant Dialogue Modal */}
      <VoiceAssistantModal
        visible={voiceModalVisible}
        onClose={() => {
          setVoiceModalVisible(false);
          setActiveVoiceQuery(undefined);
        }}
        initialQuery={activeVoiceQuery}
        navigation={navigation}
      />
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  trustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  trustDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  productCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  dealsSection: {
    marginTop: 8,
  },
  horizontalProducts: {
    paddingHorizontal: 16,
  },
  storesSection: {
    marginTop: 8,
  },
  storesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  storeCard: {
    width: 130,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  storeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  storeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  storeLoc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  productsGridSection: {
    paddingBottom: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  emptyProducts: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});

