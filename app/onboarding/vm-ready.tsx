import { SFPro } from "@/constants/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VmReadyScreen() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#3D841E", "#2A5C14"],
  });

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 0 }),
      Animated.spring(colorAnim, { toValue: 1, useNativeDriver: false, speed: 60, bounciness: 0 }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 5 }),
      Animated.spring(colorAnim, { toValue: 0, useNativeDriver: false, speed: 30, bounciness: 0 }),
    ]).start();
  };

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
          colors={["#ffffff30", "#ffffff30"]}
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
              <Pressable
                style={styles.pressable}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={() => router.push("/onboarding/vm-name" as any)}
              >
                <Animated.View style={[styles.buttonShadowWrap, { transform: [{ scale }] }]}>
                  <LinearGradient
                    colors={["#7ED957", "#1A4D09"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.buttonBorder}
                  >
                    <Animated.View style={[styles.button, { backgroundColor }]}>
                      <Text style={styles.buttonText}>Give them a name</Text>
                    </Animated.View>
                  </LinearGradient>
                </Animated.View>
              </Pressable>
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
    left: SCREEN_WIDTH * 0,
    right: SCREEN_WIDTH * 0,
    height: SCREEN_HEIGHT * 1.3,
    bottom: 0,
  },
  gradientOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    height: SCREEN_HEIGHT * 0.5,
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
    lineHeight: 20,
    color: "#fff",
  },
  title: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    color: "#000000",
    textAlign: "center",
    lineHeight: 32,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 17,
    color: "#000",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  pressable: {
    marginTop: 24,
    width: "100%",
  },
  buttonShadowWrap: {
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
});
