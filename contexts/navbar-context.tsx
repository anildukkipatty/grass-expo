import { heartbeat, requestContainer, signedPreviewUrl } from "@/api/containers";
import { clearAuth, getToken } from "@/store/auth-store";
import {
  closeConnection,
  getConnectedUrls,
  getEntry,
  getPermissions,
  getRepoDetailsStore,
  listReposStore,
  openConnection,
  openConnectionWithKey,
  subscribeToPermissions,
} from "@/store/connection-store";
import {
  GRASS_VM_KEY,
  clearUrls,
  getUrls,
  refreshPrimaryVmUrl,
  removeUrl,
  resolveServerKey,
  resolveServerUrl,
  saveVmUrl,
} from "@/store/url-store";
import {
  Thread,
  getThreadsForServer,
  subscribeThreads,
} from "@/store/thread-store";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CodeLine = { num: number; prefix: "+" | "-" | " "; text: string };

export interface PermissionCardData {
  id: string;
  toolName: string;
  toolType: "Write" | "Edit" | "Bash" | "Read" | string;
  time: string;
  path: string;
  origin: string;
  initials: string;
  codeLines: CodeLine[];
}

export interface RepoItem {
  id: string;
  name: string;
  path: string;
  branch: string;
  action: string;
  badge: string;
  badgeType: "green" | "gray";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function extractHost(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return url
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .split(":")[0];
  }
}

export function orderVmUrls(urls: string[], primaryVmUrl?: string): string[] {
  const unique = Array.from(new Set(urls));
  if (!primaryVmUrl) return unique;
  const rest = unique.filter((u) => u !== primaryVmUrl);
  return [primaryVmUrl, ...rest];
}

// ─── Context Shape ────────────────────────────────────────────────────────────

interface NavbarContextValue {
  // VM URLs / tabs
  vmUrls: string[];
  setVmUrls: React.Dispatch<React.SetStateAction<string[]>>;
  primaryVmUrl: string | undefined;
  setPrimaryVmUrl: React.Dispatch<React.SetStateAction<string | undefined>>;
  activeVmTab: number;
  setActiveVmTab: React.Dispatch<React.SetStateAction<number>>;
  selectedVmUrl: string | undefined;
  selectedServerKey: string | undefined;

  // Permissions
  permsCount: number;

  // Repos
  repos: RepoItem[];
  setRepos: React.Dispatch<React.SetStateAction<RepoItem[]>>;
  reposLoading: boolean;
  setReposLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Threads
  threads: Thread[];

  // Agent picker
  pendingRepo: RepoItem | null;
  setPendingRepo: React.Dispatch<React.SetStateAction<RepoItem | null>>;

  // GetMore sheet
  getMoreVisible: boolean;
  setGetMoreVisible: React.Dispatch<React.SetStateAction<boolean>>;
  sheetInitialView: "home" | "connect-agent" | "connect-laptop" | "add-repository" | "github-repos";
  setSheetInitialView: React.Dispatch<
    React.SetStateAction<"home" | "connect-agent" | "connect-laptop" | "add-repository" | "github-repos">
  >;

  // VM state
  vmRunning: boolean;
  vmUrlStatuses: Map<string, boolean>;

  // Actions
  refreshRepos: () => Promise<void>;
  handleRemoveUserVm: (idx: number) => Promise<void>;
  handleSelectAgent: (agentId: string) => void;
  handleLogout: () => void;
}

const NavbarContext = createContext<NavbarContextValue | null>(null);

