import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

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
      <View style={[styles.header, { alignItems }]}>
        <TouchableOpacity
          style={styles.iconWrap}
          onPress={() => router.push("/new-navbar/settings" as any)}
        >
          <UserIcon width={28} height={28} />
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
      </View>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  iconWrap: {
    width: 40,
    height: 40,
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
