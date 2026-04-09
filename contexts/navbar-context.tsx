import { isSandboxUsageLimitError } from "@/api/client";
import { heartbeat, signedPreviewUrl } from "@/api/containers";
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
  getCachedPrimaryVmUrl,
  getLastActiveTab,
  getUrls,
  refreshPrimaryVmUrl,
  removeUrl,
  resolveServerKey,
  resolveServerUrl,
  saveLastActiveTab,
  saveVmUrl,
} from "@/store/url-store";
import {
  isGrassSetupNavigationSuppressed,
  setGrassVmReadyListener,
} from "@/store/grass-vm-events";
import {
  Thread,
  getThreadsForServer,
  subscribeThreads,
} from "@/store/thread-store";
import { usePathname, useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  /** Re-sync backend container state (e.g. when tabs regain focus). */
  refreshGrassVmState: () => Promise<void>;

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
  const pathname = usePathname();

  const [activeVmTab, setActiveVmTab] = useState(0);
  const [permsCount, setPermsCount] = useState(0);
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [getMoreVisible, setGetMoreVisible] = useState(false);
  const [sheetInitialView, setSheetInitialView] = useState<
    "home" | "connect-agent" | "connect-laptop" | "add-repository" | "github-repos"
  >("home");
  const [vmRunning, setVmRunning] = useState(true);
  const [primaryVmUrl, setPrimaryVmUrl] = useState<string | undefined>(
    () => getCachedPrimaryVmUrl() ?? undefined,
  );
  const [vmUrls, setVmUrls] = useState<string[]>(() => {
    const p = getCachedPrimaryVmUrl();
    return p ? orderVmUrls([], p) : [];
  });
  const [vmUrlStatuses, setVmUrlStatuses] = useState<Map<string, boolean>>(new Map());
  const [pendingRepo, setPendingRepo] = useState<RepoItem | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  /** True after the first getUrls() + order completes (avoids treating pre-hydration [] as "no servers"). */
  const [urlsHydrated, setUrlsHydrated] = useState(false);

  const activeVmTabRef = useRef(activeVmTab);
  activeVmTabRef.current = activeVmTab;

  const selectedVmUrl = vmUrls[activeVmTab] ?? undefined;
  const selectedServerKey = selectedVmUrl
    ? resolveServerKey(selectedVmUrl)
    : undefined;

  // Hydrate primary URL into React state from VM_URL_KEY so tabs label correctly before
  // heartbeat completes (avoids treating index 0 as GrassVM while primaryVmUrl was undefined).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await refreshPrimaryVmUrl();
      if (!cancelled && stored) {
        setPrimaryVmUrl(stored);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // When vmUrls reorder (e.g. primary known), keep the same server selected by URL, not index.
  const prevVmUrlsKeyRef = useRef("");
  useEffect(() => {
    const key = JSON.stringify(vmUrls);
    const prevKey = prevVmUrlsKeyRef.current;
    if (prevKey && prevKey !== key) {
      const prevUrls = JSON.parse(prevKey) as string[];
      if (prevUrls.length > 0 && vmUrls.length > 0) {
        const tab = activeVmTabRef.current;
        const sel = prevUrls[tab];
        if (sel !== undefined) {
          const ni = vmUrls.indexOf(sel);
          if (ni >= 0 && ni !== tab) {
            setActiveVmTab(ni);
          } else if (ni < 0) {
            setActiveVmTab(0);
          }
        }
      }
    }
    prevVmUrlsKeyRef.current = key;
  }, [vmUrls]);

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
        setUrlsHydrated(true);
      }
    }
    loadVmUrls();
    return () => {
      cancelled = true;
    };
  }, [primaryVmUrl]);

  // Restore last active tab from storage once URLs are loaded
  const [tabRestored, setTabRestored] = useState(false);
  useEffect(() => {
    if (tabRestored || !urlsHydrated) return;
    // Confirmed empty list after storage read (e.g. first login, no VM_URL_KEY / no custom URLs).
    if (vmUrls.length === 0) {
      setTabRestored(true);
      return;
    }
    async function restore() {
      const lastTab = await getLastActiveTab();
      if (!lastTab || lastTab === GRASS_VM_KEY) {
        // No stored tab or was on GrassVM — default to index 0
        setActiveVmTab(0);
      } else {
        // Custom server URL — check if it still exists in the list
        const idx = vmUrls.indexOf(lastTab);
        setActiveVmTab(idx >= 0 ? idx : 0);
      }
      setTabRestored(true);
    }
    restore();
  }, [vmUrls, tabRestored, urlsHydrated]);

  // Persist active tab to storage on change
  // Store GRASS_VM_KEY for GrassVM tab, actual URL for custom servers
  useEffect(() => {
    if (!tabRestored || vmUrls.length === 0) return;
    const url = vmUrls[activeVmTab];
    if (url) {
      const isGrassVm = primaryVmUrl && url === primaryVmUrl;
      saveLastActiveTab(isGrassVm ? GRASS_VM_KEY : url);
    }
  }, [activeVmTab, vmUrls, primaryVmUrl, tabRestored]);

  // Clamp activeVmTab if vmUrls shrinks
  useEffect(() => {
    if (activeVmTab >= vmUrls.length && vmUrls.length > 0) {
      setActiveVmTab(0);
    }
  }, [activeVmTab, vmUrls.length]);

  useEffect(() => {
    setGrassVmReadyListener(() => {
      setVmRunning(true);
    });
    return () => setGrassVmReadyListener(null);
  }, []);

  const refreshGrassVmState = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const hb = await heartbeat(token);
    if (hb.ok && hb.data.container === "running" && hb.data.grass) {
      setVmRunning(true);
    } else {
      setVmRunning(false);
    }
  }, []);

  // GrassVM tab selected but VM is down → full-screen setup (spinner + /request via container-setup).
  useEffect(() => {
    if (!tabRestored) return;
    if (pathname === "/container-setup") return;
    if (isGrassSetupNavigationSuppressed()) return;
    if (!primaryVmUrl || selectedVmUrl !== primaryVmUrl) return;

    const edgeDown = vmUrlStatuses.get(primaryVmUrl) === false;
    const backendDown = !vmRunning;
    if (!edgeDown && !backendDown) return;

    router.replace("/container-setup");
  }, [
    tabRestored,
    pathname,
    primaryVmUrl,
    selectedVmUrl,
    vmRunning,
    vmUrlStatuses,
    router,
  ]);

  // Check container health on mount — only wake VM if last active tab was GrassVM
  useEffect(() => {
    if (!tabRestored) return;
    let cancelled = false;
    async function checkContainer() {
      const token = await getToken();
      if (!token || cancelled) return;

      // Only check and wake the VM if user was last on the GrassVM tab
      const lastTab = await getLastActiveTab();
      const wasOnGrassVm = !lastTab || lastTab === GRASS_VM_KEY;

      const hb = await heartbeat(token);
      if (cancelled) return;

      if (!hb.ok && isSandboxUsageLimitError(hb)) {
        setVmRunning(false);
        Alert.alert("VM Monthly Usage Limit Reached", hb.error);
      } else if (!hb.ok || hb.data.container !== "running" || !hb.data.grass) {
        setVmRunning(false);
        if (wasOnGrassVm) {
          router.replace("/container-setup");
        }
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
          setVmUrls((prev) =>
            orderVmUrls([...new Set([...prev, backendPreviewUrl])], backendPreviewUrl),
          );
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
  }, [router, tabRestored]);

  // Poll health for all known URLs to drive per-URL status dots.
  // If the primary GrassVM goes down, call requestContainer to wake it.
  useEffect(() => {
    if (vmUrls.length === 0) return;

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
    }

    pollAll();
    const interval = setInterval(pollAll, 15000);
    return () => clearInterval(interval);
  }, [vmUrls, primaryVmUrl, selectedVmUrl]);

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
    refreshGrassVmState,
    refreshRepos,
    handleRemoveUserVm,
    handleSelectAgent,
    handleLogout,
  }), [
    vmUrls, primaryVmUrl, activeVmTab, selectedVmUrl, selectedServerKey,
    permsCount, repos, reposLoading, threads, pendingRepo,
    getMoreVisible, sheetInitialView, vmRunning, vmUrlStatuses,
    refreshGrassVmState,
    refreshRepos, handleRemoveUserVm, handleSelectAgent, handleLogout,
  ]);

  return (
    <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>
  );
}
