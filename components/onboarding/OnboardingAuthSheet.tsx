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
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const RESEND_COOLDOWN = 30;

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
  const [checking, setChecking] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendSent, setResendSent] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendSentRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonColorAnim = useRef(new Animated.Value(0)).current;

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
      if (resendSentRef.current) clearTimeout(resendSentRef.current);
    };
  }, []);

  const resetState = useCallback(() => {
    setStep("email");
    setEmail("");
    setOtp("");
    setLoading(false);
    setChecking(false);
    setResendTimer(0);
    setEmailError("");
    setOtpError("");
    setResendSent(false);
    setEmailFocused(false);
    setOtpFocused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (resendSentRef.current) {
      clearTimeout(resendSentRef.current);
      resendSentRef.current = null;
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
      setResendSent(false);
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
      setOtpError("");
      setResendSent(true);
      if (resendSentRef.current) clearTimeout(resendSentRef.current);
      resendSentRef.current = setTimeout(() => {
        setResendSent(false);
        resendSentRef.current = null;
      }, 2200);
      startResendTimer();
    } else {
      setOtpError(result.error);
    }
  }, [email, resendTimer, startResendTimer]);

  const handleVerifyOtp = useCallback(async () => {
    if (otp.trim().length !== 6) {
      setOtpError("That code didn’t work. Try again.");
      return;
    }
    setOtpError("");
    setChecking(true);
    Keyboard.dismiss();
    const result = await verifyOtp(email.trim(), otp.trim());
    setChecking(false);
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
      setOtpError("That code didn’t work. Try again.");
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
  const buttonBackgroundColor = buttonColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#3D841E", "#2A5C14"],
  });

  const handleButtonPressIn = useCallback(() => {
    if (!buttonActive || loading || checking) return;
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 60,
        bounciness: 0,
      }),
      Animated.spring(buttonColorAnim, {
        toValue: 1,
        useNativeDriver: false,
        speed: 60,
        bounciness: 0,
      }),
    ]).start();
  }, [buttonActive, buttonColorAnim, buttonScale, checking, loading]);

  const handleButtonPressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 5,
      }),
      Animated.spring(buttonColorAnim, {
        toValue: 0,
        useNativeDriver: false,
        speed: 30,
        bounciness: 0,
      }),
    ]).start();
  }, [buttonColorAnim, buttonScale]);

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
                {step === "email" ? "Create your account" : "Almost there"}
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
                  {"\n\n"}Enter the code to continue.
                </Text>
              )}
            </View>

            {/* Input section */}
            <View
              style={[
                s.inputSection,
                { marginTop: step === "otp" ? 18 : 48 },
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
                      Use the email you want linked to your free computer.
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
                      setResendSent(false);
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
                    <Text style={s.resendLabel}>Didn’t get it? </Text>
                    {resendSent ? (
                      <Text style={s.resendTimer}>New code sent.</Text>
                    ) : resendTimer > 0 ? (
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
                    <EditIcon width={14} height={14} color="#888" />
                    <Text style={s.editText}>Edit email</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Pressable
                style={s.pressable}
                onPress={step === "email" ? handleRequestOtp : handleVerifyOtp}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={!buttonActive || loading || checking}
              >
                <Animated.View
                  style={[
                    s.buttonScale,
                    { transform: [{ scale: buttonScale }] },
                  ]}
                >
                  <LinearGradient
                    colors={
                      buttonActive
                        ? ["#7ED957", "#1A4D09"]
                        : ["#D0D0D0", "#D0D0D0"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={s.buttonBorder}
                  >
                    <Animated.View
                      style={[
                        s.button,
                        {
                          backgroundColor: buttonActive
                            ? buttonBackgroundColor
                            : "#D0D0D0",
                        },
                      ]}
                    >
                      {checking ? (
                        step === "otp" ? (
                          <Text style={s.buttonText}>Checking…</Text>
                        ) : (
                          <ActivityIndicator color="#fff" />
                        )
                      ) : loading && step === "email" ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={s.buttonText}>Continue</Text>
                      )}
                    </Animated.View>
                  </LinearGradient>
                </Animated.View>
              </Pressable>

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
    alignItems: "flex-start",
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
    lineHeight: 32,
    color: "#000000",
    textAlign: "left",
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 17,
    color: "#000",
    textAlign: "left",
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  subtitleEmail: {
    fontFamily: SFPro.semiBold,
    color: "#111",
  },
  inputSection: {
    paddingHorizontal: 24,
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
    width: "100%",
    gap: 10,
  },
  otpCell: {
    flex: 1,
    height: 50,
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
    paddingBottom: 12,
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
    fontFamily: SFPro.regular,
    fontSize: 14,
    color: "#888",
  },
  resendLink: {
    fontFamily: SFPro.regular,
    fontSize: 14,
    color: "#3D841E",
    textDecorationLine: "underline",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  editText: {
    fontFamily: SFPro.regular,
    fontSize: 14,
    color: "#000",
    textDecorationLine: "underline",
  },
  pressable: {
    width: "100%",
  },
  buttonScale: {
    width: "100%",
  },
  buttonBorder: {
    width: "100%",
    borderRadius: 25,
    borderCurve: "continuous",
    padding: 2,
  },
  button: {
    height: 46,
    borderRadius: 23,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "500",
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
