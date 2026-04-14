import { AppState } from "react-native";

/**
 * Calls `callback` every time the app comes back to the foreground.
 * Returns a cleanup function.
 */
export function onAppForeground(callback: () => void): () => void {
  const subscription = AppState.addEventListener("change", (nextState) => {
    if (nextState === "active") callback();
  });
  return () => subscription.remove();
}
