import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  CheckCircle,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';

export const CartScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  const {
    cartItems,
    cartCount,
    cartTotal,
    discount,
    appliedCoupon,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    isLoading,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState('');

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    // Standard mock coupon for dynamic verification or custom input
    const res = applyCoupon({
      _id: 'coupon_1',
      couponName: couponInput.trim().toUpperCase(),
      discount: 100,
      expiryDate: '2026-12-31',
      minAmount: 500,
    });
    setCouponMessage(res.message || '');
    if (res.success) {
      setCouponInput('');
    }
  };

  const rawSubtotal = cartItems.reduce(
    (sum, item) => sum + (item.productPrice || 0) * (item.productQuantity || 1),
    0
  );

  const deliveryFee = rawSubtotal > 999 || rawSubtotal === 0 ? 0 : 70;
  const finalTotal = Math.max(0, cartTotal + deliveryFee);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Header title="Your Farm Cart" showCart={false} />
        <View style={styles.centerContainer}>
          <ShoppingBag size={64} color={colors.primaryMuted} />
          <Text style={styles.emptyTitle}>Please Sign In</Text>
          <Text style={styles.emptySubtitle}>
            Sign in to view your cart items, apply discounts, and complete your orders.
          </Text>
          <Button
            title="Sign In / Register"
            onPress={() => navigation.navigate('Login')}
            size="lg"
            style={styles.signInButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={`Your Cart (${cartCount})`}
        showCart={false}
        rightElement={
          cartCount > 0 ? (
            <TouchableOpacity onPress={() => navigation.navigate('HomeTab')}>
              <Text style={styles.addMoreText}>+ Add Items</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {cartItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={54} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Explore seeds, crop nutrition, and farm tools to get started.
          </Text>
          <Button
            title="Browse Farm Catalog"
            onPress={() => navigation.navigate('HomeTab')}
            size="lg"
            style={styles.browseButton}
          />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Cart Item Cards */}
          <View style={styles.itemsList}>
            {cartItems.map((item, index) => {
              const pId = typeof item.productId === 'object' && item.productId !== null ? item.productId._id : (item.productId as string);
              return (
                <View key={`${pId}_${index}`} style={styles.cartCard}>
                  {item.url ? (
                    <Image
                      source={{ uri: item.url }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={[styles.productImage, styles.placeholderImgBox]}>
                      <ShoppingBag size={28} color={colors.primary} />
                    </View>
                  )}

                  <View style={styles.productInfo}>
                    {item.storeName && (
                      <Text style={styles.storeLabel} numberOfLines={1}>
                        {item.storeName}
                      </Text>
                    )}
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <Text style={styles.unitPrice}>
                      ₹{item.productPrice.toLocaleString('en-IN')}
                    </Text>

                    <View style={styles.cardActions}>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          onPress={() => updateQuantity(pId, item.productQuantity - 1, item.productSize)}
                          style={styles.qtyBtn}
                        >
                          <Minus size={14} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.productQuantity}</Text>
                        <TouchableOpacity
                          onPress={() => updateQuantity(pId, item.productQuantity + 1, item.productSize)}
                          style={styles.qtyBtn}
                        >
                          <Plus size={14} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => removeFromCart(pId, item.productSize)}
                        style={styles.removeBtn}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Coupon Code Section */}
          <View style={styles.couponSection}>
            <View style={styles.couponTitleRow}>
              <Tag size={18} color={colors.accent} />
              <Text style={styles.couponHeading}>Apply Coupon or Promo Code</Text>
            </View>

            {appliedCoupon ? (
              <View style={styles.appliedCouponBox}>
                <View style={styles.appliedLeft}>
                  <CheckCircle size={18} color={colors.success} />
                  <Text style={styles.appliedCode}>{appliedCoupon.couponName}</Text>
                  <Text style={styles.appliedDiscount}>(-₹{discount})</Text>
                </View>
                <TouchableOpacity onPress={removeCoupon}>
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponInputRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter Code (e.g. BHOOMI100)"
                  placeholderTextColor={colors.textMuted}
                  value={couponInput}
                  onChangeText={setCouponInput}
                  autoCapitalize="characters"
                />
                <Button
                  title="Apply"
                  onPress={handleApplyCoupon}
                  size="sm"
                  style={styles.applyBtn}
                />
              </View>
            )}
            {!!couponMessage && (
              <Text style={styles.couponMsgText}>{couponMessage}</Text>
            )}
          </View>

          {/* Price Breakdown */}
          <View style={styles.billSection}>
            <Text style={styles.billHeading}>Order Summary</Text>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{rawSubtotal.toLocaleString('en-IN')}</Text>
            </View>

            {discount > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: colors.success }]}>Coupon Discount</Text>
                <Text style={[styles.billValue, { color: colors.success }]}>
                  -₹{discount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Charges</Text>
              <Text style={styles.billValue}>
                {deliveryFee === 0 ? (
                  <Text style={{ color: colors.success, fontWeight: '700' }}>FREE</Text>
                ) : (
                  `₹${deliveryFee}`
                )}
              </Text>
            </View>

            <View style={styles.billDivider} />

            <View style={styles.billRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{finalTotal.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Checkout Footer Bar */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutFooter}>
          <View>
            <Text style={styles.footerTotalLabel}>Total Amount</Text>
            <Text style={styles.footerTotalVal}>₹{finalTotal.toLocaleString('en-IN')}</Text>
          </View>
          <Button
            title="Proceed to Checkout"
            onPress={() => navigation.navigate('Checkout', { finalTotal, deliveryFee, rawSubtotal })}
            size="lg"
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            style={styles.checkoutBtn}
          />
        </View>
      )}
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
    padding: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  signInButton: {
    marginTop: 24,
    minWidth: 180,
  },
  browseButton: {
    marginTop: 24,
    minWidth: 200,
  },
  addMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  itemsList: {
    gap: 12,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  placeholderImgBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storeLabel: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
    lineHeight: 18,
  },
  unitPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtn: {
    padding: 6,
  },
  qtyText: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  removeBtn: {
    padding: 6,
  },
  couponSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  couponTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  couponHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.textPrimary,
    height: 40,
  },
  applyBtn: {
    height: 40,
  },
  appliedCouponBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.successLight,
    padding: 10,
    borderRadius: borderRadius.sm,
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appliedCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
  },
  appliedDiscount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  couponMsgText: {
    fontSize: 12,
    color: colors.primaryDark,
    marginTop: 6,
    fontWeight: '500',
  },
  billSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  billHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  billDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  checkoutFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  footerTotalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  checkoutBtn: {
    minWidth: 190,
  },
});