export function useNavbar(): NavbarContextValue {
  const ctx = useContext(NavbarContext);
  if (!ctx) {
    throw new Error("useNavbar must be used inside <NavbarProvider>");
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [activeVmTab, setActiveVmTab] = useState(0);
  const [permsCount, setPermsCount] = useState(0);
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [getMoreVisible, setGetMoreVisible] = useState(false);
  const [sheetInitialView, setSheetInitialView] = useState<
    "home" | "connect-agent" | "connect-laptop" | "add-repository" | "github-repos"
  >("home");
  const [vmRunning, setVmRunning] = useState(true);
  const [vmUrls, setVmUrls] = useState<string[]>([]);
  const [primaryVmUrl, setPrimaryVmUrl] = useState<string | undefined>(undefined);
  const [vmUrlStatuses, setVmUrlStatuses] = useState<Map<string, boolean>>(new Map());
  const [pendingRepo, setPendingRepo] = useState<RepoItem | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);

  const selectedVmUrl = vmUrls[activeVmTab] ?? undefined;
  const selectedServerKey = selectedVmUrl
    ? resolveServerKey(selectedVmUrl)
    : undefined;

  // Hydrate the cached primary VM URL from storage on mount
  useEffect(() => {
    refreshPrimaryVmUrl();
  }, []);

  // Load threads for the active server (using resolved key so GrassVM threads persist)
  useEffect(() => {
    const key = selectedServerKey;
    if (!key) {
      setThreads([]);
      return;
    }
    getThreadsForServer(key).then(setThreads);
    return subscribeThreads(() => {
      getThreadsForServer(key).then(setThreads);
    });
  }, [selectedServerKey]);

  // Subscribe to global permissions SSE to drive the perms tab badge count
  useEffect(() => {
    if (!selectedVmUrl) {
      setPermsCount(0);
      return;
    }
    const sync = () => setPermsCount(getPermissions(selectedVmUrl).length);
    sync();
    return subscribeToPermissions(selectedVmUrl, sync);
  }, [selectedVmUrl]);

  // Load VM URLs when primaryVmUrl changes
  useEffect(() => {
    let cancelled = false;
    async function loadVmUrls() {
      const urls = await getUrls();
      if (!cancelled) {
        setVmUrls(orderVmUrls(urls, primaryVmUrl));
      }
    }
    loadVmUrls();
    return () => {
      cancelled = true;
    };
  }, [primaryVmUrl]);

  // Clamp activeVmTab if vmUrls shrinks
  useEffect(() => {
    if (activeVmTab >= vmUrls.length && vmUrls.length > 0) {
      setActiveVmTab(0);
    }
  }, [activeVmTab, vmUrls.length]);

  // Check container health on mount
  useEffect(() => {
    let cancelled = false;
    async function checkContainer() {
      const token = await getToken();
      if (!token || cancelled) return;

      const hb = await heartbeat(token);
      if (cancelled) return;

      if (!hb.ok && hb.status === 403) {
        setVmRunning(false);
        Alert.alert("VM Monthly Usage Limit Reached", hb.error);
      } else if (!hb.ok || hb.data.container !== "running" || !hb.data.grass) {
        setVmRunning(false);
        router.replace("/container-setup");
      } else {
        setVmRunning(true);
        let backendPreviewUrl: string | undefined;
        const preview = await signedPreviewUrl(token);
        if (preview.ok) {
          backendPreviewUrl = preview.data.url;
        } else if (hb.data.url) {
          backendPreviewUrl = hb.data.url;
        }
        if (backendPreviewUrl) {
          setPrimaryVmUrl(backendPreviewUrl);
          await saveVmUrl(backendPreviewUrl);
        }
        const urls = await getUrls();
        if (!cancelled) {
          setVmUrls(orderVmUrls(urls, backendPreviewUrl));
        }
      }
    }
    checkContainer();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Poll health for all known URLs to drive per-URL status dots.
  // If the primary GrassVM goes down, call requestContainer to wake it.
  useEffect(() => {
    if (vmUrls.length === 0) return;
    let reviving = false;
    let sandboxLimitHit = false;

    async function pollAll() {
      const results = await Promise.all(
        vmUrls.map(async (url) => {
          const realUrl = resolveServerUrl(url);
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          try {
            const res = await fetch(`${realUrl}/health`, { signal: controller.signal });
            return { url, ok: res.ok };
          } catch {
            return { url, ok: false };
          } finally {
            clearTimeout(timer);
          }
        }),
      );
      setVmUrlStatuses((prev) => {
        const next = new Map(prev);
        results.forEach(({ url, ok }) => next.set(url, ok));
        return next;
      });

      // If primary GrassVM is down, try to wake it
      const primaryResult = primaryVmUrl
        ? results.find((r) => r.url === primaryVmUrl)
        : undefined;
      if (primaryResult && !primaryResult.ok && !reviving && !sandboxLimitHit) {
        reviving = true;
        console.log("[health] GrassVM down, calling requestContainer");
        const token = await getToken();
        if (token) {
          const res = await requestContainer(token);
          if (res.ok && res.data.url) {
            setPrimaryVmUrl(res.data.url);
            await saveVmUrl(res.data.url);
            const urls = await getUrls();
            setVmUrls(orderVmUrls(urls, res.data.url));
          } else if (!res.ok && res.status === 403) {
            sandboxLimitHit = true;
            Alert.alert(
              "VM Monthly Usage Limit Reached",
              res.error,
            );
          }
        }
        reviving = false;
      }
    }

    pollAll();
    const interval = setInterval(pollAll, 15000);
    return () => clearInterval(interval);
  }, [vmUrls, primaryVmUrl]);

  // Fetch repos from the grass server when VM is running
  useEffect(() => {
    if (!vmRunning) return;
    let cancelled = false;

    async function fetchRepos() {
      if (!selectedVmUrl) {
        setRepos([]);
        setReposLoading(false);
        return;
      }
      setReposLoading(true);
      const serverUrl = selectedVmUrl;
      if (cancelled) {
        setReposLoading(false);
        return;
      }

      const key = resolveServerKey(serverUrl);
      const realUrl = resolveServerUrl(serverUrl);
      openConnectionWithKey(key, realUrl);
      await listReposStore(key);
      if (cancelled) return;

      const entry = getEntry(key);
      const repoList = entry?.repos ?? [];

      await Promise.all(
        repoList.map((r) => getRepoDetailsStore(key, r.path)),
      );
      if (cancelled) return;

      const updatedEntry = getEntry(key);
      const details = updatedEntry?.repoDetails ?? new Map();

      const mapped: RepoItem[] = repoList.map((r, i) => {
        const d = details.get(r.path);
        return {
          id: String(i),
          name: r.name,
          path: r.path,
          branch: d?.branch ?? "main",
          action: "Open Code",
          badge: d?.dominantLanguage ?? (r.isGit ? "Git" : "Folder"),
          badgeType: "gray" as const,
        };
      });

      if (!cancelled) {
        setRepos(mapped);
        setReposLoading(false);
      }
    }

    fetchRepos();
    return () => {
      cancelled = true;
    };
  }, [vmRunning, selectedVmUrl]);

  const refreshRepos = useCallback(async () => {
    if (!selectedVmUrl) return;
    setReposLoading(true);
    const key = resolveServerKey(selectedVmUrl);
    const realUrl = resolveServerUrl(selectedVmUrl);
    openConnectionWithKey(key, realUrl);
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
  }, [selectedVmUrl]);

  const handleRemoveUserVm = useCallback(async (idx: number) => {
    if (idx <= 0 || idx >= vmUrls.length) return;
    const targetUrl = vmUrls[idx];
    await removeUrl(targetUrl);
    const updated = await getUrls();
    setVmUrls(orderVmUrls(updated, primaryVmUrl));
    if (activeVmTab === idx || activeVmTab >= updated.length) {
      setActiveVmTab(0);
    }
  }, [vmUrls, primaryVmUrl, activeVmTab]);

  const handleSelectAgent = useCallback((agentId: string) => {
    if (!pendingRepo || !selectedServerKey) return;
    const repo = pendingRepo;
    setPendingRepo(null);
    router.push({
      pathname: "/sessions",
      params: {
        serverUrl: selectedServerKey,
        repoPath: repo.path,
        repoName: repo.name,
        agent: agentId,
      },
    });
  }, [pendingRepo, selectedServerKey, router]);

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          const connectedUrls = getConnectedUrls();
          connectedUrls.forEach((url) => closeConnection(url));
          await clearUrls();
          setVmUrls([]);
          setPrimaryVmUrl(undefined);
          setActiveVmTab(0);
          await clearAuth();
          router.replace("/welcome");
        },
      },
    ]);
  }, [router]);

  const value = useMemo<NavbarContextValue>(() => ({
    vmUrls,
    setVmUrls,
    primaryVmUrl,
    setPrimaryVmUrl,
    activeVmTab,
    setActiveVmTab,
    selectedVmUrl,
    selectedServerKey,
    permsCount,
    repos,
    setRepos,
    reposLoading,
    setReposLoading,
    threads,
    pendingRepo,
    setPendingRepo,
    getMoreVisible,
    setGetMoreVisible,
    sheetInitialView,
    setSheetInitialView,
    vmRunning,
    vmUrlStatuses,
    refreshRepos,
    handleRemoveUserVm,
    handleSelectAgent,
    handleLogout,
  }), [
    vmUrls, primaryVmUrl, activeVmTab, selectedVmUrl, selectedServerKey,
    permsCount, repos, reposLoading, threads, pendingRepo,
    getMoreVisible, sheetInitialView, vmRunning, vmUrlStatuses,
    refreshRepos, handleRemoveUserVm, handleSelectAgent, handleLogout,
  ]);

  return (
    <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>
  );
}
