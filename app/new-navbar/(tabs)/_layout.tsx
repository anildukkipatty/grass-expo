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
          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/new-design/navbar/tabs/tab-home.png")}
            renderingMode="template"
          />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="permissions">
          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/new-design/navbar/tabs/tab-permissions.png")}
            renderingMode="template"
          />
          <NativeTabs.Trigger.Label>Permissions</NativeTabs.Trigger.Label>
          {permsCount > 0 && (
            <NativeTabs.Trigger.Badge>
              {String(permsCount)}
            </NativeTabs.Trigger.Badge>
          )}
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="repos">
          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/new-design/navbar/tabs/tab-repos.png")}
            renderingMode="template"
          />
          <NativeTabs.Trigger.Label>Repos</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="machines">
          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/new-design/navbar/tabs/tab-machines.png")}
            renderingMode="template"
          />
          <NativeTabs.Trigger.Label>Machines</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
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
