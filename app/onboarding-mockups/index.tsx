import LogoIcon from "@/assets/images/new-design/onboarding/logo.svg";
import { SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const VARIANTS = [
  {
    id: "neon",
    label: "Neon",
    blurb: "Modern / futuristic — terminal boot, glowing accents.",
    accent: "#72FF4E",
    bg: "#0A0A0F",
    fg: "#E6FFE0",
  },
  {
    id: "cupertino",
    label: "Cupertino",
    blurb: "Apple-designed — SF Pro, generous whitespace, system blue.",
    accent: "#007AFF",
    bg: "#FFFFFF",
    fg: "#000000",
  },
  {
    id: "quest",
    label: "Quest",
    blurb: "Gamified — chunky buttons, XP bar, choose your companion.",
    accent: "#FFB800",
    bg: "#A6E2FF",
    fg: "#102B5C",
  },
  {
    id: "refined",
    label: "Refined",
    blurb: "Production-leaning polish on the current flow — the realistic one.",
    accent: "#3D841E",
    bg: "#FFFFFF",
    fg: "#0E0E12",
  },
] as const;

const CHAT_VARIANTS = [
  {
    id: "chat-futurist",
    label: "Futurist",
    blurb: "Neon / cyberpunk — gradient bubbles, terminal log tools.",
    accent: "#5CF1FF",
    bg: "#0B0820",
    fg: "#E8E9F5",
  },
  {
    id: "chat-apple",
    label: "Apple",
    blurb: "iMessage feel — tail bubbles, soft cards, shimmer streaming.",
    accent: "#3D841E",
    bg: "#F2F2F7",
    fg: "#000000",
  },
  {
    id: "chat-arcade",
    label: "Arcade",
    blurb: "Game UI — chunky cards, XP pickups, permission quests.",
    accent: "#FFD23F",
    bg: "#FFF6DB",
    fg: "#1A1A1A",
  },
] as const;

export default function MockupsIndex() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <LogoIcon width={56} height={44} />
          <Text style={s.title}>Mockups</Text>
          <Text style={s.subtitle}>
            Click-through demos. Pick a flow to walk through.
          </Text>
        </View>

        <Text style={s.sectionLabel}>Onboarding flows</Text>
        <View style={s.list}>
          {VARIANTS.map((v) => (
            <TouchableOpacity
              key={v.id}
              activeOpacity={0.85}
              style={[s.card, { backgroundColor: v.bg }]}
              onPress={() =>
                router.push(`/onboarding-mockups/${v.id}/welcome` as any)
              }
            >
              <View style={[s.swatch, { backgroundColor: v.accent }]} />
              <View style={s.cardText}>
                <Text style={[s.cardTitle, { color: v.fg }]}>{v.label}</Text>
                <Text style={[s.cardBlurb, { color: v.fg, opacity: 0.7 }]}>
                  {v.blurb}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.sectionLabel, { marginTop: 28 }]}>Chat screens</Text>
        <View style={s.list}>
          {CHAT_VARIANTS.map((v) => (
            <TouchableOpacity
              key={v.id}
              activeOpacity={0.85}
              style={[s.card, { backgroundColor: v.bg }]}
              onPress={() =>
                router.push(`/new-navbar/chat-mocks/${v.id}` as any)
              }
            >
              <View style={[s.swatch, { backgroundColor: v.accent }]} />
              <View style={s.cardText}>
                <Text style={[s.cardTitle, { color: v.fg }]}>{v.label}</Text>
                <Text style={[s.cardBlurb, { color: v.fg, opacity: 0.7 }]}>
                  {v.blurb}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.footer}>Demo mode — no real auth, no real VM.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#808080",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 22,
    alignItems: "center",
  },
  title: {
    fontFamily: SFPro.displayBold,
    fontSize: 28,
    color: "#000",
    marginTop: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#606060",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  list: {
    gap: 14,
    marginTop: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E2E8",
    paddingVertical: 22,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: SFPro.bold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  cardBlurb: {
    fontFamily: SFPro.regular,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 18,
  },
  footer: {
    fontFamily: SFPro.regular,
    fontSize: 12,
    color: "#9F9F9F",
    textAlign: "center",
    marginTop: 32,
  },
});
