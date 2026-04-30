import { SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ExitButton } from "./welcome";

const BLUE = "#007AFF";

const STEPS = [
  "Allocating compute",
  "Configuring environment",
  "Installing agents",
  "Almost there",
];

const TOTAL_MS = 5000;
const STEP_MS = TOTAL_MS / STEPS.length;

export default function CupertinoProvisioning() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const ringSpin = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(ringSpin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: TOTAL_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const timers = STEPS.map((_, i) =>
      setTimeout(() => {
        setCurrentStep(i + 1);
        if (i === STEPS.length - 1) setDone(true);
      }, (i + 1) * STEP_MS),
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const spin = ringSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView style={s.safe}>
      <ExitButton />

      <View style={s.body}>
        <View style={s.ringWrap}>
          {!done ? (
            <Animated.View
              style={[s.ring, { transform: [{ rotate: spin }] }]}
            />
          ) : (
            <View style={s.checkRing}>
              <Text style={s.check}>✓</Text>
            </View>
          )}
        </View>

        <Text style={s.title}>
          {done ? "All set." : "Setting up…"}
        </Text>
        <Text style={s.subtitle}>
          {done
            ? "Your computer is ready to use."
            : "This usually takes a few seconds."}
        </Text>

        <View style={s.stepsCard}>
          {STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep && !done;
            return (
              <View
                key={i}
                style={[
                  s.stepRow,
                  i !== 0 && s.stepDivider,
                ]}
              >
                <View
                  style={[
                    s.stepBullet,
                    isDone && s.stepBulletDone,
                    isActive && s.stepBulletActive,
                  ]}
                >
                  {isDone ? (
                    <Text style={s.stepBulletCheck}>✓</Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    s.stepText,
                    isActive && s.stepTextActive,
                    isDone && s.stepTextDone,
                  ]}
                >
                  {step}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={s.bottom}>
        <Pressable
          style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
          onPress={() =>
            router.push("/onboarding-mockups/cupertino/first-task" as any)
          }
        >
          <Text style={s.buttonText}>{done ? "Continue" : "Skip ahead"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: "center",
  },
  ringWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#E5F1FF",
    borderTopColor: BLUE,
  },
  checkRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    color: "#FFFFFF",
    fontFamily: SFPro.bold,
    fontSize: 36,
  },
  title: {
    fontFamily: SFPro.displayBold,
    fontSize: 28,
    color: "#000",
    letterSpacing: -0.8,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#3C3C43",
    lineHeight: 21,
    marginBottom: 36,
    textAlign: "center",
  },
  stepsCard: {
    width: "100%",
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  stepDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#C6C6C8",
  },
  stepBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#C6C6C8",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBulletDone: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  stepBulletActive: {
    borderColor: BLUE,
    backgroundColor: "#E5F1FF",
  },
  stepBulletCheck: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: SFPro.bold,
  },
  stepText: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "#8E8E93",
  },
  stepTextActive: {
    color: "#000",
    fontFamily: SFPro.semiBold,
  },
  stepTextDone: {
    color: "#000",
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  button: {
    height: 50,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
});
