import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { getToken } from "@/store/auth-store";
import { registerPushToken } from "@/api/notifications";

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
      shouldShowList: true,
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

export function usePushNotifications() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    let cancelled = false;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (!token || cancelled) return;

      // Only register with the server if the token has changed
      const cached = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (cached === token) return;

      const authToken = await getToken();
      if (!authToken || cancelled) return;

      const platform = Platform.OS === "ios" ? "ios" : "android";
      const result = await registerPushToken(token, platform, authToken);
      if (result.ok) {
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      }
    })();

    // Fires when a notification is received while the app is in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[Push] received:", notification.request.content);
      }
    );

    // Fires when the user taps a notification — navigate to the relevant screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationData | undefined;
        if (!data?.type) return;

        if (data.type === "permission") {
          router.push("/(tabs)/perms");
        } else if (data.type === "task_complete" && data.sessionId) {
          router.push({
            pathname: "/chat",
            params: { sessionId: data.sessionId, ...(data.serverId ? { serverId: data.serverId } : {}) },
          });
        } else if (data.type === "container_ready" || data.type === "limit_exceeded") {
          router.replace("/(tabs)/home");
        }
      }
    );

    return () => {
      cancelled = true;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);
}
