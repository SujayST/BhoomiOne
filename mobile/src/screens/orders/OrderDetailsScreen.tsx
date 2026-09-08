import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';
import {
  Package,
  Truck,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';

export const OrderDetailsScreen = ({ route, navigation }: any) => {
  const { order }: { order: Order } = route.params;
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

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

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const res = await orderService.getInvoiceLink(order._id);
      if (res.invoiceUrl) {
        Linking.openURL(res.invoiceUrl);
      } else {
        Alert.alert('Invoice Notice', 'Invoice is currently being generated. Please try again shortly.');
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to retrieve invoice at this moment.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={`Order #${order._id.slice(-6).toUpperCase()}`}
        showBack
        onBack={() => navigation.goBack()}
        showCart={false}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusHeading}>Order Status</Text>
              <Text style={styles.dateText}>
                Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Recent'}
              </Text>
            </View>
            <Badge label={order.status || 'Not processed'} variant={getStatusVariant(order.status)} />
          </View>

          {/* Logistics Progress Indicator */}
          <View style={styles.timeline}>
            <View style={styles.timelineStep}>
              <View style={[styles.stepIconCircle, styles.stepActive]}>
                <CheckCircle2 size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.stepLabel}>Placed</Text>
            </View>
            <View style={[styles.stepLine, order.status !== 'Not processed' && styles.stepLineActive]} />
            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.stepIconCircle,
                  order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered'
                    ? styles.stepActive
                    : null,
                ]}
              >
                <Clock size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.stepLabel}>Processing</Text>
            </View>
            <View style={[styles.stepLine, (order.status === 'Shipped' || order.status === 'Delivered') && styles.stepLineActive]} />
            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.stepIconCircle,
                  order.status === 'Shipped' || order.status === 'Delivered'
                    ? styles.stepActive
                    : null,
                ]}
              >
                <Truck size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.stepLabel}>Shipped</Text>
            </View>
            <View style={[styles.stepLine, order.status === 'Delivered' && styles.stepLineActive]} />
            <View style={styles.timelineStep}>
              <View style={[styles.stepIconCircle, order.status === 'Delivered' ? styles.stepActive : null]}>
                <Package size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.stepLabel}>Delivered</Text>
            </View>
          </View>

          {order.shippingDetails?.waybill && (
            <View style={styles.awbBox}>
              <Truck size={16} color={colors.primaryDark} />
              <Text style={styles.awbText}>
                Delhivery Courier AWB: <Text style={{ fontWeight: '700' }}>{order.shippingDetails.waybill}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Product Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items Ordered ({order.allProduct?.length || 0})</Text>
          {order.allProduct?.map((item, idx) => {
            const product = item.id;
            const pName = typeof product === 'object' && product !== null ? product.pName : 'Farm Supply Item';
            const pPrice = typeof product === 'object' && product !== null ? product.pPrice : item.subtotal;
            let imgUrl: string | undefined = undefined;
            if (typeof product === 'object' && product !== null) {
              if (Array.isArray(product.url) && product.url.length > 0) {
                imgUrl = product.url[0];
              } else if (typeof product.url === 'string') {
                imgUrl = product.url;
              }
            }

            return (
              <View key={idx} style={styles.productRow}>
                {imgUrl ? (
                  <Image source={{ uri: imgUrl }} style={styles.productThumbnail} />
                ) : (
                  <View style={[styles.productThumbnail, styles.thumbPlaceholder]}>
                    <Package size={24} color={colors.primary} />
                  </View>
                )}
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {pName}
                  </Text>
                  <Text style={styles.productMeta}>
                    Qty: {item.quantitiy || 1} • Size: {item.size || 'Standard'}
                  </Text>
                  <Text style={styles.productPrice}>₹{item.subtotal?.toLocaleString('en-IN') || pPrice}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MapPin size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressBody}>{order.address}</Text>
          <Text style={styles.phoneBody}>Contact: +91 {order.phone}</Text>
        </View>

        {/* Payment & Invoice */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <CreditCard size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Payment & Invoicing</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Status:</Text>
            <Text style={styles.paymentVal}>
              {order.transactionDetails?.[0]?.status || 'Completed'}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total Paid:</Text>
            <Text style={styles.totalAmountVal}>₹{order.amount?.toLocaleString('en-IN')}</Text>
          </View>

          <Button
            title="Download GST Tax Invoice"
            variant="outline"
            size="md"
            onPress={handleDownloadInvoice}
            loading={downloadingInvoice}
            icon={<FileText size={18} color={colors.primary} />}
            style={styles.invoiceBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  timelineStep: {
    alignItems: 'center',
    gap: 4,
  },
  stepIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderDark,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  awbBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: borderRadius.sm,
    gap: 8,
  },
  awbText: {
    fontSize: 12,
    color: colors.primaryDark,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  productThumbnail: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
  },
  thumbPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  productMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 2,
  },
  addressBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  phoneBody: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  paymentLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  paymentVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalAmountVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  invoiceBtn: {
    marginTop: 14,
  },
});
