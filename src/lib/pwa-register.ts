import { registerSW } from 'virtual:pwa-register';
import { markNeedsRefresh, setUpdateActivator } from '@/stores/install';

/**
 * Wire the virtual:pwa-register lifecycle into our Nano Stores.
 *
 * Called once from a module <script> in BaseLayout.astro. Keeping this
 * in its own file (rather than inlining in the layout) gives us a typed
 * import path and a unit-test seam if needed in the future.
 *
 * - onNeedRefresh: a new SW is installed and waiting; flip $needsRefresh
 *   so UpdateToast renders.
 * - onOfflineReady: the app is now offline-capable. No extra UI needed —
 *   OfflineBanner already handles the online/offline transition.
 * - updateSW(true): call this to skip-waiting, activate the new SW,
 *   and reload the page in one step.
 */
export function initPwaRegister(): void {
  const updateSW = registerSW({
    onNeedRefresh() {
      markNeedsRefresh();
    },
    onOfflineReady() {
      // Intentionally no-op — OfflineBanner covers the offline state.
    },
  });

  // Capture the activator so the UpdateToast button can trigger it later.
  setUpdateActivator(async () => {
    await updateSW(true);
  });
}

// Type declaration for the virtual module provided by @vite-pwa/astro.
// This module doesn't ship its own .d.ts, so we inline the minimal shape
// that this file depends on.
declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (sw: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }
  export function registerSW(opts?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}
