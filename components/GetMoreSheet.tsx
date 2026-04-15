import {
  claudeComplete,
  claudeDisconnect,
  claudeStart,
  claudeStatus,
} from "@/api/claude";
import {
  opencodeConnect,
  opencodeDisconnect,
  opencodeStatus,
} from "@/api/opencode";
import {
  githubListRepos,
  githubOauthDisconnect,
  githubOauthStart,
  githubOauthStatus,
  type GithubRepo,
} from "@/api/github";
import { useNavbar } from "@/contexts/navbar-context";
import AddRepoSvg from "@/assets/images/get-more/add-repo.svg";
import AppleSvg from "@/assets/images/get-more/apple.svg";
import BackArrow from "@/assets/images/get-more/back-arrow.svg";
import BulbSvg from "@/assets/images/get-more/bulb.svg";
import ClaudeSvg from "@/assets/images/get-more/claude.svg";
import CopyIcon from "@/assets/images/get-more/copy-icon.svg";
import GithubSvg from "@/assets/images/get-more/github.svg";
import LinuxSvg from "@/assets/images/get-more/linux.svg";
import MicrosoftSvg from "@/assets/images/get-more/microsoft.svg";
import OpencodeLightSvg from "@/assets/images/get-more/opencode-logo-light.svg";
import OpencodeSvg from "@/assets/images/get-more/opencode.svg";
import { NationalPark } from "@/constants/theme";
import { posthog } from "@/constants/posthog";
import { getToken } from "@/store/auth-store";
import { cloneRepoStore, getEntry } from "@/store/connection-store";
import { saveUrl } from "@/store/url-store";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Clipboard,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Easing } from "react-native-reanimated";

type SheetView = "home" | "connect-agent" | "connect-laptop" | "add-repository" | "github-repos";
type AgentTab = "claude" | "opencode";

const OPENCODE_AUTH_URL = "opencode.ai/zen";

interface Props {
  visible: boolean;
  onClose: () => void;
  onUrlDetected?: (url: string) => void | Promise<void>;
  initialView?: SheetView;
  serverUrl?: string;
  onRepoAdded?: () => void;
}

