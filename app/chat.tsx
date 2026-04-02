import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Animated, Keyboard, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useServer } from '@/hooks/use-server';
import { closeSSEStream } from '@/store/connection-store';
import { getSessionLabel, subscribeSessionLabel } from '@/store/session-label-store';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { MessageBubble } from '@/components/MessageBubble';

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

  // Init session once on mount; close SSE stream on unmount so the server
  // buffers remaining events for replay when the user returns to this session.
  useEffect(() => {
    if (!sessionInitialized.current && serverUrl) {
      sessionInitialized.current = true;
      ws.initSession(initialSessionId ?? null, agent ?? null, repoPath ?? null);
    }
    return () => { if (serverUrl) closeSSEStream(serverUrl); };
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

  const canSend = !!inputText.trim() && !ws.streaming;

  const spinRotate = sendRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const [sessionLabel, setSessionLabelState] = useState<string | null>(getSessionLabel);
  useEffect(() => subscribeSessionLabel(setSessionLabelState), []);

  // Header derived values
  const branch = repoPath ? ws.repoDetails.get(repoPath)?.branch : null;
  const sessionTitle = sessionLabel ?? repoName ?? 'Chat';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header with blur */}
      <View style={[styles.headerWrap, { borderBottomColor: c.border }]}>
        <BlurView intensity={80} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.header}>
          {/* Two-column: back btn (left, vertically centered) + meta+title (right) */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
              hitSlop={8}
            >
              <Text style={[styles.backBtnText, { color: c.text }]}>‹</Text>
            </TouchableOpacity>

            <View style={styles.headerMeta}>
              <View style={styles.headerRepoLine}>
                <Text style={[styles.headerRepoText, { color: c.badgeText }]} numberOfLines={1}>
                  {repoName ?? '—'}
                </Text>
                {branch ? (
                  <>
                    <Text style={[styles.headerRepoDot, { color: c.badgeText }]}>{' • '}</Text>
                    <Image
                      source={require('@/assets/images/chat-screens/git-branch.png')}
                      style={[styles.branchIcon, { tintColor: c.badgeText }]}
                    />
                    <Text style={[styles.headerRepoText, { color: c.badgeText }]} numberOfLines={1}>
                      {branch}
                    </Text>
                  </>
                ) : null}
              </View>
              <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>{sessionTitle}</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconBtn} onPress={goDiffs} hitSlop={8}>
                <Image source={require('@/assets/images/diff-logo.png')} style={styles.diffIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>

      {/* Context placeholder bar */}
      <View style={[styles.contextBar, { backgroundColor: c.barBg, borderBottomColor: c.border }]}>
        <Text style={[styles.contextLabel, { color: c.badgeText }]}>Context:  24.5k/128k</Text>
        <View style={styles.contextTrack}>
          <View style={[styles.contextFill, { backgroundColor: '#4ade80' }]} />
        </View>
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

        {/* Input area */}
        <View style={[
          styles.inputArea,
          { backgroundColor: c.barBg, borderColor: c.border },
          Platform.OS === 'ios' && styles.inputAreaShadow,
          Platform.OS === 'ios' && { shadowColor: c.shadow },
        ]}>
          {/* Text input row */}
          <TextInput
            style={[styles.textInput, { color: c.text }]}
            placeholder="Type here"
            placeholderTextColor={c.badgeText}
            value={inputText}
            onChangeText={(t) => { inputTextRef.current = t; setInputText(t); }}
            multiline
            editable={!ws.streaming}
            onSubmitEditing={send}
            blurOnSubmit={false}
          />

          {/* Toolbar row */}
          <View style={styles.toolbar}>
            {/* Attachment stub */}
            <TouchableOpacity style={styles.toolbarBtn} hitSlop={8}>
              <Text style={[styles.toolbarPlusText, { color: c.text }]}>+</Text>
            </TouchableOpacity>

            <View style={styles.toolbarSpacer} />

            {/* Model pill stub */}
            <TouchableOpacity style={[styles.pill, { borderColor: c.border }]} hitSlop={8}>
              <Text style={[styles.pillText, { color: c.text }]}>Sonnet 4.6 <Text style={{ fontSize: 17 }}>▾</Text></Text>
            </TouchableOpacity>

            {/* Build pill stub */}
            <TouchableOpacity style={[styles.pill, { borderColor: c.border }]} hitSlop={8}>
              <Text style={[styles.pillText, { color: c.text }]}>Build ⇅</Text>
            </TouchableOpacity>

            {/* Send / Stop button */}
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
                  style={[styles.sendBtn, { backgroundColor: canSend ? '#088120' : c.border }]}
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  // Header
  headerWrap: {
    borderBottomWidth: 1,
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CECECE',
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backBtnText: {
    fontSize: 22,
    lineHeight: 24,
    marginTop: -2,
  },
  headerMeta: {
    flex: 1,
    gap: 4,
  },
  headerRepoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  headerRepoText: {
    fontSize: 13,
    fontFamily: 'ui-monospace',
  },
  headerRepoDot: {
    fontSize: 13,
    fontFamily: 'ui-monospace',
  },
  branchIcon: {
    width: 13,
    height: 13,
    marginRight: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CECECE',
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // Context bar (static placeholder)
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
    gap: 12,
  },
  contextLabel: {
    fontSize: 12,
    fontFamily: 'ui-monospace',
  },
  contextTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e2e8',
    overflow: 'hidden',
  },
  contextFill: {
    width: '19%',
    height: '100%',
    borderRadius: 2,
  },

  // Messages
  messageList: {
    paddingVertical: 12,
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

  // Input area
  inputArea: {
    borderWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 0,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  inputAreaShadow: {
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  textInput: {
    fontSize: 16,
    minHeight: 36,
    maxHeight: 120,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarPlusText: {
    fontSize: 31,
    fontWeight: '500',
    lineHeight: 36,
  },
  pill: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pillText: {
    fontFamily: 'NationalPark-Medium',
    fontSize: 14,
    letterSpacing: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  toolbarSpacer: {
    flex: 1,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  abortBtn: {
    backgroundColor: '#ef4444',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  sendBtnTextDimmed: {
    opacity: 0.4,
  },
});
