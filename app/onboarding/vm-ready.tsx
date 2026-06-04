import BackButton from "@/assets/images/new-design/chat/back-button.svg";
import { Confetti } from "@/components/onboarding/Confetti";
import { ServerTerminal } from "@/components/onboarding/ServerTerminal";
import { SFPro } from "@/constants/theme";
import { setVmName as saveVmName } from "@/store/vm-metadata-store";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Server vertical movement (all transform-based so it can animate on the native driver).
const KB_SHIFT = -SCREEN_HEIGHT * 0.15; // up when the keyboard opens (naming)
const ACTIVATE_SHIFT = SCREEN_HEIGHT * 0.12; // down to centre when activating

type Phase = "naming" | "activating" | "live";

const LOADING_MSGS = [
  "Spinning up your machine…",
  "Allocating compute…",
  "Booting things up…",
  "Almost there…",
];

export default function VmReadyScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<Phase>("naming");
  const [mood, setMood] = useState<"idle" | "excited" | "waiting">("idle");
  const [loadingStep, setLoadingStep] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const activate = useRef(new Animated.Value(0)).current; // 0 = naming, 1 = activating/live
  const kbShift = useRef(new Animated.Value(0)).current;

  // Single server's vertical offset = keyboard shift + activation shift.
  const activateShift = activate.interpolate({ inputRange: [0, 1], outputRange: [0, ACTIVATE_SHIFT] });
  const serverTranslateY = Animated.add(kbShift, activateShift);
  const namingOpacity = activate.interpolate({ inputRange: [0, 0.55], outputRange: [1, 0], extrapolate: "clamp" });
  const activateOpacity = activate.interpolate({ inputRange: [0.45, 1], outputRange: [0, 1], extrapolate: "clamp" });

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
      Animated.timing(kbShift, { toValue: KB_SHIFT, duration: 260, useNativeDriver: true }).start();
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
      Animated.timing(kbShift, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [kbShift]);

  // Smiley gets excited on activate, then settles into "waiting" (looking down).
  useEffect(() => {
    if (phase === "activating" && mood === "excited") {
      const t = setTimeout(() => setMood("waiting"), 1100);
      return () => clearTimeout(t);
    }
  }, [phase, mood]);

  // Happy again once it's live.
  useEffect(() => {
    if (phase === "live") setMood("excited");
  }, [phase]);

  // Loading sequence while "activating", then flip to "live".
  useEffect(() => {
    if (phase !== "activating") return;
    setLoadingStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setLoadingStep(step % LOADING_MSGS.length);
    }, 850);
    const done = setTimeout(() => setPhase("live"), 3200);
    return () => {
      clearInterval(interval);
      clearTimeout(done);
    };
  }, [phase]);

  const handleActivate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    await saveVmName(trimmed);
    setPhase("activating");
    setMood("excited");
    Animated.timing(activate, {
      toValue: 1,
      duration: 600,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleBack = () => {
    Animated.timing(activate, {
      toValue: 0,
      duration: 420,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setPhase("naming");
      setMood("idle");
    });
  };

  const handleLiveContinue = () => {
    router.replace({ pathname: "/onboarding/vm-final" as any, params: { vmName: name.trim() } });
  };

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#3D841E", "#2A5C14"],
  });

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 0 }),
      Animated.spring(colorAnim, { toValue: 1, useNativeDriver: false, speed: 60, bounciness: 0 }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 5 }),
      Animated.spring(colorAnim, { toValue: 0, useNativeDriver: false, speed: 30, bounciness: 0 }),
    ]).start();
  };

  const GreenButton = ({ text, onPress, disabled }: { text: string; onPress: () => void; disabled?: boolean }) => (
    <Pressable
      style={[styles.pressable, disabled && styles.pressableDisabled]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      onPress={onPress}
    >
      <Animated.View style={[styles.buttonShadowWrap, { transform: [{ scale }] }]}>
        <LinearGradient
          colors={["#7ED957", "#1A4D09"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.buttonBorder}
        >
          <Animated.View style={[styles.button, { backgroundColor }]}>
            <Text style={styles.buttonText}>{text}</Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Confetti bursts from behind the (centred) server when live. */}
        <Confetti visible={phase === "live"} originX={SCREEN_WIDTH / 2} originY={SCREEN_HEIGHT * 0.49} />

        {/* Single server — animates from the naming spot to screen centre. */}
        <Animated.View style={[styles.serverWrap, { transform: [{ translateY: serverTranslateY }] }]}>
          <ServerTerminal style={styles.server} label={name} mood={mood} />
        </Animated.View>

        {/* Naming card — fades out as we activate. */}
        <Animated.View
          pointerEvents={phase === "naming" ? "auto" : "none"}
          style={[
            styles.gradientOverlay,
            { opacity: namingOpacity },
            keyboardVisible && { bottom: keyboardHeight },
          ]}
        >
          <SafeAreaView style={styles.safeContent}>
            <View style={styles.content}>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <View style={styles.dot} />
                  <Text style={styles.badgeText}>Your agents computer</Text>
                </View>
              </View>

              <Text style={styles.title}>Give your Virtual{"\n"}Machine a name.</Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Marvin"
                placeholderTextColor="#9AA7BD"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleActivate}
              />

              {!keyboardVisible && (
                <GreenButton text="Activate now" onPress={handleActivate} disabled={!name.trim()} />
              )}
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* Activation / live content — fades in around the centred server. */}
        <Animated.View
          pointerEvents={phase === "naming" ? "none" : "auto"}
          style={[StyleSheet.absoluteFill, { opacity: activateOpacity }]}
        >
          {phase === "live" && (
            <SafeAreaView style={styles.backSafe}>
              {/* TEMP back button */}
              <Pressable style={styles.backBtn} hitSlop={10} onPress={handleBack}>
                <BackButton />
              </Pressable>
            </SafeAreaView>
          )}

          <Text style={styles.liveTitle}>
            {phase === "live" ? `${name} is live!` : "Activating your machine"}
          </Text>

          {phase === "live" ? (
            // Same place as the "Activate now" button.
            <SafeAreaView style={styles.liveButtonSafe}>
              <View style={styles.liveButtonInner}>
                <GreenButton text="Continue" onPress={handleLiveContinue} />
              </View>
            </SafeAreaView>
          ) : (
            <View style={styles.activateBottom}>
              <Text style={styles.loadingText}>{LOADING_MSGS[loadingStep]}</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  serverWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: SCREEN_HEIGHT * 0.3,
    alignItems: "center",
  },
  server: {
    width: "85.5%",
  },
  gradientOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    height: SCREEN_HEIGHT * 0.5,
    justifyContent: "flex-end",
    borderRadius: 24,
    overflow: "hidden",
  },
  safeContent: {
    width: "100%",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: "flex-start",
  },
  badgeRow: {
    marginBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#295E13",
    backgroundColor: "#123005",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C3F6AD",
  },
  badgeText: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    lineHeight: 20,
    color: "#fff",
  },
  title: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    color: "#000000",
    textAlign: "left",
    lineHeight: 32,
    letterSpacing: -1,
    marginBottom: 16,
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D5DEEA",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#16243A",
  },

  // ── Activating / Live ──
  backSafe: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  backBtn: {
    marginTop: 8,
    marginLeft: 16,
  },
  liveTitle: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.32,
    left: 24,
    right: 24,
    fontFamily: SFPro.bold,
    fontSize: 28,
    color: "#000000",
    textAlign: "center",
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  activateBottom: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.61,
    left: 24,
    right: 24,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  // Mirrors the naming card's button position (card left/right 16 + content
  // paddingHorizontal 24 + paddingBottom 48 + safe-area inset).
  liveButtonSafe: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  liveButtonInner: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  loadingText: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#56657D",
    letterSpacing: -0.3,
  },

  // ── Button ──
  pressable: {
    marginTop: 24,
    width: "100%",
  },
  pressableDisabled: {
    opacity: 0.45,
  },
  buttonShadowWrap: {
    width: "100%",
  },
  buttonBorder: {
    width: "100%",
    borderRadius: 25,
    borderCurve: "continuous",
    padding: 2,
  },
  button: {
    height: 46,
    borderRadius: 23,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#fff",
    letterSpacing: 0,
  },
});
