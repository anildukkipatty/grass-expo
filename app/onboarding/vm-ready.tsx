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
  const [loadingStep, setLoadingStep] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  };

  const handleLiveContinue = () => {
    // The container is provisioned/verified on vm-final, which then routes
    // into the dashboard.
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
        {phase === "naming" ? (
          <>
            {/* Server + naming card */}
            <View style={[styles.serverWrap, keyboardVisible && styles.serverWrapKb]}>
              <ServerTerminal style={styles.server} label={name} />
            </View>

            <View
              style={[
                styles.gradientOverlay,
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

                  {/* Hidden while typing so it doesn't ride up with the keyboard. */}
                  {!keyboardVisible && (
                    <GreenButton text="Activate now" onPress={handleActivate} disabled={!name.trim()} />
                  )}
                </View>
              </SafeAreaView>
            </View>
          </>
        ) : (
          /* ── Activating / Live ── */
          <Animated.View style={[StyleSheet.absoluteFill, styles.activateOverlay, { opacity: overlayOpacity }]}>
            <Confetti
              visible={phase === "live"}
              originX={SCREEN_WIDTH / 2}
              originY={SCREEN_HEIGHT * 0.44}
            />
            <SafeAreaView style={styles.activateSafe}>
              <View style={styles.activateContent}>
                <Text style={styles.liveTitle}>
                  {phase === "live" ? `${name} is live!` : "Activating your machine"}
                </Text>

                <View style={styles.activateServerWrap}>
                  <ServerTerminal style={styles.server} label={name} />
                </View>

                <View style={styles.activateBottom}>
                  {phase === "live" ? (
                    <GreenButton text="Continue" onPress={handleLiveContinue} />
                  ) : (
                    <Text style={styles.loadingText}>{LOADING_MSGS[loadingStep]}</Text>
                  )}
                </View>
              </View>
            </SafeAreaView>
          </Animated.View>
        )}
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
  serverWrapKb: {
    top: SCREEN_HEIGHT * 0.15,
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
  activateOverlay: {
    backgroundColor: "#fff",
  },
  activateSafe: {
    flex: 1,
  },
  activateContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  liveTitle: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    color: "#000000",
    textAlign: "center",
    lineHeight: 32,
    letterSpacing: -0.8,
    marginBottom: 28,
  },
  activateServerWrap: {
    width: "100%",
    alignItems: "center",
  },
  activateBottom: {
    marginTop: 32,
    width: "100%",
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
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
