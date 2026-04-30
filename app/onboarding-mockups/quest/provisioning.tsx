import { NationalPark, SFPro } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ChunkyButton,
  questStyles,
  QuestExitButton,
  QuestProgress,
} from "./welcome";

const { SKY_TOP, SKY_BOT, TEXT_DARK, GRASS, GRASS_DARK, SUN } = questStyles;

const TIPS = [
  "💡 TIP: You can switch agents mid-quest.",
  "💡 TIP: Long-press a chat to share it.",
  "💡 TIP: Companions remember context between quests.",
  "💡 TIP: Diff view lets you review every change.",
];

const STAGES = [
  { label: "Summoning portal", emoji: "🌀" },
  { label: "Forging armor", emoji: "🛡️" },
  { label: "Stocking provisions", emoji: "🍞" },
  { label: "Companion is ready!", emoji: "✨" },
];

const STAGE_MS = 1300;

export default function QuestProvisioning() {
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const stageTimers = STAGES.map((_, i) =>
      setTimeout(() => setStage(i + 1), (i + 1) * STAGE_MS),
    );
    const tipTimer = setInterval(() => {
      setTipIdx((i) => (i + 1) % TIPS.length);
    }, 1700);

    Animated.timing(progress, {
      toValue: 1,
      duration: STAGES.length * STAGE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sparkle, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    return () => {
      stageTimers.forEach(clearTimeout);
      clearInterval(tipTimer);
    };
  }, []);

  const widthInterp = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const sparkleScale = sparkle.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  const done = stage >= STAGES.length;

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[SKY_TOP, SKY_BOT]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <QuestExitButton />
        <QuestProgress step={5} />

        <View style={s.body}>
          <Animated.View
            style={[
              s.crystalCard,
              { transform: [{ scale: sparkleScale }] },
            ]}
          >
            <Text style={s.crystalEmoji}>
              {done ? "✨" : STAGES[Math.min(stage, STAGES.length - 1)].emoji}
            </Text>
          </Animated.View>

          <Text style={s.title}>
            {done ? "Companion ready!" : "Brewing magic…"}
          </Text>

          <View style={s.barCard}>
            <Text style={s.barLabel}>
              {done ? "ALL DONE" : STAGES[Math.min(stage, STAGES.length - 1)].label.toUpperCase()}
            </Text>
            <View style={s.barTrack}>
              <Animated.View style={[s.barFill, { width: widthInterp }]} />
            </View>
            <View style={s.stagePips}>
              {STAGES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    s.pip,
                    i < stage && s.pipDone,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={s.tipCard}>
            <Text style={s.tipText}>{TIPS[tipIdx]}</Text>
          </View>
        </View>

        <View style={s.bottom}>
          <ChunkyButton
            label={done ? "BEGIN ADVENTURE" : "SKIP CINEMATIC"}
            onPress={() =>
              router.push("/onboarding-mockups/quest/first-task" as any)
            }
            color={done ? SUN : GRASS}
            shadow={done ? "#B27A00" : GRASS_DARK}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: SKY_BOT },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    paddingTop: 8,
  },
  crystalCard: {
    width: 120, height: 120,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: TEXT_DARK,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: TEXT_DARK,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 6 },
  },
  crystalEmoji: {
    fontSize: 56,
  },
  title: {
    fontFamily: NationalPark.bold,
    fontSize: 26,
    color: TEXT_DARK,
    textAlign: "center",
    marginBottom: 18,
  },
  barCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    padding: 18,
    marginBottom: 16,
    shadowColor: TEXT_DARK,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 6 },
  },
  barLabel: {
    fontFamily: NationalPark.bold,
    fontSize: 12,
    color: TEXT_DARK,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  barTrack: {
    height: 16,
    borderRadius: 999,
    backgroundColor: "#E5F4FF",
    borderWidth: 2,
    borderColor: TEXT_DARK,
    overflow: "hidden",
    marginBottom: 12,
  },
  barFill: {
    height: "100%",
    backgroundColor: SUN,
  },
  stagePips: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  pip: {
    width: 12, height: 12,
    borderRadius: 6,
    backgroundColor: "#E5F4FF",
    borderWidth: 2,
    borderColor: TEXT_DARK,
  },
  pipDone: {
    backgroundColor: GRASS,
  },
  tipCard: {
    width: "100%",
    backgroundColor: "#FFE7B0",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: TEXT_DARK,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  tipText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: TEXT_DARK,
    textAlign: "center",
    lineHeight: 18,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
});