export function GetMoreSheet({
  visible,
  onClose,
  onUrlDetected,
  initialView = "home",
  serverUrl,
  onRepoAdded,
}: Props) {
  const { repos: vmRepos, primaryVmUrl } = useNavbar();
  const [currentView, setCurrentView] = useState<SheetView>(initialView);
  const [activeTab, setActiveTab] = useState<AgentTab>("claude");
  const [claudeCode, setClaudeCode] = useState("");
  const [opencodeCode, setOpencodeCode] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  // Claude auth state
  const [claudeAuthUrl, setClaudeAuthUrl] = useState<string | null>(null);
  const [claudeSessionId, setClaudeSessionId] = useState<string | null>(null);
  const [claudeCmdId, setClaudeCmdId] = useState<string | null>(null);
  const [claudeConnected, setClaudeConnected] = useState(false);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [opencodeConnected, setOpencodeConnected] = useState(false);
  const [opencodeLoading, setOpencodeLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [openingBrowser, setOpeningBrowser] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [opencodeDisconnecting, setOpencodeDisconnecting] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [githubFlowActive, setGithubFlowActive] = useState(false);
  const [githubDisconnecting, setGithubDisconnecting] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [githubReposLoading, setGithubReposLoading] = useState(false);
  const [cloningRepoId, setCloningRepoId] = useState<string | number | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scannedQr, setScannedQr] = useState<string | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const scanLockRef = useRef(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["90%"], []);
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 300,
    easing: Easing.out(Easing.cubic),
  });
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  const authCode = activeTab === "claude" ? claudeCode : opencodeCode;
  const setAuthCode = activeTab === "claude" ? setClaudeCode : setOpencodeCode;
  const authUrl =
    activeTab === "claude"
      ? (claudeAuthUrl ?? "Loading...")
      : OPENCODE_AUTH_URL;
  const vmRepoNameSet = useMemo(
    () =>
      new Set(
        vmRepos
          .map((repo) => String(repo.name || "").trim().toLowerCase())
          .filter(Boolean),
      ),
    [vmRepos],
  );

  // When the user is on a custom VM (not the primary Daytona sandbox), the backend's
  // `alreadyOnVm` flag is unreliable — it always reflects the Daytona sandbox folders,
  // not the custom VM. In that case, rely solely on vmRepoNameSet (fetched from the
  // selected VM) to determine whether a repo is already present.
  const isCustomVm = !!serverUrl && !!primaryVmUrl && serverUrl !== primaryVmUrl;

  useEffect(() => {
    if (visible) {
      setCurrentView(initialView ?? "home");
      bottomSheetRef.current?.present();
    } else {
      setRepoUrl("");
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, initialView]);

  // Fetch Claude auth status when sheet opens
  useEffect(() => {
    if (!visible) return;
    (async () => {
      const token = await getToken();
      if (!token) return;
      const [claudeRes, opencodeRes, githubStatusRes] = await Promise.all([
        claudeStatus(token),
        opencodeStatus(token),
        githubOauthStatus(token),
      ]);
      if (claudeRes.ok) {
        setClaudeConnected(claudeRes.data.connected);
      }
      if (opencodeRes.ok) {
        setOpencodeConnected(opencodeRes.data.connected);
      }
      if (githubStatusRes.ok) {
        setGithubConnected(Boolean(githubStatusRes.data.connected));
        setGithubLogin(githubStatusRes.data.githubLogin ?? null);
      }
    })();
  }, [visible]);

  useEffect(() => {
    if (visible && currentView === "github-repos") {
      loadGithubRepos();
    }
  }, [visible, currentView]);

  useEffect(() => {
    if (!visible || !githubFlowActive) return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      void (async () => {
        const token = await getToken();
        if (!token) return;
        const statusRes = await githubOauthStatus(token);
        if (statusRes.ok) {
          const connected = Boolean(statusRes.data.connected);
          setGithubConnected(connected);
          setGithubLogin(statusRes.data.githubLogin ?? null);
          if (connected) {
            setGithubFlowActive(false);
            Alert.alert(
              "GitHub connected",
              "GitHub OAuth is complete. Git access is now configured for your VM.",
            );
          }
        }
      })();
    });

    return () => {
      subscription.remove();
    };
  }, [visible, githubFlowActive]);

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
    const url =
      activeTab === "claude" && claudeAuthUrl
        ? claudeAuthUrl
        : "https://" + authUrl;
    Clipboard.setString(url);
    Alert.alert("Copied!", "URL copied to clipboard.");
  }

  async function handleOpenBrowser() {
    if (openingBrowser) return;
    const url =
      activeTab === "claude" && claudeAuthUrl
        ? claudeAuthUrl
        : "https://" + authUrl;
    setOpeningBrowser(true);
    try {
      await Linking.openURL(url);
    } finally {
      setOpeningBrowser(false);
    }
  }

  async function handleVerify() {
    if (!authCode.trim()) return;

    if (activeTab === "claude") {
      if (!claudeSessionId || !claudeCmdId) {
        Alert.alert(
          "Error",
          "Auth session not ready. Please wait or try again.",
        );
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
      setVerifying(true);
      setOpencodeLoading(true);
      const token = await getToken();
      if (!token) {
        setVerifying(false);
        setOpencodeLoading(false);
        Alert.alert("Error", "Not logged in.");
        return;
      }
      const res = await opencodeConnect(token, {
        apiKey: opencodeCode.trim(),
      });
      setVerifying(false);
      setOpencodeLoading(false);
      if (res.ok && res.data.success) {
        setOpencodeConnected(true);
        setOpencodeCode("");
        Alert.alert("Connected!", "OpenCode Zen authenticated successfully.");
      } else {
        setOpencodeCode("");
        Alert.alert("Failed", res.ok ? res.data.message : res.error);
      }
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

  async function handleDisconnectOpencode() {
    Alert.alert(
      "Disconnect OpenCode?",
      "This will remove OpenCode Zen authentication from your VM.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            setOpencodeDisconnecting(true);
            const token = await getToken();
            if (!token) {
              setOpencodeDisconnecting(false);
              return;
            }
            const res = await opencodeDisconnect(token);
            setOpencodeDisconnecting(false);
            if (res.ok && res.data.success) {
              setOpencodeConnected(false);
              setOpencodeCode("");
              Alert.alert(
                "Disconnected",
                "OpenCode Zen has been disconnected.",
              );
            } else {
              Alert.alert("Error", res.ok ? res.data.message : res.error);
            }
          },
        },
      ],
    );
  }

  async function handleConfigureGitAccess() {
    if (githubConnected || githubLoading) return;
    const token = await getToken();
    if (!token) {
      Alert.alert("Error", "Not logged in.");
      return;
    }
    setGithubLoading(true);
    const redirectUri = Linking.createURL("github-oauth-callback");
    const res = await githubOauthStart(token, redirectUri);
    if (!res.ok) {
      setGithubLoading(false);
      Alert.alert("GitHub OAuth failed", res.error);
      return;
    }
    setGithubFlowActive(true);
    const result = await WebBrowser.openAuthSessionAsync(
      res.data.url,
      redirectUri,
    );
    if (result.type === "success") {
      const statusRes = await githubOauthStatus(token);
      console.log("[github-oauth] status response:", statusRes);
      if (statusRes.ok && statusRes.data.connected) {
        posthog.capture("github_connected", {
          github_login: statusRes.data.githubLogin ?? "",
        });
        setGithubConnected(true);
        setGithubLogin(statusRes.data.githubLogin ?? null);
        setGithubFlowActive(false);
        Alert.alert(
          "GitHub OAuth completed",
          "Git access is now configured for your VM.",
        );
      } else {
        Alert.alert(
          "GitHub OAuth failed",
          statusRes.ok
            ? "GitHub is not connected yet. Please complete OAuth and try again."
            : statusRes.error,
        );
      }
    }
    setGithubLoading(false);
  }

  function handleDisconnectGithub() {
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
            setGithubDisconnecting(true);
            const res = await githubOauthDisconnect(token);
            setGithubDisconnecting(false);
            if (res.ok) {
              setGithubConnected(false);
              setGithubLogin(null);
              Alert.alert("Disconnected", "GitHub has been disconnected.");
            } else {
              Alert.alert("Error", res.error);
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
      <View style={styles.content}>
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
                <BulbSvg width={14} height={14} />
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
                <ClaudeSvg width={12} height={12} />
              </View>
              <View style={styles.iconBadge}>
                <OpencodeSvg width={12} height={12} />
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
                <BulbSvg width={14} height={14} />
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
                <AppleSvg width={12} height={12} />
              </View>
              <View style={styles.iconBadge}>
                <MicrosoftSvg width={12} height={12} />
              </View>
              <View style={styles.iconBadge}>
                <LinuxSvg width={12} height={12} />
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
              <AddRepoSvg width={19} height={19} />
            </View>
            <Text style={styles.halfCardTitle}>{"Add a\nrepository"}</Text>
            <Text style={styles.halfCardSubtitle}>
              {"Paste a Git\nClone URL"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.halfCard}
            activeOpacity={0.88}
            onPress={githubConnected ? undefined : handleConfigureGitAccess}
            disabled={githubLoading || githubDisconnecting}
          >
            <View style={styles.halfCardHeader}>
              <View style={styles.iconCircle}>
                <GithubSvg width={19} height={19} />
              </View>
              {githubLoading || githubDisconnecting ? (
                <ActivityIndicator size="small" color="#1A5200" />
              ) : null}
            </View>
            <Text style={styles.halfCardTitle}>{"Configure\nGit Access"}</Text>
            <Text style={styles.halfCardSubtitle}>
              {githubConnected
                ? `Connected as @${githubLogin || "github"}`
                : "GitHub OAuth (HTTPS)"}
            </Text>
            {githubConnected ? (
              <TouchableOpacity
                style={[
                  styles.disconnectBtn,
                  { height: 32, marginTop: 6 },
                  githubDisconnecting && styles.disconnectBtnDisabled,
                ]}
                onPress={handleDisconnectGithub}
                disabled={githubDisconnecting}
                activeOpacity={0.7}
              >
                <Text style={[styles.disconnectBtnText, { fontSize: 13 }]}>
                  Disconnect
                </Text>
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Connect agent view ────────────────────────────────────────────────────────

  function renderConnectAgentView() {
    return (
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setCurrentView("home")}
          activeOpacity={0.7}
        >
          {/* <Image
            source={require("@/assets/images/get-more/back-arrow.png")}
            style={styles.backIcon}
            contentFit="contain"
          /> */}
          <BackArrow />
        </TouchableOpacity>

        <Text style={styles.title}>{"Connect your\nown agent"}</Text>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "claude" && styles.tabActive]}
            onPress={() => setActiveTab("claude")}
            activeOpacity={0.8}
          >
            <ClaudeSvg width={16} height={16} />
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
            <OpencodeLightSvg width={16} height={16} />
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

        {(activeTab === "claude" && claudeConnected) ||
        (activeTab === "opencode" && opencodeConnected) ? (
          <>
            <Text style={styles.agentName}>
              {activeTab === "claude" ? "Claude Code" : "OpenCode Zen"}
            </Text>
            <Text style={styles.agentSubtitle}>
              {activeTab === "claude"
                ? disconnecting
                  ? "Disconnecting..."
                  : "Connected and ready to use."
                : opencodeDisconnecting
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
                (activeTab === "claude"
                  ? disconnecting
                  : opencodeDisconnecting) && styles.disconnectBtnDisabled,
              ]}
              onPress={
                activeTab === "claude"
                  ? handleDisconnectClaude
                  : handleDisconnectOpencode
              }
              activeOpacity={0.8}
              disabled={
                activeTab === "claude" ? disconnecting : opencodeDisconnecting
              }
            >
              {(
                activeTab === "claude" ? disconnecting : opencodeDisconnecting
              ) ? (
                <ActivityIndicator size="small" color="#E05050" />
              ) : (
                <Text style={styles.disconnectBtnText}>Disconnect</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (activeTab === "claude" && claudeLoading) ||
          (activeTab === "opencode" && opencodeLoading) ? (
          <>
            <Text style={styles.agentName}>
              {activeTab === "claude" ? "Claude Code" : "OpenCode Zen"}
            </Text>
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
            {/* <View style={{ display: "flex", flexDirection: "column" }}> */}
            <Text style={styles.agentName}>
              {activeTab === "claude" ? "Claude Code" : "Opencode"}
            </Text>

            <Text style={styles.agentSubtitle}>
              {activeTab === "claude"
                ? "Open the link, log in, paste the code."
                : "Open the link, create/copy API key, paste it below."}
            </Text>
            {/* </View> */}

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
                  {/* <Image
                    source={require("@/assets/images/get-more/copy-icon.png")}
                    style={styles.copyIcon}
                    contentFit="contain"
                  /> */}
                  <CopyIcon />
                  <Text style={styles.copyText}>COPY</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleOpenBrowser}
              activeOpacity={0.85}
              style={styles.browserBtnWrap}
              disabled={openingBrowser}
            >
              <LinearGradient
                colors={["#00FF26", "#00FF26"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.browserBtn}
              >
                {openingBrowser ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator size="small" color="#000000" />
                    <Text style={styles.browserBtnText}>Opening...</Text>
                  </View>
                ) : (
                  <Text style={styles.browserBtnText}>Open in browser →</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>
                {activeTab === "claude" ? "AND PASTE CODE" : "AND PASTE KEY"}
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.codeLabel}>
              {activeTab === "claude" ? "Authorization Code" : "API Key"}
            </Text>

            <View style={styles.urlRow}>
              <TextInput
                style={styles.codeInputInline}
                placeholder={
                  activeTab === "claude"
                    ? "Paste authorization code"
                    : "Paste OpenCode Zen API key"
                }
                placeholderTextColor="#B0BEAA"
                value={authCode}
                onChangeText={setAuthCode}
                autoCapitalize={activeTab === "claude" ? "characters" : "none"}
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleVerify}
                editable={!verifying}
              />
              <TouchableOpacity
                style={styles.copyBtnWrap}
                onPress={async () => {
                  const text = await Clipboard.getString();
                  if (text?.trim()) {
                    setAuthCode(text.trim());
                  }
                }}
                activeOpacity={0.75}
                disabled={verifying}
              >
                <LinearGradient
                  colors={["#FFEE00", "#FFFA9B"]}
                  start={{ x: 0.07, y: 0 }}
                  end={{ x: 0.87, y: 1 }}
                  style={styles.copyBtn}
                >
                  <Text style={styles.copyText}>PASTE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

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
      </View>
    );
  }

  // ── Connect laptop view ───────────────────────────────────────────────────────

  function renderConnectLaptopView() {
    return (
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setCurrentView("home")}
          activeOpacity={0.7}
        >
          {/* <Image
            source={require("@/assets/images/get-more/back-arrow.png")}
            style={styles.backIcon}
            contentFit="contain"
          /> */}
          <BackArrow />
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
              {/* <Image
                source={require("@/assets/images/get-more/copy-icon.png")}
                style={styles.copyIcon}
                contentFit="contain"
              /> */}
              <CopyIcon />
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
            <View style={[styles.qrPausedState, styles.qrImageContainer]}>
              <Ionicons name="pause-circle-outline" size={32} color="#7AAA58" />
              <Text style={styles.qrPermissionText}>
                Scanner paused after detection
              </Text>
            </View>
          ) : (
            <View style={[styles.qrPermissionState, styles.qrImageContainer]}>
              <Ionicons name="camera-outline" size={32} color="#7AAA58" />
              <Text style={styles.qrPermissionText}>
                Allow camera access to scan the QR code
              </Text>
              <TouchableOpacity
                style={styles.qrPermissionBtn}
                onPress={() => {
                  if (cameraPermission?.canAskAgain === false) {
                    void Linking.openSettings();
                  } else {
                    void requestCameraPermission();
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.qrPermissionBtnText}>
                  {cameraPermission?.canAskAgain === false
                    ? "Enable Camera"
                    : "Enable Camera"}
                </Text>
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
      </View>
    );
  }

  // ── GitHub repos view ──────────────────────────────────────────────────────────

  async function loadGithubRepos() {
    const token = await getToken();
    if (!token) return;
    setGithubReposLoading(true);
    const res = await githubListRepos(token);
    setGithubReposLoading(false);
    if (res.ok) {
      setGithubRepos(res.data.repos);
    } else {
      Alert.alert("Error", res.error);
    }
  }

  async function handleCloneGithubRepo(repo: GithubRepo) {
    const repoName = String(repo.name || "").trim().toLowerCase();
    const alreadyOnVm =
      vmRepoNameSet.has(repoName) ||
      (!isCustomVm && Boolean(repo.alreadyOnVm));
    if (cloningRepoId || alreadyOnVm) return;
    if (!serverUrl) {
      Alert.alert(
        "No server",
        "No server connected. Please connect a server first.",
      );
      return;
    }
    setCloningRepoId(repo.id);
    const gitUrl = `https://github.com/${repo.fullName}.git`;
    await cloneRepoStore(serverUrl, gitUrl);
    const entry = getEntry(serverUrl);
    setCloningRepoId(null);
    if (entry?.cloneStatus.error) {
      Alert.alert("Clone failed", entry.cloneStatus.error);
    } else {
      posthog.capture("repo_cloned", {
        repo_name: repo.fullName,
        source: "github",
      });
      onRepoAdded?.();
      onClose();
    }
  }

  function renderGithubReposView() {
    return (
      <View style={styles.content}>
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

        <Text style={styles.title}>{"Clone from\nGitHub"}</Text>
        <Text style={styles.agentSubtitle}>
          Select a repository to clone into your workspace.
        </Text>

        {githubReposLoading ? (
          <ActivityIndicator
            size="large"
            color="#1A5200"
            style={{ marginTop: 32 }}
          />
        ) : githubRepos.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: "#8E8E93",
              marginTop: 32,
              fontSize: 14,
            }}
          >
            No repositories found.
          </Text>
        ) : (
          <View style={{ marginTop: 16, gap: 10 }}>
            {githubRepos.map((repo) => {
              const repoName = String(repo.name || "").trim().toLowerCase();
              const alreadyOnVm =
                vmRepoNameSet.has(repoName) ||
                (!isCustomVm && Boolean(repo.alreadyOnVm));
              return (
                <TouchableOpacity
                  key={repo.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: alreadyOnVm ? 0.6 : 1,
                  }}
                  activeOpacity={0.7}
                  disabled={cloningRepoId !== null || alreadyOnVm}
                  onPress={() => handleCloneGithubRepo(repo)}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                      style={{ fontSize: 15, fontWeight: "600", color: "#1C1C1E" }}
                      numberOfLines={1}
                    >
                      {repo.name}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {repo.fullName}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {repo.private && (
                      <Ionicons name="lock-closed" size={13} color="#8E8E93" />
                    )}
                    {cloningRepoId === repo.id ? (
                      <ActivityIndicator size="small" color="#1A5200" />
                    ) : (
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: alreadyOnVm ? "#8E8E93" : "#1A5200",
                        }}
                      >
                        {alreadyOnVm ? "Already added" : "Clone"}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  // ── Add repository view ───────────────────────────────────────────────────────

  function renderAddRepositoryView() {
    return (
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setCurrentView("home")}
          activeOpacity={0.7}
        >
          {/* <Image
            source={require("@/assets/images/get-more/back-arrow.png")}
            style={styles.backIcon}
            contentFit="contain"
          /> */}
          <BackArrow />
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

        {cloneError && (
          <Text style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
            {cloneError}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.verifyBtn,
            repoUrl.trim().length > 0 && !cloning && styles.verifyBtnActive,
            { opacity: !repoUrl.trim() || cloning ? 0.5 : 1 },
          ]}
          activeOpacity={repoUrl.trim().length > 0 && !cloning ? 0.8 : 1}
          disabled={!repoUrl.trim() || cloning}
          onPress={async () => {
            const url = repoUrl.trim();
            if (!url || cloning) return;
            if (!serverUrl) {
              Alert.alert(
                "No server",
                "No server connected. Please connect a server first.",
              );
              return;
            }
            setCloning(true);
            setCloneError(null);
            await cloneRepoStore(serverUrl, url);
            const entry = getEntry(serverUrl);
            setCloning(false);
            if (entry?.cloneStatus.error) {
              setCloneError(entry.cloneStatus.error);
            } else {
              posthog.capture("repo_cloned", {
                repo_name: url,
                source: "url",
              });
              setRepoUrl("");
              onRepoAdded?.();
              onClose();
            }
          }}
        >
          {cloning ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={[
                styles.verifyText,
                repoUrl.trim().length > 0 && styles.verifyTextActive,
              ]}
            >
              Clone →
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

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
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={{ flex: 1 }}>
              <LinearGradient
                colors={["#FFFFFF", "#CCFFD9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {currentView === "home" && renderHomeView()}
              {currentView === "connect-agent" && renderConnectAgentView()}
              {currentView === "connect-laptop" && renderConnectLaptopView()}
              {currentView === "add-repository" && renderAddRepositoryView()}
              {currentView === "github-repos" && renderGithubReposView()}
            </View>
          </TouchableWithoutFeedback>
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
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
    fontFamily: NationalPark.semiBold,
    color: "#004410",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#76AA83",
    marginBottom: 4,
    fontFamily: NationalPark.medium,
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
    fontFamily: NationalPark.semiBold,
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
    fontFamily: NationalPark.medium,
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
    fontFamily: NationalPark.medium,
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
    fontFamily: NationalPark.semiBold,
    color: "#000",
    marginTop: 4,
  },
  halfCardSubtitle: {
    fontSize: 14,
    color: "#59B26E",
    fontFamily: NationalPark.medium,
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
    fontFamily: NationalPark.semiBold,
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
    fontSize: 14,
    fontFamily: NationalPark.semiBold,
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
    fontFamily: NationalPark.semiBold,
    color: "#2c2c2c",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  agentName: {
    fontSize: 20,
    fontFamily: NationalPark.semiBold,
    color: "#004410",
    marginBottom: 0,
  },
  agentSubtitle: {
    fontSize: 16,
    color: "#76AA83",
    fontFamily: NationalPark.medium,
    marginTop: 0,
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
    fontFamily: NationalPark.semiBold,
    color: "#004D13",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#588B64",
  },
  dividerText: {
    fontSize: 14,
    fontFamily: NationalPark.semiBold,
    color: "#588B64",
    letterSpacing: 1,
  },
  codeLabel: {
    fontSize: 20,
    fontFamily: NationalPark.semiBold,
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
    fontFamily: NationalPark.regular,
    color: "#B6B8B6",
    letterSpacing: 4,
  },
  codeInputInline: {
    flex: 1,
    fontSize: 16,
    color: "#004D13",
    fontFamily: "DM Mono",
  },
  verifyBtn: {
    height: 58,
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
    fontFamily: NationalPark.semiBold,
    color: "#7D7D7D",
    letterSpacing: 0.1,
  },
  verifyTextActive: {
    color: "#004D13",
  },

  // ── Connect laptop view ───────────────────────────────────────
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
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
    fontFamily: NationalPark.semiBold,
    color: "#ffffff",
  },
  stepLabel: {
    fontSize: 20,
    fontFamily: NationalPark.semiBold,
    color: "#004410",
  },
  laptopStepLabel: {
    fontSize: 20,
    fontFamily: NationalPark.semiBold,
    color: "#004410",
  },
  qrImageContainer: {
    borderRadius: 10,
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
    fontFamily: NationalPark.regular,
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
    fontFamily: NationalPark.bold,
  },
  qrCaption: {
    fontSize: 14,
    fontFamily: NationalPark.semiBold,
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
    fontFamily: NationalPark.bold,
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
    fontFamily: NationalPark.semiBold,
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
    fontFamily: NationalPark.semiBold,
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
    fontFamily: NationalPark.medium,
  },

  // ── Add repository view ───────────────────────────────────────
  repoDescription: {
    fontSize: 15,
    color: "#4B6B30",
    lineHeight: 22,
    fontFamily: NationalPark.regular,
  },
  repoLabel: {
    fontSize: 15,
    fontFamily: NationalPark.bold,
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
    fontFamily: NationalPark.regular,
    color: "#004D13",
  },
});
