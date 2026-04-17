import { SFPro } from "@/constants/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ITEM_DELAY_MS = 600;

export default function VmFinalScreen() {
  const router = useRouter();
  const { vmName } = useLocalSearchParams<{ vmName: string }>();
  const name = vmName || "Your VM";

  const STATUS_ITEMS = [
    `Setting up ${name}'s workspace`,
    "Installing tools",
    "Connecting to Opencode",
    "Running a quick health check",
    `${name} is ready for work`,
  ];

  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < STATUS_ITEMS.length) {
      const timer = setTimeout(() => {
        setVisibleCount((c) => c + 1);
      }, ITEM_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [visibleCount]);

  const allDone = visibleCount >= STATUS_ITEMS.length;

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
              {/* Status list — items appear one by one */}
              <View style={styles.statusList}>
                {STATUS_ITEMS.map((item, index) =>
                  index < visibleCount ? (
                    <View key={index} style={styles.statusRow}>
                      <View style={styles.dot} />
                      <Text style={styles.statusText}>{item}</Text>
                    </View>
                  ) : null,
                )}
              </View>

              {/* Assign their first task button — shown only after all items */}
              {allDone && (
                <View style={styles.buttonShadowWrap}>
                  <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: "/vm-first-task" as any,
                        params: { vmName: name },
                      })
                    }
                  >
                    <Text style={styles.buttonText}>
                      Assign their first task
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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
    paddingHorizontal: 16,
    // paddingBottom: 48,
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
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#f2f2f2",
    lineHeight: 22,
    letterSpacing: -0.5,
  },
});
