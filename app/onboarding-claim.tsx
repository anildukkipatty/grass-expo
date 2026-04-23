import AiAgentIcon from "@/assets/images/new-design/onboarding/ai-agent.svg";
import GiftIcon from "@/assets/images/new-design/onboarding/gift.svg";
import LaptopIcon from "@/assets/images/new-design/onboarding/laptop-window.svg";
import LogoIcon from "@/assets/images/new-design/onboarding/logo.svg";
import MobileIcon from "@/assets/images/new-design/onboarding/mobile-icon.svg";
import SecretIcon from "@/assets/images/new-design/onboarding/secret.svg";
import VmIcon from "@/assets/images/new-design/onboarding/vm-icon.svg";
import { OnboardingAuthSheet } from "@/components/OnboardingAuthSheet";
import { SFPro } from "@/constants/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FEATURE_ITEMS = [
  {
    IconComponent: VmIcon,
    label: "Dedicated cloud VM, always available",
  },
  {
    IconComponent: LaptopIcon,
    label: "Run agents without opening your laptop",
  },
  {
    IconComponent: MobileIcon,
    label: "Monitor and control from your phone",
  },
  {
    IconComponent: AiAgentIcon,
    label: "Works with Claude, GPT, and more",
  },
  {
    IconComponent: SecretIcon,
    label: "Your code stays yours",
  },
];

export default function OnboardingClaimScreen() {
  const router = useRouter();
  const [authVisible, setAuthVisible] = useState(false);

  const handleVerified = (_type: "new" | "old") => {
    router.replace("/vm-ready" as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top section */}
        <View>
          <View style={styles.topRow}>
            <GiftIcon width={28} height={28} color="#000" />
            <View style={styles.topLinks}>
              <Text
                style={styles.topLink}
                onPress={() => Linking.openURL("https://codeongrass.com/terms")}
              >
                Terms
              </Text>
              <Text
                style={styles.topLink}
                onPress={() =>
                  Linking.openURL("http://codeongrass.com/privacy")
                }
              >
                Privacy
              </Text>
            </View>
          </View>

          <Text style={styles.heading}>
            10 hours of free compute.{"\n"}
            Every month. No card needed.
          </Text>

          <View style={styles.featureList}>
            {FEATURE_ITEMS.map(({ IconComponent, label }, i) => (
              <View key={i} style={styles.featureItem}>
                <IconComponent width={20} height={20} />
                <Text style={styles.featureLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Card — flex: 1 wrapper centers it with equal gap above and below */}
        <View style={styles.cardWrapper}>
          <View style={styles.card}>
            <Image
              source={require("@/assets/images/new-design/onboarding/claim-card.png")}
              style={styles.cardImage}
              resizeMode="cover"
            />

            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.cardSubtitle}>
                    10 hours of VM compute
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    No credit card. No catch.
                  </Text>
                </View>
                <LogoIcon width={53} height={30} />
              </View>
              <Text style={styles.cardTitle}>10h free/month</Text>
            </View>
          </View>
        </View>

        {/* CTA button — pinned at bottom */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() => setAuthVisible(true)}
        >
          <Text style={styles.buttonText}>Claim and Setup your VM</Text>
        </TouchableOpacity>
      </View>

      <OnboardingAuthSheet
        visible={authVisible}
        onClose={() => setAuthVisible(false)}
        onVerified={handleVerified}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  topLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
  },
  topLink: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#000",
  },
  heading: {
    fontFamily: SFPro.bold,
    fontSize: 25,
    color: "#000",
    lineHeight: 32,
    marginBottom: 20,
  },
  featureList: {
    gap: 8,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureLabel: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#000",
    flex: 1,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: "center",
    shadowColor: "#606060",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 18,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.75)",

    height: 227,
    width: "100%",
  },
  cardContent: {
    flex: 1,
    padding: 30,
    justifyContent: "space-between",
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    height: 227,
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#C6C6C6",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardSubtitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
  },
  cardTitle: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    color: "#fff",
    lineHeight: 32,
  },
  button: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    height: 52,
    width: "100%",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
  },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#fff",
    letterSpacing: -0.5,
  },
});
