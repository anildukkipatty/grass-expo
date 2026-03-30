import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Animated, ScrollView, Modal,
  PanResponder, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { getUrls, removeUrl, saveUrl } from '@/store/url-store';
import {
  openConnection, closeConnection, subscribeToAll, getEntry,
  listReposStore, getRepoDetailsStore, Repo, RepoDetails,
} from '@/store/connection-store';

// ── Palette ──────────────────────────────────────────────────────────────────
const BG = '#0f1a0f';
const CARD_BG = 'rgba(30, 42, 30, 0.6)';
const CARD_BORDER = 'rgba(100, 140, 100, 0.1)';
const TEXT = '#d4e8d4';
const SUBTEXT = '#7a9a7a';
const DIM = '#5a7a5a';
const ACCENT = '#7CB9A8';
const DARK_BG = 'rgba(20, 32, 20, 0.5)';

const AGENTS = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    description: "Anthropic's AI coding agent",
    logo: require('@/assets/images/cluade-logo.jpg'),
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    description: 'Open source AI coding agent',
    logo: require('@/assets/images/open-code.png'),
  },
] as const;

const DELETE_WIDTH = 72;
const HEALTH_POLL_MS = 10_000;

function hostFromUrl(url: string): string {
  try { return new URL(url).host; } catch { return url; }
}

// ── Animated star ─────────────────────────────────────────────────────────────
function Star({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  const opacity = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.9, duration: 1500 + delay % 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 1500 + delay % 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: '#c8e6c9', opacity,
    }} />
  );
}

// ── Animated firefly ──────────────────────────────────────────────────────────
function Firefly({ x, y, delay }: { x: number; y: number; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -8, duration: 1400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
        Animated.delay(1200 + delay % 1000),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y,
      width: 5, height: 5, borderRadius: 2.5,
      backgroundColor: '#a5f3c0', opacity,
      transform: [{ translateY }],
      shadowColor: '#a5f3c0', shadowRadius: 4, shadowOpacity: 0.9, shadowOffset: { width: 0, height: 0 },
    }} />
  );
}

// ── Park Scene ────────────────────────────────────────────────────────────────
const STARS = [
  { x: 30, y: 18, d: 0, s: 2 }, { x: 60, y: 10, d: 200, s: 1.5 },
  { x: 100, y: 22, d: 400, s: 2 }, { x: 140, y: 8, d: 100, s: 1.5 },
  { x: 180, y: 20, d: 600, s: 2.5 }, { x: 220, y: 12, d: 300, s: 1.5 },
  { x: 260, y: 24, d: 500, s: 2 }, { x: 295, y: 14, d: 150, s: 1.5 },
  { x: 320, y: 6, d: 700, s: 2 }, { x: 350, y: 18, d: 250, s: 1.5 },
];
const FIREFLIES = [
  { x: 55, y: 105, d: 0 }, { x: 90, y: 118, d: 800 },
  { x: 160, y: 100, d: 1600 }, { x: 240, y: 112, d: 400 },
  { x: 290, y: 98, d: 1200 }, { x: 320, y: 120, d: 2000 },
];

