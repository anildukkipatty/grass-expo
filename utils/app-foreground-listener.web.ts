/**
 * Web implementation: calls `callback` when the browser tab becomes visible.
 * Returns a cleanup function.
 */
export function onAppForeground(callback: () => void): () => void {
  const handler = () => {
    if (document.visibilityState === "visible") callback();
  };
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}
