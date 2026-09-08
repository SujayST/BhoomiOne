import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { adminService, DashboardStats } from '../../services/adminService';
import {
  ShieldAlert,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Image as ImageIcon,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Plus,
  RefreshCw,
  Crown,
} from 'lucide-react-native';

export const AdminDashboardScreen = ({ navigation }: any) => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isSuperAdmin = isAuthenticated && user?.userRole === 2;

  const fetchDashboardData = async () => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await adminService.getDashboardData();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isSuperAdmin]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [isSuperAdmin]);

  // Unauthorized Barrier if user is not Super Admin (userRole !== 2)
  if (!isSuperAdmin) {
    return (
      <View style={styles.container}>
        <Header title="Access Restricted" showBack onBack={() => navigation.goBack()} showCart={false} />
        <View style={styles.unauthorizedBox}>
          <View style={styles.lockCircle}>
            <ShieldAlert size={60} color={colors.error} />
          </View>
          <Text style={styles.unauthTitle}>Super Admin Access Required</Text>
          <Text style={styles.unauthSubtitle}>
            This dashboard is exclusively available to platform super administrators (userRole: 2). Your account does not have sufficient permissions.
          </Text>
          <Button
            title="Return to Profile"
            onPress={() => navigation.goBack()}
            size="lg"
            style={{ marginTop: 24, minWidth: 200 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Admin Control Center"
        showBack
        onBack={() => navigation.goBack()}
        showCart={false}
        rightElement={
          <TouchableOpacity onPress={fetchDashboardData} style={styles.refreshBtn}>
            <RefreshCw size={18} color={colors.primaryDark} />
          </TouchableOpacity>
        }
      />

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading admin metrics...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {/* Admin Header Banner */}
          <View style={styles.adminBanner}>
            <View style={styles.bannerLeft}>
              <View style={styles.crownRow}>
                <Crown size={20} color="#FEF08A" />
                <Text style={styles.adminRoleText}>Super Administrator</Text>
              </View>
              <Text style={styles.adminNameText}>{user?.fullname || 'Admin'}</Text>
              <Text style={styles.adminEmailText}>{user?.email}</Text>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live Backend</Text>
            </View>
          </View>

          {/* Quick Metrics Grid */}
          <Text style={styles.sectionHeader}>Platform Overview</Text>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { borderLeftColor: colors.primary }]}>
              <View style={styles.metricTop}>
                <Package size={22} color={colors.primary} />
                <Text style={styles.metricVal}>{stats?.Products ?? 0}</Text>
              </View>
              <Text style={styles.metricLabel}>Total Products</Text>
            </View>

            <View style={[styles.metricCard, { borderLeftColor: colors.secondary }]}>
              <View style={styles.metricTop}>
                <Layers size={22} color={colors.secondary} />
                <Text style={styles.metricVal}>{stats?.Categories ?? 0}</Text>
              </View>
              <Text style={styles.metricLabel}>Categories</Text>
            </View>

            <View style={[styles.metricCard, { borderLeftColor: colors.accent }]}>
              <View style={styles.metricTop}>
                <ShoppingBag size={22} color={colors.accent} />
                <Text style={styles.metricVal}>{stats?.Orders ?? 0}</Text>
              </View>
              <Text style={styles.metricLabel}>Total Orders</Text>
              {stats?.RecentOrders !== undefined && (
                <Text style={styles.metricSub}>+{stats.RecentOrders} in last 24h</Text>
              )}
            </View>

            <View style={[styles.metricCard, { borderLeftColor: colors.info }]}>
              <View style={styles.metricTop}>
                <Users size={22} color={colors.info} />
                <Text style={styles.metricVal}>{stats?.Users ?? 0}</Text>
              </View>
              <Text style={styles.metricLabel}>Total Users</Text>
              {stats?.RecentUsers !== undefined && (
                <Text style={styles.metricSub}>+{stats.RecentUsers} new today</Text>
              )}
            </View>
          </View>

          {/* Management Modules */}
          <Text style={styles.sectionHeader}>Management Modules</Text>

          {/* 1. Products Management */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminProducts')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.primaryLight }]}>
              <Package size={24} color={colors.primaryDark} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Products & Farm Supplies</Text>
              <Text style={styles.actionSubtitle}>Upload new items, edit pricing, manage stock & delete</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* 2. Categories Management */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminCategories')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.secondaryLight }]}>
              <Layers size={24} color={colors.secondary} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Agri Categories & Sections</Text>
              <Text style={styles.actionSubtitle}>Upload categories (Seeds, Fertilizers, Tools) with images</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* 3. Orders Management */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminOrders')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.accentLight }]}>
              <ShoppingBag size={24} color={colors.accent} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Orders & Dispatch</Text>
              <Text style={styles.actionSubtitle}>Monitor orders, update status, Delhivery waybills & cancel</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* 4. Users Monitoring */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminUsers')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.infoLight }]}>
              <Users size={24} color={colors.info} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Registered Users & Farmers</Text>
              <Text style={styles.actionSubtitle}>Inspect registered accounts, contact info & role assignments</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* 5. Promotional Banners */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminBanners')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FF' }]}>
              <ImageIcon size={24} color="#9333EA" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Promotional Banners</Text>
              <Text style={styles.actionSubtitle}>Manage homepage mobile sliders and promotional graphics</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </ScrollView>
      )}
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
    paddingBottom: 40,
    gap: 12,
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
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unauthorizedBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  unauthTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  unauthSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  adminBanner: {
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.lg,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    elevation: 4,
  },
  bannerLeft: {
    flex: 1,
  },
  crownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  adminRoleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FEF08A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  adminEmailText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.successLight,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 6,
  },
  metricSub: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '700',
    marginTop: 2,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
});

