import { Image } from "expo-image";
import { SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ExitButton } from "./welcome";

const BLUE = "#007AFF";

export default function CupertinoVmReady() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe}>
      <ExitButton />

      <View style={s.imageWrap}>
        <Image
          source={require("@/assets/images/new-design/onboarding/vm-illustration.png")}
          style={s.image}
          contentFit="contain"
        />
      </View>

      <View style={s.body}>
        <View style={s.badge}>
          <View style={s.badgeDot} />
          <Text style={s.badgeText}>Ready to set up</Text>
        </View>
        <Text style={s.title}>Your new computer.</Text>
        <Text style={s.subtitle}>
          Pre-configured with your favorite agents. Set up takes about
          ten seconds.
        </Text>

        <View style={s.specsCard}>
          <Spec label="Processor" value="8 vCPU" />
          <Spec label="Memory" value="16 GB" divider />
          <Spec label="Storage" value="200 GB SSD" divider />
          <Spec label="Network" value="1 Gbps" divider />
        </View>
      </View>

      <View style={s.bottom}>
        <Pressable
          style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
          onPress={() =>
            router.push("/onboarding-mockups/cupertino/vm-name" as any)
          }
        >
          <Text style={s.buttonText}>Set Up</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Spec({
  label,
  value,
  divider,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <View style={[s.specRow, divider && s.specDivider]}>
      <Text style={s.specLabel}>{label}</Text>
      <Text style={s.specValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  imageWrap: {
    height: 280,
    backgroundColor: "#F2F2F7",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "#E5F1FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BLUE,
  },
  badgeText: {
    fontFamily: SFPro.semiBold,
    fontSize: 12,
    color: BLUE,
    letterSpacing: -0.1,
  },
  title: {
    fontFamily: SFPro.displayBold,
    fontSize: 30,
    color: "#000",
    letterSpacing: -0.9,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "#3C3C43",
    lineHeight: 22,
    marginBottom: 22,
  },
  specsCard: {
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
  },
  specDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#C6C6C8",
  },
  specLabel: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "#3C3C43",
  },
  specValue: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#000",
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
