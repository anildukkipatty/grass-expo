import { getVmName } from "@/store/vm-metadata-store";
import { OnboardingAuthSheet } from "@/components/onboarding/OnboardingAuthSheet";
import { SFPro } from "@/constants/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OnboardingScreen() {
  const router = useRouter();
  const [loginVisible, setLoginVisible] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

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

  const handleVerified = async (type: "new" | "old") => {
    const existingName = await getVmName();
    if (type === "old" || existingName) {
      // Always run heartbeat/container check in vm-final before going to dashboard.
      // vm-final routes old users straight to /new-navbar/(tabs) after provisioning.
      router.replace({
        pathname: "/onboarding/vm-final" as any,
        params: { vmName: existingName ?? "" },
      });
    } else {
      router.replace("/onboarding/vm-ready" as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Spacer pushes content to the bottom */}
      <View style={styles.topSpacer} />

      {/* Content anchored at the bottom */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require("@/assets/images/new-design/onboarding/grass-logomark-realistic.png")}
            style={styles.logoImage}
            contentFit="contain"
          />
        </View>

        <Text style={styles.title}>Welcome to Grass</Text>
        <Text style={styles.subtitle}>
          A dedicated VM, always available. Your{"\n"}agent runs whether
          you&#39;re watching or not.
        </Text>

        {/* Get Started button */}
        <Pressable
          style={styles.pressable}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => router.push("/onboarding/claim" as any)}
        >
          <Animated.View style={[styles.buttonShadowWrap, { transform: [{ scale }] }]}>
            <LinearGradient
              colors={["#7ED957", "#1A4D09"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.buttonBorder}
            >
              <Animated.View style={[styles.button, { backgroundColor }]}>
                <Text style={styles.buttonText}>Get Started</Text>
              </Animated.View>
            </LinearGradient>
          </Animated.View>
        </Pressable>

        {/* Login line */}
        <TouchableOpacity
          style={styles.loginRow}
          onPress={() => setLoginVisible(true)}
        >
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginLink}>Log in</Text>
          </Text>
        </TouchableOpacity>

        {/* Terms & Privacy */}
        <Text style={styles.legal}>
          By tapping Get Started, you agree to our{"\n"}
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL("https://codeongrass.com/terms")}
          >
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL("http://codeongrass.com/privacy")}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </View>

      <OnboardingAuthSheet
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onVerified={handleVerified}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topSpacer: {
    flex: 1,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  title: {
    color: "#000000",
    fontFamily: SFPro.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -1,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  pressable: {
    marginTop: 24,
    marginBottom: 20,
    width: "100%",
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
    color: "#FFFFFF",
    letterSpacing: 0,
  },
  loginRow: {
    marginBottom: 40,
  },
  loginText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#888",
  },
  loginLink: {
    fontFamily: SFPro.regular,
    color: "#3D841E",
    textDecorationLine: "underline",
  },
  legal: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  legalLink: {
    fontFamily: SFPro.semiBold,
    color: "#666",
  },
});
