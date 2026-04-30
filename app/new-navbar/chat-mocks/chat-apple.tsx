// Variant B — "if Apple shipped it" chat mockup. Not wired to any API.

import BackButtonIcon from "@/assets/images/new-design/chat/back-button.svg";
import ClaudeIcon from "@/assets/images/new-design/chat/claude-light-mode.svg";
import CopyIcon from "@/assets/images/new-design/chat/copy.svg";
import DiffButtonIcon from "@/assets/images/new-design/chat/diff-button.svg";
import SearchIcon from "@/assets/images/new-design/chat/search-icon.svg";
import WriteIcon from "@/assets/images/new-design/chat/write.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import PermissionIcon from "@/assets/images/new-design/navbar/permission-icon.svg";
import UpArrowIcon from "@/assets/images/new-design/up-arrow.svg";
import { SFMono, SFPro } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Markdown, type MarkdownTheme } from "./_shared/Markdown";
import { mockConversation } from "./_shared/mock-data";
import type { MockMessage } from "./_shared/mock-types";

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#F2F2F7",
  card: "#FFFFFF",
  text: "#000000",
  textDim: "#8E8E93",
  textDim2: "#C7C7CC",
  separator: "rgba(60, 60, 67, 0.12)",
  green: "#3D841E",
  greenSoft: "#DCF8C6",
  greenBorder: "#8CBB67",
  blue: "#007AFF",
  shadow: "rgba(0, 0, 0, 0.06)",
};

