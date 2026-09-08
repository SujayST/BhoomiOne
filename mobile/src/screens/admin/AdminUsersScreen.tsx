import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { colors, borderRadius } from '../../theme/colors';
import { adminService } from '../../services/adminService';
import { User } from '../../types';
import {
  Users,
  Search,
  X,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  User as UserIcon,
  Crown,
} from 'lucide-react-native';

export const AdminUsersScreen = ({ navigation }: any) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const list = await adminService.getAllUsers();
      setUsers(list);
      setFilteredUsers(list);
    } catch (e) {
      console.error('Error fetching admin users:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.fullname?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.mobile?.includes(q)
        )
      );
    }
  }, [searchQuery, users]);

  const getRoleBadge = (role: number) => {
    switch (role) {
      case 2:
        return { label: 'Super Admin', variant: 'warning' as const };
      case 1:
        return { label: 'Store Vendor', variant: 'info' as const };
      default:
        return { label: 'Farmer / Buyer', variant: 'success' as const };
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={`Registered Users (${users.length})`}
        showBack
        onBack={() => navigation.goBack()}
        showCart={false}
      />

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputBox}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email or mobile..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textMuted}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching registered accounts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centerLoading}>
              <Users size={50} color={colors.primaryMuted} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptySubtitle}>No users matched your search criteria.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const roleInfo = getRoleBadge(item.userRole);

            return (
              <View style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.avatarCircle}>
                    {item.userRole === 2 ? (
                      <Crown size={20} color="#FEF08A" />
                    ) : (
                      <UserIcon size={20} color={colors.primary} />
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.fullname || 'Farmer Member'}</Text>
                    <Text style={styles.userRoleText}>ID: {item._id.slice(-6).toUpperCase()}</Text>
                  </View>

                  <Badge label={roleInfo.label} variant={roleInfo.variant} size="sm" />
                </View>

                <View style={styles.divider} />

                <View style={styles.contactSection}>
                  <View style={styles.contactRow}>
                    <Mail size={14} color={colors.textMuted} />
                    <Text style={styles.contactVal}>{item.email}</Text>
                  </View>
                  {item.mobile && (
                    <View style={styles.contactRow}>
                      <Phone size={14} color={colors.textMuted} />
                      <Text style={styles.contactVal}>+91 {item.mobile}</Text>
                    </View>
                  )}
                  {item.createdAt && (
                    <View style={styles.contactRow}>
                      <Calendar size={14} color={colors.textMuted} />
                      <Text style={styles.contactVal}>
                        Joined {new Date(item.createdAt).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
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
  searchBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
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
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userRoleText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceMuted,
    marginVertical: 10,
  },
  contactSection: {
    gap: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactVal: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

