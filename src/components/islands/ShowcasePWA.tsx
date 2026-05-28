import { $installPrompt, $needsRefresh, markNeedsRefresh, setUpdateActivator } from '@/stores/install';
import ErrorBoundary from './ErrorBoundary';

/**
 * Showcase demo for the PWA install + update prompt components.
 *
 * Because `beforeinstallprompt` only fires in Chromium, and a real SW update
 * only happens after deployment, we expose simulation buttons here so the
 * showcase can demonstrate both UIs in any browser / dev environment.
 *
 * This component intentionally does NOT use the real InstallButton /
 * UpdateToast islands (those are global singletons in BaseLayout). Instead it
 * renders inline simulated versions so the showcase section is self-contained.
 */
export default function ShowcasePWA() {
  function simulateInstallPrompt() {
    // Set a fake BeforeInstallPromptEvent-shaped object so InstallButton renders.
    // The real event is only available in Chromium, so we cast to satisfy the store type.
    const fake = {
      type: 'beforeinstallprompt',
      preventDefault: () => {},
      platforms: ['web'],
      userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
      prompt: async () => {},
      // Event base members (minimal)
      bubbles: false,
      cancelBubble: false,
      cancelable: false,
      composed: false,
      currentTarget: null,
      defaultPrevented: true,
      eventPhase: 0,
      isTrusted: false,
      returnValue: true,
      srcElement: null,
      target: null,
      timeStamp: Date.now(),
      composedPath: () => [],
      initEvent: () => {},
      stopImmediatePropagation: () => {},
      stopPropagation: () => {},
      AT_TARGET: 2,
      BUBBLING_PHASE: 3,
      CAPTURING_PHASE: 1,
      NONE: 0,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as unknown as BeforeInstallPromptEvent;
    $installPrompt.set(fake);
  }

  function simulateUpdate() {
    // Wire a no-op activator so activateUpdate() doesn't fall back to reload.
    setUpdateActivator(async () => {
      $needsRefresh.set(false);
    });
    markNeedsRefresh();
  }

  function clearAll() {
    $installPrompt.set(null);
    $needsRefresh.set(false);
  }

  return (
    <ErrorBoundary name="ShowcasePWA">
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Simulate the global PWA signals. The install button and update toast
        are mounted in BaseLayout — trigger them here to see them appear.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={simulateInstallPrompt}
          className="rounded-md border border-border bg-secondary text-secondary-foreground px-3 py-1.5 text-sm hover:bg-secondary/80"
        >
          Simulate install prompt
        </button>
        <button
          type="button"
          onClick={simulateUpdate}
          className="rounded-md border border-border bg-secondary text-secondary-foreground px-3 py-1.5 text-sm hover:bg-secondary/80"
        >
          Simulate SW update
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-md border border-border bg-muted text-muted-foreground px-3 py-1.5 text-sm hover:bg-muted/80"
        >
          Clear both
        </button>
      </div>
    </div>
    </ErrorBoundary>
  );
}
