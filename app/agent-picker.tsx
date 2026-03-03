import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { useWebSocket } from '@/hooks/use-websocket';

const AGENTS = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    description: 'Anthropic\'s AI coding agent',
    logo: require('@/assets/images/cluade-logo.jpg'),
  },
  {
    id: 'opencode',
    label: 'OpenCode',
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
          <Text style={[styles.agentDescription, { color: c.badgeText }]}>{agent.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.badgeText} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AgentPicker() {
  const router = useRouter();
  const { wsUrl, repoPath, repoName } = useLocalSearchParams<{
    wsUrl: string;
    repoPath: string;
    repoName: string;
  }>();
  const [theme] = useTheme();
  const c = GrassColors[theme];

  const ws = useWebSocket(wsUrl ?? null);

  function handleSelectAgent(agentId: string) {
    ws.selectAgent(agentId);
    router.push({
      pathname: '/sessions',
      params: { wsUrl: wsUrl!, repoPath: repoPath!, repoName: repoName! },
    });
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
              {repoName || 'Choose Agent'}
            </Text>
            {repoPath ? (
              <Text style={[styles.headerSubtitle, { color: c.badgeText }]} numberOfLines={1}>
                {repoPath}
              </Text>
            ) : null}
          </View>
        </BlurView>
      </View>

      <View style={styles.inner}>
        <Text style={[styles.sectionLabel, { color: c.badgeText }]}>Select an agent</Text>
        <View style={styles.cardList}>
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
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'ui-monospace',
    opacity: 0.55,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  cardList: {
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
  agentDescription: {
    fontSize: 13,
    opacity: 0.7,
  },
});
