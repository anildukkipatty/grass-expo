import AiAgentIcon from "@/assets/images/new-design/onboarding/ai-agent.svg";
import GiftIcon from "@/assets/images/new-design/onboarding/gift.svg";
import LaptopIcon from "@/assets/images/new-design/onboarding/laptop-window.svg";
import MobileIcon from "@/assets/images/new-design/onboarding/mobile-icon.svg";
import SecretIcon from "@/assets/images/new-design/onboarding/secret.svg";
import VmIcon from "@/assets/images/new-design/onboarding/vm-icon.svg";
import { getVmName } from "@/store/vm-metadata-store";
import { OnboardingAuthSheet } from "@/components/onboarding/OnboardingAuthSheet";
import { SFPro } from "@/constants/theme";
import {
  Canvas,
  LinearGradient as SkiaLinearGradient,
  Text as SkiaText,
  useFont,
} from "@shopify/react-native-skia";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { DeviceMotion } from "expo-sensors";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
  Svg,
} from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_TEXT_WIDTH = SCREEN_WIDTH - 32 - 60;
const AnimatedSvgGradient = Animated.createAnimatedComponent(SvgGradient);

const FEATURE_ITEMS = [
  {
    IconComponent: VmIcon,
    label: "Dedicated cloud VM, always available",
  },
  {
    IconComponent: LaptopIcon,
    label: "Run agents without opening your laptop",
  },
  {
    IconComponent: MobileIcon,
    label: "Monitor and control from your phone",
  },
  {
    IconComponent: AiAgentIcon,
    label: "Works with Claude, GPT, and more",
  },
  {
    IconComponent: SecretIcon,
    label: "Your code stays yours",
  },
];

