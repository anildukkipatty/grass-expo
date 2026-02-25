import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { Session } from '@/hooks/use-websocket';


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitleGroup: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerCwd: {
    fontSize: 12,
    fontFamily: 'ui-monospace',
    opacity: 0.55,
  },
  diffsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  diffsBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  newBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  newBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
  list: {
    padding: 16,
    gap: 8,
  },
  sessionItem: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  sessionPreview: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 6,
  },
  sessionTime: {
    fontSize: 11,
    flexShrink: 0,
  },
  sessionId: {
    fontSize: 11,
    fontFamily: 'ui-monospace',
    letterSpacing: 0.2,
    flexShrink: 1,
    opacity: 0.6,
  },
});

function trimCwd(path: string, maxLen = 30): string {
  if (path.length <= maxLen) return path;
  const parts = path.split('/');
  let result = parts[parts.length - 1];
  for (let i = parts.length - 2; i >= 0; i--) {
    const candidate = parts.slice(i).join('/');
    if (candidate.length + 4 > maxLen) break;
    result = candidate;
  }
  return '.../' + result;
}

function timeAgo(isoString?: string): string {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + ' min' + (mins === 1 ? '' : 's') + ' ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' hr' + (hrs === 1 ? '' : 's') + ' ago';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + ' day' + (days === 1 ? '' : 's') + ' ago';
  const months = Math.floor(days / 30);
  if (months < 12) return months + ' month' + (months === 1 ? '' : 's') + ' ago';
  const years = Math.floor(months / 12);
  return years + ' year' + (years === 1 ? '' : 's') + ' ago';
}

function SessionItem({ item, onPress, c }: {
  item: Session;
  onPress: () => void;
  c: typeof GrassColors['light'];
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.sessionItem, { backgroundColor: c.assistantBubble, borderColor: c.border }]}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 2 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
        }
        activeOpacity={1}
      >
        <Text style={[styles.sessionPreview, { color: c.text }]} numberOfLines={2}>
          {item.label || item.preview || 'Session'}
        </Text>
        <View style={styles.sessionMeta}>
          {(item.updatedAt || item.createdAt) ? (
            <Text style={[styles.sessionTime, { color: c.badgeText }]}>
              {timeAgo(item.updatedAt || item.createdAt)}
            </Text>
          ) : null}
          <Text style={[styles.sessionId, { color: c.badgeText }]}>{item.id}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Sessions() {
  const router = useRouter();
  const { wsUrl } = useLocalSearchParams<{ wsUrl: string }>();
  const [theme] = useTheme();
  const c = GrassColors[theme];
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cwd, setCwd] = useState<string | null>(null);
  const newBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!wsUrl) return;
    let ws: WebSocket;
    let done = false;
    let timeout: ReturnType<typeof setTimeout>;

    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      setError('Invalid server URL');
      setLoading(false);
      return;
    }

    timeout = setTimeout(() => {
      if (!done) {
        done = true;
        ws.close();
        setError('Connection timed out');
        setLoading(false);
      }
    }, 6000);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'list_sessions' }));
      ws.send(JSON.stringify({ type: 'get_cwd' }));
    };

    let gotSessions = false;
    let gotCwd = false;

    function maybeClose() {
      if (gotSessions && gotCwd) ws.close();
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === 'sessions_list') {
          clearTimeout(timeout);
          done = true;
          const raw: Session[] = data.sessions || [];
          raw.sort((a, b) => {
            const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return tb - ta;
          });
          setSessions(raw);
          setLoading(false);
          gotSessions = true;
          maybeClose();
        } else if (data.type === 'cwd') {
          setCwd(data.cwd ?? null);
          gotCwd = true;
          maybeClose();
        }
      } catch {}
    };

    ws.onerror = () => {
      if (!done) {
        clearTimeout(timeout);
        done = true;
        setError('Could not connect to server');
        setLoading(false);
      }
    };

    ws.onclose = () => {
      if (!done) {
        clearTimeout(timeout);
        done = true;
        setError('Connection closed');
        setLoading(false);
      }
    };

    return () => {
      done = true;
      clearTimeout(timeout);
      ws.close();
    };
  }, [wsUrl]);

  function openChat(sessionId?: string) {
    const params: Record<string, string> = { wsUrl: wsUrl! };
    if (sessionId) params.sessionId = sessionId;
    router.push({ pathname: '/chat', params });
  }

  function goDiffs() {
    if (!wsUrl) return;
    router.push({ pathname: '/diffs', params: { wsUrl } });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.barBg, borderBottomColor: c.border }]}>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Sessions</Text>
          {cwd ? (
            <Text style={[styles.headerCwd, { color: c.text }]} numberOfLines={1}>
              {trimCwd(cwd)}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.diffsBtn} onPress={goDiffs} hitSlop={8}>
          <Text style={[styles.diffsBtnText, { color: c.badgeText }]}>Diffs</Text>
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ scale: newBtnScale }] }}>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: c.accent }]}
            onPress={() => openChat()}
            onPressIn={() =>
              Animated.spring(newBtnScale, { toValue: 0.94, useNativeDriver: true, speed: 50, bounciness: 2 }).start()
            }
            onPressOut={() =>
              Animated.spring(newBtnScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
            }
            activeOpacity={1}
          >
            <Text style={styles.newBtnText}>New Chat</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} size="large" />
          <Text style={[styles.statusText, { color: c.badgeText }]}>Loading sessions…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: c.errorText }]}>{error}</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.statusText, { color: c.badgeText }]}>No sessions yet</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SessionItem item={item} c={c} onPress={() => openChat(item.id)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
