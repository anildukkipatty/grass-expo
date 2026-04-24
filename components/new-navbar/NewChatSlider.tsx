import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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

// import BranchIcon from "@/assets/images/new-design/new-chat/branch.svg";
import MachinesIcon from "@/assets/images/new-design/new-chat/machines.svg";
import RepositoryIcon from "@/assets/images/new-design/new-chat/repository.svg";
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import ClaudeIcon from "@/assets/images/new-design/chat/claude.svg";
import OpenCodeIcon from "@/assets/images/new-design/chat/opencode.svg";
import { SFPro } from "@/constants/theme";
import { extractHost, RepoItem, useNavbar } from "@/contexts/navbar-context";
import {
  getEntry,
  getRepoDetailsStore,
  listReposStore,
  openConnectionWithKey,
} from "@/store/connection-store";
import { resolveServerKey, resolveServerUrl } from "@/store/url-store";
import { getAllVmMetadata, getVmName } from "@/store/vm-metadata-store";

const LAST_REPO_KEY = (serverUrl: string) => `@grass/last_repo:${serverUrl}`;
const LAST_AGENT_KEY = "@grass/last_agent";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CLOSE_THRESHOLD = 80;

type Props = {
  visible: boolean;
  onClose: () => void;
};

type SelectionRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
  onPress?: () => void;
  placeholder?: boolean;
};

