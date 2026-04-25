import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  Image,
  Keyboard,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import ClaudeTransparentIcon from "@/assets/images/new-design/connect-more/claude-transparent.svg";
import ClaudeIcon from "@/assets/images/new-design/connect-more/claude.svg";
import CopyIcon from "@/assets/images/new-design/connect-more/copy-icon.svg";
import LogoIcon from "@/assets/images/new-design/connect-more/logo.svg";
import OpenCodeIcon from "@/assets/images/new-design/connect-more/opencode-transparent.svg";
import SecureIcon from "@/assets/images/new-design/connect-more/secure.svg";
import SuccessMark from "@/assets/images/new-design/connect-more/success-mark.svg";

import { SFPro } from "@/constants/theme";
import { claudeComplete, claudeDisconnect, claudeStart, claudeStatus } from "@/api/claude";
import { opencodeConnect, opencodeDisconnect, opencodeStatus } from "@/api/opencode";
import { getToken } from "@/store/auth-store";

const OPENCODE_KEY_URL = "opencode.ai/zen";
const TABS = ["Claude Code", "Opencode"] as const;
type Tab = (typeof TABS)[number];
type Step = "form" | "connected";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  return (
    <View
      style={[{ width: width ?? "100%", height, borderRadius, backgroundColor: "#E8E8E8" }, style]}
    />
  );
}

