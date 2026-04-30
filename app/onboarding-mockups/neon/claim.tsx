import AiAgentIcon from "@/assets/images/new-design/onboarding/ai-agent.svg";
import LaptopIcon from "@/assets/images/new-design/onboarding/laptop-window.svg";
import MobileIcon from "@/assets/images/new-design/onboarding/mobile-icon.svg";
import SecretIcon from "@/assets/images/new-design/onboarding/secret.svg";
import VmIcon from "@/assets/images/new-design/onboarding/vm-icon.svg";
import { SFMono, SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ExitButton, Grid } from "./welcome";

const NEON = "#72FF4E";
const CYAN = "#4EFFE6";
const BG = "#05050A";

const FEATURES = [
  { Icon: VmIcon, label: "DEDICATED VM", value: "always-on" },
  { Icon: LaptopIcon, label: "RUNS HEADLESS", value: "no laptop required" },
  { Icon: MobileIcon, label: "MOBILE CONTROL", value: "full remote" },
  { Icon: AiAgentIcon, label: "MULTI-AGENT", value: "Claude / GPT / Code" },
  { Icon: SecretIcon, label: "ENCRYPTED", value: "your code stays yours" },
];

export default function NeonClaim() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe}>
      <Grid />
      <ExitButton />

      <View style={s.body}>
        <Text style={s.crumb}>{"// 02 / CLAIM"}</Text>
        <Text style={s.title}>10 hours.{"\n"}Free, monthly.</Text>
        <Text style={s.subtitle}>
          {">"} no card. no catch. no expiry on the offer.
        </Text>

        <View style={s.terminalCard}>
          <View style={s.terminalHeader}>
            <View style={[s.dot, { backgroundColor: "#FF5F57" }]} />
            <View style={[s.dot, { backgroundColor: "#FFBD2E" }]} />
            <View style={[s.dot, { backgroundColor: "#28C840" }]} />
            <Text style={s.terminalPath}>~/grass/quota.json</Text>
          </View>
          <View style={s.terminalBody}>
            <Text style={s.codeLine}>
              <Text style={s.codeKey}>"plan"</Text>
              <Text style={s.codeText}>: </Text>
              <Text style={s.codeStr}>"free"</Text>
              <Text style={s.codeText}>,</Text>
            </Text>
            <Text style={s.codeLine}>
              <Text style={s.codeKey}>"compute_hours"</Text>
              <Text style={s.codeText}>: </Text>
              <Text style={s.codeNum}>10</Text>
              <Text style={s.codeText}>,</Text>
            </Text>
            <Text style={s.codeLine}>
              <Text style={s.codeKey}>"reset"</Text>
              <Text style={s.codeText}>: </Text>
              <Text style={s.codeStr}>"monthly"</Text>
              <Text style={s.codeText}>,</Text>
            </Text>
            <Text style={s.codeLine}>
              <Text style={s.codeKey}>"requires_card"</Text>
              <Text style={s.codeText}>: </Text>
              <Text style={s.codeBool}>false</Text>
            </Text>
          </View>
        </View>

        <View style={s.featureList}>
          {FEATURES.map(({ Icon, label, value }, i) => (
            <View key={i} style={s.featureRow}>
              <View style={s.featureIcon}>
                <Icon width={16} height={16} />
              </View>
              <Text style={s.featureLabel}>{label}</Text>
              <View style={s.featureSpacer} />
              <Text style={s.featureValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.bottom}>
        <Pressable
          style={s.button}
          onPress={() => router.push("/onboarding-mockups/neon/auth" as any)}
        >
          <Text style={s.buttonText}>{"CLAIM ALLOCATION  ▸"}</Text>
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
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: SFMono.regular,
    fontSize: 13,
    color: "#9FE69A",
    marginBottom: 22,
    letterSpacing: 0.4,
  },
  terminalCard: {
    borderWidth: 1,
    borderColor: NEON,
    backgroundColor: "#0A1A0A",
    marginBottom: 22,
    shadowColor: NEON,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  terminalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1F3A1F",
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  terminalPath: {
    fontFamily: SFMono.regular,
    fontSize: 11,
    color: "#5C7C5C",
    marginLeft: 8,
  },
  terminalBody: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 4,
  },
  codeLine: {
    fontFamily: SFMono.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  codeKey: { color: CYAN },
  codeText: { color: "#9FE69A" },
  codeStr: { color: "#FFD86E" },
  codeNum: { color: NEON },
  codeBool: { color: "#FF6E6E" },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1F3A1F",
    paddingBottom: 8,
  },
  featureIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    fontFamily: SFMono.medium,
    fontSize: 11,
    color: NEON,
    letterSpacing: 1.5,
  },
  featureSpacer: { flex: 1 },
  featureValue: {
    fontFamily: SFMono.regular,
    fontSize: 11,
    color: "#9FE69A",
  },
  bottom: {
    paddingHorizontal: 22,
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
  buttonText: {
    fontFamily: SFMono.bold,
    fontSize: 14,
    color: NEON,
    letterSpacing: 3,
  },
});
