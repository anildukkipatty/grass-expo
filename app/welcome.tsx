import { requestOtp, verifyOtp } from "@/api/auth";
import { saveAuth } from "@/store/auth-store";
import { NationalPark } from "@/constants/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;

// ─── Carousel data ───────────────────────────────────────────────────────────

const CAROUSEL_CARDS = [
  {
    icon: "🌐",
    title: "Remote Access",
    body: "Connect to your development machine from anywhere in the world.",
  },
  {
    icon: "⚡",
    title: "Always-on VM",
    body: "Your machine runs 24/7. Close the app, the agent keeps working.",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    body: "End-to-end encrypted. Your code stays on your machine.",
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
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, completed]);

  const spinDeg = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
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
        <View style={setup.bannerContainer}>
          <Image
            source={require("@/assets/images/setup/banner.png")}
            style={setup.banner}
            contentFit="fill"
          />
        </View>

        {/* Gradient overlay at bottom so cards are readable */}
        <View style={setup.gradientOverlay} />

        <SafeAreaView style={setup.safeArea}>
          {/* Title */}
          <Text style={setup.title}>{"Setting up\nyour GrassVM"}</Text>

          {/* Card carousel — centered vertically */}
          {!completed && (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <FlatList
                ref={flatListRef}
                data={CAROUSEL_CARDS}
                keyExtractor={(_, i) => String(i)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                style={setup.carouselList}
                getItemLayout={(_, index) => ({
                  length: SCREEN_WIDTH,
                  offset: SCREEN_WIDTH * index,
                  index,
                })}
                renderItem={({ item }) => (
                  <View style={setup.cardWrapper}>
                    <View style={setup.card}>
                      <Image
                        source={require("@/assets/images/setup/tabler-power.png")}
                        style={setup.cardIcon}
                        contentFit="contain"
                      />
                      <View style={setup.cardText}>
                        <Text style={setup.cardTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
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
            </View>
          )}

          {/* Status & progress */}

          {completed && <View style={{ flex: 1 }} />}
          <View style={setup.bottomArea}>
            {completed ? (
              <TouchableOpacity
                style={setup.commitButtonOuter}
                onPress={() => {
                  onComplete();
                  router.push("/push-commit");
                }}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={["#00FF40", "#E0FF47"]}
                  locations={[0.2806, 1]}
                  start={{ x: 0.17, y: 0.12 }}
                  end={{ x: 0.83, y: 0.88 }}
                  style={setup.commitButton}
                >
                  <Text style={setup.commitButtonText}>
                    Push your first commit →
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                <View style={setup.statusRow}>
                  <Animated.Text
                    style={[
                      setup.spinnerIcon,
                      { transform: [{ rotate: spinDeg }] },
                    ]}
                  >
                    ✳
                  </Animated.Text>
                  <Text style={setup.statusText}>Planting the seeds...</Text>
                </View>
                <View style={setup.progressTrack}>
                  <Animated.View
                    style={[setup.progressFill, { width: progressWidth }]}
                  />
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

const RESEND_COOLDOWN = 30;

function AuthSheet({
  visible,
  onClose,
  onVerified,
}: {
  visible: boolean;
  onClose: () => void;
  onVerified: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startResendTimer = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Reset state when sheet closes
  useEffect(() => {
    if (!visible) {
      setStep("email");
      setEmail("");
      setOtp("");
      setLoading(false);
      setResendTimer(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [visible]);

  const handleRequestOtp = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    const result = await requestOtp(trimmed);

    setLoading(false);

    if (result.ok) {
      setStep("otp");
      startResendTimer();
    } else {
      Alert.alert("Error", result.error);
    }
  }, [email, startResendTimer]);

  const handleResendOtp = useCallback(async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    const result = await requestOtp(email.trim());
    setLoading(false);

    if (result.ok) {
      startResendTimer();
      Alert.alert("OTP Sent", "A new OTP has been sent to your email.");
    } else {
      Alert.alert("Error", result.error);
    }
  }, [email, resendTimer, startResendTimer]);

  const handleVerifyOtp = useCallback(async () => {
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    const result = await verifyOtp(email.trim(), trimmedOtp);

    setLoading(false);

    if (result.ok) {
      await saveAuth(result.data.token, result.data.user);
      onVerified();
    } else {
      Alert.alert("Verification Failed", result.error);
    }
  }, [email, otp, onVerified]);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(SHEET_HEIGHT);
      backdropAnim.setValue(0);
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        >
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <LinearGradient
            colors={["#FFFFFF", "#CCFFD9"]}
            style={styles.container}
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
                  <Text style={styles.sheetTitle}>
                    {step === "email"
                      ? "Create your account"
                      : "Enter verification code"}
                  </Text>
                  <Text style={styles.sheetSubtitle}>
                    {step === "email"
                      ? "Join thousands of people coding remotely"
                      : `The requested OTP is sent to ${email}`}
                  </Text>

                  {step === "email" ? (
                    <>
                      {/* Email field */}
                      <Text style={styles.fieldLabel}>EMAIL</Text>
                      <View style={styles.inputRow}>
                        <Image
                          source={require("@/assets/images/home-screen/email-placeholder-icon.png")}
                          style={styles.inputIconImage}
                          contentFit="contain"
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="name@email.com"
                          placeholderTextColor="#59B26E"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          value={email}
                          onChangeText={setEmail}
                          onSubmitEditing={handleRequestOtp}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      {/* OTP field */}
                      <Text style={styles.fieldLabel}>OTP CODE</Text>
                      <View style={styles.inputRow}>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter 6-digit code"
                          placeholderTextColor="#59B26E"
                          keyboardType="number-pad"
                          maxLength={6}
                          autoFocus
                          value={otp}
                          onChangeText={setOtp}
                          returnKeyType="done"
                          onSubmitEditing={handleVerifyOtp}
                        />
                      </View>

                      {/* Resend OTP */}
                      <View style={styles.resendRow}>
                        {resendTimer > 0 ? (
                          <Text style={styles.resendTimerText}>
                            Resend OTP in {resendTimer}s
                          </Text>
                        ) : (
                          <TouchableOpacity onPress={handleResendOtp}>
                            <Text style={styles.resendButtonText}>
                              Resend OTP
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
                  )}

                  {/* Primary CTA */}
                  <TouchableOpacity
                    onPress={step === "email" ? handleRequestOtp : handleVerifyOtp}
                    activeOpacity={0.88}
                    style={styles.ctaButtonShadow}
                    disabled={loading}
                  >
                    <LinearGradient
                      style={[
                        styles.ctaButton,
                        loading && { opacity: 0.7 },
                      ]}
                      colors={["#00FF40", "#E0FF47"]}
                      locations={[0.2806, 1]}
                      start={{ x: 0.85, y: 0.15 }}
                      end={{ x: 0.15, y: 0.85 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#0a1a00" />
                      ) : (
                        <Text style={styles.ctaButtonText}>
                          {step === "email" ? "Get started →" : "Verify OTP →"}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Legal */}
                  <Text style={styles.legal}>
                    By continuing, you agree to our{"\n "}
                    <Text style={styles.legalLink}>Terms of Service</Text>
                    <Text style={styles.legal}> and </Text>
                    <Text style={styles.legalLink}>Privacy Policy.</Text>
                  </Text>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </LinearGradient>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [setupVisible, setSetupVisible] = useState(false);

  const handleVerified = () => {
    setSheetVisible(false);
    setTimeout(() => setSetupVisible(true), 300);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("@/assets/images/banner-image.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Multi-layer overlay simulating a top-to-bottom darkening gradient */}
        {/* <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} /> */}

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Image
              source={require("@/assets/images/home-screen/welcome-text-background-image.png")}
              style={styles.logo}
              contentFit="cover"
            />

            <Text style={styles.title}>{"Welcome\nto Grass"}</Text>

            <Text style={styles.subtitle}>
              Control your coding agent{"\n"}from anywhere
            </Text>

            <TouchableOpacity
              onPress={() => setSheetVisible(true)}
              activeOpacity={0.88}
            >
              <LinearGradient
                style={styles.button}
                colors={["#00FF26", "#E0FF47"]}
                locations={[0.2806, 1]}
                start={{ x: 0.85, y: 0.15 }}
                end={{ x: 0.15, y: 0.85 }}
              >
                <Text style={styles.buttonText}>Get started →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>

      <AuthSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onVerified={handleVerified}
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
    fontFamily: "NationalPark-Regular",
  },
  background: {
    flex: 1,
  },
  gradientLayer1: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.55,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  gradientLayer2: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.38,
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  gradientLayer3: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.22,
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  safeArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: 32,
  },
  logo: {
    width: 69,
    height: 69,
    borderRadius: 20,
    marginBottom: 20,
  },
  title: {
    fontFamily: NationalPark.bold,
    fontSize: 48,
    fontWeight: "600",
    color: "#E5FFEC",
    lineHeight: 48,
    letterSpacing: -1,
  },
  subtitle: {
    color: "#66806C",
    fontFamily: NationalPark.semiBold,
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 25,
  },
  button: {
    borderRadius: 63,
    borderColor: "#00CC1E",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#000",
    fontFamily: NationalPark.bold,
    fontSize: 20,
    fontWeight: 700,
  },

  // --- Sheet ---
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  sheetTitle: {
    color: "#00330C",
    fontFamily: NationalPark.bold,
    fontSize: 36,
    fontWeight: 600,
    letterSpacing: -1,
    marginBottom: 5,
  },
  sheetSubtitle: {
    color: "#59B26E",
    fontFamily: NationalPark.regular,
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 30,
  },
  fieldLabel: {
    color: "#59B26E",
    fontFamily: NationalPark.regular,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D1E8BC",
    paddingHorizontal: 14,
    height: 52,
  },
  inputIconImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    borderRadius: 80,
    borderColor: "#A1E5B2",
    backgroundColor: "#FFF",
    color: "#00330C",
    fontFamily: NationalPark.bold,
  },
  ctaButtonShadow: {
    marginTop: 28,
    borderRadius: 63,
    shadowColor: "rgba(0, 255, 38, 1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  ctaButton: {
    borderRadius: 63,
    borderWidth: 1,
    borderColor: "#00CC33",
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0a1a00",
    fontFamily: NationalPark.bold,
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#C8E6A8",
  },
  dividerText: {
    fontSize: 13,
    fontFamily: NationalPark.regular,
    color: "#6B8F4A",
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderWidth: 1,
    shadowColor: "rgba(0,0,0,0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    borderRadius: 80,
    borderColor: "#95E5A9",
    backgroundColor: "#A6FFBC",
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialButtonText: {
    fontSize: 20,
    fontFamily: NationalPark.bold,
    fontWeight: 600,
    color: "#004D13",
  },
  legal: {
    fontSize: 14,
    fontFamily: NationalPark.regular,
    color: "#55AA69",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
  legalLink: {
    fontFamily: NationalPark.semiBold,
    textDecorationLine: "underline",
    color: "#55AA69",
  },
  resendRow: {
    marginTop: 16,
    alignItems: "center",
  },
  resendTimerText: {
    fontSize: 14,
    fontFamily: NationalPark.regular,
    color: "#59B26E",
  },
  resendButtonText: {
    fontSize: 14,
    fontFamily: NationalPark.semiBold,
    color: "#00330C",
    textDecorationLine: "underline",
  },
});

// Setup screen styles
const setup = StyleSheet.create({
  container: {
    flex: 1,
    fontFamily: NationalPark.regular,
  },
  bannerContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#D3D3D3",
    overflow: "hidden",
  },
  banner: {
    position: "absolute",
    left: 0,
    top: -263.316,
    width: "100%",
    height: "142.509%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#2E2E2E",
    letterSpacing: -0.5,
    lineHeight: 40,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 32,
    fontFamily: NationalPark.bold,
  },
  // Carousel
  carouselList: {
    height: 120,
    flexGrow: 0,
  },
  cardWrapper: {
    width: SCREEN_WIDTH,
    height: 120,
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.60)",
    borderRadius: 20,
    borderColor: "#DCDCDC",
    borderWidth: 1,
    padding: 16,
    gap: 14,
    flex: 1,
    overflow: "hidden",
  },
  cardIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#000",
    marginBottom: 4,
    fontFamily: NationalPark.bold,
  },
  cardBody: {
    fontSize: 14,
    color: "#000",
    lineHeight: 19,
  },
  // Dots
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderColor: "#000",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  dotActive: {
    backgroundColor: "#000",
    width: 7,
  },
  // Bottom
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  spinnerIcon: {
    fontSize: 18,
    color: "#7FE63A",
  },
  statusText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7FE63A",
    borderRadius: 4,
  },
  commitButtonOuter: {
    borderRadius: 63,
    shadowColor: "rgba(0, 255, 38, 1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  commitButton: {
    borderRadius: 63,
    borderWidth: 1,
    borderColor: "#00CC33",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  commitButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#004D13",
    letterSpacing: 0.2,
  },
});
