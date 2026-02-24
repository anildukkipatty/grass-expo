import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { Session } from '@/hooks/use-websocket';

export default function Sessions() {
  const router = useRouter();
  const { wsUrl } = useLocalSearchParams<{ wsUrl: string }>();
  const [theme] = useTheme();
  const c = GrassColors[theme];
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === 'sessions_list') {
          clearTimeout(timeout);
          done = true;
          setSessions((data.sessions as Session[]) || []);
          setLoading(false);
          ws.close();
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.barBg, borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>Sessions</Text>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: c.accent }]}
          onPress={() => openChat()}
        >
          <Text style={styles.newBtnText}>New Chat</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} />
          <Text style={[styles.statusText, { color: c.badgeText }]}>Loading sessions…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: '#e74c3c' }]}>{error}</Text>
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
            <TouchableOpacity
              style={[styles.sessionItem, { backgroundColor: c.assistantBubble, borderColor: c.border }]}
              onPress={() => openChat(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sessionPreview, { color: c.text }]} numberOfLines={2}>
                {item.label || item.preview || 'Session'}
              </Text>
              <Text style={[styles.sessionId, { color: c.badgeText }]}>{item.id}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  newBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  newBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 15,
  },
  errorText: {
    fontSize: 15,
  },
  list: {
    padding: 16,
    gap: 6,
  },
  sessionItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  sessionPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  sessionId: {
    fontSize: 11,
    fontFamily: 'ui-monospace',
    marginTop: 4,
  },
});
