import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Category } from '../../types';
import { colors, borderRadius } from '../../theme/colors';
import { Sprout, Wheat, Bug, Wrench, Leaf, Trees } from 'lucide-react-native';

interface CategoryChipsProps {
  categories: Category[];
  selectedCategoryId?: string | null;
  onSelectCategory: (category: Category | null) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const getFallbackIcon = (name: string = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('seed')) return <Sprout size={22} color={colors.primary} />;
    if (lower.includes('fert') || lower.includes('nutri')) return <Wheat size={22} color={colors.accent} />;
    if (lower.includes('pest') || lower.includes('insect')) return <Bug size={22} color={colors.error} />;
    if (lower.includes('machin') || lower.includes('tool') || lower.includes('equip')) return <Wrench size={22} color={colors.secondary} />;
    if (lower.includes('organic')) return <Leaf size={22} color={colors.primaryDark} />;
    return <Trees size={22} color={colors.primary} />;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectCategory(null)}
        style={[
          styles.chip,
          selectedCategoryId === null || selectedCategoryId === undefined
            ? styles.selectedChip
            : null,
        ]}
      >
        <View
          style={[
            styles.iconBox,
            selectedCategoryId === null || selectedCategoryId === undefined
              ? styles.selectedIconBox
              : null,
          ]}
        >
          <Leaf
            size={22}
            color={
              selectedCategoryId === null || selectedCategoryId === undefined
                ? '#FFFFFF'
                : colors.primary
            }
          />
        </View>
        <Text
          style={[
            styles.label,
            selectedCategoryId === null || selectedCategoryId === undefined
              ? styles.selectedLabel
              : null,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat._id;
        const catImg = cat.url || (cat.urls && cat.urls.length > 0 ? cat.urls[0] : null);
        return (
          <TouchableOpacity
            key={cat._id}
            activeOpacity={0.8}
            onPress={() => onSelectCategory(cat)}
            style={[styles.chip, isSelected ? styles.selectedChip : null]}
          >
            <View
              style={[
                styles.iconBox,
                isSelected ? styles.selectedIconBox : null,
              ]}
            >
              {catImg ? (
                <Image
                  source={{ uri: catImg }}
                  style={styles.catImage}
                  resizeMode="cover"
                />
              ) : (
                getFallbackIcon(cat.cName)
              )}
            </View>
            <Text
              style={[styles.label, isSelected ? styles.selectedLabel : null]}
              numberOfLines={1}
            >
              {cat.cName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  chip: {
    alignItems: 'center',
    width: 72,
  },
  selectedChip: {},
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  selectedIconBox: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catImage: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  selectedLabel: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});

