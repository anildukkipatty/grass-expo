import { NationalPark, SFPro } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
import {
  ChunkyButton,
  questStyles,
  QuestExitButton,
  QuestProgress,
} from "./welcome";

const { SKY_TOP, SKY_BOT, TEXT_DARK, GRASS, GRASS_DARK } = questStyles;

const NAMES = ["Mossfang", "Sproutling", "Brambleboot", "Glimmer", "Rooto"];

export default function QuestVmName() {
  const router = useRouter();
  const [name, setName] = useState("");

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[SKY_TOP, SKY_BOT]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <QuestExitButton />
        <QuestProgress step={4} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={s.body}>
            <Text style={s.eyebrow}>★ NAME YOUR COMPANION ★</Text>

            <View style={s.plaque}>
              <View style={s.plaqueInner}>
                <Text style={s.plaqueLabel}>· COMPANION ·</Text>
                <TextInput
                  style={s.nameInput}
                  placeholder="??????"
                  placeholderTextColor="rgba(16,43,92,0.35)"
                  value={name}
                  onChangeText={setName}
                  autoCorrect={false}
                  autoCapitalize="words"
                  autoFocus
                  maxLength={14}
                />
                <View style={s.heart}>
                  <Text style={s.heartText}>♥</Text>
                </View>
              </View>
            </View>

            <Text style={s.helper}>
              Pick something fun. They'll respond to{"\n"}
              this name when you message them.
            </Text>

            <Text style={s.suggestLabel}>NEED INSPIRATION?</Text>
            <View style={s.chips}>
              {NAMES.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={s.chip}
                  onPress={() => setName(n)}
                >
                  <Text style={s.chipText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.bottom}>
            <ChunkyButton
              label="HIRE COMPANION"
              onPress={() =>
                router.push("/onboarding-mockups/quest/provisioning" as any)
              }
              color={GRASS}
              shadow={GRASS_DARK}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: SKY_BOT },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: "center",
  },
  eyebrow: {
    fontFamily: NationalPark.bold,
    fontSize: 13,
    color: "#E54B4B",
    textAlign: "center",
    letterSpacing: 1.5,
    marginBottom: 18,
  },
  plaque: {
    width: "100%",
    backgroundColor: "#FFD879",
    borderRadius: 22,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    padding: 6,
    shadowColor: TEXT_DARK,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 18,
  },
  plaqueInner: {
    backgroundColor: "#FFF6DC",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    paddingVertical: 22,
    alignItems: "center",
    position: "relative",
  },
  plaqueLabel: {
    fontFamily: NationalPark.bold,
    fontSize: 11,
    color: TEXT_DARK,
    letterSpacing: 2,
    marginBottom: 4,
  },
  nameInput: {
    fontFamily: NationalPark.bold,
    fontSize: 32,
    color: TEXT_DARK,
    letterSpacing: 1.2,
    textAlign: "center",
    minWidth: 200,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heart: {
    position: "absolute",
    top: -14,
    right: -14,
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: "#E54B4B",
    borderWidth: 2,
    borderColor: TEXT_DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  heartText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: NationalPark.bold,
  },
  helper: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: TEXT_DARK,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  suggestLabel: {
    fontFamily: NationalPark.bold,
    fontSize: 11,
    color: TEXT_DARK,
    letterSpacing: 1.5,
    marginBottom: 10,
    alignSelf: "center",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: TEXT_DARK,
  },
  chipText: {
    fontFamily: NationalPark.bold,
    fontSize: 13,
    color: TEXT_DARK,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
});
