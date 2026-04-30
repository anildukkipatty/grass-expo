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
  View,
} from "react-native";
import { ExitButton, Grid } from "./welcome";

const NEON = "#72FF4E";
const CYAN = "#4EFFE6";
const BG = "#05050A";

export default function NeonAuth() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <SafeAreaView style={s.safe}>
      <Grid />
      <ExitButton />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.body}>
          <Text style={s.crumb}>{step === "email" ? "// 03 / IDENT" : "// 03 / OTP"}</Text>
          <Text style={s.title}>
            {step === "email" ? "Authenticate." : "Decrypt code."}
          </Text>
          <Text style={s.subtitle}>
            {step === "email"
              ? "> a one-time key will be transmitted to your inbox."
              : `> 6-digit key sent to ${email || "your inbox"}`}
          </Text>

          {step === "email" ? (
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>EMAIL</Text>
              <View style={s.field}>
                <Text style={s.prompt}>{"> "}</Text>
                <TextInput
                  style={s.input}
                  placeholder="user@grid.net"
                  placeholderTextColor="#3D5C3D"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  autoFocus
                />
                <Text style={s.cursor}>▌</Text>
              </View>
            </View>
          ) : (
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>ACCESS KEY</Text>
              <View style={s.otpRow}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={s.otpCell}>
                    <Text style={s.otpDigit}>{otp[i] ?? "_"}</Text>
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
              <Text style={s.resend}>
                <Text style={s.resendDim}>didn't receive? </Text>
                <Text style={s.resendLink}>retransmit</Text>
              </Text>
            </View>
          )}
        </View>

        <View style={s.bottom}>
          <Pressable
            style={s.button}
            onPress={() => {
              if (step === "email") setStep("otp");
              else router.push("/onboarding-mockups/neon/vm-ready" as any);
            }}
          >
            <Text style={s.buttonText}>
              {step === "email" ? "TRANSMIT  ▸" : "DECRYPT  ▸"}
            </Text>
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
    marginBottom: 40,
    letterSpacing: 0.4,
  },
  fieldWrap: {
    marginTop: 8,
  },
  fieldLabel: {
    fontFamily: SFMono.medium,
    fontSize: 11,
    color: NEON,
    letterSpacing: 2,
    marginBottom: 12,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: NEON,
    paddingBottom: 10,
  },
  prompt: {
    fontFamily: SFMono.regular,
    fontSize: 18,
    color: NEON,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontFamily: SFMono.regular,
    fontSize: 18,
    color: "#FFFFFF",
    padding: 0,
  },
  cursor: {
    fontFamily: SFMono.regular,
    fontSize: 18,
    color: NEON,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  otpCell: {
    flex: 1,
    height: 64,
    borderWidth: 1,
    borderColor: NEON,
    backgroundColor: "#0A1A0A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NEON,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  otpDigit: {
    fontFamily: SFMono.bold,
    fontSize: 28,
    color: NEON,
  },
  hidden: { position: "absolute", width: 1, height: 1, opacity: 0 },
  resend: {
    fontFamily: SFMono.regular,
    fontSize: 12,
    marginTop: 22,
    letterSpacing: 1,
  },
  resendDim: { color: "#5C7C5C" },
  resendLink: { color: CYAN, textDecorationLine: "underline" },
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
