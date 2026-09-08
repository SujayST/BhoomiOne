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
  Modal,
  ScrollView,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors, borderRadius } from '../../theme/colors';
import { customService } from '../../services/customService';
import { adminService } from '../../services/adminService';
import { SliderImage } from '../../types';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Smartphone,
  Monitor,
  Check,
  Sparkles,
} from 'lucide-react-native';

const BANNER_TEMPLATES = [
  {
    name: 'Kharif Harvest Festival',
    tag: 'Seeds & Crops',
    color: '#15803D',
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1080&q=80',
  },
  {
    name: 'Organic Bio-Fertilizers 20% Off',
    tag: 'Nutrition',
    color: '#0D9488',
    url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1080&q=80',
  },
  {
    name: 'Modern Farm Machinery Fair',
    tag: 'Equipment',
    color: '#D97706',
    url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=1080&q=80',
  },
  {
    name: 'Crop Protection & Pesticides Deal',
    tag: 'Protection',
    color: '#B91C1C',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22525?w=1080&q=80',
  },
];

export const AdminBannersScreen = ({ navigation }: any) => {
  const [banners, setBanners] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Upload modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('mobile');
  const [selectedTemplate, setSelectedTemplate] = useState(BANNER_TEMPLATES[0]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const [mobileBanners, desktopBanners] = await Promise.all([
        customService.getMobileBanners(),
        customService.getDesktopBanners(),
      ]);
      const combined = [...(mobileBanners || []), ...(desktopBanners || [])];
      setBanners(combined);
    } catch (e) {
      console.error('Error fetching admin banners:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBanners();
  }, []);

  const handleUploadBanner = async () => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('device', deviceType);
      formData.append('storeId', 'market');

      // 1x1 transparent PNG sample or custom payload
      const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      formData.append('image', {
        uri: customImageUrl.trim() || `data:image/png;base64,${sampleBase64}`,
        name: `banner_${deviceType}_${Date.now()}.png`,
        type: 'image/png',
      } as any);

      const res = await adminService.uploadBanner(formData);
      if (res.success || !res.error) {
        Alert.alert('Success', 'Promotional banner uploaded and auto-resized!');
        setUploadModalVisible(false);
        fetchBanners();
      } else {
        Alert.alert('Error', res.error || 'Failed to upload banner');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBanner = (banner: SliderImage) => {
    Alert.alert(
      'Delete Banner',
      'Are you sure you want to remove this promotional banner from the homepage?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await adminService.deleteSlideImage(banner._id);
            if (res.success || !res.error) {
              Alert.alert('Deleted', 'Banner removed successfully.');
              fetchBanners();
            } else {
              Alert.alert('Error', res.error || 'Failed to delete banner');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={`Promotional Banners (${banners.length})`}
        showBack
        onBack={() => navigation.goBack()}
        showCart={false}
      />

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching promotional banners...</Text>
        </View>
      ) : (
        <FlatList
          data={banners}
          keyExtractor={(item, index) => item._id || String(index)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centerLoading}>
              <ImageIcon size={50} color={colors.primaryMuted} />
              <Text style={styles.emptyTitle}>No Banners Found</Text>
              <Text style={styles.emptySubtitle}>
                Tap "Add New Banner" below to publish promotional slides on the homepage.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.bannerCard}>
              <View style={styles.imageContainer}>
                {item.url ? (
                  <Image source={{ uri: item.url }} style={styles.bannerImage} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <ImageIcon size={36} color={colors.primary} />
                  </View>
                )}
                <View style={styles.deviceTag}>
                  <Badge
                    label={item.device === 'desktop' ? 'Desktop Banner (1503x443)' : 'Mobile Banner (1080x540)'}
                    variant={item.device === 'desktop' ? 'info' : 'primary'}
                    size="sm"
                  />
                </View>
              </View>

              <View style={styles.bannerFooter}>
                <Text style={styles.bannerKeyText} numberOfLines={1}>
                  ID: {item.slideImage?.slice(-12) || item._id?.slice(-6)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteBanner(item)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Floating Add Banner Button */}
      <View style={styles.bottomBar}>
        <Button
          title="Add New Banner"
          onPress={() => setUploadModalVisible(true)}
          size="lg"
          icon={<Plus size={18} color="#FFFFFF" />}
          style={styles.addBtn}
        />
      </View>

      {/* Upload Banner Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={20} color={colors.primary} />
                <Text style={styles.modalTitle}>Publish Homepage Banner</Text>
              </View>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Target Device */}
              <Text style={styles.inputSectionLabel}>1. Target Device & Resolution</Text>
              <View style={styles.deviceRow}>
                <TouchableOpacity
                  onPress={() => setDeviceType('mobile')}
                  style={[
                    styles.deviceOption,
                    deviceType === 'mobile' && styles.deviceOptionActive,
                  ]}
                >
                  <Smartphone size={20} color={deviceType === 'mobile' ? colors.primaryDark : colors.textMuted} />
                  <Text style={[styles.deviceOptionTitle, deviceType === 'mobile' && styles.deviceOptionTitleActive]}>
                    Mobile App
                  </Text>
                  <Text style={styles.resolutionSub}>Resized to 1080 x 540 (2:1)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDeviceType('desktop')}
                  style={[
                    styles.deviceOption,
                    deviceType === 'desktop' && styles.deviceOptionActive,
                  ]}
                >
                  <Monitor size={20} color={deviceType === 'desktop' ? colors.primaryDark : colors.textMuted} />
                  <Text style={[styles.deviceOptionTitle, deviceType === 'desktop' && styles.deviceOptionTitleActive]}>
                    Desktop Web
                  </Text>
                  <Text style={styles.resolutionSub}>Resized to 1503 x 443 (~3.4:1)</Text>
                </TouchableOpacity>
              </View>

              {/* Banner Theme Templates */}
              <Text style={styles.inputSectionLabel}>2. Select Campaign Template</Text>
              <View style={styles.templatesList}>
                {BANNER_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplate.name === tmpl.name;
                  return (
                    <TouchableOpacity
                      key={tmpl.name}
                      onPress={() => {
                        setSelectedTemplate(tmpl);
                        setCustomImageUrl(tmpl.url);
                      }}
                      style={[
                        styles.templateCard,
                        isSelected && styles.templateCardActive,
                      ]}
                    >
                      <View style={[styles.templateColorBar, { backgroundColor: tmpl.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.templateName}>{tmpl.name}</Text>
                        <Text style={styles.templateTag}>Tag: {tmpl.tag}</Text>
                      </View>
                      {isSelected && <Check size={18} color={colors.primaryDark} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Live Preview Box */}
              <Text style={styles.inputSectionLabel}>3. Banner Preview</Text>
              <View style={[styles.previewContainer, { aspectRatio: deviceType === 'mobile' ? 2 / 1 : 3.4 / 1 }]}>
                <Image
                  source={{ uri: customImageUrl || selectedTemplate.url }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <View style={styles.previewOverlay}>
                  <Text style={styles.previewOverlayText}>
                    {deviceType === 'mobile' ? 'Mobile View (1080x540)' : 'Desktop View (1503x443)'}
                  </Text>
                </View>
              </View>

              {/* Submit Button */}
              <Button
                title={uploading ? 'Processing & Resizing...' : 'Upload & Publish Banner'}
                onPress={handleUploadBanner}
                loading={uploading}
                size="lg"
                icon={<Sparkles size={18} color="#FFFFFF" />}
                style={styles.modalSubmitBtn}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 90,
  },
  bannerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  deviceTag: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  bannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  bannerKeyText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    padding: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inputSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deviceOption: {
    flex: 1,
    padding: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  deviceOptionActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryDark,
  },
  deviceOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  deviceOptionTitleActive: {
    color: colors.primaryDark,
  },
  resolutionSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  templatesList: {
    gap: 8,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  templateCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryDark,
  },
  templateColorBar: {
    width: 6,
    height: 34,
    borderRadius: 3,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  templateTag: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  previewContainer: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  previewOverlayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    marginVertical: 18,
  },
});
