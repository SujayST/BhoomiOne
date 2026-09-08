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
  Alert,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { categoryService } from '../../services/categoryService';
import { adminService } from '../../services/adminService';
import { Category } from '../../types';
import { Layers, Plus, Trash2, Sprout } from 'lucide-react-native';

export const AdminCategoriesScreen = ({ navigation }: any) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const list = await categoryService.getAllCategories();
      setCategories(list);
    } catch (e) {
      console.error('Error fetching admin categories:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
  }, []);

  const handleDeleteCategory = (cat: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete category "${cat.cName}"? All linked products may be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await adminService.deleteCategory(cat._id);
            if (res.success || !res.error) {
              Alert.alert('Deleted', 'Category removed successfully.');
              fetchCategories();
            } else {
              Alert.alert('Error', res.error || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={`Agri Categories (${categories.length})`}
        showBack
        onBack={() => navigation.goBack()}
        showCart={false}
      />

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching categories...</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centerLoading}>
              <Layers size={50} color={colors.primaryMuted} />
              <Text style={styles.emptyTitle}>No Categories Yet</Text>
              <Text style={styles.emptySubtitle}>Tap the button below to upload your first category.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const secName = typeof item.cSection === 'object' && item.cSection !== null ? item.cSection.secName : undefined;
            const storeName = typeof item.cStore === 'object' && item.cStore !== null ? item.cStore.sName : undefined;

            return (
              <View style={styles.categoryCard}>
                <View style={styles.imageBox}>
                  {item.url ? (
                    <Image source={{ uri: item.url }} style={styles.image} />
                  ) : (
                    <Sprout size={28} color={colors.primary} />
                  )}
                </View>

                <View style={styles.infoBox}>
                  <View style={styles.titleRow}>
                    <Text style={styles.catName} numberOfLines={1}>
                      {item.cName}
                    </Text>
                    <Badge
                      label={item.cStatus || 'Active'}
                      variant={item.cStatus === 'Disabled' ? 'error' : 'success'}
                      size="sm"
                    />
                  </View>

                  {item.cDescription && (
                    <Text style={styles.catDesc} numberOfLines={2}>
                      {item.cDescription}
                    </Text>
                  )}

                  <View style={styles.metaRow}>
                    {secName && <Text style={styles.metaText}>Section: {secName}</Text>}
                    {storeName && <Text style={styles.metaText}>Store: {storeName}</Text>}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteCategory(item)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Floating Add Category Button */}
      <View style={styles.bottomBar}>
        <Button
          title="Upload New Category"
          onPress={() =>
            navigation.navigate('AdminAddCategory', {
              onSuccess: fetchCategories,
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
    paddingBottom: 90,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoBox: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  catDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 6,
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

