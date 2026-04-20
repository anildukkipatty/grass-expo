import { BlurView } from "expo-blur";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddIcon from "@/assets/images/new-design/navbar/add-icon.svg";
import AddNewIcon from "@/assets/images/new-design/navbar/add-new-icon.svg";
import ChatGptIcon from "@/assets/images/new-design/navbar/chatgpt.svg";
import ClaudeIcon from "@/assets/images/new-design/navbar/claude.svg";
import CompletedIcon from "@/assets/images/new-design/navbar/completed-icon.svg";
import FolderIcon from "@/assets/images/new-design/navbar/folder-icon.svg";
import GeminiIcon from "@/assets/images/new-design/navbar/gemini.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import GitIcon from "@/assets/images/new-design/navbar/git-icon.svg";
import HomeIcon from "@/assets/images/new-design/navbar/home-icon.svg";
import MetaIcon from "@/assets/images/new-design/navbar/meta.svg";
import NotificationIcon from "@/assets/images/new-design/navbar/notifcation.svg";
import OpenCodeIcon from "@/assets/images/new-design/navbar/opencode.svg";
import PermissionIcon from "@/assets/images/new-design/navbar/permission-icon.svg";
import ProgressIcon from "@/assets/images/new-design/navbar/progress-icon.svg";
import ReposIcon from "@/assets/images/new-design/navbar/repos.svg";
import UserIcon from "@/assets/images/new-design/navbar/user-icon.svg";
import WaitingIcon from "@/assets/images/new-design/navbar/waiting-for-completion-icon.svg";
import LogoIcon from "@/assets/images/new-design/onboarding/logo.svg";

import { SFPro } from "@/constants/theme";
import { Stack } from "expo-router";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentKey = "claude" | "chatgpt" | "gemini" | "meta" | "opencode";
type TabName = "home" | "permissions" | "repos";
type ThreadStatus = "completed" | "progress" | "waiting" | null;

// ─── Mock data ────────────────────────────────────────────────────────────────

const REPOS: { id: string; name: string; branch: string; language: string }[] =
  [
    { id: "1", name: "Grass-welcome", branch: "main", language: "Python" },
    { id: "2", name: "api-server", branch: "dev", language: "Markdown" },
    { id: "3", name: "grocery-tracker", branch: "main", language: "Swift" },
  ];

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
  status: ThreadStatus;
}[] = [
  {
    id: "1",
    agent: "chatgpt",
    message: "--- refactor auth middleware ---",
    time: "3m",
    command: "grass-start",
    agentName: "GPT-4",
    status: "waiting",
  },
  {
    id: "2",
    agent: "claude",
    message: "fix: login still breaks on safari",
    time: "3m",
    command: "cloudy-valley",
    agentName: "Claude",
    status: "completed",
  },
  {
    id: "3",
    agent: "gemini",
    message: "--- continued from last time ---",
    time: "3m",
    command: "sunrise-harbour",
    agentName: "Gemini 3.1",
    status: "progress",
  },
  {
    id: "4",
    agent: "meta",
    message: "fix: login still breaks on safari",
    time: "3m",
    command: "conductor",
    agentName: "Meta",
    status: "completed",
  },
  {
    id: "5",
    agent: "opencode",
    message: "refactor ( where do i even s...",
    time: "3m",
    command: "cloudy-valley",
    agentName: "Opencode",
    status: "waiting",
  },
  {
    id: "6",
    agent: "chatgpt",
    message: "--- refactor auth middleware ---",
    time: "3m",
    command: "grass-start",
    agentName: "GPT-4",
    status: "progress",
  },
  {
    id: "7",
    agent: "claude",
    message: "fix: login still breaks on safari",
    time: "3m",
    command: "cloudy-valley",
    agentName: "Claude",
    status: "completed",
  },
];

const AGENT_ICONS: Record<
  AgentKey,
  React.FC<{ width: number; height: number; color?: string }>
> = {
  claude: ClaudeIcon,
  chatgpt: ChatGptIcon,
  gemini: GeminiIcon,
  meta: MetaIcon,
  opencode: OpenCodeIcon,
};

// ─── Tab config ───────────────────────────────────────────────────────────────

