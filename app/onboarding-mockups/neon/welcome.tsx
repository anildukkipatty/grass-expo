import LogoIcon from "@/assets/images/new-design/onboarding/logo.svg";
import { SFMono, SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const NEON = "#72FF4E";
const CYAN = "#4EFFE6";
const BG = "#05050A";

export default function NeonWelcome() {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <SafeAreaView style={s.safe}>
      <Grid />
      <ExitButton />

      <View style={s.center}>
        <Text style={s.boot}>{">  GRASS.OS  v0.4.20"}</Text>

        <View style={s.logoWrap}>
          <Animated.View
            style={[
              s.ring,
              { transform: [{ scale: ringScale }], opacity: ringOpacity },
            ]}
          />
          <View style={s.logoBox}>
            <LogoIcon width={72} height={56} />
          </View>
        </View>

        <Text style={s.online}>SYSTEM ONLINE</Text>
        <Text style={s.title}>Welcome to{"\n"}the grid.</Text>
        <Text style={s.subtitle}>
          Spin up a dedicated machine.{"\n"}
          Run agents around the clock.
        </Text>
      </View>

      <View style={s.bottom}>
        <Pressable
          style={s.button}
          onPress={() => router.push("/onboarding-mockups/neon/claim" as any)}
        >
          <Text style={s.buttonText}>{"INITIATE  ▸"}</Text>
        </Pressable>
        <TouchableOpacity
          onPress={() => router.push("/onboarding-mockups/neon/auth" as any)}
        >
          <Text style={s.loginText}>
            <Text style={s.loginDim}>existing user? </Text>
            <Text style={s.loginLink}>jack in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export function Grid() {
  const lines = [];
  for (let i = 1; i < 10; i++) {
    lines.push(
      <View
        key={`v${i}`}
        style={[s.gridLine, { left: `${i * 10}%`, top: 0, bottom: 0, width: 1 }]}
      />,
    );
  }
  for (let i = 1; i < 18; i++) {
    lines.push(
      <View
        key={`h${i}`}
        style={[s.gridLine, { top: `${i * 6}%`, left: 0, right: 0, height: 1 }]}
      />,
    );
  }
  return <View pointerEvents="none" style={s.gridWrap}>{lines}</View>;
}

export function ExitButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={s.exitBtn}
      onPress={() => router.replace("/onboarding-mockups" as any)}
    >
      <Text style={s.exitText}>×</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  gridWrap: { ...StyleSheet.absoluteFillObject, opacity: 0.18 },
  gridLine: { position: "absolute", backgroundColor: NEON },
  exitBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: NEON,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    backgroundColor: "#000",
  },
  exitText: {
    color: NEON,
    fontFamily: SFMono.regular,
    fontSize: 18,
    lineHeight: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  boot: {
    fontFamily: SFMono.regular,
    fontSize: 12,
    color: CYAN,
    letterSpacing: 1,
    marginBottom: 32,
  },
  logoWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  ring: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: NEON,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: NEON,
    backgroundColor: "#0A1A0A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NEON,
    shadowOpacity: 0.7,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  online: {
    fontFamily: SFMono.medium,
    fontSize: 11,
    color: NEON,
    letterSpacing: 3,
    marginBottom: 18,
  },
  title: {
    fontFamily: SFPro.displayBold,
    fontSize: 38,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 42,
    letterSpacing: -1,
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: SFMono.regular,
    fontSize: 14,
    color: "#9FE69A",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: "center",
    gap: 22,
  },
  button: {
    width: "100%",
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
    fontSize: 15,
    color: NEON,
    letterSpacing: 4,
  },
  loginText: {
    fontFamily: SFMono.regular,
    fontSize: 12,
    letterSpacing: 1,
  },
  loginDim: { color: "#5C7C5C" },
  loginLink: { color: CYAN, textDecorationLine: "underline" },
});
