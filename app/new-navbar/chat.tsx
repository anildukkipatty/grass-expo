import AddIcon from "@/assets/images/new-design/chat/add.svg";
import BackButtonIcon from "@/assets/images/new-design/chat/back-button.svg";
import BuildIcon from "@/assets/images/new-design/chat/build.svg";
import CameraIcon from "@/assets/images/new-design/chat/camera.svg";
import CopyIcon from "@/assets/images/new-design/chat/copy.svg";
import DiffButtonIcon from "@/assets/images/new-design/chat/diff-button.svg";
import ExplandIcon from "@/assets/images/new-design/chat/expland.svg";
import FilesIcon from "@/assets/images/new-design/chat/files.svg";
import PhotosIcon from "@/assets/images/new-design/chat/photos.svg";
import ReloadIcon from "@/assets/images/new-design/chat/reload.svg";
import SearchIcon from "@/assets/images/new-design/chat/search-icon.svg";
import SelectedIcon from "@/assets/images/new-design/chat/selected.svg";
import ShareIcon from "@/assets/images/new-design/chat/share.svg";
import WriteIcon from "@/assets/images/new-design/chat/write.svg";
import DownArrowIcon from "@/assets/images/new-design/down-arrow.svg";
import ApproveIcon from "@/assets/images/new-design/navbar/approve-icon.svg";
import DenyIcon from "@/assets/images/new-design/navbar/deny-icon.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import UpArrowIcon from "@/assets/images/new-design/up-arrow.svg";
import { AgentTypingskeleton } from "@/components/SkeletonLoader";
import { posthog } from "@/constants/posthog";
import { SFMono, SFPro } from "@/constants/theme";
import { useServer } from "@/hooks/use-server";
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
import { upsertThread } from "@/store/thread-store";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODELS = [
  {
    key: "claude-opus-4-7",
    label: "Claude Opus 4.7",
    subtitle: "Most capable",
  },
  {
    key: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    subtitle: "Fast, Capable",
  },
  {
    key: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    subtitle: "Fastest response",
  },
];

// ─── Sub-components (V2 visual design — do not change styles) ─────────────────

function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.userBubble}>
      <Text style={styles.userText}>{text}</Text>
    </View>
  );
}

function ReadingPill({ path }: { path: string }) {
  return (
    <View style={styles.actionPill}>
      <SearchIcon width={14} height={14} />
      <Text style={styles.actionPillText}>Reading {path}</Text>
    </View>
  );
}

function WritingPill({ path }: { path: string }) {
  return (
    <View style={styles.actionPill}>
      <WriteIcon width={14} height={14} />
      <Text style={styles.actionPillText}>Writing {path}</Text>
    </View>
  );
}

function ToolPill({ label }: { label: string }) {
  return (
    <View style={styles.actionPill}>
      <Text style={styles.actionPillText}>{label}</Text>
    </View>
  );
}

