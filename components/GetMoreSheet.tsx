import {
  claudeComplete,
  claudeDisconnect,
  claudeStart,
  claudeStatus,
} from "@/api/claude";
import { getToken } from "@/store/auth-store";
import { saveUrl } from "@/store/url-store";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Clipboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type SheetView = "home" | "connect-agent" | "connect-laptop" | "add-repository";
type AgentTab = "claude" | "opencode";

const OPENCODE_AUTH_URL = "opencode.ai/oauth/device?code=xxxxxxxxxxxxxxxx";

interface Props {
  visible: boolean;
  onClose: () => void;
  onUrlDetected?: (url: string) => void | Promise<void>;
  initialView?: SheetView;
}

export function GetMoreSheet({
  visible,
  onClose,
  onUrlDetected,
  initialView = "home",
}: Props) {
  const [currentView, setCurrentView] = useState<SheetView>(initialView);
  const [activeTab, setActiveTab] = useState<AgentTab>("claude");
  const [claudeCode, setClaudeCode] = useState("");
  const [opencodeCode, setOpencodeCode] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  // Claude auth state
  const [claudeAuthUrl, setClaudeAuthUrl] = useState<string | null>(null);
  const [claudeSessionId, setClaudeSessionId] = useState<string | null>(null);
  const [claudeCmdId, setClaudeCmdId] = useState<string | null>(null);
  const [claudeConnected, setClaudeConnected] = useState(false);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scannedQr, setScannedQr] = useState<string | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const scanLockRef = useRef(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 2,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 || gs.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 800,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const authCode = activeTab === "claude" ? claudeCode : opencodeCode;
  const setAuthCode = activeTab === "claude" ? setClaudeCode : setOpencodeCode;
  const authUrl =
    activeTab === "claude"
      ? claudeAuthUrl ?? "Loading..."
      : OPENCODE_AUTH_URL;

  useEffect(() => {
    if (visible) {
      setCurrentView(initialView ?? "home");
      translateY.setValue(0);
    } else {
      setRepoUrl("");
    }
  }, [visible, initialView]);

  // Fetch Claude auth status when sheet opens
  useEffect(() => {
    if (!visible) return;
    (async () => {
      const token = await getToken();
      if (!token) return;
      const res = await claudeStatus(token);
      if (res.ok) {
        setClaudeConnected(res.data.connected);
      }
    })();
  }, [visible]);

  // Start Claude auth flow when navigating to connect-agent with claude tab
  useEffect(() => {
    if (!visible || currentView !== "connect-agent" || activeTab !== "claude")
      return;
    if (claudeConnected) return;
    // Don't call /start again if we already have a session
    if (claudeSessionId) return;

    (async () => {
      setClaudeLoading(true);
      const token = await getToken();
      if (!token) {
        setClaudeLoading(false);
        return;
      }
      const res = await claudeStart(token);
      if (res.ok) {
        if (res.data.alreadyAuthenticated) {
          setClaudeConnected(true);
        } else {
          setClaudeAuthUrl(res.data.authUrl ?? null);
          setClaudeSessionId(res.data.sessionId ?? null);
          setClaudeCmdId(res.data.cmdId ?? null);
        }
      } else {
        Alert.alert("Error", res.error);
      }
      setClaudeLoading(false);
    })();
  }, [visible, currentView, activeTab, claudeConnected, claudeSessionId]);

  useEffect(() => {
    if (!visible || currentView !== "connect-laptop") return;
    if (cameraPermission?.granted) return;
    if (cameraPermission?.canAskAgain === false) return;
    void requestCameraPermission();
  }, [
    visible,
    currentView,
    cameraPermission?.granted,
    cameraPermission?.canAskAgain,
    requestCameraPermission,
  ]);

  useEffect(() => {
    if (!visible || currentView !== "connect-laptop") return;
    setScannerPaused(false);
    setScannedQr(null);
    setScanBusy(false);
    scanLockRef.current = false;
  }, [visible, currentView]);

  function handleCopyAuthUrl() {
    const url = activeTab === "claude" && claudeAuthUrl ? claudeAuthUrl : "https://" + authUrl;
    Clipboard.setString(url);
    Alert.alert("Copied!", "URL copied to clipboard.");
  }

  function handleOpenBrowser() {
    const url = activeTab === "claude" && claudeAuthUrl ? claudeAuthUrl : "https://" + authUrl;
    Linking.openURL(url);
  }

  async function handleVerify() {
    if (!authCode.trim()) return;

    if (activeTab === "claude") {
      if (!claudeSessionId || !claudeCmdId) {
        Alert.alert("Error", "Auth session not ready. Please wait or try again.");
        return;
      }
      setVerifying(true);
      const token = await getToken();
      if (!token) {
        setVerifying(false);
        Alert.alert("Error", "Not logged in.");
        return;
      }
      console.log("[claude-auth] completing with:", {
        sessionId: claudeSessionId,
        cmdId: claudeCmdId,
        authCodeLength: claudeCode.trim().length,
      });
      const res = await claudeComplete(token, {
        authCode: claudeCode.trim(),
        sessionId: claudeSessionId,
        cmdId: claudeCmdId,
      });
      console.log("[claude-auth] complete response:", res);
      setVerifying(false);
      if (res.ok && res.data.success) {
        setClaudeConnected(true);
        setClaudeCode("");
        Alert.alert("Connected!", "Claude Code authenticated successfully.");
      } else {
        // Reset session so a fresh /start is triggered on retry
        setClaudeSessionId(null);
        setClaudeCmdId(null);
        setClaudeAuthUrl(null);
        Alert.alert(
          "Failed",
          (res.ok ? res.data.message : res.error) +
            "\n\nThe session has expired. Please try again.",
        );
      }
    } else {
      Alert.alert(
        "Verifying…",
        "Checking your Opencode authorization code.",
      );
    }
  }

  async function handleDisconnectClaude() {
    Alert.alert(
      "Disconnect Claude?",
      "This will remove Claude Code authentication from your VM.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            setDisconnecting(true);
            const token = await getToken();
            if (!token) {
              setDisconnecting(false);
              return;
            }
            const res = await claudeDisconnect(token);
            setDisconnecting(false);
            if (res.ok && res.data.success) {
              setClaudeConnected(false);
              setClaudeAuthUrl(null);
              setClaudeSessionId(null);
              setClaudeCmdId(null);
              Alert.alert("Disconnected", "Claude Code has been disconnected.");
            } else {
              Alert.alert("Error", res.ok ? res.data.message : res.error);
            }
          },
        },
      ],
    );
  }

  function handleCopyTerminalCommand() {
    Clipboard.setString("npx grass start");
    Alert.alert("Copied!", "Command copied to clipboard.");
  }

  function normalizeVmUrl(rawValue: string): string | null {
    const raw = rawValue.trim();
    if (!raw) return null;

    const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw);
    const candidate = hasScheme ? raw : `https://${raw}`;

    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "ws:") parsed.protocol = "http:";
      if (parsed.protocol === "wss:") parsed.protocol = "https:";
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return null;
      }
      return parsed.toString().replace(/\/$/, "");
    } catch {
      return null;
    }
  }

  function extractVmUrlFromQr(payload: string): string | null {
    const trimmed = payload.trim();
    if (!trimmed) return null;

    const direct = normalizeVmUrl(trimmed);
    if (direct) return direct;

    try {
      const parsed = new URL(trimmed);
      const queryUrl =
        parsed.searchParams.get("url") ??
        parsed.searchParams.get("server") ??
        parsed.searchParams.get("host");
      if (queryUrl) {
        const normalizedQueryUrl = normalizeVmUrl(decodeURIComponent(queryUrl));
        if (normalizedQueryUrl) return normalizedQueryUrl;
      }
    } catch {
      // Continue to regex extraction fallback.
    }

    const embedded = trimmed.match(/((?:https?|wss?):\/\/[^\s"'<>]+)/i)?.[1];
    if (embedded) {
      return normalizeVmUrl(embedded);
    }

    return null;
  }

  function confirmAddScannedUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        "Add server?",
        `Detected server:\n${url}\n\nDo you want to add this VM?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Add", onPress: () => resolve(true) },
        ],
      );
    });
  }

  async function handleQrScanned(data: string) {
    if (scanLockRef.current || scanBusy) return;
    scanLockRef.current = true;
    setScanBusy(true);
    setScannerPaused(true);

    const normalizedUrl = extractVmUrlFromQr(data);
    if (!normalizedUrl) {
      Alert.alert("Invalid QR", "This QR does not contain a valid server URL.");
      return;
    }

    if (scannedQr === normalizedUrl) {
      return;
    }

    const confirmed = await confirmAddScannedUrl(normalizedUrl);
    if (!confirmed) return;

    await saveUrl(normalizedUrl);
    setScannedQr(normalizedUrl);
    await onUrlDetected?.(normalizedUrl);
    onClose();
  }

  // ── Home view ────────────────────────────────────────────────────────────────

  function renderHomeView() {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        bounces={false}
      >
        <Text style={styles.title}>Get More from Grass</Text>
        <Text style={styles.subtitle}>
          All optional. Set up whenever you&#39;re ready.
        </Text>

        {/* Card 1: Connect your own agent */}
        <TouchableOpacity
          style={styles.card}
          // activeOpacity={0.88}
          onPress={() => setCurrentView("connect-agent")}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.cardLeftCol}>
              <Text style={styles.cardTitle}>{"Connect your\nown agent"}</Text>
              <View style={styles.hintRow}>
                <Image
                  source={require("@/assets/images/get-more/bulb.svg")}
                  style={styles.hintIcon}
                  contentFit="contain"
                />
                <Text style={styles.hintText}>
                  Used by 95% {"\n"}Grass users
                </Text>
              </View>
            </View>
            <View style={styles.cardRightCol}>
              <Image
                source={require("@/assets/images/get-more/own-agent.png")}
                style={styles.cardImage}
                contentFit="cover"
                contentPosition={{ left: 0 }}
                priority="normal"
              />
            </View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.cardBottomRow}>
            <View style={styles.cardBottomIcons}>
              <View style={styles.iconBadge}>
                <Image
                  source={require("@/assets/images/get-more/claude.svg")}
                  style={styles.badgeIcon}
                  contentFit="contain"
                />
              </View>
              <View style={styles.iconBadge}>
                <Image
                  source={require("@/assets/images/get-more/opencode.svg")}
                  style={styles.badgeIcon}
                  contentFit="contain"
                />
              </View>
            </View>
            <Text style={styles.cardNote}>
              {"We are working on\nsupporting more agents"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Card 2: Connect your Laptop */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.88}
          onPress={() => setCurrentView("connect-laptop")}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.cardLeftCol}>
              <Text style={styles.cardTitle}>{"Connect your\nLaptop"}</Text>
              <View style={styles.hintRow}>
                <Image
                  source={require("@/assets/images/get-more/bulb.svg")}
                  style={styles.hintIcon}
                  contentFit="contain"
                />
                <Text style={styles.hintText}>
                  Your machine, {"\n"}your rules
                </Text>
              </View>
            </View>
            <View style={[styles.cardRightCol, { backgroundColor: "#ffffff" }]}>
              <Image
                source={require("@/assets/images/get-more/own-machine.png")}
                style={styles.cardImage}
                contentFit="cover"
                contentPosition={{ left: 0 }}
                priority="normal"
              />
              {/* <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                <Defs>
                  <RadialGradient
                    id="radialLaptopBg"
                    cx="100%"
                    cy="0%"
                    rx="75%"
                    ry="75%"
                    fx="100%"
                    fy="0%"
                  >
                    <Stop offset="0%" stopColor="#59B26E" stopOpacity="0.7" />
                    <Stop offset="55%" stopColor="#A8D8AF" stopOpacity="0.35" />
                    <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="url(#radialLaptopBg)"
                />
              </Svg> */}
            </View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.cardBottomRow}>
            <View style={styles.cardBottomIcons}>
              <View style={styles.iconBadge}>
                <Image
                  source={require("@/assets/images/get-more/apple.svg")}
                  style={styles.badgeIcon}
                  contentFit="contain"
                />
              </View>
              <View style={styles.iconBadge}>
                <Image
                  source={require("@/assets/images/get-more/microsoft.svg")}
                  style={styles.badgeIcon}
                  contentFit="contain"
                />
              </View>
              <View style={styles.iconBadge}>
                <Image
                  source={require("@/assets/images/get-more/linux.svg")}
                  style={styles.badgeIcon}
                  contentFit="contain"
                />
              </View>
            </View>
            <Text style={styles.cardNote}>
              {"Your code never\nleaves your machine."}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Bottom row: two half-width cards */}
        <View style={styles.halfRow}>
          <TouchableOpacity
            style={styles.halfCard}
            activeOpacity={0.88}
            onPress={() => setCurrentView("add-repository")}
          >
            <View style={styles.iconCircle}>
              <Image
                source={require("@/assets/images/get-more/add-repo.svg")}
                style={styles.halfCardIcon}
                contentFit="contain"
              />
            </View>
            <Text style={styles.halfCardTitle}>{"Add a\nrepository"}</Text>
            <Text style={styles.halfCardSubtitle}>
              {"Paste a Git\nClone URL"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.halfCard} activeOpacity={0.88}>
            <View style={styles.halfCardHeader}>
              <View style={styles.iconCircle}>
                <Image
                  source={require("@/assets/images/get-more/github.svg")}
                  style={styles.halfCardIcon}
                  contentFit="contain"
                />
              </View>
              <View style={styles.comingBadge}>
                <Text style={styles.comingBadgeText}>Coming in v2</Text>
              </View>
            </View>
            <Text style={styles.halfCardTitle}>{"Configure\nGit Access"}</Text>
            <Text style={styles.halfCardSubtitle}>
              {"SSH key or\nGitHub OAuth"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── Connect agent view ────────────────────────────────────────────────────────

  function renderConnectAgentView() {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setCurrentView("home")}
          activeOpacity={0.7}
        >
          <Image
            source={require("@/assets/images/get-more/back-arrow.png")}
            style={styles.backIcon}
            contentFit="contain"
          />
        </TouchableOpacity>

        <Text style={styles.title}>{"Connect your\nown agent"}</Text>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "claude" && styles.tabActive]}
            onPress={() => setActiveTab("claude")}
            activeOpacity={0.8}
          >
            <Image
              source={require("@/assets/images/get-more/claude.svg")}
              style={styles.tabIcon}
              contentFit="contain"
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "claude" && styles.tabTextActive,
              ]}
            >
              Claude
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "opencode" && styles.tabActiveOpencode,
            ]}
            onPress={() => setActiveTab("opencode")}
            activeOpacity={0.8}
          >
            <Image
              source={require("@/assets/images/get-more/opencode-logo-light.svg")}
              style={styles.tabIcon}
              contentFit="contain"
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "opencode" && styles.tabTextActive,
              ]}
            >
              Opencode
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "claude" && claudeConnected ? (
          <>
            <Text style={styles.agentName}>Claude Code</Text>
            <Text style={styles.agentSubtitle}>
              {disconnecting
                ? "Disconnecting..."
                : "Connected and ready to use."}
            </Text>

            <View style={styles.connectedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#1A5200" />
              <Text style={styles.connectedBadgeText}>Connected</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.disconnectBtn,
                disconnecting && styles.disconnectBtnDisabled,
              ]}
              onPress={handleDisconnectClaude}
              activeOpacity={0.8}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <ActivityIndicator size="small" color="#E05050" />
              ) : (
                <Text style={styles.disconnectBtnText}>Disconnect</Text>
              )}
            </TouchableOpacity>
          </>
        ) : activeTab === "claude" && claudeLoading ? (
          <>
            <Text style={styles.agentName}>Claude Code</Text>
            <ActivityIndicator
              size="small"
              color="#004D13"
              style={{ marginTop: 16 }}
            />
            <Text style={styles.agentSubtitle}>
              {"Setting up authentication..."}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.agentName}>
              {activeTab === "claude" ? "Claude Code" : "Opencode"}
            </Text>
            <Text style={styles.agentSubtitle}>
              {activeTab === "claude"
                ? "Open the link, log in, paste the code.\nTakes 30 seconds."
                : "Open the link, authenticate, paste the code.\nTakes 30 seconds."}
            </Text>

            <View style={styles.urlRow}>
              <Text
                style={styles.urlText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {authUrl}
              </Text>
              <TouchableOpacity
                style={styles.copyBtnWrap}
                onPress={handleCopyAuthUrl}
                activeOpacity={0.75}
              >
                <LinearGradient
                  colors={["#FFEE00", "#FFFA9B"]}
                  start={{ x: 0.07, y: 0 }}
                  end={{ x: 0.87, y: 1 }}
                  style={styles.copyBtn}
                >
                  <Image
                    source={require("@/assets/images/get-more/copy-icon.png")}
                    style={styles.copyIcon}
                    contentFit="contain"
                  />
                  <Text style={styles.copyText}>COPY</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleOpenBrowser}
              activeOpacity={0.85}
              style={styles.browserBtnWrap}
            >
              <LinearGradient
                colors={["#5CC830", "#3AAD14"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.browserBtn}
              >
                <Text style={styles.browserBtnText}>Open in browser →</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR PASTE CODE</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.codeLabel}>Authorization Code</Text>

            <TextInput
              style={styles.codeInput}
              placeholder="XXX - XXX"
              placeholderTextColor="#B0BEAA"
              value={authCode}
              onChangeText={setAuthCode}
              autoCapitalize="characters"
              autoCorrect={false}
              textAlign="center"
              returnKeyType="go"
              onSubmitEditing={handleVerify}
              editable={!verifying}
            />

            <TouchableOpacity
              style={[
                styles.verifyBtn,
                verifying
                  ? styles.verifyBtnActive
                  : authCode.trim().length > 0 && styles.verifyBtnActive,
              ]}
              onPress={handleVerify}
              activeOpacity={authCode.trim().length > 0 ? 0.8 : 1}
              disabled={verifying}
            >
              {verifying ? (
                <View style={styles.verifyLoadingRow}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.verifyTextActive}>Verifying...</Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.verifyText,
                    authCode.trim().length > 0 && styles.verifyTextActive,
                  ]}
                >
                  Verify →
                </Text>
              )}
            </TouchableOpacity>
            {verifying && (
              <Text style={styles.verifyHint}>
                This may take up to 15 seconds. Please wait.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    );
  }

  // ── Connect laptop view ───────────────────────────────────────────────────────

  function renderConnectLaptopView() {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        bounces={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setCurrentView("home")}
          activeOpacity={0.7}
        >
          <Image
            source={require("@/assets/images/get-more/back-arrow.png")}
            style={styles.backIcon}
            contentFit="contain"
          />
        </TouchableOpacity>

        <Text style={styles.title}>{"Connect\nyour laptop"}</Text>

        {/* Step 1 */}
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={styles.laptopStepLabel}>Run this in your terminal</Text>
        </View>

        <View style={styles.urlRow}>
          <Text style={styles.urlText} numberOfLines={1} ellipsizeMode="tail">
            npx grass start
          </Text>
          <TouchableOpacity
            style={styles.copyBtnWrap}
            onPress={handleCopyTerminalCommand}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={["#FFEE00", "#FFFA9B"]}
              start={{ x: 0.07, y: 0 }}
              end={{ x: 0.87, y: 1 }}
              style={styles.copyBtn}
            >
              <Image
                source={require("@/assets/images/get-more/copy-icon.png")}
                style={styles.copyIcon}
                contentFit="contain"
              />
              <Text style={styles.copyText}>COPY</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Step 2 */}
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>2</Text>
          </View>
          <Text style={styles.stepLabel}>Scan the QR code</Text>
        </View>

        <View>
          {cameraPermission?.granted && !scannerPaused ? (
            <View style={styles.qrImageContainer}>
              <CameraView
                style={styles.qrCamera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={({ data }) => {
                  void handleQrScanned(data);
                }}
              />
            </View>
          ) : cameraPermission?.granted ? (
            <View style={styles.qrPausedState}>
              <Ionicons name="pause-circle-outline" size={32} color="#7AAA58" />
              <Text style={styles.qrPermissionText}>
                Scanner paused after detection
              </Text>
            </View>
          ) : (
            <View style={styles.qrPermissionState}>
              <Ionicons name="camera-outline" size={32} color="#7AAA58" />
              <Text style={styles.qrPermissionText}>
                Allow camera access to scan the QR code
              </Text>
              <TouchableOpacity
                style={styles.qrPermissionBtn}
                onPress={() => requestCameraPermission()}
                activeOpacity={0.8}
              >
                <Text style={styles.qrPermissionBtnText}>Enable Camera</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.qrCaption}>
            {cameraPermission?.granted
              ? "POINT THE CAMERA AT THE QR"
              : "ENABLE CAMERA TO SCAN QR"}
          </Text>
          {cameraPermission?.granted && scannerPaused && (
            <TouchableOpacity
              style={styles.scanAgainBtn}
              onPress={() => {
                scanLockRef.current = false;
                setScanBusy(false);
                setScannerPaused(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.scanAgainBtnText}>Scan again</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  // ── Add repository view ───────────────────────────────────────────────────────

  function renderAddRepositoryView() {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setCurrentView("home")}
          activeOpacity={0.7}
        >
          <Image
            source={require("@/assets/images/get-more/back-arrow.png")}
            style={styles.backIcon}
            contentFit="contain"
          />
        </TouchableOpacity>

        <Text style={styles.title}>{"Add a\nrepository"}</Text>

        <Text style={styles.agentSubtitle}>
          Paste a Git clone URL. No login needed for public repos.
        </Text>

        <Text style={styles.codeLabel}>Repository URL</Text>

        <TextInput
          style={styles.repoInput}
          placeholder=""
          placeholderTextColor="#B0BEAA"
          value={repoUrl}
          onChangeText={setRepoUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TouchableOpacity
          style={[
            styles.verifyBtn,
            repoUrl.trim().length > 0 && styles.verifyBtnActive,
          ]}
          activeOpacity={repoUrl.trim().length > 0 ? 0.8 : 1}
          onPress={() => {
            if (!repoUrl.trim()) return;
            Alert.alert("Cloning…", `Starting clone of ${repoUrl.trim()}`);
          }}
        >
          <Text
            style={[
              styles.verifyText,
              repoUrl.trim().length > 0 && styles.verifyTextActive,
            ]}
          >
            Clone →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <LinearGradient
            colors={["#FFFFFF", "#CCFFD9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.dragHandleArea} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>

          {currentView === "home" && renderHomeView()}
          {currentView === "connect-agent" && renderConnectAgentView()}
          {currentView === "connect-laptop" && renderConnectLaptopView()}
          {currentView === "add-repository" && renderAddRepositoryView()}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    maxHeight: "90%",
  },
  dragHandleArea: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 80,
    alignItems: "center",
  },
  dragHandle: {
    width: 63,
    height: 6,
    borderRadius: 70,
    backgroundColor: "#E0E0E0",
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    paddingTop: 20,
    gap: 12,
  },

  backIcon: {
    width: 14,
    height: 12,
  },

  // ── Header ────────────────────────────────────────────────────
  title: {
    fontSize: 32,
    fontWeight: 600,
    color: "#004410",
  },
  subtitle: {
    fontSize: 16,
    color: "#76AA83",
    marginBottom: 4,
    fontWeight: 500,
  },

  // ── Full-width cards ─────────────────────────────────────────
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    overflow: "hidden",
  },
  cardTopRow: {
    flexDirection: "row",
    height: 140,
    paddingTop: 10,
  },
  cardLeftCol: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#000",
    lineHeight: 24,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hintIcon: {
    width: 14,
    height: 14,
  },
  hintText: {
    fontSize: 14,
    color: "#76AA83",
    fontWeight: "500",
  },
  cardRightCol: {
    flex: 1,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#EBEBEB",
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardBottomIcons: {
    flexDirection: "row",
    gap: 6,
  },
  iconBadge: {
    width: 21,
    height: 21,
    borderRadius: 16,
    backgroundColor: "#59B26E",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  badgeIcon: {
    width: 12,
    height: 12,
  },
  cardNote: {
    fontSize: 10,
    fontWeight: 500,
    color: "#B2B2B2",
    textAlign: "right",
    lineHeight: 12,
    flex: 1,
    paddingLeft: 8,
  },

  // ── Half-width cards row ─────────────────────────────────────
  halfRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DFF0C8",
    padding: 16,
    gap: 8,
    minHeight: 150,
  },
  halfCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconCircle: {
    width: 31,
    height: 31,
    borderRadius: 22,
    backgroundColor: "#59B26E",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  halfCardIcon: {
    width: 19,
    height: 19,
  },
  halfCardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginTop: 4,
  },
  halfCardSubtitle: {
    fontSize: 14,
    color: "#59B26E",
    fontWeight: 500,
  },

  // ── Coming badge ─────────────────────────────────────────────
  comingBadge: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#B25900",
    backgroundColor: "#FFE5CC",
    paddingHorizontal: 7,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  comingBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#874400",
    letterSpacing: 0.1,
  },

  // ── Shared: back button ───────────────────────────────────────
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 30,
    // padding: 10,
    borderWidth: 2,
    borderColor: "#004D13",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Shared: URL / command row ─────────────────────────────────
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#5CAC6F",
    height: 52,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 16,
    color: "#004D13",
    fontFamily: "DM Mono",
    fontWeight: 400,
  },
  copyBtnWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D0A128",
    overflow: "hidden",
    marginLeft: 8,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyIcon: {
    width: 14,
    height: 14,
  },
  copyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#504D22",
  },
  // ── Connect agent view ────────────────────────────────────────
  tabBar: {
    flexDirection: "row",
    alignSelf: "flex-start",
    gap: 10,
  },
  tab: {
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: "#EBEBEB",
    backgroundColor: "#FFF",
  },
  tabActive: {
    backgroundColor: "#004D13",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#0C3",
    shadowColor: "#004410",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  tabActiveOpencode: {
    backgroundColor: "#004D13",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#0C3",
    shadowColor: "#004410",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  tabIcon: {
    width: 16,
    height: 16,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c2c2c",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  agentName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#004410",
    marginBottom: 2,
  },
  agentSubtitle: {
    fontSize: 16,
    color: "#76AA83",
    fontWeight: 500,
  },
  browserBtnWrap: {
    borderRadius: 63,
    overflow: "hidden",
  },
  browserBtn: {
    height: 52,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  browserBtnText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#004D13",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#588B64",
  },
  dividerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#588B64",
    letterSpacing: 1,
  },
  codeLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#004410",
    lineHeight: 32,
  },
  codeInput: {
    height: 52,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#5CAC6F",
    paddingVertical: 18,

    fontSize: 24,
    fontWeight: "400",
    color: "#B6B8B6",
    letterSpacing: 4,
  },
  verifyBtn: {
    height: 52,
    backgroundColor: "#B8B8B8",
    borderRadius: 63,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#8C8C8C",
  },
  verifyBtnActive: {
    backgroundColor: "#00FF40",
    borderWidth: 1,
    borderColor: "#0C3",
  },
  verifyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#7D7D7D",
    letterSpacing: 0.1,
  },
  verifyTextActive: {
    color: "#ffffff",
  },

  // ── Connect laptop view ───────────────────────────────────────
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1A5200",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#004410",
  },
  laptopStepLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#004410",
  },
  qrImageContainer: {
    borderRadius: 18,
    overflow: "hidden",
  },
  qrCamera: {
    width: "100%",
    aspectRatio: 1.25,
  },
  qrPermissionState: {
    width: "100%",
    aspectRatio: 1.25,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 18,
  },
  qrPausedState: {
    width: "100%",
    aspectRatio: 1.25,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 18,
  },
  qrPermissionText: {
    fontSize: 13,
    color: "#E5E7EB",
    textAlign: "center",
    lineHeight: 18,
  },
  qrPermissionBtn: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#1A5200",
  },
  qrPermissionBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  qrCaption: {
    fontSize: 14,
    fontWeight: "600",
    color: "#588B64",
    letterSpacing: 1,
    textAlign: "center",
    paddingVertical: 12,
  },
  scanAgainBtn: {
    alignSelf: "center",
    marginBottom: 12,
    marginTop: -2,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#1A5200",
  },
  scanAgainBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Connected / disconnect ─────────────────────────────────────
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "#D4F5D0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  connectedBadgeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A5200",
  },
  disconnectBtn: {
    height: 52,
    backgroundColor: "#ffffff",
    borderRadius: 63,
    borderWidth: 1,
    borderColor: "#E05050",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  disconnectBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E05050",
  },
  disconnectBtnDisabled: {
    opacity: 0.6,
  },
  verifyLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verifyHint: {
    fontSize: 13,
    color: "#588B64",
    textAlign: "center",
    fontWeight: "500",
  },

  // ── Add repository view ───────────────────────────────────────
  repoDescription: {
    fontSize: 15,
    color: "#4B6B30",
    lineHeight: 22,
  },
  repoLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0D2600",
  },
  repoInput: {
    height: 52,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#5CAC6F",
    paddingVertical: 18,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "400",
    color: "#004D13",
  },
});
