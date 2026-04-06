import { SwipeableRepoCard, repoStyles } from "@/components/SwipeableRepoCard";
import { useNavbar } from "@/contexts/navbar-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ReposTab() {
  const {
    repos,
    setRepos,
    reposLoading,
    setPendingRepo,
    setGetMoreVisible,
    setSheetInitialView,
  } = useNavbar();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: tabBarHeight + 20,
        paddingTop: 4,
      }}
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
    </ScrollView>
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
