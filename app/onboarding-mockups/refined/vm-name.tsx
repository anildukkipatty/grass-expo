import { SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ExitButton,
  HAIRLINE,
  PrimaryButton,
  SURFACE,
  TEXT,
  TEXT_DIM,
} from "./_shared";

const SUGGESTIONS = ["Aspen", "Sage", "Clover", "Pine", "Ivy", "Birch"];

export default function RefinedVmName() {
  const router = useRouter();
  const [name, setName] = useState("");
  const trimmed = name.trim();

  return (
    <SafeAreaView style={s.safe}>
      <ExitButton />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.body}>
          <Text style={s.eyebrow}>STEP 4 OF 5</Text>
          <Text style={s.title}>Name your{"\n"}computer.</Text>
          <Text style={s.subtitle}>
            Pick something memorable — you'll address it by this name
            when you message.
          </Text>

          <View style={s.fieldGroup}>
            <View style={s.field}>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Aspen"
                placeholderTextColor="#C6C6C8"
                autoFocus
                autoCorrect={false}
                autoCapitalize="words"
                maxLength={24}
                returnKeyType="done"
              />
              <Text style={s.charCount}>{trimmed.length}/24</Text>
            </View>
            <Text style={s.fieldHint}>
              You can rename it later in Settings.
            </Text>
          </View>

          <Text style={s.suggestLabel}>Suggestions</Text>
          <View style={s.chips}>
            {SUGGESTIONS.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={[
                  s.chip,
                  trimmed === suggestion && s.chipActive,
                ]}
                onPress={() => setName(suggestion)}
              >
                <Text
                  style={[
                    s.chipText,
                    trimmed === suggestion && s.chipTextActive,
                  ]}
                >
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.bottom}>
          <PrimaryButton
            label="Continue"
            disabled={trimmed.length === 0}
            onPress={() => {
              Keyboard.dismiss();
              router.push({
                pathname: "/onboarding-mockups/refined/provisioning" as any,
                params: { vmName: trimmed },
              });
            }}
          />
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  eyebrow: {
    fontFamily: SFPro.semiBold,
    fontSize: 12,
    color: TEXT_DIM,
    letterSpacing: 0.6,
    marginBottom: 8,
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
  fieldGroup: {
    marginBottom: 28,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 12,
    backgroundColor: SURFACE,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: SFPro.regular,
    fontSize: 17,
    color: TEXT,
  },
  charCount: {
    fontFamily: SFPro.regular,
    fontSize: 12,
    color: TEXT_DIM,
  },
  fieldHint: {
    fontFamily: SFPro.regular,
    fontSize: 12,
    color: TEXT_DIM,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  suggestLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: TEXT_DIM,
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
    backgroundColor: SURFACE,
  },
  chipActive: {
    backgroundColor: TEXT,
  },
  chipText: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: TEXT,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
});
