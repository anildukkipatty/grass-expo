import AiAgentIcon from "@/assets/images/new-design/onboarding/ai-agent.svg";
import GiftIcon from "@/assets/images/new-design/onboarding/gift.svg";
import LaptopIcon from "@/assets/images/new-design/onboarding/laptop-window.svg";
import MobileIcon from "@/assets/images/new-design/onboarding/mobile-icon.svg";
import SecretIcon from "@/assets/images/new-design/onboarding/secret.svg";
import VmIcon from "@/assets/images/new-design/onboarding/vm-icon.svg";
import { SFPro } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ExitButton } from "./welcome";

const BLUE = "#007AFF";

const FEATURES = [
  { Icon: VmIcon, title: "Dedicated cloud VM", body: "Always available, even when you aren't." },
  { Icon: LaptopIcon, title: "Headless agents", body: "Run jobs without your laptop open." },
  { Icon: MobileIcon, title: "Phone-first control", body: "Approve, review, and steer from anywhere." },
  { Icon: AiAgentIcon, title: "Bring your own model", body: "Claude, GPT, OpenCode — your call." },
  { Icon: SecretIcon, title: "Your code, end-to-end", body: "We never read or train on what's yours." },
];

export default function CupertinoClaim() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe}>
      <ExitButton />

      <ScrollView contentContainerStyle={s.body}>
        <LinearGradient
          colors={["#E5F1FF", "#FFFFFF"]}
          style={s.heroCard}
        >
          <View style={s.heroIcon}>
            <GiftIcon width={28} height={28} />
          </View>
          <Text style={s.heroEyebrow}>Free monthly credit</Text>
          <Text style={s.heroTitle}>10 hours of compute,{"\n"}on the house.</Text>
          <Text style={s.heroBody}>
            Refreshes every month. No card required. Cancel any time, but
            there's nothing to cancel.
          </Text>
        </LinearGradient>

        <Text style={s.sectionLabel}>WHAT'S INCLUDED</Text>
        <View style={s.list}>
          {FEATURES.map(({ Icon, title, body }, i) => (
            <View
              key={i}
              style={[
                s.row,
                i !== FEATURES.length - 1 && s.rowDivider,
              ]}
            >
              <View style={s.rowIconWrap}>
                <Icon width={20} height={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{title}</Text>
                <Text style={s.rowBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={s.legal}>
          By continuing you agree to our{" "}
          <Text style={s.legalLink}>Terms</Text> and{" "}
          <Text style={s.legalLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>

      <View style={s.bottom}>
        <Pressable
          style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
          onPress={() => router.push("/onboarding-mockups/cupertino/auth" as any)}
        >
          <Text style={s.buttonText}>Claim & Set Up</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  body: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  heroCard: {
    borderRadius: 22,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  heroEyebrow: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: BLUE,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: SFPro.displayBold,
    fontSize: 28,
    color: "#000",
    letterSpacing: -0.8,
    lineHeight: 32,
    marginBottom: 8,
  },
  heroBody: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#3C3C43",
    lineHeight: 21,
  },
  sectionLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#6E6E73",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  list: {
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C6C6C8",
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#000",
  },
  rowBody: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#3C3C43",
    marginTop: 1,
  },
  legal: {
    fontFamily: SFPro.regular,
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  legalLink: {
    color: BLUE,
  },
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    backgroundColor: "#FFFFFF",
  },
  button: {
    height: 50,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
});
