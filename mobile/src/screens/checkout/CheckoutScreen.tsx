import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { userService } from '../../services/userService';
import { orderService } from '../../services/orderService';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { SavedAddress } from '../../types';
import {
  MapPin,
  Plus,
  CreditCard,
  Banknote,
  CheckCircle,
  Truck,
  ShieldCheck,
} from 'lucide-react-native';

export const CheckoutScreen = ({ route, navigation }: any) => {
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { finalTotal, deliveryFee, rawSubtotal } = route.params || {
    finalTotal: cartTotal,
    deliveryFee: 0,
    rawSubtotal: cartTotal,
  };

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const list = await userService.getSavedAddresses();
      setAddresses(list);
    } catch (e) {
      console.error('Error fetching addresses:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (addresses.length === 0) {
      Alert.alert('Delivery Address Required', 'Please add a delivery address to proceed.', [
        { text: 'Add Address', onPress: () => navigation.navigate('AddEditAddress') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    const selectedAddr = addresses[selectedAddressIndex];
    const fullAddress = `${selectedAddr.receiverName}, ${selectedAddr.receiverAddress}, ${selectedAddr.receiverCity}, ${selectedAddr.receiverDistrict}, ${selectedAddr.receiverState} - ${selectedAddr.receiverPincode}`;

    const orderProducts = cartItems.map((item) => {
      const pId = typeof item.productId === 'object' && item.productId !== null ? item.productId._id : (item.productId as string);
      return {
        id: pId,
        quantitiy: item.productQuantity || 1,
        subtotal: (item.productPrice || 0) * (item.productQuantity || 1),
        size: item.productSize || 'Standard',
      };
    });

    const storeId = cartItems[0]?.productStoreId || '60c72b2f9f1b2c001f8e4d56'; // Fallback store

    setSubmitting(true);
    try {
      const res = await orderService.createOrder({
        allProduct: orderProducts,
        amount: finalTotal,
        transactionDetails: [
          {
            paymentType: paymentMethod,
            status: paymentMethod === 'COD' ? 'Pending' : 'Success',
            date: new Date().toISOString(),
          },
        ],
        address: fullAddress,
        phone: Number(selectedAddr.receiverContactNumber) || 9876543210,
        store: storeId,
      });

      if (res.success || !res.error) {
        await clearCart();
        navigation.replace('OrderSuccess', {
          orderId: res.order?._id || 'ORD-' + Math.floor(100000 + Math.random() * 900000),
          totalAmount: finalTotal,
        });
      } else {
        Alert.alert('Order Error', res.error || 'Could not complete order. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Checkout" showBack onBack={() => navigation.goBack()} showCart={false} />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading checkout details...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Delivery Address Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <MapPin size={20} color={colors.primary} />
                <Text style={styles.cardTitle}>Delivery Address</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AddEditAddress', {
                    onSuccess: fetchAddresses,
                  })
                }
              >
                <Text style={styles.addAddressText}>+ Add New</Text>
              </TouchableOpacity>
            </View>

            {addresses.length === 0 ? (
              <View style={styles.emptyAddress}>
                <Text style={styles.emptyAddressText}>No saved delivery address found.</Text>
                <Button
                  title="Add Delivery Address"
                  variant="outline"
                  size="sm"
                  onPress={() =>
                    navigation.navigate('AddEditAddress', {
                      onSuccess: fetchAddresses,
                    })
                  }
                  style={{ marginTop: 8 }}
                />
              </View>
            ) : (
              addresses.map((addr, index) => {
                const isSelected = selectedAddressIndex === index;
                return (
                  <TouchableOpacity
                    key={addr._id || index}
                    activeOpacity={0.8}
                    onPress={() => setSelectedAddressIndex(index)}
                    style={[styles.addressItem, isSelected && styles.selectedAddressItem]}
                  >
                    <View style={styles.radioCircle}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.addressInfo}>
                      <Text style={styles.receiverName}>{addr.receiverName}</Text>
                      <Text style={styles.addressText}>
                        {addr.receiverAddress}, {addr.receiverCity}, {addr.receiverDistrict},{' '}
                        {addr.receiverState} - {addr.receiverPincode}
                      </Text>
                      <Text style={styles.phoneText}>Phone: {addr.receiverContactNumber}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Payment Method Selector */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <CreditCard size={20} color={colors.primary} />
                <Text style={styles.cardTitle}>Payment Method</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('COD')}
              style={[
                styles.paymentOption,
                paymentMethod === 'COD' && styles.selectedPaymentOption,
              ]}
            >
              <Banknote size={24} color={paymentMethod === 'COD' ? colors.primary : colors.textSecondary} />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>Cash on Delivery (Pay upon Receipt)</Text>
                <Text style={styles.paymentDesc}>Pay securely with cash/UPI when goods arrive at farm</Text>
              </View>
              <View style={styles.radioCircle}>
                {paymentMethod === 'COD' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('ONLINE')}
              style={[
                styles.paymentOption,
                paymentMethod === 'ONLINE' && styles.selectedPaymentOption,
              ]}
            >
              <CreditCard size={24} color={paymentMethod === 'ONLINE' ? colors.primary : colors.textSecondary} />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>Online Payment (UPI, Cards, NetBanking)</Text>
                <Text style={styles.paymentDesc}>Instant confirmation via Razorpay secure gateway</Text>
              </View>
              <View style={styles.radioCircle}>
                {paymentMethod === 'ONLINE' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Order Summary Breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Breakdown</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items ({cartItems.length})</Text>
              <Text style={styles.summaryValue}>₹{rawSubtotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{finalTotal.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Place Order CTA Bar */}
      <View style={styles.footerBar}>
        <View>
          <Text style={styles.footerTotalLabel}>Grand Total</Text>
          <Text style={styles.footerTotalVal}>₹{finalTotal.toLocaleString('en-IN')}</Text>
        </View>
        <Button
          title="Confirm & Place Order"
          onPress={handlePlaceOrder}
          loading={submitting}
          size="lg"
          style={styles.placeOrderBtn}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addAddressText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyAddress: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyAddressText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderRadius: borderRadius.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedAddressItem: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  addressInfo: {
    flex: 1,
  },
  receiverName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  phoneText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderRadius: borderRadius.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  selectedPaymentOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
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
  footerBar: {
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
  placeOrderBtn: {
    minWidth: 200,
  },
});

