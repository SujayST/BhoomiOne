import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Product } from '../../types';
import { colors, borderRadius } from '../../theme/colors';
import { Plus, ShoppingBag } from 'lucide-react-native';
import { RatingStars } from './RatingStars';
import { Badge } from '../common/Badge';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: (product: Product) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
}) => {
  const imageUrl = product.url && product.url.length > 0 ? product.url[0] : null;
  const storeName = typeof product.pStore === 'object' && product.pStore !== null ? product.pStore.sName : undefined;

  // Calculate average rating
  const reviews = product.pRatingsReviews || [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
      : 4.5; // fallback default rating for display

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <ShoppingBag size={32} color={colors.primaryMuted} />
          </View>
        )}

        {product.pOffer && (
          <View style={styles.badgeContainer}>
            <Badge label={`${product.pOffer}% OFF`} variant="warning" size="sm" />
          </View>
        )}
      </View>

      <View style={styles.details}>
        {storeName && (
          <Text style={styles.storeName} numberOfLines={1}>
            {storeName}
          </Text>
        )}

        <Text style={styles.productName} numberOfLines={2}>
          {product.pName}
        </Text>

        <View style={styles.ratingRow}>
          <RatingStars rating={avgRating} size={12} showText totalReviews={reviews.length} />
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>₹{product.pPrice.toLocaleString('en-IN')}</Text>
            {product.pQuantity && (
              <Text style={styles.quantity}>{product.pQuantity}</Text>
            )}
          </View>

          {onAddToCart && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              style={styles.addButton}
            >
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.9,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  image: {
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
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  details: {
    padding: 10,
  },
  storeName: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    minHeight: 36,
    lineHeight: 18,
  },
  ratingRow: {
    marginVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quantity: {
    fontSize: 11,
    color: colors.textMuted,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

