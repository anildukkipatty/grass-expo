import GitIcon from "@/assets/images/new-design/onboarding/git.svg";
import NextIcon from "@/assets/images/new-design/onboarding/next.svg";
import SubmitIcon from "@/assets/images/new-design/onboarding/submit-icon.svg";
import TypescriptIcon from "@/assets/images/new-design/onboarding/typescript.svg";
import { SFPro } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ExitButton,
  GREEN,
  HAIRLINE,
  PrimaryButton,
  SURFACE,
  TEXT,
  TEXT_DIM,
} from "./_shared";

const SUGGESTIONS = [
  {
    id: "1",
    Icon: NextIcon,
    label: "Web app",
    text: "Set up a Next.js app with auth and deploy to Vercel.",
  },
  {
    id: "2",
    Icon: TypescriptIcon,
    label: "Refactor",
    text: "Refactor my Express API to use TypeScript end-to-end.",
  },
  {
    id: "3",
    Icon: GitIcon,
    label: "CLI tool",
    text: "Build a CLI that generates changelogs from git history.",
  },
];

export default function RefinedFirstTask() {
  const router = useRouter();
  const { vmName } = useLocalSearchParams<{ vmName: string }>();
  const name = vmName || "Your computer";
  const [task, setTask] = useState("");
  const trimmed = task.trim();

  const handleSend = () => {
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Keyboard.dismiss();
    router.replace("/onboarding-mockups" as any);
  };

  const handleLater = () => {
    Haptics.selectionAsync().catch(() => {});
    Keyboard.dismiss();
    router.replace("/onboarding-mockups" as any);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ExitButton />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.statusBadge}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>{name} is ready</Text>
          </View>

          <Text style={s.title}>What should{"\n"}it work on first?</Text>
          <Text style={s.subtitle}>
            Pick something real. We'll handle it while you get on with
            your day.
          </Text>

          <Text style={s.sectionLabel}>Try one of these</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.suggestionsRow}
          >
            {SUGGESTIONS.map(({ id, Icon, label, text }) => (
              <TouchableOpacity
                key={id}
                activeOpacity={0.85}
                onPress={() => setTask(text)}
                style={[
                  s.suggestion,
                  task === text && s.suggestionActive,
                ]}
              >
                <View style={s.suggestionIcon}>
                  <Icon width={20} height={20} />
                </View>
                <Text style={s.suggestionLabel}>{label}</Text>
                <Text style={s.suggestionBody} numberOfLines={3}>
                  {text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[s.sectionLabel, { marginTop: 28 }]}>Or write your own</Text>
          <View style={s.composer}>
            <TextInput
              style={s.composerInput}
              value={task}
              onChangeText={setTask}
              placeholder="Describe what you want done…"
              placeholderTextColor="#C6C6C8"
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={s.bottom}>
          <View style={s.ctaRow}>
            <Pressable style={s.laterBtn} onPress={handleLater}>
              <Text style={s.laterText}>Later</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Send task"
                onPress={handleSend}
                disabled={trimmed.length === 0}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "#EAF5E2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  statusText: {
    fontFamily: SFPro.semiBold,
    fontSize: 12,
    color: GREEN,
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
  sectionLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: TEXT_DIM,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  suggestionsRow: {
    paddingRight: 24,
    gap: 10,
  },
  suggestion: {
    width: 220,
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  suggestionActive: {
    borderColor: GREEN,
    backgroundColor: "#F4FBEE",
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  suggestionLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 11,
    color: GREEN,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  suggestionBody: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: TEXT,
    lineHeight: 19,
  },
  composer: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
  },
  composerInput: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: TEXT,
    minHeight: 76,
    lineHeight: 21,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  laterBtn: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  laterText: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: TEXT,
  },
});
