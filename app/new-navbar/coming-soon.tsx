import * as Notifications from "expo-notifications";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackButton from "@/assets/images/new-design/back-arrow.svg";
import NotifyIcon from "@/assets/images/new-design/settings/notify.svg";
import { SFPro } from "@/constants/theme";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function ComingSoonScreen() {
  const { title } = useLocalSearchParams<{ title: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNotifyMe = async () => {
    if (loading || notified) return;
    setLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;
      const featureName = title ?? "This feature";
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Grass",
          body: `${featureName} is launching in the next version — we'll ping you the moment it's live.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });
      setNotified(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <BackButton width={36} height={36} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title ?? "Coming Soon"}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>Coming soon</Text>
        <Text style={styles.subtitle}>
          Launching in the next version.{"\n"}We&#39;ll ping you.
        </Text>
        <Image
          source={require("@/assets/images/new-design/settings/coming-soon.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <View style={[styles.footer, { paddingBottom: bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.notifyBtn, (loading || notified) && styles.notifyBtnDone]}
          activeOpacity={0.85}
          onPress={handleNotifyMe}
          disabled={loading || notified}
        >
          <NotifyIcon width={18} height={18} color="#fff" />
          <Text style={styles.notifyText}>
            {notified ? "You're on the list!" : loading ? "Setting up…" : "Notify me"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    borderRadius: 296,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    marginRight: 5,
  },
  headerTitle: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  heading: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    color: "#000",
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#808080",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
  },
  illustration: {
    width: 220,
    height: 220,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  notifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3D7A1F",
    borderRadius: 50,
    paddingVertical: 16,
  },
  notifyBtnDone: {
    backgroundColor: "#6BAE49",
  },
  notifyText: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#fff",
  },
});
