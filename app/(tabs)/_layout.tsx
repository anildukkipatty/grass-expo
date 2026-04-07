import { GetMoreSheet } from "@/components/GetMoreSheet";
import { AgentPickerSheet } from "@/components/NavBanner";
import { NavbarProvider, orderVmUrls, useNavbar } from "@/contexts/navbar-context";
import { getEntry, getRepoDetailsStore, listReposStore } from "@/store/connection-store";
import { getUrls, resolveServerKey } from "@/store/url-store";
import { NativeTabs } from "expo-router/unstable-native-tabs";

// ─── TabsLayoutInner ──────────────────────────────────────────────────────────

function TabsLayoutInner() {
  const {
    permissions,
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
  } = useNavbar();
  const permsCount = permissions.length;

  return (
    <>
      <NativeTabs
        tintColor="#088120"
      >
        <NativeTabs.Trigger name="home">
          <NativeTabs.Trigger.Icon
            src={{
              default: require("@/assets/images/navbar-screens/navbar-home.png"),
              selected: require("@/assets/images/navbar-screens/navbar-home-active.png"),
            }}
            renderingMode="original"
          />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="perms">
          <NativeTabs.Trigger.Icon
            src={{
              default: require("@/assets/images/navbar-screens/navbar-perms.png"),
              selected: require("@/assets/images/navbar-screens/navbar-perms-active.png"),
            }}
            renderingMode="original"
          />
          <NativeTabs.Trigger.Label>Perms</NativeTabs.Trigger.Label>
          {permsCount > 0 && (
            <NativeTabs.Trigger.Badge>{String(permsCount)}</NativeTabs.Trigger.Badge>
          )}
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="repos">
          <NativeTabs.Trigger.Icon
            src={{
              default: require("@/assets/images/navbar-screens/navbar-folder.png"),
              selected: require("@/assets/images/navbar-screens/navbar-folder-active.png"),
            }}
            renderingMode="original"
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
