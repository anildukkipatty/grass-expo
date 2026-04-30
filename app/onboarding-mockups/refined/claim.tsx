import AiAgentIcon from "@/assets/images/new-design/onboarding/ai-agent.svg";
import LaptopIcon from "@/assets/images/new-design/onboarding/laptop-window.svg";
import MobileIcon from "@/assets/images/new-design/onboarding/mobile-icon.svg";
import SecretIcon from "@/assets/images/new-design/onboarding/secret.svg";
import VmIcon from "@/assets/images/new-design/onboarding/vm-icon.svg";
import { SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  AuthSheet,
  AuthSheetHandle,
  ExitButton,
  GREEN,
  HAIRLINE,
  PrimaryButton,
  TEXT,
  TEXT_DIM,
} from "./_shared";

const FEATURES = [
  { Icon: VmIcon, title: "Dedicated VM", body: "Always-on, never shared." },
  { Icon: LaptopIcon, title: "Headless agents", body: "Runs without your laptop." },
  { Icon: MobileIcon, title: "Mobile control", body: "Approve and steer from anywhere." },
  { Icon: AiAgentIcon, title: "Bring your model", body: "Claude, GPT, OpenCode." },
  { Icon: SecretIcon, title: "End-to-end private", body: "Your code stays yours." },
];

export default function RefinedClaim() {
  const router = useRouter();
  const authRef = useRef<AuthSheetHandle>(null);

  return (
    <SafeAreaView style={s.safe}>
      <ExitButton />

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.heroBadge}>
          <Text style={s.heroBadgeText}>FREE PLAN</Text>
        </View>
        <Text style={s.title}>10 hours of compute,{"\n"}every month.</Text>
        <Text style={s.subtitle}>
          No credit card required. Refreshes monthly. Upgrade anytime
          if you need more.
        </Text>

        <View style={s.list}>
          {FEATURES.map(({ Icon, title, body }, i) => (
            <View
              key={i}
              style={[s.row, i !== FEATURES.length - 1 && s.rowDivider]}
            >
              <View style={s.rowIcon}>
                <Icon width={20} height={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{title}</Text>
                <Text style={s.rowBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={s.bottom}>
        <PrimaryButton
          label="Continue"
          onPress={() => authRef.current?.open()}
        />
      </View>

      <AuthSheet
        ref={authRef}
        onSuccess={() =>
          router.replace("/onboarding-mockups/refined/vm-ready" as any)
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 16,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF5E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 14,
  },
  heroBadgeText: {
    fontFamily: SFPro.semiBold,
    fontSize: 11,
    color: GREEN,
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: SFPro.displayBold,
    fontSize: 32,
    color: TEXT,
    letterSpacing: -1,
    lineHeight: 36,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: TEXT_DIM,
    lineHeight: 22,
    marginBottom: 28,
  },
  list: {
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HAIRLINE,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: TEXT,
  },
  rowBody: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: TEXT_DIM,
    marginTop: 1,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
});
