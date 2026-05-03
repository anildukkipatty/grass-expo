import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
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
import ClaudeWhiteIcon from "@/assets/images/new-design/chat/claude-white.svg";
import OpenCodeIcon from "@/assets/images/new-design/chat/opencode.svg";
import OpenCodeWhiteIcon from "@/assets/images/new-design/chat/opencode-white.svg";
import SearchIcon from "@/assets/images/new-design/chat/search-icon.svg";
import { SymbolView } from "expo-symbols";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";

import { posthog } from "@/constants/posthog";
import { SFPro } from "@/constants/theme";
import { useNavbar } from "@/contexts/navbar-context";
import {
  Session,
  getEntry,
  listSessionsStore,
  openConnection,
  subscribeToConnection,
} from "@/store/connection-store";
import { setSessionLabel } from "@/store/session-label-store";
import { formatRelativeTime } from "@/store/thread-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentKey = "claude" | "opencode";

function normalizeParam(input?: string | string[]): string | undefined {
  if (Array.isArray(input)) return input[0];
  return input;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatListScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    repoName?: string | string[];
    repoPath?: string | string[];
  }>();
  const repoName = normalizeParam(params.repoName);
  const repoPath = normalizeParam(params.repoPath);

  const { repos, selectedVmUrl } = useNavbar();
  const [selectedAgent, setSelectedAgent] = useState<AgentKey>("claude");
  const [searchQuery, setSearchQuery] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchSeqRef = useRef(0);

  const selectedAgentId =
    selectedAgent === "claude" ? "claude-code" : "opencode";

  // Find branch from repos list
  const matchedRepo = repos?.find(
    (r) => r.path === repoPath || r.name === repoName,
  );
  const branchName = matchedRepo?.branch ?? null;

  const displayRepoName = repoName ?? matchedRepo?.name ?? "Threads";
  const resolvedRepoPath = repoPath ?? matchedRepo?.path ?? "";

  const showErrorToast = useCallback((message: string) => {
    setErrorToast(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setErrorToast(null);
      toastTimeoutRef.current = null;
    }, 2400);
  }, []);

  useEffect(() => {
    return () => {
      fetchSeqRef.current += 1;
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Keep local sessions state in sync with connection-store
  useEffect(() => {
    if (!selectedVmUrl) {
      setSessions([]);
      return;
    }
    openConnection(selectedVmUrl);
    setSessions(getEntry(selectedVmUrl)?.sessionsList ?? []);
    return subscribeToConnection(selectedVmUrl, () => {
      setSessions(getEntry(selectedVmUrl)?.sessionsList ?? []);
    });
  }, [selectedVmUrl]);

  const fetchSessions = useCallback(async () => {
    const req = ++fetchSeqRef.current;
    if (!selectedVmUrl) {
      setSessions([]);
      return;
    }
    setLoadingSessions(true);
    openConnection(selectedVmUrl);
    const ok = await listSessionsStore(
      selectedVmUrl,
      resolvedRepoPath || undefined,
      selectedAgentId,
    );
    if (req !== fetchSeqRef.current) return;
    if (!ok) {
      setSessions([]);
      showErrorToast("Couldn’t load threads. Please try again.");
    }
    setLoadingSessions(false);
  }, [selectedVmUrl, resolvedRepoPath, selectedAgentId, showErrorToast]);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [fetchSessions]),
  );

  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) => {
      const title = (s.label || s.preview || s.id || "").toLowerCase();
      return title.includes(q);
    });
  }, [sessions, searchQuery]);

  function handleThreadTap(session: Session) {
    if (!selectedVmUrl) return;
    const sessionTitle = session.label || session.preview || "Chat";
    posthog.capture("thread_resumed", {
      agent: selectedAgentId,
      repo_name: displayRepoName,
    });
    setSessionLabel(sessionTitle);
    router.push({
      pathname: "/new-navbar/chat",
      params: {
        serverUrl: selectedVmUrl,
        sessionId: session.id,
        repoName: displayRepoName,
        repoPath: resolvedRepoPath,
        agent: selectedAgentId,
      },
    });
  }

  function handleNewChatTap() {
    if (!selectedVmUrl) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/new-navbar/chat",
      params: {
        serverUrl: selectedVmUrl,
        repoName: displayRepoName,
        repoPath: resolvedRepoPath,
        agent: selectedAgentId,
      },
    });
  }

  return (
    <View style={[styles.container, { paddingTop: top }]}> 
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.7}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
        >
          <BackButtonIcon width={40} height={40} />
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
      </View>

      {/* ── Agent tab toggle ── */}
      <View style={styles.agentRow}>
        <TouchableOpacity
          style={[
            styles.agentBtn,
            selectedAgent === "claude" && styles.agentBtnActive,
          ]}
          activeOpacity={0.8}
          onPress={() => setSelectedAgent("claude")}
        >
          {selectedAgent === "claude" ? <ClaudeWhiteIcon width={20} height={20} /> : <ClaudeIcon width={20} height={20} />}
          <Text
            style={[
              styles.agentBtnText,
              selectedAgent === "claude" && styles.agentBtnTextActive,
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
          {selectedAgent === "opencode" ? <OpenCodeWhiteIcon width={20} height={20} /> : <OpenCodeIcon width={20} height={20} />}
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
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: bottom + 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loadingSessions} onRefresh={fetchSessions} />
        }
      >
        {loadingSessions && filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading threads…</Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No threads found</Text>
          </View>
        ) : (
          filteredSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.chatItem}
              activeOpacity={0.7}
              onPress={() => handleThreadTap(session)}
            >
              <View style={styles.chatInfo}>
                <Text style={styles.chatTitle} numberOfLines={1}>
                  {session.label || session.preview || session.id}
                </Text>
                <Text style={styles.chatTime}>
                  {formatRelativeTime(
                    session.updatedAt || session.createdAt || new Date().toISOString(),
                  )}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.floatButtonWrap, { bottom: bottom + 66 }]}
        activeOpacity={0.85}
        onPress={handleNewChatTap}
      >
        <View style={styles.floatButton}>
          <SymbolView name="plus" size={22} weight="semibold" tintColor="#1A1A1A" />
        </View>
      </TouchableOpacity>

      {errorToast && (
        <View style={[styles.toast, { bottom: bottom + 18 }]}> 
          <Text style={styles.toastText}>{errorToast}</Text>
        </View>
      )}
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
    width: 44,
    height: 44,
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
    fontFamily: SFPro.bold,
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
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#808080",
    letterSpacing: -0.2,
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
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  chatTime: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#9F9F9F",
    lineHeight: 20,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontFamily: SFPro.medium, fontSize: 17, color: "#808080" },
  floatButtonWrap: {
    position: "absolute",
    right: 24,
    zIndex: 9999,
    alignItems: "center",
    gap: 6,
  },
  floatButton: {
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
  floatButtonLabel: {
    fontFamily: SFPro.medium,
    fontSize: 12,
    color: "#4A4A4A",
    letterSpacing: -0.2,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "#EDEDED",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.86)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    zIndex: 10000,
  },
  toastText: {
    color: "#FFF",
    fontFamily: SFPro.medium,
    fontSize: 13,
    letterSpacing: -0.2,
  },
});
