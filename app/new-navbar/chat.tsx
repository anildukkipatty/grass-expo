// import AddIcon from "@/assets/images/new-design/chat/add.svg";
import BackButtonIcon from "@/assets/images/new-design/chat/back-button.svg";
import CameraIcon from "@/assets/images/new-design/chat/camera.svg";
import CopyIcon from "@/assets/images/new-design/chat/copy.svg";
import DiffButtonIcon from "@/assets/images/new-design/chat/diff-button.svg";
import ExplandIcon from "@/assets/images/new-design/chat/expland.svg";
import FilesIcon from "@/assets/images/new-design/chat/files.svg";
import PhotosIcon from "@/assets/images/new-design/chat/photos.svg";
import SearchIcon from "@/assets/images/new-design/chat/search-icon.svg";
import SelectedIcon from "@/assets/images/new-design/chat/selected.svg";
import ShareIcon from "@/assets/images/new-design/chat/share.svg";
import WriteIcon from "@/assets/images/new-design/chat/write.svg";
import ApproveIcon from "@/assets/images/new-design/navbar/approve-icon.svg";
import DenyIcon from "@/assets/images/new-design/navbar/deny-icon.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import UpArrowIcon from "@/assets/images/new-design/up-arrow.svg";
import { SFMono, SFPro } from "@/constants/theme";
import {
  getToolCallIcon,
  parseToolNameFromToolMessage,
} from "@/constants/tool-call-icons";
import modelsJson from "@/models.json";
import { AgentTypingskeleton } from "@/components/SkeletonLoader";
import { SyntaxBlock } from "@/components/SyntaxBlock";
import { useServer } from "@/hooks/use-server";
import type { PermissionMode } from "@/hooks/use-server";
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
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { useCameraPermissions } from "expo-camera";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { uploadImage } from "@/api/upload";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Model helpers ────────────────────────────────────────────────────────────

const MODELS_BY_AGENT = modelsJson as Record<string, Record<string, string>>;
const MODEL_DEFAULTS: Record<string, string> = {
  "claude-code": "claude-sonnet-4-6",
  opencode: "opencode/big-pickle",
  codex: "gpt-5.5",
};

function resolveAgentKey(agent: string): string {
  if (agent === "opencode") return "opencode";
  if (agent === "codex") return "codex";
  return "claude-code";
}

function getModelsForAgent(agent: string): { key: string; label: string }[] {
  const agentKey = resolveAgentKey(agent);
  const map = MODELS_BY_AGENT[agentKey] ?? MODELS_BY_AGENT["claude-code"];
  return Object.entries(map).map(([key, label]) => ({ key, label }));
}

function getDefaultModel(agent: string): string {
  const agentKey = resolveAgentKey(agent);
  return MODEL_DEFAULTS[agentKey] ?? "claude-sonnet-4-6";
}

// ─── Sub-components (V2 visual design — do not change styles) ─────────────────

function UserBubble({ text, attachments }: { text: string; attachments?: string[] }) {
  return (
    <View style={styles.userBubbleWrapper}>
      {attachments && attachments.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bubbleThumbnailStrip}>
          {attachments.map((url, i) => (
            <Image key={url + i} source={{ uri: url }} style={styles.bubbleThumbnail} />
          ))}
        </ScrollView>
      )}
      {text.length > 0 && (
        <View style={styles.userBubble}>
          <Text style={styles.userText} selectable>{text}</Text>
        </View>
      )}
    </View>
  );
}

