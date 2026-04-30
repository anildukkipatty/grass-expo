import GitIcon from "@/assets/images/new-design/onboarding/git.svg";
import NextIcon from "@/assets/images/new-design/onboarding/next.svg";
import TypescriptIcon from "@/assets/images/new-design/onboarding/typescript.svg";
import { NationalPark, SFPro } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ChunkyButton,
  questStyles,
  QuestExitButton,
} from "./welcome";

const { SKY_TOP, SKY_BOT, TEXT_DARK, GRASS, GRASS_DARK, SUN } = questStyles;

const QUESTS = [
  {
    id: "1",
    Icon: NextIcon,
    title: "DEPLOY THE OBELISK",
    body: "Set up Next.js + auth, ship to Vercel.",
    xp: "+250 XP",
    rarity: "RARE",
    rarityColor: "#5BA3FF",
  },
  {
    id: "2",
    Icon: TypescriptIcon,
    title: "FORGE THE TYPES",
    body: "Refactor the Express API to TypeScript.",
    xp: "+400 XP",
    rarity: "EPIC",
    rarityColor: "#B96CFF",
  },
  {
    id: "3",
    Icon: GitIcon,
    title: "CHRONICLE'S BLADE",
    body: "Build a CLI to generate changelogs from git.",
    xp: "+150 XP",
    rarity: "COMMON",
    rarityColor: "#9FB6CC",
  },
];

export default function QuestFirstTask() {
  const router = useRouter();
  const [task, setTask] = useState("");

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[SKY_TOP, SKY_BOT]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <QuestExitButton />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.body}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.banner}>
              <Text style={s.bannerEyebrow}>★ FIRST QUEST ★</Text>
              <Text style={s.title}>Pick your{"\n"}adventure.</Text>
              <Text style={s.subtitle}>
                Choose a starter quest, or write your own.
              </Text>
            </View>

            <View style={s.quests}>
              {QUESTS.map(({ id, Icon, title, body, xp, rarity, rarityColor }) => (
                <TouchableOpacity
                  key={id}
                  style={s.questCard}
                  onPress={() => setTask(body)}
                  activeOpacity={0.85}
                >
                  <View style={[s.rarityCorner, { backgroundColor: rarityColor }]}>
                    <Text style={s.rarityCornerText}>{rarity}</Text>
                  </View>
                  <View style={s.questIconWrap}>
                    <Icon width={28} height={28} />
                  </View>
                  <Text style={s.questTitle}>{title}</Text>
                  <Text style={s.questBody}>{body}</Text>
                  <View style={s.xpRow}>
                    <View style={s.xpPill}>
                      <Text style={s.xpText}>{xp}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={s.bottom}>
            <View style={s.scrollInputWrap}>
              <TextInput
                style={s.scrollInput}
                value={task}
                onChangeText={setTask}
                placeholder="Or write your own quest…"
                placeholderTextColor="rgba(16,43,92,0.4)"
                returnKeyType="send"
              />
            </View>
            <ChunkyButton
              label="ACCEPT QUEST"
              onPress={() => router.replace("/onboarding-mockups" as any)}
              color={SUN}
              shadow="#B27A00"
            />
            <TouchableOpacity
              onPress={() => router.replace("/onboarding-mockups" as any)}
            >
              <Text style={s.skip}>Skip — return to lobby</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: SKY_BOT },
  body: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  banner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    padding: 22,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: TEXT_DARK,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 6 },
  },
  bannerEyebrow: {
    fontFamily: NationalPark.bold,
    fontSize: 13,
    color: "#E54B4B",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontFamily: NationalPark.bold,
    fontSize: 28,
    color: TEXT_DARK,
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: TEXT_DARK,
    textAlign: "center",
    lineHeight: 20,
  },
  quests: {
    gap: 12,
  },
  questCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    padding: 16,
    overflow: "hidden",
    shadowColor: TEXT_DARK,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 5 },
  },
  rarityCorner: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: TEXT_DARK,
  },
  rarityCornerText: {
    fontFamily: NationalPark.bold,
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  questIconWrap: {
    width: 48, height: 48,
    borderRadius: 10,
    backgroundColor: "#E5F4FF",
    borderWidth: 2,
    borderColor: TEXT_DARK,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  questTitle: {
    fontFamily: NationalPark.bold,
    fontSize: 18,
    color: TEXT_DARK,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  questBody: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: TEXT_DARK,
    lineHeight: 18,
    marginBottom: 12,
  },
  xpRow: {
    flexDirection: "row",
  },
  xpPill: {
    backgroundColor: GRASS,
    borderWidth: 2,
    borderColor: GRASS_DARK,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  xpText: {
    fontFamily: NationalPark.bold,
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  scrollInputWrap: {
    backgroundColor: "#FFF6DC",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    paddingHorizontal: 14,
  },
  scrollInput: {
    height: 48,
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: TEXT_DARK,
  },
  skip: {
    fontFamily: NationalPark.bold,
    fontSize: 13,
    color: TEXT_DARK,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
