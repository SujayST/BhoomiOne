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
import { Category, Section, Store } from '../../types';
import { Check, Sparkles, Package } from 'lucide-react-native';

const DEFAULT_CATEGORY_SUGGESTIONS = [
  'Hybrid Seeds',
  'Organic Fertilizers',
  'Crop Protection & Fungicides',
  'Agricultural Tools',
  'Irrigation Equipment',
];

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

export const AdminAddProductScreen = ({ route, navigation }: any) => {
  const { onSuccess } = route.params || {};

  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pOffer, setPOffer] = useState('0');
  const [pQuantity, setPQuantity] = useState('100');
  const [pStatus, setPStatus] = useState('Active');

  // Input & suggestion state
  const [categoryInput, setCategoryInput] = useState('Hybrid Seeds');
  const [sectionInput, setSectionInput] = useState('Seeds & Planting');
  const [storeInput, setStoreInput] = useState('BhoomiOne Official Store');

  const [dbCategories, setDbCategories] = useState<Category[]>([]);
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
      const [cats, secs, strs] = await Promise.all([
        categoryService.getAllCategories(),
        categoryService.getAllSections(),
        storeService.getAllStores(),
      ]);

      setDbCategories(cats || []);
      setDbSections(secs || []);
      setDbStores(strs || []);

      if (cats && cats.length > 0) setCategoryInput(cats[0].cName);
      if (secs && secs.length > 0) setSectionInput(secs[0].secName);
      if (strs && strs.length > 0) setStoreInput(strs[0].sName);
    } catch (e) {
      console.error('Error fetching lookups for product form:', e);
    } finally {
      setLoadingLookups(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !pName.trim() ||
      !pDescription.trim() ||
      !pPrice.trim() ||
      !pQuantity.trim() ||
      !categoryInput.trim() ||
      !sectionInput.trim() ||
      !storeInput.trim()
    ) {
      setError('Please fill in all mandatory fields');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('pName', pName.trim());
      formData.append('pDescription', pDescription.trim());
      formData.append('pPrice', pPrice.trim());
      formData.append('pOffer', pOffer.trim() || '0');
      formData.append('pStatus', pStatus);

      // Match category ID or pass name
      const matchedCat = dbCategories.find(
        (c) => c.cName.toLowerCase() === categoryInput.trim().toLowerCase()
      );
      formData.append('pCategory', matchedCat ? matchedCat._id : categoryInput.trim());

      // Match section ID or pass name
      const matchedSec = dbSections.find(
        (s) => s.secName.toLowerCase() === sectionInput.trim().toLowerCase()
      );
      formData.append('pSection', matchedSec ? matchedSec._id : sectionInput.trim());

      // Match store ID or pass name
      const matchedStr = dbStores.find(
        (st) => st.sName.toLowerCase() === storeInput.trim().toLowerCase()
      );
      formData.append('pStore', matchedStr ? matchedStr._id : storeInput.trim());

      // JSON array of size & stock
      const sizesArray = JSON.stringify([
        { size: 'Standard Pack', quantity: Number(pQuantity) || 50 },
      ]);
      formData.append('pQuantity', sizesArray);
      formData.append('similarProducts', '[]');

      // Attach 2 standard transparent sample image blobs
      const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      formData.append('images', {
        uri: `data:image/png;base64,${sampleBase64}`,
        name: 'product_1.png',
        type: 'image/png',
      } as any);

      formData.append('images', {
        uri: `data:image/png;base64,${sampleBase64}`,
        name: 'product_2.png',
        type: 'image/png',
      } as any);

      const res = await adminService.addProduct(formData);

      if (res.success || !res.error) {
        Alert.alert('Success', 'Product uploaded successfully!', [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) onSuccess();
              navigation.goBack();
            },
          },
        ]);
      } else {
        setError(res.error || 'Failed to upload product');
      }
    } catch (e: any) {
      setError(e.message || 'Error uploading product');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = Array.from(
    new Set([...dbCategories.map((c) => c.cName), ...DEFAULT_CATEGORY_SUGGESTIONS])
  );
  const sectionOptions = Array.from(
    new Set([...dbSections.map((s) => s.secName), ...DEFAULT_SECTION_SUGGESTIONS])
  );
  const storeOptions = Array.from(
    new Set([...dbStores.map((st) => st.sName), ...DEFAULT_STORE_SUGGESTIONS])
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Header
        title="Upload Product"
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

          {/* Product Basics */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeader}>Basic Information</Text>

            <Input
              label="Product Title / Name *"
              placeholder="e.g. Bio-NPK Organic Fertilizer 5kg"
              value={pName}
              onChangeText={(t) => {
                setPName(t);
                setError('');
              }}
            />

            <Input
              label="Application & Description *"
              placeholder="Provide crop suitability, dosage, and usage instructions..."
              value={pDescription}
              onChangeText={(t) => {
                setPDescription(t);
                setError('');
              }}
              multiline
              numberOfLines={4}
              style={{ minHeight: 80 }}
            />
          </View>

          {/* Pricing & Stock */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeader}>Pricing & Inventory</Text>

            <View style={styles.row}>
              <Input
                label="Price (₹) *"
                placeholder="499"
                value={pPrice}
                onChangeText={setPPrice}
                keyboardType="numeric"
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <Input
                label="Discount (%)"
                placeholder="10"
                value={pOffer}
                onChangeText={setPOffer}
                keyboardType="numeric"
                containerStyle={{ flex: 1, marginLeft: 8 }}
              />
            </View>

            <Input
              label="Available Stock Units *"
              placeholder="100"
              value={pQuantity}
              onChangeText={setPQuantity}
              keyboardType="numeric"
            />
          </View>

          {/* Category Input & Selector */}
          <View style={styles.formCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.cardHeader}>Agri Category *</Text>
              <Sparkles size={16} color={colors.primary} />
            </View>

            <Input
              label="Category Name (Type or pick below)"
              placeholder="e.g. Hybrid Seeds"
              value={categoryInput}
              onChangeText={setCategoryInput}
            />

            <Text style={styles.suggestionHeader}>Quick Suggestions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {categoryOptions.map((catName) => {
                const isSelected = categoryInput.trim().toLowerCase() === catName.toLowerCase();
                return (
                  <TouchableOpacity
                    key={catName}
                    onPress={() => setCategoryInput(catName)}
                    style={[styles.chipItem, isSelected && styles.chipItemSelected]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" />}
                    <Text
                      style={[styles.chipText, isSelected && styles.chipTextSelected]}
                    >
                      {catName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Section Input & Selector */}
          <View style={styles.formCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.cardHeader}>Agri Section *</Text>
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
              <Text style={styles.cardHeader}>Partner Store / Distributor *</Text>
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
              {storeOptions.map((strName) => {
                const isSelected = storeInput.trim().toLowerCase() === strName.toLowerCase();
                return (
                  <TouchableOpacity
                    key={strName}
                    onPress={() => setStoreInput(strName)}
                    style={[styles.chipItem, isSelected && styles.chipItemSelected]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" />}
                    <Text
                      style={[styles.chipText, isSelected && styles.chipTextSelected]}
                    >
                      {strName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Status Selection */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeader}>Publication Status</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                onPress={() => setPStatus('Active')}
                style={[styles.statusOption, pStatus === 'Active' && styles.statusOptionActive]}
              >
                <Text
                  style={[
                    styles.statusText,
                    pStatus === 'Active' && styles.statusTextActive,
                  ]}
                >
                  Active (Published)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPStatus('Disabled')}
                style={[styles.statusOption, pStatus === 'Disabled' && styles.statusOptionDisabled]}
              >
                <Text
                  style={[
                    styles.statusText,
                    pStatus === 'Disabled' && styles.statusTextDisabled,
                  ]}
                >
                  Disabled (Draft)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Publish Agri Product"
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            icon={<Package size={20} color="#FFFFFF" />}
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
  row: {
    flexDirection: 'row',
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
