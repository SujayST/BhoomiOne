import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showText?: boolean;
  totalReviews?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = 14,
  showText = false,
  totalReviews,
}) => {
  const roundedRating = Math.round(Number(rating) || 0);

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {Array.from({ length: maxStars }).map((_, index) => {
          const isFilled = index < roundedRating;
          return (
            <Star
              key={index}
              size={size}
              color={isFilled ? colors.accent : colors.borderDark}
              fill={isFilled ? colors.accent : 'transparent'}
            />
          );
        })}
      </View>
      {showText && (
        <Text style={styles.ratingText}>
          {Number(rating).toFixed(1)}
          {totalReviews !== undefined && (
            <Text style={styles.reviewsCount}> ({totalReviews})</Text>
          )}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  reviewsCount: {
    color: colors.textMuted,
    fontWeight: '400',
  },
});

