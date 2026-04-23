import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackButtonIcon from "@/assets/images/new-design/chat/back-button.svg";
// import ChatGptIcon from "@/assets/images/new-design/chat/chatGPT.svg";
// import ChatGptActiveIcon from "@/assets/images/new-design/chat/chatGPT-active.svg";
import ClaudeIcon from "@/assets/images/new-design/chat/claude.svg";
// import ClaudeActiveIcon from "@/assets/images/new-design/chat/claude-active.svg";
import ClaudeLightModeIcon from "@/assets/images/new-design/chat/claude-light-mode.svg";
import DiffButtonIcon from "@/assets/images/new-design/chat/diff-button.svg";
// import GeminiIcon from "@/assets/images/new-design/chat/gemini.svg";
// import GeminiActiveIcon from "@/assets/images/new-design/chat/gemini-active.svg";
// import MetaIcon from "@/assets/images/new-design/chat/meta.svg";
// import MetaActiveIcon from "@/assets/images/new-design/chat/meta-active.svg";
import OpenCodeIcon from "@/assets/images/new-design/chat/opencode.svg";
// import OpenCodeActiveIcon from "@/assets/images/new-design/chat/opencode-active.svg";
import OpenCodeLightNodeIcon from "@/assets/images/new-design/chat/opencode-light-node.svg";
import SearchIcon from "@/assets/images/new-design/chat/search-icon.svg";
import CompletedIcon from "@/assets/images/new-design/navbar/completed-icon.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import ProgressIcon from "@/assets/images/new-design/navbar/progress-icon.svg";
import WaitingIcon from "@/assets/images/new-design/navbar/waiting-for-completion-icon.svg";

import { SFPro } from "@/constants/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentKey = "claude" | "opencode";
type ThreadStatus = "completed" | "progress" | "waiting" | null;

// ─── Mock data ────────────────────────────────────────────────────────────────

const REPO_NAME = "grass-welcome";
const BRANCH_NAME = "main";

// const AGENTS: {
//   key: AgentKey;
//   Icon: React.FC<{ width: number; height: number }>;
//   ActiveIcon: React.FC<{ width: number; height: number }>;
// }[] = [
//   { key: "chatgpt", Icon: ChatGptIcon, ActiveIcon: ChatGptActiveIcon },
//   { key: "claude", Icon: ClaudeIcon, ActiveIcon: ClaudeActiveIcon },
//   { key: "meta", Icon: MetaIcon, ActiveIcon: MetaActiveIcon },
//   { key: "gemini", Icon: GeminiIcon, ActiveIcon: GeminiActiveIcon },
//   { key: "opencode", Icon: OpenCodeIcon, ActiveIcon: OpenCodeActiveIcon },
// ];

const CHATS: {
  id: string;
  agent: AgentKey;
  title: string;
  time: string;
  status: ThreadStatus;
}[] = [
  {
    id: "1",
    agent: "opencode",
    title: "Fixed broken link in footer",
    time: "3m",
    status: "waiting",
  },
  {
    id: "2",
    agent: "claude",
    title: "Improve error handling in API",
    time: "4m",
    status: "completed",
  },
  {
    id: "3",
    agent: "opencode",
    title: "Add unit tests for data models",
    time: "10m",
    status: "progress",
  },
  {
    id: "4",
    agent: "claude",
    title: "Update dependencies to latest versions",
    time: "20m",
    status: null,
  },
  {
    id: "5",
    agent: "opencode",
    title: "Implement user authentication flow",
    time: "30m",
    status: null,
  },
  {
    id: "6",
    agent: "claude",
    title: "Optimize database queries for speed",
    time: "1h",
    status: null,
  },
  {
    id: "7",
    agent: "claude",
    title: "Design new landing page layout",
    time: "2h",
    status: null,
  },
  {
    id: "8",
    agent: "opencode",
    title: "Fixed broken link in footer",
    time: "Yesterday",
    status: null,
  },
  {
    id: "9",
    agent: "claude",
    title: "Improve error handling in API",
    time: "Yesterday",
    status: null,
  },
];

const STATUS_ICON: Record<
  NonNullable<ThreadStatus>,
  React.FC<{ width: number; height: number }>
> = {
  completed: CompletedIcon,
  progress: ProgressIcon,
  waiting: WaitingIcon,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatListScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<AgentKey>("claude");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = CHATS.filter((c) => {
    const matchesAgent = c.agent === selectedAgent;
    const matchesSearch = c.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesAgent && matchesSearch;
  });

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.7}
          onPress={() => router.push("/new-navbar/(tabs)")}
        >
          <BackButtonIcon width={24} height={24} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.repoName}>{REPO_NAME}</Text>
          <View style={styles.branchRow}>
            <GitBranchIcon width={14} height={14} />
            <Text style={styles.branchName}>{BRANCH_NAME}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
          <DiffButtonIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      {/* ── Agent tab toggle ── */}
      <View style={styles.agentTabRow}>
        {/* Claude tab */}
        <TouchableOpacity
          style={[
            styles.agentTab,
            selectedAgent === "claude"
              ? styles.claudeActiveTab
              : styles.inactiveTab,
          ]}
          activeOpacity={0.85}
          onPress={() => setSelectedAgent("claude")}
        >
          {selectedAgent === "claude" ? (
            <ClaudeLightModeIcon width={24} height={24} />
          ) : (
            <ClaudeIcon width={24} height={24} />
          )}
        </TouchableOpacity>

        {/* OpenCode tab */}
        <TouchableOpacity
          style={[
            styles.agentTab,
            selectedAgent === "opencode"
              ? styles.openCodeActiveTab
              : styles.inactiveTab,
          ]}
          activeOpacity={0.85}
          onPress={() => setSelectedAgent("opencode")}
        >
          {selectedAgent === "opencode" ? (
            <OpenCodeLightNodeIcon width={24} height={24} />
          ) : (
            <OpenCodeIcon width={24} height={24} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchContainer}>
        <SearchIcon width={16} height={16} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search threads"
          placeholderTextColor="#808080"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ── Chat list ── */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredChats.map((chat) => {
          const StatusIcon = chat.status ? STATUS_ICON[chat.status] : null;
          return (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatItem}
              activeOpacity={0.7}
            >
              <View style={styles.chatInfo}>
                <Text style={styles.chatTitle} numberOfLines={1}>
                  {chat.title}
                </Text>
                <Text style={styles.chatTime}>{chat.time}</Text>
              </View>
              {StatusIcon && <StatusIcon width={22} height={20} />}
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  repoName: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  branchName: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#808080",
    letterSpacing: -0.2,
  },

  // Agent tab toggle
  agentTabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  agentTab: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  claudeActiveTab: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.50)",
    backgroundColor: "#E47152",
  },
  openCodeActiveTab: {
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.50)",
    backgroundColor: "#000000",
  },
  inactiveTab: {
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "rgba(255, 255, 255, 0.40)",
  },

  // Search bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "rgba(255, 255, 255, 0.40)",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "#000",
    padding: 0,
  },

  // Chat list
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  chatInfo: {
    flex: 1,
    marginRight: 12,
    gap: 3,
  },
  chatTitle: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  chatTime: {
    fontFamily: SFPro.regular,
    fontSize: 14,
    color: "#808080",
    letterSpacing: -0.2,
  },
});
