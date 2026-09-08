import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';
import { Package, ChevronRight, Truck, Calendar, ShoppingBag } from 'lucide-react-native';

export const OrdersScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const list = await orderService.getUserOrders();
      setOrders(list);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [isAuthenticated]);

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'shipped':
        return 'info';
      case 'processing':
        return 'warning';
      case 'cancelled':
      case 'returned':
        return 'error';
      default:
        return 'neutral';
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Header title="My Orders" showCart={false} />
        <View style={styles.centerContainer}>
          <Package size={64} color={colors.primaryMuted} />
          <Text style={styles.emptyTitle}>Sign in to view orders</Text>
          <Text style={styles.emptySubtitle}>
            Track your farm input shipments and download invoices.
          </Text>
          <Button
            title="Sign In"
            onPress={() => navigation.navigate('Login')}
            size="lg"
            style={styles.authBtn}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="My Orders" showCart onCartPress={() => navigation.navigate('CartTab')} />

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <ShoppingBag size={54} color={colors.primary} />
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySubtitle}>
                You haven't placed any orders yet. Start ordering seeds & fertilizers!
              </Text>
              <Button
                title="Explore Products"
                onPress={() => navigation.navigate('HomeTab')}
                size="md"
                style={styles.browseBtn}
              />
            </View>
          }
          renderItem={({ item }) => {
            const firstProduct = item.allProduct?.[0]?.id;
            const productName =
              typeof firstProduct === 'object' && firstProduct !== null
                ? firstProduct.pName
                : 'Agricultural Item';
            const productImg =
              typeof firstProduct === 'object' && firstProduct !== null && firstProduct.url
                ? firstProduct.url
                : undefined;
            const extraCount = Math.max(0, (item.allProduct?.length || 0) - 1);

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('OrderDetails', { order: item })}
                style={styles.orderCard}
              >
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderIdText}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                    </Text>
                  </View>
                  <Badge
                    label={item.status || 'Not processed'}
                    variant={getStatusVariant(item.status)}
                    size="sm"
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.orderBody}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle} numberOfLines={1}>
                      {productName}
                    </Text>
                    {extraCount > 0 && (
                      <Text style={styles.extraItemsText}>+ {extraCount} more items</Text>
                    )}
                    <Text style={styles.orderAmount}>
                      Total: ₹{item.amount?.toLocaleString('en-IN') || 0}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textMuted} />
                </View>

                {item.shippingDetails?.waybill && (
                  <View style={styles.trackingBanner}>
                    <Truck size={14} color={colors.primaryDark} />
                    <Text style={styles.trackingText}>
                      Delhivery AWB: {item.shippingDetails.waybill}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
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
  centerContainer: {
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
  authBtn: {
    marginTop: 20,
    minWidth: 160,
  },
  browseBtn: {
    marginTop: 20,
    minWidth: 180,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  orderBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  extraItemsText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 4,
  },
  trackingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    marginTop: 10,
    gap: 6,
  },
  trackingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
});

