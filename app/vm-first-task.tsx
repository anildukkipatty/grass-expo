import GitIcon from "@/assets/images/new-design/onboarding/git.svg";
import NextIcon from "@/assets/images/new-design/onboarding/next.svg";
import RightArrowIcon from "@/assets/images/new-design/onboarding/right-arrow-head.svg";
import SubmitIcon from "@/assets/images/new-design/onboarding/submit-icon.svg";
import TypescriptIcon from "@/assets/images/new-design/onboarding/typescript.svg";
import { SFPro } from "@/constants/theme";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SUGGESTED_TASKS = [
  {
    id: "1",
    Icon: NextIcon,
    text: "Set up a Next.js app with auth\nand deploy to Vercel",
  },
  {
    id: "2",
    Icon: TypescriptIcon,
    text: "Refactor my Express API to\nuse TypeScript",
  },
  {
    id: "3",
    Icon: GitIcon,
    text: "Build a CLI tool that generates\nchangelogs from git",
  },
];

export default function VmFirstTaskScreen() {
  const router = useRouter();
  const [task, setTask] = useState("");

  const handleSubmit = () => {
    if (!task.trim()) return;
    router.replace("/(tabs)/home" as any);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.content}>
            {/* Badge */}
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <View style={styles.dot} />
                <Text style={styles.badgeText}>Son of Anton is ready</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>What&#39;s the first task?</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Pick something real. They&#39;ll handle it while{"\n"}you get on
              with your day.
            </Text>

            {/* Suggested task cards */}
            <View style={styles.cardsContainer}>
              {SUGGESTED_TASKS.map(({ id, Icon, text }) => (
                <TouchableOpacity
                  key={id}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => setTask(text.replace("\n", " "))}
                >
                  <View style={styles.cardIconWrap}>
                    <Icon width={28} height={28} />
                  </View>
                  <Text style={styles.cardText}>{text}</Text>
                  <RightArrowIcon width={16} height={16} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sticky bottom input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={task}
              onChangeText={setTask}
              placeholder="Or type your own task..."
              placeholderTextColor="#9A9A9A"
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              style={[
                styles.submitBtn,
                !task.trim() && styles.submitBtnDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleSubmit}
              disabled={!task.trim()}
            >
              <SubmitIcon width={22} height={22} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  // ── Badge ─────────────────────────────────────────
  badgeRow: {
    marginBottom: 20,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#295E13",
    backgroundColor: "#123005",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 40,
    backgroundColor: "#C3F6AD",
  },
  badgeText: {
    fontFamily: SFPro.semiBold,
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },

  // ── Title / Subtitle ──────────────────────────────
  title: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    color: "#000000",
    lineHeight: 32,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 17,
    color: "#404040",
    lineHeight: 22,
    marginBottom: 28,
  },

  // ── Cards ─────────────────────────────────────────
  cardsContainer: {
    gap: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    height: 84,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C3F6AD",
    backgroundColor: "#E3FDD7",
    paddingHorizontal: 16,
    gap: 12,
  },
  cardIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#9EE67F",
    backgroundColor: "#FFF",
    width: 44,
    height: 44,
  },
  cardText: {
    flex: 1,
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#1A1A1A",
    lineHeight: 22,
  },

  // ── Input row ─────────────────────────────────────
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C3F6AD",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#1A1A1A",
  },
  submitBtn: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9EE67F",
    backgroundColor: "#3D841E",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
});