function ToolCallPill({
  label,
  icon,
}: {
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.actionPill}>
      {icon}
      <Text style={styles.actionPillText} numberOfLines={1} selectable>
        {label}
      </Text>
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

function ChatActions({
  onShare,
  onCopy,
}: {
  onShare: () => void;
  onCopy: () => void;
}) {
  return (
    <View style={styles.chatActionsRow}>
      <TouchableOpacity
        style={styles.chatActionBtn}
        activeOpacity={0.7}
        onPress={onShare}
      >
        <ShareIcon width={16} height={16} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.chatActionBtn}
        activeOpacity={0.7}
        onPress={onCopy}
      >
        <CopyIcon width={16} height={16} />
      </TouchableOpacity>
      {/* <TouchableOpacity style={styles.chatActionBtn} activeOpacity={0.7}>
        <ReloadIcon width={16} height={16} />
      </TouchableOpacity> */}
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
      const language = line
        .slice(3)
        .trim()
        .split(/\s+/)[0] || "tsx";
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(
        <SyntaxBlock
          key={key++}
          code={codeLines.join("\n")}
          language={language}
          theme="light"
        />,
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
        <Text key={key++} style={hStyle} selectable>
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
                    <Text key={ci} style={cellStyle} selectable>
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
              <Text style={[styles.agentText, styles.mdListItemText]} selectable>
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
              <Text style={[styles.agentText, styles.mdListItemText]} selectable>
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
      <Text key={key++} style={styles.agentText} selectable>
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
  const navigation = useNavigation();
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
  const modelList = getModelsForAgent(agentStr);
  const [selectedModelKey, setSelectedModelKey] = useState(() => getDefaultModel(agentStr));
  const [tempModelKey, setTempModelKey] = useState(() => getDefaultModel(agentStr));
  const [showOptions, setShowOptions] = useState(false);
  type PendingImage = { uri: string; uploadedUrl?: string; error?: boolean };
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [addBtnMeasure, setAddBtnMeasure] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [inputContainerHeight, setInputContainerHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [pendingPermission, setPendingPermission] =
    useState<GlobalPermissionItem | null>(null);
  const [sessionLabel, setSessionLabelState] = useState<string | null>(
    initialSessionId ? getSessionLabel() : null,
  );
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [firstSendOverlayStatus, setFirstSendOverlayStatus] = useState<
    "idle" | "waiting" | "failed"
  >("idle");
  const copyToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const firstSendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const allowOverlayExitRef = useRef(false);

  // ── Refs ──
  const hasSent              = useRef(false);
  const firstUserMessage     = useRef<string | null>(null);
  const addBtnRef            = useRef<View>(null);
  const threadSaved          = useRef(false);
  const sessionInitialized   = useRef(false);
  const initialMessageSent   = useRef(false);
  const scrollViewRef        = useRef<ScrollView>(null);
  const modelSheetRef        = useRef<BottomSheetModal>(null);
  const modeSheetRef         = useRef<BottomSheetModal>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const ws = useServer(serverUrl);
  const isFirstSendOverlayVisible =
    firstSendOverlayStatus === "waiting" || firstSendOverlayStatus === "failed";

  // ── Session label subscription ──
  useEffect(() => subscribeSessionLabel(setSessionLabelState), []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    return () => {
      if (copyToastTimeoutRef.current) clearTimeout(copyToastTimeoutRef.current);
      if (firstSendTimeoutRef.current) clearTimeout(firstSendTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (firstSendOverlayStatus !== "waiting") {
      if (firstSendTimeoutRef.current) {
        clearTimeout(firstSendTimeoutRef.current);
        firstSendTimeoutRef.current = null;
      }
      return;
    }

    firstSendTimeoutRef.current = setTimeout(() => {
      setFirstSendOverlayStatus((prev) =>
        prev === "waiting" ? "failed" : prev,
      );
    }, 15000);

    return () => {
      if (firstSendTimeoutRef.current) {
        clearTimeout(firstSendTimeoutRef.current);
        firstSendTimeoutRef.current = null;
      }
    };
  }, [firstSendOverlayStatus]);

  useEffect(() => {
    if (!isFirstSendOverlayVisible) return;
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (allowOverlayExitRef.current) return;
      e.preventDefault();
    });
    return unsub;
  }, [navigation, isFirstSendOverlayVisible]);

  // ── Init session on mount; close SSE on unmount ──
  useEffect(() => {
    if (!sessionInitialized.current && serverUrl) {
      sessionInitialized.current = true;
      ws.initSession(initialSessionId ?? null, agentStr, repoPathStr || null);
    }
    return () => {
      if (serverUrl) closeSSEStream(serverUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Restore model + mode from server when resuming a session ──
  const sessionConfigFetched = useRef(false);
  useEffect(() => {
    if (!initialSessionId || !serverUrl || sessionConfigFetched.current) return;
    sessionConfigFetched.current = true;
    ws.getSessionConfig(initialSessionId).then((config) => {
      if (!config) return;
      const model = config.model ?? getDefaultModel(agentStr);
      setSelectedModelKey(model);
      setTempModelKey(model);
      setAgentMode(config.mode ?? "build");
    });
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
    setFirstSendOverlayStatus("idle");
    upsertThread({
      grassId: initialSessionId || threadId,
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
    if (!hasSent.current) {
      firstUserMessage.current = text;
      startFirstSendOverlayIfNeeded();
    }
    hasSent.current = true;
    ws.send(text, selectedModelKey, agentMode, ws.permissionMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.grassId]);

  // ── Derived values ──
  const branch = repoPathStr ? ws.repoDetails.get(repoPathStr)?.branch : null;
  const headerTitle = sessionLabel ?? repoNameStr ?? "New Chat";
  const readyUrls = pendingImages.filter(img => img.uploadedUrl).map(img => img.uploadedUrl!);
  const canSend = !ws.streaming && !uploading && (inputText.trim().length > 0 || readyUrls.length > 0);

  const selectedModel = modelList.find((m) => m.key === selectedModelKey) ?? modelList[0];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setShowScrollToBottom(distanceFromBottom > 80);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
  };

  const startFirstSendOverlayIfNeeded = () => {
    if (initialSessionId) return;
    if (threadSaved.current) return;
    setFirstSendOverlayStatus("waiting");
  };

  const handleCancelFirstSend = () => {
    if (firstSendTimeoutRef.current) {
      clearTimeout(firstSendTimeoutRef.current);
      firstSendTimeoutRef.current = null;
    }
    setFirstSendOverlayStatus("idle");
    allowOverlayExitRef.current = true;
    ws.abort();
    router.replace("/new-navbar/(tabs)" as any);
  };

  // ── Send ──
  const handleSubmit = () => {
    const text = inputTextRef.current.trim();
    const attachments = pendingImages.filter(img => img.uploadedUrl).map(img => img.uploadedUrl!);
    if ((!text && attachments.length === 0) || ws.streaming || uploading) return;
    Keyboard.dismiss();
    if (!hasSent.current) {
      firstUserMessage.current = text;
      startFirstSendOverlayIfNeeded();
    }
    hasSent.current = true;
    ws.send(text, selectedModelKey, agentMode, ws.permissionMode, attachments.length > 0 ? attachments : undefined);
    setPendingImages([]);
    // Keep thread timestamp fresh on each send
    const threadId = ws.sdkSessionId || ws.grassId;
    if (threadId && serverUrl) {
      upsertThread({
        grassId: initialSessionId || threadId,
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

  const getLastAssistantMessage = () =>
    [...ws.messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.content.trim().length > 0) ?? null;

  const handleShareChat = async () => {
    const lastAssistantMessage = getLastAssistantMessage();

    if (!lastAssistantMessage) {
      Alert.alert("Nothing to share", "No AI response yet.");
      return;
    }

    try {
      await Share.share({
        title: headerTitle,
        message: lastAssistantMessage.content,
      });
    } catch (error) {
      console.error("Failed to share chat", error);
    }
  };

  const showCopiedToastWithTimeout = () => {
    if (copyToastTimeoutRef.current) clearTimeout(copyToastTimeoutRef.current);
    setShowCopiedToast(true);
    copyToastTimeoutRef.current = setTimeout(() => {
      setShowCopiedToast(false);
    }, 1800);
  };

  const handleCopyLastMessage = () => {
    const lastAssistantMessage = getLastAssistantMessage();
    if (!lastAssistantMessage) {
      Alert.alert("Nothing to copy", "No AI response yet.");
      return;
    }

    Clipboard.setString(lastAssistantMessage.content);
    showCopiedToastWithTimeout();
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

  const renderModeBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  // ── Options popup ──
  const closeOptions = () => {
    setShowOptions(false);
    setAddBtnMeasure(null);
  };

  const openOptions = () => {
    addBtnRef.current?.measure((_x, _y, w, h, px, py) => {
      setAddBtnMeasure({ x: px, y: py, w, h });
      setShowOptions(true);
    });
  };

  const MAX_IMAGES = 5;

  const handleCameraPress = async () => {
    closeOptions();

    if (!cameraPermission?.granted) {
      const perm = await requestCameraPermission();
      if (!perm.granted) {
        if (!perm.canAskAgain) {
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
        return;
      }
    }

    const remaining = MAX_IMAGES - pendingImages.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `You can attach up to ${MAX_IMAGES} images per message.`);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    const newItem: PendingImage = { uri: asset.uri };
    setPendingImages(prev => [...prev, newItem]);
    setUploading(true);

    const url = await uploadImage(asset.uri, asset.mimeType, asset.fileName).catch((err) => {
      console.log('[upload] failed for', asset.uri.slice(-40), ':', err?.message);
      return null;
    });
    console.log('[upload] camera result:', url);

    setPendingImages(prev => {
      const out = [...prev];
      const idx = out.findIndex(x => x.uri === newItem.uri && !x.uploadedUrl && !x.error);
      if (idx !== -1) {
        out[idx] = url ? { uri: newItem.uri, uploadedUrl: url } : { uri: newItem.uri, error: true };
      }
      return out;
    });
    setUploading(false);
  };

  const handlePhotosPress = async () => {
    closeOptions();

    const remaining = MAX_IMAGES - pendingImages.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `You can attach up to ${MAX_IMAGES} images per message.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (result.canceled) return;

    const newItems: PendingImage[] = result.assets.slice(0, remaining).map(a => ({ uri: a.uri }));
    setPendingImages(prev => [...prev, ...newItems]);
    setUploading(true);

    const urls = await Promise.all(
      result.assets.map((asset) => uploadImage(asset.uri, asset.mimeType, asset.fileName).catch((err) => {
        console.log('[upload] failed for', asset.uri.slice(-40), ':', err?.message);
        return null;
      }))
    );
    console.log('[upload] results:', urls);

    setPendingImages(prev => {
      const out = [...prev];
      newItems.forEach((item, i) => {
        const idx = out.findIndex(x => x.uri === item.uri && !x.uploadedUrl && !x.error);
        if (idx !== -1) {
          out[idx] = urls[i] ? { uri: item.uri, uploadedUrl: urls[i]! } : { uri: item.uri, error: true };
        }
      });
      return out;
    });
    setUploading(false);
  };

  const handleFilesPress = async () => {
    closeOptions();

    const remaining = MAX_IMAGES - pendingImages.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `You can attach up to ${MAX_IMAGES} files per message.`);
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/png', 'image/jpeg'],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    // The `type` picker filter isn't strictly enforced on every platform — re-validate before upload.
    const ALLOWED_MIMES = new Set(['image/png', 'image/jpeg']);
    const ALLOWED_EXTS = new Set(['png', 'jpg', 'jpeg']);
    const MAX_FILE_BYTES = 25 * 1024 * 1024;

    const accepted: typeof result.assets = [];
    const rejected: string[] = [];
    for (const a of result.assets) {
      const ext = (a.name?.split('.').pop() ?? '').toLowerCase();
      const mime = a.mimeType ?? '';
      if (!ALLOWED_MIMES.has(mime) || !ALLOWED_EXTS.has(ext)) {
        rejected.push(a.name ?? 'file');
        continue;
      }
      if (typeof a.size === 'number' && a.size > MAX_FILE_BYTES) {
        rejected.push(`${a.name ?? 'file'} (>25MB)`);
        continue;
      }
      accepted.push(a);
    }

    if (rejected.length > 0) {
      Alert.alert(
        'Some files skipped',
        `Only PNG/JPEG up to 25MB are allowed.\n\nSkipped: ${rejected.join(', ')}`,
      );
    }

    const toUpload = accepted.slice(0, remaining);
    if (toUpload.length === 0) return;

    const newItems: PendingImage[] = toUpload.map(a => ({ uri: a.uri }));
    setPendingImages(prev => [...prev, ...newItems]);
    setUploading(true);

    const urls = await Promise.all(
      toUpload.map((asset) => uploadImage(asset.uri, asset.mimeType, asset.name).catch((err) => {
        console.log('[upload] failed for', asset.uri.slice(-40), ':', err?.message);
        return null;
      }))
    );
    console.log('[upload] file results:', urls);

    setPendingImages(prev => {
      const out = [...prev];
      newItems.forEach((item, i) => {
        const idx = out.findIndex(x => x.uri === item.uri && !x.uploadedUrl && !x.error);
        if (idx !== -1) {
          out[idx] = urls[i] ? { uri: item.uri, uploadedUrl: urls[i]! } : { uri: item.uri, error: true };
        }
      });
      return out;
    });
    setUploading(false);
  };

  // ── Message rendering ──
  function renderSingleMessage(msg: typeof ws.messages[number]) {
    if (msg.role === "user") {
      return <UserBubble key={msg.msgId} text={msg.content} attachments={msg.attachments} />;
    }

    if (msg.role === "tool") {
      const label = msg.badge ?? msg.content.substring(0, 60);
      const toolName = parseToolNameFromToolMessage(msg.content);
      const isRead = /read|search|view|cat|ls|get/i.test(toolName);
      const isWrite = /write|edit|create|patch|insert|update/i.test(toolName);

      const icon = isRead ? (
        <SearchIcon width={14} height={14} />
      ) : isWrite ? (
        <WriteIcon width={14} height={14} />
      ) : (
        <Text style={styles.toolCallEmoji}>{getToolCallIcon(toolName)}</Text>
      );

      return <ToolCallPill key={msg.msgId} label={label} icon={icon} />;
    }

    if (msg.role === "assistant") {
      return (
        <View key={msg.msgId} style={styles.agentBlock} testID="assistant-bubble">
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
  }

  function renderMessages() {
    // Group subagent messages by their parent tool_use ID so we can render them nested.
    const childrenByParent = new Map<string, typeof ws.messages>();
    for (const m of ws.messages) {
      if (m.parentToolUseId) {
        const arr = childrenByParent.get(m.parentToolUseId) ?? [];
        arr.push(m);
        childrenByParent.set(m.parentToolUseId, arr);
      }
    }

    return ws.messages.map((msg) => {
      if (msg.parentToolUseId) return null; // rendered as a child below its parent

      const node = renderSingleMessage(msg);
      const children = msg.toolUseId ? childrenByParent.get(msg.toolUseId) : undefined;
      if (!children || children.length === 0) return node;

      return (
        <View key={msg.msgId}>
          {node}
          <View style={styles.subagentBlock}>
            {children.map((child) => renderSingleMessage(child))}
          </View>
        </View>
      );
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
          disabled={isFirstSendOverlayVisible}
          onPress={() => {
            if (isFirstSendOverlayVisible) return;
            router.back();
          }}
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
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              scrollViewRef.current?.scrollToEnd({ animated: false });
              setShowScrollToBottom(false);
            }}
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
            {ws.streaming && <AgentTypingskeleton theme="light" />}

            {/* Chat actions shown after session has messages and is idle */}
            {ws.messages.length > 0 && !ws.streaming && (
              <ChatActions
                onShare={handleShareChat}
                onCopy={handleCopyLastMessage}
              />
            )}
          </ScrollView>

          {showScrollToBottom && (
            <TouchableOpacity
              style={[styles.scrollToBottomBtn, { bottom: 12 }]}
              activeOpacity={0.8}
              onPress={scrollToBottom}
            >
              <View style={styles.scrollToBottomGlyph}>
                <View style={styles.scrollToBottomStem} />
                <View style={styles.scrollToBottomChevronRow}>
                  <View
                    style={[
                      styles.scrollToBottomChevronArm,
                      styles.scrollToBottomChevronArmLeft,
                    ]}
                  />
                  <View
                    style={[
                      styles.scrollToBottomChevronArm,
                      styles.scrollToBottomChevronArmRight,
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Bottom input area ── */}
        <View
          style={[styles.inputContainer, { paddingBottom: bottom + 8 }]}
          onLayout={(e) => setInputContainerHeight(e.nativeEvent.layout.height)}
        >
          {pendingImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailStrip}>
              {pendingImages.map((img, idx) => (
                <View key={img.uri + idx} style={styles.thumbnailWrapper}>
                  <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                  {!img.uploadedUrl && !img.error && (
                    <ActivityIndicator style={StyleSheet.absoluteFill} color="#fff" size="small" />
                  )}
                  {img.error && <Text style={styles.thumbnailError}>!</Text>}
                  <TouchableOpacity
                    style={styles.thumbnailRemove}
                    onPress={() => setPendingImages(prev => prev.filter((_, i) => i !== idx))}
                  >
                    <CloseIcon width={10} height={10} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <View style={styles.inputRow}>
            <TextInput
              testID="chat-input"
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
            {ws.streaming ? (
              <TouchableOpacity
                testID="chat-stop-button"
                accessibilityLabel="Stop"
                style={styles.submitBtn}
                activeOpacity={0.8}
                onPress={() => ws.abort()}
              >
                <Text style={styles.stopBtnText}>■</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                testID="chat-send-button"
                accessibilityLabel="Send message"
                style={[styles.submitBtn, !canSend && styles.submitBtnDisabled]}
                activeOpacity={0.8}
                onPress={handleSubmit}
                disabled={!canSend}
              >
                <UpArrowIcon width={20} height={20} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.toolbarRow}>
            <TouchableOpacity
              ref={addBtnRef}
              testID="chat-attach-button"
              accessibilityLabel="Attach"
              style={styles.addBtn}
              activeOpacity={0.7}
              onPress={openOptions}
            >
              <PhotosIcon width={18} height={18} />
            </TouchableOpacity>

            <View style={styles.toolbarSpacer} />

            <TouchableOpacity
              testID="chat-model-dropdown"
              style={styles.modelDropdown}
              activeOpacity={0.7}
              onPress={openModelSheet}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>{selectedModel.label}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buildBtn}
              activeOpacity={0.7}
              onPress={() => {
                Keyboard.dismiss();
                modeSheetRef.current?.present();
              }}
            >
              <Text style={styles.buildText} numberOfLines={1}>
                {agentMode === "build" ? "Build" : "Plan"}
                {ws.permissionMode !== "ask-permissions"
                  ? ` · ${ws.permissionMode === "allow-all-edits" ? "Allow all edits" : "YOLO"}`
                  : ""}
              </Text>
            </TouchableOpacity>
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
                bottom: inputContainerHeight + keyboardHeight + 12,
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

      {showCopiedToast && (
        <View style={[styles.toast, { bottom: bottom + 96 }]}> 
          <Text style={styles.toastText}>Message copied</Text>
        </View>
      )}

      {isFirstSendOverlayVisible && (
        <View style={styles.firstSendOverlay}>
          <View style={styles.firstSendCard}>
            {firstSendOverlayStatus === "waiting" ? (
              <ActivityIndicator size="small" color="#3D841E" />
            ) : null}
            <Text style={styles.firstSendTitle}>
              {firstSendOverlayStatus === "waiting"
                ? "Starting conversation…"
                : "Failed to start conversation"}
            </Text>
            <Text style={styles.firstSendSubtitle}>
              {firstSendOverlayStatus === "waiting"
                ? "Sending your first message. Please wait a moment."
                : "The first message timed out. Please cancel and try again from home."}
            </Text>
            <TouchableOpacity
              style={styles.firstSendCancelBtn}
              activeOpacity={0.85}
              onPress={handleCancelFirstSend}
            >
              <Text style={styles.firstSendCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Mode / Permission bottom sheet ── */}
      <BottomSheetModal
        ref={modeSheetRef}
        snapPoints={["50%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderModeBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleComponent={() => (
          <View style={styles.sheetHandleContainer}>
            <View style={styles.sheetDragger} />
          </View>
        )}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Mode & Permissions</Text>
            <TouchableOpacity
              style={styles.sheetCloseBtn}
              activeOpacity={0.7}
              onPress={() => modeSheetRef.current?.dismiss()}
            >
              <CloseIcon width={36} height={36} />
            </TouchableOpacity>
          </View>

          <BottomSheetScrollView
            style={styles.sheetScrollFlex}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetScrollContent}
          >
            {/* Agent mode */}
            <Text style={styles.modeSheetSectionLabel}>Agent mode</Text>
            <View style={styles.sheetModelList}>
              {(["build", "plan"] as const).map((mode, index) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modelRow,
                    agentMode === mode && styles.modelRowSelected,
                    index === 0 && styles.modelRowSeparator,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setAgentMode(mode)}
                >
                  <View style={styles.modelInfo}>
                    <Text style={styles.modelLabel}>
                      {mode === "build" ? "Build" : "Plan"}
                    </Text>
                    <Text style={styles.modeSheetSubLabel}>
                      {mode === "build"
                        ? "Agent makes changes directly"
                        : "Agent plans before acting"}
                    </Text>
                  </View>
                  {agentMode === mode && <SelectedIcon width={16} height={16} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Permission mode */}
            <Text style={[styles.modeSheetSectionLabel, { marginTop: 20 }]}>Permissions</Text>
            <View style={styles.sheetModelList}>
              {([
                { key: "ask-permissions", label: "Ask permissions", sub: "Agent asks before making changes" },
                { key: "allow-all-edits",  label: "Allow all edits",  sub: "Agent edits files without asking" },
                { key: "yolo",             label: "YOLO",             sub: "Agent runs commands freely, no confirmations" },
              ] as const).map((item, index) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.modelRow,
                    ws.permissionMode === item.key && styles.modelRowSelected,
                    index < 2 && styles.modelRowSeparator,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (serverUrl) {
                      ws.patchPermissionMode(
                        ws.grassId ?? ws.sessionId,
                        item.key as PermissionMode,
                      );
                    }
                  }}
                >
                  <View style={styles.modelInfo}>
                    <Text style={styles.modelLabel}>{item.label}</Text>
                    <Text style={styles.modeSheetSubLabel}>{item.sub}</Text>
                  </View>
                  {ws.permissionMode === item.key && <SelectedIcon width={16} height={16} />}
                </TouchableOpacity>
              ))}
            </View>
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>

      {/* ── Model picker bottom sheet ── */}
      <BottomSheetModal
        ref={modelSheetRef}
        snapPoints={[(agentStr === "claude-code" || agentStr === "codex") ? "55%" : "75%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderModelBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleComponent={() => (
          <View style={styles.sheetHandleContainer}>
            <View style={styles.sheetDragger} />
          </View>
        )}
      >
        <View style={styles.sheetContainer}>
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

          <BottomSheetScrollView
            style={styles.sheetScrollFlex}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetScrollContent}
          >
            <View style={styles.sheetModelList}>
              {modelList.map((m, index) => (
                <TouchableOpacity
                  key={m.key}
                  testID={`model-row-${m.key}`}
                  style={[
                    styles.modelRow,
                    tempModelKey === m.key && styles.modelRowSelected,
                    index < modelList.length - 1 && styles.modelRowSeparator,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setTempModelKey(m.key)}
                >
                  <View style={styles.modelInfo}>
                    <Text style={styles.modelLabel}>{m.label}</Text>
                  </View>
                  {tempModelKey === m.key && <SelectedIcon width={16} height={16} />}
                </TouchableOpacity>
              ))}
            </View>
          </BottomSheetScrollView>

          {/* Sticky confirm button */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity
              testID="model-confirm-button"
              style={styles.confirmBtn}
              activeOpacity={0.85}
              onPress={confirmModel}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingVertical: 32,
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
    paddingTop: 10,
    paddingBottom: 24,
    gap: 12,
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
    paddingVertical: 10,
  },
  userText: {
    fontFamily: SFPro.medium,
    fontSize: 16,
    color: "#000",
    lineHeight: 23,
    letterSpacing: -0.2,
  },

  // Reading / Writing pills
  actionPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 17,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionPillText: {
    fontFamily: SFMono.medium,
    fontSize: 13,
    color: "#929292",
    flexShrink: 1,
  },
  toolCallEmoji: {
    fontSize: 14,
    lineHeight: 16,
  },

  // Agent text block
  agentBlock: {
    alignSelf: "stretch",
    gap: 6,
  },
  // Indented strip beneath a Task tool pill that contains the subagent's nested activity.
  subagentBlock: {
    alignSelf: "stretch",
    paddingLeft: 16,
    marginTop: 4,
    marginBottom: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#E5E5E5",
    gap: 6,
  },
  agentText: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "#000",
    lineHeight: 24,
    letterSpacing: -0.1,
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
    paddingVertical: 8,
  },
  chatActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 20,
  },
  toastText: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: "#1A1A1A",
    letterSpacing: -0.1,
  },

  firstSendOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    backgroundColor: "rgba(0,0,0,0.24)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  firstSendCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 10,
    alignItems: "center",
  },
  firstSendTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 18,
    color: "#000",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  firstSendSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "#505050",
    letterSpacing: -0.1,
    textAlign: "center",
  },
  firstSendCancelBtn: {
    marginTop: 6,
    minWidth: 120,
    height: 44,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  firstSendCancelText: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#1A1A1A",
    letterSpacing: -0.1,
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

  scrollToBottomBtn: {
    position: "absolute",
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D8D8D8",
    backgroundColor: "#F6F6F6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 15,
  },
  scrollToBottomGlyph: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 1,
    overflow: "visible",
  },
  scrollToBottomStem: {
    width: 3,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#000",
  },
  scrollToBottomChevronRow: {
    marginTop: -1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  scrollToBottomChevronArm: {
    width: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#000",
  },
  scrollToBottomChevronArmLeft: {
    marginRight: -2,
    transform: [{ rotate: "45deg" }],
  },
  scrollToBottomChevronArmRight: {
    marginLeft: -2,
    transform: [{ rotate: "-45deg" }],
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
    paddingTop: 12,
    gap: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: SFPro.regular,
    fontSize: 16,
    lineHeight: 22,
    color: "#1A1A1A",
    padding: 0,
    maxHeight: 100,
    minHeight: 24,
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "rgba(255, 255, 255, 0.50)",
  },
  dropdownText: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: "#1A1A1A",
    letterSpacing: -0.1,
    maxWidth: 140,
  },
  buildBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "rgba(255, 255, 255, 0.50)",
  },
  buildText: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: "#1A1A1A",
    letterSpacing: -0.1,
    maxWidth: 150,
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
  sheetContainer: {
    flex: 1,
  },
  sheetScrollFlex: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingBottom: 8,
  },
  modeSheetSectionLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#808080",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  modeSheetSubLabel: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#808080",
    letterSpacing: -0.2,
    lineHeight: 18,
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
    gap: 8,
    alignSelf: "stretch",
  },
  mdH1: {
    fontFamily: SFPro.bold,
    fontSize: 21,
    color: "#000",
    lineHeight: 27,
    letterSpacing: -0.3,
  },
  mdH2: {
    fontFamily: SFPro.bold,
    fontSize: 18,
    color: "#000",
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  mdH3: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#000",
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  mdInlineCode: {
    fontFamily: SFMono.medium,
    fontSize: 13,
    color: "#333",
    backgroundColor: "#F0F0F0",
  },
  mdCodeBlock: {
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    padding: 10,
  },
  mdCodeBlockText: {
    fontFamily: SFMono.medium,
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
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
    fontFamily: SFPro.regular,
    fontSize: 14,
    color: "#000",
    padding: 8,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  mdTableHeaderCell: {
    flex: 1,
    fontFamily: SFPro.semiBold,
    fontSize: 14,
    color: "#000",
    padding: 8,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  mdList: {
    gap: 6,
  },
  mdListItem: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  mdListItemText: {
    flex: 1,
  },
  mdBullet: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "#000",
    lineHeight: 24,
    width: 14,
  },
  mdNumber: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "#000",
    lineHeight: 24,
    minWidth: 24,
  },
  mdHr: {
    height: 1,
    backgroundColor: "#DFDFDF",
    marginVertical: 8,
  },
  // ── Image attachment styles ──────────────────────────────────────────────────
  userBubbleWrapper: {
    alignItems: "flex-end",
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  bubbleThumbnailStrip: {
    flexDirection: "row",
  },
  bubbleThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: "#e0e0e0",
  },
  thumbnailStrip: {
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  thumbnailWrapper: {
    width: 68,
    height: 68,
    borderRadius: 8,
    marginRight: 8,
    overflow: "hidden",
    backgroundColor: "#e0e0e0",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailRemove: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailError: {
    position: "absolute",
    bottom: 3,
    left: 4,
    color: "#ff4444",
    fontFamily: SFPro.bold,
    fontSize: 13,
  },
});
