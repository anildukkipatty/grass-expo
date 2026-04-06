import { useNavbar } from "@/contexts/navbar-context";
import { setSessionLabel } from "@/store/session-label-store";
import { formatRelativeTime } from "@/store/thread-store";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeTab() {
  const { threads } = useNavbar();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: tabBarHeight + 20,
        paddingTop: 4,
      }}
    >
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
            key={thread.id}
            style={styles.threadCard}
            activeOpacity={0.72}
            onPress={() => {
              setSessionLabel(thread.title);
              router.push({
                pathname: "/chat",
                params: {
                  serverUrl: thread.serverUrl,
                  sessionId: thread.id,
                  repoName: thread.repo,
                  repoPath: thread.repoPath,
                  agent: thread.tool,
                },
              });
            }}
          >
            <View style={styles.threadRow}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8E8E93",
    letterSpacing: 0.8,
    paddingHorizontal: 14,
    marginBottom: 8,
    marginTop: 2,
  },
  threadCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 14,
    borderRadius: 14,
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