export function ConnectOwnAgentSlider({ visible, onClose }: Props) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [activeTab, setActiveTab] = useState<Tab>("Claude Code");
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [step, setStep] = useState<Step>("form");

  const [claudeConnected, setClaudeConnected] = useState(false);
  const [opencodeConnected, setOpencodeConnected] = useState(false);

  const [claudeSession, setClaudeSession] = useState<{
    sessionId: string;
    cmdId: string;
    authUrl: string;
  } | null>(null);

  const authInputRef = useRef<TextInput>(null);

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

  // Success overlay animation (slides up from bottom within the sheet)
  const successTranslateY = useSharedValue(800);
  const successStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: successTranslateY.value }],
  }));

  const slideSuccessIn = useCallback(() => {
    setStep("connected");
    successTranslateY.value = 800;
    successTranslateY.value = withSpring(0, { damping: 20, stiffness: 180 });
  }, [successTranslateY]);

  // ─── API helpers ──────────────────────────────────────────────────────────

  const startClaudeAuth = useCallback(async (token: string) => {
    setIsLoading(true);
    setClaudeSession(null);
    setConnectError(null);
    const res = await claudeStart(token);
    if (res.ok && res.data.success) {
      if (res.data.alreadyAuthenticated) {
        setClaudeConnected(true);
      } else if (res.data.sessionId && res.data.cmdId && res.data.authUrl) {
        setClaudeSession({
          sessionId: res.data.sessionId,
          cmdId: res.data.cmdId,
          authUrl: res.data.authUrl,
        });
      }
    } else {
      setConnectError(
        res.ok ? "Unable to start authentication. Please try again."
               : (res.error ?? "Unable to start authentication. Please try again.")
      );
    }
    setIsLoading(false);
  }, []);

  const checkAndInit = useCallback(async () => {
    setIsLoading(true);
    const token = await getToken();
    if (!token) { setIsLoading(false); return; }

    const [claudeRes, opencodeRes] = await Promise.all([
      claudeStatus(token),
      opencodeStatus(token),
    ]);

    const isClaudeConn = claudeRes.ok && claudeRes.data.connected;
    const isOpencodeConn = opencodeRes.ok && opencodeRes.data.connected;
    setClaudeConnected(isClaudeConn);
    setOpencodeConnected(isOpencodeConn);

    if (!isClaudeConn) {
      await startClaudeAuth(token);
    } else {
      setIsLoading(false);
    }
  }, [startClaudeAuth]);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      successTranslateY.value = 800;
      setActiveTab("Claude Code");
      setAuthCode("");
      setAuthError(false);
      setConnectError(null);
      setClaudeSession(null);
      setClaudeConnected(false);
      setOpencodeConnected(false);
      setIsConnecting(false);
      setIsDisconnecting(false);
      setStep("form");
      checkAndInit();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, checkAndInit, successTranslateY]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const authUrl =
    activeTab === "Claude Code" ? (claudeSession?.authUrl ?? "") : OPENCODE_KEY_URL;

  const handleCopy = useCallback(() => {
    if (!authUrl) return;
    Clipboard.setString(authUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [authUrl]);

  const handleOpenBrowser = useCallback(() => {
    if (!authUrl) return;
    const url = authUrl.startsWith("http") ? authUrl : `https://${authUrl}`;
    Linking.openURL(url);
  }, [authUrl]);

  const handleConnect = useCallback(async () => {
    if (authCode.trim().length < 1) { setAuthError(true); return; }
    setAuthError(false);
    setConnectError(null);
    setIsConnecting(true);
    try {
      const token = await getToken();
      if (!token) return;

      if (activeTab === "Claude Code") {
        if (!claudeSession) return;
        const res = await claudeComplete(token, {
          authCode: authCode.trim(),
          sessionId: claudeSession.sessionId,
          cmdId: claudeSession.cmdId,
        });
        if (res.ok && res.data.success) {
          setClaudeConnected(true);
          slideSuccessIn();
        } else {
          setAuthError(true);
          setConnectError(
            res.ok ? (res.data.message ?? "That code didn't work. Try again.")
                   : (res.error ?? "That code didn't work. Try again.")
          );
        }
      } else {
        const res = await opencodeConnect(token, { apiKey: authCode.trim() });
        if (res.ok && res.data.success) {
          setOpencodeConnected(true);
          slideSuccessIn();
        } else {
          setAuthError(true);
          setConnectError(
            res.ok ? (res.data.message ?? "Invalid API key. Check and try again.")
                   : (res.error ?? "Invalid API key. Check and try again.")
          );
        }
      }
    } catch {
      setConnectError("Something went wrong. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }, [activeTab, authCode, claudeSession, slideSuccessIn]);

  const handleDisconnect = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setIsDisconnecting(true);
    try {
      if (activeTab === "Claude Code") {
        const res = await claudeDisconnect(token);
        if (res.ok && res.data.success) {
          setClaudeConnected(false);
          setClaudeSession(null);
          setAuthCode("");
          setConnectError(null);
          await startClaudeAuth(token);
        }
      } else {
        const res = await opencodeDisconnect(token);
        if (res.ok && res.data.success) {
          setOpencodeConnected(false);
          setAuthCode("");
          setConnectError(null);
        }
      }
    } finally {
      setIsDisconnecting(false);
    }
  }, [activeTab, startClaudeAuth]);

  // ─── Derived UI values ────────────────────────────────────────────────────

  const isCurrentTabConnected =
    activeTab === "Claude Code" ? claudeConnected : opencodeConnected;
  const agentLabel = activeTab === "Claude Code" ? "Claude" : "Opencode";
  const isGreenStep = step === "connected";

  const step2Title =
    activeTab === "Claude Code" ? "Paste your auth code here" : "Paste your API key here";
  const step2Placeholder =
    activeTab === "Claude Code" ? "Enter auth code" : "Enter API key";
  const footerNote =
    activeTab === "Claude Code"
      ? "Auth happens on Anthropic's servers, not ours."
      : "Auth happens on OpenCode's servers, not ours.";
  const successSubtitle =
    activeTab === "Claude Code"
      ? "Claude Code is connected and ready."
      : "Opencode is connected and ready.";

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.dragHandle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      {/* Close button */}
      <TouchableOpacity
        onPress={() => { Keyboard.dismiss(); bottomSheetRef.current?.dismiss(); }}
        style={styles.closeButton}
        hitSlop={8}
      >
        <View style={styles.closeX}>
          <Text style={styles.closeXText}>✕</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Connect your own agent</Text>
          <Text style={styles.headerSubtitle}>
            All optional. Set up whenever you&#39;re ready.
          </Text>
        </View>
      </View>

      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Tabs row */}
          <View style={styles.tabRow}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              const isConnected = tab === "Claude Code" ? claudeConnected : opencodeConnected;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={async () => {
                    if (tab === activeTab) return;
                    setActiveTab(tab);
                    setAuthCode("");
                    setAuthError(false);
                    setConnectError(null);
                    if (tab === "Claude Code" && !claudeConnected) {
                      const token = await getToken();
                      if (token) startClaudeAuth(token);
                    } else {
                      setIsLoading(false);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {tab === "Claude Code" ? (
                    <ClaudeTransparentIcon width={18} height={18} />
                  ) : (
                    <OpenCodeIcon width={18} height={18} />
                  )}
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab}
                  </Text>
                  {isConnected && (
                    <View style={styles.tabConnectedDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.cardDivider} />

          {/* ── Connected state ── */}
          {isCurrentTabConnected ? (
            <View style={styles.connectedBlock}>
              <View style={styles.illustrationRow}>
                {activeTab === "Claude Code" ? (
                  <ClaudeIcon width={44} height={44} />
                ) : (
                  <OpenCodeIcon width={44} height={44} />
                )}
                <Image
                  source={require("@/assets/images/new-design/connect-more/arrow-lock-arrow.png")}
                  style={styles.arrowImage}
                  resizeMode="contain"
                />
                <LogoIcon width={44} height={44} />
              </View>

              <Text style={styles.connectedAgentName}>
                {activeTab === "Claude Code" ? "Claude Code" : "OpenCode Zen"}
              </Text>
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
            <>
              {/* ── Step 1 ── */}
              <View style={styles.stepBlock}>
                <View style={styles.illustrationRow}>
                  {isLoading ? (
                    <SkeletonBox width={44} height={44} borderRadius={10} />
                  ) : activeTab === "Claude Code" ? (
                    <ClaudeIcon width={44} height={44} />
                  ) : (
                    <OpenCodeIcon width={44} height={44} />
                  )}
                  <Image
                    source={require("@/assets/images/new-design/connect-more/arrow-lock-arrow.png")}
                    style={styles.arrowImage}
                    resizeMode="contain"
                  />
                  {isLoading ? (
                    <SkeletonBox width={44} height={44} borderRadius={10} />
                  ) : (
                    <LogoIcon width={44} height={44} />
                  )}
                </View>

                <View style={styles.stepHeader}>
                  {isLoading ? (
                    <SkeletonBox width={160} height={18} borderRadius={6} />
                  ) : (
                    <>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>1</Text>
                      </View>
                      <Text style={styles.stepTitle}>Connect {agentLabel}</Text>
                    </>
                  )}
                </View>

                {isLoading ? (
                  <View style={styles.skeletonDescGroup}>
                    <SkeletonBox width="90%" height={13} borderRadius={6} />
                    <SkeletonBox width="100%" height={13} borderRadius={6} />
                    <SkeletonBox width="70%" height={13} borderRadius={6} />
                  </View>
                ) : (
                  <Text style={styles.stepDesc}>
                    {activeTab === "Claude Code"
                      ? "You'll be redirected to Anthropic to login, and authorize Grass."
                      : "You'll need an API key from Opencode. Visit the link below to get one."}
                  </Text>
                )}

                {isLoading ? (
                  <SkeletonBox height={40} borderRadius={10} />
                ) : (
                  <View style={styles.urlInputBox}>
                    <Text style={styles.urlInputText} numberOfLines={1}>
                      {authUrl || "Waiting for auth URL…"}
                    </Text>
                  </View>
                )}

                {isLoading ? (
                  <View style={styles.buttonRow}>
                    <SkeletonBox width="42%" height={38} borderRadius={40} />
                    <SkeletonBox width="55%" height={38} borderRadius={40} />
                  </View>
                ) : (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={handleCopy}
                      activeOpacity={0.75}
                      disabled={!authUrl}
                    >
                      <CopyIcon width={15} height={15} />
                      <Text style={styles.copyButtonText}>
                        {copied ? "Copied!" : "Copy link"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.openBrowserButton}
                      onPress={handleOpenBrowser}
                      activeOpacity={0.85}
                      disabled={!authUrl}
                    >
                      <Text style={styles.openBrowserText}>Open in browser</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.cardDivider} />

              {/* ── Step 2 ── */}
              <View style={styles.stepBlock}>
                <View style={styles.stepHeader}>
                  {isLoading ? (
                    <SkeletonBox width={200} height={18} borderRadius={6} />
                  ) : (
                    <>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>2</Text>
                      </View>
                      <Text style={styles.stepTitle}>{step2Title}</Text>
                    </>
                  )}
                </View>

                {isLoading ? (
                  <SkeletonBox height={48} borderRadius={10} />
                ) : (
                  <TextInput
                    ref={authInputRef}
                    style={[styles.authInput, authError && styles.authInputError]}
                    placeholder={step2Placeholder}
                    placeholderTextColor="#9F9F9F"
                    value={authCode}
                    onChangeText={(t) => {
                      setAuthCode(t);
                      setAuthError(false);
                      setConnectError(null);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={activeTab === "Opencode"}
                  />
                )}

                {(authError || connectError) && (
                  <Text style={styles.errorText}>
                    {connectError ?? "That code doesn't match. Try again."}
                  </Text>
                )}

                {isLoading ? (
                  <SkeletonBox height={52} borderRadius={50} />
                ) : (
                  <View
                    style={[
                      styles.connectButtonWrap,
                      (authCode.trim().length === 0 || isConnecting) &&
                        styles.connectButtonWrapNoShadow,
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.connectButton,
                        authCode.trim().length > 0 && !isConnecting
                          ? styles.connectButtonActive
                          : styles.connectButtonDisabled,
                      ]}
                      onPress={handleConnect}
                      activeOpacity={0.88}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.connectButtonText}>
                          Connect {agentLabel}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <SecureIcon width={14} height={14} />
          <Text style={styles.footerNote}>{footerNote}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} style={styles.learnMoreWrap}>
          <Text style={styles.learnMoreText}>Learn more →</Text>
        </TouchableOpacity>
      </BottomSheetScrollView>

      {/* ── Green success overlay (slides up from bottom within the sheet) ── */}
      <Animated.View
        style={[styles.successOverlay, successStyle]}
        pointerEvents={isGreenStep ? "auto" : "none"}
      >
        {step === "connected" && (
          <View style={styles.greenContent}>
            <View style={styles.greenCenter}>
              <SuccessMark width={192} height={244} />
              <Text style={styles.greenTitle}>Agent connected</Text>
              <Text style={styles.greenSubtitle}>{successSubtitle}</Text>
            </View>
            <View style={styles.greenFooter}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => { bottomSheetRef.current?.dismiss(); }}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Start a session</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addAnotherButton}
                onPress={async () => {
                  successTranslateY.value = 800;
                  setStep("form");
                  setAuthCode("");
                  setAuthError(false);
                  setConnectError(null);
                  if (activeTab === "Claude Code") {
                    const token = await getToken();
                    if (token) startClaudeAuth(token);
                  }
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.addAnotherButtonText}>Connect another</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
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
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  closeXText: {
    fontSize: 14,
    color: "#333",
  },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  headerText: { gap: 4 },
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
  scrollContent: { paddingHorizontal: 16, paddingBottom: 36, gap: 14 },

  // Card
  card: { borderRadius: 16, borderWidth: 1, borderColor: "#DFDFDF", overflow: "hidden" },
  cardDivider: { height: 1, backgroundColor: "#DFDFDF" },

  // Tabs
  tabRow: { flexDirection: "row", gap: 10, padding: 14 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
  },
  tabActive: { borderColor: "#3D841E", backgroundColor: "#E3FDD7" },
  tabText: { fontFamily: SFPro.semiBold, fontSize: 17, color: "#000", letterSpacing: -0.2 },
  tabTextActive: { color: "#000", fontFamily: SFPro.semiBold },
  tabConnectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#3D841E",
    marginLeft: 2,
  },

  // Connected state
  connectedBlock: {
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  connectedAgentName: {
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
  connectedBadgeCheck: {
    fontSize: 14,
    color: "#1A5200",
    fontWeight: "700",
  },
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

  // Steps
  stepBlock: { padding: 16, gap: 12 },
  illustrationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  arrowImage: { width: 60, height: 28 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3D841E",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: { fontFamily: SFPro.bold, fontSize: 13, color: "#FFF", lineHeight: 16 },
  stepTitle: { fontFamily: SFPro.bold, fontSize: 17, color: "#000", letterSpacing: -0.3 },
  stepDesc: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  skeletonDescGroup: { gap: 6, paddingLeft: 34 },
  urlInputBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  urlInputText: {
    fontFamily: "DM Mono",
    fontSize: 16,
    color: "#000",
    fontWeight: "400",
    letterSpacing: -0.2,
  },
  buttonRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  copyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#808080",
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  copyButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  openBrowserButton: {
    flex: 1,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  openBrowserText: {
    fontFamily: SFPro.semiBold,
    fontSize: 14,
    color: "#FFF",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  authInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9F9F9F",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "#000",
    letterSpacing: -0.2,
    height: 48,
  },
  authInputError: { borderColor: "#841E1E" },
  errorText: { fontFamily: SFPro.medium, fontSize: 13, color: "#841E1E", lineHeight: 18 },
  connectButtonWrap: {
    borderRadius: 50,
    shadowColor: "rgba(84, 147, 50, 0.70)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 4,
  },
  connectButtonWrapNoShadow: { shadowColor: "transparent", shadowRadius: 0, elevation: 0 },
  connectButton: {
    borderRadius: 50,
    borderWidth: 2,
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  connectButtonActive: { borderColor: "#72C44E", backgroundColor: "#3D841E" },
  connectButtonDisabled: {
    borderColor: "#808080",
    backgroundColor: "#9F9F9F",
    shadowColor: "transparent",
    shadowRadius: 0,
    elevation: 0,
  },
  connectButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#F2F2F2",
    letterSpacing: -0.5,
  },

  // Footer
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  footerNote: { fontFamily: SFPro.regular, fontSize: 13, color: "#888", lineHeight: 18, letterSpacing: -0.2 },
  learnMoreWrap: { alignItems: "center" },
  learnMoreText: { fontFamily: SFPro.semiBold, fontSize: 13, color: "#3D841E", letterSpacing: -0.2 },

  greenDragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  greenDragger: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCC",
    mixBlendMode: "plus-darker",
  },
  // Green success overlay
  successOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#3D841E",
  },
  greenContent: { flex: 1, paddingBottom: 40 },
  greenCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  greenTitle: { fontFamily: SFPro.bold, fontSize: 32, color: "#FFF", textAlign: "center", letterSpacing: -0.5 },
  greenSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.80)",
    textAlign: "center",
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  greenFooter: { paddingHorizontal: 16, gap: 12 },
  primaryButton: { borderRadius: 50, backgroundColor: "#FFF", paddingVertical: 16, alignItems: "center" },
  primaryButtonText: { fontFamily: SFPro.semiBold, fontSize: 16, color: "#3D841E", letterSpacing: -0.3 },
  addAnotherButton: { borderRadius: 50, borderWidth: 2, borderColor: "#FFF", paddingVertical: 16, alignItems: "center" },
  addAnotherButtonText: { fontFamily: SFPro.semiBold, fontSize: 16, color: "#FFF", letterSpacing: -0.3 },
});
