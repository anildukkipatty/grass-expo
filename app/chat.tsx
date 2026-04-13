import { MessageBubble } from "@/components/MessageBubble";
import { PermissionCard } from "@/components/PermissionCard";
import { AgentTypingskeleton } from "@/components/SkeletonLoader";
import { GrassColors } from "@/constants/theme";
import { posthog } from "@/constants/posthog";
import { useServer } from "@/hooks/use-server";
import modelsJson from "@/models.json";
import {
  closeSSEStream,
  getEntry,
  getPermissions,
  GlobalPermissionItem,
  respondGlobalPermission,
  subscribeToConnection,
  subscribeToPermissions,
} from "@/store/connection-store";
import {
  getSessionLabel,
  setSessionLabel,
  subscribeSessionLabel,
} from "@/store/session-label-store";
import { useTheme } from "@/store/theme-store";
import { upsertThread } from "@/store/thread-store";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MODELS_BY_AGENT: Record<
  string,
  Record<string, string>
> = modelsJson as any;
const DEFAULTS: Record<string, string> = {
  "claude-code": "claude-sonnet-4-6",
  opencode: "opencode/big-pickle",
};

function getModelsForAgent(
  agent: string | undefined,
): { key: string; label: string }[] {
  const agentKey = agent === "opencode" ? "opencode" : "claude-code";
  const map = MODELS_BY_AGENT[agentKey] ?? MODELS_BY_AGENT["claude-code"];
  return Object.entries(map).map(([key, label]) => ({ key, label }));
}

function getDefaultModel(agent: string | undefined): string {
  const agentKey = agent === "opencode" ? "opencode" : "claude-code";
  return DEFAULTS[agentKey] ?? "claude-sonnet-4-6";
}

