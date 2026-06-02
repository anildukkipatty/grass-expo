import { requestOtp, verifyOtp } from "@/api/auth";
import EditIcon from "@/assets/images/new-design/onboarding/edit-icon.svg";
import EmailIcon from "@/assets/images/new-design/onboarding/email-icon.svg";
import { posthog } from "@/constants/posthog";
import { SFPro } from "@/constants/theme";
import { saveAuth } from "@/store/auth-store";
import { registerPushTokenAfterLogin } from "@/hooks/use-push-notifications";
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
  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
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
    setEmailFocused(false);
    setOtpFocused(false);
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
      setEmailError("Enter a valid email address.");
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
      setOtpError("That code didn't work. Try again.");
      return;
    }
    setOtpError("");
    setLoading(true);
    Keyboard.dismiss();
    const result = await verifyOtp(email.trim(), otp.trim());
    setLoading(false);
    if (result.ok) {
      await saveAuth(result.data.token, result.data.user);
      void registerPushTokenAfterLogin();
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
      setOtpError("That code didn't work. Try again.");
    }
  }, [email, otp, onVerified, onClose]);

  const handleEditEmail = useCallback(() => {
    setStep("email");
    setOtp("");
    setOtpError("");
    setTimeout(() => emailInputRef.current?.focus(), 150);
  }, []);

  const emailUnderlineColor = emailError
    ? "#C0554A"
    : emailFocused
      ? "#3D841E"
      : "#D0D0D0";

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
            {/* Header — same layout on both steps */}
            <View style={s.header}>
              <LinearGradient
                colors={["#389610", "#1A4A08"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={s.iconBox}
              >
                <EmailIcon width={20} height={20} color="#fff" />
              </LinearGradient>

              <Text style={s.title}>
                {step === "email" ? "Create your account" : "Check your inbox"}
              </Text>
              {step === "email" ? (
                <Text style={s.subtitle}>
                  We&#39;ll send a one-time code to your email.{"\n"}No password
                  needed.
                </Text>
              ) : (
                <Text style={s.subtitle}>
                  We sent a 6-digit code to{"\n"}
                  <Text style={s.subtitleEmail}>{email.trim()}</Text>
                  {"\n"}Enter it below to continue.
                </Text>
              )}
            </View>

            {/* Input section */}
            <View
              style={[
                s.inputSection,
                { marginTop: step === "otp" ? 36 : 48 },
              ]}
            >
              {step === "email" ? (
                <>
                  <Text style={s.inputLabel}>Email address</Text>
                  <TextInput
                    ref={emailInputRef}
                    style={[
                      s.emailInput,
                      emailError ? s.emailInputError : null,
                    ]}
                    placeholder="you@example.com"
                    placeholderTextColor="#B0B0B0"
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
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    autoFocus
                  />
                  <View
                    style={[
                      s.underline,
                      { backgroundColor: emailUnderlineColor },
                    ]}
                  />
                  {emailError ? (
                    <Text style={s.errorText}>{emailError}</Text>
                  ) : (
                    <Text style={s.helperText}>
                      Use the email you want linked to your free agent runtime.
                    </Text>
                  )}
                </>
              ) : (
                /* OTP box cells */
                <>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => otpInputRef.current?.focus()}
                    style={s.otpRow}
                  >
                    {Array.from({ length: 6 }).map((_, i) => {
                      const isFilled = i < otp.length;
                      const isActive =
                        otpFocused && otp.length === i && !otpError;
                      const cellBorderColor = otpError
                        ? "#C0554A"
                        : isActive
                          ? "#3D841E"
                          : isFilled
                            ? "#333"
                            : "#E0E0E0";
                      const cellBg = otpError
                        ? "#FDF5F5"
                        : isFilled || isActive
                          ? "#FFF"
                          : "#F8F8F8";
                      return (
                        <View
                          key={i}
                          style={[
                            s.otpCell,
                            {
                              borderColor: cellBorderColor,
                              backgroundColor: cellBg,
                            },
                          ]}
                        >
                          {isFilled ? (
                            <Text
                              style={[
                                s.otpDigit,
                                otpError ? s.otpDigitError : s.otpDigitFilled,
                              ]}
                            >
                              {otp[i]}
                            </Text>
                          ) : isActive ? (
                            <View style={s.otpCursor} />
                          ) : null}
                        </View>
                      );
                    })}
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
                    onFocus={() => setOtpFocused(true)}
                    onBlur={() => setOtpFocused(false)}
                    autoFocus
                    caretHidden
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                  />
                  {otpError ? (
                    <Text style={s.otpErrorText}>{otpError}</Text>
                  ) : null}
                </>
              )}
            </View>

            <View style={s.spacer} />

            {/* Bottom area */}
            <View style={s.bottomArea}>
              {step === "otp" && (
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
                    <EditIcon width={13} height={13} color="#888" />
                    <Text style={s.editText}>Edit email</Text>
                  </TouchableOpacity>
                </View>
              )}

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

              {step === "email" && (
                <TouchableOpacity onPress={() => emailInputRef.current?.focus()}>
                  <Text style={s.loginLink}>
                    Already have an account?{" "}
                    <Text style={s.loginLinkBold}>Log in</Text>
                  </Text>
                </TouchableOpacity>
              )}
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
    paddingTop: 44,
    paddingHorizontal: 24,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  subtitleEmail: {
    fontFamily: SFPro.bold,
    color: "#111",
  },
  inputSection: {
    paddingHorizontal: 28,
  },
  inputLabel: {
    fontFamily: SFPro.medium,
    fontSize: 12,
    color: "#888",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  emailInput: {
    fontFamily: SFPro.regular,
    fontSize: 21,
    color: "#000000",
    paddingVertical: 6,
    paddingHorizontal: 0,
    height: 40,
  },
  emailInputError: {
    color: "#C0554A",
  },
  underline: {
    height: 1.5,
    width: "100%",
  },
  helperText: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#999",
    marginTop: 10,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  errorText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#C0554A",
    marginTop: 10,
    lineHeight: 18,
  },
  /* OTP */
  otpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  otpCell: {
    width: 44,
    height: 54,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  otpDigit: {
    fontFamily: SFPro.medium,
    fontSize: 22,
    textAlign: "center",
  },
  otpDigitFilled: {
    color: "#111",
  },
  otpDigitError: {
    color: "#C0554A",
  },
  otpCursor: {
    width: 1.5,
    height: 22,
    backgroundColor: "#3D841E",
    borderRadius: 1,
  },
  otpErrorText: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#C0554A",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 18,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  spacer: {
    flex: 1,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: "center",
    gap: 14,
  },
  resendEditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendLabel: {
    fontFamily: SFPro.regular,
    fontSize: 14,
    color: "#888",
  },
  resendTimer: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: "#555",
  },
  resendLink: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: "#3D841E",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  editText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#888",
  },
  button: {
    borderRadius: 50,
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonActive: {
    backgroundColor: "#3D841E",
  },
  buttonDisabled: {
    backgroundColor: "#D0D0D0",
  },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#fff",
    letterSpacing: 0,
  },
  loginLink: {
    fontFamily: SFPro.regular,
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  loginLinkBold: {
    fontFamily: SFPro.medium,
    color: "#3D841E",
  },
});
