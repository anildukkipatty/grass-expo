import { router, useNavigation, usePathname } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GrassLogo from "@/assets/images/new-design/navbar/grass-logo-app.svg";
import {
  NotificationPermissionSlider,
  markNotificationReminderShown,
  shouldShowNotificationReminder,
} from "@/components/new-navbar/NotificationPermissionSlider";
import { useNavbar } from "@/contexts/navbar-context";

export default function TabsLayout() {
  const pathname = usePathname();
  const navigation = useNavigation();
  const showNavbarHeader = !pathname.includes("chat-list");
  const { permsCount } = useNavbar();

  // Notification-permission reminder previously lived in NavbarHeader (now
  // replaced by the native header). Preserve the one-time auto-prompt here.
  const [permSliderVisible, setPermSliderVisible] = React.useState(false);
  React.useEffect(() => {
    shouldShowNotificationReminder().then((show) => {
      if (show) {
        markNotificationReminderShown();
        setPermSliderVisible(true);
      }
    });
  }, []);

  // Drive the parent Stack's native iOS header. The account button is a native
  // bar-button item (SF Symbol) — icon-only items render as a proper circle on
  // iOS 26 and get the system's shared Liquid Glass, whereas a custom headerLeft
  // view gets stretched into a capsule. The Grass logo sits centered as the
  // native header title. Hidden on the chat-list tab, which owns its UI.
  React.useLayoutEffect(() => {
    // Scope these options to the (tabs) screen in the new-navbar Stack — NOT
    // getParent(), which reaches the root stack and would apply the logo +
    // account header to the whole group (including the Settings screen).
    navigation.setOptions({
      headerShown: showNavbarHeader,
      title: "",
      headerTitleAlign: "center",
      headerTitle: () => <GrassLogo width={104} height={33} />,
      unstable_headerLeftItems: () => [
        {
          type: "button",
          label: "Account",
          icon: { type: "sfSymbol", name: "person.crop.circle" },
          onPress: () => router.push("/new-navbar/settings" as any),
        },
      ],
      headerStyle: { backgroundColor: "#FFFFFF" },
      headerShadowVisible: false,
    });
  }, [navigation, showNavbarHeader]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={showNavbarHeader ? [] : ["top"]}
    >
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
      </NativeTabs>
      <NotificationPermissionSlider
        visible={permSliderVisible}
        onClose={() => setPermSliderVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
