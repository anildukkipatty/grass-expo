import { SFPro } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ExitButton,
  GREEN,
  HAIRLINE,
  PrimaryButton,
  TEXT,
  TEXT_DIM,
} from "./_shared";

const STEPS = [
  { label: "Allocating compute", at: 0 },
  { label: "Configuring environment", at: 1200 },
  { label: "Installing agents", at: 2400 },
  { label: "Setting up workspace", at: 3600 },
];

const TOTAL_MS = 4800;

export default function RefinedProvisioning() {
  const router = useRouter();
  const { vmName } = useLocalSearchParams<{ vmName: string }>();
  const name = vmName || "Your computer";

  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: TOTAL_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const stepTimers = STEPS.map((step, i) =>
      setTimeout(() => setStage(i + 1), step.at + 200),
    );
    const doneTimer = setTimeout(() => {
      setDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, TOTAL_MS);

    return () => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, []);

  const widthInterp = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const currentLabel = done
    ? `${name} is ready`
    : STEPS[Math.min(stage, STEPS.length - 1)]?.label ?? STEPS[0].label;

  return (
    <SafeAreaView style={s.safe}>
      <ExitButton />

      <View style={s.body}>
        <Text style={s.eyebrow}>SETTING UP</Text>
        <Text style={s.title}>{name}</Text>
        <Text style={s.subtitle}>
          {done
            ? "All set. Let's give it something to work on."
            : "This usually takes a few seconds. You can leave this screen — we'll keep going."}
        </Text>

        <View style={s.progressBlock}>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width: widthInterp }]} />
          </View>
          <View style={s.progressMeta}>
            <Text style={s.progressLabel}>{currentLabel}</Text>
            {done ? (
              <Text style={s.progressDone}>Done</Text>
            ) : (
              <Text style={s.progressCount}>
                Step {Math.min(stage + 1, STEPS.length)} of {STEPS.length}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={s.bottom}>
        <PrimaryButton
          label="Continue"
          disabled={!done}
          onPress={() =>
            router.replace({
              pathname: "/onboarding-mockups/refined/first-task" as any,
              params: { vmName: name },
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  eyebrow: {
    fontFamily: SFPro.semiBold,
    fontSize: 12,
    color: TEXT_DIM,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  title: {
    fontFamily: SFPro.displayBold,
    fontSize: 36,
    color: TEXT,
    letterSpacing: -1.2,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: TEXT_DIM,
    lineHeight: 22,
    marginBottom: 36,
  },
  progressBlock: {
    marginTop: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E5EA",
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: GREEN,
    borderRadius: 2,
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: TEXT,
    flex: 1,
  },
  progressCount: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: TEXT_DIM,
  },
  progressDone: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: GREEN,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
});
