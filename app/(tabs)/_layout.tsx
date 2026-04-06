import { GetMoreSheet } from "@/components/GetMoreSheet";
import {
  NavbarProvider,
  extractHost,
  orderVmUrls,
  useNavbar,
} from "@/contexts/navbar-context";
import { getEntry, getRepoDetailsStore, listReposStore } from "@/store/connection-store";
import { getUrls } from "@/store/url-store";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, usePathname, useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── VmTabBar ─────────────────────────────────────────────────────────────────

function VmTabBar({
  activeVmTab,
  onTabPress,
  vmRunning,
  vmUrls,
  onAddPress,
  onRemoveVm,
  primaryVmUrl,
}: {
  activeVmTab: number;
  onTabPress: (idx: number) => void;
  vmRunning: boolean;
  vmUrls: string[];
  onAddPress: () => void;
  onRemoveVm: (idx: number) => void;
  primaryVmUrl?: string;
}) {
  return (
    <View style={styles.tabsBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabPillsGroup}
        style={{ flexShrink: 1 }}
      >
        {vmUrls.map((url, idx) => {
          const isActive = activeVmTab === idx;
          const isPrimaryVm = primaryVmUrl ? url === primaryVmUrl : idx === 0;
          const tabLabel = isPrimaryVm ? "GrassVM" : extractHost(url);
          const isUserVm = !isPrimaryVm;
          return (
            <View key={url} style={styles.tabPillWrap}>
              <TouchableOpacity
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                onPress={() => onTabPress(idx)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.vmDot,
                    vmRunning ? styles.vmDotActive : styles.vmDotStopped,
                  ]}
                />
                <Text
                  style={[
                    styles.tabPillText,
                    isActive && styles.tabPillTextActive,
                    isUserVm && styles.userVmTabText,
                  ]}
                  numberOfLines={1}
                >
                  {tabLabel}
                </Text>
              </TouchableOpacity>
              {isUserVm ? (
                <TouchableOpacity
                  style={styles.userVmCloseBtn}
                  onPress={() => onRemoveVm(idx)}
                  hitSlop={8}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={11} color="#6C6C70" />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* +Add — no background, banner image shows through */}
      <TouchableOpacity onPress={onAddPress} activeOpacity={0.7}>
        <Text style={styles.tabAddText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── TabsLayoutInner ──────────────────────────────────────────────────────────

function TabsLayoutInner() {
  const {
    permissions,
    vmUrls,
    activeVmTab,
    setActiveVmTab,
    vmRunning,
    primaryVmUrl,
    selectedVmUrl,
    handleRemoveUserVm,
    getMoreVisible,
    setGetMoreVisible,
    sheetInitialView,
    setSheetInitialView,
    pendingRepo,
    setPendingRepo,
    handleSelectAgent,
    setVmUrls,
    setRepos,
    setReposLoading,
  } = useNavbar();

  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  const isPerms = pathname.includes("/perms");
  const isRepos = pathname.includes("/repos");
  const bannerHeight = isPerms || isRepos ? 160 : 270;

  return (
    <View style={styles.root}>
      {/* ─── BANNER + VM TABS ─── */}
      <View
        style={[
          styles.bannerImg,
          { height: bannerHeight + insets.top, overflow: "hidden" },
        ]}
      >
        <ExpoImage
          source={require("@/assets/images/navbar-screens/banner-image.png")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="top center"
        />
        <View style={{ flex: 1 }}>
          {/* Bottom-to-top dark gradient */}
          <LinearGradient
            colors={["#000000", "rgba(0,0,0,0)"]}
            locations={[0, 0.5741]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Top bar */}
          {isPerms ? (
            <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
              <Text style={styles.permissionsTitle}>Permissions</Text>
            </View>
          ) : isRepos ? (
            <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
              <Text style={styles.reposTitle}>Repos</Text>
            </View>
          ) : (
            <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
              <View style={styles.brandRow}>
                <Text style={styles.grassTitle}>Grass</Text>
                <View style={styles.betaBadge}>
                  <Text style={styles.betaText}>BETA</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.avatarWrap}
                onPress={() => router.push("/settings")}
              >
                <ExpoImage
                  source={require("@/assets/images/navbar-screens/user-icon.svg")}
                  style={styles.avatarImg}
                  contentFit="contain"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Get More card — home tab only */}
          {!isPerms && !isRepos && (
            <TouchableOpacity
              style={styles.getMoreCard}
              onPress={() => setGetMoreVisible(true)}
              activeOpacity={0.85}
            >
              <BlurView
                intensity={10}
                tint="light"
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <LinearGradient
                colors={["rgba(255,255,255,0.80)", "rgba(223,255,229,0.80)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <View style={styles.getMoreInner}>
                <View style={styles.getMoreIconWrap}>
                  <Image
                    source={require("@/assets/images/navbar-screens/get-more-card.png")}
                    style={styles.getMoreIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.getMoreTextWrap}>
                  <Text style={styles.getMoreTitle}>Get more from Grass</Text>
                  <Text style={styles.getMoreSub}>
                    Connect your own agent, add repos, link your laptop
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Spacer pushes tabs to banner bottom */}
          <View style={{ flex: 1 }} />

          {/* VM Tabs sit inside banner so image shows behind +Add */}
          <VmTabBar
            activeVmTab={activeVmTab}
            onTabPress={setActiveVmTab}
            vmRunning={vmRunning}
            vmUrls={vmUrls}
            onAddPress={() => setGetMoreVisible(true)}
            onRemoveVm={handleRemoveUserVm}
            primaryVmUrl={primaryVmUrl}
          />
        </View>
      </View>

      {/* ─── NATIVE TABS ─── */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            // Floating island shape
            left: 60,
            right: 60,
            bottom: 24,
            height: 64,
            borderRadius: 32,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            backgroundColor: "transparent",
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <ExpoImage
                source={
                  focused
                    ? require("@/assets/images/navbar-screens/home-icon.svg")
                    : require("@/assets/images/navbar-screens/home-icon-inactive.svg")
                }
                style={{ width: 24, height: 24 }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="perms"
          options={{
            title: "Perms",
            tabBarBadge:
              permissions.length > 0 ? permissions.length : undefined,
            tabBarIcon: ({ focused }) => (
              <ExpoImage
                source={
                  focused
                    ? require("@/assets/images/navbar-screens/permission-icon.svg")
                    : require("@/assets/images/navbar-screens/permission-icon-inactive.svg")
                }
                style={{ width: 24, height: 24 }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="repos"
          options={{
            title: "Repos",
            tabBarIcon: ({ focused }) => (
              <ExpoImage
                source={
                  focused
                    ? require("@/assets/images/navbar-screens/repos-icon.svg")
                    : require("@/assets/images/navbar-screens/repos-icon-inactive.svg")
                }
                style={{ width: 24, height: 24 }}
              />
            ),
          }}
        />
      </Tabs>

      {/* ─── AGENT PICKER MODAL ─── */}
      <Modal
        visible={!!pendingRepo}
        transparent
        animationType="slide"
        onRequestClose={() => setPendingRepo(null)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
          activeOpacity={1}
          onPress={() => setPendingRepo(null)}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderTopWidth: 1,
              borderTopColor: "rgba(0,0,0,0.08)",
              paddingTop: 12,
              paddingHorizontal: 16,
              paddingBottom: 48,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#ccc",
                alignSelf: "center",
                marginBottom: 16,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 4,
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: "#8E8E93",
                }}
              >
                Select an agent
              </Text>
              <TouchableOpacity onPress={() => setPendingRepo(null)} hitSlop={8}>
                <Ionicons name="close" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            {pendingRepo && (
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "500",
                  paddingHorizontal: 4,
                  marginBottom: 14,
                  opacity: 0.6,
                  color: "#1C1C1E",
                }}
                numberOfLines={1}
              >
                {pendingRepo.name}
              </Text>
            )}
            <View style={{ gap: 10 }}>
              {[
                {
                  id: "claude-code",
                  label: "Claude Code",
                  description: "Anthropic's AI coding agent",
                  logo: require("@/assets/images/cluade-logo.jpg"),
                },
                {
                  id: "opencode",
                  label: "Opencode",
                  description: "Open source AI coding agent",
                  logo: require("@/assets/images/open-code.png"),
                },
              ].map((agent) => (
                <TouchableOpacity
                  key={agent.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.08)",
                    backgroundColor: "rgba(0,0,0,0.02)",
                    gap: 14,
                  }}
                  onPress={() => handleSelectAgent(agent.id)}
                  activeOpacity={0.72}
                >
                  <Image
                    source={agent.logo}
                    style={{ width: 44, height: 44, borderRadius: 10 }}
                  />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "600",
                        letterSpacing: -0.3,
                        color: "#1C1C1E",
                      }}
                    >
                      {agent.label}
                    </Text>
                    <Text
                      style={{ fontSize: 13, opacity: 0.7, color: "#1C1C1E" }}
                    >
                      {agent.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── GET MORE SHEET ─── */}
      <GetMoreSheet
        visible={getMoreVisible}
        onClose={() => setGetMoreVisible(false)}
        initialView={sheetInitialView}
        serverUrl={selectedVmUrl}
        onUrlDetected={async () => {
          const urls = await getUrls();
          setVmUrls(orderVmUrls(urls, primaryVmUrl));
          setActiveVmTab(0);
        }}
        onRepoAdded={async () => {
          if (!selectedVmUrl) return;
          setReposLoading(true);
          await listReposStore(selectedVmUrl);
          const entry = getEntry(selectedVmUrl);
          const repoList = entry?.repos ?? [];
          await Promise.all(
            repoList.map((r) => getRepoDetailsStore(selectedVmUrl, r.path)),
          );
          const updatedEntry = getEntry(selectedVmUrl);
          const details = updatedEntry?.repoDetails ?? new Map();
          setRepos(
            repoList.map((r, i) => ({
              id: String(i),
              name: r.name,
              path: r.path,
              branch: details.get(r.path)?.branch ?? "main",
              action: "Open Code",
              badge:
                details.get(r.path)?.dominantLanguage ??
                (r.isGit ? "Git" : "Folder"),
              badgeType: "gray" as const,
            })),
          );
          setReposLoading(false);
        }}
      />
    </View>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <NavbarProvider>
      <TabsLayoutInner />
    </NavbarProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },

  // Banner
  bannerImg: {
    width: "100%",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  permissionsTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#004410",
    letterSpacing: -0.5,
  },
  reposTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#004410",
    letterSpacing: -0.5,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  grassTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#004410",
  },
  betaBadge: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(0, 77, 19, 0.18)",
    backgroundColor: "#00FF79",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  betaText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#006A15",
    letterSpacing: 0.3,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E8C9A0",
  },
  avatarImg: {
    width: 36,
    height: 36,
  },

  // Get More card
  getMoreCard: {
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ACDFB6",
    overflow: "hidden",
  },
  getMoreInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    position: "relative",
    zIndex: 1,
  },
  getMoreIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(230, 255, 235, 0.6)",
  },
  getMoreIcon: {
    width: 52,
    height: 52,
  },
  getMoreTextWrap: {
    flex: 1,
  },
  getMoreTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 3,
  },
  getMoreSub: {
    fontSize: 12,
    color: "#3C3C43",
    lineHeight: 17,
  },

  // VM Tabs (inside banner)
  tabsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  tabPillsGroup: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 22,
    padding: 3,
    flexGrow: 0,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 19,
    gap: 5,
  },
  tabPillWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 2,
  },
  tabPillActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  vmDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  vmDotActive: {
    backgroundColor: "#00FF33",
    borderColor: "#004D13",
  },
  vmDotStopped: {
    backgroundColor: "#FF3B30",
    borderColor: "#8B0000",
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6C6C70",
    maxWidth: 140,
  },
  userVmTabText: {
    maxWidth: 105,
  },
  userVmCloseBtn: {
    marginLeft: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  tabPillTextActive: {
    color: "#1C1C1E",
    fontWeight: "600",
  },
  tabAddText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    paddingHorizontal: 4,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
