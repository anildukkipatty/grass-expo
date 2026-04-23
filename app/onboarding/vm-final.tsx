import { isSandboxUsageLimitError } from "@/api/client";
import { heartbeat, requestContainer, signedPreviewUrl } from "@/api/containers";
import { posthog } from "@/constants/posthog";
import { SFPro } from "@/constants/theme";
import { getToken, getUser } from "@/store/auth-store";
import { notifyGrassSandboxUsageLimitHit, notifyGrassVmReady } from "@/store/grass-vm-events";
import { saveVmUrl } from "@/store/url-store";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ITEM_DELAY_MS = 700;
// Show retry option if provisioning takes longer than 15s
const PROVISION_TIMEOUT_MS = 15000;
// Cooldown before retry button becomes active again
const RETRY_COOLDOWN_S = 15;

export default function VmFinalScreen() {
  const router = useRouter();
  const { vmName } = useLocalSearchParams<{ vmName: string }>();
  const name = vmName || "Your VM";

  const ANIMATED_ITEMS = [
    `Setting up ${name}'s workspace`,
    "Installing tools",
    "Connecting to Opencode",
    "Running a quick health check",
  ];
  const FINAL_ITEM = `${name} is ready for work`;

  const [visibleCount, setVisibleCount] = useState(0);
  const [provisioned, setProvisioned] = useState(false);
  const [serverUrl, setServerUrl] = useState<string | undefined>(undefined);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retrySecondsLeft, setRetrySecondsLeft] = useState(0);

  const provisionDone = useRef(false);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  // Animate items 1–4 freely, independent of API state
  useEffect(() => {
    if (visibleCount < ANIMATED_ITEMS.length) {
      const timer = setTimeout(() => setVisibleCount((c) => c + 1), ITEM_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [visibleCount]);

  // Provision container — mirrors container-setup.tsx logic exactly
  useEffect(() => {
    let cancelled = false;
    provisionDone.current = false;

    // Show retry hint if still waiting after 15s
    const timeoutTimer = setTimeout(() => {
      if (!provisionDone.current && !cancelled) setTimedOut(true);
    }, PROVISION_TIMEOUT_MS);

    async function provision() {
      const token = await getToken();
      if (!token || cancelled) return;

      // 1. Heartbeat — container may already be running
      const hb = await heartbeat(token);
      if (cancelled) return;

      if (!hb.ok && isSandboxUsageLimitError(hb)) {
        notifyGrassSandboxUsageLimitHit();
        router.replace("/new-navbar/(tabs)" as any);
        return;
      }

      if (hb.ok && hb.data.container === "running" && hb.data.grass) {
        let previewUrl = hb.data.url;
        if (!previewUrl) {
          const preview = await signedPreviewUrl(token);
          if (preview.ok) previewUrl = preview.data.url;
        }
        await finishAndRedirect(previewUrl);
        return;
      }

      // 2. Container provisioning in progress — poll every 2s for up to 10s
      if (hb.ok && hb.data.container === "provisioning") {
        const pollStart = Date.now();
        while (Date.now() - pollStart < 10000) {
          await new Promise((r) => setTimeout(r, 2000));
          if (cancelled) return;
          const poll = await heartbeat(token);
          if (cancelled) return;
          if (!poll.ok && isSandboxUsageLimitError(poll)) {
            notifyGrassSandboxUsageLimitHit();
            router.replace("/new-navbar/(tabs)" as any);
            return;
          }
          if (poll.ok && poll.data.container === "running" && poll.data.grass) {
            let previewUrl = poll.data.url;
            if (!previewUrl) {
              const preview = await signedPreviewUrl(token);
              if (preview.ok) previewUrl = preview.data.url;
            }
            await finishAndRedirect(previewUrl);
            return;
          }
          if (poll.ok && poll.data.container !== "provisioning") break;
        }
      }

      if (cancelled) return;

      // 3. Container stopped / not found — request / restart it
      const result = await requestContainer(token);
      if (cancelled) return;

      if (result.ok) {
        if (result.data.demoRepoReady !== undefined) {
          console.log(`[vm-final] demo repo ready: ${result.data.demoRepoReady}`);
        }
        posthog.capture("container_provisioned");
        await finishAndRedirect(result.data.url);
      } else {
        if (isSandboxUsageLimitError(result)) {
          posthog.capture("container_provision_failed", { reason: "sandbox_limit" });
          notifyGrassSandboxUsageLimitHit();
          router.replace("/new-navbar/(tabs)" as any);
        } else {
          posthog.capture("container_provision_failed", { reason: result.error });
          setProvisionError(result.error);
        }
      }
    }

    async function finishAndRedirect(previewUrl?: string) {
      if (cancelled) return;
      if (previewUrl) await saveVmUrl(previewUrl);
      notifyGrassVmReady();
      provisionDone.current = true;

      const user = await getUser();
      if (cancelled) return;

      // Old user — skip first-task screen, go straight to dashboard
      if (user?.userType === "old") {
        router.replace("/new-navbar/(tabs)" as any);
        return;
      }

      // New user — show 5th status item then "Assign first task" button
      posthog.capture("vm_provisioned", { vm_name: name });
      setServerUrl(previewUrl);
      setProvisioned(true);
    }

    provision();

    return () => {
      cancelled = true;
      clearTimeout(timeoutTimer);
    };
  }, [retryCount]);

  const handleRetry = () => {
    setProvisionError(null);
    setTimedOut(false);
    setRetryCount((c) => c + 1);

    // 15s cooldown so retry can't be spammed
    setRetrySecondsLeft(RETRY_COOLDOWN_S);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      setRetrySecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(cooldownIntervalRef.current!);
          cooldownIntervalRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const showFinalItem = visibleCount >= ANIMATED_ITEMS.length && provisioned;
  const allDone = showFinalItem;
  const waitingForApi = visibleCount >= ANIMATED_ITEMS.length && !provisioned && !provisionError;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Full-screen illustration with name overlay */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require("@/assets/images/new-design/onboarding/vm-illustration.png")}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
          />
          <View style={styles.vmNameOverlayWrapper}>
            <Text style={styles.vmNameOverlay}>
              {name.length > 9 ? name.slice(0, 9) + "..." : name}
            </Text>
          </View>
        </View>

        <LinearGradient
          colors={["#ffffff30", "#ffffff30"]}
          locations={[0, 0.45]}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safeContent}>
            <View style={styles.content}>
              {provisionError ? (
                /* Error state */
                <View style={styles.errorWrap}>
                  <Text style={styles.errorText}>{provisionError}</Text>
                  <TouchableOpacity
                    style={[
                      styles.retryButton,
                      retrySecondsLeft > 0 && styles.retryButtonDisabled,
                    ]}
                    activeOpacity={0.85}
                    onPress={handleRetry}
                    disabled={retrySecondsLeft > 0}
                  >
                    <Text style={styles.retryButtonText}>
                      {retrySecondsLeft > 0 ? `Retry (${retrySecondsLeft}s)` : "Retry"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.statusList}>
                    {/* Items 1–4: animate freely */}
                    {ANIMATED_ITEMS.map((item, index) =>
                      index < visibleCount ? (
                        <View key={index} style={styles.statusRow}>
                          <View style={styles.dot} />
                          <Text style={styles.statusText}>{item}</Text>
                        </View>
                      ) : null,
                    )}

                    {/* Spinner while API is still in flight after item 4 */}
                    {waitingForApi && (
                      <ActivityIndicator
                        size="small"
                        color="#3D841E"
                        style={styles.spinner}
                      />
                    )}

                    {/* Timeout hint + retry shown alongside spinner after 15s */}
                    {timedOut && waitingForApi && (
                      <View style={styles.timeoutRow}>
                        <Text style={styles.timeoutText}>
                          This is taking longer than expected.
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.retryButton,
                            retrySecondsLeft > 0 && styles.retryButtonDisabled,
                          ]}
                          onPress={handleRetry}
                          disabled={retrySecondsLeft > 0}
                        >
                          <Text style={styles.retryButtonText}>
                            {retrySecondsLeft > 0
                              ? `Retry (${retrySecondsLeft}s)`
                              : "Retry"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Item 5: only after API succeeds */}
                    {showFinalItem && (
                      <View style={styles.statusRow}>
                        <View style={styles.dot} />
                        <Text style={styles.statusText}>{FINAL_ITEM}</Text>
                      </View>
                    )}
                  </View>

                  {allDone && (
                    <View style={styles.buttonShadowWrap}>
                      <TouchableOpacity
                        style={styles.button}
                        activeOpacity={0.85}
                        onPress={() =>
                          router.push({
                            pathname: "/onboarding/vm-first-task" as any,
                            params: { vmName: name, serverUrl: serverUrl ?? "" },
                          })
                        }
                      >
                        <Text style={styles.buttonText}>
                          Assign their first task
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
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
  illustrationContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 1.3,
    bottom: 0,
  },
  vmNameOverlayWrapper: {
    position: "absolute",
    top: "47%",
    left: "10%",
    right: "-5%",
    transform: [{ rotate: "30deg" }],
  },
  vmNameOverlay: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#d2d2d1",
    letterSpacing: -0.5,
    lineHeight: 22,
    textAlign: "center",
    textShadowColor: "rgba(255, 255, 255, 0.6)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  gradientOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    height: SCREEN_HEIGHT * 0.42,
    justifyContent: "flex-end",
    borderRadius: 24,
    overflow: "hidden",
  },
  safeContent: {
    width: "100%",
  },
  content: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  statusList: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
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
  spinner: {
    alignSelf: "flex-start",
    marginLeft: 10,
  },
  timeoutRow: {
    width: "100%",
    gap: 10,
    alignItems: "flex-start",
  },
  timeoutText: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: "#841E1E",
    lineHeight: 20,
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
  errorWrap: {
    width: "100%",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  errorText: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#841E1E",
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    height: 48,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonDisabled: {
    opacity: 0.45,
  },
  retryButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#f2f2f2",
    letterSpacing: -0.3,
  },
});
