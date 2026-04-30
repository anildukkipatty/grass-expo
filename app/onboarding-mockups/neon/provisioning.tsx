import { SFMono, SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ExitButton, Grid } from "./welcome";

const NEON = "#72FF4E";
const CYAN = "#4EFFE6";
const BG = "#05050A";

const LOG_LINES = [
  { delay: 200, prefix: "[OK]", text: "kernel.boot",            level: "ok" },
  { delay: 500, prefix: "[OK]", text: "tls.handshake          → 256-bit", level: "ok" },
  { delay: 800, prefix: "[OK]", text: "ipv6.assign            → fd72::4e", level: "ok" },
  { delay: 1100, prefix: "[..]", text: "container.pull         opencode:latest", level: "wait" },
  { delay: 2200, prefix: "[OK]", text: "container.pull         342 MB / 342 MB", level: "ok" },
  { delay: 2600, prefix: "[OK]", text: "container.start        pid=4719", level: "ok" },
  { delay: 3000, prefix: "[..]", text: "git.clone              demo-repo", level: "wait" },
  { delay: 4000, prefix: "[OK]", text: "git.clone              327 objects", level: "ok" },
  { delay: 4400, prefix: "[OK]", text: "agent.opencode         online", level: "ok" },
  { delay: 4800, prefix: "[OK]", text: "session.bind           sse://node-7", level: "ok" },
  { delay: 5200, prefix: "[##]", text: "READY", level: "done" },
] as const;

const TOTAL_MS = 5400;

export default function NeonProvisioning() {
  const router = useRouter();
  const [visible, setVisible] = useState(0);
  const [done, setDone] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LOG_LINES.forEach((line, idx) => {
      timers.push(
        setTimeout(() => {
          setVisible(idx + 1);
          if (idx === LOG_LINES.length - 1) setDone(true);
        }, line.delay),
      );
    });
    Animated.timing(progress, {
      toValue: 1,
      duration: TOTAL_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    return () => timers.forEach(clearTimeout);
  }, []);

  const widthInterp = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={s.safe}>
      <Grid />
      <ExitButton />

      <View style={s.body}>
        <Text style={s.crumb}>{"// 06 / PROVISION"}</Text>
        <Text style={s.title}>Booting node.</Text>

        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: widthInterp }]} />
        </View>
        <Text style={s.progressLabel}>
          {done ? "PROVISION COMPLETE" : `PROVISIONING…`}
        </Text>

        <ScrollView style={s.terminal} contentContainerStyle={{ padding: 14 }}>
          {LOG_LINES.slice(0, visible).map((line, i) => (
            <Text key={i} style={s.logLine}>
              <Text
                style={
                  line.level === "ok"
                    ? s.lvlOk
                    : line.level === "done"
                      ? s.lvlDone
                      : s.lvlWait
                }
              >
                {line.prefix}{" "}
              </Text>
              <Text style={s.logText}>{line.text}</Text>
            </Text>
          ))}
          {!done && <Text style={s.logCursor}>▌</Text>}
        </ScrollView>
      </View>

      <View style={s.bottom}>
        <Pressable
          style={[s.button, !done && s.buttonInactive]}
          onPress={() =>
            router.push("/onboarding-mockups/neon/first-task" as any)
          }
        >
          <Text style={s.buttonText}>
            {done ? "ENGAGE  ▸" : "STAND BY…"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  body: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 60,
  },
  crumb: {
    fontFamily: SFMono.regular,
    fontSize: 11,
    color: CYAN,
    letterSpacing: 2,
    marginBottom: 14,
  },
  title: {
    fontFamily: SFPro.displayBold,
    fontSize: 36,
    color: "#FFFFFF",
    lineHeight: 40,
    letterSpacing: -1,
    marginBottom: 22,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#0A1A0A",
    borderWidth: 1,
    borderColor: "#1F3A1F",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: NEON,
    shadowColor: NEON,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  progressLabel: {
    fontFamily: SFMono.medium,
    fontSize: 10,
    color: NEON,
    letterSpacing: 2,
    marginBottom: 16,
  },
  terminal: {
    flex: 1,
    borderWidth: 1,
    borderColor: NEON,
    backgroundColor: "#020602",
    shadowColor: NEON,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  logLine: {
    fontFamily: SFMono.regular,
    fontSize: 12,
    lineHeight: 20,
  },
  lvlOk: { color: NEON },
  lvlWait: { color: "#FFD86E" },
  lvlDone: { color: CYAN, fontFamily: SFMono.bold, letterSpacing: 2 },
  logText: { color: "#9FE69A" },
  logCursor: {
    fontFamily: SFMono.regular,
    fontSize: 14,
    color: NEON,
    marginTop: 4,
  },
  bottom: {
    paddingHorizontal: 22,
    paddingTop: 14,
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
  buttonInactive: {
    borderColor: "#2C5C2C",
    backgroundColor: "#0A1A0A",
    shadowOpacity: 0.2,
  },
  buttonText: {
    fontFamily: SFMono.bold,
    fontSize: 14,
    color: NEON,
    letterSpacing: 3,
  },
});
