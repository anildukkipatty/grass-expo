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
