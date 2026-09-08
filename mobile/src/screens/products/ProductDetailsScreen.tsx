import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { RatingStars } from '../../components/products/RatingStars';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Store,
  Heart,
  Share2,
  Minus,
  Plus,
  ShoppingBag,
  Star,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const ProductDetailsScreen = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [productId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await productService.getSingleProduct(productId);
      setProduct(res);
    } catch (e) {
      console.error('Error fetching product details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    const success = await addToCart(product, quantity);
    setAddingToCart(false);
    if (success) {
      Alert.alert('Added to Cart', `${product.pName} (${quantity}) added to your cart.`, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'Go to Cart', onPress: () => navigation.navigate('CartTab') },
      ]);
    } else {
      Alert.alert('Notice', 'Please sign in to add items to your cart.', [
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    const success = await addToCart(product, quantity);
    if (success) {
      navigation.navigate('CartTab');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const images = product.url && product.url.length > 0 ? product.url : [];
  const storeName = typeof product.pStore === 'object' && product.pStore !== null ? product.pStore.sName : undefined;
  const storeId = typeof product.pStore === 'object' && product.pStore !== null ? product.pStore._id : undefined;

  const reviews = product.pRatingsReviews || [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
      : 4.5;

  return (
    <View style={styles.container}>
      <Header
        title={product.pName}
        showBack
        onBack={() => navigation.goBack()}
        showCart
        onCartPress={() => navigation.navigate('CartTab')}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Image Gallery */}
        <View style={styles.galleryContainer}>
          {images.length > 0 ? (
            <Image
              source={{ uri: images[selectedImageIndex] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ShoppingBag size={64} color={colors.primaryMuted} />
            </View>
          )}

          {product.pOffer && (
            <View style={styles.offerBadge}>
              <Badge label={`${product.pOffer}% OFF`} variant="warning" size="md" />
            </View>
          )}
        </View>

        {/* Thumbnail Selector */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailsRow}
          >
            {images.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedImageIndex(idx)}
                style={[
                  styles.thumbnailWrapper,
                  selectedImageIndex === idx && styles.activeThumbnail,
                ]}
              >
                <Image source={{ uri: img }} style={styles.thumbnail} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Title, Pricing & Store Card */}
        <View style={styles.detailsCard}>
          {storeName && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                storeId && navigation.navigate('StoreDetails', { storeId, storeName })
              }
              style={styles.storeChip}
            >
              <Store size={14} color={colors.primaryDark} />
              <Text style={styles.storeNameText}>{storeName}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.title}>{product.pName}</Text>

          <View style={styles.ratingRow}>
            <RatingStars rating={avgRating} size={16} showText totalReviews={reviews.length} />
            <Text style={styles.soldBadge}>• {product.pSold || 0} Sold</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.pPrice.toLocaleString('en-IN')}</Text>
            {product.pOffer && (
              <Text style={styles.originalPrice}>
                ₹{Math.round(product.pPrice * (1 + Number(product.pOffer) / 100)).toLocaleString('en-IN')}
              </Text>
            )}
            <Badge
              label={product.pStatus === 'Active' || !product.pStatus ? 'In Stock' : 'Out of Stock'}
              variant="success"
              size="sm"
            />
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                style={styles.qtyBtn}
              >
                <Minus size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity((q) => q + 1)}
                style={styles.qtyBtn}
              >
                <Plus size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Trust Badges */}
        <View style={styles.trustGrid}>
          <View style={styles.trustCard}>
            <ShieldCheck size={20} color={colors.primary} />
            <Text style={styles.trustTitle}>100% Authentic</Text>
            <Text style={styles.trustDesc}>Direct verified supply</Text>
          </View>
          <View style={styles.trustCard}>
            <Truck size={20} color={colors.primary} />
            <Text style={styles.trustTitle}>Delhivery Dispatch</Text>
            <Text style={styles.trustDesc}>Fast doorstep delivery</Text>
          </View>
          <View style={styles.trustCard}>
            <RotateCcw size={20} color={colors.primary} />
            <Text style={styles.trustTitle}>Easy Returns</Text>
            <Text style={styles.trustDesc}>Crop protection policy</Text>
          </View>
        </View>

        {/* Product Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Product Description & Application</Text>
          <Text style={styles.descriptionText}>{product.pDescription}</Text>
        </View>

        {/* Ratings & Reviews Section */}
        <View style={styles.sectionCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionHeading}>Customer Reviews ({reviews.length})</Text>
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>No reviews yet. Be the first farmer to review!</Text>
          ) : (
            reviews.map((rev, index) => (
              <View key={index} style={styles.reviewItem}>
                <View style={styles.reviewerRow}>
                  <Text style={styles.reviewerName}>
                    {rev.user?.fullname || rev.user?.name || 'Verified Farmer'}
                  </Text>
                  <RatingStars rating={Number(rev.rating)} size={12} />
                </View>
                <Text style={styles.reviewContent}>{rev.review}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button
          title="Add to Cart"
          variant="outline"
          onPress={handleAddToCart}
          loading={addingToCart}
          style={styles.cartActionBtn}
        />
        <Button
          title="Buy Now"
          variant="primary"
          onPress={handleBuyNow}
          style={styles.buyNowBtn}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  galleryContainer: {
    width: width,
    height: width * 0.85,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  offerBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  thumbnailsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    gap: 8,
  },
  thumbnailWrapper: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: colors.primary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  detailsCard: {
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 6,
    marginBottom: 8,
  },
  storeNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  soldBadge: {
    fontSize: 12,
    color: colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  originalPrice: {
    fontSize: 16,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  trustCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: 10,
    borderRadius: borderRadius.md,
  },
  trustTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  trustDesc: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noReviewsText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
    paddingVertical: 10,
  },
  reviewerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reviewContent: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cartActionBtn: {
    flex: 1,
  },
  buyNowBtn: {
    flex: 1,
  },
});

