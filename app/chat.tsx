import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWebSocket } from '@/hooks/use-websocket';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { MessageBubble } from '@/components/MessageBubble';
import { ActivityBar } from '@/components/ActivityBar';
import { PermissionModal } from '@/components/PermissionModal';
import { diffTextRef } from './diffs';

export default function Chat() {
  const router = useRouter();
  const { wsUrl, sessionId: initialSessionId } = useLocalSearchParams<{ wsUrl: string; sessionId?: string }>();
  const [theme, setTheme] = useTheme();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const sessionInitialized = useRef(false);
  const c = GrassColors[theme];
  const sendScale = useRef(new Animated.Value(1)).current;

  const ws = useWebSocket(wsUrl ?? null);

  // Auto-connect to session once connected
  useEffect(() => {
    if (ws.connected && initialSessionId && !sessionInitialized.current) {
      sessionInitialized.current = true;
      ws.initSession(initialSessionId);
    }
  }, [ws.connected, initialSessionId, ws.initSession]);

  const send = useCallback(() => {
    const text = inputText.trim();
    if (!text || !ws.connected || ws.streaming) return;
    ws.send(text);
    setInputText('');
  }, [inputText, ws]);

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
    ? ws.sessionId ? `${ws.sessionId.slice(0, 8)}…` : 'Connected'
    : 'Disconnected';

  const statusColor = ws.connected ? '#22c55e' : ws.reconnecting ? '#f59e0b' : '#ef4444';

  const canSend = ws.connected && !!inputText.trim() && !ws.streaming;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.barBg, borderBottomColor: c.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={[styles.backBtnText, { color: c.text }]}>‹</Text>
        </TouchableOpacity>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: c.badgeText }]} numberOfLines={1}>{statusText}</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={goDiffs} hitSlop={8}>
          <Text style={[styles.headerBtnText, { color: c.badgeText }]}>Diffs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          hitSlop={8}
        >
          <Text style={[styles.headerBtnText, { color: c.badgeText }]}>
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
          keyExtractor={(item) => item.msgId}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => {
            if (ws.messages.length > 0) {
              flatListRef.current?.scrollToOffset({ offset: 999999, animated: false });
            }
          }}
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
            placeholder="Message…"
            placeholderTextColor={c.badgeText}
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={ws.connected && !ws.streaming}
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            {ws.streaming ? (
              <TouchableOpacity
                style={[styles.sendBtn, styles.abortBtn]}
                onPress={ws.abort}
                onPressIn={() =>
                  Animated.spring(sendScale, { toValue: 0.9, useNativeDriver: true, speed: 50, bounciness: 2 }).start()
                }
                onPressOut={() =>
                  Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start()
                }
                activeOpacity={1}
              >
                <Text style={styles.sendBtnText}>■</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: canSend ? c.accent : c.border }]}
                onPress={send}
                onPressIn={() => {
                  if (canSend) Animated.spring(sendScale, { toValue: 0.9, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
                }}
                onPressOut={() =>
                  Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start()
                }
                disabled={!canSend}
                activeOpacity={1}
              >
                <Text style={[styles.sendBtnText, !canSend && styles.sendBtnTextDimmed]}>↑</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 12,
    flex: 1,
    fontFamily: 'ui-monospace',
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
  backBtnText: {
    fontSize: 28,
    lineHeight: 30,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 46,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  abortBtn: {
    backgroundColor: '#ef4444',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  sendBtnTextDimmed: {
    opacity: 0.4,
  },
});