export default function Chat() {
  const router = useRouter();
  const {
    serverUrl: serverUrlParam,
    sessionId: initialSessionId,
    repoName,
    repoPath,
    agent,
    initialOnboarding,
  } = useLocalSearchParams<{
    serverUrl: string;
    sessionId?: string;
    repoName?: string;
    repoPath?: string;
    agent?: string;
    initialOnboarding?: string;
  }>();

  // Expo Router can return undefined for params on intermediate renders while
  // the route is being hydrated. Pin the first non-null value in a ref so that
  // useServer always receives a stable URL and never reverts to null mid-session.
  const serverUrlRef = useRef<string | null>(null);
  if (serverUrlParam && !serverUrlRef.current) {
    serverUrlRef.current = serverUrlParam;
  }
  const serverUrl = serverUrlRef.current ?? serverUrlParam ?? null;

  const showOnboarding = initialOnboarding === "true";
  const [theme, setTheme] = useTheme();
  const [inputText, setInputText] = useState("");
  const inputTextRef = useRef("");
  const flatListRef = useRef<FlatList>(null);
  const sessionInitialized = useRef(false);
  const hasSent = useRef(false);
  const [hasSentState, setHasSentState] = useState(false);

  const [agentMode, setAgentMode] = useState<"plan" | "build">("build");

  const defaultModel = getDefaultModel(agent);
  const [selectedModelKey, setSelectedModelKey] = useState(defaultModel);
  const modelList = getModelsForAgent(agent);
  const selectedModelLabel =
    modelList.find((m) => m.key === selectedModelKey)?.label ??
    selectedModelKey;
  const modelSheetRef = useRef<BottomSheetModal>(null);
  const modelSnapPoints = ["75%"];
  const renderModelBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );
  const c = GrassColors[theme];
  const sendScale = useRef(new Animated.Value(1)).current;
  const sendRotation = useRef(new Animated.Value(0)).current;
  const prevStreaming = useRef(false);

  const ws = useServer(serverUrl);

  const [sessionLabel, setSessionLabelState] = useState<string | null>(
    getSessionLabel,
  );
  useEffect(() => subscribeSessionLabel(setSessionLabelState), []);

  // Pending permission for this session
  const [pendingPermission, setPendingPermission] =
    useState<GlobalPermissionItem | null>(null);
  useEffect(() => {
    if (!serverUrl) return;
    const update = () => {
      const entry = getEntry(serverUrl);
      const grassId = entry?.currentSessionId ?? null;
      const sdkId = entry?.sessionId ?? null;
      const match =
        grassId || sdkId
          ? (getPermissions(serverUrl).find(
              (p) =>
                (grassId && p.sessionId === grassId) ||
                (sdkId && p.sdkSessionId === sdkId),
            ) ?? null)
          : null;
      setPendingPermission(match);
    };
    update();
    const unsubPerms = subscribeToPermissions(serverUrl, update);
    const unsubConn = subscribeToConnection(serverUrl, update);
    return () => {
      unsubPerms();
      unsubConn();
    };
  }, [serverUrl]);

  // Cross-fade send/stop with rotation
  useEffect(() => {
    if (ws.streaming && !prevStreaming.current) {
      Animated.timing(sendRotation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (!ws.streaming && prevStreaming.current) {
      Animated.timing(sendRotation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    prevStreaming.current = ws.streaming;
  }, [ws.streaming, sendRotation]);

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => {
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
      posthog.capture("chat_session_started", {
        agent: agent ?? "unknown",
        repo_name: repoName ?? "",
        is_new_session: !initialSessionId,
      });
    }
    return () => {
      if (serverUrl) closeSSEStream(serverUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstUserMessage = useRef<string | null>(null);

  const send = useCallback(() => {
    const text = inputTextRef.current.trim();
    if (!text || ws.streaming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(sendScale, {
        toValue: 1.2,
        useNativeDriver: true,
        speed: 50,
        bounciness: 12,
      }),
      Animated.spring(sendScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }),
    ]).start();
    if (!hasSent.current) {
      firstUserMessage.current = text;
      setHasSentState(true);
    }
    hasSent.current = true;
    posthog.capture("chat_message_sent", {
      agent: agent ?? "unknown",
      model: selectedModelKey,
      mode: agentMode,
      repo_name: repoName ?? "",
    });
    ws.send(text, selectedModelKey, agentMode);
    // If returning to an existing thread, update timestamp now.
    // Use sdkSessionId if available, fall back to grassId.
    const threadId = ws.sdkSessionId || ws.grassId;
    if (threadId && serverUrl) {
      upsertThread({
        grassId: threadId,
        sdkSessionId: ws.sdkSessionId ?? undefined,
        title: sessionLabel ?? repoName ?? "Chat",
        repo: repoName ?? "",
        repoPath: repoPath ?? "",
        tool: agent ?? "",
        serverUrl: serverUrl,
        time: new Date().toISOString(),
      });
    }
    inputTextRef.current = "";
    setInputText("");
    setTimeout(() => setInputText(""), 100);
  }, [
    ws,
    sendScale,
    sessionLabel,
    repoName,
    repoPath,
    agent,
    serverUrl,
    selectedModelKey,
    agentMode,
  ]);

  const goDiffs = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    posthog.capture("diffs_viewed", {
      repo_name: repoName ?? "",
    });
    router.push({
      pathname: "/diffs",
      params: { serverUrl: serverUrl!, repoPath: repoPath ?? "" },
    });
  }, [router, serverUrl, repoPath, repoName]);

  const canSend = !!inputText.trim() && !ws.streaming;

  const spinRotate = sendRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  // Save thread to storage once we have the title and all expected IDs.
  //
  // Title: derived from the first user message (truncated to 80 chars).
  // IDs:
  //   - New thread: wait for sdkSessionId from the SSE system event, then use it
  //     as the thread's grassId. This applies to both opencode and claude-code.
  //   - Resumed thread (initialSessionId was passed): the sessionId is already
  //     the SDK session ID, so save immediately once grassId is available.
  const threadSaved = useRef(false);
  const isNewThread = !initialSessionId;

  useEffect(() => {
    if (threadSaved.current) return;
    if (!hasSent.current || !serverUrl) return;
    if (!ws.grassId) return;

    // For new threads, wait for the SDK session ID from the system event
    if (isNewThread && !ws.sdkSessionId) return;

    const userText = firstUserMessage.current;
    if (!userText) return;

    const title = userText.length > 80 ? userText.slice(0, 80) + '...' : userText;

    // Set the label in store so the header reflects it immediately
    if (!sessionLabel) {
      setSessionLabelState(title);
      setSessionLabel(title);
    }

    // For new threads use the SDK session ID; for resumed threads use grassId
    // (which is already the SDK session ID passed via route params).
    const threadId = ws.sdkSessionId || ws.grassId;

    threadSaved.current = true;
    upsertThread({
      grassId: threadId,
      sdkSessionId: ws.sdkSessionId ?? undefined,
      title: sessionLabel ?? title,
      repo: repoName ?? "",
      repoPath: repoPath ?? "",
      tool: agent ?? "",
      serverUrl: serverUrl,
      time: new Date().toISOString(),
    });
  }, [ws.grassId, ws.sdkSessionId, serverUrl, sessionLabel]);

  // Header derived values
  const branch = repoPath ? ws.repoDetails.get(repoPath)?.branch : null;
  const sessionTitle = sessionLabel ?? repoName ?? "Chat";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header with blur */}
      <View style={[styles.headerWrap, { borderBottomColor: c.border }]}>
        <BlurView
          intensity={80}
          tint={theme === "dark" ? "dark" : "light"}
          style={styles.header}
        >
          {/* Two-column: back btn (left, vertically centered) + meta+title (right) */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              hitSlop={8}
            >
              <Text style={[styles.backBtnText, { color: c.text }]}>‹</Text>
            </TouchableOpacity>

            <View style={styles.headerMeta}>
              <View style={styles.headerRepoLine}>
                <Text
                  style={[styles.headerRepoText, { color: c.badgeText }]}
                  numberOfLines={1}
                >
                  {repoName ?? "—"}
                </Text>
                {branch ? (
                  <>
                    <Text
                      style={[styles.headerRepoDot, { color: c.badgeText }]}
                    >
                      {" • "}
                    </Text>
                    <Image
                      source={require("@/assets/images/chat-screens/git-branch.png")}
                      style={[styles.branchIcon, { tintColor: c.badgeText }]}
                    />
                    <Text
                      style={[styles.headerRepoText, { color: c.badgeText }]}
                      numberOfLines={1}
                    >
                      {branch}
                    </Text>
                  </>
                ) : null}
              </View>
              <Text
                style={[styles.headerTitle, { color: c.text }]}
                numberOfLines={1}
              >
                {sessionTitle}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={goDiffs}
                hitSlop={8}
              >
                <Image
                  source={require("@/assets/images/diff-logo.png")}
                  style={styles.diffIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>

      {/* Context placeholder bar */}
      {/* <View style={[styles.contextBar, { backgroundColor: c.barBg, borderBottomColor: c.border }]}>
        <Text style={[styles.contextLabel, { color: c.badgeText }]}>Context:  24.5k/128k</Text>
        <View style={styles.contextTrack}>
          <View style={[styles.contextFill, { backgroundColor: '#4ade80' }]} />
        </View>
      </View> */}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={ws.messages}
          keyExtractor={(item) => item.msgId}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => {
            if (ws.messages.length > 0) {
              flatListRef.current?.scrollToOffset({
                offset: 999999,
                animated: false,
              });
            }
          }}
          ListFooterComponent={
            pendingPermission && serverUrl ? (
              <>
                <PermissionCard
                  item={pendingPermission}
                  theme={theme}
                  onAllow={(updatedInput) =>
                    respondGlobalPermission(
                      serverUrl,
                      pendingPermission.sessionId,
                      pendingPermission.toolUseID,
                      true,
                      updatedInput,
                    )
                  }
                  onDeny={() =>
                    respondGlobalPermission(
                      serverUrl,
                      pendingPermission.sessionId,
                      pendingPermission.toolUseID,
                      false,
                    )
                  }
                />
                {ws.streaming &&
                ws.messages.some((m) => m.role === "assistant") ? (
                  <AgentTypingskeleton theme={theme} />
                ) : null}
              </>
            ) : ws.streaming &&
              ws.messages.some((m) => m.role === "assistant") ? (
              <AgentTypingskeleton theme={theme} />
            ) : null
          }
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
              {showOnboarding && !hasSent.current ? (
                <View
                  style={[
                    styles.onboardingBanner,
                    { backgroundColor: c.accentSoft, borderColor: c.accent },
                  ]}
                >
                  <Text style={[styles.onboardingText, { color: c.accent }]}>
                    {
                      "This is a demo repo to help you get started. 👋\n\nIt's a sample landing page — feel free to ask the agent to change anything.\n\nA good place to experiment! 🚀"
                    }
                  </Text>
                </View>
              ) : (
                <Text style={[styles.emptyChatText, { color: c.badgeText }]}>
                  Send a message to get started.
                </Text>
              )}
            </View>
          }
        />

        {/* First-send status bar */}
        {ws.streaming && !ws.messages.some((m) => m.role === "assistant") && (
          <View
            style={[
              styles.firstSendBar,
              { backgroundColor: c.accentSoft, borderColor: c.accent },
            ]}
          >
            <Text style={[styles.firstSendBarText, { color: c.accent }]}>
              Sending message to the agent…
            </Text>
          </View>
        )}

        {/* Onboarding home nudge — shown after first message is sent */}
        {showOnboarding && hasSentState && (
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/home')}
            style={styles.onboardingNudge}
            activeOpacity={0.7}
          >
            <Text style={[styles.onboardingNudgeText, { color: c.accent }]}>
              Finished exploring? Tap here to go to your home screen →
            </Text>
          </TouchableOpacity>
        )}

        {/* Input area */}
        <View
          style={[
            styles.inputArea,
            { backgroundColor: c.barBg, borderColor: c.border },
            Platform.OS === "ios" && styles.inputAreaShadow,
            Platform.OS === "ios" && { shadowColor: c.shadow },
          ]}
        >
          {/* Text input row */}
          <TextInput
            style={[styles.textInput, { color: c.text }]}
            placeholder="Type here"
            placeholderTextColor={c.badgeText}
            value={inputText}
            onChangeText={(t) => {
              inputTextRef.current = t;
              setInputText(t);
            }}
            multiline
            editable={!ws.streaming}
            onSubmitEditing={send}
            blurOnSubmit={false}
          />

          {/* Toolbar row */}
          <View style={styles.toolbar}>
            {/* Attachment stub */}
            {/* <TouchableOpacity style={styles.toolbarBtn} hitSlop={8}>
              <Text style={[styles.toolbarPlusText, { color: c.text }]}>+</Text>
            </TouchableOpacity> */}

            <View style={styles.toolbarSpacer} />

            {/* Model picker pill */}
            <TouchableOpacity
              style={[styles.pill, { borderColor: c.border }]}
              hitSlop={8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Keyboard.dismiss();
                modelSheetRef.current?.present();
              }}
            >
              <Text style={[styles.pillText, { color: c.text }]}>
                {selectedModelLabel} <Text style={{ fontSize: 17 }}>▾</Text>
              </Text>
            </TouchableOpacity>

            {/* Plan/Build mode toggle pill */}
            <TouchableOpacity
              style={[
                styles.pill,
                { borderColor: agentMode === "plan" ? c.accent : c.border },
              ]}
              hitSlop={8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAgentMode((m) => (m === "build" ? "plan" : "build"));
              }}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: agentMode === "plan" ? c.accent : c.text },
                ]}
              >
                {agentMode === "plan" ? "Plan" : "Build"}
              </Text>
            </TouchableOpacity>

            {/* Send / Stop button */}
            <Animated.View
              style={{
                transform: [{ scale: sendScale }, { rotate: spinRotate }],
              }}
            >
              {ws.streaming ? (
                <TouchableOpacity
                  style={[styles.sendBtn, styles.abortBtn]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    ws.abort();
                  }}
                  onPressIn={() =>
                    Animated.spring(sendScale, {
                      toValue: 0.9,
                      useNativeDriver: true,
                      speed: 50,
                      bounciness: 2,
                    }).start()
                  }
                  onPressOut={() =>
                    Animated.spring(sendScale, {
                      toValue: 1,
                      useNativeDriver: true,
                      speed: 30,
                      bounciness: 6,
                    }).start()
                  }
                  activeOpacity={1}
                >
                  <Text style={styles.sendBtnText}>■</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    { backgroundColor: canSend ? "#088120" : c.border },
                  ]}
                  onPress={send}
                  onPressIn={() => {
                    if (canSend)
                      Animated.spring(sendScale, {
                        toValue: 0.9,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 2,
                      }).start();
                  }}
                  onPressOut={() =>
                    Animated.spring(sendScale, {
                      toValue: 1,
                      useNativeDriver: true,
                      speed: 30,
                      bounciness: 6,
                    }).start()
                  }
                  disabled={!canSend}
                  activeOpacity={1}
                >
                  <Text
                    style={[
                      styles.sendBtnText,
                      !canSend && styles.sendBtnTextDimmed,
                    ]}
                  >
                    ↑
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Model picker bottom sheet */}
      <BottomSheetModal
        ref={modelSheetRef}
        snapPoints={modelSnapPoints}
        enablePanDownToClose
        backdropComponent={renderModelBackdrop}
        backgroundStyle={{ backgroundColor: c.barBg }}
        handleIndicatorStyle={{ backgroundColor: c.badgeText }}
      >
        <Text style={[styles.modelSheetTitle, { color: c.badgeText }]}>
          Select model
        </Text>
        <BottomSheetScrollView contentContainerStyle={styles.modelSheetContent}>
          {modelList.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.modelRow,
                { borderBottomColor: c.border },
                m.key === selectedModelKey && { backgroundColor: c.accentSoft },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedModelKey(m.key);
                modelSheetRef.current?.dismiss();
              }}
            >
              <Text style={[styles.modelRowText, { color: c.text }]}>
                {m.label}
              </Text>
              {m.key === selectedModelKey && (
                <Text style={[styles.modelRowCheck, { color: c.accent }]}>
                  ✓
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </BottomSheetScrollView>
      </BottomSheetModal>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CECECE",
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  headerRepoText: {
    fontSize: 13,
    fontFamily: "ui-monospace",
  },
  headerRepoDot: {
    fontSize: 13,
    fontFamily: "ui-monospace",
  },
  branchIcon: {
    width: 13,
    height: 13,
    marginRight: 3,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CECECE",
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
  },
  diffIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  // Context bar (static placeholder)
  contextBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
    gap: 12,
  },
  contextLabel: {
    fontSize: 12,
    fontFamily: "ui-monospace",
  },
  contextTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e2e8",
    overflow: "hidden",
  },
  contextFill: {
    width: "19%",
    height: "100%",
    borderRadius: 2,
  },

  // First-send status bar
  firstSendBar: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  firstSendBarText: {
    fontSize: 13,
    fontFamily: "ui-monospace",
  },

  // Messages
  messageList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyChatText: {
    fontSize: 15,
  },
  onboardingBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  onboardingText: {
    fontSize: 15,
    textAlign: "center",
  },

  // Onboarding nudge
  onboardingNudge: {
    marginHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  onboardingNudgeText: {
    fontSize: 14,
    fontFamily: 'NationalPark-Medium',
    textDecorationLine: 'underline',
    textAlign: 'center',
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolbarBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarPlusText: {
    fontSize: 31,
    fontWeight: "500",
    lineHeight: 36,
  },
  pill: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pillText: {
    fontFamily: "NationalPark-Medium",
    fontSize: 14,
    letterSpacing: 0,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  toolbarSpacer: {
    flex: 1,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  abortBtn: {
    backgroundColor: "#ef4444",
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  sendBtnTextDimmed: {
    opacity: 0.4,
  },

  // Model picker sheet
  modelSheetContent: {
    paddingBottom: 32,
  },
  modelSheetTitle: {
    fontSize: 13,
    fontFamily: "ui-monospace",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexShrink: 0,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modelRowText: {
    fontSize: 16,
  },
  modelRowCheck: {
    fontSize: 18,
    fontWeight: "700",
  },
});
