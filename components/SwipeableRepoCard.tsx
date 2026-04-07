import BranchNameIcon from "@/assets/images/navbar-screens/git-add.svg";
import React, { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RepoItem {
  id: string;
  name: string;
  path: string;
  branch: string;
  action: string;
  badge: string;
  badgeType: "green" | "gray";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SwipeableRepoCard({
  item,
  onDelete,
  onPress,
}: {
  item: RepoItem;
  onDelete: () => void;
  onPress: () => void;
}) {
  const swipeableRef = useRef<Swipeable>(null);
  const isSwiping = useRef(false);
  const containerHeight = useSharedValue(76);
  const [deletePhase, setDeletePhase] = useState<"idle" | "deleted">("idle");

  const wrapStyle = useAnimatedStyle(() => ({
    height: containerHeight.value,
    overflow: "hidden" as const,
  }));

  const collapse = () => {
    setDeletePhase("deleted");
    setTimeout(() => {
      containerHeight.value = withTiming(0, { duration: 250 });
      setTimeout(onDelete, 250);
    }, 400);
  };

  const handleDeletePress = () => {
    swipeableRef.current?.close();
    collapse();
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={repoStyles.deleteAction}
      onPress={handleDeletePress}
      activeOpacity={0.85}
    >
      <Text style={repoStyles.deleteActionText}>
        {deletePhase === "deleted" ? "Deleted" : "Delete"}
      </Text>
    </TouchableOpacity>
  );

  const badge =
    item.badgeType === "green"
      ? { bg: "#E8FFF0", border: "#34C759", text: "#1A7A35" }
      : { bg: "#F0F0F0", border: "#C7C7CC", text: "#6C6C70" };

  return (
    <Animated.View style={wrapStyle}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        rightThreshold={80}
        overshootRight={false}
        friction={2}
        onSwipeableWillOpen={() => {
          isSwiping.current = true;
        }}
        onSwipeableClose={() => {
          isSwiping.current = false;
        }}
      >
        <View style={repoStyles.card}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
            onPress={() => {
              if (!isSwiping.current) onPress();
            }}
            activeOpacity={0.72}
          >
            <View style={repoStyles.cardLeft}>
              <Text style={repoStyles.repoName}>{item.name}</Text>
              <Text style={repoStyles.repoBranch}>
                <BranchNameIcon />
                {item.branch}
                {"  ·  "}
                {item.action}
              </Text>
            </View>
            <View
              style={[
                repoStyles.repoBadge,
                { backgroundColor: badge.bg, borderColor: badge.border },
              ]}
            >
              <Text style={[repoStyles.repoBadgeText, { color: badge.text }]}>
                {item.badge}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Swipeable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

export const repoStyles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#C7C7CC",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  deleteAction: {
    backgroundColor: "#FF3B30",
    borderRadius: 14,
    marginRight: 14,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  deleteActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 14,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: {
    flex: 1,
    marginRight: 10,
  },
  repoName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 5,
  },
  repoBranch: {
    fontSize: 12,
    color: "#8E8E93",
  },
  repoBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  repoBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  swipeHint: {
    textAlign: "center",
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 8,
    marginBottom: 10,
  },
});
