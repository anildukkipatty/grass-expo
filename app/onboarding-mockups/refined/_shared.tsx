import { SFPro } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

export const GREEN = "#3D841E";
export const GREEN_PRESSED = "#316717";
export const TEXT = "#0E0E12";
export const TEXT_DIM = "#6E6E73";
export const SURFACE = "#F2F2F7";
export const HAIRLINE = "#E5E5EA";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function ExitButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={ss.exit}
      onPress={() => router.replace("/onboarding-mockups" as any)}
      hitSlop={12}
    >
      <Text style={ss.exitText}>×</Text>
    </TouchableOpacity>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }, [disabled, loading, onPress]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[ss.primary, disabled && ss.primaryDisabled]}
      >
        <Text style={[ss.primaryText, disabled && ss.primaryTextDisabled]}>
          {loading ? "…" : label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export type AuthSheetHandle = {
  open: () => void;
  close: () => void;
};

type AuthSheetProps = {
  onSuccess: () => void;
};

export const AuthSheet = forwardRef<AuthSheetHandle, AuthSheetProps>(
  function AuthSheet({ onSuccess }, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const [step, setStep] = useState<"email" | "otp">("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [emailErr, setEmailErr] = useState("");
    const [otpErr, setOtpErr] = useState("");
    const [loading, setLoading] = useState(false);
    const otpInputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
      open: () => {
        setStep("email");
        setEmail("");
        setOtp("");
        setEmailErr("");
        setOtpErr("");
        sheetRef.current?.present();
      },
      close: () => sheetRef.current?.dismiss(),
    }));

    const handleSendCode = useCallback(() => {
      if (!isValidEmail(email)) {
        setEmailErr("Enter a valid email address.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }
      setEmailErr("");
      setLoading(true);
      Keyboard.dismiss();
      setTimeout(() => {
        setLoading(false);
        setStep("otp");
        setTimeout(() => otpInputRef.current?.focus(), 200);
      }, 600);
    }, [email]);

    const handleVerify = useCallback(() => {
      if (otp.trim().length !== 6) {
        setOtpErr("Enter the full 6-digit code.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }
      setOtpErr("");
      setLoading(true);
      Keyboard.dismiss();
      setTimeout(() => {
        setLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        sheetRef.current?.dismiss();
        setTimeout(onSuccess, 200);
      }, 500);
    }, [otp, onSuccess]);

    const emailValid = isValidEmail(email);
    const otpComplete = otp.trim().length === 6;
    const ctaActive = step === "email" ? emailValid : otpComplete;

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={["75%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={ss.sheetBg}
        handleIndicatorStyle={ss.handle}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.4}
          />
        )}
      >
        <BottomSheetView style={ss.sheetBody}>
            <Text style={ss.sheetEyebrow}>
              {step === "email" ? "STEP 1 OF 2" : "STEP 2 OF 2"}
            </Text>
            <Text style={ss.sheetTitle}>
              {step === "email" ? "Sign in or create an account" : "Enter your code"}
            </Text>
            <Text style={ss.sheetSubtitle}>
              {step === "email"
                ? "We'll email you a 6-digit code. No passwords."
                : `We sent a code to ${email.trim()}.`}
            </Text>

            {step === "email" ? (
              <>
                <View style={[ss.field, emailErr && ss.fieldError]}>
                  <TextInput
                    style={ss.fieldInput}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (emailErr) setEmailErr("");
                    }}
                    placeholder="you@email.com"
                    placeholderTextColor="#C6C6C8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    returnKeyType="send"
                    onSubmitEditing={handleSendCode}
                  />
                </View>
                {emailErr ? (
                  <Text style={ss.errorText}>{emailErr}</Text>
                ) : (
                  <Text style={ss.fieldHint}>
                    By continuing you agree to our Terms and Privacy Policy.
                  </Text>
                )}
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => otpInputRef.current?.focus()}
                  style={ss.otpRow}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        ss.otpCell,
                        otp[i] !== undefined && ss.otpCellFilled,
                        otpErr && ss.otpCellError,
                      ]}
                    >
                      <Text style={ss.otpDigit}>{otp[i] ?? ""}</Text>
                    </View>
                  ))}
                </Pressable>
                <TextInput
                  ref={otpInputRef}
                  style={ss.hidden}
                  value={otp}
                  onChangeText={(t) => {
                    setOtp(t.replace(/\D/g, "").slice(0, 6));
                    if (otpErr) setOtpErr("");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  caretHidden
                />
                {otpErr ? (
                  <Text style={ss.errorText}>{otpErr}</Text>
                ) : (
                  <View style={ss.otpFooter}>
                    <TouchableOpacity onPress={() => setStep("email")}>
                      <Text style={ss.linkText}>Edit email</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Text style={ss.linkText}>Resend code</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            <View style={ss.sheetCta}>
              <PrimaryButton
                label={step === "email" ? "Send code" : "Verify"}
                onPress={step === "email" ? handleSendCode : handleVerify}
                disabled={!ctaActive}
                loading={loading}
              />
            </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const ss = StyleSheet.create({
  exit: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  exitText: {
    color: "#8E8E93",
    fontFamily: SFPro.medium,
    fontSize: 20,
    lineHeight: 22,
  },
  primary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryDisabled: {
    backgroundColor: "#D1D1D6",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  primaryTextDisabled: {
    color: "#8E8E93",
  },

  sheetBg: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    backgroundColor: "#D1D1D6",
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  sheetBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
  },
  sheetCta: {
    marginTop: "auto",
    paddingTop: 16,
  },
  sheetEyebrow: {
    fontFamily: SFPro.semiBold,
    fontSize: 12,
    color: GREEN,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sheetTitle: {
    fontFamily: SFPro.displayBold,
    fontSize: 26,
    color: TEXT,
    letterSpacing: -0.6,
    lineHeight: 30,
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: TEXT_DIM,
    lineHeight: 21,
    marginBottom: 24,
  },
  field: {
    height: 52,
    borderRadius: 12,
    backgroundColor: SURFACE,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  fieldError: {
    borderColor: "#D63031",
    backgroundColor: "#FFF5F5",
  },
  fieldInput: {
    fontFamily: SFPro.regular,
    fontSize: 17,
    color: TEXT,
  },
  fieldHint: {
    fontFamily: SFPro.regular,
    fontSize: 12,
    color: TEXT_DIM,
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 17,
  },
  errorText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#D63031",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  otpRow: {
    flexDirection: "row",
    gap: 8,
  },
  otpCell: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  otpCellFilled: {
    backgroundColor: "#FFFFFF",
    borderColor: GREEN,
  },
  otpCellError: {
    borderColor: "#D63031",
    backgroundColor: "#FFF5F5",
  },
  otpDigit: {
    fontFamily: SFPro.semiBold,
    fontSize: 24,
    color: TEXT,
  },
  hidden: { position: "absolute", width: 1, height: 1, opacity: 0 },
  otpFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 4,
  },
  linkText: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: GREEN,
  },
});