function SelectionRow({ icon, label, value, isLast, onPress, placeholder }: SelectionRowProps) {
  return (
    <TouchableOpacity
      style={[styles.selRow, !isLast && styles.selRowBorder]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.selRowLeft}>
        {icon}
        <Text style={styles.selLabel}>{label}</Text>
      </View>
      <View style={styles.selRowRight}>
        <Text style={[styles.selValue, placeholder && styles.selValuePlaceholder]}>
          {value}
        </Text>
        {onPress && <Text style={styles.selChevron}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

export function NewChatSlider({ visible, onClose }: Props) {
  const router = useRouter();
  const { selectedVmUrl, primaryVmUrl, vmUrls } = useNavbar();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [vmMetadataMap, setVmMetadataMap] = useState<Record<string, { name: string; iconIndex: number }>>({});
  const [grassVmName, setGrassVmName] = useState<string | null>(null);
  const [localVmUrl, setLocalVmUrl] = useState<string>("");
  const [localRepos, setLocalRepos] = useState<RepoItem[]>([]);
  const [localReposLoading, setLocalReposLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<RepoItem | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<"claude-code" | "opencode">("claude-code");
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [showMachinePicker, setShowMachinePicker] = useState(false);
  const showRepoPickerRef = useRef(false);

  // Sync ref so panResponder can read current showRepoPicker without stale closure
  useEffect(() => {
    showRepoPickerRef.current = showRepoPicker || showMachinePicker;
  }, [showRepoPicker, showMachinePicker]);

  // Fetch repos whenever localVmUrl changes
  useEffect(() => {
    if (!localVmUrl) return;
    let cancelled = false;
    setLocalReposLoading(true);
    setLocalRepos([]);

    const run = async () => {
      const key = resolveServerKey(localVmUrl);
      const realUrl = resolveServerUrl(localVmUrl);
      openConnectionWithKey(key, realUrl);
      await listReposStore(key);
      if (cancelled) return;

      const entry = getEntry(key);
      const repoList = entry?.repos ?? [];
      await Promise.all(repoList.map((r) => getRepoDetailsStore(key, r.path)));
      if (cancelled) return;

      const updatedEntry = getEntry(key);
      const details = updatedEntry?.repoDetails ?? new Map();
      const mapped: RepoItem[] = repoList.map((r, i) => ({
        id: String(i),
        name: r.name,
        path: r.path,
        branch: details.get(r.path)?.branch ?? "main",
        action: "Open Code",
        badge: details.get(r.path)?.dominantLanguage ?? (r.isGit ? "Git" : "Folder"),
        badgeType: "gray" as const,
      }));

      if (!cancelled) {
        setLocalRepos(mapped);
        setLocalReposLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [localVmUrl]);

  // Reset state and pre-populate from last-used values when slider opens
  useEffect(() => {
    if (!visible) return;
    setShowRepoPicker(false);
    setShowMachinePicker(false);
    getAllVmMetadata().then(setVmMetadataMap);
    getVmName().then(setGrassVmName);

    const initialVm = selectedVmUrl ?? primaryVmUrl ?? "";
    setLocalVmUrl(initialVm);
    setSelectedRepo(null);

    const load = async () => {
      let lastRepoRaw: string | null = null;
      let lastAgent: string | null = null;
      try {
        [lastRepoRaw, lastAgent] = await Promise.all([
          initialVm ? AsyncStorage.getItem(LAST_REPO_KEY(initialVm)) : Promise.resolve(null),
          AsyncStorage.getItem(LAST_AGENT_KEY),
        ]);
      } catch {
        // AsyncStorage unavailable — fall through to defaults
      }

      setSelectedAgent(lastAgent === "claude-code" || lastAgent === "opencode" ? lastAgent : "claude-code");

      if (lastRepoRaw) {
        try {
          const parsed = JSON.parse(lastRepoRaw);
          if (parsed && typeof parsed.path === "string" && typeof parsed.name === "string") {
            setSelectedRepo(parsed as RepoItem);
          }
        } catch {
          // ignore
        }
      }
    };

    load();
  }, [visible, selectedVmUrl, primaryVmUrl]);

  const getVmDisplayName = (url: string) => {
    const meta = vmMetadataMap[url];
    if (meta?.name) return meta.name;
    if (url === primaryVmUrl && grassVmName) return grassVmName;
    return extractHost(url);
  };

  const vmLabel = localVmUrl ? getVmDisplayName(localVmUrl) : extractHost(primaryVmUrl ?? "");

  const open = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, backdropOpacity]);

  const close = useCallback((onComplete?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      if (onComplete) {
        onComplete();
      } else {
        router.navigate("/new-navbar");
      }
    });
  }, [translateY, backdropOpacity, onClose, router]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      open();
    }
  }, [visible, open, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > CLOSE_THRESHOLD || gs.vy > 0.5) {
          if (showRepoPickerRef.current) {
            // Drag on repo picker → return to main slider, not home
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              damping: 20,
              stiffness: 200,
            }).start();
            setShowRepoPicker(false);
          } else {
            close();
          }
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    }),
  ).current;

  async function handleStart() {
    if (!selectedRepo || !localVmUrl) return;
    const [pendingTask] = await Promise.all([
      AsyncStorage.getItem("GRASS_PENDING_FIRST_TASK"),
      AsyncStorage.setItem(LAST_REPO_KEY(localVmUrl), JSON.stringify(selectedRepo)),
      AsyncStorage.setItem(LAST_AGENT_KEY, selectedAgent),
    ]);
    if (pendingTask) await AsyncStorage.removeItem("GRASS_PENDING_FIRST_TASK");
    close(() => {
      // Switch to home tab first so back-from-chat lands on index, not the new tab
      router.navigate("/new-navbar/(tabs)/index" as any);
      router.push({
        pathname: "/new-navbar/chat",
        params: {
          serverUrl: localVmUrl,
          repoPath: selectedRepo!.path,
          repoName: selectedRepo!.name,
          agent: selectedAgent,
          ...(pendingTask ? { initialMessage: pendingTask } : {}),
        },
      });
    });
  }

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={() => close()}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Drag handle */}
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.dragger} />
        </View>

        {showMachinePicker ? (
          <>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Select machine</Text>
                <Text style={styles.headerSubtitle}>Choose a VM to run your agent on.</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowMachinePicker(false)}
                style={styles.closeButton}
                hitSlop={8}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.repoList} showsVerticalScrollIndicator={false}>
              {vmUrls.length === 0 ? (
                <View style={styles.emptyRepos}>
                  <Text style={styles.emptyReposText}>No machines found</Text>
                </View>
              ) : (
                vmUrls.map((url) => (
                  <TouchableOpacity
                    key={url}
                    style={[styles.repoRow, url === localVmUrl && styles.repoRowSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setLocalVmUrl(url);
                      setSelectedRepo(null);
                      setShowMachinePicker(false);
                    }}
                  >
                    <MachinesIcon width={20} height={20} />
                    <View style={styles.repoRowText}>
                      <Text style={styles.repoRowName}>{getVmDisplayName(url)}</Text>
                    </View>
                    {url === localVmUrl && (
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </>
        ) : showRepoPicker ? (
          <>
            {/* Repo picker header */}
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Select repository</Text>
                <Text style={styles.headerSubtitle}>Choose a repo to start in.</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowRepoPicker(false)}
                style={styles.closeButton}
                hitSlop={8}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.repoList} showsVerticalScrollIndicator={false}>
              {localReposLoading ? (
                <View style={styles.emptyRepos}>
                  <Text style={styles.emptyReposText}>Loading repositories…</Text>
                </View>
              ) : localRepos.length === 0 ? (
                <View style={styles.emptyRepos}>
                  <Text style={styles.emptyReposText}>No repositories found</Text>
                </View>
              ) : (
                localRepos.map((repo) => (
                  <TouchableOpacity
                    key={repo.id}
                    style={styles.repoRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedRepo(repo);
                      setShowRepoPicker(false);
                    }}
                  >
                    <RepositoryIcon width={20} height={20} />
                    <View style={styles.repoRowText}>
                      <Text style={styles.repoRowName}>{repo.name}</Text>
                      {repo.branch ? (
                        <Text style={styles.repoRowBranch}>{repo.branch}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </>
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Start new chat</Text>
                <Text style={styles.headerSubtitle}>Pick a repo and branch to get going.</Text>
              </View>
              <TouchableOpacity onPress={() => close()} style={styles.closeButton} hitSlop={8}>
                <CloseIcon />
              </TouchableOpacity>
            </View>

            {/* Selection rows */}
            <View style={styles.card}>
              <SelectionRow
                icon={<MachinesIcon width={22} height={22} />}
                label="Machine"
                value={vmLabel}
                onPress={vmUrls.length > 1 ? () => setShowMachinePicker(true) : undefined}
              />
              <SelectionRow
                icon={<RepositoryIcon width={22} height={22} />}
                label="Repository"
                value={selectedRepo?.name ?? "Select a repo"}
                placeholder={!selectedRepo}
                onPress={() => setShowRepoPicker(true)}
                isLast
              />
              {/* Branch row commented out
              <SelectionRow
                icon={<BranchIcon width={22} height={22} />}
                label="Branch"
                value={selectedRepo?.branch ?? "—"}
                isLast
              />
              */}
            </View>

            {/* Agent selection */}
            <View style={styles.agentRow}>
              <TouchableOpacity
                style={[
                  styles.agentBtn,
                  selectedAgent === "claude-code" && styles.agentBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedAgent("claude-code")}
              >
                <ClaudeIcon width={20} height={20} />
                <Text
                  style={[
                    styles.agentBtnText,
                    selectedAgent === "claude-code" && styles.agentBtnTextActive,
                  ]}
                >
                  Claude Code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.agentBtn,
                  selectedAgent === "opencode" && styles.agentBtnActiveBlack,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedAgent("opencode")}
              >
                <OpenCodeIcon width={20} height={20} />
                <Text
                  style={[
                    styles.agentBtnText,
                    selectedAgent === "opencode" && styles.agentBtnTextWhite,
                  ]}
                >
                  OpenCode
                </Text>
              </TouchableOpacity>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaButton, !selectedRepo && styles.ctaButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleStart}
              disabled={!selectedRepo}
            >
              <Text style={styles.ctaText}>Start new chat</Text>
            </TouchableOpacity>
          </>
        )}
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
    paddingBottom: 16,
    backgroundColor: "#FFF",
  },
  dragger: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCC",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerText: {
    flex: 1,
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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
    overflow: "hidden",
    marginBottom: 16,
  },
  selRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  selRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  selRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selLabel: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.3,
  },
  selRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  selValue: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#3D841E",
    letterSpacing: -0.3,
  },
  selValuePlaceholder: {
    color: "#ABABAB",
    fontFamily: SFPro.regular,
  },
  selChevron: {
    fontSize: 22,
    color: "#3D841E",
    lineHeight: 26,
  },

  // Agent selection
  agentRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  agentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
  },
  agentBtnActive: {
    backgroundColor: "#3D841E",
    borderColor: "#3D841E",
  },
  agentBtnActiveBlack: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  agentBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#333",
    letterSpacing: -0.2,
  },
  agentBtnTextActive: {
    color: "#FFF",
  },
  agentBtnTextWhite: {
    color: "#FFF",
  },

  // CTA
  ctaButton: {
    marginHorizontal: 16,
    backgroundColor: "#3D841E",
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaButtonDisabled: {
    backgroundColor: "#ABABAB",
  },
  ctaText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFF",
    letterSpacing: -0.3,
  },

  // Repo picker
  repoList: {
    maxHeight: 300,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  repoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  repoRowText: {
    flex: 1,
    gap: 2,
  },
  repoRowName: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#000",
    letterSpacing: -0.3,
  },
  repoRowBranch: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#808080",
  },
  emptyRepos: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyReposText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
  },
  repoRowSelected: {
    backgroundColor: "#F5FFF0",
  },
  selectedCheckmark: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#3D841E",
  },
});
