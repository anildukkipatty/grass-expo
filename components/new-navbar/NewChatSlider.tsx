import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Easing } from "react-native-reanimated";

import ClaudeIcon from "@/assets/images/new-design/chat/claude.svg";
import OpenCodeIcon from "@/assets/images/new-design/chat/opencode.svg";
import MachinesIcon from "@/assets/images/new-design/new-chat/machines.svg";
import RepositoryIcon from "@/assets/images/new-design/new-chat/repository.svg";
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import { SFPro } from "@/constants/theme";
import { extractHost, RepoItem, useNavbar } from "@/contexts/navbar-context";
import { getAllVmMetadata, getVmName } from "@/store/vm-metadata-store";

const LAST_REPO_KEY = (serverUrl: string) => `@grass/last_repo:${serverUrl}`;
const LAST_AGENT_KEY = "@grass/last_agent";

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

function SelectionRow({
  icon,
  label,
  value,
  isLast,
  onPress,
  placeholder,
}: SelectionRowProps) {
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
        <Text
          style={[styles.selValue, placeholder && styles.selValuePlaceholder]}
        >
          {value}
        </Text>
        {onPress && <Text style={styles.selChevron}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

export function NewChatSlider({ visible, onClose }: Props) {
  const router = useRouter();
  const { selectedVmUrl, primaryVmUrl, repos } = useNavbar();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const pendingCallbackRef = useRef<(() => void) | null>(null);
  const wasPresented = useRef(false);

  const [vmMetadataMap, setVmMetadataMap] = useState<Record<string, { name: string; iconIndex: number }>>({});
  const [grassVmName, setGrassVmName] = useState<string | null>(null);
  const [localVmUrl, setLocalVmUrl] = useState<string>("");
const [selectedRepo, setSelectedRepo] = useState<RepoItem | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<
    "claude-code" | "opencode" | "pi"
  >("claude-code");
  const [showRepoPicker, setShowRepoPicker] = useState(false);

  const snapPoints = ["60%"];
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

  useEffect(() => {
    if (visible) {
      wasPresented.current = true;
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  // Reset state and pre-populate from last-used values when slider opens
  useEffect(() => {
    if (!visible) return;
    setShowRepoPicker(false);
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

      setSelectedAgent(
        lastAgent === "claude-code" || lastAgent === "opencode" || lastAgent === "pi"
          ? lastAgent
          : "claude-code",
      );

      if (lastRepoRaw) {
        try {
          const parsed = JSON.parse(lastRepoRaw);
          if (
            parsed &&
            typeof parsed.path === "string" &&
            typeof parsed.name === "string"
          ) {
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

  const handleDismiss = useCallback(() => {
    if (!wasPresented.current) return;
    wasPresented.current = false;
    const cb = pendingCallbackRef.current;
    pendingCallbackRef.current = null;
    onClose();
    if (cb) cb();
  }, [onClose]);

  async function handleStart() {
    if (!selectedRepo || !localVmUrl) return;
    const [pendingTask] = await Promise.all([
      AsyncStorage.getItem("GRASS_PENDING_FIRST_TASK"),
      AsyncStorage.setItem(
        LAST_REPO_KEY(localVmUrl),
        JSON.stringify(selectedRepo),
      ),
      AsyncStorage.setItem(LAST_AGENT_KEY, selectedAgent),
    ]);
    if (pendingTask) await AsyncStorage.removeItem("GRASS_PENDING_FIRST_TASK");
    pendingCallbackRef.current = () => {
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
    };
    bottomSheetRef.current?.dismiss();
  }

  return (
    <>
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.dragHandle}
    >
      {showRepoPicker ? (
        <>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Select repository</Text>
              <Text style={styles.headerSubtitle}>
                Choose a repo to start in.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowRepoPicker(false)}
              style={styles.closeButton}
              hitSlop={8}
            >
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <BottomSheetScrollView
            style={styles.repoList}
            showsVerticalScrollIndicator={false}
          >
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
          </BottomSheetScrollView>
        </>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Start new chat</Text>
              <Text style={styles.headerSubtitle}>
                Pick a repo and branch to get going.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.dismiss()}
              style={styles.closeButton}
              hitSlop={8}
            >
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <SelectionRow
              icon={<MachinesIcon width={22} height={22} />}
              label="Machine"
              value={vmLabel}
            />
            <SelectionRow
              icon={<RepositoryIcon width={22} height={22} />}
              label="Repository"
              value={selectedRepo?.name ?? "Select a repo"}
              placeholder={!selectedRepo}
              onPress={() => setShowRepoPicker(true)}
              isLast
            />
          </View>

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

            <TouchableOpacity
              style={[
                styles.agentBtn,
                selectedAgent === "pi" && styles.agentBtnActivePi,
              ]}
              activeOpacity={0.8}
              onPress={() => setSelectedAgent("pi")}
            >
              <Text style={[styles.piSymbol, selectedAgent === "pi" && styles.piSymbolActive]}>π</Text>
              <Text
                style={[
                  styles.agentBtnText,
                  selectedAgent === "pi" && styles.agentBtnTextWhite,
                ]}
              >
                Pi Codex
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.ctaButton,
              !selectedRepo && styles.ctaButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleStart}
            disabled={!selectedRepo}
          >
            <Text style={styles.ctaText}>Start new chat</Text>
          </TouchableOpacity>
        </>
      )}
    </BottomSheetModal>
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
  agentBtnActivePi: {
    backgroundColor: "#1D3461",
    borderColor: "#1D3461",
  },
  piSymbol: {
    fontSize: 18,
    fontFamily: SFPro.bold,
    color: "#333",
    lineHeight: 22,
  },
  piSymbolActive: {
    color: "#FFF",
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
  repoList: {
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