export default function OnboardingClaimScreen() {
  const router = useRouter();
  const [authVisible, setAuthVisible] = useState(false);

  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    DeviceMotion.setUpdateInterval(16);
    const sub = DeviceMotion.addListener(({ rotation }) => {
      if (!rotation) return;
      tiltY.value = withSpring(
        Math.max(-1, Math.min(1, rotation.gamma / (Math.PI / 6))),
        { damping: 20, stiffness: 100 },
      );
      tiltX.value = withSpring(
        Math.max(-1, Math.min(1, rotation.beta / (Math.PI / 6))),
        { damping: 20, stiffness: 100 },
      );
    });
    return () => sub.remove();
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const tx = tiltX.value;
    const ty = tiltY.value;
    const shiftX = interpolate(ty, [-1, 1], [-6, 6]);
    const shiftY = interpolate(tx, [-1, 1], [-4, 4]);

    const shadow = [
      `${shiftX}px ${4 + shiftY}px 9px rgba(0,0,0,0.38)`,
      `${shiftX}px ${17 + shiftY * 2}px 17px rgba(0,0,0,0.33)`,
      `${shiftX}px ${38 + shiftY * 3}px 23px rgba(0,0,0,0.19)`,
      `${shiftX}px ${67 + shiftY * 4}px 27px rgba(0,0,0,0.06)`,
      `${shiftX}px ${105 + shiftY * 5}px 29px rgba(0,0,0,0.01)`,
    ].join(", ");

    return {
      transform: [
        { perspective: 800 },
        { rotateX: `${interpolate(tx, [-1, 1], [8, -8])}deg` },
        { rotateY: `${interpolate(ty, [-1, 1], [-8, 8])}deg` },
      ],
      boxShadow: shadow,
    };
  });

  const sheenAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(tiltY.value, [-1, 1], [-120, 120]) },
      { translateY: interpolate(tiltX.value, [-1, 1], [-80, 80]) },
    ],
  }));

  const cardFont = useFont(
    require("@/assets/fonts/SF-Pro/SF-Pro-Text-Semibold.otf"),
    28,
  );

  const textGradStart = useDerivedValue(() => ({
    x: interpolate(tiltY.value, [-1, 1], [-100, CARD_TEXT_WIDTH + 100]),
    y: 16,
  }));

  const textGradEnd = useDerivedValue(() => ({
    x: interpolate(tiltY.value, [-1, 1], [CARD_TEXT_WIDTH + 100, -100]),
    y: 16,
  }));

  const logoGradProps = useAnimatedProps(() => ({
    x1: `${interpolate(tiltY.value, [-1, 1], [0, 100])}%`,
    x2: `${interpolate(tiltY.value, [-1, 1], [100, 0])}%`,
    y1: "0%",
    y2: "0%",
  }));

  const handleVerified = async (type: "new" | "old") => {
    const existingName = await getVmName();
    if (type === "old" || existingName) {
      // Always run heartbeat/container check in vm-final before going to dashboard.
      // vm-final routes old users straight to /new-navbar/(tabs) after provisioning.
      router.replace({
        pathname: "/onboarding/vm-final" as any,
        params: { vmName: existingName ?? "" },
      });
    } else {
      router.replace("/onboarding/vm-ready" as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top section */}
        <View>
          <View style={styles.topRow}>
            <GiftIcon width={40} height={40} color="#000" />
          </View>

          <Text style={styles.heading}>
            10 hours of free compute.{"\n"}
            Every month. No card needed.
          </Text>

          <View style={styles.featureList}>
            {FEATURE_ITEMS.map(({ IconComponent, label }, i) => (
              <View key={i} style={styles.featureItem}>
                <IconComponent width={20} height={20} color="#404040" />
                <Text style={styles.featureLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Card — gyroscope-driven tilt */}
        <View style={styles.cardWrapper}>
          <Animated.View style={[styles.card, cardAnimatedStyle]}>
            <Image
              source={require("@/assets/images/new-design/onboarding/claim-card.png")}
              style={styles.cardImage}
              resizeMode="cover"
            />

            {/* Light sheen that slides with tilt */}
            <Animated.View style={[styles.sheen, sheenAnimatedStyle]} pointerEvents="none">
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0.04)",
                  "rgba(255,255,255,0.30)",
                  "rgba(255,255,255,0.04)",
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0)",
                ]}
                locations={[0, 0.22, 0.38, 0.5, 0.62, 0.78, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
              />
            </Animated.View>

            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.cardSubtitle}>
                    10 hours of VM compute
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    No credit card. No catch.
                  </Text>
                </View>
                <Svg width={53} height={30} viewBox="0 0 54 30">
                  <Defs>
                    <AnimatedSvgGradient id="logoGrad" animatedProps={logoGradProps}>
                      <Stop offset="0%" stopColor="#2a5c10" />
                      <Stop offset="50%" stopColor="#8fe05a" />
                      <Stop offset="100%" stopColor="#2a5c10" />
                    </AnimatedSvgGradient>
                  </Defs>
                  <Path
                    d="M53.4546 24.0851V30H33.7032C31.7768 30 30.0331 29.2102 28.7708 27.9326C27.5085 26.6553 26.7275 24.8907 26.7275 22.9419C26.7275 24.8907 25.9465 26.6553 24.6841 27.9326C23.4218 29.2102 21.6778 30 19.7514 30H0V24.0851H19.6707L5.76172 10.012L9.89517 5.82973L23.8045 19.9029V0H29.6504V19.9025L43.5594 5.82973L47.6928 10.012L33.7839 24.0851H53.4546Z"
                    fill="url(#logoGrad)"
                  />
                </Svg>
              </View>
              {cardFont ? (
                <Canvas style={{ height: 40, width: CARD_TEXT_WIDTH }}>
                  <SkiaText x={0} y={32} text="10h free/month" font={cardFont}>
                    <SkiaLinearGradient
                      start={textGradStart}
                      end={textGradEnd}
                      colors={["rgba(255,255,255,0.5)", "#ffffff", "rgba(255,255,255,0.5)"]}
                    />
                  </SkiaText>
                </Canvas>
              ) : (
                <Text style={styles.cardTitle}>10h free/month</Text>
              )}
            </View>
          </Animated.View>
        </View>

        {/* CTA button — pinned at bottom */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() => setAuthVisible(true)}
        >
          <Text style={styles.buttonText}>Claim and Setup your VM</Text>
        </TouchableOpacity>

        {/* Terms and Privacy */}
        <View style={styles.topLinks}>
          <Text
            style={styles.topLink}
            onPress={() => Linking.openURL("https://codeongrass.com/terms")}
          >
            Terms
          </Text>
          <Text
            style={styles.topLink}
            onPress={() => Linking.openURL("http://codeongrass.com/privacy")}
          >
            Privacy
          </Text>
        </View>
      </View>

      <OnboardingAuthSheet
        visible={authVisible}
        onClose={() => setAuthVisible(false)}
        onVerified={handleVerified}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  topLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    marginTop: 16,
  },
  topLink: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#000",
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: SFPro.semiBold,
    fontSize: 28,
    color: "#000",
    lineHeight: 32,
    letterSpacing: -0.8,
    marginBottom: 20,
  },
  featureList: {
    gap: 12,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#404040",
    flex: 1,
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.90)",
    height: 227,
    width: "100%",
  },
  sheen: {
    position: "absolute",
    width: 700,
    height: 500,
    top: -137,
    left: -165,
  },
  cardContent: {
    flex: 1,
    padding: 30,
    justifyContent: "space-between",
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    height: 227,
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#C6C6C6",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardSubtitle: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 28,
    color: "#fff",
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  button: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(114, 196, 78, 0.4)",
    backgroundColor: "#3D841E",
    height: 57,
    width: "100%",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
  },
  buttonText: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#fff",
    letterSpacing: -0.5,
  },
});
