import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import UserIcon from "@/assets/images/new-design/navbar/user-icon.svg";
import GrassLogo from "@/assets/images/new-design/navbar/grass-logo.svg";
import { NotificationSlider } from "./NotificationSlider";
import {
  NotificationPermissionSlider,
  markNotificationReminderShown,
  shouldShowNotificationReminder,
} from "./NotificationPermissionSlider";

type Props = {
  alignItems?: "center" | "flex-end";
};

export function NavbarHeader({ alignItems = "center" }: Props) {
  const { top } = useSafeAreaInsets();
  const [notifVisible, setNotifVisible] = useState(false);
  const [permSliderVisible, setPermSliderVisible] = useState(false);

  useEffect(() => {
    shouldShowNotificationReminder().then((show) => {
      if (show) {
        markNotificationReminderShown();
        setPermSliderVisible(true);
      }
    });
  }, []);

  return (
    <>
      <LinearGradient
        colors={["#C5C5C5", "#FFFFFF"]}
        locations={[0, 0.2]}
        style={[styles.header, { alignItems, paddingTop: top + 12 }]}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/new-navbar/settings" as any);
          }}
        >
          <GlassView style={styles.glassButton} tintColor="rgba(93,93,93,0.1)">
            <UserIcon width={22} height={22} />
          </GlassView>
        </TouchableOpacity>
        <View style={styles.center}>
          <GrassLogo width={116} height={22} />
        </View>
        <View style={styles.rightActions}>
          {/* <TouchableOpacity
            style={styles.iconWrap}
            onPress={() => setNotifVisible(true)}
          >
            <NotificationIcon width={28} height={28} />
            <View style={styles.notifBadge} />
          </TouchableOpacity> */}
        </View>
      </LinearGradient>
      <NotificationSlider
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
      />
      <NotificationPermissionSlider
        visible={permSliderVisible}
        onClose={() => setPermSliderVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  glassButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  notifBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 8,
    backgroundColor: "#FF0004",
    borderWidth: 2,
    borderColor: "#F7FFF3",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 40,
  },
});
