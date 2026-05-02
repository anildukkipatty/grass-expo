import { BlurView } from "expo-blur";
import * as Linking from "expo-linking";
import { SymbolView } from "expo-symbols";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import { Easing } from "react-native-reanimated";

import GithubIcon from "@/assets/images/new-design/connect-more/github.svg";
import LogoIcon from "@/assets/images/new-design/connect-more/logo.svg";

import { githubOauthDisconnect, githubOauthStart, githubOauthStatus } from "@/api/github";
import { posthog } from "@/constants/posthog";
import { SFPro } from "@/constants/theme";
import { getToken } from "@/store/auth-store";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ConfigureGitAccessSlider({ visible, onClose }: Props) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const githubFlowActive = useRef(false);

  const snapPoints = ["90%"];
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 300,
    easing: Easing.out(Easing.cubic),
  });
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  React.useEffect(() => {
    if (!visible) {
      bottomSheetRef.current?.dismiss();
      return;
    }

    bottomSheetRef.current?.present();
    setGithubConnected(false);
    setGithubLogin(null);
    setIsConnecting(false);
    setIsDisconnecting(false);
    githubFlowActive.current = false;
    setIsLoading(true);

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
  }, [visible]);

  // AppState listener: check status when returning from browser
  React.useEffect(() => {
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

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableOverDrag={false}
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.dragHandle}
    >
      {/* Close button */}
      <TouchableOpacity
        onPress={() => bottomSheetRef.current?.dismiss()}
        style={styles.closeButton}
        hitSlop={8}
      >
        <BlurView intensity={60} tint="light" style={[styles.closeX, { backgroundColor: "#F2F2F2" }]}>
          <SymbolView name="xmark" size={17} weight="semibold" tintColor="#1A1A1A" />
        </BlurView>
      </TouchableOpacity>

      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
            <View style={styles.connectedBlock}>
              <View style={styles.illustrationRow}>
                <GithubIcon width={44} height={44} style={{ width: 44, height: 44 }} />
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
            <View style={styles.connectBlock}>
              <View style={styles.illustrationRow}>
                <GithubIcon width={44} height={44} style={{ width: 44, height: 44 }} />
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
                  <Text style={styles.connectBtnText}>Connect with GitHub</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerNote}>Auth happens on GitHub's servers, not ours.</Text>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFF",
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCC",
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 16,
    zIndex: 10,
  },
  closeX: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 4,
  },
  headerTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 28,
    lineHeight: 31,
    color: "#000",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 14,
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
    fontFamily: SFPro.medium,
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
  footerRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  footerNote: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
    letterSpacing: -0.2,
    textAlign: "center",
  },
});
