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

export default function CupertinoAuth() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <SafeAreaView style={s.safe}>
      <ExitButton />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.body}>
          <Text style={s.largeTitle}>
            {step === "email" ? "Sign in" : "Verify"}
          </Text>
          <Text style={s.subtitle}>
            {step === "email"
              ? "We'll email you a one-time code. No passwords."
              : `Enter the 6-digit code we sent to ${email || "your email"}.`}
          </Text>

          {step === "email" ? (
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>EMAIL</Text>
              <View style={s.field}>
                <TextInput
                  style={s.fieldInput}
                  placeholder="you@apple.com"
                  placeholderTextColor="#C6C6C8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  autoFocus
                />
              </View>
              <Text style={s.fieldHint}>
                We don't share your email or send marketing.
              </Text>
            </View>
          ) : (
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>VERIFICATION CODE</Text>
              <View style={s.otpRow}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View
                    key={i}
                    style={[s.otpCell, otp[i] && s.otpCellFilled]}
                  >
                    <Text style={s.otpDigit}>{otp[i] ?? ""}</Text>
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
              <View style={s.linkRow}>
                <TouchableOpacity onPress={() => setStep("email")}>
                  <Text style={s.linkText}>Edit email</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={s.linkText}>Resend code</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={s.bottom}>
          <Pressable
            style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
            onPress={() => {
              if (step === "email") setStep("otp");
              else router.push("/onboarding-mockups/cupertino/vm-ready" as any);
            }}
          >
            <Text style={s.buttonText}>
              {step === "email" ? "Send Code" : "Verify"}
            </Text>
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
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#3C3C43",
    lineHeight: 21,
    marginBottom: 36,
  },
  fieldGroup: {
    marginBottom: 24,
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
  otpRow: {
    flexDirection: "row",
    gap: 10,
  },
  otpCell: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  otpCellFilled: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BLUE,
  },
  otpDigit: {
    fontFamily: SFPro.semiBold,
    fontSize: 24,
    color: "#000",
  },
  hidden: { position: "absolute", width: 1, height: 1, opacity: 0 },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingHorizontal: 4,
  },
  linkText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: BLUE,
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
