import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  Dimensions,
  Modal,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;

// ─── Carousel data ───────────────────────────────────────────────────────────

const CAROUSEL_CARDS = [
  {
    icon: '🌐',
    title: 'Remote Access',
    body: 'Connect to your development machine from anywhere in the world.',
  },
  {
    icon: '⚡',
    title: 'Always-on VM',
    body: 'Your machine runs 24/7. Close the app, the agent keeps working.',
  },
  {
    icon: '🔒',
    title: 'Secure & Private',
    body: 'End-to-end encrypted. Your code stays on your machine.',
  },
];

const SETUP_DURATION = 5000; // ms

// ─── SetupLoadingModal ────────────────────────────────────────────────────────

function SetupLoadingModal({
  visible,
  onComplete,
}: {
  visible: boolean;
  onComplete: () => void;
}) {
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [completed, setCompleted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Reset & start whenever modal opens
  useEffect(() => {
    if (!visible) return;
    setCompleted(false);
    setActiveIndex(0);
    progressAnim.setValue(0);

    // Progress bar fill
    const progressTimer = Animated.timing(progressAnim, {
      toValue: 1,
      duration: SETUP_DURATION,
      useNativeDriver: false,
    });
    progressTimer.start(({ finished }) => {
      if (finished) setCompleted(true);
    });

    // Advance carousel automatically every ~1.6 s
    let idx = 0;
    const cardInterval = setInterval(() => {
      idx = (idx + 1) % CAROUSEL_CARDS.length;
      setActiveIndex(idx);
      flatListRef.current?.scrollToIndex({ index: idx, animated: true });
    }, SETUP_DURATION / CAROUSEL_CARDS.length);

    return () => {
      progressTimer.stop();
      clearInterval(cardInterval);
    };
  }, [visible]);

  // Spinner rotation loop
  useEffect(() => {
    if (!visible || completed) return;
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [visible, completed]);

  const spinDeg = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(idx);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={setup.container}>
        {/* Full-screen banner image */}
        <Image
          source={require('@/assets/images/setup/banner.png')}
          style={setup.banner}
          contentFit="cover"
        />

        {/* Gradient overlay at bottom so cards are readable */}
        <View style={setup.gradientOverlay} />

        <SafeAreaView style={setup.safeArea}>
          {/* Title */}
          <Text style={setup.title}>{'Setting up\nyour GrassVM'}</Text>

          {/* Push cards to bottom */}
          <View style={{ flex: 1 }} />

          {/* Card carousel */}
          <FlatList
            ref={flatListRef}
            data={CAROUSEL_CARDS}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={setup.cardWrapper}>
                <View style={setup.card}>
                  <Text style={setup.cardIcon}>{item.icon}</Text>
                  <View style={setup.cardText}>
                    <Text style={setup.cardTitle}>{item.title}</Text>
                    <Text style={setup.cardBody}>{item.body}</Text>
                  </View>
                </View>
              </View>
            )}
          />

          {/* Pagination dots */}
          <View style={setup.dotsRow}>
            {CAROUSEL_CARDS.map((_, i) => (
              <View
                key={i}
                style={[setup.dot, i === activeIndex && setup.dotActive]}
              />
            ))}
          </View>

          {/* Status & progress */}
          <View style={setup.bottomArea}>
            {completed ? (
              <TouchableOpacity
                style={setup.commitButton}
                onPress={() => { onComplete(); router.push('/push-commit'); }}
                activeOpacity={0.88}
              >
                <Text style={setup.commitButtonText}>Push your first commit  →</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={setup.statusRow}>
                  <Animated.Text
                    style={[setup.spinnerIcon, { transform: [{ rotate: spinDeg }] }]}
                  >
                    ✳
                  </Animated.Text>
                  <Text style={setup.statusText}>Planting the seeds...</Text>
                </View>
                <View style={setup.progressTrack}>
                  <Animated.View style={[setup.progressFill, { width: progressWidth }]} />
                </View>
              </>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── AuthSheet ────────────────────────────────────────────────────────────────

function AuthSheet({
  visible,
  onClose,
  onGetStarted,
}: {
  visible: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 28,
          stiffness: 260,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropAnim }]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              {/* Drag handle */}
              <View style={styles.dragHandle} />

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sheetContent}
              >
                <Text style={styles.sheetTitle}>Create your account</Text>
                <Text style={styles.sheetSubtitle}>
                  Join thousands of people coding remotely
                </Text>

                {/* Email field */}
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputIcon}>✉</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@email.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>

                {/* Password field */}
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>PASSWORD</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>

                {/* Primary CTA */}
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={onGetStarted}
                  activeOpacity={0.88}
                >
                  <Text style={styles.ctaButtonText}>Get started  →</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social buttons */}
                <View style={styles.socialRow}>
                  <TouchableOpacity
                    style={styles.socialButton}
                    activeOpacity={0.82}
                    onPress={onGetStarted}
                  >
                    <Text style={styles.socialButtonText}> Apple</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.socialButton}
                    activeOpacity={0.82}
                    onPress={onGetStarted}
                  >
                    <Text style={styles.socialButtonText}>G  Google</Text>
                  </TouchableOpacity>
                </View>

                {/* Legal */}
                <Text style={styles.legal}>
                  By continuing, you agree to our{'\n'}
                  <Text style={styles.legalLink}>Terms of Service</Text>
                  <Text> and </Text>
                  <Text style={styles.legalLink}>Privacy Policy.</Text>
                </Text>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [setupVisible, setSetupVisible] = useState(false);

  const handleGetStarted = () => {
    setSheetVisible(false);
    // Small delay so the sheet dismiss animation doesn't clash
    setTimeout(() => setSetupVisible(true), 300);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/banner-image.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Multi-layer overlay simulating a top-to-bottom darkening gradient */}
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Image
              source={require('@/assets/images/home-screen/welcome-text-background-image.png')}
              style={styles.logo}
              contentFit="cover"
            />

            <Text style={styles.title}>{'Welcome\nto Grass'}</Text>

            <Text style={styles.subtitle}>
              Control your coding agent{'\n'}from anywhere.
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => setSheetVisible(true)}
              activeOpacity={0.88}
            >
              <Text style={styles.buttonText}>Get started  →</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>

      <AuthSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onGetStarted={handleGetStarted}
      />

      <SetupLoadingModal
        visible={setupVisible}
        onComplete={() => setSetupVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  gradientLayer1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.55,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  gradientLayer2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.38,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  gradientLayer3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.22,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 54,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 23,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#7FE63A',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0a1a00',
    letterSpacing: 0.2,
  },

  // --- Sheet ---
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#F0FAE8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  sheetTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0D2600',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 15,
    color: '#4B6B30',
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: '#4B6B30',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1E8BC',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
    color: '#7FE63A',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0D2600',
  },
  ctaButton: {
    backgroundColor: '#7FE63A',
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0a1a00',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#C8E6A8',
  },
  dividerText: {
    fontSize: 13,
    color: '#6B8F4A',
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#E4F5D0',
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6A8',
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0D2600',
  },
  legal: {
    fontSize: 12,
    color: '#6B8F4A',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: '#4B6B30',
  },
});

// Setup screen styles
const setup = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a8d4f0',
  },
  banner: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
    backgroundColor: 'rgba(10, 30, 60, 0.45)',
  },
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0D1A00',
    letterSpacing: -0.5,
    lineHeight: 40,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 32,
  },
  // Carousel
  cardWrapper: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  cardIcon: {
    fontSize: 32,
    width: 48,
    textAlign: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0D2600',
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 14,
    color: '#3A5220',
    lineHeight: 20,
  },
  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#ffffff',
    width: 20,
  },
  // Bottom
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  spinnerIcon: {
    fontSize: 18,
    color: '#7FE63A',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7FE63A',
    borderRadius: 4,
  },
  commitButton: {
    backgroundColor: '#7FE63A',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0a1a00',
    letterSpacing: 0.2,
  },
});