const TAB_ITEMS: {
  name: TabName;
  Icon: React.FC<{ width: number; height: number; color?: string }>;
  label: string;
}[] = [
  { name: "home", Icon: HomeIcon, label: "Home" },
  { name: "permissions", Icon: PermissionIcon, label: "Permissions" },
  { name: "repos", Icon: ReposIcon, label: "Repos" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewNavbarScreen() {
  const [activeTab, setActiveTab] = useState<TabName>("home");
  const { bottom } = useSafeAreaInsets();

  // Sliding pill animation
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 | 1 | 2
  const [tabAreaWidth, setTabAreaWidth] = useState(0);
  const tabWidth = tabAreaWidth > 0 ? tabAreaWidth / TAB_ITEMS.length : 0;

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  const switchTab = (tab: TabName, idx: number) => {
    setActiveTab(tab);
    Animated.spring(slideAnim, {
      toValue: idx,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  return (
    <Stack.Screen options={{ headerShown: false }}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconWrap}>
            <UserIcon width={28} height={28} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <LogoIcon width={35} height={20} />
            <Text style={styles.headerTitle}>Grass</Text>
          </View>
          <TouchableOpacity style={styles.headerIconWrap}>
            <NotificationIcon width={28} height={28} />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>

        {/* ── Machine Carousel (static, not scrollable vertically) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          style={styles.carouselWrapper}
        >
          {/* Add new */}
          <View style={styles.machineItem}>
            <TouchableOpacity style={styles.addNewCircle} activeOpacity={0.75}>
              <AddNewIcon width={28} height={28} />
            </TouchableOpacity>
            <Text style={styles.addNewLabel}>Add new</Text>
          </View>
          {/* Machine items */}
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

        {activeTab === "repos" ? (
          /* ── Repos screen ── */
          <View style={styles.reposContainer}>
            {/* Sticky action buttons */}
            <View style={styles.repoActionRow}>
              <TouchableOpacity
                style={styles.repoActionBtn}
                activeOpacity={0.75}
              >
                <AddIcon width={30} height={30} />
                <Text style={styles.repoActionText}>Add new repo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.repoActionBtn}
                activeOpacity={0.75}
              >
                <GitIcon width={30} height={16} />
                <Text style={styles.repoActionText}>Clone from GitHub</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable repo list */}
            <ScrollView
              style={styles.repoScrollList}
              contentContainerStyle={{ paddingBottom: bottom + 80 + 16 }}
              showsVerticalScrollIndicator={false}
            >
              {REPOS.map((repo) => (
                <TouchableOpacity
                  key={repo.id}
                  style={styles.repoItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.repoInfo}>
                    <Text style={styles.repoName}>{repo.name}</Text>
                    <View style={styles.repoBranchRow}>
                      <GitBranchIcon
                        width={14}
                        height={14}
                        style={styles.repoBranchIconSvg}
                      />
                      <Text style={styles.repoBranchText}>{repo.branch}</Text>
                    </View>
                  </View>
                  <View style={styles.repoLanguageBadge}>
                    <Text style={styles.repoLanguageText}>{repo.language}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <>
            {/* ── Section header (static) ── */}
            <Text style={styles.sectionHeader}>Recent threads</Text>

            {/* ── Scrollable thread list only ── */}
            <ScrollView
              style={styles.threadList}
              contentContainerStyle={{ paddingBottom: bottom + 80 + 16 }}
              showsVerticalScrollIndicator={false}
            >
              {THREADS.map((thread) => {
                const AgentIcon = AGENT_ICONS[thread.agent];
                return (
                  <TouchableOpacity
                    key={thread.id}
                    style={styles.threadItem}
                    activeOpacity={0.7}
                  >
                    <View style={styles.agentIconBox}>
                      <AgentIcon width={50} height={50} />
                    </View>
                    <View style={styles.threadContent}>
                      <View style={styles.threadTopRow}>
                        <Text style={styles.threadMessage} numberOfLines={1}>
                          {thread.message}
                        </Text>
                        <Text style={styles.threadTime}>{thread.time}</Text>
                      </View>
                      <View style={styles.threadBottomRow}>
                        <View style={styles.threadCommandRow}>
                          <FolderIcon height={16} width={16} />
                          <Text style={styles.commandText}>
                            {thread.command}
                          </Text>
                        </View>
                        {thread.status === "completed" && (
                          <CompletedIcon width={14} height={14} />
                        )}
                        {thread.status === "progress" && (
                          <ProgressIcon width={14} height={14} />
                        )}
                        {thread.status === "waiting" && (
                          <WaitingIcon width={14} height={14} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── Bottom Navigation ── */}
        <View style={[styles.bottomNavWrapper, { bottom: (bottom || 0) + 8 }]}>
          {/* Glassy background */}
          <BlurView
          // intensity={70}
          // tint="systemUltraThinMaterialLight"
          // style={StyleSheet.absoluteFill}
          />

          <View style={styles.bottomNavInner}>
            {/* Tab area with sliding pill */}
            <View
              style={styles.tabArea}
              onLayout={(e) => {
                setTabAreaWidth(e.nativeEvent.layout.width);
              }}
            >
              {/* Sliding pill indicator */}
              {tabAreaWidth > 0 && (
                <Animated.View
                  style={[
                    styles.slidingPill,
                    { width: tabWidth, transform: [{ translateX }] },
                  ]}
                />
              )}
              {TAB_ITEMS.map(({ name, Icon, label }, idx) => (
                <TouchableOpacity
                  key={name}
                  style={styles.navTab}
                  activeOpacity={0.7}
                  onPress={() => switchTab(name, idx)}
                >
                  <Icon
                    width={24}
                    height={24}
                    color={activeTab === name ? "#1C1C1E" : "#3C3C43"}
                  />
                  <Text
                    style={[
                      styles.navLabel,
                      activeTab === name && styles.navLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add button — hidden on repos tab */}
            {activeTab !== "repos" && (
              <TouchableOpacity style={styles.addButton}>
                <AddIcon width={38} height={28} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Stack.Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    lineHeight: 28,
    color: "#000",
    letterSpacing: -0.415,
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

  // Machine carousel
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

  // Section header (static, outside ScrollView)
  sectionHeader: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 16,
  },

  // Thread list (scrollable)
  threadList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  repoScrollList: {
    flex: 1,
  },

  // Thread item
  threadItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
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
    justifyContent: "space-between",
  },
  threadCommandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  // commandBadge: {
  //   borderRadius: 5,
  //   backgroundColor: "#E3FDD7",
  //   paddingHorizontal: 6,
  //   paddingVertical: 2,
  // },
  commandText: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#9F9F9F",
    marginLeft: 5,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  agentNameText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#72C44E",
  },

  // Bottom navigation
  bottomNavWrapper: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    borderRadius: 28,
    overflow: "hidden",
  },
  bottomNavInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  // Tab area holds the 3 tabs + sliding pill
  tabArea: {
    flex: 1,
    flexDirection: "row",
    position: "relative",
    backgroundColor: "rgba(0, 0, 0, 0.00)",
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#D1D1D1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    padding: 4,
  },
  // Sliding pill behind active tab
  slidingPill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    borderRadius: 60,
    backgroundColor: "#FFFFFF50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  navTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 60,
    gap: 3,
  },
  navLabel: {
    fontFamily: SFPro.medium,
    fontSize: 10,
    fontWeight: "500",
    color: "#000",
  },
  navLabelActive: {
    color: "#3D841E",
    fontWeight: "600",
  },
  addButton: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 296,
    backgroundColor: "rgba(0, 0, 0, 0.00)",
  },

  // Repos screen
  bottomNavInnerCentered: {
    justifyContent: "center",
  },
  reposContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  repoActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  repoActionBtn: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    alignItems: "center",
    justifyContent: "center",
    // gap: 6,
    paddingHorizontal: 10,
    // paddingVertical: 6,
  },
  repoActionText: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#000",
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  repoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  repoInfo: {
    gap: 4,
  },
  repoName: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  repoBranchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  repoBranchIconSvg: {
    // marginRight: 2,
  },
  repoBranchText: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#9F9F9F",
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  repoLanguageBadge: {
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 8,
    // paddingVertical: 6,
  },
  repoLanguageText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#9F9F9F",
    lineHeight: 18,
    letterSpacing: -0.3,
  },
});