// ── Markdown theme ───────────────────────────────────────────────────────────
const mdTheme: MarkdownTheme = {
  body: { fontFamily: SFPro.regular, fontSize: 16, color: C.text, lineHeight: 24, letterSpacing: -0.2 },
  bold: { fontFamily: SFPro.semiBold },
  italic: { fontStyle: "italic" },
  inlineCode: {
    fontFamily: SFMono.medium,
    fontSize: 14,
    color: "#1A1A1A",
    backgroundColor: "rgba(120, 120, 128, 0.10)",
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  h1: { fontFamily: SFPro.displayBold, fontSize: 22, color: C.text, lineHeight: 28, letterSpacing: -0.5 },
  h2: { fontFamily: SFPro.displayBold, fontSize: 18, color: C.text, lineHeight: 24, letterSpacing: -0.4 },
  h3: { fontFamily: SFPro.semiBold, fontSize: 16, color: C.text, lineHeight: 22, letterSpacing: -0.3 },
  bullet: { fontFamily: SFPro.regular, fontSize: 16, color: C.text, lineHeight: 24, width: 14 },
  number: { fontFamily: SFPro.regular, fontSize: 16, color: C.text, lineHeight: 24, minWidth: 22 },
  hr: { height: 1, backgroundColor: C.separator, marginVertical: 8 },
  table: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.separator,
    overflow: "hidden",
    backgroundColor: C.card,
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.separator },
  tableHeaderRow: { backgroundColor: "rgba(118, 118, 128, 0.06)" },
  tableCell: { flex: 1, fontFamily: SFPro.regular, fontSize: 14, color: C.text, padding: 10, lineHeight: 20 },
  tableHeaderCell: {
    flex: 1,
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: C.textDim,
    padding: 10,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  block: { gap: 10, alignSelf: "stretch" },
  listItem: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  codeTheme: "light",
  codeWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.separator,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
};

// ── Streaming shimmer (Apple-Intelligence-style) ────────────────────────────
function ShimmerLine() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 1600, useNativeDriver: true, easing: Easing.linear }),
    ).start();
  }, [v]);
  const tx = v.interpolate({ inputRange: [0, 1], outputRange: [-160, 160] });
  return (
    <View style={s.shimmerWrap}>
      <View style={s.shimmerBase} />
      <Animated.View style={[s.shimmerSlide, { transform: [{ translateX: tx }] }]}>
        <LinearGradient
          colors={["rgba(0,122,255,0)", "#007AFF", "#AF52DE", "rgba(175,82,222,0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1, borderRadius: 2 }}
        />
      </Animated.View>
    </View>
  );
}

// ── User bubble (iMessage-ish, with tail) ───────────────────────────────────
function UserBubble({ text }: { text: string }) {
  return (
    <View style={s.userRow}>
      <View style={s.userBubble}>
        <Text style={s.userText}>{text}</Text>
      </View>
      <View style={s.userTail} />
    </View>
  );
}

// ── Tool group: collapses consecutive tool messages ─────────────────────────
function ToolGroup({ tools }: { tools: Extract<MockMessage, { role: "tool" }>[] }) {
  const [open, setOpen] = useState(false);
  if (tools.length === 1) {
    return <ToolRow tool={tools[0]} />;
  }
  return (
    <View>
      <TouchableOpacity
        style={s.toolGroupHeader}
        activeOpacity={0.6}
        onPress={() => setOpen((p) => !p)}
      >
        <View style={s.toolGroupIconWrap}>
          <Text style={s.toolGroupIconText}>⌘</Text>
        </View>
        <Text style={s.toolGroupHeaderText}>{`${tools.length} actions`}</Text>
        <Text style={[s.toolGroupChevron, { transform: [{ rotate: open ? "90deg" : "0deg" }] }]}>
          ›
        </Text>
      </TouchableOpacity>
      {open && (
        <View style={s.toolGroupList}>
          {tools.map((t) => (
            <ToolRow key={t.id} tool={t} />
          ))}
        </View>
      )}
    </View>
  );
}

function ToolRow({ tool }: { tool: Extract<MockMessage, { role: "tool" }> }) {
  const Icon =
    tool.tool === "read" || tool.tool === "grep"
      ? SearchIcon
      : tool.tool === "edit" || tool.tool === "write"
        ? WriteIcon
        : SearchIcon;
  const verb =
    tool.tool === "read"
      ? "Read"
      : tool.tool === "grep"
        ? "Searched"
        : tool.tool === "edit"
          ? "Edited"
          : tool.tool === "write"
            ? "Wrote"
            : "Ran";
  return (
    <View style={s.toolRow}>
      <View style={s.toolIconBg}>
        <Icon width={13} height={13} />
      </View>
      <Text style={s.toolVerb}>{verb}</Text>
      <Text style={s.toolPath} numberOfLines={1}>
        {tool.label}
      </Text>
    </View>
  );
}

// ── Permission card ─────────────────────────────────────────────────────────
function PermCard({ toolName, command }: { toolName: string; command: string }) {
  return (
    <View style={s.permCard}>
      <View style={s.permHeader}>
        <View style={s.permIconBg}>
          <PermissionIcon width={18} height={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.permTitle}>Permission required</Text>
          <Text style={s.permSub}>{toolName} wants to run a command</Text>
        </View>
      </View>
      <View style={s.permCmdBox}>
        <Text style={s.permCmdText} numberOfLines={2}>
          {command}
        </Text>
      </View>
      <View style={s.permRow}>
        <TouchableOpacity style={[s.permBtn, s.permDenyBtn]} activeOpacity={0.7}>
          <Text style={s.permDenyText}>Don&apos;t Allow</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.permBtn, s.permAllowBtn]} activeOpacity={0.85}>
          <Text style={s.permAllowText}>Allow</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Date divider (iMessage style) ───────────────────────────────────────────
function DateDivider({ label }: { label: string }) {
  return (
    <View style={s.dateRow}>
      <Text style={s.dateText}>{label}</Text>
    </View>
  );
}

// ── Group consecutive tool messages ─────────────────────────────────────────
function groupMessages(msgs: typeof mockConversation.messages) {
  const out: (
    | { kind: "single"; msg: MockMessage }
    | { kind: "tools"; items: Extract<MockMessage, { role: "tool" }>[] }
  )[] = [];
  let i = 0;
  while (i < msgs.length) {
    const m = msgs[i];
    if (m.role === "tool") {
      const items: Extract<MockMessage, { role: "tool" }>[] = [];
      while (i < msgs.length && msgs[i].role === "tool") {
        items.push(msgs[i] as Extract<MockMessage, { role: "tool" }>);
        i++;
      }
      out.push({ kind: "tools", items });
      continue;
    }
    out.push({ kind: "single", msg: m });
    i++;
  }
  return out;
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function ChatAppleMock() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const [input, setInput] = useState("");
  const conv = mockConversation;
  const grouped = groupMessages(conv.messages);

  return (
    <View style={[s.container, { paddingTop: top }]}>
      {/* Large-title header */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} activeOpacity={0.6} onPress={() => router.back()}>
          <BackButtonIcon width={36} height={36} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {conv.sessionTitle}
          </Text>
          <View style={s.headerMetaRow}>
            <Text style={s.headerMeta}>{conv.repoName}</Text>
            <Text style={s.headerSep}> · </Text>
            <GitBranchIcon width={11} height={11} />
            <Text style={s.headerMeta}> {conv.branch}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.headerBtn} activeOpacity={0.6}>
          <DiffButtonIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.messages}
          showsVerticalScrollIndicator={false}
        >
          <DateDivider label="Today 2:14 PM" />

          {grouped.map((g, idx) => {
            if (g.kind === "tools") {
              return <ToolGroup key={`g${idx}`} tools={g.items} />;
            }
            const m = g.msg;
            if (m.role === "user") return <UserBubble key={m.id} text={m.content} />;
            if (m.role === "permission")
              return <PermCard key={m.id} toolName={m.toolName} command={m.command} />;
            if (m.role === "assistant") {
              return (
                <View key={m.id} style={s.assistantRow}>
                  <View style={s.avatar}>
                    <ClaudeIcon width={20} height={20} />
                  </View>
                  <View style={s.assistantBody}>
                    <Markdown content={m.content} theme={mdTheme} />
                  </View>
                </View>
              );
            }
            return null;
          })}

          {/* Streaming */}
          {conv.streaming && (
            <View style={s.assistantRow}>
              <View style={s.avatar}>
                <ClaudeIcon width={20} height={20} />
              </View>
              <View style={[s.assistantBody, { paddingTop: 12 }]}>
                <ShimmerLine />
              </View>
            </View>
          )}

          {/* Last-message actions */}
          <View style={s.actionsRow}>
            <TouchableOpacity style={s.actionBtn} activeOpacity={0.6}>
              <CopyIcon width={14} height={14} />
              <Text style={s.actionText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} activeOpacity={0.6}>
              <Text style={s.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Input */}
        <View style={[s.inputWrap, { paddingBottom: bottom + 8 }]}>
          <View style={s.inputRow}>
            <View style={s.inputField}>
              <TextInput
                style={s.input}
                value={input}
                onChangeText={setInput}
                placeholder="Message"
                placeholderTextColor={C.textDim}
                multiline
              />
            </View>
            <TouchableOpacity style={s.sendBtn} activeOpacity={0.85} onPress={() => setInput("")}>
              <UpArrowIcon width={18} height={18} />
            </TouchableOpacity>
          </View>
          <View style={s.toolbarRow}>
            <TouchableOpacity style={s.chip} activeOpacity={0.6}>
              <Text style={s.chipText}>{conv.modelLabel}</Text>
              <Text style={s.chipChevron}>⌄</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.chip} activeOpacity={0.6}>
              <Text style={s.chipText}>Build</Text>
              <Text style={s.chipChevron}>⌄</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Text style={s.toolbarHint}>↵ to send</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.bg,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  headerTitle: {
    fontFamily: SFPro.displayBold,
    fontSize: 17,
    color: C.text,
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  headerMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  headerMeta: { fontFamily: SFPro.regular, fontSize: 12, color: C.textDim, letterSpacing: -0.1 },
  headerSep: { fontFamily: SFPro.regular, fontSize: 12, color: C.textDim },

  // Messages
  messages: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 14 },

  // Date divider
  dateRow: { alignItems: "center", paddingVertical: 6 },
  dateText: {
    fontFamily: SFPro.semiBold,
    fontSize: 11,
    color: C.textDim,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },

  // User
  userRow: { alignSelf: "flex-end", maxWidth: "85%", flexDirection: "row", alignItems: "flex-end" },
  userBubble: {
    backgroundColor: C.greenSoft,
    borderWidth: 1,
    borderColor: C.greenBorder,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  userTail: {
    width: 8,
    height: 12,
    marginLeft: -2,
    marginBottom: 0,
    backgroundColor: C.greenSoft,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.greenBorder,
    borderBottomRightRadius: 4,
  },
  userText: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: C.text,
    lineHeight: 22,
    letterSpacing: -0.2,
  },

  // Tool single row
  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
    paddingLeft: 36,
  },
  toolIconBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(118, 118, 128, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolVerb: { fontFamily: SFPro.semiBold, fontSize: 13, color: C.textDim },
  toolPath: { flex: 1, fontFamily: SFMono.medium, fontSize: 13, color: C.text, letterSpacing: -0.1 },

  // Tool group
  toolGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 36,
    paddingVertical: 6,
  },
  toolGroupIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(118, 118, 128, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolGroupIconText: { fontFamily: SFPro.semiBold, fontSize: 13, color: C.textDim },
  toolGroupHeaderText: { fontFamily: SFPro.semiBold, fontSize: 14, color: C.text, flex: 1 },
  toolGroupChevron: { fontSize: 18, color: C.textDim2, fontFamily: SFPro.semiBold },
  toolGroupList: { paddingTop: 2, gap: 2 },

  // Assistant
  assistantRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    marginTop: 2,
  },
  assistantBody: { flex: 1, gap: 8 },

  shimmerWrap: {
    height: 3,
    width: 160,
    overflow: "hidden",
    borderRadius: 2,
  },
  shimmerBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(120, 120, 128, 0.12)",
    borderRadius: 2,
  },
  shimmerSlide: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 100,
  },

  // Permission card
  permCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  permHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  permIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 159, 10, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  permTitle: { fontFamily: SFPro.semiBold, fontSize: 15, color: C.text, letterSpacing: -0.2 },
  permSub: { fontFamily: SFPro.regular, fontSize: 13, color: C.textDim, marginTop: 1 },
  permCmdBox: {
    backgroundColor: "rgba(118, 118, 128, 0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  permCmdText: { fontFamily: SFMono.medium, fontSize: 13, color: C.text, lineHeight: 18 },
  permRow: { flexDirection: "row", gap: 10 },
  permBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  permDenyBtn: { backgroundColor: "rgba(118, 118, 128, 0.12)" },
  permAllowBtn: { backgroundColor: C.green },
  permDenyText: { fontFamily: SFPro.semiBold, fontSize: 15, color: C.text },
  permAllowText: { fontFamily: SFPro.semiBold, fontSize: 15, color: "#FFF" },

  // Last-message actions
  actionsRow: { flexDirection: "row", gap: 8, paddingLeft: 38, paddingTop: 4 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(118, 118, 128, 0.10)",
  },
  actionText: { fontFamily: SFPro.medium, fontSize: 13, color: C.text },

  // Input
  inputWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.separator,
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  inputField: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 22,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 6,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  input: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: C.text,
    minHeight: 22,
    maxHeight: 110,
    padding: 0,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "rgba(118, 118, 128, 0.10)",
  },
  chipText: { fontFamily: SFPro.semiBold, fontSize: 12, color: C.text },
  chipChevron: { fontFamily: SFPro.regular, fontSize: 12, color: C.textDim, marginTop: -2 },
  toolbarHint: { fontFamily: SFPro.regular, fontSize: 11, color: C.textDim2 },
});
