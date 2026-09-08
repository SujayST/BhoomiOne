import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ShoppingCart, ArrowLeft, Search, Bell } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showCart?: boolean;
  onCartPress?: () => void;
  showSearch?: boolean;
  onSearchPress?: () => void;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'BhoomiOne',
  showBack = false,
  onBack,
  showCart = true,
  onCartPress,
  showSearch = false,
  onSearchPress,
  rightElement,
}) => {
  const insets = useSafeAreaInsets();
  const { cartCount } = useCart();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onBack}
              style={styles.iconButton}
            >
              <ArrowLeft size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : null}
          <Text style={[styles.title, showBack ? { marginLeft: 8 } : null]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.right}>
          {showSearch && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onSearchPress}
              style={styles.iconButton}
            >
              <Search size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          )}

          {rightElement}

          {showCart && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onCartPress}
              style={[styles.iconButton, styles.cartButton]}
            >
              <ShoppingCart size={22} color={colors.textPrimary} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
  },
  cartButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

