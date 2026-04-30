import LogoIcon from "@/assets/images/new-design/onboarding/logo.svg";
import { NationalPark, SFPro } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SKY_TOP = "#74C9FF";
const SKY_BOT = "#A6E2FF";
const GRASS = "#5FB330";
const GRASS_DARK = "#2A6E16";
const SUN = "#FFD13B";
const TEXT_DARK = "#102B5C";

export function QuestExitButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={qs.exitBtn}
      onPress={() => router.replace("/onboarding-mockups" as any)}
    >
      <Text style={qs.exitText}>×</Text>
    </TouchableOpacity>
  );
}

export function QuestProgress({ step }: { step: number }) {
  const filled = (step / 5) * 100;
  return (
    <View style={qs.progressOuter}>
      <View style={qs.progressTrack}>
        <View style={[qs.progressFill, { width: `${filled}%` }]} />
      </View>
      <Text style={qs.progressLabel}>QUEST {step}/5</Text>
    </View>
  );
}

export function ChunkyButton({
  label,
  onPress,
  color = GRASS,
  shadow = GRASS_DARK,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  shadow?: string;
}) {
  return (
    <View style={qs.btnWrap}>
      <View style={[qs.btnShadow, { backgroundColor: shadow }]} />
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[qs.btn, { backgroundColor: color }]}
      >
        <Text style={qs.btnText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

export const questStyles = {
  SKY_TOP,
  SKY_BOT,
  GRASS,
  GRASS_DARK,
  SUN,
  TEXT_DARK,
};

const qs = StyleSheet.create({
  exitBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: TEXT_DARK,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  exitText: {
    color: TEXT_DARK,
    fontFamily: NationalPark.bold,
    fontSize: 20,
    lineHeight: 22,
  },
  progressOuter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 2,
    borderColor: TEXT_DARK,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: SUN,
    borderRightWidth: 2,
    borderRightColor: TEXT_DARK,
  },
  progressLabel: {
    fontFamily: NationalPark.bold,
    fontSize: 13,
    color: TEXT_DARK,
    letterSpacing: 0.5,
  },
  btnWrap: {
    width: "100%",
    position: "relative",
  },
  btnShadow: {
    position: "absolute",
    top: 6,
    left: 0,
    right: 0,
    height: 56,
    borderRadius: 14,
  },
  btn: {
    height: 56,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontFamily: NationalPark.bold,
    fontSize: 18,
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
});

export default function QuestWelcome() {
  const router = useRouter();
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bounce]);

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[SKY_TOP, SKY_BOT]}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.cloudA} />
      <View style={s.cloudB} />
      <View style={s.cloudC} />
      <View style={s.sun} />

      <SafeAreaView style={{ flex: 1 }}>
        <QuestExitButton />

        <View style={s.body}>
          <Animated.View style={[s.logoCard, { transform: [{ translateY }] }]}>
            <LogoIcon width={64} height={50} />
          </Animated.View>

          <View style={s.banner}>
            <Text style={s.bannerEyebrow}>NEW QUEST</Text>
            <Text style={s.bannerTitle}>The Grass{"\n"}Adventure</Text>
            <Text style={s.bannerSubtitle}>
              Hire a digital companion. Send them on quests.{"\n"}
              Reap the spoils.
            </Text>
          </View>
        </View>

        <View style={s.bottom}>
          <ChunkyButton
            label="START ADVENTURE"
            onPress={() => router.push("/onboarding-mockups/quest/claim" as any)}
          />
          <TouchableOpacity
            style={s.loginBtn}
            onPress={() => router.push("/onboarding-mockups/quest/auth" as any)}
          >
            <Text style={s.loginText}>↩ I already have a save file</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SKY_BOT,
  },
  cloudA: {
    position: "absolute", top: 110, left: -40,
    width: 180, height: 60, borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  cloudB: {
    position: "absolute", top: 200, right: -50,
    width: 220, height: 70, borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  cloudC: {
    position: "absolute", top: 320, left: 40,
    width: 130, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  sun: {
    position: "absolute",
    top: 80, right: 30,
    width: 70, height: 70,
    borderRadius: 35,
    backgroundColor: SUN,
    borderWidth: 3,
    borderColor: TEXT_DARK,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  logoCard: {
    width: 120, height: 120,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: TEXT_DARK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: TEXT_DARK,
    shadowOpacity: 0.5,
    shadowRadius: 0,
    shadowOffset: { width: 6, height: 6 },
  },
  banner: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    paddingHorizontal: 22,
    paddingVertical: 22,
    alignItems: "center",
    shadowColor: TEXT_DARK,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 6 },
  },
  bannerEyebrow: {
    fontFamily: NationalPark.bold,
    fontSize: 12,
    color: "#FFFFFF",
    backgroundColor: "#E54B4B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: TEXT_DARK,
    overflow: "hidden",
    letterSpacing: 1,
    marginBottom: 12,
  },
  bannerTitle: {
    fontFamily: NationalPark.bold,
    fontSize: 32,
    color: TEXT_DARK,
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 10,
  },
  bannerSubtitle: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: TEXT_DARK,
    textAlign: "center",
    lineHeight: 20,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 14,
  },
  loginBtn: {
    paddingVertical: 6,
    alignItems: "center",
  },
  loginText: {
    fontFamily: NationalPark.bold,
    fontSize: 14,
    color: TEXT_DARK,
  },
});
