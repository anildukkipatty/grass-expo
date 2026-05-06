import { BlurView } from "expo-blur";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import GithubIcon from "@/assets/images/new-design/connect-more/github.svg";
import LockIcon from "@/assets/images/new-design/connect-more/lock.svg";
import SuccessMark from "@/assets/images/new-design/connect-more/success-mark.svg";
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";

import { githubListRepos, githubOauthStatus, type GithubRepo } from "@/api/github";
import { posthog } from "@/constants/posthog";
import { SFPro } from "@/constants/theme";
import { getToken } from "@/store/auth-store";
import { cloneRepoStore, getEntry } from "@/store/connection-store";
import { type RepoItem } from "@/contexts/navbar-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;
const CLOSE_THRESHOLD = 80;

type Props = {
  visible: boolean;
  onClose: () => void;
  serverUrl?: string;
  existingRepos?: RepoItem[];
  onRepoAdded?: () => void;
  onConfigureGitAccess?: () => void;
};

export function CloneFromGithubSlider({
  visible,
  onClose,
  serverUrl,
  existingRepos = [],
  onRepoAdded,
  onConfigureGitAccess,
}: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const successTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [cloningRepoId, setCloningRepoId] = useState<string | number | null>(null);
  const [vmRepoNames, setVmRepoNames] = useState<Set<string>>(new Set());
  const [vmReposReady, setVmReposReady] = useState(false);
  const [clonedRepoName, setClonedRepoName] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

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

  const slideSuccessIn = useCallback(() => {
    setShowSuccess(true);
    successTranslateY.setValue(SHEET_HEIGHT);
    Animated.spring(successTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 180,
    }).start();
  }, [successTranslateY]);

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

  // ─── Fetch repo names from the selected VM's grass-ide server ───────────

  const loadVmRepos = useCallback(async () => {
    if (!serverUrl) return;
    try {
      const entry = getEntry(serverUrl);
      const baseUrl = entry?.baseUrl ?? serverUrl;
      const res = await fetch(`${baseUrl}/repos`);
      if (res.ok) {
        const data = await res.json() as { repos?: Array<{ name: string }> };
        setVmRepoNames(new Set((data.repos ?? []).map((r) => r.name.trim().toLowerCase())));
        setVmReposReady(true);
      }
    } catch {
      // VM unreachable — fall back to existingRepos
    }
  }, [serverUrl]);

  // ─── Load repos from GitHub API ──────────────────────────────────────────

  const loadRepos = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setReposLoading(true);
    const res = await githubListRepos(token);
    setReposLoading(false);
    if (res.ok) {
      setRepos(res.data.repos);
    } else {
      Alert.alert("Error", res.error);
    }
  }, []);

  // ─── On open: check GitHub status then load repos if connected ───────────

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(SCREEN_HEIGHT);
    successTranslateY.setValue(SHEET_HEIGHT);
    setRepos([]);
    setCloningRepoId(null);
    setClonedRepoName("");
    setShowSuccess(false);
    setIsCheckingStatus(true);
    setVmRepoNames(new Set());
    setVmReposReady(false);
    open();

    void loadVmRepos();

    void (async () => {
      const token = await getToken();
      if (!token) { setIsCheckingStatus(false); return; }
      const res = await githubOauthStatus(token);
      if (res.ok && res.data.connected) {
        setGithubConnected(true);
        setGithubLogin(res.data.githubLogin ?? null);
        setIsCheckingStatus(false);
        await loadRepos();
      } else {
        setGithubConnected(false);
        setIsCheckingStatus(false);
      }
    })();
  }, [visible, open, translateY, successTranslateY, loadRepos, loadVmRepos]);

  // ─── Clone handler ────────────────────────────────────────────────────────

  const handleClone = useCallback(async (repo: GithubRepo) => {
    if (cloningRepoId !== null) return;
    if (!serverUrl) {
      Alert.alert("No machine", "No machine selected. Please select a machine first.");
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
      posthog.capture("repo_cloned", { repo_name: repo.fullName, source: "github" });
      setVmRepoNames((prev) => new Set([...prev, repo.name.trim().toLowerCase()]));
      onRepoAdded?.();
      setClonedRepoName(repo.name);
      slideSuccessIn();
    }
  }, [cloningRepoId, serverUrl, onRepoAdded, slideSuccessIn]);

  // Build fallback set from existingRepos (used only when VM fetch failed/unreachable)
  const existingNamesSet = new Set(existingRepos.map((r) => r.name.trim().toLowerCase()));

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
          <View style={[styles.dragger, showSuccess && styles.draggerOnGreen]} />
        </View>

        <TouchableOpacity
          onPress={close}
          style={[styles.closeButton, showSuccess && styles.closeButtonTranslucent]}
          hitSlop={8}
        >
          <CloseIcon />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Clone from GitHub</Text>
          <Text style={styles.headerSubtitle}>
            {githubConnected && githubLogin
              ? `Signed in as @${githubLogin}`
              : "Select a repository to clone into your machine."}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {isCheckingStatus ? (
            /* ── Loading state ── */
            <View style={styles.centerBlock}>
              <ActivityIndicator size="large" color="#3D841E" />
            </View>

          ) : !githubConnected ? (
            /* ── Not connected: prompt user to set up git access ── */
            <View style={styles.notConnectedCard}>
              <GithubIcon width={40} height={40} />
              <Text style={styles.notConnectedTitle}>GitHub not connected</Text>
              <Text style={styles.notConnectedDesc}>
                Connect your GitHub account first to browse and clone your repositories.
              </Text>
              <TouchableOpacity
                style={styles.connectBtn}
                activeOpacity={0.85}
                onPress={() => {
                  close();
                  onConfigureGitAccess?.();
                }}
              >
                <Text style={styles.connectBtnText}>Configure Git Access</Text>
              </TouchableOpacity>
            </View>

          ) : reposLoading ? (
            /* ── Loading repos ── */
            <View style={styles.centerBlock}>
              <ActivityIndicator size="large" color="#3D841E" />
              <Text style={styles.loadingText}>Fetching your repositories…</Text>
            </View>

          ) : repos.length === 0 ? (
            /* ── Empty state ── */
            <View style={styles.centerBlock}>
              <Text style={styles.emptyText}>No repositories found on GitHub.</Text>
              <TouchableOpacity onPress={loadRepos} style={styles.retryBtn} activeOpacity={0.7}>
                <Text style={styles.retryText}>Refresh</Text>
              </TouchableOpacity>
            </View>

          ) : (
            /* ── Repo list ── */
            <View style={styles.repoList}>
              {repos.map((repo, idx) => {
                const alreadyAdded = vmReposReady
                  ? vmRepoNames.has(repo.name.trim().toLowerCase())
                  : existingNamesSet.has(repo.name.trim().toLowerCase()) || Boolean(repo.alreadyOnVm);
                const isCloning = cloningRepoId === repo.id;
                const isLast = idx === repos.length - 1;
                return (
                  <TouchableOpacity
                    key={repo.id}
                    style={[styles.repoRow, !isLast && styles.repoRowBorder, alreadyAdded && styles.repoRowDimmed]}
                    activeOpacity={0.7}
                    disabled={cloningRepoId !== null || alreadyAdded}
                    onPress={() => handleClone(repo)}
                  >
                    <View style={styles.repoInfo}>
                      <Text style={styles.repoName} numberOfLines={1}>{repo.name}</Text>
                      <Text style={styles.repoFullName} numberOfLines={1}>{repo.fullName}</Text>
                    </View>
                    <View style={styles.repoActions}>
                      {repo.private && (
                        <LockIcon width={13} height={13} />
                      )}
                      {isCloning ? (
                        <ActivityIndicator size="small" color="#3D841E" />
                      ) : (
                        <Text style={[styles.cloneText, alreadyAdded && styles.cloneTextDimmed]}>
                          {alreadyAdded ? "Added" : "Clone"}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* ── Green success overlay ── */}
        <Animated.View
          style={[styles.successOverlay, { transform: [{ translateY: successTranslateY }] }]}
          pointerEvents={showSuccess ? "auto" : "none"}
        >
          {showSuccess && (
            <View style={styles.greenContent}>
              <View style={styles.greenCenter}>
                <SuccessMark width={192} height={244} />
                <Text style={styles.greenTitle}>Repo cloned</Text>
                <View style={styles.repoPillRow}>
                  <View style={styles.repoPill}>
                    <Text style={styles.repoPillText}>{clonedRepoName}</Text>
                  </View>
                  <Text style={styles.greenSubtitle}>
                    is on your machine.{"\n"}Ready when you are.
                  </Text>
                </View>
              </View>
              <View style={styles.greenFooter}>
                <TouchableOpacity style={styles.primaryButton} onPress={close} activeOpacity={0.85}>
                  <Text style={styles.primaryButtonText}>Done</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addAnotherButton}
                  activeOpacity={0.85}
                  onPress={() => {
                    successTranslateY.setValue(SHEET_HEIGHT);
                    setShowSuccess(false);
                    setClonedRepoName("");
                  }}
                >
                  <Text style={styles.addAnotherButtonText}>Clone another</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
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
    maxHeight: SHEET_HEIGHT,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 6,
  },
  dragger: { width: 36, height: 5, borderRadius: 100, backgroundColor: "#CCC" },
  draggerOnGreen: { backgroundColor: "rgba(255, 255, 255, 0.40)" },
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
  closeButtonTranslucent: { backgroundColor: "rgba(255, 255, 255, 0.30)" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // Center states
  centerBlock: {
    alignItems: "center",
    paddingTop: 48,
    gap: 16,
  },
  loadingText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
  },
  emptyText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#DFDFDF",
  },
  retryText: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#3D841E",
    letterSpacing: -0.2,
  },

  // Not connected
  notConnectedCard: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  notConnectedTitle: {
    fontFamily: SFPro.bold,
    fontSize: 18,
    color: "#000",
    letterSpacing: -0.3,
  },
  notConnectedDesc: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
    textAlign: "center",
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  connectBtn: {
    marginTop: 4,
    width: "100%",
    borderRadius: 50,
    backgroundColor: "#3D841E",
    paddingVertical: 14,
    alignItems: "center",
  },
  connectBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#FFF",
    letterSpacing: -0.3,
  },

  // Repo list
  repoList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    overflow: "hidden",
  },
  repoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFF",
  },
  repoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  repoRowDimmed: { opacity: 0.55 },
  repoInfo: { flex: 1, gap: 2, marginRight: 12 },
  repoName: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#000",
    letterSpacing: -0.3,
  },
  repoFullName: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#808080",
    letterSpacing: -0.2,
  },
  repoActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 60,
    justifyContent: "flex-end",
  },
  cloneText: {
    fontFamily: SFPro.semiBold,
    fontSize: 14,
    color: "#3D841E",
    letterSpacing: -0.2,
  },
  cloneTextDimmed: { color: "#808080" },

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
  greenTitle: {
    fontFamily: SFPro.bold,
    fontSize: 32,
    color: "#FFF",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  repoPillRow: { alignItems: "center", gap: 8 },
  repoPill: {
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.20)",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  repoPillText: {
    fontFamily: "DM Mono",
    fontSize: 14,
    color: "#FFF",
    letterSpacing: -0.2,
  },
  greenSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.80)",
    textAlign: "center",
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  greenFooter: { paddingHorizontal: 16, gap: 12 },
  primaryButton: {
    borderRadius: 50,
    backgroundColor: "#FFF",
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#3D841E",
    letterSpacing: -0.3,
  },
  addAnotherButton: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#FFF",
    paddingVertical: 16,
    alignItems: "center",
  },
  addAnotherButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#FFF",
    letterSpacing: -0.3,
  },
});
