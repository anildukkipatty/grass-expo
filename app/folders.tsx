import React, { useRef, useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Animated, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { Repo, useWebSocket } from '@/hooks/use-websocket';
import { listReposStore, cloneRepoStore, createFolderStore, getRepoDetailsStore, getEntry, RepoDetails } from '@/store/connection-store';
import { isIPad } from '@/utils/device';

// Green theme palette
const BG = '#0f1a0f';
const CARD_BG = 'rgba(30, 42, 30, 0.6)';
const CARD_BORDER = 'rgba(100, 140, 100, 0.1)';
const TEXT = '#d4e8d4';
const SUBTEXT = '#7a9a7a';
const ACCENT = '#7CB9A8';

const AGENTS = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    description: "Anthropic's AI coding agent",
    logo: require('@/assets/images/cluade-logo.jpg'),
  },
  {
    id: 'opencode',
    label: 'Opencode',
    description: 'Open source AI coding agent',
    logo: require('@/assets/images/open-code.png'),
  },
] as const;

function AgentCard({ agent, onPress, c }: {
  agent: typeof AGENTS[number];
  onPress: () => void;
  c: typeof GrassColors['light'];
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.agentCard, { backgroundColor: CARD_BG, borderColor: CARD_BORDER }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        <Image source={agent.logo} style={styles.agentLogo} contentFit="contain" />
        <View style={styles.agentTextGroup}>
          <Text style={[styles.agentLabel, { color: TEXT }]}>{agent.label}</Text>
          <Text style={[styles.agentDesc, { color: SUBTEXT }]}>{agent.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={SUBTEXT} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const LANG_COLORS: Record<string, string> = {
  ts: '#3178c6', tsx: '#3178c6', js: '#f7df1e', jsx: '#f7df1e',
  py: '#3572A5', go: '#00ADD8', rs: '#dea584', java: '#b07219',
  rb: '#701516', cpp: '#f34b7d', c: '#555555', cs: '#178600',
  swift: '#F05138', kt: '#A97BFF', dart: '#00B4AB',
};

function timeAgo(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function commitInitial(message: string): string {
  return message.trim().charAt(0).toUpperCase() || 'C';
}

function RepoItem({ item, details, onPress }: {
  item: Repo;
  details?: RepoDetails;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const langColor = details?.dominantLanguage ? (LANG_COLORS[details.dominantLanguage] ?? SUBTEXT) : null;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.repoItem, { backgroundColor: CARD_BG, borderColor: CARD_BORDER }]}
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
        {/* Top row: name + timestamp */}
        <View style={styles.repoTopRow}>
          <View style={styles.repoNameRow}>
            <Text style={[styles.repoName, { color: TEXT }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isGit && (
              <View style={[styles.onlineDot, { backgroundColor: '#4ade80' }]} />
            )}
          </View>
          {details?.lastCommit && (
            <Text style={[styles.timeAgo, { color: SUBTEXT }]}>
              {timeAgo(details.lastCommit.timestamp)}
            </Text>
          )}
        </View>

        {/* Meta row: language, branch */}
        <View style={styles.repoMetaRow}>
          {details?.dominantLanguage && langColor && (
            <View style={styles.metaChip}>
              <View style={[styles.langDot, { backgroundColor: langColor }]} />
              <Text style={[styles.metaText, { color: SUBTEXT }]}>
                {details.dominantLanguage === 'ts' ? 'TypeScript'
                  : details.dominantLanguage === 'js' ? 'JavaScript'
                  : details.dominantLanguage === 'py' ? 'Python'
                  : details.dominantLanguage === 'go' ? 'Go'
                  : details.dominantLanguage === 'rs' ? 'Rust'
                  : details.dominantLanguage === 'swift' ? 'Swift'
                  : details.dominantLanguage.toUpperCase()}
              </Text>
            </View>
          )}
          {details?.branch && (
            <View style={styles.metaChip}>
              <Ionicons name="git-branch-outline" size={13} color={SUBTEXT} />
              <Text style={[styles.metaText, { color: SUBTEXT }]}>{details.branch}</Text>
            </View>
          )}
          {!details && (
            <Text style={[styles.metaText, { color: SUBTEXT, opacity: 0.4 }]}>{item.path}</Text>
          )}
        </View>

        {/* Commit row */}
        {details?.lastCommit && (
          <View style={styles.commitRow}>
            <View style={styles.commitAvatar}>
              <Text style={styles.commitAvatarText}>
                {commitInitial(details.lastCommit.message)}
              </Text>
            </View>
            <Text style={[styles.commitMsg, { color: TEXT }]} numberOfLines={1}>
              {details.lastCommit.message}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={SUBTEXT} style={{ opacity: 0.5 }} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

type AddTab = 'clone' | 'new';

function AddRepoModal({ visible, serverUrl, c, onClose, onSuccess }: {
  visible: boolean;
  serverUrl: string;
  c: typeof GrassColors['light'];
  onClose: () => void;
  onSuccess: (repo: Repo) => void;
}) {
  const [tab, setTab] = useState<AddTab>('clone');
  const [cloneUrl, setCloneUrl] = useState('');
  const [folderName, setFolderName] = useState('');
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleClose() {
    if (busy) return;
    setCloneUrl('');
    setFolderName('');
    setCloneError(null);
    onClose();
  }

  async function handleClone() {
    const url = cloneUrl.trim();
    if (!url || busy) return;
    setBusy(true);
    setCloneError(null);
    await cloneRepoStore(serverUrl, url);
    // Read result from store
    const { getEntry } = await import('@/store/connection-store');
    const entry = getEntry(serverUrl);
    setBusy(false);
    if (entry?.cloneStatus.error) {
      setCloneError(entry.cloneStatus.error);
    } else if (entry) {
      const latest = entry.repos[entry.repos.length - 1];
      if (latest) onSuccess(latest);
    }
  }

  async function handleCreate() {
    const name = folderName.trim();
    if (!name || busy) return;
    setBusy(true);
    setCloneError(null);
    await createFolderStore(serverUrl, name);
    const { getEntry } = await import('@/store/connection-store');
    const entry = getEntry(serverUrl);
    setBusy(false);
    if (entry?.cloneStatus.error) {
      setCloneError(entry.cloneStatus.error);
    } else if (entry) {
      const latest = entry.repos[entry.repos.length - 1];
      if (latest) onSuccess(latest);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View
          style={[styles.addModalSheet, { backgroundColor: BG, borderTopColor: CARD_BORDER }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.modalHandle, { backgroundColor: SUBTEXT }]} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: SUBTEXT }]}>Add a folder</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8} disabled={busy}>
              <Ionicons name="close" size={20} color={SUBTEXT} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={[styles.tabRow, { borderBottomColor: CARD_BORDER }]}>
            <TouchableOpacity
              style={[styles.tab, tab === 'clone' && { borderBottomColor: ACCENT, borderBottomWidth: 2 }]}
              onPress={() => { setTab('clone'); setCloneError(null); }}
              disabled={busy}
            >
              <Ionicons name="git-branch-outline" size={15} color={tab === 'clone' ? ACCENT : SUBTEXT} style={{ marginRight: 5 }} />
              <Text style={[styles.tabLabel, { color: tab === 'clone' ? ACCENT : SUBTEXT }]}>Clone repo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'new' && { borderBottomColor: ACCENT, borderBottomWidth: 2 }]}
              onPress={() => { setTab('new'); setCloneError(null); }}
              disabled={busy}
            >
              <Ionicons name="folder-open-outline" size={15} color={tab === 'new' ? ACCENT : SUBTEXT} style={{ marginRight: 5 }} />
              <Text style={[styles.tabLabel, { color: tab === 'new' ? ACCENT : SUBTEXT }]}>New folder</Text>
            </TouchableOpacity>
          </View>

          {tab === 'clone' ? (
            <View style={styles.tabContent}>
              <Text style={[styles.inputLabel, { color: SUBTEXT }]}>Git repository URL</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: CARD_BG, borderColor: CARD_BORDER, color: TEXT }]}
                placeholder="https://github.com/user/repo.git"
                placeholderTextColor={SUBTEXT}
                value={cloneUrl}
                onChangeText={v => { setCloneUrl(v); setCloneError(null); }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleClone}
                editable={!busy}
              />
              {cloneError && tab === 'clone' && (
                <Text style={[styles.errorMsg, { color: '#ef4444' }]}>{cloneError}</Text>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: ACCENT, opacity: (!cloneUrl.trim() || busy) ? 0.5 : 1 }]}
                onPress={handleClone}
                disabled={!cloneUrl.trim() || busy}
              >
                {busy && tab === 'clone' ? (
                  <ActivityIndicator color="#0f1a0f" size="small" />
                ) : (
                  <Text style={[styles.actionBtnText, { color: '#0f1a0f' }]}>Clone</Text>
                )}
              </TouchableOpacity>
              {busy && tab === 'clone' && (
                <Text style={[styles.statusMsg, { color: SUBTEXT }]}>Cloning repository…</Text>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              <Text style={[styles.inputLabel, { color: SUBTEXT }]}>Folder name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: CARD_BG, borderColor: CARD_BORDER, color: TEXT }]}
                placeholder="my-project"
                placeholderTextColor={SUBTEXT}
                value={folderName}
                onChangeText={v => { setFolderName(v); setCloneError(null); }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleCreate}
                editable={!busy}
              />
              {cloneError && tab === 'new' && (
                <Text style={[styles.errorMsg, { color: '#ef4444' }]}>{cloneError}</Text>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: ACCENT, opacity: (!folderName.trim() || busy) ? 0.5 : 1 }]}
                onPress={handleCreate}
                disabled={!folderName.trim() || busy}
              >
                {busy && tab === 'new' ? (
                  <ActivityIndicator color="#0f1a0f" size="small" />
                ) : (
                  <Text style={[styles.actionBtnText, { color: '#0f1a0f' }]}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Folders() {
  const router = useRouter();
  const { serverUrl } = useLocalSearchParams<{ serverUrl: string }>();
  const [theme] = useTheme();
  const c = GrassColors[theme];
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const ws = useWebSocket(serverUrl ?? null);
  const [pendingRepo, setPendingRepo] = useState<Repo | null>(null);
  const [repoDetails, setRepoDetails] = useState<Map<string, RepoDetails>>(new Map());

  // Show loading if repos haven't loaded yet
  const [fetching, setFetching] = useState(true);
  useFocusEffect(useCallback(() => {
    if (!serverUrl) { setFetching(false); return; }
    setFetching(true);
    listReposStore(serverUrl).then(() => {
      setFetching(false);
      const entry = getEntry(serverUrl);
      if (!entry) return;
      // Fire detail fetches in parallel, update state as each one lands
      entry.repos.forEach(r => {
        getRepoDetailsStore(serverUrl, r.path).then(() => {
          const e = getEntry(serverUrl);
          if (e) setRepoDetails(new Map(e.repoDetails));
        });
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]));

  const loading = fetching && ws.repos.length === 0;

  function openAgentPicker(repo: Repo) {
    if (isIPad) {
      router.push({
        pathname: '/project',
        params: { serverUrl: serverUrl!, repoPath: repo.path, repoName: repo.name },
      });
    } else {
      setPendingRepo(repo);
    }
  }

  function handleSelectAgent(agentId: string) {
    if (!pendingRepo || !serverUrl) return;
    setPendingRepo(null);
    router.push({
      pathname: '/sessions',
      params: { serverUrl, repoPath: pendingRepo.path, repoName: pendingRepo.name, agent: agentId },
    });
  }

  async function handleRefresh() {
    if (!serverUrl) return;
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await listReposStore(serverUrl);
    setRefreshing(false);
    const entry = getEntry(serverUrl);
    if (!entry) return;
    entry.repos.forEach(r => {
      getRepoDetailsStore(serverUrl, r.path).then(() => {
        const e = getEntry(serverUrl);
        if (e) setRepoDetails(new Map(e.repoDetails));
      });
    });
  }

  function handleAddSuccess(repo: Repo) {
    setAddModalVisible(false);
    openAgentPicker(repo);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <View style={[styles.headerWrap, { borderBottomColor: CARD_BORDER }]}>
        <BlurView intensity={40} tint="dark" style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            hitSlop={8}
          >
            <Text style={[styles.backBtnText, { color: TEXT }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.headerTitle, { color: TEXT }]} numberOfLines={1}>
              {serverUrl ? hostFromUrl(serverUrl) : 'Folders'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAddModalVisible(true); }}
            hitSlop={8}
          >
            <Ionicons name="add" size={26} color={ACCENT} />
          </TouchableOpacity>
        </BlurView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ACCENT} size="large" />
          <Text style={[styles.statusText, { color: SUBTEXT }]}>Loading folders…</Text>
        </View>
      ) : ws.repos.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="folder-open-outline" size={44} color={SUBTEXT} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: TEXT }]}>No folders found</Text>
          <Text style={[styles.statusText, { color: SUBTEXT }]}>Pull down to refresh or tap + to add</Text>
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
              tintColor={ACCENT}
              colors={[ACCENT]}
            />
          }
          renderItem={({ item }) => (
            <RepoItem item={item} details={repoDetails.get(item.path)} onPress={() => openAgentPicker(item)} />
          )}
        />
      )}

      {/* Add repo modal (clone / new folder) */}
      {serverUrl && (
        <AddRepoModal
          visible={addModalVisible}
          serverUrl={serverUrl}
          c={c}
          onClose={() => setAddModalVisible(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* iPhone-only: agent picker modal */}
      {!isIPad && (
        <Modal
          visible={!!pendingRepo}
          transparent
          animationType="slide"
          onRequestClose={() => setPendingRepo(null)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setPendingRepo(null)}
          >
            <View
              style={[styles.modalSheet, { backgroundColor: BG, borderTopColor: CARD_BORDER }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={[styles.modalHandle, { backgroundColor: SUBTEXT }]} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: SUBTEXT }]}>Select an agent</Text>
                <TouchableOpacity onPress={() => setPendingRepo(null)} hitSlop={8}>
                  <Ionicons name="close" size={20} color={SUBTEXT} />
                </TouchableOpacity>
              </View>
              {pendingRepo && (
                <Text style={[styles.modalRepo, { color: TEXT }]} numberOfLines={1}>
                  {pendingRepo.name}
                </Text>
              )}
              <View style={styles.agentList}>
                {AGENTS.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    c={c}
                    onPress={() => handleSelectAgent(agent.id)}
                  />
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
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
  addBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    gap: 8,
  },
  repoItem: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  repoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  repoName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  timeAgo: {
    fontSize: 12,
    flexShrink: 0,
    marginLeft: 8,
  },
  repoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  commitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  commitAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#c4a47c',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commitAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a0f00',
  },
  commitMsg: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    opacity: 0.85,
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
  emptyIcon: {
    marginBottom: 8,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  addModalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalRepo: {
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 4,
    marginBottom: 14,
    opacity: 0.6,
  },
  agentList: {
    gap: 10,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  agentLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    flexShrink: 0,
  },
  agentTextGroup: {
    flex: 1,
    gap: 3,
  },
  agentLabel: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  agentDesc: {
    fontSize: 13,
    opacity: 0.7,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: -1,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'ui-monospace',
  },
  actionBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  errorMsg: {
    fontSize: 13,
    marginTop: 2,
  },
  statusMsg: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
});
