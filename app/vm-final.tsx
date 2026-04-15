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

const STATUS_ITEMS = [
  "Setting up Son of Anton's workspace",
  "Installing tools",
  "Connecting to Opencode",
  "Running a quick health check",
  "Son of Anton is ready for work",
];

export default function VmFinalScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Full-screen illustration */}
        <Image
          source={require("@/assets/images/new-design/onboarding/final-vm.png")}
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
              {/* Status list */}
              <View style={styles.statusList}>
                {STATUS_ITEMS.map((item, index) => (
                  <View key={index} style={styles.statusRow}>
                    <View style={styles.dot} />
                    <Text style={styles.statusText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Assign their first task button */}
              <View style={styles.buttonShadowWrap}>
                <TouchableOpacity
                  style={styles.button}
                  activeOpacity={0.85}
                  onPress={() => router.push("/vm-first-task" as any)}
                >
                  <Text style={styles.buttonText}>Assign their first task</Text>
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
    backgroundColor: "#fff",
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
  statusList: {
    width: "100%",
    gap: 12,
    marginBottom: 36,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3D841E",
  },
  statusText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
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
