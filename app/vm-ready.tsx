import { SFPro } from "@/constants/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VmReadyScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Full-screen illustration */}
        <Image
          source={require("@/assets/images/new-design/onboarding/vm-illustration.png")}
          style={styles.illustration}
          contentFit="contain"
        />

        {/* Gradient + content overlaid at the bottom of the image */}
        <LinearGradient
          colors={["rgba(247, 255, 243, 0.00)", "#F7FFF3"]}
          locations={[0, 0.45]}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safeContent}>
            <View style={styles.content}>
              {/* Ready to provision badge */}
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <View style={styles.dot} />
                  <Text style={styles.badgeText}>Ready to provision</Text>
                </View>
              </View>

              <Text style={styles.title}>Meet your new{"\n"}computer.</Text>
              <Text style={styles.subtitle}>
                Your dedicated VM is ready.{"\n"}Always available, waiting for
                your
                {"\n"}first message.
              </Text>

              {/* Give them a name button */}
              <View style={styles.buttonShadowWrap}>
                <TouchableOpacity
                  style={styles.button}
                  activeOpacity={0.85}
                  onPress={() => router.push("/vm-name" as any)}
                >
                  <Text style={styles.buttonText}>Give them a name</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FFF3",
  },
  illustration: {
    position: "absolute",
    left: SCREEN_WIDTH * 0.2,
    right: SCREEN_WIDTH * 0.2,
    height: SCREEN_HEIGHT * 0.65,
    bottom: 102,
  },
  gradientOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    height: SCREEN_HEIGHT * 0.55,
    justifyContent: "flex-end",
    borderRadius: 24,
    overflow: "hidden",
  },
  safeContent: {
    width: "100%",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: "center",
  },
  badgeRow: {
    marginBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#295E13",
    backgroundColor: "#123005",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C3F6AD",
  },
  badgeText: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#fff",
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    color: "#000000",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 17,
    color: "#404040",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
  },
  buttonShadowWrap: {
    width: "100%",
    borderRadius: 50,
    elevation: 12,
  },
  button: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#295E13",
    backgroundColor: "#123005",
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#DFDFDF",
    lineHeight: 22,
    letterSpacing: -0.5,
  },
});
