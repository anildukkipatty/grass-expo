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

          {/* ── Illustration – image is the direct parent of the input overlay ── */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={Keyboard.dismiss}
            style={styles.imageContainer}
          >
            <Image
              source={require("@/assets/images/new-design/onboarding/vm-name.png")}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
            />

            {/* Input centered on the image; % positions are image-relative */}
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
              colors={["#ffffff30", "#ffffff30"]}
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
                          pathname: "/onboarding/vm-final" as any,
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
                      pathname: "/onboarding/vm-final" as any,
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
    backgroundColor: "#FFF",
  },

  // ── Hint ──────────────────────────────────────────
  hintArea: {
    alignItems: "center",
    marginTop: 150,
  },
  hint: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#9F9F9F",
    lineHeight: 18,
    letterSpacing: -0.3,
  },

  // ── Illustration ──────────────────────────────────
  // Container matches the image's natural aspect ratio (1080×1153).
  // contentFit="fill" on the Image fills it exactly — no letterboxing —
  // so absolute % positions on children are truly image-relative.
  imageContainer: {
    width: "100%",
    height: "100%",

    top: "-35%",
  },

  overlayInputWrapper: {
    position: "absolute",
    top: "55%",
    left: "25%",
    right: "25%",
    height: 68,
    width: 182,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.20)",
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    justifyContent: "center",
  },
  overlayInput: {
    flex: 1,
    backgroundColor: "transparent",
    fontFamily: SFPro.semiBold,
    fontSize: 20,
    color: "#000",
    lineHeight: 25,
    paddingHorizontal: 12,
    letterSpacing: -0.5,
    textAlign: "center",
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
    paddingHorizontal: 16,
    // paddingBottom: 48,
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
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
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
    color: "#f2f2f2",
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
