import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddNewIcon from "@/assets/images/new-design/navbar/add-new-icon.svg";
import ChatGptIcon from "@/assets/images/new-design/navbar/chatgpt.svg";
import ClaudeIcon from "@/assets/images/new-design/navbar/claude.svg";
import GeminiIcon from "@/assets/images/new-design/navbar/gemini.svg";
import MetaIcon from "@/assets/images/new-design/navbar/meta.svg";
import NotificationIcon from "@/assets/images/new-design/navbar/notifcation.svg";
import OpenCodeIcon from "@/assets/images/new-design/navbar/opencode.svg";
import UserIcon from "@/assets/images/new-design/navbar/user-icon.svg";
import LogoIcon from "@/assets/images/new-design/onboarding/logo.svg";

import { SFPro } from "@/constants/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentKey = "claude" | "chatgpt" | "gemini" | "meta" | "opencode";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MACHINES = [
  {
    id: "1",
    name: "Son of Anton",
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-one.png"),
    borderColor: "#72C44E",
    backgroundColor: "#E3FDD7",
  },
  {
    id: "2",
    name: "Sam's Mac...",
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-two.png"),
    borderColor: "#D8A4E8",
    backgroundColor: "#f0c5e8",
  },
  {
    id: "3",
    name: "iMac",
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-three.png"),
    borderColor: "#BDBDBD",
    backgroundColor: "#D9D9D9",
  },
  {
    id: "4",
    name: "Da...",
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-one.png"),
    borderColor: "#A0C4E8",
    backgroundColor: "#E3FDD7",
  },
];

const THREADS: {
  id: string;
  agent: AgentKey;
  message: string;
  time: string;
  command: string;
  agentName: string;
}[] = [
  { id: "1", agent: "chatgpt", message: "--- refactor auth middleware ---", time: "3m", command: "grass-start", agentName: "GPT-4" },
  { id: "2", agent: "claude", message: "fix: login still breaks on safari", time: "3m", command: "cloudy-valley", agentName: "Claude" },
  { id: "3", agent: "gemini", message: "--- continued from last time ---", time: "3m", command: "sunrise-harbour", agentName: "Gemini 3.1" },
  { id: "4", agent: "meta", message: "fix: login still breaks on safari", time: "3m", command: "conductor", agentName: "Meta" },
  { id: "5", agent: "opencode", message: "refactor ( where do i even s...", time: "3m", command: "cloudy-valley", agentName: "Opencode" },
  { id: "6", agent: "chatgpt", message: "--- refactor auth middleware ---", time: "3m", command: "grass-start", agentName: "GPT-4" },
  { id: "7", agent: "claude", message: "fix: login still breaks on safari", time: "3m", command: "cloudy-valley", agentName: "Claude" },
];

const AGENT_ICONS: Record<AgentKey, React.FC<{ width: number; height: number; color?: string }>> = {
  claude: ClaudeIcon,
  chatgpt: ChatGptIcon,
  gemini: GeminiIcon,
  meta: MetaIcon,
  opencode: OpenCodeIcon,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { bottom } = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconWrap}>
          <UserIcon width={28} height={28} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LogoIcon width={35} height={20} />
          <Text style={styles.headerTitle}>Grass</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaText}>beta</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerIconWrap}>
          <NotificationIcon width={28} height={28} />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      {/* ── Machine Carousel ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        style={styles.carouselWrapper}
      >
        <View style={styles.machineItem}>
          <TouchableOpacity style={styles.addNewCircle} activeOpacity={0.75}>
            <AddNewIcon width={28} height={28} />
          </TouchableOpacity>
          <Text style={styles.addNewLabel}>Add new</Text>
        </View>
        {MACHINES.map((machine) => (
          <View key={machine.id} style={styles.machineItem}>
            <View
              style={[
                styles.machineRing,
                { borderColor: machine.borderColor },
                { backgroundColor: machine.backgroundColor },
              ]}
            >
              <Image source={machine.image} style={styles.machineImage} />
            </View>
            <Text style={styles.machineName} numberOfLines={1}>
              {machine.name}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* ── Section header ── */}
      <Text style={styles.sectionHeader}>Recent threads</Text>

      {/* ── Thread list ── */}
      <ScrollView
        style={styles.threadList}
        contentContainerStyle={{ paddingBottom: bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {THREADS.map((thread) => {
          const AgentIcon = AGENT_ICONS[thread.agent];
          return (
            <TouchableOpacity key={thread.id} style={styles.threadItem} activeOpacity={0.7}>
              <View style={styles.agentIconBox}>
                <AgentIcon width={36} height={36} />
              </View>
              <View style={styles.threadContent}>
                <View style={styles.threadTopRow}>
                  <Text style={styles.threadMessage} numberOfLines={1}>
                    {thread.message}
                  </Text>
                  <Text style={styles.threadTime}>{thread.time}</Text>
                </View>
                <View style={styles.threadBottomRow}>
                  <View style={styles.commandBadge}>
                    <Text style={styles.commandText}>{thread.command}</Text>
                  </View>
                  <Text style={styles.agentNameText}> · {thread.agentName}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    justifyContent: "flex-end",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  headerTitle: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    color: "#000",
    letterSpacing: -0.415,
  },
  betaBadge: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#72C44E",
    backgroundColor: "#C3F6AD",
    marginBottom: 3,
  },
  betaText: {
    color: "#123005",
    fontSize: 11,
    fontFamily: SFPro.medium,
  },
  notifBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#FF0004",
    borderWidth: 2,
    borderColor: "#F7FFF3",
  },
  carouselWrapper: {
    flexGrow: 0,
    paddingHorizontal: 16,
  },
  carouselContent: {
    paddingVertical: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  machineItem: {
    alignItems: "center",
    gap: 6,
    width: 80,
  },
  addNewCircle: {
    width: 80,
    height: 80,
    borderRadius: 70,
    backgroundColor: "#E3FDD7",
    borderWidth: 2,
    borderColor: "#72C44E",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addNewLabel: {
    fontFamily: SFPro.medium,
    fontSize: 12,
    color: "#3D841E",
    textAlign: "center",
  },
  machineRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
  },
  machineImage: {
    width: 62,
    height: 62,
    resizeMode: "contain",
  },
  machineName: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#808080",
    textAlign: "center",
    maxWidth: 80,
    lineHeight: 18,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  threadList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  threadItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
  },
  agentIconBox: {
    overflow: "hidden",
    marginRight: 10,
  },
  threadContent: {
    flex: 1,
  },
  threadTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  threadMessage: {
    flex: 1,
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#000",
    marginRight: 8,
  },
  threadTime: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
  },
  threadBottomRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  commandBadge: {
    borderRadius: 5,
    backgroundColor: "#E3FDD7",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  commandText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#72C44E",
  },
  agentNameText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#72C44E",
  },
});
