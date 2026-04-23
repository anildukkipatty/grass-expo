import { useLocalSearchParams, useRouter } from "expo-router";
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
import ClaudeIcon from "@/assets/images/new-design/chat/claude.svg";
import ClaudeLightModeIcon from "@/assets/images/new-design/chat/claude-light-mode.svg";
import DiffButtonIcon from "@/assets/images/new-design/chat/diff-button.svg";
import OpenCodeIcon from "@/assets/images/new-design/chat/opencode.svg";
import OpenCodeLightNodeIcon from "@/assets/images/new-design/chat/opencode-light-node.svg";
import SearchIcon from "@/assets/images/new-design/chat/search-icon.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";

import { SFPro } from "@/constants/theme";
import { posthog } from "@/constants/posthog";
import { useNavbar } from "@/contexts/navbar-context";
import { formatRelativeTime } from "@/store/thread-store";
import { setSessionLabel } from "@/store/session-label-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentKey = "claude" | "opencode";
// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatListScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { repoName, repoPath } = useLocalSearchParams<{ repoName?: string; repoPath?: string }>();
  const { threads, repos } = useNavbar();
  const [selectedAgent, setSelectedAgent] = useState<AgentKey>("claude");
  const [searchQuery, setSearchQuery] = useState("");

  // Find branch from repos list
  const matchedRepo = repos?.find((r) => r.path === repoPath || r.name === repoName);
  const branchName = matchedRepo?.branch ?? null;

  // Filter threads: by repoPath (if given), by agent tab, by search
  const filteredThreads = threads.filter((t) => {
    if (repoPath && t.repoPath !== repoPath) return false;
    const isClaudeAgent = t.tool === "claude-code" || t.tool === "claude";
    if (selectedAgent === "claude" && !isClaudeAgent) return false;
    if (selectedAgent === "opencode" && t.tool !== "opencode") return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  function handleThreadTap(thread: typeof threads[0]) {
    posthog.capture("thread_resumed", { agent: thread.tool, repo_name: thread.repo });
    setSessionLabel(thread.title);
    router.push({
      pathname: "/chat",
      params: {
        serverUrl: thread.serverUrl,
        sessionId: thread.grassId,
        repoName: thread.repo,
        repoPath: thread.repoPath,
        agent: thread.tool,
      },
    });
  }

  const displayRepoName = repoName ?? matchedRepo?.name ?? "Threads";

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <BackButtonIcon width={24} height={24} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.repoName}>{displayRepoName}</Text>
          {branchName && (
            <View style={styles.branchRow}>
              <GitBranchIcon width={14} height={14} />
              <Text style={styles.branchName}>{branchName}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
          <DiffButtonIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      {/* ── Agent tab toggle ── */}
      <View style={styles.agentTabRow}>
        <TouchableOpacity
          style={[
            styles.agentTab,
            selectedAgent === "claude" ? styles.claudeActiveTab : styles.inactiveTab,
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

        <TouchableOpacity
          style={[
            styles.agentTab,
            selectedAgent === "opencode" ? styles.openCodeActiveTab : styles.inactiveTab,
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

      {/* ── Thread list ── */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredThreads.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No threads found</Text>
          </View>
        ) : (
          filteredThreads.map((thread) => (
            <TouchableOpacity
              key={thread.grassId}
              style={styles.chatItem}
              activeOpacity={0.7}
              onPress={() => handleThreadTap(thread)}
            >
              <View style={styles.chatInfo}>
                <Text style={styles.chatTitle} numberOfLines={1}>
                  {thread.title}
                </Text>
                <Text style={styles.chatTime}>{formatRelativeTime(thread.time)}</Text>
              </View>
            </TouchableOpacity>
          ))
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

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontFamily: SFPro.medium, fontSize: 17, color: "#808080" },
});