function ParkScene({ activeUrl, onSandboxPress }: { activeUrl: string | null; onSandboxPress: () => void }) {
  const label = activeUrl
    ? (getEntry(activeUrl)?.serverCwd?.split('/').pop() || hostFromUrl(activeUrl))
    : 'No sandbox';

  return (
    <View style={s.park}>
      {/* Sky */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0a1a0e' }]} />

      {/* Stars */}
      {STARS.map((st, i) => <Star key={i} x={st.x} y={st.y} delay={st.d} size={st.s} />)}

      {/* Moon */}
      <View style={s.moon} />

      {/* Distant treeline */}
      <View style={s.distantTrees}>
        {[20, 60, 95, 130, 165, 200, 235, 265, 295, 325].map((x, i) => (
          <View key={i} style={[s.distantTree, { left: x, height: 30 + (i % 3) * 10 }]} />
        ))}
      </View>

      {/* Ground */}
      <View style={s.ground} />

      {/* Big trees */}
      <View style={[s.treeTrunk, { left: 10, height: 70 }]} />
      <View style={[s.treeFoliage, { left: -10, top: 50 }]} />
      <View style={[s.treeTrunk, { left: 330, height: 80 }]} />
      <View style={[s.treeFoliage, { left: 315, top: 40 }]} />

      {/* Bench */}
      <View style={s.bench}>
        <View style={s.benchSeat} />
        <View style={[s.benchLeg, { left: 4 }]} />
        <View style={[s.benchLeg, { right: 4 }]} />
      </View>

      {/* Person silhouette */}
      <View style={s.person}>
        <View style={s.personHead} />
        <View style={s.personBody} />
      </View>

      {/* Laptop glow */}
      <View style={s.laptopGlow} />
      <View style={s.laptop} />

      {/* Fireflies */}
      {FIREFLIES.map((ff, i) => <Firefly key={i} x={ff.x} y={ff.y} delay={ff.d} />)}

      {/* Overlay text */}
      <View style={s.parkTextRow}>
        <Text style={s.parkTagline}>coding from the park</Text>
      </View>

      {/* Sandbox pill */}
      <TouchableOpacity style={s.sandboxPill} onPress={onSandboxPress} activeOpacity={0.75}>
        <View style={[s.sandboxDot, { backgroundColor: activeUrl ? ACCENT : DIM }]} />
        <Text style={s.sandboxPillText} numberOfLines={1}>{label}</Text>
        <Text style={s.sandboxChevron}>▾</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Swipe-to-delete server row (for sandbox picker) ───────────────────────────
function SandboxRow({ url, health, isActive, onSelect, onDelete }: {
  url: string;
  health: 'healthy' | 'unreachable' | undefined;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;
  const isOpen = useRef(false);
  const didHaptic = useRef(false);
  const cwd = getEntry(url)?.serverCwd;
  const label = cwd ? (cwd.split('/').pop() || hostFromUrl(url)) : hostFromUrl(url);

  const deleteOpacity = translateX.interpolate({
    inputRange: [-DELETE_WIDTH, 0], outputRange: [1, 0], extrapolate: 'clamp',
  });

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: () => { didHaptic.current = false; },
    onPanResponderMove: (_, g) => {
      const x = isOpen.current ? g.dx - DELETE_WIDTH : g.dx;
      translateX.setValue(Math.min(0, Math.max(-DELETE_WIDTH, x)));
      if (x < -DELETE_WIDTH / 2 && !didHaptic.current) {
        didHaptic.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
    onPanResponderRelease: (_, g) => {
      const x = isOpen.current ? g.dx - DELETE_WIDTH : g.dx;
      if (x < -DELETE_WIDTH / 2) {
        Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
        isOpen.current = true;
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
        isOpen.current = false;
      }
    },
  })).current;

  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(itemOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => onDelete());
  }

  return (
    <Animated.View style={{ overflow: 'hidden', borderRadius: 12, opacity: itemOpacity, marginBottom: 8 }}>
      <Animated.View style={[s.deleteBtn, { opacity: deleteOpacity }]}>
        <TouchableOpacity style={s.deleteBtnInner} onPress={handleDelete} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={s.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity
          style={[s.sandboxRow, isActive && { borderColor: ACCENT }]}
          onPress={() => { if (isOpen.current) { Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 30, bounciness: 4 }).start(); isOpen.current = false; } else { onSelect(); } }}
          activeOpacity={0.85}
        >
          <View style={[s.dot, {
            backgroundColor: health === 'healthy' ? '#22c55e' : health === 'unreachable' ? '#ef4444' : '#5a7a5a',
          }]} />
          <View style={{ flex: 1 }}>
            <Text style={[s.sandboxRowLabel, isActive && { color: ACCENT }]} numberOfLines={1}>{label}</Text>
            {cwd ? <Text style={s.sandboxRowSub} numberOfLines={1}>{hostFromUrl(url)}</Text> : null}
          </View>
          {isActive && <Ionicons name="checkmark" size={16} color={ACCENT} />}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ── Sandbox picker modal ──────────────────────────────────────────────────────
function SandboxPickerModal({ visible, urls, healthMap, activeUrl, onSelect, onDelete, onScan, onClose }: {
  visible: boolean;
  urls: string[];
  healthMap: Map<string, 'healthy' | 'unreachable'>;
  activeUrl: string | null;
  onSelect: (url: string) => void;
  onDelete: (url: string) => void;
  onScan: () => void;
  onClose: () => void;
}) {
  const scanAfterDismiss = useRef(false);

  function handleScanPress() {
    scanAfterDismiss.current = true;
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={() => {
        if (scanAfterDismiss.current) {
          scanAfterDismiss.current = false;
          onScan();
        }
      }}
    >
      <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={s.modalSheet}>
        <View style={s.modalHandle} />
        <View style={s.modalHeaderRow}>
          <Text style={s.modalTitle}>Sandboxes</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={SUBTEXT} />
          </TouchableOpacity>
        </View>

        {urls.map(url => (
          <SandboxRow
            key={url}
            url={url}
            health={healthMap.get(url)}
            isActive={url === activeUrl}
            onSelect={() => { onSelect(url); onClose(); }}
            onDelete={() => onDelete(url)}
          />
        ))}

        {urls.length === 0 && (
          <Text style={{ color: SUBTEXT, textAlign: 'center', marginVertical: 16 }}>No sandboxes saved</Text>
        )}

        <TouchableOpacity style={s.scanBtn} onPress={handleScanPress} activeOpacity={0.8}>
          <Ionicons name="qr-code-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={s.scanBtnText}>Scan QR Code</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Repo card helpers ──────────────────────────────────────────────────────────
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

function langLabel(lang: string): string {
  const map: Record<string, string> = {
    ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript',
    py: 'Python', go: 'Go', rs: 'Rust', swift: 'Swift',
  };
  return map[lang] ?? lang.toUpperCase();
}

// ── Repo card ─────────────────────────────────────────────────────────────────
function RepoCard({ repo, details, onPress }: { repo: Repo; details?: RepoDetails; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const langColor = details?.dominantLanguage ? (LANG_COLORS[details.dominantLanguage] ?? SUBTEXT) : null;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={s.repoCard}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 2 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()}
        activeOpacity={1}
      >
        {/* Top row: name + timestamp */}
        <View style={s.repoTopRow}>
          <View style={s.repoNameRow}>
            <Text style={s.repoName} numberOfLines={1}>{repo.name}</Text>
            {repo.isGit && <View style={s.onlineDot} />}
          </View>
          {details?.lastCommit && (
            <Text style={s.repoTimeAgo}>{timeAgo(details.lastCommit.timestamp)}</Text>
          )}
        </View>

        {/* Meta row: language + branch */}
        <View style={s.repoMetaRow}>
          {details?.dominantLanguage && langColor && (
            <View style={s.metaChip}>
              <View style={[s.langDot, { backgroundColor: langColor }]} />
              <Text style={s.metaText}>{langLabel(details.dominantLanguage)}</Text>
            </View>
          )}
          {details?.branch && (
            <View style={s.metaChip}>
              <Ionicons name="git-branch-outline" size={13} color={SUBTEXT} />
              <Text style={s.metaText}>{details.branch}</Text>
            </View>
          )}
          {!details && (
            <Text style={[s.metaText, { opacity: 0.4 }]} numberOfLines={1}>{repo.path}</Text>
          )}
        </View>

        {/* Commit row */}
        {details?.lastCommit && (
          <View style={s.commitRow}>
            <View style={s.commitAvatar}>
              <Text style={s.commitAvatarText}>
                {details.lastCommit.message.trim().charAt(0).toUpperCase() || 'C'}
              </Text>
            </View>
            <Text style={s.commitMsg} numberOfLines={1}>{details.lastCommit.message}</Text>
            <Ionicons name="chevron-forward" size={13} color={SUBTEXT} style={{ opacity: 0.5 }} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Agent card (for inline picker) ───────────────────────────────────────────
function AgentCard({ agent, onSelect }: { agent: typeof AGENTS[number]; onSelect: (id: string) => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={s.agentCard}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSelect(agent.id); }}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 2 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()}
        activeOpacity={1}
      >
        <Image source={agent.logo} style={s.agentLogo} contentFit="contain" />
        <View style={{ flex: 1 }}>
          <Text style={s.agentLabel}>{agent.label}</Text>
          <Text style={s.agentDesc}>{agent.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={DIM} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Inline agent picker ───────────────────────────────────────────────────────
function AgentPicker({ repo, onSelect, onBack }: {
  repo: Repo;
  onSelect: (agentId: string) => void;
  onBack: () => void;
}) {
  return (
    <View>
      <View style={s.agentPickerHeader}>
        <TouchableOpacity onPress={onBack} style={s.agentBackBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={ACCENT} />
          <Text style={s.agentBackText}>Back</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.agentPickerTitle}>Select agent for</Text>
      <Text style={s.agentPickerRepo} numberOfLines={1}>{repo.name}</Text>
      <View style={{ gap: 10, marginTop: 8 }}>
        {AGENTS.map(agent => (
          <AgentCard key={agent.id} agent={agent} onSelect={onSelect} />
        ))}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [urls, setUrls] = useState<string[]>([]);
  const [, forceUpdate] = useState(0);
  const [healthMap, setHealthMap] = useState<Map<string, 'healthy' | 'unreachable'>>(new Map());
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [repoDetails, setRepoDetails] = useState<Map<string, RepoDetails>>(new Map());
  const [sandboxPickerOpen, setSandboxPickerOpen] = useState(false);
  const [agentPickerRepo, setAgentPickerRepo] = useState<Repo | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    const unsub = subscribeToAll(() => forceUpdate(n => n + 1));
    return unsub;
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Reset agent picker when returning to this screen
      setAgentPickerRepo(null);

      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const gen = ++generationRef.current;
      let currentUrls: string[] = [];

      async function pollHealth(urlsToCheck: string[]) {
        if (gen !== generationRef.current) return;
        const results = await Promise.allSettled(
          urlsToCheck.map(async (url) => {
            try {
              const res = await fetch(`${url}/health`);
              return { url, ok: res.ok };
            } catch {
              return { url, ok: false };
            }
          })
        );
        if (gen !== generationRef.current) return;
        const next = new Map<string, 'healthy' | 'unreachable'>();
        let firstHealthy: string | null = null;
        for (const r of results) {
          if (r.status === 'fulfilled') {
            next.set(r.value.url, r.value.ok ? 'healthy' : 'unreachable');
            if (r.value.ok && !firstHealthy) firstHealthy = r.value.url;
          }
        }
        setHealthMap(prev => {
          const merged = new Map(prev);
          for (const [k, v] of next) merged.set(k, v);
          return merged;
        });
        if (firstHealthy) {
          setActiveUrl(prev => prev ?? firstHealthy);
        }
      }

      getUrls().then(loadedUrls => {
        if (gen !== generationRef.current) return;
        currentUrls = loadedUrls;
        setUrls(loadedUrls);
        loadedUrls.forEach(openConnection);
        pollHealth(loadedUrls);
        intervalRef.current = setInterval(() => pollHealth(currentUrls), HEALTH_POLL_MS);
      });

      return () => {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        generationRef.current++;
      };
    }, [])
  );

  // Load repos + details whenever activeUrl changes
  useEffect(() => {
    if (!activeUrl) return;
    setRepoDetails(new Map());
    listReposStore(activeUrl).then(() => {
      const entry = getEntry(activeUrl);
      if (!entry) return;
      entry.repos.forEach(r => {
        getRepoDetailsStore(activeUrl, r.path).then(() => {
          const e = getEntry(activeUrl);
          if (e) setRepoDetails(new Map(e.repoDetails));
        });
      });
    });
  }, [activeUrl]);

  useEffect(() => {
    const subscription = CameraView.onModernBarcodeScanned(async (result) => {
      const serverUrl = result.data;
      await CameraView.dismissScanner();
      await saveUrl(serverUrl);
      openConnection(serverUrl);
      const updated = await getUrls();
      setUrls(updated);
      setActiveUrl(serverUrl);
    });
    return () => subscription.remove();
  }, []);

  async function handleScan() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('[QR] handleScan called');
    try {
      console.log('[QR] calling launchScanner');
      await CameraView.launchScanner({ barcodeTypes: ['qr'] });
      console.log('[QR] launchScanner resolved');
    } catch (err) {
      console.log('[QR] launchScanner error:', err);
      Alert.alert('Scanner Error', String(err));
    }
  }

  async function handleDeleteUrl(url: string) {
    closeConnection(url);
    await removeUrl(url);
    setUrls(prev => {
      const next = prev.filter(u => u !== url);
      if (activeUrl === url) setActiveUrl(next[0] ?? null);
      return next;
    });
  }

  const repos: Repo[] = activeUrl ? (getEntry(activeUrl)?.repos ?? []) : [];

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <ParkScene activeUrl={activeUrl} onSandboxPress={() => setSandboxPickerOpen(true)} />

        <View style={s.body}>
          {agentPickerRepo ? (
            <AgentPicker
              repo={agentPickerRepo}
              onBack={() => setAgentPickerRepo(null)}
              onSelect={(agentId) => {
                if (!activeUrl) return;
                setAgentPickerRepo(null);
                router.push({
                  pathname: '/sessions',
                  params: {
                    serverUrl: activeUrl,
                    repoPath: agentPickerRepo.path,
                    repoName: agentPickerRepo.name,
                    agent: agentId,
                  },
                });
              }}
            />
          ) : (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionLabel}>
                  Repositories{repos.length > 0 ? ` · ${repos.length}` : ''}
                </Text>
                {activeUrl && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (!activeUrl) return;
                      listReposStore(activeUrl).then(() => {
                        const entry = getEntry(activeUrl);
                        if (!entry) return;
                        entry.repos.forEach(r => {
                          getRepoDetailsStore(activeUrl, r.path).then(() => {
                            const e = getEntry(activeUrl);
                            if (e) setRepoDetails(new Map(e.repoDetails));
                          });
                        });
                      });
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="refresh-outline" size={16} color={DIM} />
                  </TouchableOpacity>
                )}
              </View>

              {!activeUrl ? (
                <View style={s.emptyState}>
                  <Ionicons name="qr-code-outline" size={40} color={DIM} style={{ marginBottom: 12 }} />
                  <Text style={s.emptyTitle}>No sandbox connected</Text>
                  <Text style={s.emptyText}>Tap the sandbox pill above to add one</Text>
                </View>
              ) : repos.length === 0 ? (
                <View style={s.emptyState}>
                  <Ionicons name="folder-open-outline" size={40} color={DIM} style={{ marginBottom: 12 }} />
                  <Text style={s.emptyTitle}>No repositories found</Text>
                  <Text style={s.emptyText}>Pull to refresh or check your sandbox</Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {repos.map(repo => (
                    <RepoCard key={repo.path} repo={repo} details={repoDetails.get(repo.path)} onPress={() => setAgentPickerRepo(repo)} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <SandboxPickerModal
        visible={sandboxPickerOpen}
        urls={urls}
        healthMap={healthMap}
        activeUrl={activeUrl}
        onSelect={url => { setActiveUrl(url); listReposStore(url); }}
        onDelete={handleDeleteUrl}
        onScan={handleScan}
        onClose={() => setSandboxPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 48 },

  // Park scene
  park: {
    height: 200,
    overflow: 'hidden',
    backgroundColor: '#0a1a0e',
  },
  moon: {
    position: 'absolute', right: 60, top: 16,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#d4e8c8',
    shadowColor: '#c8f0c8', shadowRadius: 10, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 0 },
  },
  distantTrees: { position: 'absolute', bottom: 60, left: 0, right: 0, height: 50 },
  distantTree: {
    position: 'absolute', bottom: 0,
    width: 22,
    backgroundColor: '#1a3020',
    borderTopLeftRadius: 11, borderTopRightRadius: 11,
  },
  ground: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 60, backgroundColor: '#142010',
  },
  treeTrunk: {
    position: 'absolute', bottom: 60,
    width: 14, backgroundColor: '#1e3018',
  },
  treeFoliage: {
    position: 'absolute',
    width: 50, height: 70,
    borderRadius: 25,
    backgroundColor: '#183020',
  },
  bench: {
    position: 'absolute', bottom: 60, left: 140,
    width: 80, height: 20,
  },
  benchSeat: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 6, backgroundColor: '#2a4030', borderRadius: 3,
  },
  benchLeg: {
    position: 'absolute', bottom: 0,
    width: 4, height: 14,
    backgroundColor: '#2a4030',
  },
  person: {
    position: 'absolute', bottom: 76, left: 165,
  },
  personHead: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#3a5540', marginBottom: 1, marginLeft: 2,
  },
  personBody: {
    width: 16, height: 18,
    backgroundColor: '#2a4030',
    borderTopLeftRadius: 5, borderTopRightRadius: 5,
  },
  laptop: {
    position: 'absolute', bottom: 74, left: 176,
    width: 22, height: 14,
    backgroundColor: '#1a2e20',
    borderRadius: 3,
    borderWidth: 1, borderColor: ACCENT,
  },
  laptopGlow: {
    position: 'absolute', bottom: 74, left: 174,
    width: 26, height: 18,
    borderRadius: 6,
    backgroundColor: 'transparent',
    shadowColor: ACCENT, shadowRadius: 8, shadowOpacity: 0.6, shadowOffset: { width: 0, height: 0 },
  },
  parkTextRow: {
    position: 'absolute', bottom: 10, left: 16,
  },
  parkTagline: {
    color: DIM, fontSize: 11, fontStyle: 'italic', letterSpacing: 0.5,
  },
  sandboxPill: {
    position: 'absolute', top: 10, right: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: DARK_BG,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, gap: 5,
    borderWidth: 1, borderColor: CARD_BORDER,
  },
  sandboxDot: { width: 6, height: 6, borderRadius: 3 },
  sandboxPillText: { color: TEXT, fontSize: 12, fontWeight: '600', maxWidth: 120 },
  sandboxChevron: { color: SUBTEXT, fontSize: 10 },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    color: SUBTEXT, fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // Repo card
  repoCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14, borderWidth: 1, borderColor: CARD_BORDER,
    padding: 14, gap: 8,
  },
  repoTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  repoNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  repoName: { color: TEXT, fontSize: 16, fontWeight: '700', letterSpacing: -0.3, flexShrink: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80', flexShrink: 0 },
  repoTimeAgo: { color: SUBTEXT, fontSize: 12, flexShrink: 0, marginLeft: 8 },
  repoMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  langDot: { width: 9, height: 9, borderRadius: 5 },
  metaText: { color: SUBTEXT, fontSize: 13, fontWeight: '500' },
  commitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  commitAvatar: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#c4a47c', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  commitAvatarText: { fontSize: 13, fontWeight: '700', color: '#1a0f00' },
  commitMsg: { color: TEXT, fontSize: 14, flex: 1, opacity: 0.85 },

  // Agent picker
  agentPickerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  agentBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  agentBackText: { color: ACCENT, fontSize: 16, fontWeight: '600' },
  agentPickerTitle: { color: SUBTEXT, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  agentPickerRepo: { color: TEXT, fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },
  agentCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD_BG, borderRadius: 14,
    borderWidth: 1, borderColor: CARD_BORDER,
    padding: 14, gap: 14,
  },
  agentLogo: { width: 44, height: 44, borderRadius: 10 },
  agentLabel: { color: TEXT, fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  agentDesc: { color: SUBTEXT, fontSize: 13, marginTop: 2 },

  // Empty state
  emptyState: {
    alignItems: 'center', paddingVertical: 40,
  },
  emptyTitle: { color: TEXT, fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  emptyText: { color: SUBTEXT, fontSize: 14, marginTop: 6, textAlign: 'center' },

  // Modal / sandbox picker
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#0f1a0f',
    borderTopWidth: 1, borderTopColor: CARD_BORDER,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    paddingTop: 12, paddingHorizontal: 16, paddingBottom: 40,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: DIM, alignSelf: 'center', marginBottom: 16, opacity: 0.4,
  },
  modalHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, marginBottom: 16,
  },
  modalTitle: {
    color: SUBTEXT, fontSize: 13, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  sandboxRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD_BG, borderRadius: 12,
    borderWidth: 1, borderColor: CARD_BORDER,
    padding: 12, gap: 10,
  },
  sandboxRowLabel: { color: TEXT, fontSize: 15, fontWeight: '600' },
  sandboxRowSub: { color: SUBTEXT, fontSize: 12, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: ACCENT, borderRadius: 12,
    paddingVertical: 14, marginTop: 16,
  },
  scanBtnText: { color: '#0f1a0f', fontSize: 16, fontWeight: '700' },

  // Swipe-to-delete
  deleteBtn: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: DELETE_WIDTH,
    backgroundColor: '#e53935', justifyContent: 'center', alignItems: 'center',
    borderRadius: 12,
  },
  deleteBtnInner: {
    flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', gap: 2,
  },
  deleteBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
