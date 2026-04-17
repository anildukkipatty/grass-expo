import LogoIcon from "@/assets/images/new-design/onboarding/logo.svg";
import { OnboardingAuthSheet } from "@/components/OnboardingAuthSheet";
import { SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OnboardingScreen() {
  const router = useRouter();
  const [loginVisible, setLoginVisible] = useState(false);

  const handleVerified = (_type: "new" | "old") => {
    router.replace("/vm-ready" as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Spacer pushes content to the bottom */}
      <View style={styles.topSpacer} />

      {/* Content anchored at the bottom */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <LogoIcon width={56} height={44} />
        </View>

        <Text style={styles.title}>Welcome to Grass</Text>
        <Text style={styles.subtitle}>
          A dedicated VM, always available. Your{"\n"}agent runs whether
          you&#39;re watching or not.
        </Text>

        {/* Get Started button */}
        <View style={styles.buttonShadowWrap}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={() => router.push("/onboarding-claim" as any)}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        {/* Login line */}
        <TouchableOpacity
          style={styles.loginRow}
          onPress={() => setLoginVisible(true)}
        >
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginLink}>Log In</Text>
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
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  title: {
    color: "#000000",
    fontFamily: SFPro.displayBold,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 17,
    color: "#606060",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 40,
  },
  buttonShadowWrap: {
    borderRadius: 50,
    shadowColor: "rgba(84, 147, 50, 0.70)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 12,
    marginBottom: 20,
    width: "100%",
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
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  loginRow: {
    marginBottom: 28,
  },
  loginText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000000",
  },
  loginLink: {
    fontFamily: SFPro.bold,
    color: "#000000",
  },
  legal: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#606060",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  legalLink: {
    fontFamily: SFPro.semiBold,
    color: "#000000",
  },
});
