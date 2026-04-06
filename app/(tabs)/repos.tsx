import { NavBanner } from "@/components/NavBanner";
import { SwipeableRepoCard, repoStyles } from "@/components/SwipeableRepoCard";
import { StickyBannerLayout } from "@/components/StickyBannerLayout";
import { useNavbar } from "@/contexts/navbar-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BANNER_HEIGHT = 160;

export default function ReposTab() {
  const {
    repos,
    setRepos,
    reposLoading,
    setPendingRepo,
    setGetMoreVisible,
    setSheetInitialView,
  } = useNavbar();
  const { bottom } = useSafeAreaInsets();
  const tabBarHeight = bottom + 110;

  return (
    <View style={{ flex: 1 }}>
      <NavBanner />
      <StickyBannerLayout
        bannerHeight={BANNER_HEIGHT}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
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
              setSheetInitialView("add-repository");
              setGetMoreVisible(true);
            }}
          >
            <Ionicons name="logo-github" size={14} color="#1C1C1E" />
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
        {repos.length > 0 && !reposLoading && (
          <Text style={repoStyles.swipeHint}>Swipe left of a repo to delete</Text>
        )}
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
});
