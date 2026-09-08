import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../../components/common/Header';
import { colors, borderRadius } from '../../theme/colors';
import { categoryService } from '../../services/categoryService';
import { Category, Section } from '../../types';
import { Sprout, ChevronRight, Layers } from 'lucide-react-native';

export const CategoriesScreen = ({ navigation }: any) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [secRes, catRes] = await Promise.all([
        categoryService.getAllSections(),
        categoryService.getAllCategories(),
      ]);
      setSections(secRes || []);
      setCategories(catRes || []);
    } catch (e) {
      console.error('Error fetching categories:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const filteredCategories = selectedSectionId
    ? categories.filter((c) => {
        if (!c.cSection) return true;
        const secId = typeof c.cSection === 'object' ? c.cSection._id : c.cSection;
        return String(secId) === String(selectedSectionId);
      })
    : categories;

  return (
    <View style={styles.container}>
      <Header
        title="Agri Catalog"
        showCart
        onCartPress={() => navigation.navigate('CartTab')}
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          {/* Left Vertical Section Selector */}
          <View style={styles.leftSidebar}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => setSelectedSectionId(null)}
                style={[
                  styles.sectionTab,
                  selectedSectionId === null && styles.activeSectionTab,
                ]}
              >
                <Layers
                  size={18}
                  color={selectedSectionId === null ? colors.primaryDark : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.sectionTabText,
                    selectedSectionId === null && styles.activeSectionTabText,
                  ]}
                >
                  All Items
                </Text>
              </TouchableOpacity>

              {sections.map((sec) => {
                const isActive = selectedSectionId === sec._id;
                return (
                  <TouchableOpacity
                    key={sec._id}
                    onPress={() => setSelectedSectionId(sec._id)}
                    style={[
                      styles.sectionTab,
                      isActive && styles.activeSectionTab,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionTabText,
                        isActive && styles.activeSectionTabText,
                      ]}
                      numberOfLines={2}
                    >
                      {sec.secName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Right Categories Grid */}
          <View style={styles.rightContent}>
            <FlatList
              data={filteredCategories.length > 0 ? filteredCategories : categories}
              keyExtractor={(item) => item._id}
              numColumns={2}
              contentContainerStyle={styles.categoryGrid}
              ListHeaderComponent={
                <Text style={styles.gridHeader}>
                  {selectedSectionId
                    ? sections.find((s) => s._id === selectedSectionId)?.secName || 'Categories'
                    : 'All Farming Categories'}
                </Text>
              }
              renderItem={({ item }) => {
                const catImg = item.url || (item.urls && item.urls.length > 0 ? item.urls[0] : null);
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('ProductList', {
                        categoryId: item._id,
                        categoryName: item.cName,
                      })
                    }
                    style={styles.categoryCard}
                  >
                    <View style={styles.catImageWrapper}>
                      {catImg ? (
                        <Image source={{ uri: catImg }} style={styles.catImage} />
                      ) : (
                        <Sprout size={32} color={colors.primary} />
                      )}
                    </View>
                    <Text style={styles.catTitle} numberOfLines={2}>
                      {item.cName}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      )}
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
  contentRow: {
    flex: 1,
    flexDirection: 'row',
  },
  leftSidebar: {
    width: 105,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  sectionTab: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
    gap: 4,
  },
  activeSectionTab: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryDark,
  },
  sectionTabText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activeSectionTabText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  rightContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  categoryGrid: {
    padding: 12,
    gap: 12,
  },
  gridHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  categoryCard: {
    flex: 1,
    margin: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    justifyContent: 'center',
  },
  catImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  catImage: {
    width: '100%',
    height: '100%',
  },
  catTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

