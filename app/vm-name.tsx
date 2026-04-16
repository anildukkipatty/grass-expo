import { SFPro } from "@/constants/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Approximate rendered size of the illustration with contentFit="contain"
// vm-name.png natural aspect ratio ≈ 0.528 (portrait)
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.65;
const IMAGE_ASPECT = 0.528;
const IMAGE_RENDER_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT;

// TextInput overlay — positioned over the input box shown in the illustration
// The input box sits at ~22% from top and spans the right 65% of the image
const INPUT_OVERLAY_TOP = IMAGE_HEIGHT * 0.295;
const INPUT_OVERLAY_LEFT = IMAGE_RENDER_WIDTH * 0.45;
const INPUT_OVERLAY_RIGHT = IMAGE_RENDER_WIDTH * 0.035;

export default function VmNameScreen() {
  const router = useRouter();
  const [vmName, setVmName] = useState("");
  const inputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          {/* ── Hint at the very top ── */}
          <SafeAreaView style={styles.hintArea}>
            <Text style={styles.hint}>You can always rename them later.</Text>
          </SafeAreaView>

          {/* ── Illustration – tapping outside the input dismisses keyboard ── */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={Keyboard.dismiss}
            style={styles.illustrationWrapper}
          >
            <Image
              source={require("@/assets/images/new-design/onboarding/vm-name.png")}
              style={styles.illustration}
              contentFit="contain"
              contentPosition={{ left: 0 }}
            />

            {/* Transparent TextInput overlaid on the input box in the illustration */}
            <View style={styles.overlayInputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.overlayInput}
                value={vmName}
                onChangeText={setVmName}
                placeholder=""
                placeholderTextColor="transparent"
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                caretHidden={false}
              />
            </View>
          </TouchableOpacity>

          {/* ── Gradient + bottom content (hidden when keyboard is up) ── */}
          {!keyboardVisible && (
            <LinearGradient
              colors={["rgba(247, 255, 243, 0.00)", "#F7FFF3"]}
              locations={[0, 0.45]}
              style={styles.gradientOverlay}
            >
              <SafeAreaView style={styles.safeContent}>
                <View style={styles.content}>
                  <Text style={styles.title}>What&#39;s their name?</Text>
                  <Text style={styles.subtitle}>
                    This is who you&#39;ll be messaging{"\n"}when you need
                    something done.
                  </Text>

                  <View style={styles.buttonShadowWrap}>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        !vmName.trim() && styles.buttonDisabled,
                      ]}
                      activeOpacity={0.85}
                      disabled={!vmName.trim()}
                      onPress={() =>
                        router.push({
                          pathname: "/vm-final" as any,
                          params: { vmName: vmName.trim() },
                        })
                      }
                    >
                      <Text style={styles.buttonText}>Hire</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </SafeAreaView>
            </LinearGradient>
          )}

          {/* ── Hire button floating above keyboard ── */}
          {keyboardVisible && (
            <View
              style={[
                styles.floatingButtonWrap,
                { bottom: keyboardHeight + 16 },
              ]}
            >
              <View style={styles.buttonShadowWrap}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    !vmName.trim() && styles.buttonDisabled,
                  ]}
                  activeOpacity={0.85}
                  disabled={!vmName.trim()}
                  onPress={() =>
                    router.push({
                      pathname: "/vm-final" as any,
                      params: { vmName: vmName.trim() },
                    })
                  }
                >
                  <Text style={styles.buttonText}>Hire</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FFF3",
  },

  // ── Hint ──────────────────────────────────────────
  hintArea: {
    alignItems: "center",
    paddingTop: 4,
  },
  hint: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#3B7A1E",
    letterSpacing: -0.1,
  },

  // ── Illustration ──────────────────────────────────
  illustrationWrapper: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  illustration: {
    position: "absolute",
    left: 0,
    bottom: -102,
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },

  // Clips text so it never escapes the input box drawn in the illustration
  overlayInputWrapper: {
    position: "absolute",
    top: INPUT_OVERLAY_TOP,
    left: INPUT_OVERLAY_LEFT,
    right: INPUT_OVERLAY_RIGHT,
    height: 44,
    overflow: "hidden",
  },
  overlayInput: {
    flex: 1,
    backgroundColor: "transparent",
    fontFamily: SFPro.semiBold,
    fontSize: 24,
    color: "#000",
    paddingHorizontal: 8,
  },

  // ── Gradient overlay ──────────────────────────────
  gradientOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    height: SCREEN_HEIGHT * 0.52,
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
    alignItems: "center",
  },

  // ── Text ──────────────────────────────────────────
  title: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    color: "#000000",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 17,
    color: "#404040",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
  },

  // ── Button ────────────────────────────────────────
  buttonShadowWrap: {
    width: "100%",
    borderRadius: 50,
    elevation: 12,
  },
  button: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#295E13",
    backgroundColor: "#123005",
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#DFDFDF",
    lineHeight: 22,
    letterSpacing: -0.5,
  },

  // ── Floating button (above keyboard) ──────────────
  floatingButtonWrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
});
