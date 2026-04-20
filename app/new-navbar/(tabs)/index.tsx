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

import { MachineCarousel, Machine } from "@/components/new-navbar/MachineCarousel";
import { ConnectMoreSlider } from "@/components/new-navbar/ConnectMoreSlider";

import ChatGptIcon from "@/assets/images/new-design/navbar/chatgpt.svg";
import ClaudeIcon from "@/assets/images/new-design/navbar/claude.svg";
import CompletedIcon from "@/assets/images/new-design/navbar/completed-icon.svg";
import FolderIcon from "@/assets/images/new-design/navbar/folder-icon.svg";
import GeminiIcon from "@/assets/images/new-design/navbar/gemini.svg";
import MetaIcon from "@/assets/images/new-design/navbar/meta.svg";
import OpenCodeIcon from "@/assets/images/new-design/navbar/opencode.svg";
import ProgressIcon from "@/assets/images/new-design/navbar/progress-icon.svg";
import WaitingIcon from "@/assets/images/new-design/navbar/waiting-for-completion-icon.svg";

import { SFPro } from "@/constants/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentKey = "claude" | "chatgpt" | "gemini" | "meta" | "opencode";
type ThreadStatus = "completed" | "progress" | "waiting" | null;

// ─── Mock data ────────────────────────────────────────────────────────────────

const THREADS: {
  id: string;
  agent: AgentKey;
  message: string;
  time: string;
  command: string;
  agentName: string;
  status: ThreadStatus;
}[] = [
  {
    id: "1",
    agent: "chatgpt",
    message: "--- refactor auth middleware ---",
    time: "3m",
    command: "grass-start",
    agentName: "GPT-4",
    status: "waiting",
  },
  {
    id: "2",
    agent: "claude",
    message: "fix: login still breaks on safari",
    time: "3m",
    command: "cloudy-valley",
    agentName: "Claude",
    status: "completed",
  },
  {
    id: "3",
    agent: "gemini",
    message: "--- continued from last time ---",
    time: "3m",
    command: "sunrise-harbour",
    agentName: "Gemini 3.1",
    status: "progress",
  },
  {
    id: "4",
    agent: "meta",
    message: "fix: login still breaks on safari",
    time: "3m",
    command: "conductor",
    agentName: "Meta",
    status: "completed",
  },
  {
    id: "5",
    agent: "opencode",
    message: "refactor ( where do i even s...",
    time: "3m",
    command: "cloudy-valley",
    agentName: "Opencode",
    status: "waiting",
  },
  {
    id: "6",
    agent: "chatgpt",
    message: "--- refactor auth middleware ---",
    time: "3m",
    command: "grass-start",
    agentName: "GPT-4",
    status: "progress",
  },
  {
    id: "7",
    agent: "claude",
    message: "fix: login still breaks on safari",
    time: "3m",
    command: "cloudy-valley",
    agentName: "Claude",
    status: "completed",
  },
];

const AGENT_ICONS: Record<
  AgentKey,
  React.FC<{ width: number; height: number; color?: string }>
> = {
  claude: ClaudeIcon,
  chatgpt: ChatGptIcon,
  gemini: GeminiIcon,
  meta: MetaIcon,
  opencode: OpenCodeIcon,
};

// ─── Skeleton item ─────────────────────────────────────────────────────────────

function SkeletonItem({ opacity }: { opacity: Animated.Value }) {
  return (
    <View style={styles.threadItem}>
      <Animated.View style={[styles.skeletonIcon, { opacity }]} />
      <View style={styles.threadContent}>
        <Animated.View
          style={[styles.skeletonBar, styles.skeletonBarLong, { opacity }]}
        />
        <Animated.View
          style={[styles.skeletonBar, styles.skeletonBarShort, { opacity }]}
        />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const MACHINES: Machine[] = [
  {
    id: "1",
    name: "Son of Anton",
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-one.png"),
    borderColor: "#72C44E",
    backgroundColor: "#E3FDD7",
  },
  {
    id: "2",
    name: "Sam's Mac...",
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-two.png"),
    borderColor: "#D8A4E8",
    backgroundColor: "#f0c5e8",
  },
  {
    id: "3",
    name: "iMac",
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-three.png"),
    borderColor: "#BDBDBD",
    backgroundColor: "#D9D9D9",
  },
  {
    id: "4",
    name: "Da...",
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-one.png"),
    borderColor: "#A0C4E8",
    backgroundColor: "#E3FDD7",
  },
];

export default function HomeScreen() {
  const { bottom } = useSafeAreaInsets();
  const [selectedMachineId, setSelectedMachineId] = useState<string>("2");
  const [isLoading, setIsLoading] = useState(true);
  const [connectMoreVisible, setConnectMoreVisible] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(0.5)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
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
    shimmer.start();

    const progress = Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
    );
    progress.start();

    const timer = setTimeout(() => {
      shimmer.stop();
      progress.stop();
      setIsLoading(false);
    }, 3000);

    return () => {
      shimmer.stop();
      progress.stop();
      clearTimeout(timer);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <MachineCarousel
        machines={MACHINES}
        selectedId={selectedMachineId}
        onSelect={setSelectedMachineId}
        onAddNew={() => setConnectMoreVisible(true)}
      />
      <ConnectMoreSlider
        visible={connectMoreVisible}
        onClose={() => setConnectMoreVisible(false)}
      />

      {/* ── Section header ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Recent threads</Text>
        {isLoading && (
          <View style={styles.refreshingContainer}>
            <Text style={styles.refreshingText}>Refreshing VM</Text>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressBar, { width: progressWidth }]}
              />
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
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <SkeletonItem key={i} opacity={shimmerAnim} />
            ))
          : THREADS.map((thread) => {
              const AgentIcon = AGENT_ICONS[thread.agent];
              return (
                <TouchableOpacity
                  key={thread.id}
                  style={styles.threadItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.agentIconBox}>
                    <AgentIcon width={50} height={50} />
                  </View>
                  <View style={styles.threadContent}>
                    <View style={styles.threadTopRow}>
                      <Text style={styles.threadMessage} numberOfLines={1}>
                        {thread.message}
                      </Text>
                      <Text style={styles.threadTime}>{thread.time}</Text>
                    </View>
                    <View style={styles.threadBottomRow}>
                      <View style={styles.threadCommandRow}>
                        <FolderIcon height={16} width={16} />
                        <Text style={styles.commandText}>{thread.command}</Text>
                      </View>
                      {thread.status === "completed" && (
                        <CompletedIcon width={22} height={20} />
                      )}
                      {thread.status === "progress" && (
                        <ProgressIcon width={22} height={20} />
                      )}
                      {thread.status === "waiting" && (
                        <WaitingIcon width={22} height={20} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    justifyContent: "center",
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
  agentNameText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#72C44E",
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
