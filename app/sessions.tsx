import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { Session } from '@/hooks/use-websocket';

export default function Sessions() {
  const router = useRouter();
  const [theme] = useTheme();
  const c = GrassColors[theme];

  // Sessions and callbacks are passed via global store pattern — we use a
  // simple module-level ref set by chat.tsx before navigating here.
  const sessions = sessionsRef.current;
  const onSelect = onSelectRef.current;
  const onNew = onNewRef.current;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.barBg, borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>Sessions</Text>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: c.accent }]}
          onPress={() => {
            onNew?.();
            router.back();
          }}
        >
          <Text style={styles.newBtnText}>New Chat</Text>
        </TouchableOpacity>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: c.badgeText }]}>No sessions yet</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.sessionItem, { backgroundColor: c.assistantBubble, borderColor: c.border }]}
              onPress={() => {
                onSelect?.(item.id);
                router.back();
              }}
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

// Module-level refs for passing data from chat screen
export const sessionsRef = { current: [] as Session[] };
export const onSelectRef = { current: null as ((id: string) => void) | null };
export const onNewRef = { current: null as (() => void) | null };

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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
});
