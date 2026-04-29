import { usePathname } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";

import { NavbarHeader } from "@/components/new-navbar/NavbarHeader";
import { useNavbar } from "@/contexts/navbar-context";

export default function TabsLayout() {
  const pathname = usePathname();
  const showNavbarHeader = !pathname.includes("chat-list");
  const { permsCount } = useNavbar();

  return (
    <SafeAreaView style={styles.safeArea}>
      {showNavbarHeader && <NavbarHeader />}
      <NativeTabs>
        <NativeTabs.Trigger name="chat-list">
          <NativeTabs.Trigger.Icon sf="message.fill" md="chat" />
          <NativeTabs.Trigger.Label>Chats</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="permissions">
          <NativeTabs.Trigger.Icon sf="bolt.fill" md="bolt" />
          <NativeTabs.Trigger.Label>Permissions</NativeTabs.Trigger.Label>
          {permsCount > 0 && (
            <NativeTabs.Trigger.Badge>
              {String(permsCount)}
            </NativeTabs.Trigger.Badge>
          )}
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="repos">
          <NativeTabs.Trigger.Icon sf="tray.fill" md="inbox" />
          <NativeTabs.Trigger.Label>Repos</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Slot name="chat-list" />
        <NativeTabs.Slot name="index" />
        <NativeTabs.Slot name="permissions" />
        <NativeTabs.Slot name="repos" />
      </NativeTabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
