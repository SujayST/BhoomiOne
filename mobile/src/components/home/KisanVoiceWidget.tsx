import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { colors, borderRadius } from '../../theme/colors';
import {
  Mic,
  Sparkles,
  Bug,
  Sprout,
  CloudSun,
  Package,
  Wrench,
  ChevronRight,
} from 'lucide-react-native';

interface KisanVoiceWidgetProps {
  onOpenVoiceAssistant: (initialQuery?: string) => void;
}

const QUICK_PROMPTS = [
  {
    id: '1',
    text: 'Cure tomato leaf curl virus',
    icon: Bug,
    color: '#EF4444',
  },
  {
    id: '2',
    text: 'Best NPK fertilizer for crops',
    icon: Sprout,
    color: '#10B981',
  },
  {
    id: '3',
    text: 'Monsoon weather & rain advice',
    icon: CloudSun,
    color: '#3B82F6',
  },
  {
    id: '4',
    text: 'High-yield hybrid seeds',
    icon: Package,
    color: '#F59E0B',
  },
  {
    id: '5',
    text: 'Best battery sprayers & tools',
    icon: Wrench,
    color: '#8B5CF6',
  },
];

export const KisanVoiceWidget: React.FC<KisanVoiceWidgetProps> = ({
  onOpenVoiceAssistant,
}) => {
  // Pulse animation for the glowing voice orb
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.9,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [pulseAnim, glowAnim]);

  return (
    <View style={styles.container}>
      {/* Hero Banner Card */}
      <TouchableOpacity
        style={styles.heroCard}
        activeOpacity={0.9}
        onPress={() => onOpenVoiceAssistant()}
      >
        {/* Top Tag */}
        <View style={styles.topRow}>
          <View style={styles.badgeContainer}>
            <Sparkles size={13} color="#FEF08A" />
            <Text style={styles.badgeText}>BHOOMI KISAN AI ASSISTANT</Text>
          </View>
          <View style={styles.voiceIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Voice Enabled</Text>
          </View>
        </View>

        {/* Main Content Row */}
        <View style={styles.mainRow}>
          <View style={styles.textContainer}>
            <Text style={styles.heroTitle}>Need Farming or Crop Advice?</Text>
            <Text style={styles.heroSubtitle}>
              Tap the mic and speak in Hindi or English to diagnose crop diseases, check weather & get product remedies.
            </Text>
          </View>

          {/* Glowing Animated Mic Orb */}
          <View style={styles.orbWrapper}>
            <Animated.View
              style={[
                styles.glowingRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: glowAnim,
                },
              ]}
            />
            <View style={styles.micOrb}>
              <Mic size={28} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Action Button Bar */}
        <View style={styles.actionRow}>
          <View style={styles.speakButton}>
            <Mic size={16} color="#064E3B" />
            <Text style={styles.speakButtonText}>Tap to Speak or Ask</Text>
          </View>
          <View style={styles.arrowRow}>
            <Text style={styles.arrowText}>Ask AI</Text>
            <ChevronRight size={16} color="#A7F3D0" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Quick Prompt Chips Carousel */}
      <View style={styles.chipsSection}>
        <Text style={styles.chipsSectionTitle}>Quick Voice Questions:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {QUICK_PROMPTS.map((prompt) => {
            const IconComponent = prompt.icon;
            return (
              <TouchableOpacity
                key={prompt.id}
                style={styles.chip}
                activeOpacity={0.8}
                onPress={() => onOpenVoiceAssistant(prompt.text)}
              >
                <View style={[styles.chipIconBox, { backgroundColor: `${prompt.color}18` }]}>
                  <IconComponent size={14} color={prompt.color} />
                </View>
                <Text style={styles.chipText}>{prompt.text}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
  },
  heroCard: {
    backgroundColor: '#064E3B', // Deep forest emerald
    borderRadius: borderRadius.xl,
    padding: 16,
    elevation: 6,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 240, 138, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.4)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FEF08A',
    letterSpacing: 0.5,
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D1FAE5',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 4,
    lineHeight: 16,
  },
  orbWrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowingRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
  },
  micOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6EE7B7',
    elevation: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34D399',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  speakButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#064E3B',
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  arrowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A7F3D0',
  },
  chipsSection: {
    marginTop: 10,
  },
  chipsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsScroll: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  chipIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

