import { isSandboxUsageLimitError } from "@/api/client";
import { heartbeat, requestContainer, signedPreviewUrl } from "@/api/containers";
import { clearAuth, getToken } from "@/store/auth-store";
import { unregisterPushTokenOnLogout } from "@/hooks/use-push-notifications";
import { clearAllVmMetadata } from "@/store/vm-metadata-store";
import {
  closeConnection,
  getConnectedUrls,
  getEntry,
  getPermissions,
  getRepoDetailsStore,
  healthStore,
  listReposStore,
  openConnectionWithKey,
  subscribeToPermissions,
} from "@/store/connection-store";
import type { CompatResult } from "@/store/version-compat";
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
  clearPendingGrassUsageLimitHit,
  consumePendingGrassUsageLimitHit,
  isGrassSetupNavigationSuppressed,
  notifyGrassVmReady,
  setGrassUsageLimitListener,
  setGrassVmReadyListener,
} from "@/store/grass-vm-events";
import {
  alertSandboxUsageLimitOnce,
  resetSandboxUsageLimitAlertDebounce,
} from "@/store/usage-limit-alert";
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
  /** True when Grass managed sandbox is blocked by monthly usage (custom VMs still work). */
  grassSandboxBlockedByUsageLimit: boolean;
  /** Re-check heartbeat when user taps GrassVM while usage-blocked (credits may have been restored). */
  requestGrassVmUsageRecheck: () => void;
  /** True while the Grass VM heartbeat check is in flight (shows spinner + overlay). */
  grassVmChecking: boolean;
  /** Set of server URLs whose version is incompatible with this app. */
  incompatUrls: Set<string>;

  // VM wake state (shared between Home and Repos tabs)
  startupOverlayVisible: boolean;
  wakeFailed: boolean;
  retryWake: () => void;
  notifyWakeTabFocus: () => void;
  notifyWakeTabBlur: () => void;

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
  /** Grass managed sandbox blocked by monthly usage — do not send user to container-setup; custom VMs OK. */
  const [grassSandboxBlockedByUsageLimit, setGrassSandboxBlockedByUsageLimit] = useState(false);
  const grassSandboxBlockedRef = useRef(grassSandboxBlockedByUsageLimit);
  grassSandboxBlockedRef.current = grassSandboxBlockedByUsageLimit;
  const grassLimitRecheckInFlightRef = useRef(false);
  const [grassVmChecking, setGrassVmChecking] = useState(false);
  const [incompatUrls, setIncompatUrls] = useState<Set<string>>(new Set());
  const versionAlertVisibleRef = useRef(false);

  const activeVmTabRef = useRef(activeVmTab);
  activeVmTabRef.current = activeVmTab;
  const vmUrlsRef = useRef(vmUrls);
  vmUrlsRef.current = vmUrls;
  const primaryVmUrlRef = useRef(primaryVmUrl);
  primaryVmUrlRef.current = primaryVmUrl;
  const vmRunningRef = useRef(vmRunning);
  vmRunningRef.current = vmRunning;

  // ─── VM wake state (shared across Home + Repos tabs) ──────────────────────
  const [startupOverlayVisible, setStartupOverlayVisible] = useState(false);
  const [wakeFailed, setWakeFailed] = useState(false);
  const wakeRunIdRef = useRef(0);
  const wakeTriggeredRef = useRef(false);
  const wakeFocusCountRef = useRef(0);
  const wakeCancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedVmUrl = vmUrls[activeVmTab] ?? undefined;
  const selectedVmUrlRef = useRef(selectedVmUrl);
  selectedVmUrlRef.current = selectedVmUrl;
  const selectedServerKey = selectedVmUrl
    ? resolveServerKey(selectedVmUrl)
    : undefined;

  const primaryEdgeHealthBad =
    !!primaryVmUrl && vmUrlStatuses.get(primaryVmUrl) === false;

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
      try {
        const [urls, lastTab] = await Promise.all([getUrls(), getLastActiveTab()]);
        if (!cancelled) {
          const ordered = orderVmUrls(urls, primaryVmUrl);
          setVmUrls(ordered);
          // Resolve and apply the last active tab only on the first run — subsequent
          // primaryVmUrl changes (e.g. signed URL rotation) must not reset the active tab.
          if (!tabRestoredRef.current) {
            tabRestoredRef.current = true;
            if (lastTab && lastTab !== GRASS_VM_KEY && ordered.length > 0) {
              const idx = ordered.indexOf(lastTab);
              setActiveVmTab(idx >= 0 ? idx : 0);
            } else {
              setActiveVmTab(0);
            }
            setTabRestored(true);
          }
        }
      } catch {
        if (!cancelled) {
          if (!tabRestoredRef.current) {
            tabRestoredRef.current = true;
            setActiveVmTab(0);
            setTabRestored(true);
          }
        }
      }
    }
    loadVmUrls();
    return () => {
      cancelled = true;
    };
  }, [primaryVmUrl]);

  const [tabRestored, setTabRestored] = useState(false);
  const tabRestoredRef = useRef(false);

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
      setGrassSandboxBlockedByUsageLimit(false);
      // Sync the new signed preview URL from url-store into React state so
      // the health poll targets the fresh URL instead of an expired one.
      // Setting primaryVmUrl triggers the existing useEffect [primaryVmUrl]
      // which reloads vmUrls from AsyncStorage automatically.
      (async () => {
        const newUrl = await refreshPrimaryVmUrl();
        if (newUrl) {
          setPrimaryVmUrl(newUrl);
        }
      })();
    });
    return () => setGrassVmReadyListener(null);
  }, []);

  useEffect(() => {
    setGrassUsageLimitListener(() => {
      setGrassSandboxBlockedByUsageLimit(true);
      setVmRunning(false);
      alertSandboxUsageLimitOnce(
        "Your Grass sandbox has reached its monthly usage limit. You can keep using other connected machines.",
      );
    });
    return () => setGrassUsageLimitListener(null);
  }, []);

  useEffect(() => {
    if (consumePendingGrassUsageLimitHit()) {
      setGrassSandboxBlockedByUsageLimit(true);
      setVmRunning(false);
      alertSandboxUsageLimitOnce(
        "Your Grass sandbox has reached its monthly usage limit. You can keep using other connected machines.",
      );
    }
  }, []);

  const refreshGrassVmState = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const hb = await heartbeat(token);
    if (!hb.ok && isSandboxUsageLimitError(hb)) {
      setGrassSandboxBlockedByUsageLimit(true);
      setVmRunning(false);
      return;
    }
    if (hb.ok && hb.data.container === "running" && hb.data.grass) {
      setGrassSandboxBlockedByUsageLimit(false);
      setVmRunning(true);
    } else {
      setGrassSandboxBlockedByUsageLimit(false);
      setVmRunning(false);
    }
  }, []);

  // ─── Wake callbacks ────────────────────────────────────────────────────────

  const cancelWake = useCallback(() => {
    wakeRunIdRef.current += 1;
    wakeTriggeredRef.current = false;
    setStartupOverlayVisible(false);
  }, []);

  const startWakeInternal = useCallback(() => {
    if (vmRunningRef.current) return;
    if (wakeTriggeredRef.current) return;
    const primary = primaryVmUrlRef.current;
    const selected = selectedVmUrlRef.current;
    if (!primary || selected !== primary) return;

    wakeTriggeredRef.current = true;
    setWakeFailed(false);
    setStartupOverlayVisible(true);

    const runId = ++wakeRunIdRef.current;
    setTimeout(() => {
      if (wakeRunIdRef.current === runId) setStartupOverlayVisible(false);
    }, 2000);

    (async () => {
      try {
        const token = await getToken();
        if (wakeRunIdRef.current !== runId) return;
        if (!token) { wakeTriggeredRef.current = false; setWakeFailed(true); return; }

        const req = await requestContainer(token);
        if (wakeRunIdRef.current !== runId) return;
        if (!req.ok) { wakeTriggeredRef.current = false; setWakeFailed(true); return; }

        const pollStart = Date.now();
        while (wakeRunIdRef.current === runId && Date.now() - pollStart < 120000) {
          const hb = await heartbeat(token);
          if (wakeRunIdRef.current !== runId) return;
          if (hb.ok && hb.data.container === "running" && hb.data.grass) {
            let previewUrl = hb.data.url;
            if (!previewUrl) {
              const preview = await signedPreviewUrl(token);
              if (preview.ok) previewUrl = preview.data.url;
            }
            if (wakeRunIdRef.current !== runId) return;
            if (previewUrl) await saveVmUrl(previewUrl);
            if (wakeRunIdRef.current !== runId) return;
            notifyGrassVmReady();
            return;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }

        if (wakeRunIdRef.current === runId) {
          wakeTriggeredRef.current = false;
          setWakeFailed(true);
        }
      } catch {
        if (wakeRunIdRef.current === runId) {
          wakeTriggeredRef.current = false;
          setWakeFailed(true);
        }
      }
    })();
  }, []);

  const retryWake = useCallback(() => {
    wakeTriggeredRef.current = false;
    setWakeFailed(false);
    startWakeInternal();
  }, [startWakeInternal]);

  const notifyWakeTabFocus = useCallback(() => {
    if (wakeCancelTimerRef.current) {
      clearTimeout(wakeCancelTimerRef.current);
      wakeCancelTimerRef.current = null;
    }
    wakeFocusCountRef.current += 1;
    startWakeInternal();
  }, [startWakeInternal]);

  const notifyWakeTabBlur = useCallback(() => {
    wakeFocusCountRef.current -= 1;
    wakeCancelTimerRef.current = setTimeout(() => {
      wakeCancelTimerRef.current = null;
      if (wakeFocusCountRef.current <= 0) {
        cancelWake();
        setWakeFailed(false);
      }
    }, 50);
  }, [cancelWake]);

  // Reset wake state when VM comes back up
  useEffect(() => {
    if (vmRunning) {
      wakeRunIdRef.current += 1;
      wakeTriggeredRef.current = false;
      setStartupOverlayVisible(false);
      setWakeFailed(false);
    }
  }, [vmRunning]);

  // Auto-start wake when VM goes down while a tab is focused
  useEffect(() => {
    if (!vmRunning && wakeFocusCountRef.current > 0) {
      startWakeInternal();
    }
  }, [vmRunning, startWakeInternal]);

  /** User tapped GrassVM while usage-limited — re-verify; restore normal flow if credits OK. */
  const requestGrassVmUsageRecheck = useCallback(() => {
    if (!grassSandboxBlockedRef.current) return;
    if (grassLimitRecheckInFlightRef.current) return;
    grassLimitRecheckInFlightRef.current = true;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const hb = await heartbeat(token);
        if (!hb.ok && isSandboxUsageLimitError(hb)) {
          resetSandboxUsageLimitAlertDebounce();
          alertSandboxUsageLimitOnce(hb.error);
          const urls = vmUrlsRef.current;
          const primary = primaryVmUrlRef.current ?? getCachedPrimaryVmUrl() ?? undefined;
          if (primary && urls.some((u) => u !== primary)) {
            const idx = urls.findIndex((u) => u !== primary);
            if (idx >= 0) setActiveVmTab(idx);
          }
          return;
        }

        setGrassSandboxBlockedByUsageLimit(false);

        if (hb.ok && hb.data.container === "running" && hb.data.grass) {
          setVmRunning(true);
          let backendPreviewUrl: string | undefined;
          const preview = await signedPreviewUrl(token);
          if (preview.ok) {
            backendPreviewUrl = preview.data.url;
          } else if (hb.data.url) {
            backendPreviewUrl = hb.data.url;
          }
          if (backendPreviewUrl) {
            await saveVmUrl(backendPreviewUrl);
          }
          const urls = await getUrls();
          setPrimaryVmUrl(backendPreviewUrl);
          setVmUrls(orderVmUrls(urls, backendPreviewUrl));
          return;
        }

        setVmRunning(false);
      } finally {
        grassLimitRecheckInFlightRef.current = false;
      }
    })();
  }, [router]);

  // GrassVM tab selected but VM appears down → confirm with heartbeat before vm-final.
  // Usage limit (403) blocks Grass only in-app; no setup screen.
  useEffect(() => {
    if (!tabRestored) return;
    if (pathname === "/onboarding/vm-final") return;
    if (grassSandboxBlockedByUsageLimit) return;
    if (isGrassSetupNavigationSuppressed()) return;
    if (!primaryVmUrl || selectedVmUrl !== primaryVmUrl) return;

    const backendDown = !vmRunning;
    if (!primaryEdgeHealthBad && !backendDown) return;

    let cancelled = false;

    setGrassVmChecking(true);

    (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const hb = await heartbeat(token);
        if (cancelled) return;
        if (!hb.ok && isSandboxUsageLimitError(hb)) {
          setGrassSandboxBlockedByUsageLimit(true);
          setVmRunning(false);
          alertSandboxUsageLimitOnce(hb.error);
          const urls = vmUrlsRef.current;
          const primary = primaryVmUrlRef.current ?? getCachedPrimaryVmUrl() ?? undefined;
          if (primary && urls.some((u) => u !== primary)) {
            const idx = urls.findIndex((u) => u !== primary);
            if (idx >= 0) setActiveVmTab(idx);
          }
          return;
        }
        if (cancelled) return;
        if (grassSandboxBlockedRef.current) return;

        // Container is actually running — the edge health failure was caused by a
        // rotated signed URL, not a stopped container.  Refresh the URL in-place
        // instead of bouncing through container-setup.
        if (hb.ok && hb.data.container === "running" && hb.data.grass) {
          setVmRunning(true);
          let backendPreviewUrl: string | undefined;
          const preview = await signedPreviewUrl(token);
          if (!cancelled && preview.ok) {
            backendPreviewUrl = preview.data.url;
          } else if (hb.data.url) {
            backendPreviewUrl = hb.data.url;
          }
          if (backendPreviewUrl && !cancelled) {
            await saveVmUrl(backendPreviewUrl);
            const newUrl = await refreshPrimaryVmUrl();
            if (newUrl && !cancelled) {
              setPrimaryVmUrl(newUrl);
            }
          }
          return;
        }

        setVmRunning(false);
      } finally {
        if (!cancelled) setGrassVmChecking(false);
      }
    })();
    return () => {
      cancelled = true;
      setGrassVmChecking(false);
    };
  }, [
    tabRestored,
    pathname,
    primaryVmUrl,
    selectedVmUrl,
    vmRunning,
    primaryEdgeHealthBad,
    router,
    grassSandboxBlockedByUsageLimit,
  ]);

  // Switching onto GrassVM while usage-limited: background heartbeat (same as re-tap on GrassVM tab).
  const prevVmTabForLimitRef = useRef(activeVmTab);
  useEffect(() => {
    const prevTab = prevVmTabForLimitRef.current;
    prevVmTabForLimitRef.current = activeVmTab;

    if (!tabRestored || !grassSandboxBlockedByUsageLimit || !primaryVmUrl || vmUrls.length === 0) {
      return;
    }
    const primaryIdx = vmUrls.indexOf(primaryVmUrl);
    if (primaryIdx < 0) return;
    if (activeVmTab !== primaryIdx) return;
    if (prevTab === activeVmTab) return;

    requestGrassVmUsageRecheck();
  }, [
    activeVmTab,
    grassSandboxBlockedByUsageLimit,
    primaryVmUrl,
    vmUrls,
    tabRestored,
    requestGrassVmUsageRecheck,
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
        setGrassSandboxBlockedByUsageLimit(true);
        setVmRunning(false);
        alertSandboxUsageLimitOnce(hb.error);
        const urls = vmUrlsRef.current;
        const primary = primaryVmUrlRef.current ?? getCachedPrimaryVmUrl() ?? undefined;
        if (primary && urls.some((u) => u !== primary)) {
          const idx = urls.findIndex((u) => u !== primary);
          if (idx >= 0) setActiveVmTab(idx);
        }
      } else if (!hb.ok || hb.data.container !== "running" || !hb.data.grass) {
        setGrassSandboxBlockedByUsageLimit(false);
        setVmRunning(false);
        if (wasOnGrassVm) {
          setVmRunning(false);
        }
      } else {
        setGrassSandboxBlockedByUsageLimit(false);
        setVmRunning(true);
        let backendPreviewUrl: string | undefined;
        const preview = await signedPreviewUrl(token);
        if (preview.ok) {
          backendPreviewUrl = preview.data.url;
        } else if (hb.data.url) {
          backendPreviewUrl = hb.data.url;
        }
        if (backendPreviewUrl) {
          await saveVmUrl(backendPreviewUrl);
        }
        const urls = await getUrls();
        if (!cancelled) {
          setPrimaryVmUrl(backendPreviewUrl);
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
          try {
            // Ensure a connection entry exists — healthStore returns { compatible: true }
            // immediately without making any HTTP request if no entry is found.
            const key = resolveServerKey(url);
            const realUrl = resolveServerUrl(url);
            openConnectionWithKey(key, realUrl);

            const result = await Promise.race<CompatResult>([
              healthStore(url),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 4000)
              ),
            ]);

            setIncompatUrls((prev) => {
              const alreadyIncompat = prev.has(url);
              if (!result.compatible && alreadyIncompat) return prev;
              if (result.compatible && !alreadyIncompat) return prev;
              const next = new Set(prev);
              if (!result.compatible) next.add(url);
              else next.delete(url);
              return next;
            });

            if (!result.compatible && url === selectedVmUrlRef.current && !versionAlertVisibleRef.current) {
              versionAlertVisibleRef.current = true;
              Alert.alert(
                'Version Mismatch',
                "This server's version is not compatible with your app. Please upgrade both the server CLI (npm install -g @grass-ai/ide) and the app to the latest version.",
                [{ text: 'OK', onPress: () => { versionAlertVisibleRef.current = false; } }],
                { onDismiss: () => { versionAlertVisibleRef.current = false; } },
              );
            }

            return { url, ok: true };
          } catch {
            return { url, ok: false };
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
  }, [vmUrls, primaryVmUrl]);

  // Fetch repos for the selected server. GrassVM needs vmRunning; custom machines work even if Grass is down or usage-limited.
  useEffect(() => {
    const onGrassVm =
      !!primaryVmUrl && !!selectedVmUrl && selectedVmUrl === primaryVmUrl;
    if (onGrassVm && !vmRunning) return;

    let cancelled = false;

    async function fetchRepos() {
      if (!selectedVmUrl) {
        setRepos([]);
        setReposLoading(false);
        return;
      }

      setReposLoading(true);
      const serverUrl = selectedVmUrl;

      try {
        if (cancelled) {
          setReposLoading(false);
          return;
        }

        const key = resolveServerKey(serverUrl);
        const realUrl = resolveServerUrl(serverUrl);
        openConnectionWithKey(key, realUrl);
        await listReposStore(key);
        if (cancelled) {
          setReposLoading(false);
          return;
        }

        const entry = getEntry(key);
        const repoList = entry?.repos ?? [];

        await Promise.all(
          repoList.map((r) => getRepoDetailsStore(key, r.path)),
        );
        if (cancelled) {
          setReposLoading(false);
          return;
        }

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
        }
      } catch {
        // Keep previous repos on fetch failure.
      } finally {
        if (!cancelled) setReposLoading(false);
      }
    }

    fetchRepos();
    return () => {
      cancelled = true;
    };
  }, [vmRunning, selectedVmUrl, primaryVmUrl]);

  const refreshRepos = useCallback(async () => {
    if (!selectedVmUrl) return;
    const onGrassVm =
      !!primaryVmUrl && selectedVmUrl === primaryVmUrl;
    if (onGrassVm && !vmRunning) return;

    setReposLoading(true);
    try {
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
    } catch {
      // Keep previous repos on refresh failure.
    } finally {
      setReposLoading(false);
    }
  }, [selectedVmUrl, primaryVmUrl, vmRunning]);

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
          await clearAllVmMetadata();
          setVmUrls([]);
          setPrimaryVmUrl(undefined);
          setActiveVmTab(0);
          setGrassSandboxBlockedByUsageLimit(false);
          clearPendingGrassUsageLimitHit();
          resetSandboxUsageLimitAlertDebounce();
          setIncompatUrls(new Set());
          await unregisterPushTokenOnLogout();
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
    grassSandboxBlockedByUsageLimit,
    requestGrassVmUsageRecheck,
    grassVmChecking,
    incompatUrls,
    refreshRepos,
    handleRemoveUserVm,
    handleSelectAgent,
    handleLogout,
    startupOverlayVisible,
    wakeFailed,
    retryWake,
    notifyWakeTabFocus,
    notifyWakeTabBlur,
  }), [
    vmUrls, primaryVmUrl, activeVmTab, selectedVmUrl, selectedServerKey,
    permsCount, repos, reposLoading, threads, pendingRepo,
    getMoreVisible, sheetInitialView, vmRunning, vmUrlStatuses,
    refreshGrassVmState,
    grassSandboxBlockedByUsageLimit,
    requestGrassVmUsageRecheck,
    grassVmChecking,
    incompatUrls,
    refreshRepos, handleRemoveUserVm, handleSelectAgent, handleLogout,
    startupOverlayVisible, wakeFailed, retryWake, notifyWakeTabFocus, notifyWakeTabBlur,
  ]);

  return (
    <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>
  );
}
