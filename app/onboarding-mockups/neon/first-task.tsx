import GitIcon from "@/assets/images/new-design/onboarding/git.svg";
import NextIcon from "@/assets/images/new-design/onboarding/next.svg";
import TypescriptIcon from "@/assets/images/new-design/onboarding/typescript.svg";
import { SFMono, SFPro } from "@/constants/theme";
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
import { ExitButton, Grid } from "./welcome";

const NEON = "#72FF4E";
const CYAN = "#4EFFE6";
const BG = "#05050A";

const MISSIONS = [
  {
    id: "1",
    Icon: NextIcon,
    label: "DEPLOY: NEXT.JS + AUTH",
    text: "Stand up Next.js with auth and ship to Vercel.",
  },
  {
    id: "2",
    Icon: TypescriptIcon,
    label: "REFACTOR: EXPRESS → TS",
    text: "Migrate the Express API to TypeScript end-to-end.",
  },
  {
    id: "3",
    Icon: GitIcon,
    label: "BUILD: CHANGELOG CLI",
    text: "Generate changelogs straight from git history.",
  },
];

export default function NeonFirstTask() {
  const router = useRouter();
  const [task, setTask] = useState("");

  return (
    <SafeAreaView style={s.safe}>
      <Grid />
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
          <Text style={s.crumb}>{"// 07 / DIRECTIVE"}</Text>

          <View style={s.statusBadge}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>NODE READY</Text>
          </View>

          <Text style={s.title}>Issue first{"\n"}directive.</Text>
          <Text style={s.subtitle}>
            {">"} pick a preset or compose your own.{"\n"}
            {">"} agent executes while you're elsewhere.
          </Text>

          <View style={s.missions}>
            {MISSIONS.map(({ id, Icon, label, text }) => (
              <TouchableOpacity
                key={id}
                style={s.mission}
                onPress={() => setTask(text)}
                activeOpacity={0.7}
              >
                <View style={s.missionHeader}>
                  <View style={s.missionIcon}>
                    <Icon width={18} height={18} />
                  </View>
                  <Text style={s.missionLabel}>{label}</Text>
                </View>
                <Text style={s.missionText}>{text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={s.bottom}>
          <View style={s.inputFrame}>
            <Text style={s.inputPrompt}>{"> "}</Text>
            <TextInput
              style={s.input}
              value={task}
              onChangeText={setTask}
              placeholder="custom directive..."
              placeholderTextColor="#3D5C3D"
              returnKeyType="send"
            />
          </View>
          <Pressable
            style={s.button}
            onPress={() => router.replace("/onboarding-mockups" as any)}
          >
            <Text style={s.buttonText}>{"EXECUTE  ▸"}</Text>
          </Pressable>
          <TouchableOpacity
            onPress={() => router.replace("/onboarding-mockups" as any)}
          >
            <Text style={s.skip}>SKIP — END DEMO</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  body: {
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 16,
  },
  crumb: {
    fontFamily: SFMono.regular,
    fontSize: 11,
    color: CYAN,
    letterSpacing: 2,
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: NEON,
    backgroundColor: "#0A1A0A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NEON,
    shadowColor: NEON,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    fontFamily: SFMono.bold,
    fontSize: 10,
    color: NEON,
    letterSpacing: 2,
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
    lineHeight: 20,
  },
  missions: {
    gap: 12,
  },
  mission: {
    borderWidth: 1,
    borderColor: "#1F3A1F",
    backgroundColor: "#0A1A0A",
    padding: 14,
  },
  missionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  missionIcon: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: NEON,
    alignItems: "center",
    justifyContent: "center",
  },
  missionLabel: {
    fontFamily: SFMono.bold,
    fontSize: 11,
    color: NEON,
    letterSpacing: 2,
  },
  missionText: {
    fontFamily: SFMono.regular,
    fontSize: 13,
    color: "#9FE69A",
    lineHeight: 18,
  },
  bottom: {
    paddingHorizontal: 22,
    paddingBottom: 32,
    gap: 12,
  },
  inputFrame: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: NEON,
    backgroundColor: "#0A1A0A",
    paddingHorizontal: 12,
    height: 48,
    shadowColor: NEON,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  inputPrompt: {
    fontFamily: SFMono.regular,
    fontSize: 16,
    color: NEON,
  },
  input: {
    flex: 1,
    fontFamily: SFMono.regular,
    fontSize: 14,
    color: "#FFFFFF",
    padding: 0,
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
  skip: {
    fontFamily: SFMono.regular,
    fontSize: 11,
    color: "#5C7C5C",
    textAlign: "center",
    letterSpacing: 2,
    marginTop: 4,
    textDecorationLine: "underline",
  },
});
