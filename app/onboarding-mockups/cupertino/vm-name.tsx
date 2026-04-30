import { SFPro } from "@/constants/theme";
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
import { ExitButton } from "./welcome";

const BLUE = "#007AFF";

const SUGGESTIONS = ["Aspen", "Sage", "Clover", "Pine", "Ivy", "Birch"];

export default function CupertinoVmName() {
  const router = useRouter();
  const [name, setName] = useState("");

  return (
    <SafeAreaView style={s.safe}>
      <ExitButton />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.body}>
          <Text style={s.largeTitle}>Name your{"\n"}computer.</Text>
          <Text style={s.subtitle}>
            Give it something memorable — you'll address it by this when
            you message.
          </Text>

          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>NAME</Text>
            <View style={s.field}>
              <TextInput
                style={s.fieldInput}
                placeholder="My computer"
                placeholderTextColor="#C6C6C8"
                value={name}
                onChangeText={setName}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="done"
                autoFocus
              />
            </View>
            <Text style={s.fieldHint}>You can rename it later in Settings.</Text>
          </View>

          <Text style={s.suggestLabel}>SUGGESTIONS</Text>
          <View style={s.chips}>
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
            style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
            onPress={() =>
              router.push("/onboarding-mockups/cupertino/provisioning" as any)
            }
          >
            <Text style={s.buttonText}>Continue</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  largeTitle: {
    fontFamily: SFPro.displayBold,
    fontSize: 34,
    color: "#000",
    letterSpacing: -1,
    lineHeight: 38,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#3C3C43",
    lineHeight: 21,
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 28,
  },
  fieldLabel: {
    fontFamily: SFPro.regular,
    fontSize: 12,
    color: "#6E6E73",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  field: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  fieldInput: {
    fontFamily: SFPro.regular,
    fontSize: 17,
    color: "#000",
  },
  fieldHint: {
    fontFamily: SFPro.regular,
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  suggestLabel: {
    fontFamily: SFPro.regular,
    fontSize: 12,
    color: "#6E6E73",
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F2F2F7",
  },
  chipText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#000",
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 28,
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
