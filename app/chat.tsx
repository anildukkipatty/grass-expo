import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Animated, Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useServer } from '@/hooks/use-server';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { MessageBubble } from '@/components/MessageBubble';
import { ActivityBar } from '@/components/ActivityBar';
import { PermissionModal } from '@/components/PermissionModal';

// TODO: Revisit PulsingDot when connection health indicators are restored
// function PulsingDot({ connected, reconnecting }: { ... }) { ... }

export default function Chat() {
  const router = useRouter();
  const { serverUrl, sessionId: initialSessionId, repoName, repoPath, agent } = useLocalSearchParams<{
    serverUrl: string;
    sessionId?: string;
    repoName?: string;
    repoPath?: string;
    agent?: string;
  }>();
  const [theme, setTheme] = useTheme();
  const [inputText, setInputText] = useState('');
  const inputTextRef = useRef('');
  const flatListRef = useRef<FlatList>(null);
  const sessionInitialized = useRef(false);
  const c = GrassColors[theme];
  const sendScale = useRef(new Animated.Value(1)).current;
  const sendRotation = useRef(new Animated.Value(0)).current;
  const [inputFocused, setInputFocused] = useState(false);
  const prevStreaming = useRef(false);

  const ws = useServer(serverUrl ?? null);

  // Cross-fade send/stop with rotation
  useEffect(() => {
    if (ws.streaming && !prevStreaming.current) {
      Animated.timing(sendRotation, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else if (!ws.streaming && prevStreaming.current) {
      Animated.timing(sendRotation, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
    prevStreaming.current = ws.streaming;
  }, [ws.streaming, sendRotation]);

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      if (ws.messages.length > 0) {
        flatListRef.current?.scrollToOffset({ offset: 999999, animated: true });
      }
    });
    return () => sub.remove();
  }, [ws.messages.length]);

  // Init session once on mount
  useEffect(() => {
    if (!sessionInitialized.current && serverUrl) {
      sessionInitialized.current = true;
      ws.initSession(initialSessionId ?? null, agent ?? null, repoPath ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = useCallback(() => {
    const text = inputTextRef.current.trim();
    if (!text || ws.streaming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(sendScale, { toValue: 1.2, useNativeDriver: true, speed: 50, bounciness: 12 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }),
    ]).start();
    ws.send(text);
    inputTextRef.current = '';
    setInputText('');
    setTimeout(() => setInputText(''), 100);
  }, [ws, sendScale]);

  const goDiffs = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/diffs', params: { serverUrl: serverUrl!, repoPath: repoPath ?? '' } });
  }, [router, serverUrl, repoPath]);

  // Static status text — no connected state
  const statusText = ws.sessionId ? `${ws.sessionId.slice(0, 8)}…` : (repoName || 'Ready');

  const canSend = !!inputText.trim() && !ws.streaming;

  const spinRotate = sendRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header with blur */}
      <View style={[styles.headerWrap, { borderBottomColor: c.border }]}>
        <BlurView intensity={80} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            hitSlop={8}
          >
            <Text style={[styles.backBtnText, { color: c.text }]}>‹</Text>
          </TouchableOpacity>
          {/* Static grey dot — TODO: replace with PulsingDot when connection health is restored */}
          <View style={[styles.statusDot, { backgroundColor: '#9ca3af' }]} />
          <Text style={[styles.statusText, { color: c.badgeText }]} numberOfLines={1}>{statusText}</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={goDiffs} hitSlop={8}>
            <View style={styles.diffsBtnInner}>
              <Text style={[styles.headerBtnText, { color: c.badgeText }]}>Diffs</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setTheme(theme === 'light' ? 'dark' : 'light');
            }}
            hitSlop={8}
          >
            <Text style={[styles.headerBtnText, { color: c.badgeText }]}>
              {theme === 'light' ? '☾' : '☀'}
            </Text>
          </TouchableOpacity>
        </BlurView>
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
                Send a message to get started.
              </Text>
            </View>
          }
        />

        {/* Activity bar */}
        {ws.activity && (
          <ActivityBar label={ws.activity.label} theme={theme} />
        )}

        {/* Input bar */}
        <View style={[
          styles.inputBar,
          { backgroundColor: c.barBg, borderTopColor: c.border },
          Platform.OS === 'ios' && styles.inputBarShadow,
          Platform.OS === 'ios' && { shadowColor: c.shadow },
        ]}>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: c.inputBg, borderColor: inputFocused ? c.accent : c.border, color: c.text },
              inputFocused && { borderWidth: 1.5 },
            ]}
            placeholder="Message…"
            placeholderTextColor={c.badgeText}
            value={inputText}
            onChangeText={(t) => { inputTextRef.current = t; setInputText(t); }}
            multiline
            editable={!ws.streaming}
            onSubmitEditing={send}
            blurOnSubmit={false}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          <Animated.View style={{ transform: [{ scale: sendScale }, { rotate: spinRotate }] }}>
            {ws.streaming ? (
              <TouchableOpacity
                style={[styles.sendBtn, styles.abortBtn]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); ws.abort(); }}
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
  diffsBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  inputBarShadow: {
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
