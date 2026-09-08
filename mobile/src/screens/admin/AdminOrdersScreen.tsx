import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { adminService } from '../../services/adminService';
import { Order } from '../../types';
import {
  ShoppingBag,
  Truck,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Check,
  X,
} from 'lucide-react-native';

const STATUS_FILTERS = ['All', 'Not processed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const ALL_STATUSES = ['Not processed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

export const AdminOrdersScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Status update modal state
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const list = await adminService.getAllOrders();
      setOrders(list);
    } catch (e) {
      console.error('Error fetching admin orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedStatus === 'All') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(
        orders.filter(
          (o) => o.status?.toLowerCase() === selectedStatus.toLowerCase()
        )
      );
    }
  }, [selectedStatus, orders]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const res = await adminService.updateOrderStatus(selectedOrder._id, newStatus);
      if (res.success || !res.error) {
        setStatusModalVisible(false);
        fetchOrders();
      } else {
        Alert.alert('Error', res.error || 'Failed to update order status');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateShipment = async (order: Order) => {
    Alert.alert(
      'Create Shipment',
      `Dispatch Delhivery courier shipment for order #${order._id.slice(-6).toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Dispatch',
          onPress: async () => {
            const res = await adminService.createShipment(order._id);
            if (res.success || !res.error) {
              Alert.alert('Success', 'Shipment created and waybill assigned!');
              fetchOrders();
            } else {
              Alert.alert('Error', res.error || 'Failed to create shipment');
            }
          },
        },
      ]
    );
  };

  const handleDeleteOrder = (order: Order) => {
    Alert.alert(
      'Delete Order',
      `Permanently remove order #${order._id.slice(-6).toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await adminService.deleteOrder(order._id);
            if (res.success || !res.error) {
              Alert.alert('Deleted', 'Order deleted successfully.');
              fetchOrders();
            } else {
              Alert.alert('Error', res.error || 'Failed to delete order');
            }
          },
        },
      ]
    );
  };

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

  return (
    <View style={styles.container}>
      <Header
        title={`All Orders (${orders.length})`}
        showBack
        onBack={() => navigation.goBack()}
        showCart={false}
      />

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isSelected = selectedStatus === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedStatus(item)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching platform orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centerLoading}>
              <ShoppingBag size={50} color={colors.primaryMuted} />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySubtitle}>No orders match the selected filter.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const customerName = item.user?.fullname || item.user?.name || 'Customer';
            const customerEmail = item.user?.email || 'N/A';

            return (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>
                      Order #{item._id.slice(-6).toUpperCase()}
                    </Text>
                    <Text style={styles.orderDate}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : 'Recent'}
                    </Text>
                  </View>
                  <Badge
                    label={item.status || 'Not processed'}
                    variant={getStatusVariant(item.status)}
                    size="sm"
                  />
                </View>

                {/* Customer Details */}
                <View style={styles.customerBox}>
                  <Text style={styles.customerName}>{customerName} ({customerEmail})</Text>
                  <View style={styles.contactRow}>
                    <Phone size={12} color={colors.textMuted} />
                    <Text style={styles.contactText}>+91 {item.phone}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <MapPin size={12} color={colors.textMuted} />
                    <Text style={styles.contactText} numberOfLines={2}>{item.address}</Text>
                  </View>
                </View>

                {/* Items & Total */}
                <View style={styles.itemsSummary}>
                  <Text style={styles.itemsCountText}>
                    {item.allProduct?.length || 1} Item(s)
                  </Text>
                  <Text style={styles.totalPriceText}>₹{item.amount?.toLocaleString('en-IN')}</Text>
                </View>

                {/* Shipping Waybill if available */}
                {item.shippingDetails?.waybill && (
                  <View style={styles.waybillBox}>
                    <Truck size={14} color={colors.primaryDark} />
                    <Text style={styles.waybillText}>
                      Delhivery AWB: {item.shippingDetails.waybill}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedOrder(item);
                      setStatusModalVisible(true);
                    }}
                    style={styles.updateStatusBtn}
                  >
                    <Edit size={14} color={colors.primaryDark} />
                    <Text style={styles.updateStatusBtnText}>Update Status</Text>
                  </TouchableOpacity>

                  {(!item.shippingDetails?.waybill || item.status === 'Not processed') && (
                    <TouchableOpacity
                      onPress={() => handleCreateShipment(item)}
                      style={styles.shipmentBtn}
                    >
                      <Truck size={14} color="#FFFFFF" />
                      <Text style={styles.shipmentBtnText}>Create Dispatch</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => handleDeleteOrder(item)}
                    style={styles.deleteOrderBtn}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Status Update Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Order #{selectedOrder?._id.slice(-6).toUpperCase()}
            </Text>

            <View style={styles.statusOptionsList}>
              {ALL_STATUSES.map((st) => {
                const isSelected = selectedOrder?.status === st;
                return (
                  <TouchableOpacity
                    key={st}
                    onPress={() => handleUpdateStatus(st)}
                    disabled={updating}
                    style={[
                      styles.statusSelectRow,
                      isSelected && styles.statusSelectRowActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusSelectText,
                        isSelected && styles.statusSelectTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                    {isSelected && <Check size={18} color={colors.primaryDark} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {updating && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 12 }} />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterBar: {
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
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
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  orderDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  customerBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.sm,
    padding: 10,
    marginVertical: 10,
    gap: 4,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  itemsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemsCountText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  waybillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 8,
    borderRadius: borderRadius.xs,
    gap: 6,
    marginBottom: 10,
  },
  waybillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
    paddingTop: 10,
  },
  updateStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  updateStatusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  shipmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  shipmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteOrderBtn: {
    marginLeft: 'auto',
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 20,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  statusOptionsList: {
    gap: 8,
  },
  statusSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusSelectRowActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryDark,
  },
  statusSelectText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusSelectTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});

