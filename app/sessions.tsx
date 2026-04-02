import { NationalPark } from '@/constants/theme';
import { Session, useServer } from '@/hooks/use-server';
import { getEntry, getRepoDetailsStore, listSessionsStore } from '@/store/connection-store';
import { setSessionLabel } from '@/store/session-label-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BG = '#f5f5f7';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#ebebeb';
const TEXT = '#000000';
const SUBTEXT = '#c1c1c1';
const SEARCH_BG = '#ececec';
const SEARCH_BORDER = '#c8c8c8';
const SEARCH_TEXT = '#757575';
const BRANCH_BG = '#efeeee';
const BRANCH_TEXT = '#8e8e8e';
const DIFF_BTN_BG = '#e5e5e5';
const DIFF_BTN_BORDER = '#cecece';
const HEADER_BLUR_BG = 'rgba(255,255,255,0.7)';
const HEADER_BORDER = '#d3d3d3';
const NEW_BTN_GREEN = '#00cc33';
const NEW_BTN_GLOW = 'rgba(0,255,38,0.3)';

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 5,
  elevation: 3,
};

const AGENT_FILTERS = ['Opencode', 'Claude Code'] as const;
type AgentFilter = typeof AGENT_FILTERS[number];

const AGENT_FILTER_IDS: Record<AgentFilter, string> = {
  'Opencode': 'opencode',
  'Claude Code': 'claude-code',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: HEADER_BLUR_BG },
  headerWrap: {
    borderBottomWidth: 1,
    borderBottomColor: HEADER_BORDER,
  },
  headerBlur: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  backBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  repoMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repoName: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT,
    letterSpacing: -0.2,
  },
  branchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BRANCH_BG,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  branchText: {
    fontSize: 14,
    color: BRANCH_TEXT,
  },
  agentPillRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingTop: 4,
  },
  agentPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: '#bababa',
  },
  agentPillActive: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  agentPillText: {
    fontSize: 16,
    color: TEXT,
  },
  agentPillTextActive: {
    color: '#ffffff',
  },
  searchSection: {
    backgroundColor: HEADER_BLUR_BG,
    borderBottomWidth: 1,
    borderBottomColor: HEADER_BORDER,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchWrap: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    height: 40,
    backgroundColor: SEARCH_BG,
    borderWidth: 1,
    borderColor: SEARCH_BORDER,
    borderRadius: 30,
    paddingLeft: 16,
    paddingRight: 36,
    fontSize: 16,
    color: TEXT,
  },
  searchInputWrap: {
    flex: 1,
    height: 40,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    right: 14,
    top: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: BG,
  },
  statusText: {
    fontSize: 15,
    color: SUBTEXT,
  },
  list: {
    padding: 20,
    gap: 8,
    paddingBottom: 100,
  },
  sessionItem: {
    backgroundColor: CARD_BG,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...cardShadow,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
    letterSpacing: -0.1,
  },
  sessionTime: {
    fontSize: 14,
    color: SUBTEXT,
    marginTop: 4,
  },
  diffIconBtn: {
    width: 37,
    height: 37,
    borderRadius: 30,
    backgroundColor: DIFF_BTN_BG,
    borderWidth: 1,
    borderColor: DIFF_BTN_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    flexShrink: 0,
  },
  emptyIcon: {
    marginBottom: 8,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: TEXT,
  },
  newBtnWrap: {
    position: 'absolute',
    bottom: 80,
    right: 20,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: '#00CC33',
    // outer glow
    shadowColor: '#00FF26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  newBtnGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 63,
  },
  newBtnInnerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 63,
  },
  newBtnText: {
    fontSize: 16,
    fontFamily: NationalPark.medium,
    lineHeight: 24,
    color: TEXT,
    zIndex: 1,
  },
});

