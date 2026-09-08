import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { categoryService } from '../../services/categoryService';
import { storeService } from '../../services/storeService';
import { adminService } from '../../services/adminService';
import { Section, Store } from '../../types';
import { Check, Layers, Sparkles } from 'lucide-react-native';

const DEFAULT_SECTION_SUGGESTIONS = [
  'Seeds & Planting',
  'Crop Protection & Pesticides',
  'Fertilizers & Soil Nutrition',
  'Farm Machinery & Tools',
  'Irrigation & Water Management',
];

const DEFAULT_STORE_SUGGESTIONS = [
  'BhoomiOne Official Store',
  'Kisan Krishi Kendra',
  'AgriVikas Hub',
  'BioFarm Organics',
];

export const AdminAddCategoryScreen = ({ route, navigation }: any) => {
  const { onSuccess } = route.params || {};

  const [cName, setCName] = useState('');
  const [cDescription, setCDescription] = useState('');
  const [cStatus, setCStatus] = useState('Active');

  // Input & suggestion state
  const [sectionInput, setSectionInput] = useState('Seeds & Planting');
  const [storeInput, setStoreInput] = useState('BhoomiOne Official Store');

  const [dbSections, setDbSections] = useState<Section[]>([]);
  const [dbStores, setDbStores] = useState<Store[]>([]);

  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLookups();
  }, []);

  const fetchLookups = async () => {
    try {
      setLoadingLookups(true);
      const [secs, strs] = await Promise.all([
        categoryService.getAllSections(),
        storeService.getAllStores(),
      ]);
      setDbSections(secs || []);
      setDbStores(strs || []);

      if (secs && secs.length > 0) {
        setSectionInput(secs[0].secName);
      }
      if (strs && strs.length > 0) {
        setStoreInput(strs[0].sName);
      }
    } catch (e) {
      console.error('Error loading sections and stores:', e);
    } finally {
      setLoadingLookups(false);
    }
  };

  const handleSubmit = async () => {
    if (!cName.trim() || !cDescription.trim() || !sectionInput.trim() || !storeInput.trim()) {
      setError('Please fill in all mandatory fields');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('cName', cName.trim());
      formData.append('cDescription', cDescription.trim());
      formData.append('cStatus', cStatus);

      // Check if sectionInput matches a DB section ID or pass the name
      const matchedSec = dbSections.find(
        (s) => s.secName.toLowerCase() === sectionInput.trim().toLowerCase()
      );
      formData.append('cSection', matchedSec ? matchedSec._id : sectionInput.trim());

      // Check if storeInput matches a DB store ID or pass the name
      const matchedStr = dbStores.find(
        (st) => st.sName.toLowerCase() === storeInput.trim().toLowerCase()
      );
      formData.append('cStore', matchedStr ? matchedStr._id : storeInput.trim());

      const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      formData.append('cImage', {
        uri: `data:image/png;base64,${sampleBase64}`,
        name: `${cName.toLowerCase().replace(/\s+/g, '_')}_cat.png`,
        type: 'image/png',
      } as any);

      const res = await adminService.addCategory(formData);

      if (res.success || !res.error) {
        Alert.alert('Success', 'Category created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) onSuccess();
              navigation.goBack();
            },
          },
        ]);
      } else {
        setError(res.error || 'Failed to create category');
      }
    } catch (e: any) {
      setError(e.message || 'Error creating category');
    } finally {
      setSubmitting(false);
    }
  };

  // Combine DB sections with suggestions
  const sectionOptions = Array.from(
    new Set([...dbSections.map((s) => s.secName), ...DEFAULT_SECTION_SUGGESTIONS])
  );

  // Combine DB stores with suggestions
  const storeOptions = Array.from(
    new Set([...dbStores.map((st) => st.sName), ...DEFAULT_STORE_SUGGESTIONS])
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Header
        title="Create Category"
        showBack
        onBack={() => navigation.goBack()}
        showCart={false}
      />

      {loadingLookups ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading options...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.formCard}>
            <Text style={styles.cardHeader}>Category Information</Text>

            <Input
              label="Category Name *"
              placeholder="e.g. Bio Pesticides & Fungicides"
              value={cName}
              onChangeText={(t) => {
                setCName(t);
                setError('');
              }}
            />

            <Input
              label="Description *"
              placeholder="Short description of products categorized under this category..."
              value={cDescription}
              onChangeText={(t) => {
                setCDescription(t);
                setError('');
              }}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Section Input & Selector */}
          <View style={styles.formCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.cardHeader}>Select Agri Section *</Text>
              <Sparkles size={16} color={colors.primary} />
            </View>

            <Input
              label="Section Name (Type or pick below)"
              placeholder="e.g. Seeds & Planting"
              value={sectionInput}
              onChangeText={setSectionInput}
            />

            <Text style={styles.suggestionHeader}>Quick Suggestions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {sectionOptions.map((secName) => {
                const isSelected = sectionInput.trim().toLowerCase() === secName.toLowerCase();
                return (
                  <TouchableOpacity
                    key={secName}
                    onPress={() => setSectionInput(secName)}
                    style={[styles.chipItem, isSelected && styles.chipItemSelected]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" />}
                    <Text
                      style={[styles.chipText, isSelected && styles.chipTextSelected]}
                    >
                      {secName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Store Input & Selector */}
          <View style={styles.formCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.cardHeader}>Distributor / Partner Store *</Text>
              <Sparkles size={16} color={colors.secondary} />
            </View>

            <Input
              label="Store Name (Type or pick below)"
              placeholder="e.g. BhoomiOne Official Store"
              value={storeInput}
              onChangeText={setStoreInput}
            />

            <Text style={styles.suggestionHeader}>Quick Suggestions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {storeOptions.map((storeName) => {
                const isSelected = storeInput.trim().toLowerCase() === storeName.toLowerCase();
                return (
                  <TouchableOpacity
                    key={storeName}
                    onPress={() => setStoreInput(storeName)}
                    style={[styles.chipItem, isSelected && styles.chipItemSelected]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" />}
                    <Text
                      style={[styles.chipText, isSelected && styles.chipTextSelected]}
                    >
                      {storeName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Status */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeader}>Status</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                onPress={() => setCStatus('Active')}
                style={[styles.statusOption, cStatus === 'Active' && styles.statusOptionActive]}
              >
                <Text
                  style={[
                    styles.statusText,
                    cStatus === 'Active' && styles.statusTextActive,
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCStatus('Disabled')}
                style={[styles.statusOption, cStatus === 'Disabled' && styles.statusOptionDisabled]}
              >
                <Text
                  style={[
                    styles.statusText,
                    cStatus === 'Disabled' && styles.statusTextDisabled,
                  ]}
                >
                  Disabled
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Create Category"
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            icon={<Layers size={20} color="#FFFFFF" />}
            style={styles.submitBtn}
          />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  errorBox: {
    backgroundColor: colors.errorLight,
    padding: 12,
    borderRadius: borderRadius.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  suggestionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  chipItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOptionActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryDark,
  },
  statusOptionDisabled: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  statusTextDisabled: {
    color: colors.error,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 8,
  },
});
