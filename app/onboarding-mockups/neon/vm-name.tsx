import { SFMono, SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
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

const SUGGESTIONS = ["NEXUS-7", "ATLAS", "ORACLE", "GHOST", "PROMETHEUS"];

export default function NeonVmName() {
  const router = useRouter();
  const [name, setName] = useState("");

  return (
    <SafeAreaView style={s.safe}>
      <Grid />
      <ExitButton />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.body}>
          <Text style={s.crumb}>{"// 05 / DESIGNATION"}</Text>
          <Text style={s.title}>Assign a{"\n"}callsign.</Text>
          <Text style={s.subtitle}>
            {">"} this is what you'll address them by.{"\n"}
            {">"} mutable. you can rewrite later.
          </Text>

          <View style={s.frame}>
            <View style={s.frameCornerTL} />
            <View style={s.frameCornerTR} />
            <View style={s.frameCornerBL} />
            <View style={s.frameCornerBR} />
            <Text style={s.framePrompt}>{"NAME//"}</Text>
            <TextInput
              style={s.frameInput}
              value={name}
              onChangeText={setName}
              placeholder="ENTER CALLSIGN"
              placeholderTextColor="#2C5C2C"
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
            />
          </View>

          <Text style={s.suggestLabel}>SUGGESTIONS</Text>
          <View style={s.chipRow}>
            {SUGGESTIONS.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={s.chip}
                onPress={() => setName(suggestion)}
              >
                <Text style={s.chipText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.bottom}>
          <Pressable
            style={s.button}
            onPress={() =>
              router.push("/onboarding-mockups/neon/provisioning" as any)
            }
          >
            <Text style={s.buttonText}>{"COMMIT  ▸"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: 32,
    letterSpacing: 0.4,
    lineHeight: 20,
  },
  frame: {
    height: 90,
    borderWidth: 1,
    borderColor: NEON,
    backgroundColor: "#0A1A0A",
    paddingHorizontal: 18,
    paddingTop: 22,
    marginBottom: 28,
    shadowColor: NEON,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  frameCornerTL: {
    position: "absolute",
    top: -1, left: -1,
    width: 12, height: 12,
    borderLeftWidth: 3, borderTopWidth: 3,
    borderColor: NEON,
  },
  frameCornerTR: {
    position: "absolute",
    top: -1, right: -1,
    width: 12, height: 12,
    borderRightWidth: 3, borderTopWidth: 3,
    borderColor: NEON,
  },
  frameCornerBL: {
    position: "absolute",
    bottom: -1, left: -1,
    width: 12, height: 12,
    borderLeftWidth: 3, borderBottomWidth: 3,
    borderColor: NEON,
  },
  frameCornerBR: {
    position: "absolute",
    bottom: -1, right: -1,
    width: 12, height: 12,
    borderRightWidth: 3, borderBottomWidth: 3,
    borderColor: NEON,
  },
  framePrompt: {
    fontFamily: SFMono.medium,
    fontSize: 10,
    color: CYAN,
    letterSpacing: 2,
    marginBottom: 4,
  },
  frameInput: {
    fontFamily: SFMono.bold,
    fontSize: 26,
    color: NEON,
    letterSpacing: 4,
    padding: 0,
  },
  suggestLabel: {
    fontFamily: SFMono.medium,
    fontSize: 10,
    color: "#5C7C5C",
    letterSpacing: 2,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#1F3A1F",
    backgroundColor: "#0A1A0A",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontFamily: SFMono.medium,
    fontSize: 12,
    color: "#9FE69A",
    letterSpacing: 1.5,
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
