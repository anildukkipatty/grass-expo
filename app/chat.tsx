import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWebSocket } from '@/hooks/use-websocket';
import { useTheme } from '@/store/theme-store';
import { getUrl } from '@/store/url-store';
import { GrassColors } from '@/constants/theme';
import { MessageBubble } from '@/components/MessageBubble';
import { ActivityBar } from '@/components/ActivityBar';
import { PermissionModal } from '@/components/PermissionModal';
import { sessionsRef, onSelectRef, onNewRef } from './sessions';
import { diffTextRef } from './diffs';

export default function Chat() {
  const router = useRouter();
  const [theme, setTheme] = useTheme();
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const c = GrassColors[theme];

  useEffect(() => {
    getUrl().then(url => {
      if (!url) {
        router.replace('/settings');
      } else {
        setWsUrl(url);
      }
    });
  }, [router]);

  const ws = useWebSocket(wsUrl);

  // Keep sessions module refs up-to-date
  useEffect(() => {
    sessionsRef.current = ws.sessionsList;
  }, [ws.sessionsList]);

  useEffect(() => {
    onSelectRef.current = (id: string) => {
      ws.initSession(id);
    };
    onNewRef.current = () => {
      ws.initSession(null);
    };
  }, [ws.initSession]);

  const send = useCallback(() => {
    const text = inputText.trim();
    if (!text || !ws.connected || ws.streaming) return;
    ws.send(text);
    setInputText('');
  }, [inputText, ws]);

  const goSessions = useCallback(() => {
    sessionsRef.current = ws.sessionsList;
    router.push('/sessions');
  }, [router, ws.sessionsList]);

  const goDiffs = useCallback(() => {
    ws.getDiffs();
    diffTextRef.current = ws.diffText;
    router.push('/diffs');
  }, [router, ws]);

  // Update diffTextRef when diffText changes
  useEffect(() => {
    diffTextRef.current = ws.diffText;
  }, [ws.diffText]);

  const statusText = ws.reconnecting
    ? 'Reconnecting...'
    : ws.connected
    ? ws.sessionId ? `Session: ${ws.sessionId.slice(0, 8)}…` : 'Connected'
    : 'Disconnected';

  const statusColor = ws.connected ? '#2ecc71' : ws.reconnecting ? '#f39c12' : '#e74c3c';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.barBg, borderBottomColor: c.border }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: c.text }]} numberOfLines={1}>{statusText}</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={goDiffs} hitSlop={8}>
          <Text style={[styles.headerBtnText, { color: c.text }]}>Diffs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={goSessions} hitSlop={8}>
          <Text style={[styles.headerBtnText, { color: c.text }]}>Sessions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/settings')}
          hitSlop={8}
        >
          <Text style={[styles.headerBtnText, { color: c.text }]}>⚙</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          hitSlop={8}
        >
          <Text style={[styles.headerBtnText, { color: c.text }]}>
            {theme === 'light' ? '☾' : '☀'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={ws.messages}
          keyExtractor={(item, index) => item.msgId ?? String(index)}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <MessageBubble
              role={item.role}
              content={item.content}
              badge={item.badge}
              theme={theme}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={[styles.emptyChatText, { color: c.badgeText }]}>
                {ws.connected ? 'Send a message to get started.' : 'Connecting to server…'}
              </Text>
            </View>
          }
        />

        {/* Activity bar */}
        {ws.activity && (
          <ActivityBar label={ws.activity.label} theme={theme} />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: c.barBg, borderTopColor: c.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
            placeholder="Type a message…"
            placeholderTextColor={c.badgeText}
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={ws.connected && !ws.streaming}
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          {ws.streaming ? (
            <TouchableOpacity style={[styles.sendBtn, styles.abortBtn]} onPress={ws.abort}>
              <Text style={styles.sendBtnText}>■</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: c.accent }, (!ws.connected || !inputText.trim()) && styles.sendBtnDisabled]}
              onPress={send}
              disabled={!ws.connected || !inputText.trim()}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Permission modal */}
      {ws.permissionQueue.length > 0 && (
        <PermissionModal
          item={ws.permissionQueue[0]}
          onAllow={() => ws.respondPermission(true)}
          onDeny={() => ws.respondPermission(false)}
          theme={theme}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 13,
    flex: 1,
  },
  headerBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: {
    fontSize: 13,
  },
  messageList: {
    padding: 12,
    paddingBottom: 8,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyChatText: {
    fontSize: 15,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 48,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  abortBtn: {
    backgroundColor: '#e74c3c',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
});