function timeAgo(isoString?: string): string {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SessionItem({ item, onPress }: { item: Session; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.sessionItem}
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
        <View style={styles.sessionContent}>
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {(item.label || item.preview || 'Session').replace(/\n/g, ' ')}
          </Text>
          {(item.updatedAt || item.createdAt) ? (
            <Text style={styles.sessionTime}>
              {timeAgo(item.updatedAt || item.createdAt)}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Sessions() {
  const router = useRouter();
  const { serverUrl, repoPath, repoName, agent } = useLocalSearchParams<{
    serverUrl: string;
    repoPath?: string;
    repoName?: string;
    agent?: string;
  }>();
  const newBtnScale = useRef(new Animated.Value(1)).current;
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [branch, setBranch] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<AgentFilter | null>(
    agent ? (AGENT_FILTERS.find(f => f.toLowerCase().replace(/[\s-]/g, '') === agent.toLowerCase().replace(/[\s-]/g, '')) ?? null) : null
  );

  const ws = useServer(serverUrl ?? null);

  useFocusEffect(useCallback(() => {
    if (!serverUrl) return;
    setFetching(true);
    listSessionsStore(serverUrl, repoPath, agent).then(() => setFetching(false));
    if (repoPath) {
      getRepoDetailsStore(serverUrl, repoPath).then(() => {
        setBranch(getEntry(serverUrl)?.repoDetails.get(repoPath)?.branch ?? null);
      });
    }
  }, [serverUrl, repoPath, agent]));

  const sessions = useMemo(() => {
    const sorted = [...ws.sessionsList].sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
    if (!query.trim()) return sorted;
    const q = query.toLowerCase();
    return sorted.filter(s =>
      (s.label || s.preview || '').toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [ws.sessionsList, query]);

  const loading = fetching && ws.sessionsList.length === 0;

  function openChat(sessionId?: string, label?: string) {
    setSessionLabel(label ?? null);
    const params: Record<string, string> = { serverUrl: serverUrl! };
    if (sessionId) params.sessionId = sessionId;
    if (repoName) params.repoName = repoName;
    if (repoPath) params.repoPath = repoPath;
    if (agent) params.agent = agent;
    router.push({ pathname: '/chat', params });
  }

  async function handleRefresh() {
    if (!serverUrl) return;
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await listSessionsStore(serverUrl, repoPath, agent);
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={[styles.headerBlur, { backgroundColor: HEADER_BLUR_BG }]}>
          {/* Repo row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={22} color={TEXT} />
            </TouchableOpacity>
            <View style={styles.repoMeta}>
              <Text style={styles.repoName} numberOfLines={1}>
                {repoName ?? 'Sessions'}
              </Text>
              <View style={styles.branchPill}>
                <Ionicons name="git-merge-outline" size={14} color={BRANCH_TEXT} />
                <Text style={styles.branchText}>{branch ?? '…'}</Text>
              </View>
            </View>
          </View>

          {/* Agent filter pills */}
          <View style={styles.agentPillRow}>
            {AGENT_FILTERS.map(f => {
              const isActive = activeFilter === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.agentPill, isActive && styles.agentPillActive]}
                  onPress={() => {
                    const newAgent = isActive ? undefined : AGENT_FILTER_IDS[f];
                    const params: Record<string, string> = { serverUrl: serverUrl! };
                    if (repoPath) params.repoPath = repoPath;
                    if (repoName) params.repoName = repoName;
                    if (newAgent) params.agent = newAgent;
                    router.replace({ pathname: '/sessions', params });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.agentPillText, isActive && styles.agentPillTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
      <View style={styles.searchWrap}>
        <View style={styles.searchInputWrap}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search chats"
            placeholderTextColor={SEARCH_TEXT}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {!query ? (
            <View style={styles.searchIcon}>
              <Ionicons name="search" size={16} color={SEARCH_TEXT} />
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.diffIconBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/diffs', params: { serverUrl: serverUrl!, repoPath: repoPath ?? '' } });
          }}
        >
          <Image
            source={require('@/assets/images/diff-logo.png')}
            style={{ width: 20, height: 20, opacity: 0.6 }}
          />
        </TouchableOpacity>
      </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={NEW_BTN_GREEN} size="large" />
          <Text style={styles.statusText}>Loading sessions…</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={44} color={SUBTEXT} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>
            {query.trim() ? 'No matching sessions' : 'No chats yet'}
          </Text>
          <Text style={styles.statusText}>
            {query.trim() ? 'Try a different search' : 'Start a new chat'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          style={{ backgroundColor: BG }}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={NEW_BTN_GREEN}
              colors={[NEW_BTN_GREEN]}
            />
          }
          renderItem={({ item }) => (
            <SessionItem item={item} onPress={() => openChat(item.id, item.label || item.preview)} />
          )}
        />
      )}

      {/* Floating New chat button */}
      <View style={styles.newBtnWrap}>
        <Animated.View style={{ transform: [{ scale: newBtnScale }] }}>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              openChat();
            }}
            onPressIn={() =>
              Animated.spring(newBtnScale, { toValue: 0.94, useNativeDriver: true, speed: 50, bounciness: 2 }).start()
            }
            onPressOut={() =>
              Animated.spring(newBtnScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
            }
            activeOpacity={1}
          >
            <LinearGradient
              colors={['#00FF40', '#00FF40', '#E0FF47']}
              locations={[0, 0.7, 1]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.newBtnGradient}
            />
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.4)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.newBtnInnerShadow}
              pointerEvents="none"
            />
            <Ionicons name="add" size={20} color={TEXT} style={{ zIndex: 1 }} />
            <Text style={styles.newBtnText}>New chat</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
