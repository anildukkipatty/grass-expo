import { AddRepoSlider } from "@/components/new-navbar/AddRepoSlider";
import { CloneFromGithubSlider } from "@/components/new-navbar/CloneFromGithubSlider";
import { ConfigureGitAccessSlider } from "@/components/new-navbar/ConfigureGitAccessSlider";
import { ConnectMoreSlider } from "@/components/new-navbar/ConnectMoreSlider";
import {
  Machine,
  MachineCarousel,
} from "@/components/new-navbar/MachineCarousel";
import { VM_ICONS } from "@/constants/vm-icons";
import { extractHost, useNavbar } from "@/contexts/navbar-context";
import { getAllVmMetadata, getVmName } from "@/store/vm-metadata-store";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddIcon from "@/assets/images/new-design/navbar/add-icon.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import GitIcon from "@/assets/images/new-design/navbar/git-icon.svg";

import { SFPro } from "@/constants/theme";

// ─── Static pool for VMs without saved metadata ────────────────────────────────

const VM_STYLES: {
  borderColor: string;
  backgroundColor: string;
  image: ReturnType<typeof require>;
}[] = [
  {
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-one.png"),
    borderColor: "#72C44E",
    backgroundColor: "#E3FDD7",
  },
  {
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-two.png"),
    borderColor: "#D8A4E8",
    backgroundColor: "#f0c5e8",
  },
  {
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-three.png"),
    borderColor: "#BDBDBD",
    backgroundColor: "#D9D9D9",
  },
];

