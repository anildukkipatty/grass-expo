import GitIcon from "@/assets/images/new-design/onboarding/git.svg";
import NextIcon from "@/assets/images/new-design/onboarding/next.svg";
import RightArrowIcon from "@/assets/images/new-design/onboarding/right-arrow-head.svg";
import SubmitIcon from "@/assets/images/new-design/onboarding/submit-icon.svg";
import TypescriptIcon from "@/assets/images/new-design/onboarding/typescript.svg";
import { SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { ExitButton } from "./welcome";

const BLUE = "#007AFF";

const SUGGESTIONS = [
  {
    id: "1",
    Icon: NextIcon,
    text: "Set up a Next.js app with auth and deploy to Vercel",
  },
  {
    id: "2",
    Icon: TypescriptIcon,
    text: "Refactor my Express API to use TypeScript",
  },
  {
    id: "3",
    Icon: GitIcon,
    text: "Build a CLI that generates changelogs from git",
  },
];

export default function CupertinoFirstTask() {
  const router = useRouter();
  const [task, setTask] = useState("");

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
        >
          <View style={s.badge}>
            <View style={s.badgeDot} />
            <Text style={s.badgeText}>Computer ready</Text>
          </View>
          <Text style={s.largeTitle}>What should it{"\n"}work on first?</Text>
          <Text style={s.subtitle}>
            Pick something real. We'll handle it while you get on with
            your day.
          </Text>

          <Text style={s.sectionLabel}>SUGGESTIONS</Text>
          <View style={s.list}>
            {SUGGESTIONS.map(({ id, Icon, text }, i) => (
              <TouchableOpacity
                key={id}
                style={[
                  s.row,
                  i !== SUGGESTIONS.length - 1 && s.rowDivider,
                ]}
                onPress={() => setTask(text)}
              >
                <View style={s.rowIcon}>
                  <Icon width={20} height={20} />
                </View>
                <Text style={s.rowText}>{text}</Text>
                <RightArrowIcon width={14} height={14} color="#C6C6C8" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={s.bottom}>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={task}
              onChangeText={setTask}
              placeholder="Or write your own…"
              placeholderTextColor="#8E8E93"
              returnKeyType="send"
            />
            <TouchableOpacity
              style={s.sendBtn}
              onPress={() => router.replace("/onboarding-mockups" as any)}
            >
              <SubmitIcon width={20} height={20} />
            </TouchableOpacity>
          </View>
          <Pressable
            style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
            onPress={() => router.replace("/onboarding-mockups" as any)}
          >
            <Text style={s.buttonText}>Send Task</Text>
          </Pressable>
          <TouchableOpacity
            onPress={() => router.replace("/onboarding-mockups" as any)}
          >
            <Text style={s.skip}>Skip — finish demo</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  body: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "#E5F1FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BLUE,
  },
  badgeText: {
    fontFamily: SFPro.semiBold,
    fontSize: 12,
    color: BLUE,
  },
  largeTitle: {
    fontFamily: SFPro.displayBold,
    fontSize: 30,
    color: "#000",
    letterSpacing: -0.9,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "#3C3C43",
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: SFPro.regular,
    fontSize: 12,
    color: "#6E6E73",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  list: {
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    paddingHorizontal: 14,
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
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#000",
    lineHeight: 20,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#000",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
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
  skip: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: BLUE,
    textAlign: "center",
  },
});
