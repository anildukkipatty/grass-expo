// Variant C — "game / arcade" chat mockup. Not wired to any API.

import BackButtonIcon from "@/assets/images/new-design/chat/back-button.svg";
import ClaudeIcon from "@/assets/images/new-design/chat/claude.svg";
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
  bg: "#FFF6DB",
  bgStripe: "#FCE9A8",
  ink: "#1A1A1A",
  parchment: "#FFFCEC",
  parchmentBorder: "#1A1A1A",
  green: "#3DB04A",
  greenDark: "#1F8531",
  red: "#E5484D",
  redDark: "#B5363B",
  yellow: "#FFD23F",
  yellowDark: "#E8B100",
  blue: "#3D7BF6",
  purple: "#8B5CF6",
  purpleDark: "#5B33C9",
  shadow: "#1A1A1A",
};

// ── Markdown theme ───────────────────────────────────────────────────────────
const mdTheme: MarkdownTheme = {
  body: { fontFamily: SFPro.medium, fontSize: 15.5, color: C.ink, lineHeight: 23, letterSpacing: -0.1 },
  bold: { fontFamily: SFPro.bold, color: C.ink },
  italic: { fontStyle: "italic" },
  inlineCode: {
    fontFamily: SFMono.semiBold,
    fontSize: 13,
    color: C.purpleDark,
    backgroundColor: "rgba(139, 92, 246, 0.18)",
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  h1: { fontFamily: SFPro.displayBold, fontSize: 22, color: C.ink, lineHeight: 28, letterSpacing: -0.3 },
  h2: { fontFamily: SFPro.displayBold, fontSize: 18, color: C.ink, lineHeight: 24, letterSpacing: -0.2 },
  h3: { fontFamily: SFPro.bold, fontSize: 16, color: C.purpleDark, lineHeight: 22, letterSpacing: -0.1 },
  bullet: { fontFamily: SFPro.bold, fontSize: 16, color: C.green, lineHeight: 23, width: 16 },
  number: {
    fontFamily: SFPro.bold,
    fontSize: 15,
    color: "#FFF",
    backgroundColor: C.purple,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    textAlign: "center",
    lineHeight: 22,
    overflow: "hidden",
    marginTop: 1,
  },
  hr: { height: 2, backgroundColor: C.ink, marginVertical: 8, borderRadius: 1 },
  table: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.ink,
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: C.ink },
  tableHeaderRow: { backgroundColor: C.yellow },
  tableCell: { flex: 1, fontFamily: SFPro.medium, fontSize: 13.5, color: C.ink, padding: 9, lineHeight: 18 },
  tableHeaderCell: {
    flex: 1,
    fontFamily: SFPro.bold,
    fontSize: 12,
    color: C.ink,
    padding: 9,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  block: { gap: 10, alignSelf: "stretch" },
  listItem: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  codeTheme: "dark",
  codeWrapper: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.ink,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
  },
};

// ── Hard-shadow card (the neo-brutalist sticker look) ───────────────────────
function ChunkyCard({
  children,
  bg = "#FFF",
  shadowColor = C.shadow,
  borderRadius = 16,
  padding = 14,
  borderColor = C.ink,
}: {
  children: React.ReactNode;
  bg?: string;
  shadowColor?: string;
  borderRadius?: number;
  padding?: number;
  borderColor?: string;
}) {
  return (
    <View style={{ paddingBottom: 5, paddingRight: 5 }}>
      <View
        style={{
          position: "absolute",
          left: 5,
          top: 5,
          right: 0,
          bottom: 0,
          backgroundColor: shadowColor,
          borderRadius,
        }}
      />
      <View
        style={{
          backgroundColor: bg,
          borderRadius,
          borderWidth: 2,
          borderColor,
          padding,
        }}
      >
        {children}
      </View>
    </View>
  );
}

// ── User bubble ─────────────────────────────────────────────────────────────
function UserBubble({ text }: { text: string }) {
  return (
    <View style={s.userOuter}>
      <View style={s.userShadow} />
      <View style={s.userBubble}>
        <Text style={s.userText}>{text}</Text>
      </View>
    </View>
  );
}

