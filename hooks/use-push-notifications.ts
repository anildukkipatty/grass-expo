import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { getToken } from "@/store/auth-store";
import { registerPushToken } from "@/api/notifications";
import { findThreadById } from "@/store/thread-store";

type NotificationData = {
  type: "permission" | "task_complete" | "container_ready" | "limit_exceeded";
  sessionId?: string;
  serverId?: string;
};

const PUSH_TOKEN_KEY = "expo_push_token";
const EAS_PROJECT_ID = "5f83639c-9362-4793-86cd-31ab41f09788";

// Show notifications only when the app is in the background.
// If the app is active (foreground), suppress the banner — the user is already in the app.
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const isActive = AppState.currentState === "active";
    return {
      shouldShowAlert: !isActive,
      shouldPlaySound: !isActive,
      shouldSetBadge: false,
      shouldShowBanner: !isActive,
      shouldShowList: !isActive,
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

export function usePushNotifications() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const appStateListener = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        Notifications.dismissAllNotificationsAsync();
      }
    });

    let cancelled = false;

    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (!token || cancelled) return;

        const cached = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
        if (cached === token) return;

        const authToken = await getToken();
        if (!authToken || cancelled) return;

        const platform = Platform.OS === "ios" ? "ios" : "android";
        const result = await registerPushToken(token, platform, authToken);
        if (result.ok) {
          await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        }
      } catch (_err) {}
    })();

    // Fires when a notification is received while the app is in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[Push] received:", notification.request.content);
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
