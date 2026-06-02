import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FloatIcon from "@/assets/images/new-design/navbar/float-icon.svg";
import { ConnectMoreSlider } from "@/components/new-navbar/ConnectMoreSlider";
import {
  Machine,
  MachineCarousel,
} from "@/components/new-navbar/MachineCarousel";
import { NewChatSlider2 } from "@/components/new-navbar/NewChatSlider2";
import { posthog } from "@/constants/posthog";
import { VM_ICONS } from "@/constants/vm-icons";
import { extractHost, useNavbar } from "@/contexts/navbar-context";
import { setSessionLabel } from "@/store/session-label-store";
import {
  getSessionStatuses,
  markThreadSeen,
  resolveGrassIdForSdk,
  SessionStatusItem,
  shouldShowDoneIndicator,
  subscribeToPermissions,
} from "@/store/connection-store";
import { formatRelativeTime } from "@/store/thread-store";
import { getAllVmMetadata, getVmName } from "@/store/vm-metadata-store";

import ClaudeIcon from "@/assets/images/new-design/navbar/claude.svg";
import FolderIcon from "@/assets/images/new-design/navbar/folder-icon.svg";
import OpenCodeIcon from "@/assets/images/new-design/navbar/opencode.svg";

import { SFPro } from "@/constants/theme";

const FORCE_SKELETON_PREVIEW = false;

// ─── Static pool of colors + images for VMs without saved metadata ────────────

const VM_STYLES: {
  borderColor: string;
  backgroundColor: string;
  image: ReturnType<typeof require>;
}[] = [
  {
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-one.png"),
    borderColor: "#72C44E",
    backgroundColor: "#E3FDD7",
  },
  {
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-two.png"),
    borderColor: "#D8A4E8",
    backgroundColor: "#f0c5e8",
  },
  {
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-three.png"),
    borderColor: "#BDBDBD",
    backgroundColor: "#D9D9D9",
  },
];

// Colors for custom VMs that have metadata (SVG icons)
const CUSTOM_VM_COLORS: { borderColor: string; backgroundColor: string }[] = [
  { borderColor: "#72C44E", backgroundColor: "#E3FDD7" },
  { borderColor: "#D8A4E8", backgroundColor: "#f0c5e8" },
  { borderColor: "#A0C4E8", backgroundColor: "#DCF0FC" },
  { borderColor: "#F4A460", backgroundColor: "#FFF0E0" },
  { borderColor: "#BDBDBD", backgroundColor: "#D9D9D9" },
];

// ─── Agent icon mapping (thread.tool → SVG component) ─────────────────────────

const AGENT_ICONS: Record<
  string,
  React.FC<{ width: number; height: number }>
> = {
  "claude-code": ClaudeIcon,
  claude: ClaudeIcon,
  opencode: OpenCodeIcon,
};

