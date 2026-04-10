import { NavBanner, VmTabBar } from "@/components/NavBanner";
import { StickyBannerLayout } from "@/components/StickyBannerLayout";
import { NationalPark } from "@/constants/theme";
import { posthog } from "@/constants/posthog";
import { useNavbar } from "@/contexts/navbar-context";
import { setSessionLabel } from "@/store/session-label-store";
import { formatRelativeTime } from "@/store/thread-store";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const AGENT_LOGOS: Record<string, ReturnType<typeof require>> = {
  "claude-code": require("@/assets/images/cluade-logo.jpg"),
  opencode: require("@/assets/images/open-code.png"),
};
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BANNER_HEIGHT = 220;

export default function HomeTab() {
  const { threads } = useNavbar();
  const { bottom } = useSafeAreaInsets();
  const tabBarHeight = bottom + 110;
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
      <NavBanner />
      <StickyBannerLayout
        bannerHeight={BANNER_HEIGHT}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        <VmTabBar />
        <Text style={styles.sectionHeader}>RECENT THREADS</Text>
        {threads.length === 0 ? (
          <View style={styles.emptyThreads}>
            <Text style={styles.emptyThreadsText}>
              Start a new thread to see chats here
            </Text>
          </View>
        ) : (
          threads.map((thread) => (
            <TouchableOpacity
              key={thread.grassId}
              style={styles.threadCard}
              activeOpacity={0.72}
              onPress={() => {
                posthog.capture("thread_resumed", {
                  agent: thread.tool,
                  repo_name: thread.repo,
                });
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
              }}
            >
              <View style={styles.threadRow}>
                {thread.tool && AGENT_LOGOS[thread.tool] ? (
                  <Image
                    source={AGENT_LOGOS[thread.tool]}
                    style={styles.agentIcon}
                  />
                ) : null}
                <View style={styles.threadLeft}>
                  <Text style={styles.threadTitle} numberOfLines={1}>
                    {thread.title}
                  </Text>
                  <Text style={styles.threadMeta}>
                    {thread.repo}
                    {thread.tool ? ` · ${thread.tool}` : ""}
                  </Text>
                </View>
                <Text style={styles.threadTime}>
                  {formatRelativeTime(thread.time)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </StickyBannerLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontFamily: NationalPark.semiBold,
    fontSize: 14,
    fontWeight: "600",
    color: "#BEBEBE",
    letterSpacing: 2,
    lineHeight: 14.823,
    paddingHorizontal: 14,
    marginBottom: 8,
    marginTop: 2,
  },
  threadCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    marginHorizontal: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  threadRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  agentIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 10,
    alignSelf: "center",
  },
  threadLeft: {
    flex: 1,
    marginRight: 12,
  },
  threadTime: {
    fontSize: 11,
    color: "#8E8E93",
    alignSelf: "flex-start",
  },
  threadTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 3,
  },
  threadMeta: {
    fontSize: 12,
    color: "#8E8E93",
  },
  emptyThreads: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 14,
  },
  emptyThreadsText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
});
