import { GetMoreSheet } from "@/components/GetMoreSheet";
import { AgentPickerSheet } from "@/components/NavBanner";
import { NavbarProvider, orderVmUrls, useNavbar } from "@/contexts/navbar-context";
import { getEntry, getRepoDetailsStore, listReposStore } from "@/store/connection-store";
import { getUrls, resolveServerKey } from "@/store/url-store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Tabs, useRouter } from "expo-router";
import React, { useCallback } from "react";

// ─── TabsLayoutInner ──────────────────────────────────────────────────────────

function TabsLayoutInner() {
  const {
    permsCount,
    getMoreVisible,
    setGetMoreVisible,
    sheetInitialView,
    selectedVmUrl,
    primaryVmUrl,
    setVmUrls,
    setActiveVmTab,
    setRepos,
    setReposLoading,
    pendingRepo,
    setPendingRepo,
    handleSelectAgent,
    refreshGrassVmState,
  } = useNavbar();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refreshGrassVmState();
    }, [refreshGrassVmState]),
  );

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#088120",
          tabBarStyle: {
            position: "fixed" as any,
            bottom: 0,
            left: 0,
            right: 0,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="perms"
          options={{
            title: "Perms",
            tabBarBadge: permsCount > 0 ? permsCount : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="repos"
          options={{
            title: "Repos",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="folder" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <AgentPickerSheet
        pendingRepo={pendingRepo}
        onDismiss={() => setPendingRepo(null)}
        onSelectAgent={handleSelectAgent}
      />

      <GetMoreSheet
        visible={getMoreVisible}
        onClose={() => setGetMoreVisible(false)}
        initialView={sheetInitialView}
        serverUrl={selectedVmUrl}
        onUrlDetected={async () => {
          const urls = await getUrls();
          setVmUrls(orderVmUrls(urls, primaryVmUrl));
          setActiveVmTab(0);
        }}
        onRepoAdded={async () => {
          if (!selectedVmUrl) return;
          const key = resolveServerKey(selectedVmUrl);
          setReposLoading(true);
          await listReposStore(key);
          const entry = getEntry(key);
          const repoList = entry?.repos ?? [];
          await Promise.all(repoList.map((r) => getRepoDetailsStore(key, r.path)));
          const updatedEntry = getEntry(key);
          const details = updatedEntry?.repoDetails ?? new Map();
          setRepos(
            repoList.map((r, i) => ({
              id: String(i),
              name: r.name,
              path: r.path,
              branch: details.get(r.path)?.branch ?? "main",
              action: "Open Code",
              badge: details.get(r.path)?.dominantLanguage ?? (r.isGit ? "Git" : "Folder"),
              badgeType: "gray" as const,
            }))
          );
          setReposLoading(false);
          router.navigate("/(tabs)/repos");
        }}
      />
    </>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <NavbarProvider>
      <TabsLayoutInner />
    </NavbarProvider>
  );
}
