import { requestOtp, verifyOtp } from "@/api/auth";
import { heartbeat, requestContainer } from "@/api/containers";
import { NationalPark } from "@/constants/theme";
import { getToken, saveAuth } from "@/store/auth-store";
import { saveVmUrl } from "@/store/url-store";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

// ─── SetupLoadingModal ────────────────────────────────────────────────────────

function SetupLoadingModal({
  visible,
  userType,
}: {
  visible: boolean;
  userType: "new" | "old";
}) {
  const router = useRouter();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Call container APIs when modal opens
  useEffect(() => {
    if (!visible) return;
    setError(null);
    setActiveIndex(0);
    progressAnim.setValue(0);

    let cancelled = false;
    const progressTimer = Animated.timing(progressAnim, {
      toValue: 0.95,
      duration: 18000,
      useNativeDriver: false,
    });
    progressTimer.start();

    const finishAndRedirect = (path: "/push-commit" | "/(tabs)/home") => {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        if (!cancelled) {
          router.replace(path);
        }
      });
    };

    async function provision() {
      const token = await getToken();
      if (!token || cancelled) return;

      if (userType === "new") {
        // New user: request container directly
        const result = await requestContainer(token);
        if (cancelled) return;
        if (result.ok) {
          if (result.data.url) await saveVmUrl(result.data.url);
          finishAndRedirect("/push-commit");
        } else {
          progressTimer.stop();
          setError(result.error);
        }
      } else {
        // Old user: check heartbeat first
        const hb = await heartbeat(token);
        if (cancelled) return;

        if (hb.ok && hb.data.container === "running") {
          finishAndRedirect("/(tabs)/home");
          return;
        }

        // If provisioning, poll heartbeat every 2s for 10s before requesting
        if (hb.ok && hb.data.container === "provisioning") {
          const pollStart = Date.now();
          while (Date.now() - pollStart < 10000) {
            await new Promise((r) => setTimeout(r, 2000));
            if (cancelled) return;
            const poll = await heartbeat(token);
            if (cancelled) return;
            if (poll.ok && poll.data.container === "running") {
              finishAndRedirect("/(tabs)/home");
              return;
            }
            if (poll.ok && poll.data.container !== "provisioning") {
              break; // stopped/not found — fall through to request
            }
          }
        }

        if (cancelled) return;

        // Container stopped/not found/provisioning timed out — request/restart it
        const result = await requestContainer(token);
        if (cancelled) return;
        if (result.ok) {
          if (result.data.url) await saveVmUrl(result.data.url);
          finishAndRedirect("/(tabs)/home");
        } else {
          progressTimer.stop();
          setError(result.error);
        }
      }
    }

    provision();

    // Advance carousel automatically
    let idx = 0;
    const cardInterval = setInterval(() => {
      idx = (idx + 1) % CAROUSEL_CARDS.length;
      setActiveIndex(idx);
      flatListRef.current?.scrollToIndex({ index: idx, animated: true });
    }, 2000);

    return () => {
      cancelled = true;
      progressTimer.stop();
      clearInterval(cardInterval);
    };
  }, [visible, userType, router, progressAnim]);

  // Spinner rotation loop
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

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

  const title =
    userType === "new"
      ? "Setting up\nyour virtual VM"
      : "Starting your\nContainer";

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
            contentFit="cover"
            priority="normal"
          />
          {/* Design layer on top of banner — image positioned per spec: 0px -263px / 100% 142.509% */}
          <Image
            source={require("@/assets/images/setup/banner.png")}
            // style={setup.bannerOverlay}
            contentFit="fill"
          />
        </View>

        {/* Gradient overlay at bottom so cards are readable */}
        <View style={setup.gradientOverlay} />

        <SafeAreaView style={setup.safeArea}>
          {/* Title */}
          <Text style={setup.title}>{title}</Text>

          {/* Card carousel — offset below center to keep banner server visible */}
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              paddingTop: SCREEN_HEIGHT * 0.2,
            }}
          >
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
                    <LinearGradient
                      colors={["#00FF40", "#E0FF47"]}
                      start={{ x: 0.28, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={setup.cardIconGradient}
                    >
                      <Image
                        source={require("@/assets/images/setup/tabler-power.png")}
                        style={setup.cardIconImage}
                        contentFit="contain"
                      />
                    </LinearGradient>
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

          {/* Status */}
          <View style={setup.bottomArea}>
            {error ? (
              <Text
                style={[
                  setup.statusText,
                  { color: "#ef4444", textAlign: "center" },
                ]}
              >
                {error}
              </Text>
            ) : (
              <>
                <View style={setup.statusRow}>
                  <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
                    <ActivityIndicator color="#000" />
                  </Animated.View>
                  <Text style={setup.statusText}>
                    {userType === "new"
                      ? "Planting the seeds..."
                      : "Waking up your container..."}
                  </Text>
                </View>
                <View style={setup.progressTrack}>
                  <LinearGradient
                    colors={["#000000", "#505050"]}
                    start={{ x: 0.08, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Animated.View
                    style={[
                      setup.progressFillWrapper,
                      { width: progressWidth },
                    ]}
                  >
                    <LinearGradient
                      colors={["#00FF40", "#E0FF47"]}
                      start={{ x: 0.28, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={setup.progressFill}
                    />
                  </Animated.View>
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
  sheetRef,
  onVerified,
}: {
  sheetRef: React.RefObject<BottomSheetModal>;
  onVerified: (userType: "new" | "old") => void;
}) {
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

  const resetState = useCallback(() => {
    setStep("email");
    setEmail("");
    setOtp("");
    setLoading(false);
    setResendTimer(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    resetState();
  }, [resetState]);

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
      sheetRef.current?.dismiss();
      onVerified(result.data.user.userType);
    } else {
      Alert.alert("Verification Failed", result.error);
    }
  }, [email, otp, onVerified, sheetRef]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleIndicatorStyle={styles.dragHandle}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.sheetContent}>
        <Text style={styles.sheetTitle}>
          {step === "email" ? "Create your account" : "Enter verification code"}
        </Text>
        <Text style={styles.sheetSubtitle}>
          {step === "email"
            ? "Join thousands of people coding remotely"
            : `The requested OTP is sent to ${email}`}
        </Text>

        {step === "email" ? (
          <>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <View style={styles.inputRow}>
              <Image
                source={require("@/assets/images/home-screen/email-placeholder-icon.png")}
                style={styles.inputIconImage}
                contentFit="contain"
              />
              <BottomSheetTextInput
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
            <Text style={styles.fieldLabel}>OTP CODE</Text>
            <View style={styles.inputRow}>
              <BottomSheetTextInput
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
            <View style={styles.resendRow}>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimerText}>
                  Resend OTP in {resendTimer}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.resendButtonText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <TouchableOpacity
          onPress={step === "email" ? handleRequestOtp : handleVerifyOtp}
          activeOpacity={0.88}
          style={styles.ctaButtonShadow}
          disabled={loading}
        >
          <LinearGradient
            style={[styles.ctaButton, loading && { opacity: 0.7 }]}
            colors={["#00FF26", "#E0FF47"]}
            locations={[0.2806, 1]}
            start={{ x: 0.828, y: 0.123 }}
            end={{ x: 0.172, y: 0.878 }}
          >
            <View style={styles.ctaButtonInsetHighlight} pointerEvents="none" />
            {loading ? (
              <ActivityIndicator color="#0a1a00" />
            ) : (
              <Text style={styles.ctaButtonText}>
                {step === "email" ? "Get started →" : "Verify OTP →"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.legal}>
          By continuing, you agree to our{"\n"}
          <Text style={styles.legalLink}>Terms of Service</Text>
          <Text style={styles.legal}> and </Text>
          <Text style={styles.legalLink}>Privacy Policy.</Text>
        </Text>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [setupVisible, setSetupVisible] = useState(false);
  const [userType, setUserType] = useState<"new" | "old">("new");

  const handleVerified = (type: "new" | "old") => {
    setUserType(type);
    setTimeout(() => setSetupVisible(true), 300);
  };

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <Image
          source={require("@/assets/images/banner-image.png")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          priority="high"
        />

        <LinearGradient
          style={styles.bottomGradient}
          colors={["rgba(0,0,0,0)", "#000000"]}
          locations={[0.309, 1.0]}
          start={{ x: 0.56, y: 0 }}
          end={{ x: 0.44, y: 1 }}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Image
              source={require("@/assets/images/home-screen/welcome-text-background-image.png")}
              style={styles.logo}
              contentFit="contain"
              priority="high"
            />

            <Text style={styles.title}>{"Welcome\nto Grass Beta"}</Text>

            <Text style={styles.subtitle}>
              Control your coding agent{"\n"}from anywhere
            </Text>

            <TouchableOpacity
              onPress={() => sheetRef.current?.present()}
              activeOpacity={0.88}
              style={styles.buttonShadow}
            >
              <LinearGradient
                style={styles.button}
                colors={["#00FF26", "#E0FF47"]}
                locations={[0.2806, 1]}
                start={{ x: 0.828, y: 0.123 }}
                end={{ x: 0.172, y: 0.878 }}
              >
                <View
                  style={styles.buttonInsetHighlight}
                  pointerEvents="none"
                />
                <Text style={styles.buttonText}>Get started →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <AuthSheet sheetRef={sheetRef} onVerified={handleVerified} />

      <SetupLoadingModal visible={setupVisible} userType={userType} />
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
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    paddingHorizontal: 30,
    // paddingBottom: 30,
  },
  logo: {
    width: 69,
    height: 69,
    // borderRadius: 20,
    // marginBottom: 20,
  },
  title: {
    fontFamily: NationalPark.semiBold,
    fontSize: 48,
    fontWeight: 600,
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
  buttonShadow: {
    borderRadius: 63,
    shadowColor: "#00FF26",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  button: {
    borderRadius: 63,
    borderWidth: 2,
    borderColor: "#00CC1E",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonInsetHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.40)",
    borderTopLeftRadius: 63,
    borderTopRightRadius: 63,
  },
  buttonText: {
    color: "#000",
    fontFamily: NationalPark.bold,
    fontSize: 20,
    fontWeight: 700,
  },

  // --- Sheet ---
  sheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 4,
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
    shadowColor: "#00FF26",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  ctaButton: {
    borderRadius: 63,
    borderWidth: 2,
    borderColor: "#00CC1E",
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ctaButtonInsetHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.40)",
    borderTopLeftRadius: 63,
    borderTopRightRadius: 63,
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
    overflow: "hidden",
  },
  banner: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  // bannerOverlay: {
  //   position: "absolute",
  //   left: 0,
  //   width: SCREEN_WIDTH,
  //   top: -263.316,
  //   height: SCREEN_HEIGHT * 1.42509,
  //   backgroundColor: "lightgray",
  //   opacity: 0.08,
  // },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: "lightgray",
    height: SCREEN_HEIGHT * 1,
    opacity: 0.05,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    color: "#2E2E2E",
    letterSpacing: -1,
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
  cardIconGradient: {
    padding: 10,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: "#00CC33",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: "rgba(0, 255, 38, 1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  cardIconImage: {
    width: 12,
    height: 12,
  },
  cardText: {
    flex: 1,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#000",
    marginBottom: 4,
    fontFamily: NationalPark.bold,
  },
  cardBody: {
    fontSize: 16,
    fontWeight: 400,
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
    backgroundColor: "#000",
  },
  dotActive: {
    width: 7,
    backgroundColor: "transparent",
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
    width: 20,
    height: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  progressTrack: {
    height: 12,
    borderRadius: 63,
    overflow: "hidden",
    shadowColor: "rgba(255, 255, 255, 1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
  },
  progressFillWrapper: {
    height: "100%",
    overflow: "hidden",
    borderRadius: 63,
    borderWidth: 1,
    borderColor: "#00CC33",
    shadowColor: "rgba(0, 255, 38, 1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
  progressFill: {
    flex: 1,
    borderRadius: 63,
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
