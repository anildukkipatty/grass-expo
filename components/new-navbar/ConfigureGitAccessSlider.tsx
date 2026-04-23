import { BlurView } from "expo-blur";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import GithubIcon from "@/assets/images/new-design/connect-more/github.svg";
import LogoIcon from "@/assets/images/new-design/connect-more/logo.svg";
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";

import { githubOauthDisconnect, githubOauthStart, githubOauthStatus } from "@/api/github";
import { posthog } from "@/constants/posthog";
import { SFPro } from "@/constants/theme";
import { getToken } from "@/store/auth-store";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CLOSE_THRESHOLD = 80;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ConfigureGitAccessSlider({ visible, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [isLoading, setIsLoading] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const githubFlowActive = useRef(false);

  // ─── Sheet animation ──────────────────────────────────────────────────────

  const open = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [translateY, backdropOpacity]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onClose());
  }, [translateY, backdropOpacity, onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => { if (gs.dy > 0) translateY.setValue(gs.dy); },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > CLOSE_THRESHOLD || gs.vy > 0.5) {
          close();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
        }
      },
    }),
  ).current;

  // ─── Init: check status on open ──────────────────────────────────────────

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(SCREEN_HEIGHT);
    setGithubConnected(false);
    setGithubLogin(null);
    setIsConnecting(false);
    setIsDisconnecting(false);
    githubFlowActive.current = false;
    setIsLoading(true);
    open();

    void (async () => {
      const token = await getToken();
      if (token) {
        const res = await githubOauthStatus(token);
        if (res.ok) {
          setGithubConnected(Boolean(res.data.connected));
          setGithubLogin(res.data.githubLogin ?? null);
        }
      }
      setIsLoading(false);
    })();
  }, [visible, open, translateY]);

  // ─── AppState listener: check status when returning from browser ─────────

  useEffect(() => {
    if (!visible) return;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" || !githubFlowActive.current) return;
      void (async () => {
        const token = await getToken();
        if (!token) return;
        const statusRes = await githubOauthStatus(token);
        if (statusRes.ok && statusRes.data.connected) {
          posthog.capture("github_connected", { github_login: statusRes.data.githubLogin ?? "" });
          setGithubConnected(true);
          setGithubLogin(statusRes.data.githubLogin ?? null);
          githubFlowActive.current = false;
          Alert.alert("GitHub connected", "Git access is now configured for your VM.");
        }
      })();
    });
    return () => sub.remove();
  }, [visible]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleConnect = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setIsConnecting(true);
    const redirectUri = Linking.createURL("github-oauth-callback");
    const res = await githubOauthStart(token, redirectUri);
    if (!res.ok) {
      setIsConnecting(false);
      Alert.alert("GitHub OAuth failed", res.error);
      return;
    }
    githubFlowActive.current = true;
    const result = await WebBrowser.openAuthSessionAsync(res.data.url, redirectUri);
    if (result.type === "success") {
      const statusRes = await githubOauthStatus(token);
      if (statusRes.ok && statusRes.data.connected) {
        posthog.capture("github_connected", { github_login: statusRes.data.githubLogin ?? "" });
        setGithubConnected(true);
        setGithubLogin(statusRes.data.githubLogin ?? null);
        githubFlowActive.current = false;
      } else {
        Alert.alert(
          "GitHub OAuth incomplete",
          statusRes.ok
            ? "GitHub is not connected yet. Please complete OAuth and try again."
            : statusRes.error,
        );
      }
    }
    setIsConnecting(false);
  }, []);

  const handleDisconnect = useCallback(() => {
    Alert.alert(
      "Disconnect GitHub",
      `Are you sure you want to disconnect @${githubLogin || "github"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            const token = await getToken();
            if (!token) return;
            setIsDisconnecting(true);
            const res = await githubOauthDisconnect(token);
            setIsDisconnecting(false);
            if (res.ok) {
              posthog.capture("github_disconnected");
              setGithubConnected(false);
              setGithubLogin(null);
            } else {
              Alert.alert("Error", res.error);
            }
          },
        },
      ],
    );
  }, [githubLogin]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Drag handle */}
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.dragger} />
        </View>

        <TouchableOpacity onPress={close} style={styles.closeButton} hitSlop={8}>
          <CloseIcon />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configure Git Access</Text>
          <Text style={styles.headerSubtitle}>
            Connect GitHub to clone repos and push code from your VM.
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {isLoading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="large" color="#3D841E" />
            </View>
          ) : githubConnected ? (
            /* ── Connected state ── */
            <View style={styles.connectedBlock}>
              <View style={styles.illustrationRow}>
                <GithubIcon width={44} height={44} />
                <Image
                  source={require("@/assets/images/new-design/connect-more/arrow-lock-arrow.png")}
                  style={styles.arrowImage}
                  resizeMode="contain"
                />
                <LogoIcon width={44} height={44} />
              </View>

              {githubLogin ? (
                <Text style={styles.githubUsername}>@{githubLogin}</Text>
              ) : null}
              <Text style={styles.connectedSubtitle}>Connected and ready to use.</Text>

              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeCheck}>✓</Text>
                <Text style={styles.connectedBadgeText}>Connected</Text>
              </View>

              <TouchableOpacity
                style={[styles.disconnectBtn, isDisconnecting && styles.disconnectBtnDisabled]}
                onPress={handleDisconnect}
                activeOpacity={0.8}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <ActivityIndicator size="small" color="#841E1E" />
                ) : (
                  <Text style={styles.disconnectBtnText}>Disconnect</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Not connected state ── */
            <View style={styles.connectBlock}>
              <View style={styles.illustrationRow}>
                <GithubIcon width={44} height={44} />
                <Image
                  source={require("@/assets/images/new-design/connect-more/arrow-lock-arrow.png")}
                  style={styles.arrowImage}
                  resizeMode="contain"
                />
                <LogoIcon width={44} height={44} />
              </View>

              <Text style={styles.connectTitle}>Connect GitHub</Text>
              <Text style={styles.connectDesc}>
                Authorize Grass via GitHub OAuth (HTTPS). Your credentials are stored securely on your VM.
              </Text>

              <TouchableOpacity
                style={[styles.connectBtn, isConnecting && styles.connectBtnDisabled]}
                onPress={handleConnect}
                activeOpacity={0.85}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <GithubIcon width={20} height={20} />
                    <Text style={styles.connectBtnText}>Connect with GitHub</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerNote}>Auth happens on GitHub's servers, not ours.</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.80)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    paddingBottom: 36,
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 10,
  },
  dragger: { width: 36, height: 5, borderRadius: 100, backgroundColor: "#CCC" },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 294,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 4,
  },
  headerTitle: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    lineHeight: 31,
    color: "#000",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    lineHeight: 20,
    color: "#808080",
    letterSpacing: -0.2,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    overflow: "hidden",
  },
  loadingBlock: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  // Connected state
  connectedBlock: {
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  illustrationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  arrowImage: { width: 60, height: 28 },
  githubUsername: {
    fontFamily: SFPro.bold,
    fontSize: 20,
    color: "#000",
    letterSpacing: -0.4,
  },
  connectedSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
    letterSpacing: -0.2,
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#9EE67F",
    backgroundColor: "#E3FDD7",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  connectedBadgeCheck: { fontSize: 14, color: "#1A5200", fontWeight: "700" },
  connectedBadgeText: {
    fontFamily: SFPro.semiBold,
    fontSize: 14,
    color: "#1A5200",
    letterSpacing: -0.2,
  },
  disconnectBtn: {
    width: "100%",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#841E1E",
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
    height: 48,
    justifyContent: "center",
  },
  disconnectBtnDisabled: { borderColor: "#C0A0A0", opacity: 0.6 },
  disconnectBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#841E1E",
    letterSpacing: -0.3,
  },

  // Not connected state
  connectBlock: {
    padding: 20,
    alignItems: "center",
    gap: 14,
  },
  connectTitle: {
    fontFamily: SFPro.bold,
    fontSize: 20,
    color: "#000",
    letterSpacing: -0.4,
  },
  connectDesc: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
    textAlign: "center",
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  connectBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    backgroundColor: "#3D841E",
    paddingVertical: 16,
    marginTop: 4,
  },
  connectBtnDisabled: { backgroundColor: "#ABABAB" },
  connectBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFF",
    letterSpacing: -0.3,
  },

  // Footer
  footerRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  footerNote: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
    letterSpacing: -0.2,
    textAlign: "center",
  },
});
