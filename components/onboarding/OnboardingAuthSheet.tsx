import { requestOtp, verifyOtp } from "@/api/auth";
import EditIcon from "@/assets/images/new-design/onboarding/edit-icon.svg";
import EmailIcon from "@/assets/images/new-design/onboarding/email-icon.svg";
import { posthog } from "@/constants/posthog";
import { SFPro } from "@/constants/theme";
import { saveAuth } from "@/store/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const RESEND_COOLDOWN = 45;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function OnboardingAuthSheet({
  visible,
  onClose,
  onVerified,
}: {
  visible: boolean;
  onClose: () => void;
  onVerified: (userType: "new" | "old") => void;
}) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emailInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);

  const startResendTimer = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resetState = useCallback(() => {
    setStep("email");
    setEmail("");
    setOtp("");
    setLoading(false);
    setResendTimer(0);
    setEmailError("");
    setOtpError("");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!visible) resetState();
  }, [visible, resetState]);

  const emailValid = isValidEmail(email);
  const otpComplete = otp.trim().length === 6;
  const buttonActive = step === "email" ? emailValid : otpComplete;

  const handleRequestOtp = useCallback(async () => {
    if (!emailValid) {
      setEmailError("That doesn't look right. Check the email and try again.");
      return;
    }
    setEmailError("");
    setLoading(true);
    Keyboard.dismiss();
    const result = await requestOtp(email.trim());
    setLoading(false);
    if (result.ok) {
      posthog.capture("otp_requested", { email: email.trim() });
      setStep("otp");
      startResendTimer();
    } else {
      setEmailError(result.error);
    }
  }, [email, emailValid, startResendTimer]);

  const handleResendOtp = useCallback(async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    const result = await requestOtp(email.trim());
    setLoading(false);
    if (result.ok) {
      startResendTimer();
    } else {
      setOtpError(result.error);
    }
  }, [email, resendTimer, startResendTimer]);

  const handleVerifyOtp = useCallback(async () => {
    if (otp.trim().length !== 6) {
      setOtpError("That code doesn't match. Try again.");
      return;
    }
    setOtpError("");
    setLoading(true);
    Keyboard.dismiss();
    const result = await verifyOtp(email.trim(), otp.trim());
    setLoading(false);
    if (result.ok) {
      await saveAuth(result.data.token, result.data.user);
      const isNewUser = result.data.user.userType === "new";
      posthog.identify(result.data.user.id, {
        $set: { email: email.trim() },
        $set_once: { first_login_date: new Date().toISOString() },
      });
      posthog.capture(isNewUser ? "user_signed_up" : "user_logged_in", {
        email: email.trim(),
        user_type: result.data.user.userType,
      });
      onClose();
      onVerified(result.data.user.userType);
    } else {
      setOtpError("That code doesn't match. Try again.");
    }
  }, [email, otp, onVerified, onClose]);

  const handleEditEmail = useCallback(() => {
    setStep("email");
    setOtp("");
    setOtpError("");
    setTimeout(() => emailInputRef.current?.focus(), 150);
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={s.container}>
          <KeyboardAvoidingView
            style={s.flex}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            {/* Header */}
            <View style={s.header}>
              <LinearGradient
                colors={["#389610", "#123005"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={s.iconBox}
              >
                <EmailIcon width={26} height={26} color="#fff" />
              </LinearGradient>

              <Text style={s.title}>
                {step === "email" ? "Create your account" : "Check your inbox."}
              </Text>
              {step === "email" ? (
                <Text style={s.subtitle}>
                  We&#39;ll send a one-time code to your email.{"\n"}Use this to
                  log in from any device.
                </Text>
              ) : (
                <Text style={s.subtitle}>
                  We sent a 6-digit code to{"\n"}
                  <Text style={s.subtitleEmail}>{email.trim()}</Text>
                  {"\n"}Enter it below to continue.
                </Text>
              )}
            </View>

            {/* Input area */}
            <View style={s.inputArea}>
              {step === "email" ? (
                <>
                  <TextInput
                    ref={emailInputRef}
                    style={[
                      s.emailInput,
                      emailError ? s.emailInputError : s.emailInputDefault,
                    ]}
                    placeholder="you@example.com"
                    placeholderTextColor="#9F9F9F"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setEmailError("");
                    }}
                    onSubmitEditing={handleRequestOtp}
                    autoFocus
                    textAlign="center"
                  />
                  {emailError ? (
                    <Text style={s.errorText}>{emailError}</Text>
                  ) : null}
                </>
              ) : (
                <>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => otpInputRef.current?.focus()}
                  >
                    <View style={s.otpRow}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <View key={i} style={s.otpCell}>
                          <Text
                            style={[
                              s.otpDigit,
                              otpError
                                ? s.otpDigitError
                                : otp[i]
                                  ? s.otpDigitFilled
                                  : s.otpDigitEmpty,
                            ]}
                          >
                            {otp[i] ?? "0"}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                  <TextInput
                    ref={otpInputRef}
                    style={s.hiddenInput}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={(t) => {
                      setOtp(t);
                      setOtpError("");
                    }}
                    autoFocus
                    caretHidden
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                  />
                  {otpError ? (
                    <Text style={s.errorText}>{otpError}</Text>
                  ) : null}
                </>
              )}
            </View>

            {/* Bottom area */}
            <View style={s.bottomArea}>
              {step === "email" ? (
                <Text style={s.legal}>
                  We&#39;ll send a verification code to your email.
                </Text>
              ) : (
                /* Resend + Edit email row — same line */
                <View style={s.resendEditRow}>
                  <View style={s.resendRow}>
                    <Text style={s.resendLabel}>Didn&#39;t get it? </Text>
                    {resendTimer > 0 ? (
                      <Text style={s.resendTimer}>
                        Resend in {formatTimer(resendTimer)}
                      </Text>
                    ) : (
                      <TouchableOpacity
                        onPress={handleResendOtp}
                        disabled={loading}
                      >
                        <Text style={s.resendLink}>Resend code</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity onPress={handleEditEmail} style={s.editRow}>
                    <EditIcon width={14} height={14} color="#808080" />
                    <Text style={s.editText}>Edit email</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Continue button */}
              <TouchableOpacity
                style={[
                  s.button,
                  buttonActive ? s.buttonActive : s.buttonDisabled,
                ]}
                onPress={step === "email" ? handleRequestOtp : handleVerifyOtp}
                activeOpacity={0.88}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3D841E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    color: "#000000",
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#000",
    textAlign: "center",
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  subtitleEmail: {
    fontFamily: SFPro.bold,
    color: "#000000",
  },
  inputArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // paddingHorizontal: 24,
  },
  emailInput: {
    fontFamily: SFPro.semiBold,
    fontSize: 28,
    color: "#000000",
    textAlign: "center",
    // paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    height: 52,
    // borderRadius: 50,
    // borderWidth: 2,
  },
  emailInputDefault: {
    borderColor: "#C0C0C0",
    backgroundColor: "#FFFFFF",
  },
  emailInputError: {
    borderColor: "#808080",
    backgroundColor: "#FFFFFF",
    color: "#841E1E",
  },
  // emailInputValid: {
  //   borderColor: "#295E13",
  //   backgroundColor: "#123005",
  //   color: "#FFFFFF",
  // },
  errorText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#841E1E",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },
  otpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  otpCell: {
    width: 20,
    height: 52,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  otpDigit: {
    fontFamily: SFPro.regular,
    fontSize: 36,
    textAlign: "center",
    lineHeight: 44,
  },
  otpDigitEmpty: {
    color: "#9F9F9F",
  },
  otpDigitFilled: {
    color: "#000000",
  },
  otpDigitError: {
    color: "#841E1E",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: "center",
    gap: 16,
  },
  resendEditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editText: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: "#000",
  },
  button: {
    borderRadius: 50,
    borderWidth: 2,
    height: 57,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonActive: {
    borderColor: "rgba(114, 196, 78, 0.4)",
    backgroundColor: "#3D841E",
    // shadowColor: "rgba(50, 147, 81, 0.70)",
    // shadowOffset: { width: 0, height: 0 },
    // shadowOpacity: 1,
    // shadowRadius: 16,
    elevation: 10,
  },
  buttonDisabled: {
    borderColor: "#808080",
    backgroundColor: "#9F9F9F",
  },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#F2F2F2",
    letterSpacing: -0.5,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendLabel: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: "#000",
  },
  resendTimer: {
    fontFamily: SFPro.bold,
    fontSize: 13,
    color: "#000000",
    textDecorationLine: "underline",
  },
  resendLink: {
    fontFamily: SFPro.bold,
    fontSize: 13,
    color: "#000000",
    textDecorationLine: "underline",
  },
  legal: {
    fontSize: 13,
    fontFamily: SFPro.medium,
    color: "#000",
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: -0.3,
  },
});
