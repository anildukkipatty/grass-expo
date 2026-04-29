/** Fired from container-setup right before returning to tabs so NavbarProvider can sync vmRunning. */
type GrassVmReadyListener = () => void;

let grassVmReadyListener: GrassVmReadyListener | null = null;

/** Briefly block auto-navigation back to setup so edge health can catch up after provision. */
let suppressSetupNavUntil = 0;

export function setGrassVmReadyListener(fn: GrassVmReadyListener | null): void {
  grassVmReadyListener = fn;
}

export function notifyGrassVmReady(): void {
  grassVmReadyListener?.();
  suppressSetupNavUntil = Date.now() + 5000;
}

export function isGrassSetupNavigationSuppressed(): boolean {
  return Date.now() < suppressSetupNavUntil;
}

/** Fired from container-setup when sandbox usage limit is hit so tabs can block GrassVM-only flows. */
type GrassUsageLimitListener = () => void;

let grassUsageLimitListener: GrassUsageLimitListener | null = null;

/** Set when notify runs while tabs provider is not mounted (e.g. limit hit on container-setup). */
let pendingGrassUsageLimitHit = false;

export function setGrassUsageLimitListener(fn: GrassUsageLimitListener | null): void {
  grassUsageLimitListener = fn;
}

export function notifyGrassSandboxUsageLimitHit(): void {
  if (grassUsageLimitListener) {
    grassUsageLimitListener();
  } else {
    pendingGrassUsageLimitHit = true;
  }
}

export function consumePendingGrassUsageLimitHit(): boolean {
  if (!pendingGrassUsageLimitHit) return false;
  pendingGrassUsageLimitHit = false;
  return true;
}

export function clearPendingGrassUsageLimitHit(): void {
  pendingGrassUsageLimitHit = false;
}
