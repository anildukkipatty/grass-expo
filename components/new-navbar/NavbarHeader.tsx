import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import NotificationIcon from "@/assets/images/new-design/navbar/notifcation.svg";
import UserIcon from "@/assets/images/new-design/navbar/user-icon.svg";
import LogoIcon from "@/assets/images/new-design/onboarding/logo.svg";
import { SFPro } from "@/constants/theme";
import { NewChatSlider } from "./NewChatSlider";
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
  const [newChatVisible, setNewChatVisible] = useState(false);

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
          <LogoIcon width={35} height={20} />
          <Text style={styles.title}>Grass</Text>
        </View>
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.iconWrap}
            onPress={() => setNewChatVisible(true)}
          >
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconWrap}
            onPress={() => setNotifVisible(true)}
          >
            <NotificationIcon width={28} height={28} />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>
      </View>
      <NewChatSlider
        visible={newChatVisible}
        onClose={() => setNewChatVisible(false)}
      />
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
  title: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    lineHeight: 28,
    color: "#000",
    letterSpacing: -0.415,
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
  },
  plusIcon: {
    fontSize: 26,
    color: "#000",
    lineHeight: 30,
    fontFamily: SFPro.regular,
  },
});