function PermCard({
  permType,
  command,
  onApprove,
  onDeny,
}: {
  permType: string;
  command: string;
  onApprove: () => void;
  onDeny: () => void;
}) {
  return (
    <View style={styles.permCard}>
      <View style={styles.permTopRow}>
        <View style={styles.permBadge}>
          <Text style={styles.permBadgeText}>{permType}</Text>
        </View>
        <Text style={styles.permRequiredText}>Permission required</Text>
        <View style={{ flex: 1 }} />
        <ExplandIcon width={18} height={18} />
      </View>
      <View style={styles.permCommandRow}>
        <View style={styles.permIconBox}>
          <Text style={styles.permCodeIconText}>{`</>`}</Text>
        </View>
        <View style={styles.permCommandTextBox}>
          <Text style={styles.permCommandText} numberOfLines={1}>
            {command}
          </Text>
        </View>
      </View>
      <View style={styles.permActionRow}>
        <TouchableOpacity
          style={styles.denyBtn}
          onPress={onDeny}
          activeOpacity={0.8}
        >
          <DenyIcon width={16} height={16} />
          <Text style={styles.actionBtnText}>Deny</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={onApprove}
          activeOpacity={0.8}
        >
          <ApproveIcon width={16} height={16} />
          <Text style={styles.actionBtnText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ChatActions() {
  return (
    <View style={styles.chatActionsRow}>
      <TouchableOpacity style={styles.chatActionBtn} activeOpacity={0.7}>
        <ShareIcon width={16} height={16} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.chatActionBtn} activeOpacity={0.7}>
        <CopyIcon width={16} height={16} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.chatActionBtn} activeOpacity={0.7}>
        <ReloadIcon width={16} height={16} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function parseInlineMarkdown(text: string, baseStyle: any): React.ReactNode[] {
  const TOKEN_RE =
    /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|~~[^~]+~~)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(
        <Text key={k++} style={baseStyle}>
          {text.slice(last, match.index)}
        </Text>,
      );
    }
    const token = match[1];
    if (token.startsWith("***")) {
      nodes.push(
        <Text
          key={k++}
          style={[baseStyle, { fontFamily: SFPro.bold, fontStyle: "italic" }]}
        >
          {token.slice(3, -3)}
        </Text>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <Text key={k++} style={[baseStyle, { fontFamily: SFPro.bold }]}>
          {token.slice(2, -2)}
        </Text>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(
        <Text key={k++} style={[baseStyle, { fontStyle: "italic" }]}>
          {token.slice(1, -1)}
        </Text>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <Text key={k++} style={styles.mdInlineCode}>
          {token.slice(1, -1)}
        </Text>,
      );
    } else if (token.startsWith("~~")) {
      nodes.push(
        <Text
          key={k++}
          style={[baseStyle, { textDecorationLine: "line-through" }]}
        >
          {token.slice(2, -2)}
        </Text>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push(
      <Text key={k++} style={baseStyle}>
        {text.slice(last)}
      </Text>,
    );
  }

  return nodes.length > 0
    ? nodes
    : [
        <Text key={0} style={baseStyle}>
          {text}
        </Text>,
      ];
}

function MarkdownText({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(
        <View key={key++} style={styles.mdCodeBlock}>
          <Text style={styles.mdCodeBlockText}>{codeLines.join("\n")}</Text>
        </View>,
      );
      i++;
      continue;
    }

    // Headers
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h1 || h2 || h3) {
      const hStyle = h1 ? styles.mdH1 : h2 ? styles.mdH2 : styles.mdH3;
      const hText = (h1 ?? h2 ?? h3)![1];
      blocks.push(
        <Text key={key++} style={hStyle}>
          {parseInlineMarkdown(hText, hStyle)}
        </Text>,
      );
      i++;
      continue;
    }

    // Table
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const isSep = (l: string) => /^\|[\s\-|:]+\|$/.test(l);
      const hasHeader = tableLines.length > 1 && isSep(tableLines[1]);
      const dataRows = tableLines.filter((l) => !isSep(l));
      blocks.push(
        <View key={key++} style={styles.mdTable}>
          {dataRows.map((row, ri) => {
            const cells = row.split("|").slice(1, -1);
            const isHeader = hasHeader && ri === 0;
            return (
              <View
                key={ri}
                style={[
                  styles.mdTableRow,
                  isHeader && styles.mdTableHeaderRow,
                  ri === dataRows.length - 1 && styles.mdTableLastRow,
                ]}
              >
                {cells.map((cell, ci) => {
                  const cellStyle = isHeader
                    ? styles.mdTableHeaderCell
                    : styles.mdTableCell;
                  return (
                    <Text key={ci} style={cellStyle}>
                      {parseInlineMarkdown(cell.trim(), cellStyle)}
                    </Text>
                  );
                })}
              </View>
            );
          })}
        </View>,
      );
      continue;
    }

    // Unordered list
    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+] /, ""));
        i++;
      }
      blocks.push(
        <View key={key++} style={styles.mdList}>
          {items.map((item, li) => (
            <View key={li} style={styles.mdListItem}>
              <Text style={styles.mdBullet}>{"•"}</Text>
              <Text style={[styles.agentText, styles.mdListItemText]}>
                {parseInlineMarkdown(item, styles.agentText)}
              </Text>
            </View>
          ))}
        </View>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: { n: string; t: string }[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const m = lines[i].match(/^(\d+)\. (.*)/);
        if (m) items.push({ n: m[1], t: m[2] });
        i++;
      }
      blocks.push(
        <View key={key++} style={styles.mdList}>
          {items.map((item, li) => (
            <View key={li} style={styles.mdListItem}>
              <Text style={styles.mdNumber}>
                {item.n}
                {"."}
              </Text>
              <Text style={[styles.agentText, styles.mdListItemText]}>
                {parseInlineMarkdown(item.t, styles.agentText)}
              </Text>
            </View>
          ))}
        </View>,
      );
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push(<View key={key++} style={styles.mdHr} />);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    blocks.push(
      <Text key={key++} style={styles.agentText}>
        {parseInlineMarkdown(line, styles.agentText)}
      </Text>,
    );
    i++;
  }

  return <View style={styles.mdBlock}>{blocks}</View>;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const {
    serverUrl: serverUrlParam,
    sessionId: initialSessionId,
    repoName,
    repoPath,
    agent,
    initialMessage,
  } = useLocalSearchParams<{
    serverUrl: string;
    sessionId?: string;
    repoName?: string;
    repoPath?: string;
    agent?: string;
    initialMessage?: string;
  }>();

  // Pin the first non-null serverUrl so it never reverts mid-session
  const serverUrlRef = useRef<string | null>(null);
  if (serverUrlParam && !serverUrlRef.current)
    serverUrlRef.current = serverUrlParam;
  const serverUrl = serverUrlRef.current ?? serverUrlParam ?? null;

  const repoNameStr = Array.isArray(repoName) ? repoName[0] : (repoName ?? "");
  const repoPathStr = Array.isArray(repoPath) ? repoPath[0] : (repoPath ?? "");
  const agentStr = Array.isArray(agent) ? agent[0] : (agent ?? "claude-code");

  // ── Local state ──
  const [inputText, setInputText] = useState("");
  const inputTextRef = useRef("");
  const [agentMode, setAgentMode] = useState<"build" | "plan">("build");
  const [selectedModelKey, setSelectedModelKey] = useState("claude-sonnet-4-6");
  const [tempModelKey, setTempModelKey] = useState("claude-sonnet-4-6");
  const [showOptions, setShowOptions] = useState(false);
  const [addBtnMeasure, setAddBtnMeasure] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [inputContainerHeight, setInputContainerHeight] = useState(0);
  const [pendingPermission, setPendingPermission] =
    useState<GlobalPermissionItem | null>(null);
  const [sessionLabel, setSessionLabelState] = useState<string | null>(
    initialSessionId ? getSessionLabel() : null,
  );

  // ── Refs ──
  const hasSent = useRef(false);
  const firstUserMessage = useRef<string | null>(null);
  const threadSaved = useRef(false);
  const sessionInitialized = useRef(false);
  const initialMessageSent = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const modelSheetRef = useRef<BottomSheetModal>(null);
  const addBtnRef = useRef<any>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const ws = useServer(serverUrl);

  // ── Session label subscription ──
  useEffect(() => subscribeSessionLabel(setSessionLabelState), []);

  // ── Init session on mount; close SSE on unmount ──
  useEffect(() => {
    if (!sessionInitialized.current && serverUrl) {
      sessionInitialized.current = true;
      ws.initSession(initialSessionId ?? null, agentStr, repoPathStr || null);
      posthog.capture("chat_session_started", {
        agent: agentStr,
        repo_name: repoNameStr,
        is_new_session: !initialSessionId,
      });
    }
    return () => {
      if (serverUrl) closeSSEStream(serverUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Permission subscription ──
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

  // ── Save thread after first send ──
  useEffect(() => {
    if (threadSaved.current) return;
    if (!hasSent.current || !serverUrl || !ws.grassId) return;
    if (!initialSessionId && !ws.sdkSessionId) return;
    const userText = firstUserMessage.current;
    if (!userText) return;
    const title =
      userText.length > 80 ? userText.slice(0, 80) + "..." : userText;
    if (!sessionLabel) {
      setSessionLabelState(title);
      setSessionLabel(title);
    }
    const threadId = ws.sdkSessionId || ws.grassId;
    threadSaved.current = true;
    upsertThread({
      grassId: threadId,
      sdkSessionId: ws.sdkSessionId ?? undefined,
      title: sessionLabel ?? title,
      repo: repoNameStr,
      repoPath: repoPathStr,
      tool: agentStr,
      serverUrl: serverUrl,
      time: new Date().toISOString(),
    });
  }, [ws.grassId, ws.sdkSessionId, serverUrl, sessionLabel]);

  // ── Auto-scroll to bottom on new messages ──
  useEffect(() => {
    if (ws.messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }
  }, [ws.messages.length, ws.streaming]);

  // ── Auto-send initialMessage once session grassId is ready ──
  useEffect(() => {
    if (
      initialMessageSent.current ||
      !initialMessage ||
      !ws.grassId ||
      ws.streaming
    )
      return;
    const text = Array.isArray(initialMessage)
      ? initialMessage[0]
      : initialMessage;
    if (!text) return;
    initialMessageSent.current = true;
    if (!hasSent.current) firstUserMessage.current = text;
    hasSent.current = true;
    ws.send(text, selectedModelKey, agentMode, ws.permissionMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.grassId]);

  // ── Derived values ──
  const branch = repoPathStr ? ws.repoDetails.get(repoPathStr)?.branch : null;
  const headerTitle = sessionLabel ?? repoNameStr ?? "New Chat";
  const canSend = !!inputText.trim() && !ws.streaming;

  const selectedModel =
    MODELS.find((m) => m.key === selectedModelKey) ?? MODELS[1];

  // ── Send ──
  const handleSubmit = () => {
    const text = inputTextRef.current.trim();
    if (!text || ws.streaming) return;
    Keyboard.dismiss();
    if (!hasSent.current) firstUserMessage.current = text;
    hasSent.current = true;
    posthog.capture("chat_message_sent", {
      agent: agentStr,
      model: selectedModelKey,
      mode: agentMode,
      repo_name: repoNameStr,
    });
    ws.send(text, selectedModelKey, agentMode, ws.permissionMode);
    // Keep thread timestamp fresh on each send
    const threadId = ws.sdkSessionId || ws.grassId;
    if (threadId && serverUrl) {
      upsertThread({
        grassId: threadId,
        sdkSessionId: ws.sdkSessionId ?? undefined,
        title: sessionLabel ?? repoNameStr ?? "Chat",
        repo: repoNameStr,
        repoPath: repoPathStr,
        tool: agentStr,
        serverUrl: serverUrl,
        time: new Date().toISOString(),
      });
    }
    inputTextRef.current = "";
    setInputText("");
  };

  // ── Model sheet ──
  const openModelSheet = () => {
    setTempModelKey(selectedModelKey);
    Keyboard.dismiss();
    modelSheetRef.current?.present();
  };

  const confirmModel = () => {
    setSelectedModelKey(tempModelKey);
    modelSheetRef.current?.dismiss();
  };

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

  // ── Options popup ──
  const openOptions = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      addBtnRef.current?.measureInWindow(
        (x: number, y: number, w: number, h: number) => {
          setAddBtnMeasure({ x, y, w, h });
          setShowOptions(true);
        },
      );
    }, 50);
  };

  const closeOptions = () => {
    setShowOptions(false);
    setAddBtnMeasure(null);
  };

  const handleCameraPress = async () => {
    closeOptions();
    if (cameraPermission?.granted) {
      Alert.alert("Camera", "Camera will open here.");
      return;
    }
    const result = await requestCameraPermission();
    if (result.granted) {
      Alert.alert("Camera", "Camera will open here.");
    } else if (!result.canAskAgain) {
      Alert.alert(
        "Camera Permission Required",
        "Please enable camera access in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => Linking.openURL("app-settings:"),
          },
        ],
      );
    }
  };

  const handlePhotosPress = () => {
    closeOptions();
    Alert.alert("Photos", "Photo library will open here.");
  };

  const handleFilesPress = () => {
    closeOptions();
    Alert.alert("Files", "File picker will open here.");
  };

  // ── Message rendering ──
  function renderMessages() {
    return ws.messages.map((msg) => {
      if (msg.role === "user") {
        return <UserBubble key={msg.msgId} text={msg.content} />;
      }

      if (msg.role === "tool") {
        const label = msg.badge ?? msg.content.substring(0, 60);
        const isRead = /read|search|view|cat|ls|get/i.test(label);
        const isWrite = /write|edit|create|patch|insert|update/i.test(label);
        if (isRead) return <ReadingPill key={msg.msgId} path={label} />;
        if (isWrite) return <WritingPill key={msg.msgId} path={label} />;
        return <ToolPill key={msg.msgId} label={label} />;
      }

      if (msg.role === "assistant") {
        return (
          <View key={msg.msgId} style={styles.agentBlock}>
            <MarkdownText content={msg.content} />
          </View>
        );
      }

      if (msg.role === "error") {
        return (
          <View key={msg.msgId} style={styles.agentBlock}>
            <Text style={[styles.agentText, { color: "#B20000" }]}>
              {msg.content}
            </Text>
          </View>
        );
      }

      return null;
    });
  }

  // ── Permission card data ──
  function getPermissionCommand(item: GlobalPermissionItem): string {
    const input = item.input as Record<string, unknown>;
    const val =
      input.command ??
      input.path ??
      input.file_path ??
      input.url ??
      Object.values(input)[0];
    return String(val ?? "");
  }

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <BackButtonIcon width={40} height={40} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.repoName} numberOfLines={1}>
            {headerTitle}
          </Text>
          <View style={styles.branchRow}>
            {branch ? (
              <Text style={styles.branchName}>
                {repoNameStr} · <GitBranchIcon width={13} height={13} />{" "}
                {branch}
              </Text>
            ) : (
              <Text style={styles.branchName}>{repoNameStr}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: "/new-navbar/diffs" as any,
              params: { serverUrl: serverUrl ?? "", repoPath: repoPathStr },
            })
          }
        >
          <DiffButtonIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      {/* ── Messages + Input ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Chat area */}
        <View style={styles.chatArea}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.flex}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: false })
            }
          >
            {/* Session loading (resumed session history) */}
            {ws.sessionLoading && (
              <View style={styles.centeredRow}>
                <ActivityIndicator size="small" color="#808080" />
              </View>
            )}

            {/* Empty state */}
            {ws.messages.length === 0 && !ws.sessionLoading && (
              <View style={styles.centeredRow}>
                <Text style={[styles.agentText, { color: "#808080" }]}>
                  Send a message to get started.
                </Text>
              </View>
            )}

            {renderMessages()}

            {/* Permission card */}
            {pendingPermission && serverUrl && (
              <PermCard
                permType={pendingPermission.toolName.toUpperCase()}
                command={getPermissionCommand(pendingPermission)}
                onApprove={() =>
                  respondGlobalPermission(
                    serverUrl,
                    pendingPermission.sessionId,
                    pendingPermission.toolUseID,
                    true,
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
            )}

            {/* Typing indicator */}
            {ws.streaming &&
              ws.messages.some((m) => m.role === "assistant") && (
                <AgentTypingskeleton theme="light" />
              )}

            {/* Chat actions shown after session has messages and is idle */}
            {ws.messages.length > 0 && !ws.streaming && <ChatActions />}
          </ScrollView>
        </View>

        {/* ── Bottom input area ── */}
        <View
          style={[styles.inputContainer, { paddingBottom: bottom + 8 }]}
          onLayout={(e) => setInputContainerHeight(e.nativeEvent.layout.height)}
        >
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={(t) => {
              inputTextRef.current = t;
              setInputText(t);
            }}
            placeholder="Type here"
            placeholderTextColor="#000"
            multiline
            editable={!ws.streaming}
            onSubmitEditing={handleSubmit}
            blurOnSubmit={false}
          />
          <View style={styles.toolbarRow}>
            <TouchableOpacity
              ref={addBtnRef}
              style={styles.addBtn}
              activeOpacity={0.7}
              onPress={openOptions}
            >
              <AddIcon width={18} height={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modelDropdown}
              activeOpacity={0.7}
              onPress={openModelSheet}
            >
              <Text style={styles.dropdownText}>{selectedModel.label}</Text>
              <DownArrowIcon width={14} height={14} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buildBtn}
              activeOpacity={0.7}
              onPress={() =>
                setAgentMode((m) => (m === "build" ? "plan" : "build"))
              }
            >
              <Text style={styles.buildText}>
                {agentMode === "build" ? "Build" : "Plan"}
              </Text>
              <BuildIcon width={16} height={16} />
            </TouchableOpacity>

            <View style={styles.toolbarSpacer} />

            {ws.streaming ? (
              <TouchableOpacity
                style={styles.submitBtn}
                activeOpacity={0.8}
                onPress={() => ws.abort()}
              >
                <Text style={styles.stopBtnText}>■</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.submitBtn, !canSend && styles.submitBtnDisabled]}
                activeOpacity={0.8}
                onPress={handleSubmit}
                disabled={!canSend}
              >
                <UpArrowIcon width={20} height={20} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Options overlay ── */}
      {showOptions && addBtnMeasure && (
        <>
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={10}
            tint="light"
            pointerEvents="none"
          />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeOptions}
          />
          <View
            style={[
              styles.optionsPanel,
              {
                position: "absolute",
                left: 16,
                bottom: inputContainerHeight + 12,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={handleCameraPress}
            >
              <View style={styles.optionIconBg}>
                <CameraIcon width={22} height={22} />
              </View>
              <Text style={styles.optionLabel}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={handlePhotosPress}
            >
              <View style={styles.optionIconBg}>
                <PhotosIcon width={22} height={22} />
              </View>
              <Text style={styles.optionLabel}>Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={handleFilesPress}
            >
              <View style={styles.optionIconBg}>
                <FilesIcon width={22} height={22} />
              </View>
              <Text style={styles.optionLabel}>Files</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.addBtn,
              {
                position: "absolute",
                left: addBtnMeasure.x,
                top: addBtnMeasure.y,
              },
            ]}
            activeOpacity={0.7}
            onPress={closeOptions}
          >
            <CloseIcon width={36} height={36} />
          </TouchableOpacity>
        </>
      )}

      {/* ── Model picker bottom sheet ── */}
      <BottomSheetModal
        ref={modelSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderModelBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleComponent={() => (
          <View style={styles.sheetHandleContainer}>
            <View style={styles.sheetDragger} />
          </View>
        )}
      >
        <BottomSheetView>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select model</Text>
            <TouchableOpacity
              style={styles.sheetCloseBtn}
              activeOpacity={0.7}
              onPress={() => modelSheetRef.current?.dismiss()}
            >
              <CloseIcon width={36} height={36} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetModelList}>
            {MODELS.map((m, index) => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.modelRow,
                  tempModelKey === m.key && styles.modelRowSelected,
                  index < MODELS.length - 1 && styles.modelRowSeparator,
                ]}
                activeOpacity={0.7}
                onPress={() => setTempModelKey(m.key)}
              >
                <View style={styles.modelInfo}>
                  <Text style={styles.modelLabel}>{m.label}</Text>
                  <Text style={styles.modelSubtitle}>{m.subtitle}</Text>
                </View>
                {tempModelKey === m.key && (
                  <SelectedIcon width={16} height={16} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sheetFooter}>
            <TouchableOpacity
              style={styles.confirmBtn}
              activeOpacity={0.85}
              onPress={confirmModel}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

// ─── Styles (V2 design — unchanged) ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },

  centeredRow: {
    alignItems: "center",
    paddingVertical: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    marginRight: 25,
    marginLeft: 25,
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  repoName: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  branchName: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#808080",
    letterSpacing: -0.3,
    lineHeight: 18,
  },

  // Chat area
  chatArea: {
    flex: 1,
    position: "relative",
  },

  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 15,
  },

  // User bubble
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 20,
    borderWidth: 1,
    borderColor: "#8CBB67",
    backgroundColor: "#DCF8C6",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userText: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
    letterSpacing: -0.5,
  },

  // Reading / Writing pills
  actionPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 17,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionPillText: {
    fontFamily: SFMono.semiBold,
    fontSize: 15,
    color: "#929292",
  },

  // Agent text block
  agentBlock: {
    alignSelf: "stretch",
    gap: 4,
  },
  agentText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
    letterSpacing: -0.5,
  },

  // Permission card
  permCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  permTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  permBadge: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#B20000",
    backgroundColor: "#FFCCCC",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  permBadgeText: {
    fontFamily: SFPro.semiBold,
    fontSize: 11,
    color: "#B20000",
    letterSpacing: 0.5,
  },
  permRequiredText: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#808080",
  },
  permCommandRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  permIconBox: {
    width: 40,
    height: 40,
    borderRightWidth: 1,
    borderRightColor: "#E1E1E1",
    backgroundColor: "#DFDFDF",
    alignItems: "center",
    justifyContent: "center",
  },
  permCodeIconText: {
    fontFamily: SFMono.semiBold,
    fontSize: 13,
    color: "#404040",
  },
  permCommandTextBox: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
    height: 40,
  },
  permCommandText: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: "#333",
    letterSpacing: -0.2,
  },
  permActionRow: { flexDirection: "row", gap: 10 },
  denyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#841E1E",
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#3D841E",
  },
  actionBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFF",
  },

  // Chat actions row
  chatActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  chatActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Options popup
  optionsPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFF",
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
    width: 150,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  optionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.5,
    lineHeight: 22,
  },

  // Bottom input container
  inputContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#DFDFDF",
    backgroundColor: "rgba(249, 249, 249, 0.20)",
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  textInput: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#1A1A1A",
    padding: 0,
    maxHeight: 100,
    minHeight: 24,
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolbarSpacer: { flex: 1 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 20,
    borderColor: "#FFF",
    backgroundColor: "rgba(0, 0, 0, 0.00)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modelDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "rgba(255, 255, 255, 0.50)",
  },
  dropdownText: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
  buildBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "rgba(255, 255, 255, 0.50)",
  },
  buildText: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
  submitBtn: {
    width: 40,
    height: 40,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  stopBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Model bottom sheet
  sheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHandleContainer: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  sheetDragger: {
    width: 63,
    height: 8,
    borderRadius: 70,
    backgroundColor: "#E0E0E0",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 20,
    color: "#000",
    letterSpacing: -0.5,
    lineHeight: 25,
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetModelList: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    overflow: "hidden",
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FFF",
  },
  modelRowSelected: {
    backgroundColor: "#F2F2F2",
  },
  modelRowSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
  },
  modelInfo: {
    flex: 1,
    gap: 2,
  },
  modelLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  modelSubtitle: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "rgba(0,0,0,0.5)",
    letterSpacing: -0.5,
    lineHeight: 20,
  },
  sheetFooter: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  confirmBtn: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFF",
    letterSpacing: -0.3,
  },

  // Markdown
  mdBlock: {
    gap: 6,
    alignSelf: "stretch",
  },
  mdH1: {
    fontFamily: SFPro.bold,
    fontSize: 22,
    color: "#000",
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  mdH2: {
    fontFamily: SFPro.bold,
    fontSize: 19,
    color: "#000",
    lineHeight: 25,
    letterSpacing: -0.5,
  },
  mdH3: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  mdInlineCode: {
    fontFamily: SFMono.semiBold,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#F0F0F0",
  },
  mdCodeBlock: {
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    padding: 12,
  },
  mdCodeBlockText: {
    fontFamily: SFMono.semiBold,
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
  },
  mdTable: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    overflow: "hidden",
  },
  mdTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
  },
  mdTableLastRow: {
    borderBottomWidth: 0,
  },
  mdTableHeaderRow: {
    backgroundColor: "#F2F2F2",
  },
  mdTableCell: {
    flex: 1,
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#000",
    padding: 8,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  mdTableHeaderCell: {
    flex: 1,
    fontFamily: SFPro.bold,
    fontSize: 15,
    color: "#000",
    padding: 8,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  mdList: {
    gap: 4,
  },
  mdListItem: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  mdListItemText: {
    flex: 1,
  },
  mdBullet: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
    width: 14,
  },
  mdNumber: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
    minWidth: 24,
  },
  mdHr: {
    height: 1,
    backgroundColor: "#DFDFDF",
    marginVertical: 4,
  },
});
