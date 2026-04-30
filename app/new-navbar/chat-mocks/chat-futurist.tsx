// Variant A — "neural / cyberpunk" chat mockup. Not wired to any API.
// Static dummy data lives in ./_shared/mock-data.

import BackButtonIcon from "@/assets/images/new-design/chat/back-button.svg";
import DiffButtonIcon from "@/assets/images/new-design/chat/diff-button.svg";
import ApproveIcon from "@/assets/images/new-design/navbar/approve-icon.svg";
import DenyIcon from "@/assets/images/new-design/navbar/deny-icon.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
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
  Pressable,
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

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg0: "#06060B",
  bg1: "#0B0820",
  bg2: "#14102A",
  panel: "rgba(20, 16, 42, 0.55)",
  panelBorder: "rgba(120, 200, 255, 0.18)",
  text: "#E8E9F5",
  textDim: "#9098B8",
  cyan: "#5CF1FF",
  cyanSoft: "rgba(92, 241, 255, 0.18)",
  magenta: "#FF4DD1",
  magentaSoft: "rgba(255, 77, 209, 0.12)",
  amber: "#FFD166",
  amberSoft: "rgba(255, 209, 102, 0.14)",
  grid: "rgba(120, 200, 255, 0.06)",
};

// ── Pulsing dot (system status, streaming) ───────────────────────────────────
function PulseDot({ color = C.cyan, size = 8 }: { color?: string; size?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(v, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    ).start();
  }, [v]);
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] });
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
        shadowColor: color,
        shadowOpacity: 0.9,
        shadowRadius: 6,
      }}
    />
  );
}

