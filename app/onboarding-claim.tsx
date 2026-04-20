import AiAgentIcon from "@/assets/images/new-design/onboarding/ai-agent.svg";
import GiftIcon from "@/assets/images/new-design/onboarding/gift.svg";
import LaptopIcon from "@/assets/images/new-design/onboarding/laptop-window.svg";
import LogoIcon from "@/assets/images/new-design/onboarding/logo.svg";
import MobileIcon from "@/assets/images/new-design/onboarding/mobile-icon.svg";
import SecretIcon from "@/assets/images/new-design/onboarding/secret.svg";
import VmIcon from "@/assets/images/new-design/onboarding/vm-icon.svg";
import { OnboardingAuthSheet } from "@/components/OnboardingAuthSheet";
import { SFPro } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top row: gift icon + terms/privacy */}
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
              onPress={() => Linking.openURL("http://codeongrass.com/privacy")}
            >
              Privacy
            </Text>
          </View>
        </View>

        {/* Header */}
        <Text style={styles.heading}>
          10 hours of free compute.{"\n"}
          Every month. No card needed.
        </Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURE_ITEMS.map(({ IconComponent, label }, i) => (
            <View key={i} style={styles.featureItem}>
              <IconComponent width={20} height={20} />
              <Text style={styles.featureLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Image
            source={require("@/assets/images/new-design/onboarding/claim-card.png")}
            style={styles.cardImage}
            resizeMode="cover"
          />
          {/* Base dark gradient (image fallback with lightgray) */}
          <LinearGradient
            colors={["#000000", "#000"]}
            start={{ x: 1, y: 1 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Metallic top layer */}
          <LinearGradient
            colors={["#C6C6C6", "#838282", "#C6C6C6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}
          />
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.cardSubtitle}>10 hours of VM compute</Text>
              <Text style={styles.cardSubtitle}>No credit card. No catch.</Text>
            </View>
            <LogoIcon width={53} height={30} />
          </View>
          <Text style={styles.cardTitle}>10h free/month</Text>
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() => setAuthVisible(true)}
        >
          <Text style={styles.buttonText}>Claim and Setup your VM</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
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
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C6C6C6",
    shadowColor: "#606060",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    padding: 30,
    marginBottom: 60,
    marginTop: 60,
    overflow: "hidden",
    height: 227,
    display: "flex",
    justifyContent: "space-between",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  cardSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#808080",
    lineHeight: 18,
  },
  cardTitle: {
    fontFamily: SFPro.displayBold,
    fontSize: 28,
    color: "#fff",
    letterSpacing: -0.5,
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
