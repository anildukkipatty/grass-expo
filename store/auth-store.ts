import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// Called when any API request receives a 401 Unauthorized response.
// Register a handler in the app root to perform sign-out navigation.
let _authErrorHandler: (() => void) | null = null;

export function setAuthErrorHandler(handler: () => void) {
  _authErrorHandler = handler;
}

export function triggerAuthError() {
  _authErrorHandler?.();
}

export type AuthUser = {
  id: string;
  email: string;
  userType: "new" | "old";
};

export async function saveAuth(token: string, user: AuthUser) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearAuth() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
