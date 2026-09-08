import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  MapPin,
  Heart,
  Package,
  ShieldCheck,
  Headphones,
  LogOut,
  ChevronRight,
  Crown,
  Sparkles,
} from 'lucide-react-native';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="My Account" showCart={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            {user?.userRole === 2 ? (
              <Crown size={30} color="#FEF08A" />
            ) : (
              <User size={36} color="#FFFFFF" />
            )}
          </View>

          {isAuthenticated && user ? (
            <View style={styles.userInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userName}>{user.fullname || 'Farmer Member'}</Text>
                {user.userRole === 2 && (
                  <View style={styles.roleTagSuper}>
                    <Text style={styles.roleTagSuperText}>SUPER ADMIN</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              {user.mobile && <Text style={styles.userMobile}>+91 {user.mobile}</Text>}
            </View>
          ) : (
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Welcome to BhoomiOne</Text>
              <Text style={styles.userEmail}>Sign in to access your farmer account</Text>
              <Button
                title="Sign In / Register"
                onPress={() => navigation.navigate('Login')}
                size="sm"
                style={styles.signInBtn}
              />
            </View>
          )}
        </View>

        {/* Super Admin Console (Strictly visible ONLY for userRole === 2) */}
        {isAuthenticated && user?.userRole === 2 && (
          <TouchableOpacity
            style={styles.adminCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <View style={styles.adminCardLeft}>
              <View style={styles.adminIconCircle}>
                <Crown size={22} color="#FEF08A" />
              </View>
              <View style={styles.adminCardTextBox}>
                <View style={styles.adminBadgeRow}>
                  <Text style={styles.adminBadgeText}>RESTRICTED ACCESS</Text>
                </View>
                <Text style={styles.adminCardTitle}>Admin Control Center</Text>
                <Text style={styles.adminCardSub}>Upload products, categories & monitor orders</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#FEF08A" />
          </TouchableOpacity>
        )}

        {/* Quick Menu Options */}
        {isAuthenticated && (
          <View style={styles.menuCard}>
            <Text style={styles.menuHeading}>Farmer Account</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('AddressList')}
            >
              <View style={styles.menuIconBox}>
                <MapPin size={20} color={colors.primary} />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Saved Delivery Addresses</Text>
                <Text style={styles.menuSubtitle}>Manage farm and warehouse delivery locations</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Wishlist')}
            >
              <View style={styles.menuIconBox}>
                <Heart size={20} color={colors.accent} />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Wishlist & Saved Items</Text>
                <Text style={styles.menuSubtitle}>Products saved for next season</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('OrdersTab')}
            >
              <View style={styles.menuIconBox}>
                <Package size={20} color={colors.secondary} />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>My Orders & Invoices</Text>
                <Text style={styles.menuSubtitle}>Track shipments and view GST receipts</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Help & Support */}
        <View style={styles.menuCard}>
          <Text style={styles.menuHeading}>Support & Information</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert('Agronomy Helpdesk', 'Call BhoomiOne Agri Helpline: 1800-BHOOMI-ONE (Toll-Free)')
            }
          >
            <View style={styles.menuIconBox}>
              <Headphones size={20} color={colors.primary} />
            </View>
            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>Agronomy Expert Support</Text>
              <Text style={styles.menuSubtitle}>Get advice on seeds, pesticides & soil health</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert('BhoomiOne Assurance', 'All seeds and inputs are 100% genuine and verified.')
            }
          >
            <View style={styles.menuIconBox}>
              <ShieldCheck size={20} color={colors.success} />
            </View>
            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>Farmer Quality Guarantee</Text>
              <Text style={styles.menuSubtitle}>100% genuine inputs & refund policy</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        {isAuthenticated && (
          <Button
            title="Sign Out"
            variant="outline"
            size="lg"
            onPress={handleLogout}
            icon={<LogOut size={18} color={colors.error} />}
            textStyle={{ color: colors.error }}
            style={styles.logoutBtn}
          />
        )}

        <Text style={styles.versionText}>BhoomiOne App v1.0.0 (Agri-Platform)</Text>
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
    gap: 16,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 13,
    color: colors.primaryLight,
    marginTop: 2,
  },
  userMobile: {
    fontSize: 12,
    color: colors.primaryLight,
    marginTop: 2,
  },
  signInBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextBox: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.surfaceMuted,
    marginVertical: 4,
  },
  roleTagSuper: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  roleTagSuperText: {
    color: '#854D0E',
    fontSize: 9,
    fontWeight: '800',
  },
  adminCard: {
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#FACC15',
    elevation: 4,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  adminCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adminIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(254, 240, 138, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  adminCardTextBox: {
    flex: 1,
  },
  adminBadgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: '#FACC15',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: 2,
  },
  adminBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  adminCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  adminCardSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  logoutBtn: {
    borderColor: colors.error,
    marginTop: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 12,
  },
});

