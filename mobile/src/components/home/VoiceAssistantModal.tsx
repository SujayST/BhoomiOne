import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Animated,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { colors, borderRadius } from '../../theme/colors';
import { aiService, AIQueryResponse } from '../../services/aiService';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  CloudSun,
  ShoppingCart,
  Check,
  RotateCcw,
  Tag,
  Package,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  initialQuery?: string;
  navigation: any;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  visible,
  onClose,
  initialQuery,
  navigation,
}) => {
  const { addToCart } = useCart();

  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechMuted, setSpeechMuted] = useState(false);
  const [response, setResponse] = useState<AIQueryResponse | null>(null);
  const [addedProductIds, setAddedProductIds] = useState<string[]>([]);

  // Waveform animated bars
  const wave1 = useRef(new Animated.Value(6)).current;
  const wave2 = useRef(new Animated.Value(14)).current;
  const wave3 = useRef(new Animated.Value(22)).current;
  const wave4 = useRef(new Animated.Value(14)).current;
  const wave5 = useRef(new Animated.Value(8)).current;

  // Pulse ring animation
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Animate sound waves when listening or speaking
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isListening || isSpeaking) {
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(wave1, { toValue: 28, duration: 250, useNativeDriver: false }),
            Animated.timing(wave1, { toValue: 6, duration: 250, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave2, { toValue: 34, duration: 300, useNativeDriver: false }),
            Animated.timing(wave2, { toValue: 10, duration: 300, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave3, { toValue: 40, duration: 200, useNativeDriver: false }),
            Animated.timing(wave3, { toValue: 14, duration: 200, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave4, { toValue: 32, duration: 350, useNativeDriver: false }),
            Animated.timing(wave4, { toValue: 8, duration: 350, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave5, { toValue: 24, duration: 280, useNativeDriver: false }),
            Animated.timing(wave5, { toValue: 6, duration: 280, useNativeDriver: false }),
          ]),
        ])
      );
      animLoop.start();
    } else {
      Animated.parallel([
        Animated.timing(wave1, { toValue: 6, duration: 200, useNativeDriver: false }),
        Animated.timing(wave2, { toValue: 12, duration: 200, useNativeDriver: false }),
        Animated.timing(wave3, { toValue: 18, duration: 200, useNativeDriver: false }),
        Animated.timing(wave4, { toValue: 12, duration: 200, useNativeDriver: false }),
        Animated.timing(wave5, { toValue: 6, duration: 200, useNativeDriver: false }),
      ]).start();
    }
    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isListening, isSpeaking, wave1, wave2, wave3, wave4, wave5]);

  // Trigger initial query if provided when opened
  useEffect(() => {
    if (visible && initialQuery) {
      setQueryInput(initialQuery);
      handleAskQuery(initialQuery);
    } else if (visible && !response) {
      // Prompt user to speak or select
      setQueryInput('');
    }
  }, [visible, initialQuery]);

  // Clean up speech when modal closes
  useEffect(() => {
    if (!visible) {
      aiService.stopSpeaking();
      setIsSpeaking(false);
      setIsListening(false);
    }
  }, [visible]);

  const handleAskQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLoading(true);
    setIsListening(false);
    aiService.stopSpeaking();
    setIsSpeaking(false);

    try {
      const res = await aiService.askQuestion(queryText.trim());
      setResponse(res);
      setQueryInput('');

      // Auto-speak response if not muted
      if (!speechMuted && res.answer) {
        setIsSpeaking(true);
        aiService.speak(res.answer, () => {
          setIsSpeaking(false);
        });
      }
    } catch (e: any) {
      Alert.alert('Error', 'Unable to retrieve answer. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceMicPress = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    aiService.stopSpeaking();
    setIsSpeaking(false);

    // Simulated Speech-to-Text dictation timer
    setTimeout(() => {
      setIsListening(false);
      // If user hadn't typed anything, pick a helpful prompt
      const sampleQueries = [
        'How to cure tomato leaf curl virus?',
        'What is the best NPK fertilizer for crop flowering?',
        'Monsoon weather advisory and rainfall advice',
        'Recommend best hybrid seeds for high yield',
      ];
      const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
      setQueryInput(randomQuery);
      handleAskQuery(randomQuery);
    }, 2200);
  };

  const toggleSpeechAudio = () => {
    if (isSpeaking) {
      aiService.stopSpeaking();
      setIsSpeaking(false);
    } else if (response?.answer) {
      setIsSpeaking(true);
      aiService.speak(response.answer, () => {
        setIsSpeaking(false);
      });
    }
  };

  const handleAddToCart = async (product: Product) => {
    await addToCart(product, 1);
    setAddedProductIds((prev) => [...prev, product._id]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.aiBadge}>
                <Sparkles size={14} color="#FEF08A" />
                <Text style={styles.aiBadgeText}>BHOOMI KISAN AI</Text>
              </View>
              <Text style={styles.assistantTitle}>Voice Farm Advisory</Text>
            </View>

            <View style={styles.headerRight}>
              {/* Voice Mute / Play Audio Toggle */}
              {response && (
                <TouchableOpacity
                  onPress={toggleSpeechAudio}
                  style={[styles.audioToggle, isSpeaking && styles.audioToggleActive]}
                >
                  {isSpeaking ? (
                    <Volume2 size={18} color="#FFFFFF" />
                  ) : (
                    <VolumeX size={18} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              )}

              {/* Close Button */}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Voice Waveform & Status Banner */}
          <View style={styles.waveformContainer}>
            <View style={styles.waveformBars}>
              <Animated.View style={[styles.waveBar, { height: wave1 }]} />
              <Animated.View style={[styles.waveBar, { height: wave2 }]} />
              <Animated.View style={[styles.waveBar, { height: wave3, backgroundColor: '#34D399' }]} />
              <Animated.View style={[styles.waveBar, { height: wave4 }]} />
              <Animated.View style={[styles.waveBar, { height: wave5 }]} />
            </View>
            <Text style={styles.statusText}>
              {isListening
                ? '🎙️ Listening... Speak your farming question...'
                : isSpeaking
                ? '🔊 Speaking advisory answer...'
                : loading
                ? '🧠 Analyzing agronomy database...'
                : 'Tap Mic to speak or type your question below'}
            </Text>
          </View>

          {/* Scrollable Conversation Content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {loading ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Fetching agronomy recommendations & products...</Text>
              </View>
            ) : response ? (
              <View style={styles.responseContainer}>
                {/* Query Asked */}
                <View style={styles.queryBubble}>
                  <Text style={styles.queryText}>"{response.query}"</Text>
                </View>

                {/* Topic Badge */}
                {response.topic && (
                  <View style={styles.topicBadge}>
                    <Tag size={12} color={colors.primaryDark} />
                    <Text style={styles.topicBadgeText}>{response.topic}</Text>
                  </View>
                )}

                {/* Weather Advisory Card */}
                {response.weatherAdvisory && (
                  <View style={styles.weatherCard}>
                    <View style={styles.weatherIconBox}>
                      <CloudSun size={22} color="#D97706" />
                    </View>
                    <View style={styles.weatherTextContainer}>
                      <Text style={styles.weatherHeader}>Weather & Climate Note</Text>
                      <Text style={styles.weatherText}>{response.weatherAdvisory}</Text>
                    </View>
                  </View>
                )}

                {/* Agronomy Advisory Text */}
                <View style={styles.answerCard}>
                  <Text style={styles.answerTitle}>Agronomy Guidance:</Text>
                  <Text style={styles.answerBody}>{response.answer}</Text>
                </View>

                {/* Recommended Products Carousel (From DB) */}
                {response.recommendedProducts && response.recommendedProducts.length > 0 && (
                  <View style={styles.productsSection}>
                    <View style={styles.sectionTitleRow}>
                      <Package size={18} color={colors.primaryDark} />
                      <Text style={styles.sectionTitle}>Recommended Farm Products</Text>
                    </View>
                    <Text style={styles.sectionSub}>
                      Available on BhoomiOne marketplace to treat and support your crop:
                    </Text>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.productsScroll}
                    >
                      {response.recommendedProducts.map((prod) => {
                        const isAdded = addedProductIds.includes(prod._id);
                        const imgUrl = prod.url && prod.url.length > 0 ? prod.url[0] : null;

                        return (
                          <View key={prod._id} style={styles.productCard}>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => {
                                onClose();
                                navigation.navigate('ProductDetails', { productId: prod._id });
                              }}
                            >
                              <View style={styles.prodImageBox}>
                                {imgUrl ? (
                                  <Image source={{ uri: imgUrl }} style={styles.prodImage} resizeMode="cover" />
                                ) : (
                                  <Package size={30} color={colors.primary} />
                                )}
                                {prod.pOffer && (
                                  <View style={styles.offerBadge}>
                                    <Text style={styles.offerText}>{prod.pOffer}% OFF</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.prodName} numberOfLines={2}>
                                {prod.pName}
                              </Text>
                              <Text style={styles.prodPrice}>
                                ₹{prod.pPrice?.toLocaleString('en-IN')}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleAddToCart(prod)}
                              style={[styles.addToCartBtn, isAdded && styles.addToCartBtnDone]}
                            >
                              {isAdded ? (
                                <>
                                  <Check size={14} color="#FFFFFF" />
                                  <Text style={styles.addToCartBtnText}>Added</Text>
                                </>
                              ) : (
                                <>
                                  <ShoppingCart size={14} color="#FFFFFF" />
                                  <Text style={styles.addToCartBtnText}>Add to Cart</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Follow-Up Questions */}
                {response.followUps && response.followUps.length > 0 && (
                  <View style={styles.followUpSection}>
                    <Text style={styles.followUpHeader}>Suggested Follow-Ups:</Text>
                    <View style={styles.followUpList}>
                      {response.followUps.map((fUp, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.followUpChip}
                          onPress={() => handleAskQuery(fUp)}
                        >
                          <Text style={styles.followUpText}>• {fUp}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Sparkles size={36} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Welcome to Kisan Voice AI</Text>
                <Text style={styles.emptySubtitle}>
                  Speak or type any question regarding crop pests, fertilizers, seeds, weather, or farming tools.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Voice & Text Input Bar */}
          <View style={styles.bottomBar}>
            {/* Pulsing Mic Button */}
            <TouchableOpacity
              onPress={handleVoiceMicPress}
              style={[styles.micButton, isListening && styles.micButtonActive]}
              activeOpacity={0.8}
            >
              {isListening ? (
                <MicOff size={22} color="#FFFFFF" />
              ) : (
                <Mic size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            {/* Text Input */}
            <View style={styles.textInputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask about crops, disease or seeds..."
                placeholderTextColor={colors.textMuted}
                value={queryInput}
                onChangeText={setQueryInput}
                onSubmitEditing={() => handleAskQuery(queryInput)}
                returnKeyType="send"
              />
              {!!queryInput && (
                <TouchableOpacity
                  onPress={() => handleAskQuery(queryInput)}
                  style={styles.sendButton}
                >
                  <Send size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
    minHeight: '65%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    gap: 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
    alignSelf: 'flex-start',
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FEF08A',
    letterSpacing: 0.5,
  },
  assistantTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioToggleActive: {
    backgroundColor: colors.primary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    backgroundColor: '#064E3B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    gap: 6,
  },
  waveBar: {
    width: 5,
    borderRadius: 2.5,
    backgroundColor: '#A7F3D0',
  },
  statusText: {
    fontSize: 11,
    color: '#D1FAE5',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 24,
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  responseContainer: {
    gap: 12,
  },
  queryBubble: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryDark,
  },
  queryText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    fontStyle: 'italic',
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    gap: 4,
    alignSelf: 'flex-start',
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  weatherCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
  },
  weatherIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherTextContainer: {
    flex: 1,
  },
  weatherHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  weatherText: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
    lineHeight: 16,
  },
  answerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  answerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  answerBody: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  productsSection: {
    marginTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  productsScroll: {
    gap: 12,
  },
  productCard: {
    width: 145,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prodImageBox: {
    width: '100%',
    height: 90,
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  prodImage: {
    width: '100%',
    height: '100%',
  },
  offerBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  offerText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  prodName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
    lineHeight: 16,
  },
  prodPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 2,
    marginBottom: 6,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  addToCartBtnDone: {
    backgroundColor: colors.success,
  },
  addToCartBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  followUpSection: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    padding: 12,
  },
  followUpHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  followUpList: {
    gap: 6,
  },
  followUpChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followUpText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10,
  },
  micButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  micButtonActive: {
    backgroundColor: colors.error,
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.full,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});

