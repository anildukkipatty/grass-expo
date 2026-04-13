import { Clipboard, Platform } from "react-native";

/**
 * Read plain text from the system clipboard. On web, uses the async Clipboard API
 * (RN's Clipboard.getString is not wired for react-native-web).
 */
export async function readClipboardText(): Promise<string> {
  if (Platform.OS === "web") {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        return typeof text === "string" ? text : "";
      }
    } catch {
      /* permission denied or unsupported */
    }
    return "";
  }

  return Clipboard.getString();
}
