import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";


import { MachineCarousel, Machine } from "@/components/new-navbar/MachineCarousel";
import { ConnectMoreSlider } from "@/components/new-navbar/ConnectMoreSlider";
import { extractHost, useNavbar } from "@/contexts/navbar-context";
import { posthog } from "@/constants/posthog";
import { setSessionLabel } from "@/store/session-label-store";
import { formatRelativeTime } from "@/store/thread-store";
import { getAllVmMetadata, getVmName } from "@/store/vm-metadata-store";
import { VM_ICONS } from "@/constants/vm-icons";

import ClaudeIcon from "@/assets/images/new-design/navbar/claude.svg";
import OpenCodeIcon from "@/assets/images/new-design/navbar/opencode.svg";
import CompletedIcon from "@/assets/images/new-design/navbar/completed-icon.svg";
import FolderIcon from "@/assets/images/new-design/navbar/folder-icon.svg";
import ProgressIcon from "@/assets/images/new-design/navbar/progress-icon.svg";
import WaitingIcon from "@/assets/images/new-design/navbar/waiting-for-completion-icon.svg";

import { SFPro } from "@/constants/theme";

// ─── Static pool of colors + images for VMs without saved metadata ────────────

const VM_STYLES: { borderColor: string; backgroundColor: string; image: ReturnType<typeof require> }[] = [
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

const AGENT_ICONS: Record<string, React.FC<{ width: number; height: number }>> = {
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
        <Animated.View style={[styles.skeletonBar, styles.skeletonBarLong, { opacity }]} />
        <Animated.View style={[styles.skeletonBar, styles.skeletonBarShort, { opacity }]} />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  const [connectMoreVisible, setConnectMoreVisible] = React.useState(false);
  const [vmMetadataMap, setVmMetadataMap] = useState<Record<string, { name: string; iconIndex: number }>>({});
  const [grassVmName, setGrassVmName] = useState<string | null>(null);
  const hasPromptedForName = useRef(false);

  const {
    vmUrls,
    activeVmTab,
    setActiveVmTab,
    primaryVmUrl,
    vmRunning,
    threads,
    selectedVmUrl,
  } = useNavbar();

  // Load stored names + icons whenever the VM list changes
  useEffect(() => {
    getAllVmMetadata().then(setVmMetadataMap);
    getVmName().then((name) => {
      setGrassVmName(name);
      if (!name && !hasPromptedForName.current) {
        hasPromptedForName.current = true;
        router.push({ pathname: "/onboarding/vm-name" as any, params: { mode: "rename" } });
      }
    });
  }, [vmUrls]);

  // Shimmer animation for skeleton
  const shimmerAnim = useRef(new Animated.Value(0.5)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
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
        Animated.timing(progressAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
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

  const isLoading = vmUrls.length === 0;

  return (
    <View style={styles.container}>
      <MachineCarousel
        machines={machines}
        selectedId={selectedMachineId}
        onSelect={(id) => {
          const idx = vmUrls.indexOf(id);
          if (idx >= 0) setActiveVmTab(idx);
        }}
        onAddNew={() => setConnectMoreVisible(true)}
      />
      <ConnectMoreSlider
        visible={connectMoreVisible}
        onClose={() => setConnectMoreVisible(false)}
      />

      {/* ── Section header ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Recent threads</Text>
        {!vmRunning && selectedVmUrl === primaryVmUrl && (
          <View style={styles.refreshingContainer}>
            <Text style={styles.refreshingText}>Refreshing VM</Text>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
            </View>
          </View>
        )}
      </View>

      {/* ── Thread list or skeleton ── */}
      <ScrollView
        style={styles.threadList}
        contentContainerStyle={{ paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <SkeletonItem key={i} opacity={shimmerAnim} />
          ))
        ) : threads.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Start a new thread to see chats here</Text>
          </View>
        ) : (
          threads.map((thread) => {
            const AgentIcon = AGENT_ICONS[thread.tool] ?? ClaudeIcon;
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
                  setSessionLabel(thread.title);
                  router.push({
                    pathname: "/new-navbar/chat",
                    params: {
                      serverUrl: thread.serverUrl,
                      sessionId: thread.grassId,
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
                    <Text style={styles.threadTime}>
                      {formatRelativeTime(thread.time)}
                    </Text>
                  </View>
                  <View style={styles.threadBottomRow}>
                    <View style={styles.threadCommandRow}>
                      <FolderIcon height={16} width={16} />
                      <Text style={styles.commandText}>{thread.repo}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 5,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
  },
  refreshingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshingText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#72C44E",
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  threadMessage: {
    flex: 1,
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#000",
    marginRight: 8,
  },
  threadTime: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
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
    color: "#9F9F9F",
    marginLeft: 5,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
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
    width: "45%",
    marginBottom: 0,
  },
});
