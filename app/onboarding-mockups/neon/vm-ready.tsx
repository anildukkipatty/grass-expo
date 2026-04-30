import { Image } from "expo-image";
import { SFMono, SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ExitButton, Grid } from "./welcome";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const NEON = "#72FF4E";
const CYAN = "#4EFFE6";
const BG = "#05050A";

export default function NeonVmReady() {
  const router = useRouter();
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(scan, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [scan]);

  const scanY = scan.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT * 0.42],
  });

  return (
    <SafeAreaView style={s.safe}>
      <Grid />
      <ExitButton />

      <View style={s.illustrationWrap}>
        <Image
          source={require("@/assets/images/new-design/onboarding/vm-illustration.png")}
          style={s.illustration}
          contentFit="contain"
          tintColor={NEON}
        />
        <Animated.View
          pointerEvents="none"
          style={[s.scanline, { transform: [{ translateY: scanY }] }]}
        />
      </View>

      <View style={s.body}>
        <Text style={s.crumb}>{"// 04 / HARDWARE"}</Text>

        <View style={s.statusBadge}>
          <View style={s.statusDot} />
          <Text style={s.statusText}>NODE PROVISIONED</Text>
        </View>

        <Text style={s.title}>Your machine{"\n"}is online.</Text>
        <Text style={s.subtitle}>
          {">"} dedicated cloud node, persistent state.{"\n"}
          {">"} ready for designation.
        </Text>

        <View style={s.specRow}>
          <Spec label="CPU" value="8 vCPU" />
          <Spec label="MEM" value="16 GB" />
          <Spec label="DISK" value="200 GB" />
        </View>
      </View>

      <View style={s.bottom}>
        <Pressable
          style={s.button}
          onPress={() => router.push("/onboarding-mockups/neon/vm-name" as any)}
        >
          <Text style={s.buttonText}>{"DESIGNATE  ▸"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.spec}>
      <Text style={s.specLabel}>{label}</Text>
      <Text style={s.specValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  illustrationWrap: {
    height: SCREEN_HEIGHT * 0.42,
    overflow: "hidden",
  },
  illustration: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.42,
    opacity: 0.85,
  },
  scanline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: NEON,
    shadowColor: NEON,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  body: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  crumb: {
    fontFamily: SFMono.regular,
    fontSize: 11,
    color: CYAN,
    letterSpacing: 2,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: NEON,
    backgroundColor: "#0A1A0A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NEON,
    shadowColor: NEON,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    fontFamily: SFMono.bold,
    fontSize: 10,
    color: NEON,
    letterSpacing: 2,
  },
  title: {
    fontFamily: SFPro.displayBold,
    fontSize: 36,
    color: "#FFFFFF",
    lineHeight: 40,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: SFMono.regular,
    fontSize: 13,
    color: "#9FE69A",
    marginBottom: 24,
    letterSpacing: 0.4,
    lineHeight: 20,
  },
  specRow: {
    flexDirection: "row",
    gap: 10,
  },
  spec: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1F3A1F",
    backgroundColor: "#0A1A0A",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  specLabel: {
    fontFamily: SFMono.medium,
    fontSize: 10,
    color: CYAN,
    letterSpacing: 2,
    marginBottom: 4,
  },
  specValue: {
    fontFamily: SFMono.bold,
    fontSize: 16,
    color: NEON,
  },
  bottom: {
    paddingHorizontal: 22,
    paddingBottom: 36,
  },
  button: {
    height: 56,
    borderWidth: 1,
    borderColor: NEON,
    backgroundColor: "#0A2A0A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NEON,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  buttonText: {
    fontFamily: SFMono.bold,
    fontSize: 14,
    color: NEON,
    letterSpacing: 3,
  },
});
