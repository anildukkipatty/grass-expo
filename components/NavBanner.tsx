import ChatGptIcon from "@/assets/images/new-design/navbar/chatgpt.svg";
import GetMoreCardSvg from "@/assets/images/navbar-screens/get-more-card.svg";
import { NationalPark } from "@/constants/theme";
import { extractHost, useNavbar } from "@/contexts/navbar-context";
import { isRelayUrl, relayHost } from "@/store/url-store";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── VmTabBar ─────────────────────────────────────────────────────────────────

export function VmTabBar() {
  const {
    activeVmTab,
    setActiveVmTab,
    vmUrls,
    vmUrlStatuses,
    primaryVmUrl,
    handleRemoveUserVm,
    setGetMoreVisible,
    grassSandboxBlockedByUsageLimit,
    requestGrassVmUsageRecheck,
    setSheetInitialView,
    grassVmChecking,
    incompatUrls,
  } = useNavbar();

  return (
    <View style={styles.tabsBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabPillsGroup}
        style={styles.tabPillsOuter}
      >
        {vmUrls.map((url, idx) => {
          const isActive = activeVmTab === idx;
          // Only label as GrassVM when we know the managed primary URL — never use index 0 as a
          // stand-in (primaryVmUrl is unset until storage/heartbeat hydrate, so custom URLs at
          // index 0 were incorrectly shown as GrassVM).
          const isPrimaryVm = !!primaryVmUrl && url === primaryVmUrl;
          const tabLabel = isPrimaryVm ? "GrassVM" : isRelayUrl(url) ? `${relayHost(url)} (relay)` : extractHost(url);
          const isUserVm = primaryVmUrl ? url !== primaryVmUrl : idx > 0;
          // undefined = not yet polled → show grey; true = green; false = red
          const status = vmUrlStatuses.get(url);
          const isIncompat = incompatUrls.has(url);
          return (
            <View key={url} style={styles.tabPillWrap}>
              <TouchableOpacity
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                onPress={() => {
                  const wasAlreadyOnThisTab = activeVmTab === idx;
                  setActiveVmTab(idx);
                  if (
                    grassSandboxBlockedByUsageLimit &&
                    wasAlreadyOnThisTab &&
                    isPrimaryVm
                  ) {
                    requestGrassVmUsageRecheck();
                  }
                }}
                activeOpacity={0.75}
              >
                {isPrimaryVm && grassVmChecking ? (
                  <View style={{ width: 8, height: 8, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator
                      size="small"
                      color={isActive ? "#1C1C1E" : "#6C6C70"}
                      style={{ transform: [{ scale: 0.4 }] }}
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.vmDot,
                      isIncompat
                        ? styles.vmDotUnknown
                        : status === undefined
                          ? styles.vmDotUnknown
                          : status
                            ? styles.vmDotActive
                            : styles.vmDotStopped,
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.tabPillText,
                    isActive && styles.tabPillTextActive,
                    isUserVm && styles.userVmTabText,
                    isIncompat && styles.tabPillTextIncompat,
                  ]}
                  numberOfLines={1}
                >
                  {tabLabel}
                </Text>
              </TouchableOpacity>
              {isUserVm ? (
                <TouchableOpacity
                  style={styles.userVmCloseBtn}
                  onPress={() => handleRemoveUserVm(idx)}
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
      <TouchableOpacity
        onPress={() => {
          setSheetInitialView("connect-laptop");
          setGetMoreVisible(true);
        }}
        activeOpacity={0.7}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        style={{ paddingHorizontal: 8, paddingVertical: 6 }}
      >
        <Text style={styles.tabAddText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── AgentPickerSheet ─────────────────────────────────────────────────────────

function AgentCardRow({
  agent,
  onPress,
}: {
  agent: Agent;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.agentCard}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 50,
            bounciness: 2,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 4,
          }).start()
        }
        activeOpacity={1}
      >
        {agent.logoSvg ? (
          <View style={[styles.agentLogo, styles.agentLogoSvgWrap]}>
            <agent.logoSvg width={44} height={44} />
          </View>
        ) : (
          <Image source={agent.logo} style={styles.agentLogo} />
        )}
        <View style={styles.agentTextGroup}>
          <Text style={styles.agentLabel}>{agent.label}</Text>
          <Text style={styles.agentDesc}>{agent.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── AgentPickerSheet (modal) ─────────────────────────────────────────────────

type Agent = {
  id: string;
  label: string;
  description: string;
  logo?: ImageSourcePropType;
  logoSvg?: React.FC<{ width: number; height: number }>;
};

const AGENTS: readonly Agent[] = [
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
  {
    id: "codex",
    label: "Codex",
    description: "OpenAI's AI coding agent",
    logoSvg: ChatGptIcon,
  },
];

export function AgentPickerSheet({
  pendingRepo,
  onDismiss,
  onSelectAgent,
}: {
  pendingRepo: { name: string } | null;
  onDismiss: () => void;
  onSelectAgent: (agentId: string) => void;
}) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  useEffect(() => {
    if (pendingRepo) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [pendingRepo]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={onDismiss}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.sheetHandle}
    >
      <BottomSheetView style={styles.sheetContent}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Select an agent</Text>
          <TouchableOpacity onPress={onDismiss} hitSlop={8}>
            <Ionicons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        {pendingRepo && (
          <Text style={styles.sheetRepoName} numberOfLines={1}>
            {pendingRepo.name}
          </Text>
        )}
        <View style={styles.agentList}>
          {AGENTS.map((agent) => (
            <AgentCardRow
              key={agent.id}
              agent={agent}
              onPress={() => onSelectAgent(agent.id)}
            />
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

// ─── NavBanner ────────────────────────────────────────────────────────────────

export function NavBanner() {
  const { setGetMoreVisible, setSheetInitialView } = useNavbar();

  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  const isPerms = pathname.includes("/perms");
  const isRepos = pathname.includes("/repos");
  const bannerHeight = isPerms || isRepos ? 160 : 220;

  // Always render the image at max height so it never repaints on tab switch.
  // The clipping view shrinks to the actual bannerHeight to hide the excess.
  const MAX_BANNER_HEIGHT = 270;

  return (
    <>
      {/* ─── BANNER — position:absolute so the sheet slides over it ─── */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: bannerHeight + insets.top,
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {/* Image always rendered at max height — never resizes, no repaint */}
        <ExpoImage
          source={require("@/assets/images/navbar-screens/banner-image.png")}
          style={[
            StyleSheet.absoluteFill,
            { height: MAX_BANNER_HEIGHT + insets.top },
          ]}
          contentFit="cover"
          contentPosition="top center"
        />
        <View style={{ flex: 1 }}>
          {/* <LinearGradient
            colors={["#000000", "rgba(0,0,0,0)"]}
            locations={[0, 0.5741]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          /> */}

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
                <Ionicons name="person-circle-outline" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Get More card — home tab only */}
          {!isPerms && !isRepos && (
            <TouchableOpacity
              style={styles.getMoreCard}
              onPress={() => {
                setSheetInitialView("home");
                setGetMoreVisible(true);
              }}
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
                  <GetMoreCardSvg width={52} height={52} />
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
        </View>
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  permissionsTitle: {
    fontFamily: NationalPark.bold,
    fontSize: 24,
    fontWeight: "700",
    // color: "#004410",
    color: "#fff",
    letterSpacing: -0.5,
  },
  reposTitle: {
    fontFamily: NationalPark.bold,
    fontSize: 24,
    fontWeight: "700",
    // color: "#004410",
    color: "#fff",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  grassTitle: {
    fontFamily: NationalPark.bold,
    fontSize: 24,
    // fontWeight: 700,
    // color: "#004410",
    color: "#fff",
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
    width: 30,
    height: 30,
    // overflow: "hidden",
    // borderRadius: 30,
    // borderColor: "rgba(255, 255, 255, 0.30)",
    // borderWidth: 1,
  },
  avatarImg: { width: 30, height: 30 },
  getMoreCard: {
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 30,
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
    // borderRadius: 12,
    // overflow: "hidden",
    // backgroundColor: "rgba(230, 255, 235, 0.6)",
  },
  getMoreIcon: { width: 52, height: 52 },
  getMoreTextWrap: { flex: 1 },
  getMoreTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 3,
  },
  getMoreSub: { fontSize: 14, color: "#868686", fontWeight: "500" },
  tabsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  tabPillsOuter: {
    flexGrow: 0,
    flexShrink: 1,
    backgroundColor: "#DBDBDB",
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#D1D1D1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabPillsGroup: {
    flexDirection: "row",
    padding: 4,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 60,
    gap: 6,
  },
  tabPillWrap: { flexDirection: "row", alignItems: "center" },
  tabPillActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  vmDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1 },
  vmDotActive: { backgroundColor: "#2ECC40", borderColor: "#1a7a28" },
  vmDotStopped: { backgroundColor: "#FF3B30", borderColor: "#8B0000" },
  vmDotUnknown: { backgroundColor: "#9ca3af", borderColor: "#6b7280" },
  tabPillText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#3C3C43",
    // maxWidth: 140,
  },
  userVmTabText: { maxWidth: 105 },
  userVmCloseBtn: {
    marginLeft: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  tabPillTextActive: { color: "#1C1C1E", fontWeight: "600" },
  tabPillTextIncompat: { color: "#9ca3af", textDecorationLine: "line-through" },
  tabAddText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    paddingHorizontal: 4,
  },

  // Agent picker sheet
  sheetBg: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#fff",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 48 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#8E8E93",
  },
  sheetRepoName: {
    fontSize: 15,
    fontWeight: "500",
    paddingHorizontal: 4,
    marginBottom: 14,
    opacity: 0.6,
    color: "#1C1C1E",
  },
  agentList: { gap: 10 },
  agentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(0,0,0,0.02)",
    gap: 14,
  },
  agentLogo: { width: 44, height: 44, borderRadius: 10 },
  agentLogoSvgWrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  agentTextGroup: { flex: 1, gap: 3 },
  agentLabel: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
    color: "#1C1C1E",
  },
  agentDesc: { fontSize: 13, opacity: 0.7, color: "#1C1C1E" },
});