const CUSTOM_VM_COLORS: { borderColor: string; backgroundColor: string }[] = [
  { borderColor: "#72C44E", backgroundColor: "#E3FDD7" },
  { borderColor: "#D8A4E8", backgroundColor: "#f0c5e8" },
  { borderColor: "#A0C4E8", backgroundColor: "#DCF0FC" },
  { borderColor: "#F4A460", backgroundColor: "#FFF0E0" },
  { borderColor: "#BDBDBD", backgroundColor: "#D9D9D9" },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReposScreen() {
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  const [connectMoreVisible, setConnectMoreVisible] = React.useState(false);
  const [addRepoVisible, setAddRepoVisible] = useState(false);
  const [cloneGithubVisible, setCloneGithubVisible] = useState(false);
  const [gitAccessVisible, setGitAccessVisible] = useState(false);

  const [vmMetadataMap, setVmMetadataMap] = useState<
    Record<string, { name: string; iconIndex: number }>
  >({});
  const [grassVmName, setGrassVmName] = useState<string | null>(null);

  const {
    vmUrls,
    activeVmTab,
    setActiveVmTab,
    primaryVmUrl,
    vmRunning,
    vmUrlStatuses,
    repos,
    reposLoading,
    refreshRepos,
  } = useNavbar();

  // Reload stored names + icons whenever the VM list changes or tab is focused
  useEffect(() => {
    getAllVmMetadata().then(setVmMetadataMap);
    getVmName().then(setGrassVmName);
  }, [vmUrls]);

  useFocusEffect(
    useCallback(() => {
      refreshRepos();
      getAllVmMetadata().then(setVmMetadataMap);
      getVmName().then(setGrassVmName);
    }, [refreshRepos]),
  );

  // Shimmer animation for skeleton
  const shimmerAnim = useRef(new Animated.Value(0.5)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Map vmUrls → Machine[] using stored name/icon when available
  const machines: Machine[] = vmUrls.map((url, i) => {
    const meta = vmMetadataMap[url];
    if (meta) {
      return {
        id: url,
        name: meta.name,
        SvgIcon: VM_ICONS[meta.iconIndex] ?? VM_ICONS[0],
        ...CUSTOM_VM_COLORS[i % CUSTOM_VM_COLORS.length],
      };
    }
    const isPrimary = url === primaryVmUrl;
    return {
      id: url,
      name: isPrimary && grassVmName ? grassVmName : extractHost(url),
      ...VM_STYLES[i % VM_STYLES.length],
    };
  });

  const selectedMachineId = vmUrls[activeVmTab] ?? undefined;

  return (
    <View style={styles.reposContainer}>
      <MachineCarousel
        machines={machines}
        selectedId={selectedMachineId}
        paddingHorizontal={0}
        onSelect={(id) => {
          const idx = vmUrls.indexOf(id);
          if (idx >= 0) setActiveVmTab(idx);
        }}
        onAddNew={() => setConnectMoreVisible(true)}
        vmUrlStatuses={vmUrlStatuses}
        vmRunning={vmRunning}
        primaryVmUrl={primaryVmUrl}
      />
      <ConnectMoreSlider
        visible={connectMoreVisible}
        onClose={() => setConnectMoreVisible(false)}
      />

      {/* Sticky action buttons */}
      <View style={styles.repoActionRow}>
        <TouchableOpacity
          style={[styles.repoActionBtn, styles.repoActionBtnFit]}
          activeOpacity={0.75}
          onPress={() => setAddRepoVisible(true)}
        >
          <AddIcon width={30} height={30} />
          <Text style={styles.repoActionText}>Add new repo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.repoActionBtn, styles.repoActionBtnFill]}
          activeOpacity={0.75}
          onPress={() => setCloneGithubVisible(true)}
        >
          <GitIcon width={30} height={16} />
          <Text style={styles.repoActionText}>Clone from GitHub</Text>
        </TouchableOpacity>
      </View>

      <AddRepoSlider
        visible={addRepoVisible}
        onClose={() => setAddRepoVisible(false)}
        serverUrl={selectedMachineId}
        onRepoAdded={refreshRepos}
      />
      <CloneFromGithubSlider
        visible={cloneGithubVisible}
        onClose={() => setCloneGithubVisible(false)}
        serverUrl={selectedMachineId}
        existingRepos={repos}
        onRepoAdded={refreshRepos}
        onConfigureGitAccess={() => setGitAccessVisible(true)}
      />
      <ConfigureGitAccessSlider
        visible={gitAccessVisible}
        onClose={() => setGitAccessVisible(false)}
      />
      {/* Scrollable repo list */}
      <ScrollView
        style={styles.repoScrollList}
        contentContainerStyle={{ paddingBottom: bottom + 80 + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={reposLoading} onRefresh={refreshRepos} />
        }
      >
        {reposLoading && repos.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.repoItem}>
              <View style={styles.repoInfo}>
                <Animated.View
                  style={[
                    styles.skeletonBar,
                    styles.skeletonBarLong,
                    { opacity: shimmerAnim },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.skeletonBar,
                    styles.skeletonBarShort,
                    { opacity: shimmerAnim },
                  ]}
                />
              </View>
              <Animated.View
                style={[styles.skeletonBadge, { opacity: shimmerAnim }]}
              />
            </View>
          ))
        ) : repos.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No repos found</Text>
          </View>
        ) : (
          repos.map((repo) => (
            <TouchableOpacity
              key={repo.id}
              style={styles.repoItem}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/new-navbar/chat-list",
                  params: { repoName: repo.name, repoPath: repo.path },
                })
              }
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
              {repo.badge ? (
                <View
                  style={[
                    styles.repoLanguageBadge,
                    repo.badgeType === "green" && styles.repoLanguageBadgeGreen,
                  ]}
                >
                  <Text
                    style={[
                      styles.repoLanguageText,
                      repo.badgeType === "green" &&
                        styles.repoLanguageTextGreen,
                    ]}
                  >
                    {repo.badge}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  reposContainer: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  repoActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  repoActionBtn: {
    height: 40,
    flexDirection: "row",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  repoActionBtnFit: {
    alignSelf: "flex-start",
    paddingRight: 20,
  },
  repoActionBtnFill: {
    flex: 1,
  },
  repoActionText: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#000",
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  repoScrollList: {
    flex: 1,
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
    flex: 1,
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
  repoBranchIconSvg: {},
  repoBranchText: {
    fontFamily: SFPro.medium,
    fontSize: 14,
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
    paddingVertical: 2,
    marginLeft: 8,
  },
  repoLanguageBadgeGreen: {
    borderColor: "#72C44E",
    backgroundColor: "#E3FDD7",
  },
  repoLanguageText: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: "#9F9F9F",
    lineHeight: 18,
    letterSpacing: -0.3,
  },
  repoLanguageTextGreen: {
    color: "#4A8C2A",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
    textAlign: "center",
  },
  skeletonBar: {
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E8E8E8",
    marginBottom: 8,
  },
  skeletonBarLong: {
    width: "55%",
  },
  skeletonBarShort: {
    width: "30%",
    marginBottom: 0,
  },
  skeletonBadge: {
    width: 60,
    height: 24,
    borderRadius: 50,
    backgroundColor: "#E8E8E8",
    marginLeft: 8,
  },
});
