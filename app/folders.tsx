import React, { useRef, useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Animated, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { Repo, useWebSocket } from '@/hooks/use-websocket';
import { listReposStore } from '@/store/connection-store';

function hostFromUrl(url: string): string {
  return url.replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
}

function RepoItem({ item, onPress, c }: {
  item: Repo;
  onPress: () => void;
  c: typeof GrassColors['light'];
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.repoItem, { backgroundColor: c.assistantBubble, borderColor: c.border }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 2 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
        }
        activeOpacity={1}
      >
        <Ionicons
          name={item.isGit ? 'git-branch-outline' : 'folder-outline'}
          size={22}
          color={c.badgeText}
          style={styles.repoIcon}
        />
        <View style={styles.repoTextGroup}>
          <View style={styles.repoNameRow}>
            <Text style={[styles.repoName, { color: c.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isGit && (
              <View style={[styles.gitBadge, { backgroundColor: c.accent }]}>
                <Text style={styles.gitBadgeText}>git</Text>
              </View>
            )}
          </View>
          <Text style={[styles.repoPath, { color: c.badgeText }]} numberOfLines={1}>
            {item.path}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={c.badgeText} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Folders() {
  const router = useRouter();
  const { wsUrl } = useLocalSearchParams<{ wsUrl: string }>();
  const [theme] = useTheme();
  const c = GrassColors[theme];
  const [refreshing, setRefreshing] = useState(false);

  const ws = useWebSocket(wsUrl ?? null);

  useFocusEffect(useCallback(() => {
    if (wsUrl) listReposStore(wsUrl);
  }, [wsUrl]));

  const loading = !ws.connected && ws.repos.length === 0;
  const error = !ws.connected && !ws.reconnecting && ws.repos.length === 0
    ? 'Could not connect to server'
    : null;

  function openAgentPicker(repo: Repo) {
    ws.selectRepo(repo.path);
    router.push({
      pathname: '/agent-picker',
      params: { wsUrl: wsUrl!, repoPath: repo.path, repoName: repo.name },
    });
  }

  async function handleRefresh() {
    if (!wsUrl) return;
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    listReposStore(wsUrl);
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.headerWrap, { borderBottomColor: c.border }]}>
        <BlurView intensity={80} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            hitSlop={8}
          >
            <Text style={[styles.backBtnText, { color: c.text }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
              {wsUrl ? hostFromUrl(wsUrl) : 'Folders'}
            </Text>
          </View>
        </BlurView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} size="large" />
          <Text style={[styles.statusText, { color: c.badgeText }]}>Loading folders…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: c.errorText }]}>{error}</Text>
        </View>
      ) : ws.repos.length === 0 && ws.connected ? (
        <View style={styles.center}>
          <Ionicons name="folder-open-outline" size={44} color={c.badgeText} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: c.text }]}>No folders found</Text>
          <Text style={[styles.statusText, { color: c.badgeText }]}>Pull down to refresh</Text>
        </View>
      ) : (
        <FlatList
          data={ws.repos}
          keyExtractor={item => item.path}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={c.accent}
              colors={[c.accent]}
            />
          }
          renderItem={({ item }) => (
            <RepoItem item={item} c={c} onPress={() => openAgentPicker(item)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: {
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 28,
    lineHeight: 30,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  repoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  repoIcon: {
    flexShrink: 0,
  },
  repoTextGroup: {
    flex: 1,
    gap: 3,
  },
  repoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repoName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  gitBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  gitBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  repoPath: {
    fontSize: 12,
    fontFamily: 'ui-monospace',
    letterSpacing: -0.2,
    opacity: 0.55,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  statusText: {
    fontSize: 15,
  },
  errorText: {
    fontSize: 15,
  },
  emptyIcon: {
    marginBottom: 8,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
