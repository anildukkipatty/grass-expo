import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_VISIBLE_MS = 300;

/**
 * Drives a RefreshControl from a single source of truth that is decoupled from
 * any background loading state. Use only for the user-initiated pull gesture.
 *
 *   const { refreshing, onRefresh } = usePullToRefresh(fetchSessions);
 *   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
 *
 * - Coalesces concurrent pulls (a second pull while one is in flight is ignored).
 * - Guarantees the spinner is dismissed on the next animation frame after the
 *   work resolves, even if the underlying function throws.
 * - Enforces a minimum visible time so the spinner never flashes and never
 *   races the user's finger-up event.
 */
export function usePullToRefresh(fn: () => Promise<unknown> | unknown) {
  const [refreshing, setRefreshing] = useState(false);
  const inFlight = useRef(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  const onRefresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    const start = Date.now();
    try {
      await fn();
    } catch {
      // swallow — the underlying fetch is responsible for surfacing errors
    }
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - start));
    dismissTimer.current = setTimeout(() => {
      requestAnimationFrame(() => {
        if (mounted.current) setRefreshing(false);
        inFlight.current = false;
      });
    }, wait);
  }, [fn]);

  return { refreshing, onRefresh };
}
