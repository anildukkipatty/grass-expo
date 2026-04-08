import { NavBanner } from "@/components/NavBanner";
import { StickyBannerLayout } from "@/components/StickyBannerLayout";
import { NationalPark } from "@/constants/theme";
import { useNavbar } from "@/contexts/navbar-context";
import { setSessionLabel } from "@/store/session-label-store";
import { formatRelativeTime } from "@/store/thread-store";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Tab bar height = safe-area bottom inset + fixed tab bar size (110pt)
const TAB_BAR_HEIGHT_BASE = 110;
const BANNER_HEIGHT = 270;

type Thread = ReturnType<typeof useNavbar>["threads"][number];

function ThreadCard({ thread, onPress }: { thread: Thread; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      accessibilityLabel={`Thread: ${thread.title}, ${thread.repo}${thread.tool ? `, ${thread.tool}` : ""}, ${formatRelativeTime(thread.time)}`}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.threadCard, { transform: [{ scale }] }]}>
        <View style={styles.threadRow}>
          <View style={styles.threadLeft}>
            <Text style={styles.threadTitle} numberOfLines={1}>
              {thread.title}
            </Text>
            <View style={styles.threadMetaRow}>
              <Text style={styles.threadMeta}>{thread.repo}</Text>
              {thread.tool ? (
                <>
                  <View style={styles.threadMetaDot} />
                  <Text style={styles.threadMeta}>{thread.tool}</Text>
                </>
              ) : null}
            </View>
          </View>
          <Text style={styles.threadTime}>
            {formatRelativeTime(thread.time)}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function HomeTab() {
  const { threads, selectedVmUrl } = useNavbar();
  const { bottom } = useSafeAreaInsets();
  const tabBarHeight = bottom + TAB_BAR_HEIGHT_BASE;
  const router = useRouter();

  // Show loading spinner until threads have settled after a server URL change
  const [threadsLoading, setThreadsLoading] = useState(true);
  useEffect(() => {
    setThreadsLoading(true);
    const timer = setTimeout(() => setThreadsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [selectedVmUrl]);
  useEffect(() => {
    if (threads.length > 0) setThreadsLoading(false);
  }, [threads]);

  const handleThreadPress = useCallback(
    (thread: Thread) => {
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
    },
    [router],
  );

  const renderThread = useCallback(
    ({ item }: { item: Thread }) => (
      <ThreadCard thread={item} onPress={() => handleThreadPress(item)} />
    ),
    [handleThreadPress],
  );

  const keyExtractor = useCallback((item: Thread) => item.id, []);

  return (
    <View style={{ flex: 1 }}>
      <NavBanner />
      <StickyBannerLayout
        bannerHeight={BANNER_HEIGHT}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        <Text style={styles.sectionHeader}>RECENT THREADS</Text>

        {threadsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#bebebe" />
          </View>
        ) : threads.length === 0 ? (
          <View style={styles.emptyThreads}>
            <Ionicons name="chatbubbles-outline" size={36} color="#d4d4d4" style={styles.emptyIcon} />
            <Text style={styles.emptyThreadsText}>
              Start a new thread to see chats here
            </Text>
          </View>
        ) : (
          <FlatList
            data={threads}
            renderItem={renderThread}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
          />
        )}
      </StickyBannerLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 14,
    fontFamily: NationalPark.semiBold,
    // #767676 = 4.5:1 contrast on white — WCAG AA compliant (was #bebebe ~2.1:1)
    color: "#767676",
    letterSpacing: 2,
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  threadCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ebebeb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  threadRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  threadLeft: {
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  threadTitle: {
    fontSize: 16,
    fontFamily: NationalPark.semiBold,
    color: "#000000",
  },
  threadMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  threadMeta: {
    fontSize: 14,
    fontFamily: NationalPark.medium,
    // #767676 = 4.5:1 contrast on white — WCAG AA compliant (was #c1c1c1 ~2.5:1)
    color: "#767676",
  },
  threadMetaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#767676",
  },
  threadTime: {
    fontSize: 14,
    fontFamily: NationalPark.medium,
    // #767676 = 4.5:1 contrast on white — WCAG AA compliant (was #c1c1c1 ~2.5:1)
    color: "#767676",
    alignSelf: "flex-start",
  },
  emptyThreads: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyIcon: {
    marginBottom: 2,
  },
  emptyThreadsText: {
    fontSize: 14,
    fontFamily: NationalPark.regular,
    color: "#bebebe",
    textAlign: "center",
  },
});
