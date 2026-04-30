import LogoIcon from "@/assets/images/new-design/onboarding/logo.svg";
import { SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BLUE = "#007AFF";
const SECONDARY = "#3C3C434D";

export function ExitButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={s.exitBtn}
      onPress={() => router.replace("/onboarding-mockups" as any)}
    >
      <Text style={s.exitText}>×</Text>
    </TouchableOpacity>
  );
}

export default function CupertinoWelcome() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe}>
      <ExitButton />

      <View style={s.center}>
        <View style={s.logoTile}>
          <LogoIcon width={56} height={44} />
        </View>

        <Text style={s.title}>Welcome to{"\n"}Grass.</Text>
        <Text style={s.subtitle}>
          A dedicated cloud computer that never sleeps. Run agents from
          anywhere — even with your phone in your pocket.
        </Text>

        <View style={s.featureList}>
          <Feature
            number="1"
            title="Always on"
            body="Your VM keeps running while you don't."
          />
          <Feature
            number="2"
            title="Multi-agent"
            body="Claude, GPT, and OpenCode in one place."
          />
          <Feature
            number="3"
            title="On any device"
            body="Native apps for iPhone, iPad, and Mac."
          />
        </View>
      </View>

      <View style={s.bottom}>
        <Pressable
          style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
          onPress={() => router.push("/onboarding-mockups/cupertino/claim" as any)}
        >
          <Text style={s.buttonText}>Continue</Text>
        </Pressable>
        <TouchableOpacity
          onPress={() => router.push("/onboarding-mockups/cupertino/auth" as any)}
        >
          <Text style={s.linkText}>Already have an account?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Feature({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <View style={s.featureRow}>
      <View style={s.featureNumberWrap}>
        <Text style={s.featureNumber}>{number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.featureTitle}>{title}</Text>
        <Text style={s.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  exitBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E5E5EA",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  exitText: {
    color: "#8E8E93",
    fontFamily: SFPro.semiBold,
    fontSize: 18,
    lineHeight: 22,
  },
  center: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  logoTile: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 36,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    fontFamily: SFPro.displayBold,
    fontSize: 40,
    color: "#000000",
    textAlign: "center",
    letterSpacing: -1.2,
    lineHeight: 44,
    marginBottom: 14,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 17,
    color: "#3C3C43",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 44,
    paddingHorizontal: 12,
  },
  featureList: {
    gap: 22,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  featureNumberWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5F1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  featureNumber: {
    fontFamily: SFPro.bold,
    fontSize: 15,
    color: BLUE,
  },
  featureTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    marginBottom: 2,
  },
  featureBody: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#3C3C43",
    lineHeight: 20,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: "center",
    gap: 16,
  },
  button: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  linkText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: BLUE,
  },
});