// ── Streaming dots row ───────────────────────────────────────────────────────
function StreamingDots() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const seq = (n: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(n, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(n, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]),
      );
    seq(a, 0).start();
    seq(b, 180).start();
    seq(c, 360).start();
  }, [a, b, c]);
  const dot = (n: Animated.Value) => (
    <Animated.View
      style={{
        width: 7,
        height: 7,
        borderRadius: 4,
        marginHorizontal: 3,
        backgroundColor: C.cyan,
        opacity: n.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
        transform: [{ scale: n.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
        shadowColor: C.cyan,
        shadowOpacity: 0.8,
        shadowRadius: 5,
      }}
    />
  );
  return (
    <View style={s.streamRow}>
      <Text style={s.streamLabel}>// agent.thinking</Text>
      <View style={{ flexDirection: "row" }}>
        {dot(a)}
        {dot(b)}
        {dot(c)}
      </View>
    </View>
  );
}

// ── Markdown theme for assistant text ────────────────────────────────────────
const mdTheme: MarkdownTheme = {
  body: { fontFamily: SFPro.regular, fontSize: 15.5, color: C.text, lineHeight: 24, letterSpacing: -0.1 },
  bold: { fontFamily: SFPro.bold, color: C.cyan },
  italic: { fontStyle: "italic" },
  inlineCode: {
    fontFamily: SFMono.medium,
    fontSize: 13,
    color: C.cyan,
    backgroundColor: "rgba(92, 241, 255, 0.10)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  h1: { fontFamily: SFPro.displayBold, fontSize: 22, color: C.text, lineHeight: 28, letterSpacing: -0.4 },
  h2: { fontFamily: SFPro.displayBold, fontSize: 18, color: C.text, lineHeight: 24, letterSpacing: -0.3 },
  h3: {
    fontFamily: SFMono.semiBold,
    fontSize: 13,
    color: C.cyan,
    lineHeight: 18,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  bullet: { fontFamily: SFMono.bold, fontSize: 14, color: C.cyan, lineHeight: 24, width: 14 },
  number: { fontFamily: SFMono.bold, fontSize: 14, color: C.magenta, lineHeight: 24, minWidth: 22 },
  hr: { height: 1, backgroundColor: C.panelBorder, marginVertical: 10 },
  table: { borderRadius: 8, borderWidth: 1, borderColor: C.panelBorder, overflow: "hidden" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.panelBorder },
  tableHeaderRow: { backgroundColor: "rgba(92, 241, 255, 0.08)" },
  tableCell: {
    flex: 1,
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: C.text,
    padding: 8,
    lineHeight: 18,
  },
  tableHeaderCell: {
    flex: 1,
    fontFamily: SFMono.semiBold,
    fontSize: 12,
    color: C.cyan,
    padding: 8,
    lineHeight: 18,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  block: { gap: 10, alignSelf: "stretch" },
  listItem: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  codeTheme: "dark",
  codeWrapper: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.panelBorder,
    overflow: "hidden",
    backgroundColor: "rgba(8, 6, 24, 0.8)",
  },
};

// ── Tool log line (no bubble — terminal log style) ──────────────────────────
function ToolLog({ tool, label }: { tool: string; label: string }) {
  const tag = tool.toUpperCase();
  const tagColor =
    tool === "read" || tool === "grep"
      ? C.cyan
      : tool === "edit" || tool === "write"
        ? C.magenta
        : C.amber;
  return (
    <View style={s.toolLog}>
      <View style={[s.toolBar, { backgroundColor: tagColor }]} />
      <Text style={[s.toolTag, { color: tagColor }]}>{`[ ${tag.padEnd(5)} ]`}</Text>
      <Text style={s.toolLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ── User bubble (sharp corners, gradient stroke) ────────────────────────────
function UserBubble({ text }: { text: string }) {
  return (
    <View style={s.userOuter}>
      <LinearGradient
        colors={[C.magenta, C.cyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.userBorderGradient}
      >
        <View style={s.userInner}>
          <Text style={s.userText}>{text}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// ── Permission card (system warning) ────────────────────────────────────────
function PermPanel({ toolName, command }: { toolName: string; command: string }) {
  return (
    <View style={s.permWrap}>
      <View style={s.permWarnBar}>
        <Text style={s.permWarnText}>// SYSTEM_REQUEST · ELEVATED_PERMISSION</Text>
        <PulseDot color={C.amber} size={7} />
      </View>
      <View style={s.permBody}>
        <Text style={s.permLabel}>{toolName.toUpperCase()}</Text>
        <View style={s.permCmdBox}>
          <Text style={s.permCmdText} numberOfLines={2}>
            {`$ ${command}`}
          </Text>
        </View>
        <View style={s.permRow}>
          <TouchableOpacity style={[s.permBtn, s.permDeny]} activeOpacity={0.7}>
            <DenyIcon width={14} height={14} />
            <Text style={s.permBtnText}>DENY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.permBtn, s.permApprove]} activeOpacity={0.7}>
            <ApproveIcon width={14} height={14} />
            <Text style={[s.permBtnText, { color: C.bg0 }]}>EXECUTE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Background grid (purely decorative) ─────────────────────────────────────
function GridLines() {
  const lines: React.ReactNode[] = [];
  for (let i = 1; i < 8; i++) {
    lines.push(
      <View
        key={`v${i}`}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${(i * 100) / 8}%`,
          width: StyleSheet.hairlineWidth,
          backgroundColor: C.grid,
        }}
      />,
    );
  }
  for (let i = 1; i < 18; i++) {
    lines.push(
      <View
        key={`h${i}`}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${(i * 100) / 18}%`,
          height: StyleSheet.hairlineWidth,
          backgroundColor: C.grid,
        }}
      />,
    );
  }
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>{lines}</View>;
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function ChatFuturistMock() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const [input, setInput] = useState("");
  const conv = mockConversation;

  return (
    <View style={[s.container, { paddingTop: top }]}>
      {/* Background gradient + grid */}
      <LinearGradient
        colors={[C.bg0, C.bg1, C.bg2]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <GridLines />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <BackButtonIcon width={36} height={36} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.headerTitleRow}>
            <PulseDot />
            <Text style={s.headerTitle}>SESSION_8F2A.7B</Text>
          </View>
          <View style={s.headerMetaRow}>
            <Text style={s.headerMeta}>{conv.repoName.toUpperCase()}</Text>
            <Text style={s.headerMetaSep}>·</Text>
            <GitBranchIcon width={12} height={12} />
            <Text style={s.headerMeta}>{conv.branch}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.headerBtn} activeOpacity={0.7}>
          <DiffButtonIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.messages}
          showsVerticalScrollIndicator={false}
        >
          {conv.messages.map((msg) => {
            if (msg.role === "user") return <UserBubble key={msg.id} text={msg.content} />;
            if (msg.role === "tool") return <ToolLog key={msg.id} tool={msg.tool} label={msg.label} />;
            if (msg.role === "permission")
              return <PermPanel key={msg.id} toolName={msg.toolName} command={msg.command} />;
            // assistant
            return (
              <View key={msg.id} style={s.agentBlock}>
                <View style={s.agentHeader}>
                  <Text style={s.agentTag}>{`> AGENT.OUT`}</Text>
                </View>
                <Markdown content={msg.content} theme={mdTheme} />
              </View>
            );
          })}
          {conv.streaming && <StreamingDots />}
        </ScrollView>

        {/* Input */}
        <View style={[s.inputWrap, { paddingBottom: bottom + 10 }]}>
          <LinearGradient
            colors={["rgba(92, 241, 255, 0.0)", "rgba(92, 241, 255, 0.45)", "rgba(255, 77, 209, 0.45)", "rgba(92, 241, 255, 0.0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.inputTopLine}
          />
          <View style={s.inputCard}>
            <View style={s.statusRow}>
              <View style={s.statusChip}>
                <View style={[s.led, { backgroundColor: C.cyan }]} />
                <Text style={s.statusChipText}>MODEL · {conv.modelLabel.toUpperCase()}</Text>
              </View>
              <View style={s.statusChip}>
                <View style={[s.led, { backgroundColor: C.magenta }]} />
                <Text style={s.statusChipText}>MODE · BUILD</Text>
              </View>
              <View style={s.statusChip}>
                <View style={[s.led, { backgroundColor: C.amber }]} />
                <Text style={s.statusChipText}>PERM · ASK</Text>
              </View>
            </View>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                value={input}
                onChangeText={setInput}
                placeholder="› transmit_message…"
                placeholderTextColor={C.textDim}
                multiline
              />
              <Pressable
                style={({ pressed }) => [s.sendBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setInput("")}
              >
                <View style={s.sendBtnGlow} />
                <UpArrowIcon width={18} height={18} />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg0 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.panelBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", gap: 4, paddingHorizontal: 8 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: {
    fontFamily: SFMono.semiBold,
    fontSize: 13,
    color: C.cyan,
    letterSpacing: 1.2,
  },
  headerMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerMeta: {
    fontFamily: SFMono.regular,
    fontSize: 11,
    color: C.textDim,
    letterSpacing: 0.6,
  },
  headerMetaSep: { color: C.textDim, fontSize: 11 },

  // Message list
  messages: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 14,
  },

  // User bubble
  userOuter: { alignSelf: "flex-end", maxWidth: "84%" },
  userBorderGradient: { padding: 1.5, borderRadius: 6 },
  userInner: {
    backgroundColor: "rgba(255, 77, 209, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 5,
  },
  userText: {
    fontFamily: SFMono.medium,
    fontSize: 14,
    color: C.text,
    lineHeight: 21,
    letterSpacing: -0.1,
  },

  // Tool log
  toolLog: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 4,
  },
  toolBar: { width: 2, height: 16, borderRadius: 1 },
  toolTag: {
    fontFamily: SFMono.bold,
    fontSize: 11,
    letterSpacing: 1,
  },
  toolLabel: {
    flex: 1,
    fontFamily: SFMono.regular,
    fontSize: 12,
    color: C.textDim,
    letterSpacing: 0.2,
  },

  // Agent block
  agentBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.panelBorder,
    backgroundColor: C.panel,
    padding: 14,
    gap: 10,
  },
  agentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.panelBorder,
  },
  agentTag: {
    fontFamily: SFMono.semiBold,
    fontSize: 11,
    color: C.cyan,
    letterSpacing: 1.4,
  },

  // Streaming dots
  streamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 4,
  },
  streamLabel: {
    fontFamily: SFMono.regular,
    fontSize: 11,
    color: C.textDim,
    letterSpacing: 0.6,
  },

  // Permission panel
  permWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.amber,
    overflow: "hidden",
    backgroundColor: "rgba(255, 209, 102, 0.05)",
  },
  permWarnBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.amberSoft,
    borderBottomWidth: 1,
    borderBottomColor: C.amber,
  },
  permWarnText: {
    fontFamily: SFMono.bold,
    fontSize: 11,
    color: C.amber,
    letterSpacing: 1.2,
  },
  permBody: { padding: 14, gap: 12 },
  permLabel: {
    fontFamily: SFMono.bold,
    fontSize: 12,
    color: C.text,
    letterSpacing: 1.2,
  },
  permCmdBox: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.panelBorder,
  },
  permCmdText: {
    fontFamily: SFMono.medium,
    fontSize: 13,
    color: C.cyan,
    lineHeight: 18,
  },
  permRow: { flexDirection: "row", gap: 10 },
  permBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 42,
    borderRadius: 6,
  },
  permDeny: {
    backgroundColor: "rgba(255, 77, 209, 0.10)",
    borderWidth: 1,
    borderColor: C.magenta,
  },
  permApprove: {
    backgroundColor: C.cyan,
  },
  permBtnText: {
    fontFamily: SFMono.bold,
    fontSize: 12,
    color: C.text,
    letterSpacing: 1.4,
  },

  // Input
  inputWrap: { paddingHorizontal: 12 },
  inputTopLine: { height: 1, marginHorizontal: 6 },
  inputCard: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.panelBorder,
    backgroundColor: C.panel,
    padding: 10,
    gap: 10,
  },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: C.panelBorder,
  },
  led: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: {
    fontFamily: SFMono.medium,
    fontSize: 10,
    color: C.text,
    letterSpacing: 1,
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 110,
    color: C.text,
    fontFamily: SFMono.regular,
    fontSize: 14,
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 6,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.cyan,
    shadowColor: C.cyan,
    shadowOpacity: 0.7,
    shadowRadius: 12,
  },
  sendBtnGlow: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.cyan,
    opacity: 0.18,
  },
});
