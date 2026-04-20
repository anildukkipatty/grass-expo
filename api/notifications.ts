import { apiRequest } from "./client";

export function registerPushToken(
  token: string,
  platform: "ios" | "android",
  authToken: string
) {
  return apiRequest("/notifications/token", {
    method: "POST",
    body: { token, platform },
    token: authToken,
  });
}

export function removePushToken(token: string, authToken: string) {
  return apiRequest("/notifications/token", {
    method: "DELETE",
    body: { token },
    token: authToken,
  });
}
