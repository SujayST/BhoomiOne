import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { userService } from '../../services/userService';
import { SavedAddress } from '../../types';
import { MapPin, Plus, Trash2 } from 'lucide-react-native';

export const AddressListScreen = ({ navigation }: any) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDeleteAddress = (id?: string) => {
    if (!id) return;
    Alert.alert('Delete Address', 'Are you sure you want to remove this delivery address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await userService.removeSavedAddress(id);
          fetchAddresses();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Saved Addresses"
        showBack
        onBack={() => navigation.goBack()}
        showCart={false}
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading saved addresses...</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item, index) => item._id || String(index)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MapPin size={48} color={colors.primaryMuted} />
              <Text style={styles.emptyTitle}>No Addresses Saved</Text>
              <Text style={styles.emptySubtitle}>
                Add your farm, home or warehouse address for fast dispatch.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.nameRow}>
                  <MapPin size={18} color={colors.primary} />
                  <Text style={styles.nameText}>{item.receiverName}</Text>
                </View>
                {item._id && (
                  <TouchableOpacity onPress={() => handleDeleteAddress(item._id)}>
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.addressBody}>
                {item.receiverAddress}, {item.receiverCity}, {item.receiverDistrict},{' '}
                {item.receiverState} - {item.receiverPincode}
              </Text>
              <Text style={styles.contactBody}>Phone: +91 {item.receiverContactNumber}</Text>
            </View>
          )}
        />
      )}

      <View style={styles.bottomBar}>
        <Button
          title="Add New Delivery Address"
          onPress={() =>
            navigation.navigate('AddEditAddress', {
              onSuccess: fetchAddresses,
            })
          }
          size="lg"
          icon={<Plus size={18} color="#FFFFFF" />}
          style={styles.addBtn}
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
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 90,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
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
  addressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addressBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  contactBody: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
  addBtn: {
    width: '100%',
  },
});