// ── Tool pickup pill (XP-style) ─────────────────────────────────────────────
function ToolPickup({ tool, label }: { tool: string; label: string }) {
  const verb =
    tool === "read"
      ? "READ"
      : tool === "grep"
        ? "SEARCH"
        : tool === "edit"
          ? "EDIT"
          : tool === "write"
            ? "WRITE"
            : "RUN";
  const emoji =
    tool === "read"
      ? "📖"
      : tool === "grep"
        ? "🔍"
        : tool === "edit"
          ? "📝"
          : tool === "write"
            ? "✏️"
            : "⚡";
  const xp =
    tool === "edit" || tool === "write" ? "+10 XP" : tool === "bash" ? "+15 XP" : "+5 XP";
  return (
    <View style={s.pickupOuter}>
      <View style={s.pickupShadow} />
      <View style={s.pickupBubble}>
        <Text style={s.pickupEmoji}>{emoji}</Text>
        <View style={s.pickupVerbBox}>
          <Text style={s.pickupVerb}>{verb}</Text>
        </View>
        <Text style={s.pickupLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={s.pickupXP}>{xp}</Text>
      </View>
    </View>
  );
}

// ── Permission "quest offer" ────────────────────────────────────────────────
function PermQuest({ toolName, command }: { toolName: string; command: string }) {
  return (
    <ChunkyCard bg={C.yellow} padding={0} borderRadius={14}>
      <View style={s.questBanner}>
        <Text style={s.questBannerText}>⚠  PERMISSION QUEST</Text>
      </View>
      <View style={s.questBody}>
        <Text style={s.questTitle}>The agent wants to use</Text>
        <Text style={s.questToolName}>{toolName.toUpperCase()}</Text>
        <View style={s.questCmdBox}>
          <Text style={s.questCmdText} numberOfLines={2}>{`> ${command}`}</Text>
        </View>
        <View style={s.questBtnRow}>
          <Pressable style={({ pressed }) => [s.questBtn, s.questDecline, pressed && s.questBtnPressed]}>
            <DenyIcon width={16} height={16} />
            <Text style={s.questBtnText}>DECLINE</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [s.questBtn, s.questAccept, pressed && s.questBtnPressed]}>
            <ApproveIcon width={16} height={16} />
            <Text style={s.questBtnText}>ACCEPT</Text>
          </Pressable>
        </View>
      </View>
    </ChunkyCard>
  );
}

// ── HP-style energy bar ─────────────────────────────────────────────────────
function EnergyBar({ active }: { active: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1300, useNativeDriver: false, easing: Easing.linear }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: false }),
      ]),
    ).start();
  }, [v, active]);
  const w = v.interpolate({ inputRange: [0, 1], outputRange: ["20%", "100%"] });
  return (
    <View style={s.energyOuter}>
      <View style={s.energyShell}>
        <Animated.View style={[s.energyFill, { width: w as any }]} />
        <View style={s.energySheen} />
      </View>
      <Text style={s.energyLabel}>{active ? "AGENT THINKING…" : "READY"}</Text>
    </View>
  );
}

// ── Bouncing dots for streaming ─────────────────────────────────────────────
function BouncingDots() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const seq = (n: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(n, { toValue: -6, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
          Animated.timing(n, { toValue: 0, duration: 350, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
        ]),
      );
    seq(a, 0).start();
    seq(b, 140).start();
    seq(c, 280).start();
  }, [a, b, c]);
  return (
    <View style={s.bounceRow}>
      <Animated.Text style={[s.bounceDot, { transform: [{ translateY: a }] }]}>●</Animated.Text>
      <Animated.Text style={[s.bounceDot, { transform: [{ translateY: b }] }]}>●</Animated.Text>
      <Animated.Text style={[s.bounceDot, { transform: [{ translateY: c }] }]}>●</Animated.Text>
      <Text style={s.bounceLabel}>Claude is thinking ✨</Text>
    </View>
  );
}

