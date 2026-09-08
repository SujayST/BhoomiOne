import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, borderRadius } from '../../theme/colors';
import {
  Camera,
  Image as ImageIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';

interface MultiImagePickerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  mandatory?: boolean;
}

export const MultiImagePicker: React.FC<MultiImagePickerProps> = ({
  images,
  onImagesChange,
  maxImages = 6,
  label = 'Upload Photos',
  mandatory = true,
}) => {
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera roll permission is required to select photos.'
      );
      return false;
    }
    return true;
  };

  const handlePickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        Alert.alert('Limit Reached', `You can select a maximum of ${maxImages} images.`);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map((asset) => asset.uri);
        const combined = [...images, ...newUris].slice(0, maxImages);
        onImagesChange(combined);
      }
    } catch (e: any) {
      console.error('Error picking images:', e);
      Alert.alert('Error', 'Failed to pick images from library');
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.'
      );
      return false;
    }

    try {
      if (images.length >= maxImages) {
        Alert.alert('Limit Reached', `You can select a maximum of ${maxImages} images.`);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImagesChange([...images, result.assets[0].uri]);
      }
    } catch (e: any) {
      console.error('Error taking photo:', e);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(updated);
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          <Text style={styles.label}>
            {label} {mandatory && <Text style={styles.mandatoryStar}>*</Text>}
          </Text>
          {mandatory && (
            <View style={[styles.statusBadge, images.length > 0 ? styles.statusBadgeReady : styles.statusBadgeNeeded]}>
              {images.length > 0 ? (
                <>
                  <CheckCircle2 size={11} color="#059669" />
                  <Text style={styles.statusBadgeTextReady}>{images.length} Added</Text>
                </>
              ) : (
                <Text style={styles.statusBadgeTextNeeded}>Required (min 1)</Text>
              )}
            </View>
          )}
        </View>

        <Text style={styles.counterText}>
          {images.length} / {maxImages} Max
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handlePickFromGallery}
          activeOpacity={0.8}
        >
          <ImageIcon size={18} color={colors.primaryDark} />
          <Text style={styles.actionBtnText}>Choose from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutline]}
          onPress={handleTakePhoto}
          activeOpacity={0.8}
        >
          <Camera size={18} color={colors.textPrimary} />
          <Text style={styles.actionBtnTextOutline}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Previews List */}
      {images.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewsScroll}
        >
          {images.map((uri, index) => (
            <View key={index} style={styles.previewCard}>
              <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />

              {/* Cover / Primary Tag */}
              {index === 0 && (
                <View style={styles.coverTag}>
                  <Text style={styles.coverTagText}>Cover Photo</Text>
                </View>
              )}

              {/* Delete Button */}
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveImage(index)}
                activeOpacity={0.8}
              >
                <Trash2 size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < maxImages && (
            <TouchableOpacity
              style={styles.addMoreCard}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}
            >
              <Plus size={22} color={colors.primary} />
              <Text style={styles.addMoreText}>Add More</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <TouchableOpacity
          style={styles.emptyDropZone}
          onPress={handlePickFromGallery}
          activeOpacity={0.8}
        >
          <View style={styles.emptyIconCircle}>
            <ImageIcon size={26} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Images Selected</Text>
          <Text style={styles.emptySubtitle}>
            Tap to select multiple high-resolution photos for this item.
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mandatoryStar: {
    color: colors.error,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusBadgeReady: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeNeeded: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeTextReady: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  statusBadgeTextNeeded: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.error,
  },
  counterText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(21, 128, 61, 0.2)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  actionBtnOutline: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  actionBtnTextOutline: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  previewsScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  previewCard: {
    width: 105,
    height: 105,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  coverTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(21, 128, 61, 0.9)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  coverTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreCard: {
    width: 105,
    height: 105,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    gap: 4,
  },
  addMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  emptyDropZone: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});

