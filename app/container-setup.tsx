import { isSandboxUsageLimitError } from "@/api/client";
import { heartbeat, requestContainer, signedPreviewUrl } from "@/api/containers";
import { NationalPark } from "@/constants/theme";
import { posthog } from "@/constants/posthog";
import { getToken } from "@/store/auth-store";
import { notifyGrassSandboxUsageLimitHit, notifyGrassVmReady } from "@/store/grass-vm-events";
import { saveVmUrl } from "@/store/url-store";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CAROUSEL_CARDS = [
  {
    icon: "🌐",
    title: "Remote Access",
    body: "Connect to your development machine from anywhere in the world.",
  },
  {
    icon: "⚡",
    title: "Always-on VM",
    body: "Your machine runs 24/7. Close the app, the agent keeps working.",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    body: "End-to-end encrypted. Your code stays on your machine.",
  },
];

export default function ContainerSetupScreen() {
  const router = useRouter();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const provisionDone = useRef(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let cancelled = false;

    // Animate progress 0% → 95% over 18s
    const progressTimer = Animated.timing(progressAnim, {
      toValue: 0.95,
      duration: 18000,
      useNativeDriver: false,
    });
    progressTimer.start();

    async function provision() {
      const token = await getToken();
      if (!token || cancelled) return;

      // Check heartbeat first
      const hb = await heartbeat(token);
      if (cancelled) return;

      if (!hb.ok && isSandboxUsageLimitError(hb)) {
        progressTimer.stop();
        notifyGrassSandboxUsageLimitHit();
        router.replace("/(tabs)/home");
        return;
      }

      if (hb.ok && hb.data.container === "running" && hb.data.grass) {
        let previewUrl = hb.data.url;
        if (!previewUrl) {
          const preview = await signedPreviewUrl(token);
          if (preview.ok) previewUrl = preview.data.url;
        }
        provisionDone.current = true;
        finishAndRedirect(previewUrl);
        return;
      }

      // If provisioning, poll heartbeat every 2s for 10s
      if (hb.ok && hb.data.container === "provisioning") {
        const pollStart = Date.now();
        while (Date.now() - pollStart < 10000) {
          await new Promise((r) => setTimeout(r, 2000));
          if (cancelled) return;
          const poll = await heartbeat(token);
          if (cancelled) return;
          if (!poll.ok && isSandboxUsageLimitError(poll)) {
            progressTimer.stop();
            notifyGrassSandboxUsageLimitHit();
            router.replace("/(tabs)/home");
            return;
          }
          if (poll.ok && poll.data.container === "running" && poll.data.grass) {
            let previewUrl = poll.data.url;
            if (!previewUrl) {
              const preview = await signedPreviewUrl(token);
              if (preview.ok) previewUrl = preview.data.url;
            }
            provisionDone.current = true;
            finishAndRedirect(previewUrl);
            return;
          }
          if (poll.ok && poll.data.container !== "provisioning") {
            break;
          }
        }
      }

      if (cancelled) return;

      // Container not running — request/restart it
      const result = await requestContainer(token);
      if (cancelled) return;
      if (result.ok) {
        // For new users, log whether the demo repo was cloned successfully
        if (result.data.demoRepoReady !== undefined) {
          console.log(`[container-setup] demo repo ready: ${result.data.demoRepoReady}`);
        }
        provisionDone.current = true;
        posthog.capture("container_provisioned");
        finishAndRedirect(result.data.url);
      } else {
        progressTimer.stop();
        if (isSandboxUsageLimitError(result)) {
          posthog.capture("container_provision_failed", { reason: "sandbox_limit" });
          notifyGrassSandboxUsageLimitHit();
          router.replace("/(tabs)/home");
        } else {
          posthog.capture("container_provision_failed", { reason: result.error });
          setError(result.error);
        }
      }
    }

    function finishAndRedirect(previewUrl?: string) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        if (!cancelled) {
          void (async () => {
            if (previewUrl) {
              await saveVmUrl(previewUrl);
            }
            notifyGrassVmReady();
            router.replace("/(tabs)/home");
          })();
        }
      });
    }

    provision();

    // Advance carousel automatically
    let idx = 0;
    const cardInterval = setInterval(() => {
      idx = (idx + 1) % CAROUSEL_CARDS.length;
      setActiveIndex(idx);
      flatListRef.current?.scrollToIndex({ index: idx, animated: true });
    }, 2000);

    return () => {
      cancelled = true;
      progressTimer.stop();
      clearInterval(cardInterval);
    };
  }, [router, progressAnim]);

  // Spinner rotation loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  const spinDeg = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(idx);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bannerContainer}>
        <Image
          source={require("@/assets/images/setup/banner.png")}
          style={styles.banner}
          contentFit="fill"
        />
      </View>

      <View style={styles.gradientOverlay} />

      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>{"Starting your\nContainer"}</Text>

        <View style={{ flex: 1, justifyContent: "center" }}>
          <FlatList
            ref={flatListRef}
            data={CAROUSEL_CARDS}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={styles.carouselList}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <View style={styles.card}>
                  <LinearGradient
                    colors={["#00FF40", "#E0FF47"]}
                    start={{ x: 0.28, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardIconGradient}
                  >
                    <Image
                      source={require("@/assets/images/setup/tabler-power.png")}
                      style={styles.cardIcon}
                      contentFit="contain"
                    />
                  </LinearGradient>

                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardBody}>{item.body}</Text>
                  </View>
                </View>
              </View>
            )}
          />

          <View style={styles.dotsRow}>
            {CAROUSEL_CARDS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.bottomArea}>
          {error ? (
            <Text
              style={[
                styles.statusText,
                { color: "#ef4444", textAlign: "center" },
              ]}
            >
              {error}
            </Text>
          ) : (
            <>
              <View style={styles.statusRow}>
                <Animated.Text
                  style={[
                    styles.spinnerIcon,
                    { transform: [{ rotate: spinDeg }] },
                  ]}
                >
                  ✳
                </Animated.Text>
                <Text style={styles.statusText}>
                  Waking up your container...
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[styles.progressFill, { width: progressWidth }]}
                />
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    fontFamily: NationalPark.regular,
  },
  bannerContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#D3D3D3",
    overflow: "hidden",
  },
  banner: {
    position: "absolute",
    left: 0,
    top: -263.316,
    width: "100%",
    height: "142.509%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    color: "#2E2E2E",
    letterSpacing: -1,
    lineHeight: 40,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 32,
    fontFamily: NationalPark.bold,
  },
  carouselList: {
    height: 120,
    flexGrow: 0,
  },
  cardWrapper: {
    width: SCREEN_WIDTH,
    height: 120,
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.60)",
    borderRadius: 20,
    borderColor: "#DCDCDC",
    borderWidth: 1,
    padding: 16,
    gap: 14,
    flex: 1,
    overflow: "hidden",
  },

  cardIconGradient: {
    padding: 10,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: "#00CC33",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: "rgba(0, 255, 38, 1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  cardIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
    fontFamily: NationalPark.bold,
  },
  cardBody: {
    fontSize: 14,
    color: "#000",
    lineHeight: 19,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderColor: "#000",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  dotActive: {
    backgroundColor: "#000",
    width: 7,
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  spinnerIcon: {
    fontSize: 18,
    color: "#7FE63A",
  },
  statusText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7FE63A",
    borderRadius: 4,
  },
});
