import EmailIcon from "@/assets/images/new-design/onboarding/email-icon.svg";
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

const { SKY_TOP, SKY_BOT, SUN, TEXT_DARK } = questStyles;

export default function QuestAuth() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[SKY_TOP, SKY_BOT]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <QuestExitButton />
        <QuestProgress step={2} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={s.body}>
            <View style={s.iconCircle}>
              <EmailIcon width={32} height={32} color={TEXT_DARK} />
            </View>

            <View style={s.card}>
              <Text style={s.title}>
                {step === "email" ? "Open your inbox" : "Enter the rune"}
              </Text>
              <Text style={s.subtitle}>
                {step === "email"
                  ? "We'll deliver a magic code by carrier raven."
                  : `Six runes were sent to ${email || "your scroll"}.`}
              </Text>

              {step === "email" ? (
                <TextInput
                  style={s.emailInput}
                  placeholder="hero@grass.com"
                  placeholderTextColor="rgba(16,43,92,0.4)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  autoFocus
                />
              ) : (
                <View>
                  <View style={s.otpRow}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <View key={i} style={s.otpCell}>
                        <Text style={s.otpDigit}>{otp[i] ?? "•"}</Text>
                      </View>
                    ))}
                  </View>
                  <TextInput
                    style={s.hidden}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    caretHidden
                  />
                  <TouchableOpacity
                    style={s.editRow}
                    onPress={() => setStep("email")}
                  >
                    <Text style={s.editText}>↩ Change scroll</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={s.bottom}>
            <ChunkyButton
              label={step === "email" ? "SEND RUNE" : "VERIFY"}
              onPress={() => {
                if (step === "email") setStep("otp");
                else router.push("/onboarding-mockups/quest/vm-ready" as any);
              }}
              color={SUN}
              shadow="#B27A00"
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
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  iconCircle: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: TEXT_DARK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: TEXT_DARK,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 5 },
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    padding: 22,
    alignItems: "center",
    shadowColor: TEXT_DARK,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    fontFamily: NationalPark.bold,
    fontSize: 24,
    color: TEXT_DARK,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: TEXT_DARK,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
  },
  emailInput: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    backgroundColor: "#F2F8FF",
    paddingHorizontal: 14,
    fontFamily: NationalPark.bold,
    fontSize: 18,
    color: TEXT_DARK,
    textAlign: "center",
  },
  otpRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  otpCell: {
    width: 42, height: 56,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    backgroundColor: "#F2F8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  otpDigit: {
    fontFamily: NationalPark.bold,
    fontSize: 26,
    color: TEXT_DARK,
  },
  hidden: { position: "absolute", width: 1, height: 1, opacity: 0 },
  editRow: {
    paddingVertical: 4,
    alignItems: "center",
  },
  editText: {
    fontFamily: NationalPark.bold,
    fontSize: 13,
    color: TEXT_DARK,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
});
