import { Alert } from "@/utils/alert";

let lastSandboxUsageAlertAt = 0;
const DEBOUNCE_MS = 6000;

/** One alert per burst (Strict Mode double effects + overlapping call sites). */
export function alertSandboxUsageLimitOnce(
  message: string,
  title = "VM Monthly Usage Limit Reached",
): void {
  const now = Date.now();
  if (now - lastSandboxUsageAlertAt < DEBOUNCE_MS) return;
  lastSandboxUsageAlertAt = now;
  Alert.alert(title, message);
}

export function resetSandboxUsageLimitAlertDebounce(): void {
  lastSandboxUsageAlertAt = 0;
}
