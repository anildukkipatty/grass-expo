import { GetMoreSheet } from "@/components/GetMoreSheet";
import { AgentPickerSheet } from "@/components/NavBanner";
import { NavbarProvider, orderVmUrls, useNavbar } from "@/contexts/navbar-context";
import { getEntry, getRepoDetailsStore, listReposStore } from "@/store/connection-store";
import { getUrls, resolveServerKey } from "@/store/url-store";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React, { useCallback } from "react";
import { ActivityIndicator, Text, View } from "react-native";

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
    grassVmChecking,
  } = useNavbar();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refreshGrassVmState();
    }, [refreshGrassVmState]),
  );

  return (
    <View style={{ flex: 1 }}>
      <NativeTabs
        tintColor="#088120"
      >
        <NativeTabs.Trigger name="home">
          <NativeTabs.Trigger.Icon
            sf="house"
            selectedColor="#088120"
          />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="perms">
          <NativeTabs.Trigger.Icon
            sf="shield"
            selectedColor="#088120"
          />
          <NativeTabs.Trigger.Label>Perms</NativeTabs.Trigger.Label>
          {permsCount > 0 && (
            <NativeTabs.Trigger.Badge>{String(permsCount)}</NativeTabs.Trigger.Badge>
          )}
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="repos">
          <NativeTabs.Trigger.Icon
            sf="folder"
            selectedColor="#088120"
          />
          <NativeTabs.Trigger.Label>Repos</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>

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
          try {
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
            router.navigate("/(tabs)/repos");
          } catch {
            // Keep previous repos on failure.
          } finally {
            setReposLoading(false);
          }
        }}
      />

      {grassVmChecking && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          pointerEvents="box-only"
        >
          <ActivityIndicator size="large" color="#ffffff" />
          <Text
            style={{
              color: "#ffffff",
              marginTop: 12,
              fontSize: 14,
              fontWeight: "500",
              opacity: 0.9,
            }}
          >
            Checking Grass VM…
          </Text>
        </View>
      )}
    </View>
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