// ─── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonItem({ opacity }: { opacity: Animated.Value }) {
  return (
    <View style={styles.threadItem}>
      <Animated.View style={[styles.skeletonIcon, { opacity }]} />
      <View style={styles.threadContent}>
        <View style={styles.threadTopRow}>
          <Animated.View
            style={[styles.skeletonBar, styles.skeletonBarLong, { opacity }]}
          />
          <Animated.View
            style={[styles.skeletonTimePill, { opacity }]}
          />
        </View>

        <View style={styles.threadBottomRow}>
          <View style={styles.threadCommandRow}>
            <Animated.View style={[styles.skeletonFolderIcon, { opacity }]} />
            <Animated.View
              style={[styles.skeletonBar, styles.skeletonBarShort, { opacity }]}
            />
          </View>
          <View style={styles.threadStatusCell}>
            <Animated.View style={[styles.skeletonStatusDot, { opacity }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  const [connectMoreVisible, setConnectMoreVisible] = React.useState(false);
  const [newChatVisible, setNewChatVisible] = React.useState(false);
  const [vmMetadataMap, setVmMetadataMap] = useState<
    Record<string, { name: string; iconIndex: number }>
  >({});
  const [grassVmName, setGrassVmName] = useState<string | null>(null);
  const hasPromptedForName = useRef(false);

  const {
    vmUrls,
    activeVmTab,
    setActiveVmTab,
    primaryVmUrl,
    vmRunning,
    vmUrlStatuses,
    threads,
    selectedVmUrl,
    startupOverlayVisible,
    wakeFailed,
    retryWake,
    notifyWakeTabFocus,
    notifyWakeTabBlur,
  } = useNavbar();

  const [sessionStatuses, setSessionStatuses] = useState<SessionStatusItem[]>([]);

  useEffect(() => {
    if (!selectedVmUrl) { setSessionStatuses([]); return; }
    setSessionStatuses(getSessionStatuses(selectedVmUrl));
    const unsub = subscribeToPermissions(selectedVmUrl, () => {
      setSessionStatuses(getSessionStatuses(selectedVmUrl));
    });
    return unsub;
  }, [selectedVmUrl]);

  useFocusEffect(
    React.useCallback(() => {
      if (selectedVmUrl) setSessionStatuses(getSessionStatuses(selectedVmUrl));
      getAllVmMetadata().then(setVmMetadataMap);
      notifyWakeTabFocus();
      return () => notifyWakeTabBlur();
    }, [selectedVmUrl, notifyWakeTabFocus, notifyWakeTabBlur])
  );

  // Load stored names + icons whenever the VM list changes
  useEffect(() => {
    getAllVmMetadata().then(setVmMetadataMap);
    getVmName().then((name) => {
      setGrassVmName(name);
      if (!name && !hasPromptedForName.current) {
        hasPromptedForName.current = true;
        router.push({
          pathname: "/onboarding/vm-name" as any,
          params: { mode: "rename" },
        });
      }
    });
  }, [vmUrls]);

  // Shimmer animation for skeleton
  const shimmerAnim = useRef(new Animated.Value(0.5)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Progress bar animation shown while VM is not running
  const progressAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!vmRunning) {
      const loop = Animated.loop(
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
      );
      loop.start();
      return () => loop.stop();
    } else {
      progressAnim.setValue(0);
    }
  }, [vmRunning]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Map vmUrls → Machine[] using stored name/icon when available
  const machines: Machine[] = vmUrls.map((url, i) => {
    const meta = vmMetadataMap[url];
    if (meta) {
      const colors = CUSTOM_VM_COLORS[i % CUSTOM_VM_COLORS.length];
      return {
        id: url,
        name: meta.name,
        SvgIcon: VM_ICONS[meta.iconIndex] ?? VM_ICONS[0],
        ...colors,
      };
    }
    const isPrimary = url === primaryVmUrl;
    return {
      id: url,
      name: isPrimary && grassVmName ? grassVmName : extractHost(url),
      ...VM_STYLES[i % VM_STYLES.length],
    };
  });

  const selectedMachineId = vmUrls[activeVmTab] ?? undefined;
  const selectedVmOffline =
    !!selectedVmUrl && vmUrlStatuses.get(selectedVmUrl) === false;

  const isLoading = vmUrls.length === 0;
  const onPrimaryVm = !!primaryVmUrl && selectedVmUrl === primaryVmUrl;

  function renderThreadList() {
    if (FORCE_SKELETON_PREVIEW || isLoading || (onPrimaryVm && !vmRunning)) {
      return Array.from({ length: 20 }).map((_, i) => (
        <SkeletonItem key={i} opacity={shimmerAnim} />
      ));
    }
    if (threads.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            Start a new thread to see chats here
          </Text>
        </View>
      );
    }
    const statusByGrassId = new Map(sessionStatuses.map((s) => [s.grassId, s]));
    const statusBySessionId = new Map(
      sessionStatuses
        .filter((s) => !!s.sessionId)
        .map((s) => [s.sessionId as string, s]),
    );

    return threads.map((thread) => {
      const AgentIcon = AGENT_ICONS[thread.tool] ?? ClaudeIcon;
      // thread.grassId holds the SDK session id (durable across server restarts).
      // Bridge it to the live GRASS UUID so statusByGrassId hits even before the
      // permissions stream has reported sessionId for this session.
      const liveGrassId = selectedVmUrl
        ? resolveGrassIdForSdk(selectedVmUrl, thread.grassId)
        : null;
      const matchedStatus =
        (liveGrassId ? statusByGrassId.get(liveGrassId) : undefined) ??
        statusByGrassId.get(thread.grassId) ??
        (thread.sdkSessionId
          ? statusBySessionId.get(thread.sdkSessionId)
          : undefined) ??
        statusBySessionId.get(thread.grassId);
      const status = matchedStatus?.status;
      const indicatorKey = matchedStatus?.grassId ?? thread.grassId;

      return (
        <TouchableOpacity
          key={thread.grassId}
          style={styles.threadItem}
          activeOpacity={0.7}
          onPress={() => {
            posthog.capture("thread_resumed", {
              agent: thread.tool,
              repo_name: thread.repo,
            });
            markThreadSeen(thread.serverUrl, indicatorKey);
            setSessionLabel(thread.title);
            router.push({
              pathname: "/new-navbar/chat",
              params: {
                serverUrl: thread.serverUrl,
                // Dispatch threads have a synthetic grassId that the Grass server
                // does not know — passing it would 404 on /sessions/:id/history.
                // Opt into resuming the latest real session for the repo instead.
                ...(thread.isDispatch ? { resumeLatest: "1" } : { sessionId: thread.grassId }),
                repoName: thread.repo,
                repoPath: thread.repoPath,
                agent: thread.tool,
              },
            });
          }}
        >
          <View style={styles.agentIconBox}>
            <AgentIcon width={50} height={50} />
          </View>
          <View style={styles.threadContent}>
            <View style={styles.threadTopRow}>
              <Text style={styles.threadMessage} numberOfLines={1}>
                {thread.title}
              </Text>
              <View style={styles.threadMeta}>
                <Text style={styles.threadTime}>
                  {formatRelativeTime(thread.time)}
                </Text>
              </View>
            </View>
            <View style={styles.threadBottomRow}>
              <View style={styles.threadCommandRow}>
                <FolderIcon height={16} width={16} />
                <Text style={styles.commandText}>{thread.repo}</Text>
              </View>
              <View style={styles.threadStatusCell}>
                {status === 'running' && (
                  <ActivityIndicator size="small" color="#4CAF50" />
                )}
                {status === 'done' && shouldShowDoneIndicator(indicatorKey) && (
                  <View style={styles.threadStatusDotGreen} />
                )}
                {status === 'awaiting_permissions' && (
                  <View style={styles.threadStatusDotYellow} />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  }

  return (
    <View style={styles.container}>
      {startupOverlayVisible && (
        <View style={styles.startupOverlay}>
          <ActivityIndicator size="small" color="#3D841E" />
          <Text style={styles.startupOverlayText}>Starting container...</Text>
        </View>
      )}
      <MachineCarousel
        machines={machines}
        selectedId={selectedMachineId}
        onSelect={(id) => {
          const idx = vmUrls.indexOf(id);
          if (idx >= 0) setActiveVmTab(idx);
        }}
        onAddNew={() => setConnectMoreVisible(true)}
        vmUrlStatuses={vmUrlStatuses}
        vmRunning={vmRunning}
        primaryVmUrl={primaryVmUrl}
      />
      <ConnectMoreSlider
        visible={connectMoreVisible}
        onClose={() => setConnectMoreVisible(false)}
      />
      <NewChatSlider2
        visible={newChatVisible}
        onClose={() => setNewChatVisible(false)}
      />

      {/* ── Section header ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Recent threads</Text>
        {!vmRunning && selectedVmUrl === primaryVmUrl && (
          wakeFailed ? (
            <View style={styles.retryContainer}>
              <Text style={styles.wakeFailedText}>Couldn’t start VM</Text>
              <TouchableOpacity
                style={styles.retryButton}
                activeOpacity={0.8}
                onPress={retryWake}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.refreshingContainer}>
              <Text style={styles.refreshingText}>Refreshing VM</Text>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[styles.progressBar, { width: progressWidth }]}
                />
              </View>
            </View>
          )
        )}
      </View>

      {/* ── Thread list or skeleton ── */}
      <ScrollView
        style={styles.threadList}
        contentContainerStyle={{ paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
      >
        {selectedVmOffline ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              This machine looks offline. Start Grass server on it, then refresh.
            </Text>
          </View>
        ) : (
          renderThreadList()
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.floatButton}
        activeOpacity={0.85}
        onPress={() => setNewChatVisible(true)}
      >
        <FloatIcon width={24} height={24} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  startupOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  startupOverlayText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    lineHeight: 18,
    color: "#3D841E",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 5,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#9F9F9F",
  },
  refreshingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshingText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    lineHeight: 18,
    color: "#72C44E",
  },
  retryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wakeFailedText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    lineHeight: 18,
    color: "#C62828",
  },
  retryButton: {
    backgroundColor: "#3D841E",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  retryButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: "#FFFFFF",
  },
  progressTrack: {
    width: 60,
    height: 4,
    backgroundColor: "#E3FDD7",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#72C44E",
    borderRadius: 2,
  },
  threadList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  threadItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  agentIconBox: {
    overflow: "hidden",
    marginRight: 10,
  },
  threadContent: {
    flex: 1,
  },
  threadTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  threadMessage: {
    flex: 1,
    fontFamily: SFPro.medium,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.5,
    color: "#000",
    marginRight: 8,
  },
  threadTime: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    lineHeight: 18,
    color: "#808080",
  },
  threadMeta: {
    alignItems: "flex-end",
  },
  threadStatusCell: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  threadStatusSpinner: {
    marginTop: 4,
  },
  threadStatusDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  threadStatusDotYellow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F5A623",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  threadBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  threadCommandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  commandText: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    lineHeight: 20,
    color: "#808080",
    marginLeft: 5,
  },
  floatButton: {
    position: "absolute",
    bottom: 100,
    right: 16,
    zIndex: 9999,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    lineHeight: 20,
    color: "#808080",
    textAlign: "center",
  },
  skeletonIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#E8E8E8",
    marginRight: 10,
  },
  skeletonBar: {
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E8E8E8",
    marginBottom: 8,
  },
  skeletonBarLong: {
    width: "75%",
  },
  skeletonBarShort: {
    width: 130,
    marginBottom: 0,
  },
  skeletonTimePill: {
    width: 56,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E8E8E8",
  },
  skeletonFolderIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#E8E8E8",
    marginRight: 5,
  },
  skeletonStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E8E8E8",
    marginTop: 4,
    alignSelf: "flex-end",
  },
});
