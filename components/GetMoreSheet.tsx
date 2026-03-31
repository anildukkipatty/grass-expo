import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Clipboard,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.87;

type SheetView = "home" | "connect-agent" | "connect-laptop" | "add-repository";
type AgentTab = "claude" | "opencode";

const CLAUDE_AUTH_URL = "claude.ai/oauth/device?code=xxxxxxxxxxxxxxxx";
const OPENCODE_AUTH_URL = "opencode.ai/oauth/device?code=xxxxxxxxxxxxxxxx";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function GetMoreSheet({ visible, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [currentView, setCurrentView] = useState<SheetView>("home");
  const [activeTab, setActiveTab] = useState<AgentTab>("claude");
  const [claudeCode, setClaudeCode] = useState("");
  const [opencodeCode, setOpencodeCode] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const authCode = activeTab === "claude" ? claudeCode : opencodeCode;
  const setAuthCode = activeTab === "claude" ? setClaudeCode : setOpencodeCode;
  const authUrl = activeTab === "claude" ? CLAUDE_AUTH_URL : OPENCODE_AUTH_URL;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 28,
          stiffness: 260,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentView("home");
        setRepoUrl("");
      });
    }
  }, [visible]);

  function handleCopyAuthUrl() {
    Clipboard.setString("https://" + authUrl);
    Alert.alert("Copied!", "URL copied to clipboard.");
  }

  function handleOpenBrowser() {
    Linking.openURL("https://" + authUrl);
  }

  function handleVerify() {
    if (!authCode.trim()) return;
    Alert.alert(
      "Verifying…",
      `Checking your ${activeTab === "claude" ? "Claude" : "Opencode"} authorization code.`
    );
  }

  function handleCopyTerminalCommand() {
    Clipboard.setString("npx grass start");
    Alert.alert("Copied!", "Command copied to clipboard.");
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
          activeOpacity={0.88}
          onPress={() => setCurrentView("connect-agent")}
        >
          <View style={styles.cardLeft}>
            <Text style={styles.cardTitle}>{"Connect your\nown agent"}</Text>
            <View style={styles.hintRow}>
              <Ionicons name="bulb-outline" size={14} color="#4B9A2A" />
              <Text style={styles.hintText}>Used by 95% Grass users</Text>
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.iconBadge}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={styles.badgeImg}
                  contentFit="cover"
                />
              </View>
              <View style={styles.iconBadge}>
                <Ionicons name="terminal-outline" size={13} color="#2D7A1F" />
              </View>
            </View>
          </View>
          <View style={styles.cardRight}>
            <Image
              source={require("@/assets/images/get-more/own-agent.png")}
              style={styles.cardImage}
              contentFit="cover"
            />
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
          <View style={styles.cardLeft}>
            <Text style={styles.cardTitle}>{"Connect your\nLaptop"}</Text>
            <View style={styles.hintRow}>
              <Ionicons name="bulb-outline" size={14} color="#4B9A2A" />
              <Text style={styles.hintText}>Your machine, your rules</Text>
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="logo-apple" size={13} color="#2D7A1F" />
              </View>
              <View style={styles.iconBadge}>
                <Ionicons name="grid-outline" size={13} color="#2D7A1F" />
              </View>
              <View style={styles.iconBadge}>
                <Ionicons name="lock-closed-outline" size={13} color="#2D7A1F" />
              </View>
            </View>
          </View>
          <View style={styles.cardRight}>
            <Image
              source={require("@/assets/images/get-more/own-machine.png")}
              style={styles.cardImage}
              contentFit="cover"
            />
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
              <Ionicons name="git-branch-outline" size={22} color="#2D7A1F" />
            </View>
            <Text style={styles.halfCardTitle}>{"Add a\nrepository"}</Text>
            <Text style={styles.halfCardSubtitle}>Paste a Git Clone URL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.halfCard, { opacity: 0.9 }]}
            activeOpacity={0.88}
          >
            <View style={styles.comingBadge}>
              <Text style={styles.comingBadgeText}>Coming in v2</Text>
            </View>
            <View style={styles.iconCircle}>
              <Ionicons name="key-outline" size={22} color="#2D7A1F" />
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
          <Ionicons name="arrow-back" size={18} color="#1A5200" />
        </TouchableOpacity>

        <Text style={styles.title}>{"Connect your\nown agent"}</Text>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "claude" && styles.tabActive]}
            onPress={() => setActiveTab("claude")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="sparkles"
              size={14}
              color={activeTab === "claude" ? "#ffffff" : "#4B6B30"}
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
            style={[styles.tab, activeTab === "opencode" && styles.tabActive]}
            onPress={() => setActiveTab("opencode")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="terminal-outline"
              size={14}
              color={activeTab === "opencode" ? "#ffffff" : "#4B6B30"}
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

        <Text style={styles.agentName}>
          {activeTab === "claude" ? "Claude Code" : "Opencode"}
        </Text>
        <Text style={styles.agentSubtitle}>
          {activeTab === "claude"
            ? "Open the link, log in, paste the code.\nTakes 30 seconds."
            : "Open the link, authenticate, paste the code.\nTakes 30 seconds."}
        </Text>

        <View style={styles.urlRow}>
          <Text style={styles.urlText} numberOfLines={1} ellipsizeMode="tail">
            {authUrl}
          </Text>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={handleCopyAuthUrl}
            activeOpacity={0.75}
          >
            <Ionicons name="copy-outline" size={14} color="#92400e" />
            <Text style={styles.copyText}>COPY</Text>
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
        />

        <TouchableOpacity
          style={[
            styles.verifyBtn,
            authCode.trim().length > 0 && styles.verifyBtnActive,
          ]}
          onPress={handleVerify}
          activeOpacity={authCode.trim().length > 0 ? 0.8 : 1}
        >
          <Text
            style={[
              styles.verifyText,
              authCode.trim().length > 0 && styles.verifyTextActive,
            ]}
          >
            Verify →
          </Text>
        </TouchableOpacity>
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
          <Ionicons name="arrow-back" size={18} color="#1A5200" />
        </TouchableOpacity>

        <Text style={styles.title}>{"Connect\nyour laptop"}</Text>

        {/* Step 1 */}
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={styles.stepLabel}>Run this in your terminal</Text>
        </View>

        <View style={styles.commandRow}>
          <Text style={styles.commandText}>npx grass start</Text>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={handleCopyTerminalCommand}
            activeOpacity={0.75}
          >
            <Ionicons name="copy-outline" size={14} color="#92400e" />
            <Text style={styles.copyText}>COPY</Text>
          </TouchableOpacity>
        </View>

        {/* Step 2 */}
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>2</Text>
          </View>
          <Text style={styles.stepLabel}>Scan the QR code</Text>
        </View>

        <View style={styles.qrImageContainer}>
          <Image
            source={require("@/assets/images/get-more/connect-laptop.png")}
            style={styles.qrImage}
            contentFit="cover"
          />
          <Text style={styles.qrCaption}>POINT THE CAMERA AT THE QR</Text>
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
          <Ionicons name="arrow-back" size={18} color="#1A5200" />
        </TouchableOpacity>

        <Text style={styles.title}>{"Add a\nrepository"}</Text>

        <Text style={styles.repoDescription}>
          Paste a Git clone URL. No login needed for public repos.
        </Text>

        <Text style={styles.repoLabel}>Repository URL</Text>

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
            styles.cloneBtn,
            repoUrl.trim().length > 0 && styles.cloneBtnActive,
          ]}
          activeOpacity={repoUrl.trim().length > 0 ? 0.8 : 1}
          onPress={() => {
            if (!repoUrl.trim()) return;
            Alert.alert("Cloning…", `Starting clone of ${repoUrl.trim()}`);
          }}
        >
          <Text
            style={[
              styles.cloneBtnText,
              repoUrl.trim().length > 0 && styles.cloneBtnTextActive,
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
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.dragHandle} />

        {currentView === "home" && renderHomeView()}
        {currentView === "connect-agent" && renderConnectAgentView()}
        {currentView === "connect-laptop" && renderConnectLaptopView()}
        {currentView === "add-repository" && renderAddRepositoryView()}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: "#F0FAE8",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },
  dragHandle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    paddingTop: 10,
    gap: 12,
  },

  // ── Header ────────────────────────────────────────────────────
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0D2600",
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#4B6B30",
    marginBottom: 4,
  },

  // ── Full-width cards ─────────────────────────────────────────
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DFF0C8",
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 140,
  },
  cardLeft: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0D2600",
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hintText: {
    fontSize: 12,
    color: "#4B9A2A",
    fontWeight: "500",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#E4F5D0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C8E6A8",
    overflow: "hidden",
  },
  badgeImg: {
    width: 28,
    height: 28,
  },
  cardRight: {
    width: 150,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  cardImage: {
    width: 150,
    height: 110,
  },
  cardNote: {
    fontSize: 10,
    color: "#9BAE88",
    textAlign: "right",
    lineHeight: 14,
    paddingHorizontal: 10,
    paddingBottom: 8,
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
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E4F5D0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C8E6A8",
  },
  halfCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0D2600",
    letterSpacing: -0.2,
    lineHeight: 21,
    marginTop: 4,
  },
  halfCardSubtitle: {
    fontSize: 12,
    color: "#4B6B30",
    lineHeight: 17,
  },

  // ── Coming badge ─────────────────────────────────────────────
  comingBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F59E0B",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  comingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.1,
  },

  // ── Shared: back button ───────────────────────────────────────
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#A8D48A",
    backgroundColor: "rgba(255,255,255,0.6)",
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
    borderColor: "#DFF0C8",
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  urlText: {
    flex: 1,
    fontSize: 13,
    color: "#4B6B30",
    fontFamily: "monospace",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FDE68A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  copyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400e",
    letterSpacing: 0.5,
  },

  // ── Connect agent view ────────────────────────────────────────
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#E4F5D0",
    borderRadius: 22,
    padding: 4,
    alignSelf: "flex-start",
    gap: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  tabActive: {
    backgroundColor: "#1A5200",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B6B30",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  agentName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0D2600",
    marginBottom: 2,
  },
  agentSubtitle: {
    fontSize: 13,
    color: "#4B6B30",
    lineHeight: 19,
  },
  browserBtnWrap: {
    borderRadius: 16,
    overflow: "hidden",
  },
  browserBtn: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  browserBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.1,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#C8E6A8",
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7AAA58",
    letterSpacing: 1.2,
  },
  codeLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0D2600",
  },
  codeInput: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DFF0C8",
    paddingVertical: 18,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#0D2600",
    letterSpacing: 4,
  },
  verifyBtn: {
    backgroundColor: "#D4D4D4",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnActive: {
    backgroundColor: "#1A5200",
  },
  verifyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9B9B9B",
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
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0D2600",
  },
  commandRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DFF0C8",
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  commandText: {
    flex: 1,
    fontSize: 14,
    color: "#0D2600",
    fontFamily: "monospace",
    fontWeight: "500",
  },
  qrImageContainer: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  qrImage: {
    width: "100%",
    aspectRatio: 1.25,
  },
  qrCaption: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7AAA58",
    letterSpacing: 1.4,
    textAlign: "center",
    paddingVertical: 12,
    backgroundColor: "#ffffff",
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
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DFF0C8",
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#0D2600",
  },
  cloneBtn: {
    backgroundColor: "#D4D4D4",
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cloneBtnActive: {
    backgroundColor: "#1A5200",
  },
  cloneBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9B9B9B",
    letterSpacing: 0.1,
  },
  cloneBtnTextActive: {
    color: "#ffffff",
  },
});
