import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { CheckCircle2, PackageCheck, ArrowRight } from 'lucide-react-native';

export const OrderSuccessScreen = ({ route, navigation }: any) => {
  const { orderId, totalAmount } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.contentCard}>
        <View style={styles.iconCircle}>
          <CheckCircle2 size={64} color={colors.primary} />
        </View>

        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>
          Thank you for choosing BhoomiOne. Your agricultural supplies order is being processed for dispatch.
        </Text>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Reference:</Text>
            <Text style={styles.infoVal}>{orderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Amount:</Text>
            <Text style={styles.infoVal}>₹{Number(totalAmount || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Delivery:</Text>
            <Text style={styles.infoVal}>2-4 Business Days</Text>
          </View>
        </View>

        <Button
          title="Track Orders"
          onPress={() => navigation.navigate('OrdersTab')}
          size="lg"
          icon={<PackageCheck size={20} color="#FFFFFF" />}
          style={styles.trackBtn}
        />

        <Button
          title="Back to Home"
          variant="outline"
          onPress={() => navigation.navigate('HomeTab')}
          size="md"
          style={styles.homeBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  contentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  infoBox: {
    width: '100%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    padding: 14,
    marginVertical: 20,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trackBtn: {
    width: '100%',
  },
  homeBtn: {
    width: '100%',
    marginTop: 10,
  },
});

