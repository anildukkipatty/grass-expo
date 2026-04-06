import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import React, { useState } from "react";

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

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get("window");
const SWIPE_THRESHOLD = -110;

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
  const translateX = useSharedValue(0);
  const containerHeight = useSharedValue(76);
  const [deletePhase, setDeletePhase] = useState<"idle" | "deleted">("idle");

  const wrapStyle = useAnimatedStyle(() => ({
    height: containerHeight.value,
    overflow: "hidden" as const,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SCREEN_W, -8, 0],
      [1, 0.75, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const doSpringBack = () => {
    translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
  };

  const doDelete = () => {
    translateX.value = withTiming(-SCREEN_W, { duration: 220 });
    setTimeout(() => {
      setDeletePhase("deleted");
      setTimeout(() => {
        containerHeight.value = withTiming(0, { duration: 250 });
        setTimeout(onDelete, 250);
      }, 1000);
    }, 220);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (e.translationX < SWIPE_THRESHOLD) {
        runOnJS(doDelete)();
      } else {
        runOnJS(doSpringBack)();
      }
    });

  const badge =
    item.badgeType === "green"
      ? { bg: "#E8FFF0", border: "#34C759", text: "#1A7A35" }
      : { bg: "#F0F0F0", border: "#C7C7CC", text: "#6C6C70" };

  return (
    <Animated.View style={wrapStyle}>
      {/* Red background revealed on swipe */}
      <Animated.View style={[repoStyles.deleteBg, bgStyle]}>
        <Text style={repoStyles.deletedText}>
          {deletePhase === "deleted" ? "Deleted" : "Deleting..."}
        </Text>
      </Animated.View>

      {/* Sliding card */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[repoStyles.card, cardStyle]}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
            onPress={onPress}
            activeOpacity={0.72}
          >
            <View style={repoStyles.cardLeft}>
              <Text style={repoStyles.repoName}>{item.name}</Text>
              <Text style={repoStyles.repoBranch}>
                {"↑ "}
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
        </Animated.View>
      </GestureDetector>
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
  deleteBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FF3B30",
    borderRadius: 14,
    marginHorizontal: 14,
    marginBottom: 8,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 22,
  },
  deletedText: {
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
