import { PermissionModal } from "@/components/PermissionModal";
import { GrassColors, NationalPark } from "@/constants/theme";
import {
  getConnectedUrls,
  getPermissions,
  GlobalPermissionItem,
  respondGlobalPermission,
  subscribeToAll,
  subscribeToPermissions,
} from "@/store/connection-store";
import { useTheme } from "@/store/theme-store";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

// Apply National Park as the default font for all Text components
const DefaultText = Text as any;
if (DefaultText.defaultProps == null) DefaultText.defaultProps = {};
DefaultText.defaultProps.style = { fontFamily: NationalPark.regular };

// Tracks which server URLs currently have active connections so we can open
// a permissions SSE for each one.
function useConnectedServers(): string[] {
  const [servers, setServers] = useState<string[]>(() => getConnectedUrls());
  useEffect(() => {
    const update = () => setServers(getConnectedUrls());
    const unsub = subscribeToAll(update);
    return unsub;
  }, []);
  return servers;
}

// Renders the PermissionModal for the first pending permission across all connected servers.
function GlobalPermissionsManager({ theme }: { theme: "light" | "dark" }) {
  const servers = useConnectedServers();
  // Collect all pending permissions across servers, tag with serverUrl
  const [allPerms, setAllPerms] = useState<
    (GlobalPermissionItem & { serverUrl: string })[]
  >([]);

  // Re-subscribe whenever server list changes — we collect via a single state update
  useEffect(() => {
    if (servers.length === 0) {
      setAllPerms([]);
      return;
    }
    const unsubscribers: (() => void)[] = [];
    const collect = () => {
      const merged: (GlobalPermissionItem & { serverUrl: string })[] = [];
      for (const url of servers) {
        for (const p of getPermissions(url)) {
          merged.push({ ...p, serverUrl: url });
        }
      }
      setAllPerms(merged);
    };
    for (const url of servers) {
      unsubscribers.push(subscribeToPermissions(url, collect));
    }
    collect();
    return () => unsubscribers.forEach((fn) => fn());
  }, [servers]);

  const first = allPerms[0];
  if (!first) return null;

  return (
    <PermissionModal
      item={{
        toolUseID: first.toolUseID,
        toolName: first.toolName,
        input: first.input,
      }}
      onAllow={() =>
        respondGlobalPermission(
          first.serverUrl,
          first.sessionId,
          first.toolUseID,
          true,
        )
      }
      onDeny={() =>
        respondGlobalPermission(
          first.serverUrl,
          first.sessionId,
          first.toolUseID,
          false,
        )
      }
      theme={theme}
    />
  );
}

export default function RootLayout() {
  const [theme] = useTheme();
  const c = GrassColors[theme];
  const [fontsLoaded] = useFonts({
    [NationalPark.extraLight]: require("../assets/fonts/National_Park/static/NationalPark-ExtraLight.ttf"),
    [NationalPark.light]: require("../assets/fonts/National_Park/static/NationalPark-Light.ttf"),
    [NationalPark.regular]: require("../assets/fonts/National_Park/static/NationalPark-Regular.ttf"),
    [NationalPark.medium]: require("../assets/fonts/National_Park/static/NationalPark-Medium.ttf"),
    [NationalPark.semiBold]: require("../assets/fonts/National_Park/static/NationalPark-SemiBold.ttf"),
    [NationalPark.bold]: require("../assets/fonts/National_Park/static/NationalPark-Bold.ttf"),
    [NationalPark.extraBold]: require("../assets/fonts/National_Park/static/NationalPark-ExtraBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
      <Stack
        screenOptions={{
          animation: "slide_from_right",
          headerStyle: { backgroundColor: c.barBg },
          headerTintColor: c.text,
          headerTitleStyle: { color: c.text },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen name="machines" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="folders" options={{ headerShown: false }} />
        <Stack.Screen name="agent-picker" options={{ headerShown: false }} />
        <Stack.Screen name="project" options={{ headerShown: false }} />
        <Stack.Screen name="sessions" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="container-setup" options={{ headerShown: false }} />
        <Stack.Screen name="push-commit" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen
          name="diffs"
          options={{
            title: "Diffs",
            animation: "fade_from_bottom",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="get-more"
          options={{
            headerShown: false,
            animation: "fade",
          }}
        />
      </Stack>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <GlobalPermissionsManager theme={theme} />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
