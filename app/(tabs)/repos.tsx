import CloneFromGithub from "@/assets/images/navbar-screens/git-icon.svg";
import { NavBanner, VmTabBar } from "@/components/NavBanner";
import { StickyBannerLayout } from "@/components/StickyBannerLayout";
import { SwipeableRepoCard, repoStyles } from "@/components/SwipeableRepoCard";
import { useNavbar } from "@/contexts/navbar-context";
import { resolveServerUrl } from "@/store/url-store";
import { vmFetch } from "@/utils/vm-fetch";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BANNER_HEIGHT = 160;

export default function ReposTab() {
  const {
    repos,
    setRepos,
    reposLoading,
    refreshRepos,
    setPendingRepo,
    setGetMoreVisible,
    setSheetInitialView,
    selectedVmUrl,
  } = useNavbar();

  const healthApiUrl = selectedVmUrl ? `${resolveServerUrl(selectedVmUrl)}/health` : null;
  const [debugResult, setDebugResult] = useState<string>("not fetched");

  useEffect(() => {
    if (!healthApiUrl) {
      setDebugResult("no URL");
      return;
    }
    setDebugResult("fetching...");
    vmFetch(healthApiUrl)
      .then(async (res) => {
        const text = await res.text();
        setDebugResult(`${res.status} — ${text.slice(0, 300)}`);
      })
      .catch((err) => setDebugResult(`error: ${err?.message ?? String(err)}`));
  }, [healthApiUrl]);

  useFocusEffect(
    useCallback(() => {
      refreshRepos();
    }, [refreshRepos]),
  );
  const { bottom } = useSafeAreaInsets();
  const tabBarHeight = bottom + 110;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
      <NavBanner />
      <StickyBannerLayout
        bannerHeight={BANNER_HEIGHT}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        <VmTabBar />
        {/* DEBUG: health check output — comment out before shipping
        {healthApiUrl && (
          <Text style={styles.debugUrl} numberOfLines={6} selectable>
            {healthApiUrl}{"\n"}{debugResult}
          </Text>
        )}
        */}
        {/* Action buttons */}
        <View style={repoStyles.actionRow}>
          <TouchableOpacity
            style={repoStyles.actionBtn}
            activeOpacity={0.72}
            onPress={() => {
              setSheetInitialView("add-repository");
              setGetMoreVisible(true);
            }}
          >
            <Text style={repoStyles.actionBtnText}>+ Add new repo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={repoStyles.actionBtn}
            activeOpacity={0.72}
            onPress={() => {
              setSheetInitialView("github-repos");
              setGetMoreVisible(true);
            }}
          >
            <CloneFromGithub />
            <Text style={repoStyles.actionBtnText}>Clone from Github</Text>
          </TouchableOpacity>
        </View>

        {/* Repo cards */}
        {reposLoading ? (
          <Text style={styles.centeredText}>Loading repos...</Text>
        ) : repos.length === 0 ? (
          <Text style={styles.centeredText}>No repos found</Text>
        ) : (
          repos.map((item) => (
            <SwipeableRepoCard
              key={item.id}
              item={item}
              onDelete={() =>
                setRepos((prev) => prev.filter((r) => r.id !== item.id))
              }
              onPress={() => setPendingRepo(item)}
            />
          ))
        )}

        {/* Swipe hint */}
        {/* {repos.length > 0 && !reposLoading && (
          <Text style={repoStyles.swipeHint}>
            Swipe left of a repo to delete
          </Text>
        )} */}
      </StickyBannerLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredText: {
    textAlign: "center",
    color: "#8E8E93",
    marginTop: 24,
    fontSize: 14,
  },
  debugUrl: {
    fontFamily: "Courier",
    fontSize: 11,
    color: "#8E8E93",
    backgroundColor: "#F0F0F0",
    marginHorizontal: 14,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
