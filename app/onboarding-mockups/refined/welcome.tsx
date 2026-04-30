import LogoIcon from "@/assets/images/new-design/onboarding/logo.svg";
import { SFPro } from "@/constants/theme";
import { Linking, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useRef } from "react";
import {
  AuthSheet,
  AuthSheetHandle,
  ExitButton,
  GREEN,
  PrimaryButton,
  TEXT,
  TEXT_DIM,
} from "./_shared";

export default function RefinedWelcome() {
  const router = useRouter();
  const authRef = useRef<AuthSheetHandle>(null);

  return (
    <SafeAreaView style={s.safe}>
      <ExitButton />

      <View style={s.body}>
        <View style={s.logoTile}>
          <LogoIcon width={48} height={38} />
        </View>

        <Text style={s.title}>A computer that{"\n"}works while you don't.</Text>
        <Text style={s.subtitle}>
          Get a dedicated cloud VM and let agents handle your tasks —
          even when your laptop is closed.
        </Text>
      </View>

      <View style={s.bottom}>
        <PrimaryButton
          label="Get started"
          onPress={() => router.push("/onboarding-mockups/refined/claim" as any)}
        />
        <TouchableOpacity
          style={s.signInBtn}
          onPress={() => authRef.current?.open()}
        >
          <Text style={s.signInText}>I already have an account</Text>
        </TouchableOpacity>
        <Text style={s.legal}>
          By continuing you agree to our{" "}
          <Text
            style={s.legalLink}
            onPress={() => Linking.openURL("https://codeongrass.com/terms")}
          >
            Terms
          </Text>{" "}
          and{" "}
          <Text
            style={s.legalLink}
            onPress={() => Linking.openURL("https://codeongrass.com/privacy")}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </View>

      <AuthSheet
        ref={authRef}
        onSuccess={() =>
          router.replace("/onboarding-mockups/refined/vm-ready" as any)
        }
      />
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
    justifyContent: "center",
    alignItems: "center",
  },
  logoTile: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    fontFamily: SFPro.displayBold,
    fontSize: 32,
    color: TEXT,
    textAlign: "center",
    letterSpacing: -1,
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: TEXT_DIM,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 14,
  },
  signInBtn: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  signInText: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: GREEN,
  },
  legal: {
    fontFamily: SFPro.regular,
    fontSize: 12,
    color: TEXT_DIM,
    textAlign: "center",
    lineHeight: 17,
    paddingHorizontal: 16,
  },
  legalLink: {
    fontFamily: SFPro.medium,
    color: TEXT,
  },
});
