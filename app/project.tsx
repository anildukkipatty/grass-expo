import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Modal, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { useWebSocket } from '@/hooks/use-websocket';
import { getDiffsStore } from '@/store/connection-store';
import { ExplorerPanel } from '@/components/ExplorerPanel';
import { DiffViewer } from '@/components/DiffViewer';
import { isIPad } from '@/utils/device';

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

type SidebarMode = 'explorer' | 'agent' | 'diffs' | 'terminal';

const SIDEBAR_ITEMS: { mode: SidebarMode; icon: React.ComponentProps<typeof Ionicons>['name']; disabled?: boolean }[] = [
  { mode: 'explorer', icon: 'folder-open-outline' },
  { mode: 'agent',    icon: 'code-slash-outline' },
  { mode: 'diffs',    icon: 'git-compare-outline' },
  { mode: 'terminal', icon: 'terminal-outline', disabled: true },
];

function AgentCard({ agent, onPress, c }: {
  agent: typeof AGENTS[number];
  onPress: () => void;
  c: typeof GrassColors['light'];
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.agentCard, { backgroundColor: c.assistantBubble, borderColor: c.border }]}
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
          <Text style={[styles.agentLabel, { color: c.text }]}>{agent.label}</Text>
          <Text style={[styles.agentDesc, { color: c.badgeText }]}>{agent.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.badgeText} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Project() {
  const router = useRouter();
  const { wsUrl, repoPath, repoName } = useLocalSearchParams<{
    wsUrl: string;
    repoPath: string;
    repoName: string;
  }>();
  const [theme, setTheme] = useTheme();
  const c = GrassColors[theme];
  const ws = useWebSocket(wsUrl ?? null);

  const [activeMode, setActiveMode] = useState<'explorer' | 'diffs'>('explorer');
  const [agentModalVisible, setAgentModalVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSidebarTap(mode: SidebarMode, disabled?: boolean) {
    if (disabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      setShowToast(true);
      toastTimeout.current = setTimeout(() => setShowToast(false), 2000);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mode === 'agent') {
      setAgentModalVisible(true);
      return;
    }
    setActiveMode(mode as 'explorer' | 'diffs');
    if (mode === 'diffs' && wsUrl) getDiffsStore(wsUrl);
  }

  function handleSelectAgent(agentId: string) {
    ws.selectAgent(agentId);
    setAgentModalVisible(false);
    router.push({
      pathname: '/sessions',
      params: { wsUrl: wsUrl!, repoPath: repoPath!, repoName: repoName! },
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.headerWrap, { borderBottomColor: c.border }]}>
        <BlurView intensity={80} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            hitSlop={8}
          >
            <Text style={[styles.backBtnText, { color: c.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
            {repoName || 'Project'}
          </Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.themeBtn}
            onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            hitSlop={8}
          >
            <Ionicons
              name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={c.badgeText}
            />
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* Body: sidebar + content (iPad only) */}
      {isIPad && (
        <View style={styles.body}>
          {/* 52px sidebar */}
          <View style={[styles.sidebar, { borderRightColor: c.border, backgroundColor: c.barBg }]}>
            {SIDEBAR_ITEMS.map(item => {
              const isActive = !item.disabled && (
                item.mode === activeMode ||
                (item.mode === 'agent' && agentModalVisible)
              );
              return (
                <TouchableOpacity
                  key={item.mode}
                  style={styles.sidebarBtn}
                  onPress={() => handleSidebarTap(item.mode, item.disabled)}
                  activeOpacity={0.7}
                >
                  {isActive && (
                    <View style={[styles.activeIndicator, { backgroundColor: c.accent }]} />
                  )}
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={item.disabled ? c.badgeText + '44' : isActive ? c.accent : c.badgeText}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Content area */}
          <View style={styles.content}>
            {activeMode === 'explorer' && wsUrl && repoPath ? (
              <ExplorerPanel wsUrl={wsUrl} repoPath={repoPath} theme={theme} />
            ) : activeMode === 'diffs' && wsUrl ? (
              <DiffViewer wsUrl={wsUrl} />
            ) : null}
          </View>
        </View>
      )}

      {/* Agent picker modal */}
      <Modal
        visible={agentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { if (isIPad) setAgentModalVisible(false); else router.back(); }}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => { if (isIPad) setAgentModalVisible(false); }}
        >
          <View
            style={[styles.modalSheet, { backgroundColor: c.bg, borderTopColor: c.border }]}
            // Prevent modal from closing when tapping inside the sheet
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalHandle, { backgroundColor: c.badgeText }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.badgeText }]}>Select an agent</Text>
              {!isIPad && (
                <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
                  <Ionicons name="close" size={20} color={c.badgeText} />
                </TouchableOpacity>
              )}
            </View>
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

      {/* Coming soon toast */}
      {showToast && (
        <View style={[styles.toast, { backgroundColor: c.barBg, borderColor: c.border }]}>
          <Text style={[styles.toastText, { color: c.text }]}>Coming soon</Text>
        </View>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  themeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 52,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  sidebarBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },
  content: {
    flex: 1,
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
