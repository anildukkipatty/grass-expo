import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import { Easing } from "react-native-reanimated";

import { AddRepoSlider } from "./AddRepoSlider";
import { ConfigureGitAccessSlider } from "./ConfigureGitAccessSlider";
import { ConnectLaptopSlider } from "./ConnectLaptopSlider";
import { ConnectOwnAgentSlider } from "./ConnectOwnAgentSlider";

import { SFPro } from "@/constants/theme";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import ClaudeIconChat from "@/assets/images/new-design/chat/claude.svg";
import OpenCodeIconChat from "@/assets/images/new-design/chat/opencode.svg";
import ChatGPTIconChat from "@/assets/images/new-design/chat/chatGPT.svg";
import MachinesIcon from "@/assets/images/new-design/new-chat/machines.svg";
import RepositoryIcon from "@/assets/images/new-design/new-chat/repository.svg";
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import { RepoItem, useNavbar } from "@/contexts/navbar-context";
import { getAllVmMetadata, getVmName } from "@/store/vm-metadata-store";

const LAST_REPO_KEY = (serverUrl: string) => `@grass/last_repo:${serverUrl}`;
const LAST_AGENT_KEY = "@grass/last_agent";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NewChatSlider2({ visible, onClose }: Props) {
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  const { selectedVmUrl, primaryVmUrl, repos } = useNavbar();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const pendingCallbackRef = useRef<(() => void) | null>(null);
  const [ownAgentVisible, setOwnAgentVisible] = useState(false);
  const [laptopVisible, setLaptopVisible] = useState(false);
  const [addRepoVisible, setAddRepoVisible] = useState(false);
  const [gitAccessVisible, setGitAccessVisible] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<RepoItem | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<"claude-code" | "opencode" | "codex">("claude-code");
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [vmMetadataMap, setVmMetadataMap] = useState<Record<string, { name: string; iconIndex: number }>>({});
  const [grassVmName, setGrassVmName] = useState<string | null>(null);

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

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    setShowRepoPicker(false);

    let cancelled = false;

    const load = async () => {
      let lastRepoRaw: string | null = null;
      let lastAgent: string | null = null;
      let metadataMap: Record<string, { name: string; iconIndex: number }> = {};
      let storedGrassVmName: string | null = null;

      try {
        [lastRepoRaw, lastAgent, metadataMap, storedGrassVmName] = await Promise.all([
          selectedVmUrl ? AsyncStorage.getItem(LAST_REPO_KEY(selectedVmUrl)) : Promise.resolve(null),
          AsyncStorage.getItem(LAST_AGENT_KEY),
          getAllVmMetadata(),
          getVmName(),
        ]);
      } catch {}

      if (cancelled) return;

      setVmMetadataMap(metadataMap);
      setGrassVmName(storedGrassVmName);
      setSelectedAgent(
        lastAgent === "claude-code" || lastAgent === "opencode" || lastAgent === "codex"
          ? lastAgent
          : "claude-code",
      );
      if (lastRepoRaw) {
        try {
          const parsed = JSON.parse(lastRepoRaw);
          if (parsed && typeof parsed.path === "string" && typeof parsed.name === "string") {
            setSelectedRepo(parsed as RepoItem);
          } else {
            setSelectedRepo(null);
          }
        } catch {
          setSelectedRepo(null);
        }
      } else {
        setSelectedRepo(null);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [visible, selectedVmUrl]);

  const truncateLabel = (value: string, max = 21) =>
    value.length > max ? `${value.slice(0, max - 1)}…` : value;

  const currentVmUrl = selectedVmUrl ?? primaryVmUrl ?? "";
  const vmNameFromMetadata = currentVmUrl ? vmMetadataMap[currentVmUrl]?.name : undefined;
  const vmNameFromPrimary =
    currentVmUrl && primaryVmUrl && currentVmUrl === primaryVmUrl ? grassVmName : null;
  const vmLabel = truncateLabel(vmNameFromMetadata || vmNameFromPrimary || currentVmUrl);

  async function handleStart() {
    if (!selectedRepo || !selectedVmUrl) return;
    const [pendingTask] = await Promise.all([
      AsyncStorage.getItem("GRASS_PENDING_FIRST_TASK"),
      AsyncStorage.setItem(LAST_REPO_KEY(selectedVmUrl), JSON.stringify(selectedRepo)),
      AsyncStorage.setItem(LAST_AGENT_KEY, selectedAgent),
    ]);
    if (pendingTask) await AsyncStorage.removeItem("GRASS_PENDING_FIRST_TASK");
    pendingCallbackRef.current = () => {
      router.push({
        pathname: "/new-navbar/chat",
        params: {
          serverUrl: selectedVmUrl,
          repoPath: selectedRepo.path,
          repoName: selectedRepo.name,
          agent: selectedAgent,
          ...(pendingTask ? { initialMessage: pendingTask } : {}),
        },
      });
    };
    bottomSheetRef.current?.dismiss();
  }

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        animationConfigs={animationConfigs}
        backdropComponent={renderBackdrop}
        onDismiss={() => {
          const cb = pendingCallbackRef.current;
          pendingCallbackRef.current = null;
          onClose();
          if (cb) cb();
        }}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.dragHandle}
      >
        <BottomSheetView style={[styles.scrollContent, { paddingBottom: bottom + 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Start new chat</Text>
              <Text style={styles.headerSubtitle}>
                Pick a repo and get going.
              </Text>
            </View>
          </View>
          {/* <TouchableOpacity
            onPress={() => setOwnAgentVisible(true)}
            activeOpacity={0.85}
          >
            <ConnectCard
              title={"Connect your\nown agent"}
              subtitle={"Used by 95%\nGrass users"}
              footerText={"We are working on\nsupporting more agents"}
              image={require("@/assets/images/new-design/connect-more/own-agent.png")}
              footerIcons={
                <>
                  <ClaudeIcon
                    width={16}
                    height={16}
                    style={{ marginRight: -8, marginTop: -10 }}
                  />
                  <OpenCodeIcon width={30} height={30} />
                </>
              }
            />
          </TouchableOpacity> */}

          {/* ── New chat UI ── */}
          {showRepoPicker ? (
            <>
              <View style={styles.newChatHeader}>
                <View style={styles.newChatHeaderText}>
                  <Text style={styles.newChatTitle}>Select repository</Text>
                  <Text style={styles.newChatSubtitle}>Choose a repo to start in.</Text>
                </View>
                <TouchableOpacity onPress={() => setShowRepoPicker(false)} style={styles.closeButton} hitSlop={8}>
                  <CloseIcon />
                </TouchableOpacity>
              </View>
              {repos.length === 0 ? (
                <View style={styles.emptyRepos}>
                  <Text style={styles.emptyReposText}>No repositories found</Text>
                </View>
              ) : (
                repos.map((repo) => (
                  <TouchableOpacity
                    key={repo.id}
                    style={styles.repoRow}
                    activeOpacity={0.7}
                    onPress={() => { setSelectedRepo(repo); setShowRepoPicker(false); }}
                  >
                    <RepositoryIcon width={20} height={20} />
                    <View style={styles.repoRowText}>
                      <Text style={styles.repoRowName}>{repo.name}</Text>
                      {repo.branch ? <Text style={styles.repoRowBranch}>{repo.branch}</Text> : null}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          ) : (
            <>
              <View style={styles.selCard}>
                <TouchableOpacity style={[styles.selRow, styles.selRowBorder]} disabled>
                  <View style={styles.selRowLeft}>
                    <MachinesIcon width={22} height={22} />
                    <Text style={styles.selLabel}>Machine</Text>
                  </View>
                  <Text style={styles.selValue}>{vmLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.selRow} onPress={() => setShowRepoPicker(true)}>
                  <View style={styles.selRowLeft}>
                    <RepositoryIcon width={22} height={22} />
                    <Text style={styles.selLabel}>Repository</Text>
                  </View>
                  <View style={styles.selRowRight}>
                    <Text style={[styles.selValue, !selectedRepo && styles.selValuePlaceholder]}>
                      {selectedRepo?.name ?? "Select a repo"}
                    </Text>
                    <Text style={styles.selChevron}>›</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.agentRow}>
                <TouchableOpacity
                  style={[styles.agentBtn, selectedAgent === "claude-code" && styles.agentBtnActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedAgent("claude-code")}
                >
                  <ClaudeIconChat width={20} height={20} />
                  <Text style={[styles.agentBtnText, selectedAgent === "claude-code" && styles.agentBtnTextActive]}>
                    Claude Code
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.agentBtn, selectedAgent === "opencode" && styles.agentBtnActiveBlack]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedAgent("opencode")}
                >
                  <OpenCodeIconChat width={20} height={20} />
                  <Text style={[styles.agentBtnText, selectedAgent === "opencode" && styles.agentBtnTextWhite]}>
                    OpenCode
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.agentBtn, selectedAgent === "codex" && styles.agentBtnActiveCodex]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedAgent("codex")}
                >
                  <ChatGPTIconChat width={20} height={20} />
                  <Text style={[styles.agentBtnText, selectedAgent === "codex" && styles.agentBtnTextWhite]}>
                    Codex
                  </Text>
                </TouchableOpacity>
              </View>

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

        </BottomSheetView>
      </BottomSheetModal>

      <ConnectOwnAgentSlider
        visible={ownAgentVisible}
        onClose={() => setOwnAgentVisible(false)}
      />
      <ConnectLaptopSlider
        visible={laptopVisible}
        onClose={() => setLaptopVisible(false)}
      />
      <AddRepoSlider
        visible={addRepoVisible}
        onClose={() => setAddRepoVisible(false)}
      />
      <ConfigureGitAccessSlider
        visible={gitAccessVisible}
        onClose={() => setGitAccessVisible(false)}
      />
    </>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerText: {
    gap: 8,
  },
  headerTitle: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    lineHeight: 32,
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
    gap: 12,
  },
  card: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
    overflow: "hidden",
    justifyContent: "space-between",
  },
  cardTop: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    gap: 8,
  },
  cardTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 20,
    lineHeight: 26,
    color: "#000",
    letterSpacing: -0.4,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subtitleText: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#808080",
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  cardBottom: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    // paddingVertical: 12,
    backgroundColor: "#f2f2f2",
  },
  footerIcons: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  halfRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfCardWrapper: {
    flex: 1,
  },
  cardTopWithImage: {
    flexDirection: "row",
    paddingLeft: 16,
    // paddingTop: 18,
    // paddingBottom: 14,
    backgroundColor: "#FFF",
    gap: 8,
    height: 140,
    overflow: "hidden",
  },
  cardTopLeft: {
    paddingVertical: 16,
    flex: 1,
    justifyContent: "space-between",
  },
  cardImage: {
    flex: 1,
    height: "100%",
  },
  footerText: {
    fontFamily: SFPro.semiBold,
    fontSize: 12,
    color: "#b2b2b2",
    textAlign: "right",
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  newChatHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 16,
  },
  newChatHeaderText: { flex: 1, gap: 4 },
  newChatTitle: {
    fontFamily: SFPro.bold,
    fontSize: 24,
    lineHeight: 28,
    color: "#000",
    letterSpacing: -0.5,
  },
  newChatSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 15,
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
  },
  selCard: {
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
  selRowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  selRowRight: { flexDirection: "row", alignItems: "center", gap: 2 },
  selLabel: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.3,
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
  selChevron: { fontSize: 22, color: "#3D841E", lineHeight: 26 },
  agentRow: {
    flexDirection: "row",
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
  agentBtnActive: { backgroundColor: "#3D841E", borderColor: "#3D841E" },
  agentBtnActiveBlack: { backgroundColor: "#000", borderColor: "#000" },
  agentBtnActiveCodex: { backgroundColor: "#10A37F", borderColor: "#10A37F" },
  agentBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#333",
    letterSpacing: -0.2,
  },
  agentBtnTextActive: { color: "#FFF" },
  agentBtnTextWhite: { color: "#FFF" },
  ctaButton: {
    backgroundColor: "#3D841E",
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 8,
  },
  ctaButtonDisabled: { backgroundColor: "#ABABAB" },
  ctaText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFF",
    letterSpacing: -0.3,
  },
  repoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  repoRowText: { flex: 1, gap: 2 },
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
  emptyRepos: { paddingVertical: 40, alignItems: "center" },
  emptyReposText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
  },
});
