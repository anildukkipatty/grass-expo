import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { getToken } from "@/store/auth-store";
import { registerPushToken, removePushToken } from "@/api/notifications";
import { ackDispatchSessions, fetchDispatchSessions } from "@/api/dispatch";
import { findThreadById, upsertThread } from "@/store/thread-store";
import { refreshPrimaryVmUrl } from "@/store/url-store";

type DispatchCompleteData = {
  type: "dispatch_complete";
  status?: "success" | "failed";
  grassId: string;
  sessionId?: string;   // real grass-ide session ID; absent when fallback headless path ran
  repo: string;
  repoPath: string;
  serverUrl: string;
  tool: string;
  title: string;
  time: string;
};

type NotificationData =
  | { type: "permission" }
  | { type: "task_complete"; sessionId?: string; serverId?: string }
  | { type: "container_ready" }
  | { type: "limit_exceeded" }
  | DispatchCompleteData;

const PUSH_TOKEN_KEY = "expo_push_token";
const EAS_PROJECT_ID = "5f83639c-9362-4793-86cd-31ab41f09788";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isActive = AppState.currentState === "active";
    const data = notification.request.content.data as NotificationData | undefined;
    const isFailedDispatch =
      data?.type === "dispatch_complete" && data.status === "failed";
    const suppress = isActive && !isFailedDispatch;
    return {
      shouldShowAlert: !suppress,
      shouldPlaySound: !suppress,
      shouldSetBadge: false,
      shouldShowBanner: !suppress,
      shouldShowList: !suppress,
    };
  },
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) return null;
  // Not supported on web
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: EAS_PROJECT_ID,
  });

  return tokenData.data;
}

// Exported so login flow can call this right after saveAuth()
// The hook alone can't handle the race where getToken() returns null on first mount
export async function registerPushTokenAfterLogin(): Promise<void> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (!token) return;

    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);

    const authToken = await getToken();
    if (!authToken) return;

    const platform = Platform.OS === "ios" ? "ios" : "android";
    const result = await registerPushToken(token, platform, authToken);
    if (result.ok) {
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    }
  } catch (_err) {}
}

// Saves a synthetic thread for a dispatched task and acks the server so the same
// session is not returned by the mount sync. Idempotent: upsertThread dedupes by grassId,
// and the server-side ack guards on `deletedAt is null`.
async function saveDispatchThread(data: DispatchCompleteData): Promise<void> {
  if (!data.grassId || !data.serverUrl) return;
  // Use the real grass-ide sessionId as the thread key when available so the
  // chat screen can load history and re-attach the SSE stream if still running.
  // Fall back to the synthetic grassId only when grass-ide wasn't reachable.
  const threadGrassId = data.sessionId || data.grassId;
  await upsertThread({
    grassId: threadGrassId,
    title: data.title || data.repo,
    repo: data.repo,
    repoPath: data.repoPath,
    tool: data.tool || "claude-code",
    serverUrl: data.serverUrl,
    time: data.time || new Date().toISOString(),
    isDispatch: !data.sessionId,
  });
  // Ack uses the DispatchSession DB row ID (data.grassId), not the session ID.
  try {
    const authToken = await getToken();
    if (authToken) await ackDispatchSessions([data.grassId], authToken);
  } catch (_err) {}
}

// Drains the server-side DispatchSession queue: fetches unacknowledged completed
// sessions, saves each as a local thread, then acks so they aren't re-inserted.
// Called on mount (Scenario 4) and on every foreground transition (AppState "active").
async function syncDispatchSessions(): Promise<void> {
  try {
    await refreshPrimaryVmUrl();
    const authToken = await getToken();
    if (!authToken) return;
    const result = await fetchDispatchSessions(authToken);
    if (!result.ok) return;
    const sessions = result.data.data?.sessions ?? [];
    const ackedIds: string[] = [];
    for (const s of sessions) {
      if (!s.serverUrl) continue;
      await upsertThread({
        grassId: s.sessionId || s.id,
        title: s.title || s.repo,
        repo: s.repo,
        repoPath: s.repoPath,
        tool: "claude-code",
        serverUrl: s.serverUrl,
        time: s.createdAt,
        isDispatch: !s.sessionId,
      });
      ackedIds.push(s.id);
    }
    if (ackedIds.length) await ackDispatchSessions(ackedIds, authToken);
  } catch (_err) {}
}

// Exported so logout flows can deregister the device token before clearing auth
export async function unregisterPushTokenOnLogout(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) return;

    const authToken = await getToken();
    if (!authToken) return;

    await removePushToken(token, authToken);
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  } catch (_err) {}
}

export function usePushNotifications() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const appStateListener = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        Notifications.dismissAllNotificationsAsync();
        void syncDispatchSessions();
      }
    });

    let cancelled = false;

    (async () => {
      // ── Push token registration ──────────────────────────────────────────
      try {
        const token = await registerForPushNotificationsAsync();
        if (token && !cancelled) {
          const cached = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
          if (cached !== token) {
            const authToken = await getToken();
            if (authToken && !cancelled) {
              const platform = Platform.OS === "ios" ? "ios" : "android";
              const result = await registerPushToken(token, platform, authToken);
              if (result.ok) await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
            }
          }
        }
      } catch (_err) {}

      // ── Scenario 3: killed app, user tapped the notification that launched it ──
      // Save only — navigation is handled by addNotificationResponseReceivedListener
      // (which also fires for cold launches), avoiding double-push.
      try {
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastResponse && !cancelled) {
          const data = lastResponse.notification.request.content.data as NotificationData | undefined;
          if (data?.type === "dispatch_complete") {
            await saveDispatchThread(data);
          }
        }
      } catch (_err) {}

      // ── Scenario 4: user opened the app directly (bypassed the notification) ──
      if (!cancelled) await syncDispatchSessions();
    })();

    // Fires when a notification is received while the app is in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const data = notification.request.content.data as NotificationData | undefined;
        if (data?.type === "dispatch_complete") {
          await saveDispatchThread(data);
        }
      }
    );

    // Fires when the user taps a notification — navigate to the relevant screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data as NotificationData | undefined;
        if (!data?.type) return;

        if (data.type === "permission") {
          router.push("/new-navbar/(tabs)/permissions");
        } else if (data.type === "task_complete" && data.sessionId) {
          const thread = await findThreadById(data.sessionId);
          if (thread) {
            router.push({
              pathname: "/new-navbar/chat",
              params: {
                serverUrl: thread.serverUrl,
                sessionId: thread.grassId,
                repoName: thread.repo,
                repoPath: thread.repoPath,
                agent: thread.tool,
              },
            });
          } else {
            router.push("/new-navbar/(tabs)");
          }
        } else if (data.type === "container_ready" || data.type === "limit_exceeded") {
          router.replace("/new-navbar/(tabs)");
        } else if (data.type === "dispatch_complete") {
          await saveDispatchThread(data);
          if (data.serverUrl) {
            router.push({
              pathname: "/new-navbar/chat",
              params: {
                serverUrl: data.serverUrl,
                repoName: data.repo,
                repoPath: data.repoPath,
                agent: data.tool || "claude-code",
                ...(data.sessionId
                  ? { sessionId: data.sessionId }
                  : { resumeLatestForRepo: "1" }),
              },
            });
          } else {
            router.push("/new-navbar/(tabs)");
          }
        }
      }
    );

    return () => {
      cancelled = true;
      appStateListener.remove();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);
}
