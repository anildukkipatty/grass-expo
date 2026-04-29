import { isSandboxUsageLimitError } from "@/api/client";
import { heartbeat, requestContainer, signedPreviewUrl } from "@/api/containers";
import { posthog } from "@/constants/posthog";
import { SFPro } from "@/constants/theme";
import { getToken, getUser } from "@/store/auth-store";
import { getVmName } from "@/store/vm-metadata-store";
import { notifyGrassSandboxUsageLimitHit, notifyGrassVmReady } from "@/store/grass-vm-events";
import { saveVmUrl } from "@/store/url-store";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const ITEM_DELAY_MS = 1500;
// Show retry option if provisioning takes longer than 15s
const PROVISION_TIMEOUT_MS = 2000;
// Cooldown before retry button becomes active again
const RETRY_COOLDOWN_S = 15;

function truncateWithEllipsis(value: string, maxChars = 13) {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(maxChars - 1, 0))}…`;
}

export default function VmFinalScreen() {
  const router = useRouter();
  const { vmName: vmNameParam } = useLocalSearchParams<{ vmName: string }>();
  const [name, setName] = useState(vmNameParam || "Your VM");

  useEffect(() => {
    if (vmNameParam) return;
    getVmName().then((stored) => { if (stored) setName(stored); });
  }, [vmNameParam]);

  const ANIMATED_ITEMS = [
    `Setting up ${name}'s workspace`,
    "Starting the container",
    "Establishing a secure connection",
    "Running a quick health check",
  ];
  const FINAL_ITEM = `${name} is ready for work`;
  const overlayName = truncateWithEllipsis(name, 13);

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
        <View style={styles.illustrationContainer}>
          <Image
            source={require("@/assets/images/new-design/onboarding/vm-illustration.png")}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
          />
        </View>

        <View style={styles.vmNameOverlayWrapper} pointerEvents="none">
          <Text style={[styles.vmNameOverlay, styles.vmNameShadow]}>{overlayName}</Text>
          <Text style={[styles.vmNameOverlay, styles.vmNameHighlight]}>{overlayName}</Text>
          <Text style={styles.vmNameOverlay}>{overlayName}</Text>
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
    top: -8,
    height: SCREEN_HEIGHT * 0.56,
  },
  vmNameOverlayWrapper: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.235,
    left: SCREEN_WIDTH * 0.415,
    width: 98,
    transform: [{ rotate: "28deg" }, { skewX: "-30deg" }, { scaleY: 0.87 }],
    alignItems: "center",
    justifyContent: "center",
  },
  vmNameOverlay: {
    position: "absolute",
    fontFamily: SFPro.condensedBold,
    fontSize: 19,
    color: "#D2D2D1",
    letterSpacing: -0.5,
    lineHeight: 19,
    textAlign: "center",
    opacity: 1,
  },
  vmNameShadow: {
    color: "#5A5A58",
    opacity: 0.5,
    transform: [{ translateX: 0.85 }, { translateY: 1.2 }],
  },
  vmNameHighlight: {
    color: "#FFFFFF",
    opacity: 0.8,
    transform: [{ translateX: -0.85 }, { translateY: -0.8 }],
  },
  gradientOverlay: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.76,
    justifyContent: "flex-end",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 10,
  },
  safeContent: {
    width: "100%",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    alignItems: "center",
  },
  statusList: {
    width: "100%",
    gap: 14,
    marginBottom: 28,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#3D841E",
    marginTop: 4,
    flexShrink: 0,
  },
  statusText: {
    fontFamily: SFPro.semiBold,
    fontSize: 18,
    color: "#000",
    lineHeight: 25,
    letterSpacing: -0.4,
    flex: 1,
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
    shadowColor: "#2E6E16",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  button: {
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    height: 56,
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