// ── Decorative diagonal stripes background ──────────────────────────────────
function StripeBg() {
  const stripes: React.ReactNode[] = [];
  for (let i = -10; i < 30; i++) {
    stripes.push(
      <View
        key={i}
        style={{
          position: "absolute",
          width: 600,
          height: 16,
          left: -100,
          top: i * 40,
          backgroundColor: C.bgStripe,
          opacity: 0.5,
          transform: [{ rotate: "-12deg" }],
        }}
      />,
    );
  }
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>{stripes}</View>;
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function ChatArcadeMock() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const [input, setInput] = useState("");
  const conv = mockConversation;

  return (
    <View style={[s.container, { paddingTop: top }]}>
      <StripeBg />

      {/* Header */}
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.iconBtn, pressed && s.iconBtnPressed]}
          onPress={() => router.back()}
        >
          <View style={s.iconBtnShadow} />
          <View style={s.iconBtnFace}>
            <BackButtonIcon width={28} height={28} />
          </View>
        </Pressable>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{conv.repoName.toUpperCase()}</Text>
          <View style={s.headerMetaRow}>
            <GitBranchIcon width={12} height={12} />
            <Text style={s.headerMeta}>{conv.branch}</Text>
          </View>
          <EnergyBar active={conv.streaming} />
        </View>

        <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.iconBtnPressed]}>
          <View style={s.iconBtnShadow} />
          <View style={[s.iconBtnFace, { backgroundColor: C.purple }]}>
            <DiffButtonIcon width={20} height={20} />
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.messages}
          showsVerticalScrollIndicator={false}
        >
          {conv.messages.map((msg) => {
            if (msg.role === "user") return <UserBubble key={msg.id} text={msg.content} />;
            if (msg.role === "tool")
              return <ToolPickup key={msg.id} tool={msg.tool} label={msg.label} />;
            if (msg.role === "permission")
              return <PermQuest key={msg.id} toolName={msg.toolName} command={msg.command} />;
            // assistant
            return (
              <View key={msg.id} style={{ paddingBottom: 6 }}>
                <View style={s.agentNameTag}>
                  <View style={s.agentAvatarBox}>
                    <ClaudeIcon width={18} height={18} />
                  </View>
                  <Text style={s.agentNameText}>CLAUDE</Text>
                  <View style={s.agentLevelChip}>
                    <Text style={s.agentLevelText}>Lv. SONNET 4.6</Text>
                  </View>
                </View>
                <ChunkyCard bg={C.parchment} padding={14} borderRadius={14}>
                  <Markdown content={msg.content} theme={mdTheme} />
                </ChunkyCard>
              </View>
            );
          })}

          {conv.streaming && <BouncingDots />}
        </ScrollView>

        {/* Input */}
        <View style={[s.inputWrap, { paddingBottom: bottom + 10 }]}>
          <View style={s.inputCardShadow} />
          <View style={s.inputCard}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type a command…"
              placeholderTextColor="#888"
              multiline
            />
            <View style={s.equipRow}>
              <View style={s.equipSlot}>
                <Text style={s.equipLabel}>MODEL</Text>
                <Text style={s.equipValue}>{conv.modelLabel}</Text>
              </View>
              <View style={s.equipSlot}>
                <Text style={s.equipLabel}>MODE</Text>
                <Text style={s.equipValue}>BUILD</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Pressable
                style={({ pressed }) => [s.sendBtn, pressed && s.sendBtnPressed]}
                onPress={() => setInput("")}
              >
                <View style={s.sendBtnShadow} />
                <LinearGradient
                  colors={[C.green, C.greenDark]}
                  style={s.sendBtnFace}
                >
                  <UpArrowIcon width={18} height={18} />
                  <Text style={s.sendBtnText}>SEND</Text>
                </LinearGradient>
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
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  iconBtn: { width: 50, height: 50, paddingBottom: 4, paddingRight: 4 },
  iconBtnPressed: { paddingBottom: 0, paddingRight: 0, paddingTop: 4, paddingLeft: 4 },
  iconBtnShadow: {
    position: "absolute",
    left: 4,
    top: 4,
    right: 0,
    bottom: 0,
    backgroundColor: C.ink,
    borderRadius: 12,
  },
  iconBtnFace: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, gap: 4 },
  headerTitle: {
    fontFamily: SFPro.displayBold,
    fontSize: 18,
    color: C.ink,
    letterSpacing: -0.3,
  },
  headerMetaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  headerMeta: {
    fontFamily: SFMono.semiBold,
    fontSize: 11,
    color: C.ink,
    letterSpacing: 0.3,
  },

  energyOuter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  energyShell: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  energyFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: C.green,
  },
  energySheen: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  energyLabel: {
    fontFamily: SFMono.bold,
    fontSize: 9,
    color: C.ink,
    letterSpacing: 0.6,
  },

  // Messages
  messages: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, gap: 14 },

  // User bubble
  userOuter: { alignSelf: "flex-end", maxWidth: "85%", paddingBottom: 4, paddingRight: 4 },
  userShadow: {
    position: "absolute",
    left: 4,
    top: 4,
    right: 0,
    bottom: 0,
    backgroundColor: C.ink,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  userBubble: {
    backgroundColor: "#A8E063",
    borderWidth: 2,
    borderColor: C.ink,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: {
    fontFamily: SFPro.bold,
    fontSize: 15.5,
    color: C.ink,
    lineHeight: 22,
    letterSpacing: -0.2,
  },

  // Tool pickup
  pickupOuter: { paddingBottom: 3, paddingRight: 3, alignSelf: "stretch" },
  pickupShadow: {
    position: "absolute",
    left: 3,
    top: 3,
    right: 0,
    bottom: 0,
    backgroundColor: C.ink,
    borderRadius: 12,
  },
  pickupBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.yellow,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.ink,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pickupEmoji: { fontSize: 16 },
  pickupVerbBox: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: C.ink,
    borderRadius: 4,
  },
  pickupVerb: { fontFamily: SFMono.bold, fontSize: 10, color: C.yellow, letterSpacing: 0.6 },
  pickupLabel: {
    flex: 1,
    fontFamily: SFMono.semiBold,
    fontSize: 12,
    color: C.ink,
    letterSpacing: -0.1,
  },
  pickupXP: {
    fontFamily: SFMono.bold,
    fontSize: 11,
    color: C.purpleDark,
    letterSpacing: 0.4,
  },

  // Agent name tag (above the parchment card)
  agentNameTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    marginLeft: 4,
  },
  agentAvatarBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  agentNameText: {
    fontFamily: SFPro.displayBold,
    fontSize: 13,
    color: C.ink,
    letterSpacing: 0.6,
  },
  agentLevelChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.purple,
  },
  agentLevelText: { fontFamily: SFMono.bold, fontSize: 10, color: "#FFF", letterSpacing: 0.5 },

  // Permission quest
  questBanner: {
    backgroundColor: C.ink,
    paddingVertical: 8,
    alignItems: "center",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  questBannerText: {
    fontFamily: SFPro.displayBold,
    fontSize: 13,
    color: C.yellow,
    letterSpacing: 1.2,
  },
  questBody: { padding: 14, gap: 10 },
  questTitle: { fontFamily: SFPro.bold, fontSize: 13, color: C.ink, letterSpacing: 0.4 },
  questToolName: {
    fontFamily: SFPro.displayBold,
    fontSize: 22,
    color: C.ink,
    letterSpacing: -0.3,
  },
  questCmdBox: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: C.ink,
  },
  questCmdText: { fontFamily: SFMono.medium, fontSize: 13, color: C.yellow, lineHeight: 18 },
  questBtnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  questBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.ink,
  },
  questBtnPressed: { transform: [{ translateY: 2 }] },
  questDecline: { backgroundColor: C.red },
  questAccept: { backgroundColor: C.green },
  questBtnText: { fontFamily: SFPro.displayBold, fontSize: 14, color: "#FFF", letterSpacing: 0.6 },

  // Streaming
  bounceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  bounceDot: { fontSize: 14, color: C.purple, marginHorizontal: 1 },
  bounceLabel: {
    fontFamily: SFPro.bold,
    fontSize: 13,
    color: C.ink,
    marginLeft: 6,
    letterSpacing: -0.1,
  },

  // Input
  inputWrap: { paddingHorizontal: 12, paddingTop: 8 },
  inputCardShadow: {
    position: "absolute",
    left: 16,
    top: 12,
    right: 8,
    bottom: 8,
    backgroundColor: C.ink,
    borderRadius: 18,
  },
  inputCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: C.ink,
    padding: 12,
    gap: 10,
  },
  input: {
    fontFamily: SFPro.medium,
    fontSize: 16,
    color: C.ink,
    minHeight: 36,
    maxHeight: 110,
    padding: 0,
  },
  equipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  equipSlot: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.yellow,
  },
  equipLabel: { fontFamily: SFMono.bold, fontSize: 8, color: C.ink, letterSpacing: 0.6 },
  equipValue: { fontFamily: SFPro.bold, fontSize: 12, color: C.ink, letterSpacing: -0.1 },
  sendBtn: { paddingBottom: 4, paddingRight: 4 },
  sendBtnPressed: { paddingBottom: 0, paddingRight: 0, paddingTop: 4, paddingLeft: 4 },
  sendBtnShadow: {
    position: "absolute",
    left: 4,
    top: 4,
    right: 0,
    bottom: 0,
    backgroundColor: C.ink,
    borderRadius: 12,
  },
  sendBtnFace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.ink,
  },
  sendBtnText: { fontFamily: SFPro.displayBold, fontSize: 14, color: "#FFF", letterSpacing: 0.6 },
});
